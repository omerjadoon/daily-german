import { sql } from "./db";
import { getCurrentDayNumber } from "./dates";
import { getTopicForDay, generateFallbackLesson } from "./curriculum";
import { getDifficultyProfile } from "./progression";
import { getReviewWords, calculateNextReviewDate } from "./reviewWords";
import { validateLesson, Lesson, VocabularyItem } from "./validation";
import { generateContent } from "./groq";
import { buildLessonPrompt } from "./lessonPrompt";
import { generateHtmlEmail, generateTextEmail } from "./emailTemplate";
import { sendTutorEmail } from "./resend";

const defaultRecipient = process.env.EMAIL_TO || "omerkhanjadoons@gmail.com";

/**
 * Log an operational event into the database
 */
export async function logEvent(
  eventType: string,
  dayNumber: number | null,
  message: string,
  metadata: any = null
): Promise<void> {
  try {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    await sql`
      INSERT INTO lesson_events (event_type, day_number, message, metadata)
      VALUES (${eventType}, ${dayNumber}, ${message}, ${metaJson})
    `;
    console.log(`[Event Logged - ${eventType}] Day ${dayNumber}: ${message}`);
  } catch (err) {
    console.error("Failed to log operational event in Supabase:", err);
  }
}

/**
 * Retrieves a generated lesson from the database, or generates one via Groq,
 * validates it, performs retries/repairs, and registers vocabulary items.
 */
export async function getOrGenerateLesson(dayNumber: number): Promise<Lesson> {
  const topic = getTopicForDay(dayNumber);
  const profile = getDifficultyProfile(dayNumber);

  // 1. Check if lesson already exists in generated_lessons
  try {
    const existing = await sql<any[]>`
      SELECT lesson_json FROM generated_lessons
      WHERE day_number = ${dayNumber}
      LIMIT 1
    `;
    if (existing.length > 0) {
      console.log(`Reusing cached generated lesson for day ${dayNumber}.`);
      return existing[0].lesson_json as Lesson;
    }
  } catch (err) {
    console.error("Error checking generated lessons table:", err);
  }

  await logEvent("lesson_generation_started", dayNumber, `Generating lesson for day ${dayNumber} using topic: ${topic.topic}`);

  // 2. Fetch spaced repetition review words (5 words)
  const reviewWords = await getReviewWords(dayNumber);
  
  // 3. Assemble prompt
  const { systemPrompt, userPrompt } = buildLessonPrompt({
    dayNumber,
    level: topic.level,
    topic: topic.topic,
    scenario: topic.scenario,
    grammarFocus: topic.grammarFocus,
    vocabularyTheme: topic.vocabularyTheme,
    telcSkill: topic.telcSkill,
    profile,
    reviewWords,
  });

  let rawLlmOutput = "";
  let finalLesson: Lesson | null = null;
  let attemptError: any = null;

  // 4. Generate lesson from Groq
  try {
    rawLlmOutput = await generateContent({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.2,
    });

    const parsed = JSON.parse(rawLlmOutput);
    const validationResult = validateLesson(parsed);

    if (validationResult.success) {
      finalLesson = validationResult.data;
    } else {
      attemptError = validationResult.error.format();
      await logEvent("lesson_validation_failed", dayNumber, "Initial Groq output failed Zod schema checks.", attemptError);
    }
  } catch (err: any) {
    attemptError = err.message || err;
    await logEvent("lesson_generation_failed", dayNumber, "Initial Groq query threw an exception.", { error: attemptError });
  }

  // 5. Repair flow (Retry once with repair prompt if initial attempt failed)
  if (!finalLesson) {
    await logEvent("lesson_repair_started", dayNumber, "Initiating LLM repair cycle due to structure mismatch.");
    try {
      const repairUserPrompt = `Your previous output did not match the strict schema. Please generate the correct JSON object only.

Validation Errors encountered:
${JSON.stringify(attemptError, null, 2)}

Original Topic: ${topic.topic}
Spaced repetition words you must include:
${reviewWords.map(w => `- ${w.german} (${w.article}): ${w.english}`).join("\n")}

Respond ONLY with a valid, clean JSON object matching the requested Lesson interface.`;

      const repairedRaw = await generateContent({
        systemPrompt,
        userPrompt: repairUserPrompt,
        jsonMode: true,
        temperature: 0.1,
      });

      const parsedRepaired = JSON.parse(repairedRaw);
      const repairValResult = validateLesson(parsedRepaired);

      if (repairValResult.success) {
        finalLesson = repairValResult.data;
        await logEvent("lesson_repair_succeeded", dayNumber, "Repair successfully reconstructed correct schema.");
      } else {
        await logEvent("lesson_repair_failed", dayNumber, "Repair attempt failed Zod validation.", repairValResult.error.format());
      }
    } catch (repairErr: any) {
      await logEvent("lesson_repair_failed", dayNumber, "Repair attempt threw exception.", { error: repairErr.message || repairErr });
    }
  }

  // 6. Emergency Fallback Lesson
  if (!finalLesson) {
    console.warn(`Generative engine failed for day ${dayNumber}. Engaging emergency local fallback.`);
    finalLesson = generateFallbackLesson(dayNumber, topic, reviewWords);
    await logEvent("lesson_generation_failed", dayNumber, "Generative engine failed completely. Loaded local safety fallback.");
  } else {
    await logEvent("lesson_generation_succeeded", dayNumber, "Lesson successfully constructed and validated.");
  }

  // 7. Save generated lesson in Supabase
  try {
    // Insert curriculum topic just in case it wasn't seeded
    const dbTopic = await sql<any[]>`
      SELECT id FROM curriculum_topics WHERE day_number = ${dayNumber} LIMIT 1
    `;
    let topicId: number | null = dbTopic.length > 0 ? dbTopic[0].id : null;

    if (!topicId) {
      const insertedTopic = await sql<any[]>`
        INSERT INTO curriculum_topics (day_number, level, topic, scenario, grammar_focus, vocabulary_theme, telc_skill)
        VALUES (${dayNumber}, ${topic.level}, ${topic.topic}, ${topic.scenario}, ${topic.grammarFocus}, ${topic.vocabularyTheme}, ${topic.telcSkill})
        RETURNING id
      `;
      topicId = insertedTopic[0]?.id || null;
    }

    await sql`
      INSERT INTO generated_lessons (day_number, topic_id, lesson_json, model)
      VALUES (${dayNumber}, ${topicId}, ${JSON.stringify(finalLesson)}, ${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"})
      ON CONFLICT (day_number) DO UPDATE SET
        lesson_json = EXCLUDED.lesson_json,
        model = EXCLUDED.model,
        updated_at = now()
    `;

    // 8. Extract and save new vocabulary items to DB
    for (const v of finalLesson.vocabulary) {
      // Upsert based on german word in vocabulary list
      const nextReview = calculateNextReviewDate(0); // Day 1 (+1 day) schedule for new words
      await sql`
        INSERT INTO vocabulary_items (
          day_number, german, article, plural, english, example_german, next_review_at
        ) VALUES (
          ${dayNumber}, ${v.german}, ${v.article}, ${v.plural || ""}, ${v.english}, ${v.exampleGerman}, ${nextReview}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  } catch (dbErr) {
    console.error("Failed to commit generated lesson details to Supabase database:", dbErr);
  }

  return finalLesson;
}

/**
 * Main scheduled service. Resolves today's day number, checks duplicate send logs,
 * generates/fetches lesson, sends email via Resend, and records success logs.
 */
export async function sendDailyLesson(): Promise<{ alreadySent: boolean; dayNumber: number; lesson?: Lesson; messageId?: string }> {
  const dayNumber = getCurrentDayNumber();
  const emailTo = defaultRecipient;

  // 1. Check duplicate prevention
  try {
    const alreadySent = await sql<any[]>`
      SELECT id FROM sent_lessons
      WHERE day_number = ${dayNumber} AND email_to = ${emailTo} AND status = 'sent'
      LIMIT 1
    `;
    if (alreadySent.length > 0) {
      await logEvent(
        "duplicate_send_prevented",
        dayNumber,
        `Duplicate email prevented for ${emailTo} on day ${dayNumber}.`
      );
      return { alreadySent: true, dayNumber };
    }
  } catch (err) {
    console.error("Duplicate send verification query failed:", err);
  }

  await logEvent("email_send_started", dayNumber, `Initiating daily tutor send to ${emailTo}.`);

  // 2. Fetch or create lesson content
  const lesson = await getOrGenerateLesson(dayNumber);

  // 3. Render and deliver email
  try {
    const html = generateHtmlEmail(lesson);
    const text = generateTextEmail(lesson);
    const subject = lesson.subject;

    const messageId = await sendTutorEmail({
      to: emailTo,
      subject,
      html,
      text,
    });

    // 4. Save delivery record
    await sql`
      INSERT INTO sent_lessons (day_number, email_to, subject, topic, level, provider_message_id, status)
      VALUES (${dayNumber}, ${emailTo}, ${subject}, ${lesson.topic}, ${lesson.level}, ${messageId}, 'sent')
      ON CONFLICT (day_number, email_to) DO UPDATE SET
        provider_message_id = EXCLUDED.provider_message_id,
        status = 'sent',
        sent_at = now()
    `;

    await logEvent("email_send_succeeded", dayNumber, `Email dispatched successfully to ${emailTo}. Provider ID: ${messageId}`);
    return { alreadySent: false, dayNumber, lesson, messageId };
  } catch (sendErr: any) {
    await logEvent("email_send_failed", dayNumber, `Delivery failed to ${emailTo}. Error: ${sendErr.message || sendErr}`);
    throw sendErr;
  }
}

/**
 * Manually trigger todays daily lesson with full duplicate prevention check.
 */
export async function sendTodayManual(): Promise<{ alreadySent: boolean; dayNumber: number; lesson?: Lesson; messageId?: string }> {
  return sendDailyLesson();
}

/**
 * Dispatches a test send to target recipient for any curriculum day.
 * Does not check nor log under 'sent' status (status is 'test_sent'), preserving cron progression.
 */
export async function sendTestLesson(dayNumber: number, recipient = defaultRecipient): Promise<{ dayNumber: number; lesson: Lesson; messageId: string }> {
  const lesson = await getOrGenerateLesson(dayNumber);

  try {
    const html = generateHtmlEmail(lesson);
    const text = generateTextEmail(lesson);
    const subject = `[TEST] ${lesson.subject}`;

    const messageId = await sendTutorEmail({
      to: recipient,
      subject,
      html,
      text,
    });

    // Log the test dispatch with test_sent status, so it won't block scheduled cron execution
    await sql`
      INSERT INTO sent_lessons (day_number, email_to, subject, topic, level, provider_message_id, status)
      VALUES (${dayNumber}, ${recipient}, ${subject}, ${lesson.topic}, ${lesson.level}, ${messageId}, 'test_sent')
      ON CONFLICT (day_number, email_to) DO UPDATE SET
        provider_message_id = EXCLUDED.provider_message_id,
        status = 'test_sent',
        sent_at = now()
    `;

    await logEvent("email_send_succeeded", dayNumber, `Test email dispatched to ${recipient}.`);
    return { dayNumber, lesson, messageId };
  } catch (error: any) {
    await logEvent("email_send_failed", dayNumber, `Test delivery failed to ${recipient}. Error: ${error.message || error}`);
    throw error;
  }
}

/**
 * Retrieves today's operational summaries.
 */
export async function getLessonStatus(): Promise<{
  dayNumber: number;
  topic: string;
  level: string;
  isGenerated: boolean;
  isSent: boolean;
}> {
  const dayNumber = getCurrentDayNumber();
  const topic = getTopicForDay(dayNumber);
  const emailTo = defaultRecipient;

  let isGenerated = false;
  let isSent = false;

  try {
    const existingGen = await sql`
      SELECT 1 FROM generated_lessons WHERE day_number = ${dayNumber} LIMIT 1
    `;
    isGenerated = existingGen.length > 0;

    const existingSent = await sql`
      SELECT 1 FROM sent_lessons 
      WHERE day_number = ${dayNumber} AND email_to = ${emailTo} AND status = 'sent' 
      LIMIT 1
    `;
    isSent = existingSent.length > 0;
  } catch (err) {
    console.error("Failed to query lesson status from Supabase:", err);
  }

  return {
    dayNumber,
    topic: topic.topic,
    level: topic.level,
    isGenerated,
    isSent,
  };
}

/**
 * Pulls the last 10 sent email records
 */
export async function getRecentLessons() {
  try {
    return await sql`
      SELECT day_number, email_to, subject, topic, level, sent_at, status
      FROM sent_lessons
      ORDER BY sent_at DESC, day_number DESC
      LIMIT 10
    `;
  } catch (err) {
    console.error("Failed to pull recent lessons:", err);
    return [];
  }
}

/**
 * Pulls the most recently stored vocabulary words
 */
export async function getRecentVocabulary() {
  try {
    return await sql`
      SELECT id, day_number, german, article, plural, english, example_german, review_count, next_review_at
      FROM vocabulary_items
      ORDER BY created_at DESC, id DESC
      LIMIT 30
    `;
  } catch (err) {
    console.error("Failed to pull recent vocabulary items:", err);
    return [];
  }
}
