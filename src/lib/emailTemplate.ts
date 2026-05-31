import { Lesson } from "./validation";

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

              <!-- English Translation Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #475569; font-size: 16px;">🇬🇧 English Translation</h3>
                <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0; white-space: pre-line;">
                  ${lesson.translationEnglish}
                </p>
              </div>

              <!-- Vocabulary Section -->
              <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">📊 Wortschatz (Vocabulary)</h2>
              <div style="overflow-x: auto; margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; background-color: #ffffff;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">Wort</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700; text-align: center;">Artikel</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">Plural</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700;">English</th>
                      <th style="padding: 12px 10px; color: #475569; font-weight: 700; width: 40%;">Beispiel</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${vocabRows}
                  </tbody>
                </table>
              </div>

              <!-- Grammar Focus Section -->
              <div style="background-color: #fdf5e6; border: 1px solid #f5deb3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #b45309; margin-top: 0; font-size: 18px; border-bottom: 1px dashed #f5deb3; padding-bottom: 8px;">💡 Grammatik-Fokus: ${lesson.grammarFocus.title}</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #451a03; margin-top: 10px;">
                  ${lesson.grammarFocus.explanationEnglish}
                </p>
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

              <!-- Solutions Toggle/Answers Section -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 15px;">
                <h3 style="color: #475569; font-size: 16px; margin-top: 0; margin-bottom: 12px;">✅ Lösungen (Answers)</h3>
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; border: 1px dashed #cbd5e1;">
                  ${answerList}
                </div>
              </div>

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
        `${i + 1}. ${v.german} (${v.article}) ${v.plural ? "Plural: " + v.plural : ""}\n   English: ${v.english}\n   Beispiel: ${v.exampleGerman}`
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

-----------------------------------------
💡 GRAMMATIK-FOKUS: ${lesson.grammarFocus.title}
-----------------------------------------
${lesson.grammarFocus.explanationEnglish}

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
✅ LÖSUNGEN (ANSWERS):
-----------------------------------------
${answersText}

-----------------------------------------
Daily German B1 Tutor
Sie erhalten diese Email, um sich täglich auf Ihre telc B1 Deutschprüfung vorzubereiten.
Empfänger: ${process.env.EMAIL_TO || "omerkhanjadoons@gmail.com"}
`;
}
