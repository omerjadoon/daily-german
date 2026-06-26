import { z } from "zod";

// Validator for a single vocabulary item
export const VocabularyItemSchema = z.object({
  german: z.string().min(1, "German term cannot be empty"),
  article: z.enum(["der", "die", "das", "—"], {
    errorMap: () => ({ message: "Article must be 'der', 'die', 'das', or '—'" }),
  }),
  plural: z.string().nullable().optional(),
  english: z.string().min(1, "English meaning cannot be empty"),
  exampleGerman: z.string().min(1, "German example sentence cannot be empty"),
  exampleEnglish: z.string().min(1, "English translation of the example sentence cannot be empty"),
});

// Validator for a pronunciation guide entry (one per vocab word)
export const PronunciationGuideItemSchema = z.object({
  german: z.string().min(1, "German word cannot be empty"),
  phonetic: z.string().min(1, "Phonetic representation cannot be empty"),
  soundTip: z.string().min(1, "Sound tip cannot be empty"),
  urduApproximation: z.string().optional(), // How an Urdu speaker might approximate the sound
});

// Validator for a single tip-and-trick entry
export const TipAndTrickSchema = z.object({
  title: z.string().min(1, "Tip title cannot be empty"),
  tip: z.string().min(1, "Tip content cannot be empty"),
  category: z.enum(["memory", "grammar", "speaking", "writing", "listening", "exam", "culture"]).optional(),
});

// Validator for pronunciation focus section
export const PronunciationSectionSchema = z.object({
  focusSounds: z.string().min(1, "Focus sounds description cannot be empty"),
  rules: z.array(z.object({
    sound: z.string().min(1),
    description: z.string().min(1),
    examples: z.array(z.string()).min(1),
    urduNote: z.string().optional(),
  })).min(1, "At least one pronunciation rule is required"),
  practicePhrase: z.string().min(1, "Practice phrase cannot be empty"),
  practicePhraseTranslation: z.string().min(1, "Practice phrase translation cannot be empty"),
});

// Validator for grammar examples
export const GrammarExampleSchema = z.object({
  german: z.string().min(1, "German example cannot be empty"),
  english: z.string().min(1, "English translation cannot be empty"),
});

// Validator for the closing story block
export const ClosingStorySchema = z.object({
  storyGerman: z.string().min(1, "Closing story German text cannot be empty"),
  storyEnglish: z.string().min(1, "Closing story English translation cannot be empty"),
});

// Validator for grammar focus block
export const GrammarFocusSchema = z.object({
  title: z.string().min(1, "Grammar title cannot be empty"),
  explanationEnglish: z.string().min(1, "Grammar explanation cannot be empty"),
  urduGrammarNote: z.string().min(1, "Urdu grammar note cannot be empty"),
  examples: z.array(GrammarExampleSchema).min(1, "At least one grammar example is required"),
});

// Validator for mini exercises
export const ExerciseSchema = z.object({
  type: z.string().min(1, "Exercise type is required"),
  question: z.string().min(1, "Exercise question cannot be empty"),
  answer: z.string().min(1, "Exercise answer/solution cannot be empty"),
});

// Validator for spaced repetition review words
export const ReviewWordSchema = z.object({
  german: z.string().min(1, "Review word German term cannot be empty"),
  article: z.enum(["der", "die", "das", "—"]),
  english: z.string().min(1, "Review word English meaning cannot be empty"),
});

// Standard Lesson schema outputted by Groq LLM
export const LessonSchema = z.object({
  subject: z.string().min(1, "Subject line is required"),
  motivation: z.string().min(1, "Motivation note is required"),
  day: z.number().int().positive("Day must be a positive integer"),
  level: z.string().min(1, "CEFR level is required"),
  topic: z.string().min(1, "Topic is required"),
  storyGerman: z.string().min(1, "German story or dialogue cannot be empty"),
  translationEnglish: z.string().min(1, "English translation cannot be empty"),
  vocabulary: z
    .array(VocabularyItemSchema)
    .min(5, "Vocabulary list must have at least 5 items")
    .max(18, "Vocabulary list cannot exceed 18 items"),
  grammarFocus: GrammarFocusSchema,
  exercises: z.array(ExerciseSchema).min(3, "At least 3 exercises are required"),
  telcTip: z.string().min(1, "telc exam tip is required"),
  dailyChallenge: z.string().min(1, "Daily challenge is required"),
  reviewWords: z.array(ReviewWordSchema),
  closingStory: ClosingStorySchema,
  // Enrichment fields from second LLM call (optional so cached lessons still parse)
  pronunciationGuide: z.array(PronunciationGuideItemSchema).optional(),
  tipsAndTricks: z.array(TipAndTrickSchema).optional(),
  pronunciationSection: PronunciationSectionSchema.optional(),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type GrammarExample = z.infer<typeof GrammarExampleSchema>;
export type GrammarFocus = z.infer<typeof GrammarFocusSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ReviewWord = z.infer<typeof ReviewWordSchema>;
export type ClosingStory = z.infer<typeof ClosingStorySchema>;
export type PronunciationGuideItem = z.infer<typeof PronunciationGuideItemSchema>;
export type TipAndTrick = z.infer<typeof TipAndTrickSchema>;
export type PronunciationSection = z.infer<typeof PronunciationSectionSchema>;
export type Lesson = z.infer<typeof LessonSchema>;

/**
 * Validate lesson object and return validation result
 */
export function validateLesson(data: unknown) {
  return LessonSchema.safeParse(data);
}
