import React, { useState } from "react";
import { BookOpen, Table, FileText, CheckSquare, Lightbulb, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { Lesson } from "../lib/validation";

interface LessonPreviewProps {
  dayNumber: number;
  lesson: Lesson | null;
  loading: boolean;
  error: string | null;
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({
  dayNumber,
  lesson,
  loading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<"story" | "vocab" | "grammar" | "exercises" | "json">("story");
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="glass-card" style={{ minHeight: "350px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "15px" }}>
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Lektion {dayNumber} wird generiert...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ minHeight: "350px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "15px", border: "1px solid rgba(239,68,68,0.2)" }}>
        <p style={{ color: "#ef4444", fontSize: "16px", fontWeight: "600" }}>Ladefehler</p>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: "400px", fontSize: "14px" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="glass-card" style={{ minHeight: "350px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
        <BookOpen size={48} />
        <p style={{ fontSize: "16px", fontWeight: "600" }}>Keine Lektion geladen</p>
        <p style={{ fontSize: "14px", textAlign: "center" }}>
          Nutzt das Panel rechts, um eine Lektion für einen bestimmten Tag zu laden.
        </p>
      </div>
    );
  }

  // Format bolding in stories
  const renderGermanStory = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} style={{ color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", padding: "2px 6px", borderRadius: "4px" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="glass-card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
      
      {/* TABS SELECTOR */}
      <div style={{ 
        display: "flex", 
        overflowX: "auto", 
        backgroundColor: "rgba(15,23,42,0.4)", 
        borderBottom: "1px solid var(--border-glass)",
        padding: "0 10px"
      }}>
        <button 
          onClick={() => setActiveTab("story")}
          className="btn"
          style={{ 
            background: "none", 
            borderRadius: "0",
            borderBottom: activeTab === "story" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "story" ? "var(--primary)" : "var(--text-secondary)",
            padding: "16px 20px"
          }}
        >
          <BookOpen size={16} /> Story & Dialog
        </button>
        <button 
          onClick={() => setActiveTab("vocab")}
          className="btn"
          style={{ 
            background: "none", 
            borderRadius: "0",
            borderBottom: activeTab === "vocab" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "vocab" ? "var(--primary)" : "var(--text-secondary)",
            padding: "16px 20px"
          }}
        >
          <Table size={16} /> Wortschatz ({lesson.vocabulary.length})
        </button>
        <button 
          onClick={() => setActiveTab("grammar")}
          className="btn"
          style={{ 
            background: "none", 
            borderRadius: "0",
            borderBottom: activeTab === "grammar" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "grammar" ? "var(--primary)" : "var(--text-secondary)",
            padding: "16px 20px"
          }}
        >
          <Lightbulb size={16} /> Grammatik
        </button>
        <button 
          onClick={() => setActiveTab("exercises")}
          className="btn"
          style={{ 
            background: "none", 
            borderRadius: "0",
            borderBottom: activeTab === "exercises" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "exercises" ? "var(--primary)" : "var(--text-secondary)",
            padding: "16px 20px"
          }}
        >
          <CheckSquare size={16} /> Übungen
        </button>
        <button 
          onClick={() => setActiveTab("json")}
          className="btn"
          style={{ 
            background: "none", 
            borderRadius: "0",
            borderBottom: activeTab === "json" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "json" ? "var(--primary)" : "var(--text-secondary)",
            padding: "16px 20px"
          }}
        >
          <FileText size={16} /> Raw JSON
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div style={{ padding: "24px" }}>
        
        {/* HEADER BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", color: "var(--text-primary)" }}>{lesson.subject}</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>
              "{lesson.motivation}"
            </p>
          </div>
        </div>

        {/* 1. STORY TAB */}
        {activeTab === "story" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Review Banner if any */}
            {lesson.reviewWords && lesson.reviewWords.length > 0 && (
              <div style={{ 
                backgroundColor: "rgba(59, 130, 246, 0.08)", 
                borderLeft: "4px solid var(--primary)", 
                padding: "15px", 
                borderRadius: "6px" 
              }}>
                <h4 style={{ color: "#93c5fd", fontSize: "14px", marginBottom: "8px" }}>🔄 Spaced Repetition Review (Review vocabulary)</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {lesson.reviewWords.map((w, idx) => (
                    <span key={idx} className="badge badge-blue" style={{ fontSize: "11px" }}>
                      {w.article !== "—" ? `${w.article} ` : ""}{w.german} &rarr; {w.english}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* German story */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.4)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
              <h3 style={{ fontSize: "16px", color: "var(--primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                🇩🇪 Deutsch
              </h3>
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: "#e2e8f0", whiteSpace: "pre-line" }}>
                {renderGermanStory(lesson.storyGerman)}
              </p>
            </div>

            {/* English translation */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.2)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
              <h3 style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                🇬🇧 English Translation
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
                {lesson.translationEnglish}
              </p>
            </div>
            
            {/* telc exam tip */}
            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: "20px", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", color: "var(--success)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                🏆 telc Deutsch B1 Prüfungstipp
              </h3>
              <p style={{ fontSize: "14px", color: "#a7f3d0", lineHeight: "1.5" }}>
                {lesson.telcTip}
              </p>
            </div>
          </div>
        )}

        {/* 2. VOCAB TAB */}
        {activeTab === "vocab" && (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Wort</th>
                  <th style={{ textAlign: "center" }}>Artikel</th>
                  <th>Plural</th>
                  <th>English</th>
                  <th style={{ width: "40%" }}>Beispiel</th>
                </tr>
              </thead>
              <tbody>
                {lesson.vocabulary.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600" }}>{item.german}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${
                        item.article === "der" ? "badge-blue" :
                        item.article === "die" ? "badge-purple" :
                        item.article === "das" ? "badge-yellow" : "badge-secondary"
                      }`} style={{ fontSize: "10px" }}>
                        {item.article}
                      </span>
                    </td>
                    <td style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>{item.plural || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{item.english}</td>
                    <td style={{ fontSize: "13px", color: "var(--text-primary)" }}>{item.exampleGerman}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. GRAMMAR TAB */}
        {activeTab === "grammar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", padding: "20px", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "18px", color: "var(--accent)", marginBottom: "10px" }}>
                💡 {lesson.grammarFocus.title}
              </h3>
              <p style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "20px" }}>
                {lesson.grammarFocus.explanationEnglish}
              </p>

              <h4 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "10px" }}>Beispiele (Examples):</h4>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {lesson.grammarFocus.examples.map((ex, idx) => (
                  <li key={idx} style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                    <strong style={{ color: "#fef08a" }}>{ex.german}</strong>
                    <br />
                    <span style={{ color: "var(--text-secondary)" }}>{ex.english}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Daily challenge */}
            <div style={{ backgroundColor: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139,92,246,0.15)", padding: "20px", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", color: "var(--secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                🔥 Tages-Challenge (Homework)
              </h3>
              <p style={{ fontSize: "14px", color: "#ddd6fe", fontWeight: "600", lineHeight: "1.5" }}>
                {lesson.dailyChallenge}
              </p>
            </div>
          </div>
        )}

        {/* 4. EXERCISES TAB */}
        {activeTab === "exercises" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {lesson.exercises.map((ex, idx) => (
                <div key={idx} style={{ 
                  backgroundColor: "rgba(30, 41, 59, 0.3)", 
                  padding: "16px 20px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-glass)" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge badge-purple" style={{ fontSize: "10px" }}>Aufgabe {idx + 1}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Type: {ex.type}</span>
                  </div>
                  <p style={{ fontSize: "15px", color: "var(--text-primary)", marginTop: "10px", fontWeight: "500" }}>
                    {ex.question}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "20px", marginTop: "10px" }}>
              <button 
                onClick={() => setShowAnswers(!showAnswers)}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <HelpCircle size={16} /> {showAnswers ? "Lösungen verbergen" : "Lösungen anzeigen"}
              </button>

              {showAnswers && (
                <div style={{ 
                  backgroundColor: "rgba(16, 185, 129, 0.05)", 
                  border: "1px dashed rgba(16, 185, 129, 0.3)", 
                  borderRadius: "8px", 
                  padding: "16px 20px", 
                  marginTop: "15px" 
                }}>
                  <h4 style={{ color: "var(--success)", fontSize: "14px", marginBottom: "10px" }}>✅ Lösungen (Answers):</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {lesson.exercises.map((ex, idx) => (
                      <div key={idx} style={{ fontSize: "14px" }}>
                        <strong>Aufgabe {idx + 1}:</strong> <span style={{ color: "var(--text-primary)" }}>{ex.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. RAW JSON TAB */}
        {activeTab === "json" && (
          <pre style={{ 
            backgroundColor: "rgba(15, 23, 42, 0.8)", 
            color: "#38bdf8", 
            padding: "20px", 
            borderRadius: "10px", 
            overflow: "auto", 
            fontSize: "13px", 
            fontFamily: "monospace",
            maxHeight: "500px",
            border: "1px solid var(--border-glass)"
          }}>
            {JSON.stringify(lesson, null, 2)}
          </pre>
        )}

      </div>
    </div>
  );
};
