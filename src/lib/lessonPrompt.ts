import { DifficultyProfile } from "./progression";
import { ReviewWord } from "./validation";

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
- You must generate between 10 and 18 vocabulary items based closely on today's story/text.
- Every vocabulary item must be structured as a JSON object containing: "german", "article", "plural", "english", "exampleGerman".
- GENDER/ARTICLE RULE: Nouns must use one of "der", "die", or "das" in their "article" field. For non-nouns (verbs, adjectives, adverbs, prepositions, etc.), you must set the article strictly to "—" (an em-dash character).
- "plural" must contain the plural form of the noun (with article, e.g., "die Supermärkte"). For non-nouns, set it to "" or null.

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
    exampleGerman: string; // Example sentence using this term
  }>;
  grammarFocus: {
    title: string;
    explanationEnglish: string; // Simple, practical explanation in English
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
  telcTip: string; // A brief exam tip (reading, writing, speaking, or listening) related to B1
  dailyChallenge: string; // A practical mini homework challenge (e.g. "Say this out loud 5 times")
  reviewWords: Array<{
    german: string;
    article: "der" | "die" | "das" | "—";
    english: string;
  }>;
}

Remember: Return strict JSON only. Do not wrap in markdown \`\`\` json blocks.`;

  return { systemPrompt, userPrompt };
}
