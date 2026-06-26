import { DifficultyProfile } from "./progression";
import { ReviewWord, VocabularyItem } from "./validation";

interface PromptArguments {
  dayNumber: number;
  level: string;
  topic: string;
  scenario: string;
  grammarFocus: string[];
  vocabularyTheme: string | null;
  telcSkill: string | null;
  profile: DifficultyProfile;
  reviewWords: ReviewWord[];
}

interface EnrichmentPromptArguments {
  dayNumber: number;
  level: string;
  topic: string;
  vocabulary: VocabularyItem[];
}

/**
 * Builds the system and user prompts for Groq lesson generation.
 */
export function buildLessonPrompt(args: PromptArguments) {
  const systemPrompt = `You are an expert, highly precise German tutor helping an English speaker prepare for the telc Deutsch B1 exam as fast as realistically possible.
Your style is story-based, practical, encouraging, and highly engaging.

Generate one daily German lesson as a single, strict JSON object. Do not include any explanation outside the JSON object. Do not include markdown code block formatting (like \`\`\`json) in your raw response. Your response must be parseable by JSON.parse.

Follow these strict rules for grammar, syntax, and pedagogical pacing:
1. Target CEFR Level: ${args.profile.level} (Focusing on ${args.topic}).
2. Sentence Length: ${args.profile.sentenceLengthGuidance}
3. Grammar Complexity: ${args.profile.grammarComplexity}
4. Vocabulary Focus: ${args.profile.vocabularyComplexity}
5. Lesson Length: ${args.profile.outputLengthTarget}
6. Allowed Grammar Structures: ${args.profile.allowedGrammar.join(", ")}
7. Forbidden/Discouraged Grammar (DO NOT USE THESE): ${args.profile.forbiddenGrammar.join(", ")}

Vocabulary Rules:
- You must generate between 5 and 18 vocabulary items based closely on today's story/text.
- Every vocabulary item must be structured as a JSON object containing: "german", "article", "plural", "english", "exampleGerman", "exampleEnglish".
- GENDER/ARTICLE RULE: Nouns must use one of "der", "die", or "das" in their "article" field. For non-nouns (verbs, adjectives, adverbs, prepositions, etc.), you must set the article strictly to "—" (an em-dash character).
- "plural" must contain the plural form of the noun (with article, e.g., "die Supermärkte"). For non-nouns, set it to "" or null.
- "exampleGerman" must be a natural, complete German sentence using the word.
- "exampleEnglish" must be the exact English translation of that example sentence (word-for-word, not paraphrased).

Urdu Grammar Notes Rule:
- Inside the "grammarFocus" object, include a "urduGrammarNote" field.
- Write 2–3 sentences in English explaining how this German grammar concept compares to Urdu (Nastaliq speakers). Reference specific Urdu grammatical terms where applicable (e.g., izafat, postpositions vs. prepositions, SOV word order, verb-final placement, case marking via postpositions like کو / نے, etc.).
- This note is specifically to help an Urdu-native speaker build a mental bridge to German grammar.

Opening Story Rules:
- "storyGerman" must be a substantial, engaging story or realistic dialogue (10–14 sentences) — not a short paragraph. It should paint a vivid scene, include character interaction, and naturally weave in today's vocabulary. Bold all key vocabulary from today's lesson using **word** markdown syntax.
- "translationEnglish" must be the exact line-by-line English translation of storyGerman.

Closing Story Rules:
- At the end of the lesson, include a "closingStory" object with two fields: "storyGerman" and "storyEnglish".
- "storyGerman": Write a rich, immersive story (8–12 sentences) in German that naturally uses many of today's vocabulary words. The story should be different from the opening story — different scene, different characters. Bold all key vocabulary using **word** markdown syntax.
- "storyEnglish": Provide the exact English translation of the closing story, also bolding the translated vocabulary words using **word** markdown syntax.
- The story should be engaging, set in a realistic German-speaking context, and appropriate for the day's CEFR level.

Grammar Explanation Rules:
- "explanationEnglish" must be at least 3–5 sentences. Explain the rule clearly, give context for when it is used, and mention common mistakes to avoid.

telc Tip Rules:
- "telcTip" must be at least 3–4 sentences covering a concrete, actionable strategy for the exam (not just a single generic sentence).

Daily Challenge Rules:
- "dailyChallenge" must describe a specific, multi-step task the learner can do today (e.g. write 3 sentences, record yourself, or find and translate a paragraph). At least 2–3 sentences.

Spaced Repetition Review Rules:
- The "reviewWords" array must contain exactly the 5 words provided in the prompt.
- For each review word, map it directly as an object with "german", "article", and "english" keys.

Exercise Rules:
- Provide 3 to 5 short exercises.
- Exercise types can be: "fill_blank", "translation", "multiple_choice", "word_order", or "question_answer".
- Include clear question and correct answer keys. Always place answers at the bottom of the JSON so they can be parsed.`;


  const reviewWordsContext = args.reviewWords.length > 0
    ? args.reviewWords.map(w => `- ${w.german} (${w.article}): ${w.english}`).join("\n")
    : "No review words today. (Return empty array)";

  const userPrompt = `Generate the lesson for Day ${args.dayNumber}.
  
Topic: ${args.topic}
Scenario: ${args.scenario}
CEFR Target Level: ${args.level}
Grammar to highlight: ${args.grammarFocus.join(", ")}
Vocabulary theme: ${args.vocabularyTheme || "daily situation"}
telc Skill focus: ${args.telcSkill || "general"}

Review Words for Spaced Repetition (You must include these EXACTLY 5 words inside the "reviewWords" array):
${reviewWordsContext}

You must return a single JSON object matching this exact TypeScript shape. Make sure all strings are properly escaped.

interface Response {
  subject: string; // E.g., "Day ${args.dayNumber} German: ${args.topic}"
  motivation: string; // Encouraging note in English from the tutor (2-3 sentences)
  day: number; // ${args.dayNumber}
  level: string; // "${args.level}"
  topic: string; // "${args.topic}"
  storyGerman: string; // Story or dialogue in German. Bold important phrases like: "Das ist **wichtig**."
  translationEnglish: string; // Exact English translation of the story/dialogue
  vocabulary: Array<{
    german: string; // Word without article (e.g., "Supermarkt" or "einkaufen")
    article: "der" | "die" | "das" | "—"; // Nouns MUST be "der", "die", or "das". Verbs/others MUST be "—".
    plural: string; // E.g., "die Supermärkte" for nouns, or "" for non-nouns
    english: string; // English meaning
    exampleGerman: string; // A complete, natural German sentence using this term
    exampleEnglish: string; // Exact English translation of exampleGerman (word-for-word)
  }>;
  grammarFocus: {
    title: string;
    explanationEnglish: string; // Simple, practical explanation in English
    urduGrammarNote: string; // 2-3 sentences in English comparing this German grammar rule to Urdu grammar (postpositions, SOV order, verb-final, case markers like کو/نے, etc.) to help an Urdu-native speaker understand the concept
    examples: Array<{
      german: string;
      english: string;
    }>;
  };
  exercises: Array<{
    type: "fill_blank" | "translation" | "multiple_choice" | "word_order" | "question_answer";
    question: string;
    answer: string; // Correct answer
  }>;
  telcTip: string; // 3-4 sentence concrete exam strategy tip related to B1 (reading, writing, speaking, or listening)
  dailyChallenge: string; // A specific, multi-step practical homework challenge (2-3 sentences describing what to do)
  reviewWords: Array<{
    german: string;
    article: "der" | "die" | "das" | "—";
    english: string;
  }>;
  closingStory: {
    storyGerman: string; // 8-12 sentence story in German using today's vocabulary. Bold key words with **word**.
    storyEnglish: string; // Exact English translation of storyGerman. Bold translated key words with **word**.
  };
}

Remember: Return strict JSON only. Do not wrap in markdown \`\`\` json blocks.`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds the system and user prompts for the second, enrichment-focused LLM call.
 * This generates: tipsAndTricks, pronunciationGuide (per vocab word), and pronunciationSection.
 */
export function buildEnrichmentPrompt(args: EnrichmentPromptArguments) {
  const vocabList = args.vocabulary
    .map((v) => `- ${v.german} (${v.article !== "—" ? v.article + " " : ""}${v.english})`)
    .join("\n");

  const systemPrompt = `You are an expert German pronunciation coach and pedagogy specialist helping an English/Urdu-speaking adult prepare for the telc Deutsch B1 exam.
Your job is to generate a JSON enrichment object for today's German lesson. Focus on pronunciation accuracy, memorable learning tips, and Urdu speaker insights.
Return ONLY a valid JSON object — no markdown, no extra text, no code blocks.`;

  const userPrompt = `Generate pronunciation and learning enrichment for this German B1 lesson.

Day: ${args.dayNumber}
Level: ${args.level}
Topic: ${args.topic}

Today's vocabulary:
${vocabList}

Return a single JSON object with this exact shape:

interface Enrichment {
  tipsAndTricks: Array<{
    title: string;           // Short title for the tip (e.g. "Der/Die/Das Trick")
    tip: string;             // Detailed explanation — at least 3–4 sentences. Be concrete and specific.
    category: "memory" | "grammar" | "speaking" | "writing" | "listening" | "exam" | "culture";
  }>; // Provide 5 to 7 tips covering different categories

  pronunciationGuide: Array<{
    german: string;              // The German word (must match one of today's vocab words above)
    phonetic: string;            // IPA or simple phonetic approximation (e.g. "ZOO-per-markt")
    soundTip: string;            // 2-3 sentences: explain the tricky sounds, mouth position, common mistakes
    urduApproximation: string;   // How an Urdu speaker can approximate this using Urdu sounds (e.g. "Like saying 'سوپر مارکٹ' but with a short 'oo'")
  }>; // Provide a guide entry for EVERY vocabulary word above

  pronunciationSection: {
    focusSounds: string;         // 1-2 sentences: which German sounds appear most in today's lesson
    rules: Array<{
      sound: string;             // The German letter(s) or combination (e.g. "ch", "ü", "ei", "ß")
      description: string;       // 2-3 sentences explaining how to produce this sound
      examples: string[];        // 2-4 example words containing this sound
      urduNote: string;          // How an Urdu speaker should think about this sound
    }>; // At least 3 rules based on sounds in today's vocabulary
    practicePhrase: string;      // A German tongue-twister or practice phrase featuring today's sounds
    practicePhraseTranslation: string; // English translation of the practice phrase
  };
}

Remember: Return strict JSON only. Do not wrap in markdown \`\`\` json blocks.`;

  return { systemPrompt, userPrompt };
}
