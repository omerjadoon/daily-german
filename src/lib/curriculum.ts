import fs from "fs";
import path from "path";
import { Lesson, ReviewWord } from "./validation";

export interface CurriculumTopic {
  day: number;
  level: string;
  topic: string;
  scenario: string;
  grammarFocus: string[];
  vocabularyTheme: string | null;
  telcSkill: string | null;
}

// Global cached topics to avoid repeated reading from fs in serverless context
let cachedTopics: CurriculumTopic[] | null = null;

/**
 * Loads the curriculum JSON from local data files safely
 */
export function getCurriculumTopics(): CurriculumTopic[] {
  if (cachedTopics) return cachedTopics;

  try {
    const filePath = path.resolve(process.cwd(), "src/data/curriculum.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      cachedTopics = JSON.parse(data);
      return cachedTopics || [];
    }
  } catch (error) {
    console.error("Failed to load curriculum.json from file system:", error);
  }
  
  return [];
}

/**
 * Gets a curriculum topic by day number. If day > 120, it cycles or uses a standard B1 topic.
 */
export function getTopicForDay(dayNumber: number): CurriculumTopic {
  const topics = getCurriculumTopics();
  if (topics.length === 0) {
    // Return hardcoded safety topic if file reading failed
    return {
      day: dayNumber,
      level: "B1",
      topic: "Practice and Exam Strategy",
      scenario: "Reviewing exam techniques with your class.",
      grammarFocus: ["Futur I", "Präpositionen"],
      vocabularyTheme: "general review",
      telcSkill: "speaking",
    };
  }

  // If day exceeds the seeded curriculum size, we cycle through the B1 topics (Days 86 to 120)
  if (dayNumber > topics.length) {
    const b1TopicsCount = 35; // Days 86 to 120 (35 days)
    const startIndex = 85; // index for Day 86 (0-indexed)
    const offset = (dayNumber - topics.length - 1) % b1TopicsCount;
    return {
      ...topics[startIndex + offset],
      day: dayNumber // Maintain the correct day number
    };
  }

  // Standard lookup
  const topic = topics.find((t) => t.day === dayNumber);
  return topic || topics[topics.length - 1];
}

/**
 * Generates a valid fallback lesson for when Groq API fails or returns corrupted structures.
 * This ensures that Zod validation always passes and the system remains stable.
 */
export function generateFallbackLesson(
  dayNumber: number,
  topic: CurriculumTopic,
  reviewWords: ReviewWord[] = []
): Lesson {
  return {
    subject: `Tag ${dayNumber} Deutsch: ${topic.topic}`,
    motivation: `Welcome to Day ${dayNumber}! Today we cover "${topic.topic}". Keep your spirits high! Consistency is the secret key to passing the telc B1 exam. Let's do this!`,
    day: dayNumber,
    level: topic.level,
    topic: topic.topic,
    storyGerman: `Hallo! Heute lernen wir gemeinsam über das Thema: **${topic.topic}**.\n\nDas ist ein sehr wichtiges Thema für das tägliche Leben in Deutschland. In dieser Lektion sprechen wir über typische Situationen und üben die Grammatik.\n\nWir müssen jeden Tag ein bisschen üben. Deutsch lernen macht Spaß, wenn man Fortschritte sieht!`,
    translationEnglish: `Hello! Today we are learning together about the topic: ${topic.topic}.\n\nThis is a very important topic for daily life in Germany. In this lesson, we talk about typical situations and practice grammar.\n\nWe have to practice a little bit every day. Learning German is fun when you see progress!`,
    vocabulary: [
      {
        german: "lernen",
        article: "—",
        plural: "",
        english: "to learn",
        exampleGerman: "Ich lerne jeden Tag Deutsch.",
      },
      {
        german: "Leben",
        article: "das",
        plural: "die Leben",
        english: "life",
        exampleGerman: "Das Leben in Deutschland ist aufregend.",
      },
      {
        german: "Thema",
        article: "das",
        plural: "die Themen",
        english: "topic",
        exampleGerman: "Das Thema heute ist sehr nützlich.",
      },
      {
        german: "Situation",
        article: "die",
        plural: "die Situationen",
        english: "situation",
        exampleGerman: "Wir üben für diese schwierige Situation.",
      },
      {
        german: "Fortschritt",
        article: "der",
        plural: "die Fortschritte",
        english: "progress",
        exampleGerman: "Ich mache jeden Tag gute Fortschritte.",
      },
      {
        german: "Spaß",
        article: "der",
        plural: "",
        english: "fun",
        exampleGerman: "Deutsch lernen macht mir großen Spaß.",
      },
      {
        german: "täglich",
        article: "—",
        plural: "",
        english: "daily",
        exampleGerman: "Das ist meine tägliche Übung.",
      },
      {
        german: "gemeinsam",
        article: "—",
        plural: "",
        english: "together",
        exampleGerman: "Wir lernen heute gemeinsam Deutsch.",
      },
      {
        german: "jeden Tag",
        article: "—",
        plural: "",
        english: "every day",
        exampleGerman: "Er lernt jeden Tag neue Wörter.",
      },
      {
        german: "wichtig",
        article: "—",
        plural: "",
        english: "important",
        exampleGerman: "Es ist wichtig, die Artikel zu kennen.",
      },
    ],
    grammarFocus: {
      title: "Verbs and Word Order in Main Clauses",
      explanationEnglish: "In a standard German statement (main clause), the conjugated verb always sits in the second position of the sentence.",
      examples: [
        {
          german: "Ich lerne heute Deutsch.",
          english: "I am learning German today. (Verb 'lerne' is in position 2)",
        },
        {
          german: "Heute lerne ich Deutsch.",
          english: "Today I am learning German. (Time adverb is first, verb remains in position 2, subject shifts)",
        },
      ],
    },
    exercises: [
      {
        type: "fill_blank",
        question: "Das Leben in Deutschland _______ (sein) sehr schön.",
        answer: "ist",
      },
      {
        type: "translation",
        question: "Translate to German: 'I learn German every day.'",
        answer: "Ich lerne jeden Tag Deutsch.",
      },
      {
        type: "multiple_choice",
        question: "What is the correct article for the word 'Thema'? (der, die, das)",
        answer: "das",
      },
    ],
    telcTip: "telc Speaking Tip: Keep your sentences clear and structured. Standard SVO structures are highly rated if grammatically correct.",
    dailyChallenge: "Write three simple sentences in German about what you did today and identify the position of your verbs.",
    reviewWords: reviewWords,
  };
}
