import { sql } from "./db";
import { ReviewWord } from "./validation";

/**
 * Calculates the next review date based on the current review count
 */
export function calculateNextReviewDate(reviewCount: number, baseDate = new Date()): Date {
  const daysToAdd = getReviewIntervalDays(reviewCount);
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Returns number of days to schedule out a word
 */
export function getReviewIntervalDays(reviewCount: number): number {
  switch (reviewCount) {
    case 0:
      return 1; // Tomorrow
    case 1:
      return 3; // +3 days
    case 2:
      return 7; // +7 days
    case 3:
      return 14; // +14 days
    default:
      return 30; // +30 days (max interval)
  }
}

/**
 * Selects up to 5 vocabulary items from previous days for review
 * Rules:
 * - Day must be less than current dayNumber
 * - Prefer due words (next_review_at <= now or NULL)
 * - Prefer nouns (article in 'der', 'die', 'das')
 * - Mix older and recent vocabulary
 */
export async function getReviewWords(dayNumber: number): Promise<ReviewWord[]> {
  try {
    const now = new Date();

    // 1. Fetch due nouns from previous days
    const dueNouns = await sql<any[]>`
      SELECT german, article, english
      FROM vocabulary_items
      WHERE day_number < ${dayNumber}
        AND article IN ('der', 'die', 'das')
        AND (next_review_at IS NULL OR next_review_at <= ${now})
      ORDER BY review_count ASC, created_at DESC
      LIMIT 10
    `;

    // 2. Fetch due non-nouns (verbs, adverbs, etc.)
    const dueOthers = await sql<any[]>`
      SELECT german, article, english
      FROM vocabulary_items
      WHERE day_number < ${dayNumber}
        AND article = '—'
        AND (next_review_at IS NULL OR next_review_at <= ${now})
      ORDER BY review_count ASC, created_at DESC
      LIMIT 10
    `;

    // Deduplicate and assemble
    const candidatesMap = new Map<string, ReviewWord>();
    
    // Add nouns first
    for (const item of dueNouns) {
      candidatesMap.set(item.german, {
        german: item.german,
        article: item.article as any,
        english: item.english,
      });
    }

    // Add others
    for (const item of dueOthers) {
      if (candidatesMap.size >= 10) break;
      candidatesMap.set(item.german, {
        german: item.german,
        article: item.article as any,
        english: item.english,
      });
    }

    // If we still have fewer than 5 unique review words, pull any random vocabulary from previous days
    if (candidatesMap.size < 5) {
      const fallbackItems = await sql<any[]>`
        SELECT german, article, english
        FROM vocabulary_items
        WHERE day_number < ${dayNumber}
        ORDER BY RANDOM()
        LIMIT 10
      `;

      for (const item of fallbackItems) {
        if (candidatesMap.size >= 10) break;
        candidatesMap.set(item.german, {
          german: item.german,
          article: item.article as any,
          english: item.english,
        });
      }
    }

    const reviewList = Array.from(candidatesMap.values());
    
    // Shuffle the list briefly to mix older/newer and return up to 5
    return reviewList
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
  } catch (error) {
    console.error("Error in getReviewWords (spaced repetition). Returning fallback empty list:", error);
    return [];
  }
}

/**
 * Increment a word's review count and schedule its next review date.
 * If a student studies a lesson today, we update the vocabulary items featured in today's lesson.
 */
export async function updateVocabularyReviewSchedule(germanWord: string): Promise<void> {
  try {
    const item = await sql<any[]>`
      SELECT id, review_count FROM vocabulary_items 
      WHERE german = ${germanWord} 
      LIMIT 1
    `;

    if (item.length > 0) {
      const newCount = (item[0].review_count || 0) + 1;
      const nextReview = calculateNextReviewDate(newCount);
      
      await sql`
        UPDATE vocabulary_items
        SET review_count = ${newCount},
            last_reviewed_at = now(),
            next_review_at = ${nextReview}
        WHERE id = ${item[0].id}
      `;
    }
  } catch (error) {
    console.error(`Failed to update review schedule for vocabulary: ${germanWord}`, error);
  }
}
