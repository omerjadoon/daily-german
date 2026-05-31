import React from "react";
import { Mail, CheckCircle2, RefreshCw } from "lucide-react";

interface SentLessonLog {
  day_number: number;
  email_to: string;
  subject: string;
  topic: string;
  level: string;
  sent_at: string;
  status: string;
}

interface RecentLessonsProps {
  logs: SentLessonLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const RecentLessons: React.FC<RecentLessonsProps> = ({
  logs,
  loading,
  onRefresh,
}) => {
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="glass-card" style={{ border: "1px solid var(--border-glass)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Mail size={18} color="var(--primary)" /> E-Mail Sendeprotokoll (Letzte 10)
        </h3>
        <button 
          onClick={onRefresh} 
          disabled={loading}
          className="btn btn-secondary" 
          style={{ padding: "6px 12px", fontSize: "12px", height: "30px" }}
        >
          <RefreshCw size={12} className={loading ? "animate-pulse" : ""} /> Aktualisieren
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          Keine Sendeaufzeichnungen gefunden. E-Mail-Tutor wartet auf ersten Start.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "center" }}>Tag</th>
                <th style={{ width: "60px", textAlign: "center" }}>Level</th>
                <th>Betreff / Thema</th>
                <th>Empfänger</th>
                <th>Gesendet am</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "700", textAlign: "center", color: "var(--primary)" }}>
                    {log.day_number}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="badge badge-purple" style={{ fontSize: "10px" }}>{log.level}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{log.subject}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Thema: {log.topic}</div>
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {log.email_to}
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {formatDate(log.sent_at)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`badge ${
                      log.status === "sent" ? "badge-green" : "badge-yellow"
                    }`} style={{ fontSize: "10px" }}>
                      {log.status === "sent" ? "Erfolgreich" : "Testversand"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
