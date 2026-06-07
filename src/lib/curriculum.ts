import curriculumData from "../data/curriculum.json";
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

/**
 * Returns the bundled curriculum topics (imported at build time).
 * This approach works correctly in Netlify serverless functions,
 * unlike fs.readFileSync which fails because process.cwd() is not
 * the project root in the Lambda runtime environment.
 */
export function getCurriculumTopics(): CurriculumTopic[] {
  return curriculumData as CurriculumTopic[];
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
        exampleEnglish: "I learn German every day.",
      },
      {
        german: "Leben",
        article: "das",
        plural: "die Leben",
        english: "life",
        exampleGerman: "Das Leben in Deutschland ist aufregend.",
        exampleEnglish: "Life in Germany is exciting.",
      },
      {
        german: "Thema",
        article: "das",
        plural: "die Themen",
        english: "topic",
        exampleGerman: "Das Thema heute ist sehr nützlich.",
        exampleEnglish: "Today's topic is very useful.",
      },
      {
        german: "Situation",
        article: "die",
        plural: "die Situationen",
        english: "situation",
        exampleGerman: "Wir üben für diese schwierige Situation.",
        exampleEnglish: "We are practising for this difficult situation.",
      },
      {
        german: "Fortschritt",
        article: "der",
        plural: "die Fortschritte",
        english: "progress",
        exampleGerman: "Ich mache jeden Tag gute Fortschritte.",
        exampleEnglish: "I make good progress every day.",
      },
      {
        german: "Spaß",
        article: "der",
        plural: "",
        english: "fun",
        exampleGerman: "Deutsch lernen macht mir großen Spaß.",
        exampleEnglish: "Learning German is a lot of fun for me.",
      },
      {
        german: "täglich",
        article: "—",
        plural: "",
        english: "daily",
        exampleGerman: "Das ist meine tägliche Übung.",
        exampleEnglish: "This is my daily exercise.",
      },
      {
        german: "gemeinsam",
        article: "—",
        plural: "",
        english: "together",
        exampleGerman: "Wir lernen heute gemeinsam Deutsch.",
        exampleEnglish: "We are learning German together today.",
      },
      {
        german: "jeden Tag",
        article: "—",
        plural: "",
        english: "every day",
        exampleGerman: "Er lernt jeden Tag neue Wörter.",
        exampleEnglish: "He learns new words every day.",
      },
      {
        german: "wichtig",
        article: "—",
        plural: "",
        english: "important",
        exampleGerman: "Es ist wichtig, die Artikel zu kennen.",
        exampleEnglish: "It is important to know the articles.",
      },
    ],
    grammarFocus: {
      title: "Verbs and Word Order in Main Clauses",
      explanationEnglish: "In a standard German statement (main clause), the conjugated verb always sits in the second position of the sentence. If you move another element (like a time word) to the front, the subject shifts to position 3 — but the verb stays locked at position 2.",
      urduGrammarNote: "In Urdu, the verb almost always comes at the very end of the sentence (Subject-Object-Verb order), e.g., 'میں آج جرمن سیکھتا ہوں' (I today German learn). German, however, is verb-second (V2): the verb must sit in the 2nd slot regardless of what starts the sentence. Think of it as German 'anchoring' the verb earlier than Urdu does. This is one of the biggest structural differences you will need to consciously practise.",
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
    closingStory: {
      storyGerman: `**Heute** lernen wir gemeinsam über ein wichtiges **Thema**.\n\nDas **Leben** in Deutschland bietet viele interessante **Situationen**.\n\nJeden **Tag** machen wir kleine Fortschritte — und das ist sehr **wichtig**.\n\nDeutsch lernen macht **Spaß**, wenn man **gemeinsam** übt.\n\nMit **täglicher** Übung kommen die Fortschritte von selbst!`,
      storyEnglish: `**Today** we are learning together about an important **topic**.\n\n**Life** in Germany offers many interesting **situations**.\n\n**Every day** we make small steps of progress — and that is very **important**.\n\nLearning German is **fun** when you practise **together**.\n\nWith **daily** practice, progress comes on its own!`,
    },
  };
}
