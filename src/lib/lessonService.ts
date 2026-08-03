import { sql } from "./db";
import { getCurrentDayNumber } from "./dates";
import { getTopicForDay, generateFallbackLesson } from "./curriculum";
import { getDifficultyProfile } from "./progression";
import { getReviewWords, calculateNextReviewDate } from "./reviewWords";
import { validateLesson, Lesson, VocabularyItem, DailyLetter, validateDailyLetter } from "./validation";
import { generateContent } from "./groq";
import { buildLessonPrompt, buildEnrichmentPrompt, buildWordBankPrompt, buildLetterPrompt } from "./lessonPrompt";
import { generateHtmlEmail, generateTextEmail, generateLetterHtmlEmail, generateLetterTextEmail } from "./emailTemplate";
import { sendTutorEmail } from "./resend";
import { getGermanTtsBase64 } from "./ttsService";

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
  console.log(`[Event - ${eventType}] Day ${dayNumber}: ${message}`, metadata ? JSON.stringify(metadata, null, 2) : "");
  try {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    await sql`
      INSERT INTO lesson_events (event_type, day_number, message, metadata)
      VALUES (${eventType}, ${dayNumber}, ${message}, ${metaJson})
    `;
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
 * Makes a second LLM call to generate enrichment content (tips & tricks, pronunciation guide).
 * Merges the result into the provided lesson object. Never throws — fails silently.
 */
async function getEnrichmentForLesson(lesson: Lesson, dayNumber: number): Promise<Lesson> {
  try {
    await logEvent("enrichment_generation_started", dayNumber, "Generating pronunciation & tips enrichment via second LLM call.");

    const { systemPrompt, userPrompt } = buildEnrichmentPrompt({
      dayNumber,
      level: lesson.level,
      topic: lesson.topic,
      vocabulary: lesson.vocabulary,
    });

    const enrichmentRaw = await generateContent({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.3,
    });

    const enrichment = JSON.parse(enrichmentRaw);

    // Merge enrichment fields into the lesson
    if (Array.isArray(enrichment.tipsAndTricks) && enrichment.tipsAndTricks.length > 0) {
      lesson = { ...lesson, tipsAndTricks: enrichment.tipsAndTricks };
    }
    if (Array.isArray(enrichment.pronunciationGuide) && enrichment.pronunciationGuide.length > 0) {
      lesson = { ...lesson, pronunciationGuide: enrichment.pronunciationGuide };
    }
    if (enrichment.pronunciationSection && enrichment.pronunciationSection.rules) {
      lesson = { ...lesson, pronunciationSection: enrichment.pronunciationSection };
    }

    await logEvent("enrichment_generation_succeeded", dayNumber, "Enrichment merged into lesson successfully.");
  } catch (err: any) {
    await logEvent("enrichment_generation_failed", dayNumber, `Enrichment generation failed (non-fatal): ${err.message || err}`);
  }

  return lesson;
}

/**
 * Makes a third LLM call dedicated to generating the word bank:
 * 10 nouns (with der/die/das), 10 verbs, and 10 adjectives — unique per day.
 * Merges the result into the lesson. Never throws — fails silently.
 */
async function getWordBankForLesson(lesson: Lesson, dayNumber: number): Promise<Lesson> {
  try {
    await logEvent("word_bank_generation_started", dayNumber, "Generating word bank via dedicated LLM call.");

    const { systemPrompt, userPrompt } = buildWordBankPrompt({
      dayNumber,
      level: lesson.level,
      topic: lesson.topic,
    });

    const wordBankRaw = await generateContent({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.4,
    });

    const wordBank = JSON.parse(wordBankRaw);

    // Basic structural guard before merging
    if (
      Array.isArray(wordBank.nouns) && wordBank.nouns.length === 10 &&
      Array.isArray(wordBank.verbs) && wordBank.verbs.length === 10 &&
      Array.isArray(wordBank.adjectives) && wordBank.adjectives.length === 10
    ) {
      lesson = { ...lesson, wordBank };
      await logEvent("word_bank_generation_succeeded", dayNumber, "Word bank merged into lesson successfully.");
    } else {
      await logEvent("word_bank_generation_failed", dayNumber, "Word bank response did not match expected shape (10/10/10).", wordBank);
    }
  } catch (err: any) {
    await logEvent("word_bank_generation_failed", dayNumber, `Word bank generation failed (non-fatal): ${err.message || err}`);
  }

  return lesson;
}

/**
 * Makes a fourth LLM call to generate today's German letter practice email.
 * Generates a 150-200 word German letter + English translation + key phrases.
 * Caches the result in the daily_letters table. Never throws — fails silently.
 */
async function getLetterForDay(dayNumber: number, level: string): Promise<DailyLetter | null> {
  try {
    // Check cache
    try {
      const cached = await sql<any[]>`
        SELECT letter_json FROM daily_letters WHERE day_number = ${dayNumber} LIMIT 1
      `;
      if (cached.length > 0) {
        console.log(`Reusing cached letter for day ${dayNumber}.`);
        return cached[0].letter_json as DailyLetter;
      }
    } catch {
      // Table may not exist yet — continue to generate
    }

    await logEvent("letter_generation_started", dayNumber, "Generating daily letter via dedicated LLM call.");

    const { systemPrompt, userPrompt, letterTopic } = buildLetterPrompt({ dayNumber, level });

    const letterRaw = await generateContent({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.5,
    });

    const parsed = JSON.parse(letterRaw);
    const result = validateDailyLetter(parsed);

    if (!result.success) {
      await logEvent("letter_generation_failed", dayNumber, "Letter failed validation.", result.error.format());
      return null;
    }

    const letter = result.data;

    // Persist to daily_letters table (best-effort)
    try {
      await sql`
        INSERT INTO daily_letters (day_number, topic, letter_json)
        VALUES (${dayNumber}, ${letterTopic}, ${JSON.stringify(letter)})
        ON CONFLICT (day_number) DO UPDATE SET
          letter_json = EXCLUDED.letter_json,
          updated_at = now()
      `;
    } catch {
      // Table may not exist — non-fatal
    }

    await logEvent("letter_generation_succeeded", dayNumber, `Letter generated: "${letterTopic}"`);
    return letter;
  } catch (err: any) {
    await logEvent("letter_generation_failed", dayNumber, `Letter generation failed (non-fatal): ${err.message || err}`);
    return null;
  }
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
  let lesson = await getOrGenerateLesson(dayNumber);

  // 2a. Enrich lesson with pronunciation guide and tips (second LLM call)
  // Only enrich if the lesson doesn't already have enrichment data (e.g., freshly generated)
  if (!lesson.tipsAndTricks || lesson.tipsAndTricks.length === 0) {
    lesson = await getEnrichmentForLesson(lesson, dayNumber);
    // Persist the enriched lesson back to the database
    try {
      await sql`
        UPDATE generated_lessons
        SET lesson_json = ${JSON.stringify(lesson)}, updated_at = now()
        WHERE day_number = ${dayNumber}
      `;
    } catch (dbErr) {
      console.error("Failed to persist enriched lesson to DB:", dbErr);
    }
  }

  // 2b. Generate word bank: 10 nouns, 10 verbs, 10 adjectives (third LLM call)
  // Only generate if the lesson doesn't already have a word bank cached
  if (!lesson.wordBank) {
    lesson = await getWordBankForLesson(lesson, dayNumber);
    // Persist the word bank back to the database
    try {
      await sql`
        UPDATE generated_lessons
        SET lesson_json = ${JSON.stringify(lesson)}, updated_at = now()
        WHERE day_number = ${dayNumber}
      `;
    } catch (dbErr) {
      console.error("Failed to persist word bank lesson to DB:", dbErr);
    }
  }

  // 3. Render and deliver Email 1: Main lesson
  try {
    const html = generateHtmlEmail(lesson);
    const text = generateTextEmail(lesson);
    const subject = lesson.subject;

    // Generate TTS audio for the German story in parallel with email rendering (non-blocking)
    const storyAudioBase64 = await getGermanTtsBase64(lesson.storyGerman).catch(() => null);

    const messageId = await sendTutorEmail({
      to: emailTo,
      subject,
      html,
      text,
      attachments: storyAudioBase64
        ? [{ content: storyAudioBase64, filename: `day${dayNumber}_story.mp3`, contentType: "audio/mpeg" }]
        : [],
    });

    // 4. Save delivery record for main lesson (best-effort resilience)
    try {
      await sql`
        INSERT INTO sent_lessons (day_number, email_to, subject, topic, level, provider_message_id, status)
        VALUES (${dayNumber}, ${emailTo}, ${subject}, ${lesson.topic}, ${lesson.level}, ${messageId}, 'sent')
        ON CONFLICT (day_number, email_to) DO UPDATE SET
          provider_message_id = EXCLUDED.provider_message_id,
          status = 'sent',
          sent_at = now()
      `;
      await logEvent("email_send_succeeded", dayNumber, `Main lesson email dispatched to ${emailTo}. Audio: ${storyAudioBase64 ? 'attached' : 'unavailable'}. Provider ID: ${messageId}`);
    } catch (dbErr: any) {
      console.error("Failed to write to sent_lessons table:", dbErr);
      await logEvent("email_send_succeeded_db_failed", dayNumber, `Main lesson email dispatched to ${emailTo} but DB logging failed: ${dbErr.message || dbErr}`);
    }

    // 5. Generate & send Email 2: Daily Letter Practice with audio (non-blocking — fails silently)
    try {
      const letter = await getLetterForDay(dayNumber, lesson.level);
      if (letter) {
        const letterHtml = generateLetterHtmlEmail(letter, dayNumber);
        const letterText = generateLetterTextEmail(letter, dayNumber);
        const letterSubject = `Day ${dayNumber}: German Letter Practice — ${letter.register === "formal" ? "📝 Formal" : "💬 Informal"} | ${letter.topic.slice(0, 50)}`;

        // Generate TTS for letter text in parallel
        const letterAudioBase64 = await getGermanTtsBase64(letter.letterGerman).catch(() => null);

        const letterMsgId = await sendTutorEmail({
          to: emailTo,
          subject: letterSubject,
          html: letterHtml,
          text: letterText,
          attachments: letterAudioBase64
            ? [{ content: letterAudioBase64, filename: `day${dayNumber}_letter.mp3`, contentType: "audio/mpeg" }]
            : [],
        });
        await logEvent("letter_email_sent", dayNumber, `Letter email dispatched to ${emailTo}. Audio: ${letterAudioBase64 ? 'attached' : 'unavailable'}. Provider ID: ${letterMsgId}`);
      }
    } catch (letterErr: any) {
      await logEvent("letter_email_failed", dayNumber, `Letter email failed (non-fatal): ${letterErr.message || letterErr}`);
    }

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
  let lesson = await getOrGenerateLesson(dayNumber);

  // 2a. Enrich lesson with pronunciation guide and tips (second LLM call)
  if (!lesson.tipsAndTricks || lesson.tipsAndTricks.length === 0) {
    lesson = await getEnrichmentForLesson(lesson, dayNumber);
    try {
      await sql`
        UPDATE generated_lessons
        SET lesson_json = ${JSON.stringify(lesson)}, updated_at = now()
        WHERE day_number = ${dayNumber}
      `;
    } catch (dbErr) {
      console.error("Failed to persist enriched lesson to DB:", dbErr);
    }
  }

  // 2b. Generate word bank: 10 nouns, 10 verbs, 10 adjectives (third LLM call)
  if (!lesson.wordBank) {
    lesson = await getWordBankForLesson(lesson, dayNumber);
    try {
      await sql`
        UPDATE generated_lessons
        SET lesson_json = ${JSON.stringify(lesson)}, updated_at = now()
        WHERE day_number = ${dayNumber}
      `;
    } catch (dbErr) {
      console.error("Failed to persist word bank lesson to DB:", dbErr);
    }
  }

  try {
    const html = generateHtmlEmail(lesson);
    const text = generateTextEmail(lesson);
    const subject = `[TEST] ${lesson.subject}`;

    // Generate TTS audio for the German story (non-blocking)
    const storyAudioBase64 = await getGermanTtsBase64(lesson.storyGerman).catch(() => null);

    const messageId = await sendTutorEmail({
      to: recipient,
      subject,
      html,
      text,
      attachments: storyAudioBase64
        ? [{ content: storyAudioBase64, filename: `day${dayNumber}_story.mp3`, contentType: "audio/mpeg" }]
        : [],
    });

    // Log the test dispatch with test_sent status (best-effort resilience)
    try {
      await sql`
        INSERT INTO sent_lessons (day_number, email_to, subject, topic, level, provider_message_id, status)
        VALUES (${dayNumber}, ${recipient}, ${subject}, ${lesson.topic}, ${lesson.level}, ${messageId}, 'test_sent')
        ON CONFLICT (day_number, email_to) DO UPDATE SET
          provider_message_id = EXCLUDED.provider_message_id,
          status = 'test_sent',
          sent_at = now()
      `;
      await logEvent("email_send_succeeded", dayNumber, `Test email dispatched to ${recipient}. Audio: ${storyAudioBase64 ? 'attached' : 'unavailable'}.`);
    } catch (dbErr: any) {
      console.error("Failed to write test send to sent_lessons table:", dbErr);
      await logEvent("email_send_succeeded_db_failed", dayNumber, `Test email dispatched to ${recipient} but DB logging failed: ${dbErr.message || dbErr}`);
    }

    // Generate & send Email 2: Daily Letter Practice with audio (non-blocking — fails silently)
    try {
      const letter = await getLetterForDay(dayNumber, lesson.level);
      if (letter) {
        const letterHtml = generateLetterHtmlEmail(letter, dayNumber);
        const letterText = generateLetterTextEmail(letter, dayNumber);
        const letterSubject = `[TEST] Day ${dayNumber}: German Letter Practice — ${letter.register === "formal" ? "📝 Formal" : "💬 Informal"} | ${letter.topic.slice(0, 50)}`;

        const letterAudioBase64 = await getGermanTtsBase64(letter.letterGerman).catch(() => null);

        const letterMsgId = await sendTutorEmail({
          to: recipient,
          subject: letterSubject,
          html: letterHtml,
          text: letterText,
          attachments: letterAudioBase64
            ? [{ content: letterAudioBase64, filename: `day${dayNumber}_letter.mp3`, contentType: "audio/mpeg" }]
            : [],
        });
        await logEvent("letter_email_sent", dayNumber, `Test letter email dispatched to ${recipient}. Audio: ${letterAudioBase64 ? 'attached' : 'unavailable'}. Provider ID: ${letterMsgId}`);
      }
    } catch (letterErr: any) {
      await logEvent("letter_email_failed", dayNumber, `Test letter email failed (non-fatal): ${letterErr.message || letterErr}`);
    }

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
