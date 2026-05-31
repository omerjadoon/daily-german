import React, { useState } from "react";
import { Sparkles, Library, Calendar, Search } from "lucide-react";

interface VocabularyItem {
  id: number;
  day_number: number;
  german: string;
  article: string;
  plural: string | null;
  english: string;
  example_german: string | null;
  review_count: number;
  next_review_at: string | null;
}

interface RecentVocabularyProps {
  vocabulary: VocabularyItem[];
  loading: boolean;
}

export const RecentVocabulary: React.FC<RecentVocabularyProps> = ({
  vocabulary,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredVocab = vocabulary.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.german.toLowerCase().includes(q) ||
      v.english.toLowerCase().includes(q) ||
      (v.plural && v.plural.toLowerCase().includes(q))
    );
  });

  const getArticleColor = (art: string) => {
    switch (art) {
      case "der": return "#60a5fa"; // blue
      case "die": return "#c084fc"; // purple
      case "das": return "#fbbf24"; // amber/yellow
      default: return "var(--text-muted)";
    }
  };

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return "Wartend";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="glass-card" style={{ border: "1px solid var(--border-glass)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <Library size={18} color="var(--secondary)" /> Meine Vokabeln (Spaced Repetition)
        </h3>

        {/* Search bar */}
        <div style={{ position: "relative", width: "200px" }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: "30px", paddingRight: "10px", height: "30px", fontSize: "12px" }}
          />
        </div>
      </div>

      {loading && vocabulary.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
        </div>
      ) : filteredVocab.length === 0 ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          {searchQuery ? "Keine Übereinstimmungen gefunden." : "Wortschatz ist noch leer. Starten Sie eine Lektion!"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "5px" }}>
          {filteredVocab.map((v) => (
            <div 
              key={v.id}
              style={{ 
                backgroundColor: "rgba(30, 41, 59, 0.2)", 
                border: "1px solid var(--border-glass)", 
                borderRadius: "10px", 
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-glass)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  {v.article !== "—" && (
                    <span style={{ 
                      fontSize: "11px", 
                      fontWeight: "800", 
                      color: getArticleColor(v.article),
                      textTransform: "uppercase"
                    }}>
                      {v.article}
                    </span>
                  )}
                  <span style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "15px" }}>
                    {v.german}
                  </span>
                  {v.plural && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                      ({v.plural})
                    </span>
                  )}
                </div>
                <span className="badge badge-blue" style={{ fontSize: "9px", padding: "2px 6px" }}>Tag {v.day_number}</span>
              </div>

              <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "500" }}>
                {v.english}
              </div>

              {v.example_german && (
                <div style={{ 
                  fontSize: "12px", 
                  color: "var(--text-secondary)", 
                  borderLeft: "2px solid var(--border-glass)", 
                  paddingLeft: "8px",
                  lineHeight: "1.4"
                }}>
                  {v.example_german}
                </div>
              )}

              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                fontSize: "11px", 
                color: "var(--text-muted)",
                borderTop: "1px dashed var(--border-glass)",
                paddingTop: "6px",
                marginTop: "2px"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={11} color="var(--accent)" /> Reps: {v.review_count}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={11} /> Nächste: {formatDate(v.next_review_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
