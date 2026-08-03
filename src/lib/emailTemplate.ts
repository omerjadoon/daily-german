import { Lesson, DailyLetter } from "./validation";

// Category badge colors for Tips & Tricks
const CATEGORY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  memory:    { bg: "#eff6ff", color: "#1d4ed8", label: "💡 Memory" },
  grammar:   { bg: "#fdf5e6", color: "#b45309", label: "📐 Grammar" },
  speaking:  { bg: "#f0fdf4", color: "#166534", label: "🎙️ Speaking" },
  writing:   { bg: "#faf5ff", color: "#6b21a8", label: "✍️ Writing" },
  listening: { bg: "#fff7ed", color: "#c2410c", label: "👂 Listening" },
  exam:      { bg: "#f0f9ff", color: "#0369a1", label: "🏆 Exam" },
  culture:   { bg: "#fdf2f8", color: "#9d174d", label: "🌍 Culture" },
};

/**
 * Renders the daily German lesson in a premium, responsive HTML template.
 */
export function generateHtmlEmail(lesson: Lesson): string {
  // Map vocabulary rows
  const vocabRows = lesson.vocabulary
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: 600; color: #1e293b;">${item.german}</td>
        <td style="padding: 10px; color: #64748b; text-align: center;"><span style="background-color: ${
          item.article !== "—" ? "#f1f5f9" : "transparent"
        }; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${item.article}</span></td>
        <td style="padding: 10px; color: #475569; font-style: italic;">${item.plural || "—"}</td>
        <td style="padding: 10px; color: #334155;">${item.english}</td>
        <td style="padding: 10px; color: #0f172a; font-size: 14px; line-height: 1.4;">${item.exampleGerman}</td>
        <td style="padding: 10px; color: #64748b; font-size: 13px; font-style: italic; line-height: 1.4;">${item.exampleEnglish}</td>
      </tr>
    `
    )
    .join("");

  // Map review rows if they exist
  const reviewContent =
    lesson.reviewWords && lesson.reviewWords.length > 0
      ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">🔄 Spaced Repetition Review (Do you remember these?)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 5px; color: #475569;">German</th>
              <th style="padding: 5px; color: #475569; text-align: center;">Article</th>
              <th style="padding: 5px; color: #475569;">English</th>
            </tr>
          </thead>
          <tbody>
            ${lesson.reviewWords
              .map(
                (w) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 5px; font-weight: 600; color: #0f172a;">${w.german}</td>
                <td style="padding: 6px 5px; text-align: center; color: #64748b;">${w.article}</td>
                <td style="padding: 6px 5px; color: #334155;">${w.english}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : "";

  // Map grammar examples
  const grammarExamples = lesson.grammarFocus.examples
    .map(
      (ex) => `
      <li style="margin-bottom: 8px; line-height: 1.5;">
        <strong style="color: #0f172a;">${ex.german}</strong><br>
        <span style="color: #475569; font-size: 14px;">${ex.english}</span>
      </li>
    `
    )
    .join("");

  // Map exercises
  const exerciseList = lesson.exercises
    .map(
      (ex, index) => `
      <div style="margin-bottom: 15px; padding: 10px 15px; border-radius: 6px; background-color: #fdfdfd; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Task ${index + 1}: <span style="font-weight: normal; font-size: 14px; color: #64748b;">(${ex.type})</span></p>
        <p style="margin: 8px 0 0 0; color: #334155; font-size: 15px;">${ex.question}</p>
      </div>
    `
    )
    .join("");

  // Map answers
  const answerList = lesson.exercises
    .map(
      (ex, index) => `
      <div style="margin-bottom: 8px; font-size: 14px; line-height: 1.4;">
        <strong style="color: #475569;">Task ${index + 1}:</strong> <span style="color: #0f172a;">${ex.answer}</span>
      </div>
    `
    )
    .join("");

  // Formatting German text bolding
  const storyHtml = lesson.storyGerman.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 2px 4px; border-radius: 3px;">$1</strong>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Banner Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 25px; text-align: center;">
              <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">Tag ${lesson.day} • Level ${lesson.level}</span>
              <h1 style="color: #ffffff; margin: 15px 0 5px 0; font-size: 24px; font-weight: 800;">${lesson.topic}</h1>
              <p style="color: #bfdbfe; margin: 0; font-size: 14px; font-style: italic;">telc Deutsch B1 Vorbereitung</p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 25px 25px 15px 25px;">
              
              <!-- Motivation -->
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 25px; font-style: italic; border-left: 3px solid #cbd5e1; padding-left: 12px;">
                "${lesson.motivation}"
              </p>

              <!-- Spaced repetition review block -->
              ${reviewContent}

              <!-- Dialogue / Story Card in German -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #1e40af; font-size: 18px; display: flex; align-items: center;">🇩🇪 Deutsche Geschichte / Dialog</h3>
                <div style="font-size: 16px; line-height: 1.7; color: #1e293b; white-space: pre-line;">
                  ${storyHtml}
                </div>
              </div>

              <!-- 🔊 Audio Pronunciation Notice -->
              <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🔊</span>
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                  <strong>Audio Pronunciation attached!</strong> Open the <code>day${lesson.day}_story.mp3</code> attachment to listen to the German dialogue read aloud. Great for shadowing practice!
                </p>
              </div>

              <!-- English Translation Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #475569; font-size: 16px;">🇬🇧 English Translation</h3>
                <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0; white-space: pre-line;">
                  ${lesson.translationEnglish}
                </p>
              </div>

              <!-- Vocabulary Section -->
              <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">📊 Wortschatz (Vocabulary)</h2>
              <div style="overflow-x: auto; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; background-color: #ffffff;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">Wort</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700; text-align: center;">Artikel</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">Plural</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">English</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700; width: 32%;">Beispiel (DE)</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700; width: 28%;">Beispiel (EN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${vocabRows}
                  </tbody>
                </table>
              </div>

              <!-- Per-Word Pronunciation Guide -->
              ${lesson.pronunciationGuide && lesson.pronunciationGuide.length > 0 ? `
              <div style="overflow-x: auto; margin-bottom: 25px; border: 1px solid #ddd6fe; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #faf5ff;">
                  <thead>
                    <tr style="background-color: #ede9fe; border-bottom: 2px solid #c4b5fd;">
                      <th style="padding: 10px; color: #5b21b6; font-weight: 700;">Word</th>
                      <th style="padding: 10px; color: #5b21b6; font-weight: 700;">Phonetic</th>
                      <th style="padding: 10px; color: #5b21b6; font-weight: 700; width: 38%;">Sound Tip</th>
                      <th style="padding: 10px; color: #5b21b6; font-weight: 700; width: 28%;">🇵🇰 Urdu Approximation</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lesson.pronunciationGuide.map((p) => `
                    <tr style="border-bottom: 1px solid #e9d5ff;">
                      <td style="padding: 9px 10px; font-weight: 700; color: #1e293b;">${p.german}</td>
                      <td style="padding: 9px 10px; font-family: monospace; color: #6d28d9; font-weight: 600; white-space: nowrap;">${p.phonetic}</td>
                      <td style="padding: 9px 10px; color: #374151; line-height: 1.5;">${p.soundTip}</td>
                      <td style="padding: 9px 10px; color: #6d28d9; font-style: italic; line-height: 1.5;">${p.urduApproximation || '—'}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : '<div style="margin-bottom: 25px;"></div>'}

              <!-- Grammar Focus Section -->
              <div style="background-color: #fdf5e6; border: 1px solid #f5deb3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #b45309; margin-top: 0; font-size: 18px; border-bottom: 1px dashed #f5deb3; padding-bottom: 8px;">💡 Grammatik-Fokus: ${lesson.grammarFocus.title}</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #451a03; margin-top: 10px;">
                  ${lesson.grammarFocus.explanationEnglish}
                </p>
                <!-- Urdu Grammar Bridge -->
                <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 15px; margin: 12px 0;">
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
                    <strong style="color: #92400e;">🇵🇰 Urdu Speaker's Note:</strong> ${lesson.grammarFocus.urduGrammarNote}
                  </p>
                </div>
                <h4 style="margin-bottom: 5px; color: #78350f; font-size: 14px;">Examples:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #451a03;">
                  ${grammarExamples}
                </ul>
              </div>

              <!-- Mini Exercises -->
              <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">✏️ Mini-Übungen (Exercises)</h2>
              <div style="margin-bottom: 25px;">
                ${exerciseList}
              </div>

              <!-- telc Exam Tip Card -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 10px; color: #166534; font-size: 16px;">🏆 telc Deutsch B1 Prüfungstipp</h3>
                <p style="font-size: 15px; line-height: 1.6; color: #14532d; margin: 0;">
                  ${lesson.telcTip}
                </p>
              </div>

              <!-- Daily Challenge Card -->
              <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 10px; color: #6b21a8; font-size: 16px;">🔥 Tages-Challenge (Homework)</h3>
                <p style="font-size: 15px; line-height: 1.6; color: #581c87; margin: 0; font-weight: 600;">
                  ${lesson.dailyChallenge}
                </p>
              </div>

              <!-- Closing Story Section -->
              ${(() => {
                const closingStoryDE = lesson.closingStory.storyGerman.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 1px 3px; border-radius: 3px;">$1</strong>');
                const closingStoryEN = lesson.closingStory.storyEnglish.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #166534; background-color: #f0fdf4; padding: 1px 3px; border-radius: 3px;">$1</strong>');
                return `
                <div style="background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                  <h2 style="color: #1e293b; margin-top: 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">📖 Abschlussgeschichte (Closing Story)</h2>
                  <div style="margin-bottom: 16px;">
                    <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">🇩🇪 Auf Deutsch</h4>
                    <div style="font-size: 15px; line-height: 1.8; color: #1e293b; white-space: pre-line;">${closingStoryDE}</div>
                  </div>
                  <div style="border-top: 1px dashed #e5e7eb; padding-top: 14px;">
                    <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">🇬🇧 In English</h4>
                    <div style="font-size: 14px; line-height: 1.7; color: #334155; font-style: italic; white-space: pre-line;">${closingStoryEN}</div>
                  </div>
                </div>
                `;
              })()}

              <!-- Solutions Toggle/Answers Section -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 15px;">
                <h3 style="color: #475569; font-size: 16px; margin-top: 0; margin-bottom: 12px;">✅ Lösungen (Answers)</h3>
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; border: 1px dashed #cbd5e1;">
                  ${answerList}
                </div>
              </div>

              <!-- Word Bank Section -->
              ${lesson.wordBank ? `
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; margin-bottom: 16px;">📚 Wortschatz-Bank (Daily Word Bank)</h2>

                <!-- Nouns -->
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background-color: #dbeafe; color: #1d4ed8; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">🏷️ Nouns (Nomen) — 10</span>
                  </div>
                  <div style="overflow-x: auto; border: 1px solid #bfdbfe; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #eff6ff;">
                      <thead>
                        <tr style="background-color: #dbeafe; border-bottom: 2px solid #93c5fd;">
                          <th style="padding: 9px 10px; color: #1e40af; font-weight: 700;">Artikel</th>
                          <th style="padding: 9px 10px; color: #1e40af; font-weight: 700;">Nomen</th>
                          <th style="padding: 9px 10px; color: #1e40af; font-weight: 700;">Plural</th>
                          <th style="padding: 9px 10px; color: #1e40af; font-weight: 700;">English</th>
                          <th style="padding: 9px 10px; color: #1e40af; font-weight: 700; width: 38%;">Beispielsatz</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lesson.wordBank.nouns.map((n, i) => `
                        <tr style="border-bottom: 1px solid #bfdbfe; background-color: ${i % 2 === 0 ? '#eff6ff' : '#f0f7ff'};">
                          <td style="padding: 8px 10px;">
                            <span style="background-color: ${n.article === 'der' ? '#fee2e2' : n.article === 'die' ? '#fce7f3' : '#d1fae5'}; color: ${n.article === 'der' ? '#991b1b' : n.article === 'die' ? '#9d174d' : '#065f46'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">${n.article}</span>
                          </td>
                          <td style="padding: 8px 10px; font-weight: 700; color: #1e293b;">
                            ${n.german}
                            ${n.opposite ? `<br><span style="font-size: 11px; font-weight: normal; color: #b91c1c; background-color: #fef2f2; padding: 1px 4px; border-radius: 4px; display: inline-block; margin-top: 4px;">↔ Gegenteil: ${n.opposite.german} (${n.opposite.english})</span>` : ''}
                          </td>
                          <td style="padding: 8px 10px; color: #475569; font-size: 12px;">${n.plural}</td>
                          <td style="padding: 8px 10px; color: #334155;">${n.english}</td>
                          <td style="padding: 8px 10px; color: #475569; font-style: italic; line-height: 1.4;">${n.example}</td>
                        </tr>`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Verbs -->
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background-color: #d1fae5; color: #065f46; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Verbs (Verben) — 10</span>
                  </div>
                  <div style="overflow-x: auto; border: 1px solid #6ee7b7; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #ecfdf5;">
                      <thead>
                        <tr style="background-color: #d1fae5; border-bottom: 2px solid #6ee7b7;">
                          <th style="padding: 9px 10px; color: #065f46; font-weight: 700;">Verb (Infinitiv)</th>
                          <th style="padding: 9px 10px; color: #065f46; font-weight: 700;">English</th>
                          <th style="padding: 9px 10px; color: #065f46; font-weight: 700; width: 48%;">Beispielsatz</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lesson.wordBank.verbs.map((v, i) => `
                        <tr style="border-bottom: 1px solid #a7f3d0; background-color: ${i % 2 === 0 ? '#ecfdf5' : '#f0fdf8'};">
                          <td style="padding: 8px 10px; font-weight: 700; color: #065f46;">
                            ${v.german}
                            ${v.opposite ? `<br><span style="font-size: 11px; font-weight: normal; color: #b91c1c; background-color: #fef2f2; padding: 1px 4px; border-radius: 4px; display: inline-block; margin-top: 4px;">↔ Gegenteil: ${v.opposite.german} (${v.opposite.english})</span>` : ''}
                          </td>
                          <td style="padding: 8px 10px; color: #334155;">${v.english}</td>
                          <td style="padding: 8px 10px; color: #475569; font-style: italic; line-height: 1.4;">${v.example}</td>
                        </tr>`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Adjectives -->
                <div style="margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background-color: #ede9fe; color: #5b21b6; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">🎨 Adjectives (Adjektive) — 10</span>
                  </div>
                  <div style="overflow-x: auto; border: 1px solid #c4b5fd; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #f5f3ff;">
                      <thead>
                        <tr style="background-color: #ede9fe; border-bottom: 2px solid #c4b5fd;">
                          <th style="padding: 9px 10px; color: #4c1d95; font-weight: 700;">Adjektiv</th>
                          <th style="padding: 9px 10px; color: #4c1d95; font-weight: 700;">English</th>
                          <th style="padding: 9px 10px; color: #4c1d95; font-weight: 700; width: 48%;">Beispielsatz</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lesson.wordBank.adjectives.map((a, i) => `
                        <tr style="border-bottom: 1px solid #ddd6fe; background-color: ${i % 2 === 0 ? '#f5f3ff' : '#f8f7ff'};">
                          <td style="padding: 8px 10px; font-weight: 700; color: #5b21b6;">
                            ${a.german}
                            ${a.opposite ? `<br><span style="font-size: 11px; font-weight: normal; color: #b91c1c; background-color: #fef2f2; padding: 1px 4px; border-radius: 4px; display: inline-block; margin-top: 4px;">↔ Gegenteil: ${a.opposite.german} (${a.opposite.english})</span>` : ''}
                          </td>
                          <td style="padding: 8px 10px; color: #334155;">${a.english}</td>
                          <td style="padding: 8px 10px; color: #475569; font-style: italic; line-height: 1.4;">${a.example}</td>
                        </tr>`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
              ` : ''}

              <!-- Tips & Tricks Section -->
              ${lesson.tipsAndTricks && lesson.tipsAndTricks.length > 0 ? `
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; margin-bottom: 16px;">🧠 Lerntipps & Tricks (Learning Tips & Tricks)</h2>
                ${lesson.tipsAndTricks.map((tip) => {
                  const style = CATEGORY_STYLES[tip.category || 'memory'] || CATEGORY_STYLES['memory'];
                  return `
                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background-color: #fafafa; border-left: 4px solid ${style.color};">
                    <div style="display: flex; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                      <span style="background-color: ${style.bg}; color: ${style.color}; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap;">${style.label}</span>
                      <strong style="color: #1e293b; font-size: 15px;">${tip.title}</strong>
                    </div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #334155;">${tip.tip}</p>
                  </div>
                  `;
                }).join('')}
              </div>
              ` : ''}

              <!-- Pronunciation Section -->
              ${lesson.pronunciationSection ? `
              <div style="background-color: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #5b21b6; margin-top: 0; font-size: 18px; border-bottom: 1px solid #c4b5fd; padding-bottom: 8px;">🗣️ Aussprache-Fokus (Pronunciation Focus)</h2>
                <p style="font-size: 14px; color: #3b0764; line-height: 1.6; margin-top: 10px;">${lesson.pronunciationSection.focusSounds}</p>
                ${lesson.pronunciationSection.rules.map((rule) => `
                <div style="background-color: #ede9fe; border-radius: 6px; padding: 12px 15px; margin-bottom: 10px;">
                  <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
                    <span style="font-size: 18px; font-weight: 800; color: #6d28d9; font-family: monospace; background-color: #ddd6fe; padding: 2px 10px; border-radius: 6px;">${rule.sound}</span>
                    <span style="font-size: 13px; color: #4c1d95; line-height: 1.6;">${rule.description}</span>
                  </div>
                  <div style="margin-top: 8px;">
                    <span style="font-size: 12px; color: #6d28d9; font-weight: 600;">Examples: </span>
                    ${rule.examples.map(ex => `<span style="background-color: #fff; border: 1px solid #c4b5fd; border-radius: 4px; padding: 1px 8px; font-size: 13px; color: #1e293b; margin-right: 4px; display: inline-block;">${ex}</span>`).join('')}
                  </div>
                  ${rule.urduNote ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #7c3aed; background-color: #fef9c3; padding: 4px 10px; border-radius: 4px; display: inline-block;">🇵🇰 ${rule.urduNote}</p>` : ''}
                </div>
                `).join('')}
                <div style="background-color: #ddd6fe; border-radius: 6px; padding: 14px; margin-top: 14px;">
                  <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #4c1d95;">🔁 Practice Phrase:</p>
                  <p style="margin: 0; font-size: 16px; color: #2e1065; font-weight: 600; letter-spacing: 0.02em;">${lesson.pronunciationSection.practicePhrase}</p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #5b21b6; font-style: italic;">${lesson.pronunciationSection.practicePhraseTranslation}</p>
                </div>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 25px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #475569;">Daily German B1 Tutor</p>
              <p style="margin: 0 0 15px 0;">Sie erhalten diese Email, um sich täglich auf Ihre telc B1 Deutschprüfung vorzubereiten.</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Empfänger: ${lesson.vocabulary[0] ? process.env.EMAIL_TO || "omerkhanjadoons@gmail.com" : "omerkhanjadoons@gmail.com"}<br>
                Startdatum: ${process.env.START_DATE || "2026-06-01"}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Renders the daily German lesson in plain-text format for accessibility.
 */
export function generateTextEmail(lesson: Lesson): string {
  // Map vocabulary
  const vocabText = lesson.vocabulary
    .map(
      (v, i) =>
        `${i + 1}. ${v.german} (${v.article}) ${v.plural ? "Plural: " + v.plural : ""}\n   English: ${v.english}\n   Beispiel (DE): ${v.exampleGerman}\n   Beispiel (EN): ${v.exampleEnglish}`
    )
    .join("\n\n");

  // Map review words
  const reviewText =
    lesson.reviewWords && lesson.reviewWords.length > 0
      ? `🔄 SPACED REPETITION REVIEW:\n` +
        lesson.reviewWords.map((w) => `- ${w.german} (${w.article}): ${w.english}`).join("\n") +
        "\n\n"
      : "";

  // Map grammar examples
  const grammarExamples = lesson.grammarFocus.examples
    .map((ex) => `- DE: ${ex.german}\n  EN: ${ex.english}`)
    .join("\n\n");

  // Map exercises
  const exercisesText = lesson.exercises
    .map((ex, i) => `Task ${i + 1} (${ex.type}):\nQuestion: ${ex.question}`)
    .join("\n\n");

  // Map answers
  const answersText = lesson.exercises
    .map((ex, i) => `Task ${i + 1}: ${ex.answer}`)
    .join("\n");

  return `
=========================================
TAG ${lesson.day} • LEVEL ${lesson.level}
${lesson.topic.toUpperCase()}
telc Deutsch B1 Vorbereitung
=========================================

"${lesson.motivation}"

${reviewText}
-----------------------------------------
🇩🇪 DEUTSCHE GESCHICHTE / DIALOG:
-----------------------------------------
${lesson.storyGerman.replace(/\*\*/g, "")}

-----------------------------------------
🇬🇧 ENGLISH TRANSLATION:
-----------------------------------------
${lesson.translationEnglish}

-----------------------------------------
📊 WORTSCHATZ (VOCABULARY):
-----------------------------------------
${vocabText}
${lesson.pronunciationGuide && lesson.pronunciationGuide.length > 0 ? `
-----------------------------------------
🗣️ AUSSPRACHE-GUIDE (PRONUNCIATION):
-----------------------------------------
${lesson.pronunciationGuide.map((p) =>
  `▶ ${p.german}\n  Phonetic: ${p.phonetic}\n  Tip: ${p.soundTip}\n  🇵🇰 Urdu: ${p.urduApproximation || '—'}`
).join('\n\n')}` : ''}

-----------------------------------------
💡 GRAMMATIK-FOKUS: ${lesson.grammarFocus.title}
-----------------------------------------
${lesson.grammarFocus.explanationEnglish}

🇵🇰 Urdu Speaker's Note:
${lesson.grammarFocus.urduGrammarNote}

Examples:
${grammarExamples}

-----------------------------------------
✏️ MINI-ÜBUNGEN (EXERCISES):
-----------------------------------------
${exercisesText}

-----------------------------------------
🏆 TELC DEUTSCH B1 PRÜFUNGSTIPP:
-----------------------------------------
${lesson.telcTip}

-----------------------------------------
🔥 TAGES-CHALLENGE (HOMEWORK):
-----------------------------------------
${lesson.dailyChallenge}

-----------------------------------------
📖 ABSCHLUSSGESCHICHTE (CLOSING STORY):
-----------------------------------------
🇩🇪 Auf Deutsch:
${lesson.closingStory.storyGerman.replace(/\*\*/g, "")}

🇬🇧 In English:
${lesson.closingStory.storyEnglish.replace(/\*\*/g, "")}

-----------------------------------------
✅ LÖSUNGEN (ANSWERS):
-----------------------------------------
${answersText}
${lesson.wordBank ? `
-----------------------------------------
📚 WORTSCHATZ-BANK (DAILY WORD BANK):
-----------------------------------------
🏷️ NOUNS (NOMEN):
${lesson.wordBank.nouns.map((n, i) =>
  `${i + 1}. ${n.article} ${n.german} | Plural: ${n.plural} | ${n.english}${n.opposite ? ` (Gegenteil: ${n.opposite.german} - ${n.opposite.english})` : ''}\n   → ${n.example}`
).join('\n')}

⚡ VERBS (VERBEN):
${lesson.wordBank.verbs.map((v, i) =>
  `${i + 1}. ${v.german} | ${v.english}${v.opposite ? ` (Gegenteil: ${v.opposite.german} - ${v.opposite.english})` : ''}\n   → ${v.example}`
).join('\n')}

🎨 ADJECTIVES (ADJEKTIVE):
${lesson.wordBank.adjectives.map((a, i) =>
  `${i + 1}. ${a.german} | ${a.english}${a.opposite ? ` (Gegenteil: ${a.opposite.german} - ${a.opposite.english})` : ''}\n   → ${a.example}`
).join('\n')}` : ''}
${lesson.tipsAndTricks && lesson.tipsAndTricks.length > 0 ? `
-----------------------------------------
🧠 LERNTIPPS & TRICKS:
-----------------------------------------
${lesson.tipsAndTricks.map((t, i) =>
  `${i + 1}. [${(t.category || 'tip').toUpperCase()}] ${t.title}\n   ${t.tip}`
).join('\n\n')}` : ''}
${lesson.pronunciationSection ? `
-----------------------------------------
🗣️ AUSSPRACHE-FOKUS (PRONUNCIATION FOCUS):
-----------------------------------------
${lesson.pronunciationSection.focusSounds}

${lesson.pronunciationSection.rules.map((r) =>
  `Sound: ${r.sound}\n${r.description}\nExamples: ${r.examples.join(', ')}${r.urduNote ? '\n🇵🇰 ' + r.urduNote : ''}`
).join('\n\n')}

🔁 Practice Phrase: ${lesson.pronunciationSection.practicePhrase}
(${lesson.pronunciationSection.practicePhraseTranslation})` : ''}

-----------------------------------------
Daily German B1 Tutor
Sie erhalten diese Email, um sich täglich auf Ihre telc B1 Deutschprüfung vorzubereiten.
Empfänger: ${process.env.EMAIL_TO || "omerkhanjadoons@gmail.com"}
`;
}

/**
 * Renders the daily German letter as a premium HTML email.
 */
export function generateLetterHtmlEmail(letter: DailyLetter, dayNumber: number): string {
  const registerColor = letter.register === "formal" ? { bg: "#1e3a8a", accent: "#3b82f6", badge: "#dbeafe", badgeText: "#1d4ed8", label: "📝 Formal" }
                                                     : { bg: "#4a1d96", accent: "#8b5cf6", badge: "#ede9fe", badgeText: "#5b21b6", label: "💬 Informal" };

  const keyPhrasesRows = letter.keyPhrases.map((kp, i) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; font-weight: 700; color: #1e40af; font-size: 14px; white-space: nowrap;">${kp.phrase}</td>
      <td style="padding: 10px 12px; color: #334155; font-size: 14px; font-style: italic;">${kp.meaning}</td>
      <td style="padding: 10px 12px; color: #475569; font-size: 13px; line-height: 1.5;">${kp.usage}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day ${dayNumber}: German Letter Practice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${registerColor.bg} 0%, ${registerColor.accent} 100%); padding: 30px 25px; text-align: center;">
              <span style="background-color: rgba(255,255,255,0.2); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">Tag ${dayNumber} • B1 Level • ${registerColor.label}</span>
              <h1 style="color: #ffffff; margin: 15px 0 5px 0; font-size: 22px; font-weight: 800;">✉️ Daily German Letter Practice</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px; font-style: italic; max-width: 440px; margin: 5px auto 0;">${letter.topic}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 25px;">

              <!-- Register Tip -->
              <div style="background-color: ${registerColor.badge}; border-left: 4px solid ${registerColor.accent}; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                  <strong style="color: ${registerColor.badgeText};">📌 Register Note:</strong> ${letter.registerTip}
                </p>
              </div>

              <!-- German Letter -->
              <h2 style="color: #1e3a8a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">🇩🇪 Der Brief (German Letter)</h2>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; white-space: pre-line; font-size: 15px; line-height: 1.8; color: #1e293b;">${letter.letterGerman}</div>

              <!-- 🔊 Audio Notice for Letter -->
              <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🔊</span>
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                  <strong>Audio attached!</strong> Open the <code>day${dayNumber}_letter.mp3</code> attachment to hear this letter read aloud in natural German. Listen and repeat to improve your accent!
                </p>
              </div>

              <!-- English Translation -->
              <h2 style="color: #475569; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">🇬🇧 English Translation</h2>
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px; white-space: pre-line; font-size: 14px; line-height: 1.7; color: #334155; font-style: italic;">${letter.letterEnglish}</div>

              <!-- Key Phrases -->
              <h2 style="color: #1e3a8a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">🔑 Key Phrases to Memorise</h2>
              <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 10px 12px; color: #475569; font-weight: 700; text-align: left;">Phrase (DE)</th>
                      <th style="padding: 10px 12px; color: #475569; font-weight: 700; text-align: left;">Meaning (EN)</th>
                      <th style="padding: 10px 12px; color: #475569; font-weight: 700; text-align: left;">When to use</th>
                    </tr>
                  </thead>
                  <tbody>${keyPhrasesRows}</tbody>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 25px; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">Daily German B1 Tutor — Letter Practice</p>
              <p style="margin: 0;">Sie erhalten diese Email, um sich täglich auf Ihre telc B1 Deutschprüfung vorzubereiten.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text version of the letter email.
 */
export function generateLetterTextEmail(letter: DailyLetter, dayNumber: number): string {
  const keyPhrasesText = letter.keyPhrases
    .map((kp, i) => `${i + 1}. "${kp.phrase}"\n   → ${kp.meaning}\n   When: ${kp.usage}`)
    .join('\n\n');

  return `
=========================================
TAG ${dayNumber} • GERMAN LETTER PRACTICE
${letter.topic.toUpperCase()}
Register: ${letter.register.toUpperCase()}
=========================================

📌 REGISTER NOTE:
${letter.registerTip}

-----------------------------------------
🇩🇪 DER BRIEF (GERMAN LETTER):
-----------------------------------------
${letter.letterGerman}

-----------------------------------------
🇬🇧 ENGLISH TRANSLATION:
-----------------------------------------
${letter.letterEnglish}

-----------------------------------------
🔑 KEY PHRASES TO MEMORISE:
-----------------------------------------
${keyPhrasesText}

-----------------------------------------
Daily German B1 Tutor — Letter Practice
Sie erhalten diese Email, um sich täglich auf Ihre telc B1 Deutschprüfung vorzubereiten.
`;
}
