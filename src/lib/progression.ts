export interface DifficultyProfile {
  level: "A0" | "A1" | "A2" | "B1";
  sentenceLengthGuidance: string;
  grammarComplexity: string;
  vocabularyComplexity: string;
  outputLengthTarget: string;
  telcFocus: string;
  allowedGrammar: string[];
  forbiddenGrammar: string[];
}

export function getDifficultyProfile(dayNumber: number): DifficultyProfile {
  // Days 1–10: Absolute beginner (A0/A1 survival)
  if (dayNumber >= 1 && dayNumber <= 10) {
    return {
      level: "A0",
      sentenceLengthGuidance: "Extremely short sentences (3 to 6 words max). No run-ons.",
      grammarComplexity: "Strictly present tense of 'sein', 'haben', and basic regular verbs. English translations must be detailed.",
      vocabularyComplexity: "Survival words, numbers, letters, names, greetings.",
      outputLengthTarget: "Short (approx. 40 to 60 words for the dialogue/story).",
      telcFocus: "Basic speaking greeting items and listening spelling.",
      allowedGrammar: ["sein", "haben", "personal pronouns", "simple present tense conjugated endings"],
      forbiddenGrammar: [
        "Perfekt tense",
        "Präteritum tense",
        "subordinate clauses (weil, dass, wenn, obwohl)",
        "comparatives",
        "relative clauses",
        "passive voice",
        "Konjunktiv II"
      ],
    };
  }

  // Days 11–30: A1
  if (dayNumber >= 11 && dayNumber <= 30) {
    return {
      level: "A1",
      sentenceLengthGuidance: "Short simple sentences (5 to 8 words). Basic coordinate clauses with 'und' or 'aber'.",
      grammarComplexity: "Present tense, simple modal verbs (können, müssen, wollen, möchten), articles (nominative, simple accusative).",
      vocabularyComplexity: "Daily situations, buying food, telling time, hobbies.",
      outputLengthTarget: "Moderate (approx. 60 to 90 words for the story).",
      telcFocus: "Basic situational speaking and simple announcement reading.",
      allowedGrammar: [
        "present tense",
        "modal verbs (können, müssen, wollen, möchten)",
        "accusative case",
        "indefinite articles",
        "negation with kein/nicht"
      ],
      forbiddenGrammar: [
        "Perfekt tense",
        "Präteritum tense of normal verbs",
        "subordinate clauses (weil, dass, wenn, obwohl)",
        "relative clauses",
        "passive voice",
        "Konjunktiv II"
      ],
    };
  }

  // Days 31–60: A1+/A2
  if (dayNumber >= 31 && dayNumber <= 60) {
    return {
      level: "A2",
      sentenceLengthGuidance: "Simple sentences mixed with basic subordinate clauses (weil, wenn). Average 8 to 12 words.",
      grammarComplexity: "Accusative & dative cases, separable verbs, introductory Perfekt tense with regular verbs and haben/sein.",
      vocabularyComplexity: "Making bookings, office basics, health, dental, and bank contexts.",
      outputLengthTarget: "Structured (approx. 80 to 120 words for the story).",
      telcFocus: "Reading ads, writing short emails, expressing temporal order.",
      allowedGrammar: [
        "separable verbs",
        "accusative case",
        "dative case",
        "Präteritum of haben/sein (hatte, war)",
        "Perfekt tense (haben/sein + ge-)",
        "prepositions with dative",
        "polite requests ('Wie passt es dir?')"
      ],
      forbiddenGrammar: [
        "passive voice",
        "genitive prepositions (wegen, trotz)",
        "complex connectors (obwohl, trotzdem)",
        "relative clauses with prepositions"
      ],
    };
  }

  // Days 61–90: A2
  if (dayNumber >= 61 && dayNumber <= 85) {
    return {
      level: "A2",
      sentenceLengthGuidance: "Mixed length sentences (10 to 15 words). Proper use of connectors to build flows.",
      grammarComplexity: "Two-way prepositions (Wechselpräpositionen), Konjunktiv II for advice (sollte, könnten, würden), opinions with 'dass' and conditional 'wenn'.",
      vocabularyComplexity: "Shopping disputes, environment, online returns, public transport delays, customer service calls.",
      outputLengthTarget: "Flowing stories (approx. 100 to 140 words).",
      telcFocus: "Writing formal complaints, giving suggestions, comparing online shopping advantages.",
      allowedGrammar: [
        "Perfekt tense of all verbs",
        "subordinate clauses with 'weil', 'dass', 'wenn'",
        "Konjunktiv II (sollte, könnten, würden)",
        "Wechselpräpositionen",
        "comparatives",
        "reflexive verbs"
      ],
      forbiddenGrammar: [
        "Genitive prepositions",
        "passive voice with modal verbs",
        "complex B1 argumentative connectors (obwohl, trotzdem, zwar... aber)"
      ],
    };
  }

  // Days 86–120: B1 telc-oriented
  // After Day 120: standard B1 cycling
  return {
    level: "B1",
    sentenceLengthGuidance: "Rich, well-connected German clauses (12 to 18 words) with clear argumentative structures.",
    grammarComplexity: "Polite inquiries in Konjunktiv II, connectors (obwohl, trotzdem, deshalb, außerdem), passive voice, genitive, infinitive clauses with 'um... zu'.",
    vocabularyComplexity: "telc mock exams, formal application letters, debate structures (advantages/disadvantages), social debates, job interviews, citizenship.",
    outputLengthTarget: "Advanced B1 stories or letters (approx. 120 to 180 words).",
    telcFocus: "Full B1 Speaking Parts (1, 2, 3), Formal Letter writing (Part B), informal opinion writing.",
    allowedGrammar: [
      "passive voice",
      "connectors (obwohl, trotzdem, deshalb, darum, außerdem, darüber hinaus)",
      "infinitives with 'um... zu', 'ohne... zu', 'anstatt... zu'",
      "two-part connectors (sowohl... als auch, weder... noch)",
      "relative clauses with prepositions",
      "prepositions with genitive (wegen, trotz)",
      "Konjunktiv II for hypotheticals"
    ],
    forbiddenGrammar: [],
  };
}
