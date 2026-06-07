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
    .min(10, "Vocabulary list must have at least 10 items")
    .max(18, "Vocabulary list cannot exceed 18 items"),
  grammarFocus: GrammarFocusSchema,
  exercises: z.array(ExerciseSchema).min(3, "At least 3 exercises are required"),
  telcTip: z.string().min(1, "telc exam tip is required"),
  dailyChallenge: z.string().min(1, "Daily challenge is required"),
  reviewWords: z.array(ReviewWordSchema),
  closingStory: ClosingStorySchema,
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type GrammarExample = z.infer<typeof GrammarExampleSchema>;
export type GrammarFocus = z.infer<typeof GrammarFocusSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ReviewWord = z.infer<typeof ReviewWordSchema>;
export type ClosingStory = z.infer<typeof ClosingStorySchema>;
export type Lesson = z.infer<typeof LessonSchema>;

/**
 * Validate lesson object and return validation result
 */
export function validateLesson(data: unknown) {
  return LessonSchema.safeParse(data);
}
