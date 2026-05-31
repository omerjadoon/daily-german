import { useState, useEffect } from "react";
import { GraduationCap, Github, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { StatusCard } from "./components/StatusCard";
import { LessonPreview } from "./components/LessonPreview";
import { RecentLessons } from "./components/RecentLessons";
import { RecentVocabulary } from "./components/RecentVocabulary";
import { Lesson } from "./lib/validation";

export default function App() {
  // Config state
  const [secret, setSecret] = useState<string>(() => {
    return localStorage.getItem("MANUAL_SEND_SECRET") || "";
  });

  // State caches
  const [status, setStatus] = useState<any | null>(null);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [recentVocabulary, setRecentVocabulary] = useState<any[]>([]);
  
  // Preview focus state
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [previewDay, setPreviewDay] = useState<number>(1);

  // Loadings
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingVocab, setLoadingVocab] = useState(false);

  // Success / Error handlers
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorPreview, setErrorPreview] = useState<string | null>(null);
  const [todaySuccess, setTodaySuccess] = useState<string | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);

  // Persist secret in localStorage for user convenience
  const handleSetSecret = (val: string) => {
    setSecret(val);
    localStorage.setItem("MANUAL_SEND_SECRET", val);
  };

  // Fetch status of the daily tutor on load
  const fetchStatus = async () => {
    setLoadingStatus(true);
    setErrorStatus(null);
    try {
      const res = await fetch("/.netlify/functions/lesson-status");
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      setPreviewDay(data.dayNumber);
      
      // Auto-preview today's lesson
      fetchPreview(data.dayNumber);
    } catch (err: any) {
      console.error("Failed to load tutor status:", err);
      setErrorStatus("Verbindung fehlgeschlagen. Läuft 'netlify dev'?");
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch a preview of the lesson for a specific day
  const fetchPreview = async (dayNum: number) => {
    setLoadingPreview(true);
    setErrorPreview(null);
    try {
      const res = await fetch(`/.netlify/functions/preview-lesson?day=${dayNum}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setPreviewLesson(data.lesson);
      setPreviewDay(data.dayNumber);
    } catch (err: any) {
      console.error(`Failed to load preview for day ${dayNum}:`, err);
      setErrorPreview(`Lektion für Tag ${dayNum} konnte nicht geladen werden. ${err.message || err}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Fetch the sent email history log
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/.netlify/functions/recent-lessons");
      if (res.ok) {
        const data = await res.json();
        setRecentLessons(data);
      }
    } catch (err) {
      console.error("Failed to load email log:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch recently registered vocabulary items
  const fetchVocab = async () => {
    setLoadingVocab(true);
    try {
      const res = await fetch("/.netlify/functions/recent-vocabulary");
      if (res.ok) {
        const data = await res.json();
        setRecentVocabulary(data);
      }
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
    } finally {
      setLoadingVocab(false);
    }
  };

  // Trigger manual send of today's lesson
  const handleSendToday = async () => {
    setTodayError(null);
    setTodaySuccess(null);
    try {
      const res = await fetch("/.netlify/functions/send-today-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      
      if (data.alreadySent) {
        setTodayError(`E-Mail für Tag ${data.dayNumber} wurde heute bereits gesendet.`);
      } else {
        setTodaySuccess(`E-Mail erfolgreich gesendet! Provider ID: ${data.messageId}`);
      }
      
      // Refresh status & history logs
      fetchStatus();
      fetchLogs();
      fetchVocab();
    } catch (err: any) {
      setTodayError(err.message || "Manual send failed.");
      throw err;
    }
  };

  // Trigger test send for a selected day
  const handleSendTest = async (dayNum: number) => {
    setTodayError(null);
    setTodaySuccess(null);
    try {
      const res = await fetch("/.netlify/functions/send-test-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, day: dayNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setTodaySuccess(`Test email for Day ${dayNum} successfully sent!`);
      fetchLogs();
    } catch (err: any) {
      setTodayError(err.message || "Test send failed.");
      throw err;
    }
  };

  // Load everything on mount
  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchVocab();
  }, []);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      
      {/* HEADER SECTION */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "40px",
        borderBottom: "1px solid var(--border-glass)",
        paddingBottom: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)"
          }}>
            <GraduationCap size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", color: "var(--text-primary)" }} className="text-glow-primary">
              Daily German B1 Email Tutor
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Smarte, story-basierte E-Mails zur telc Deutsch B1 Prüfungsvorbereitung.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => { fetchStatus(); fetchLogs(); fetchVocab(); }} 
            className="btn btn-secondary"
            title="Dashboard aktualisieren"
          >
            <RefreshCw size={16} /> Sync
          </button>
        </div>
      </header>

      {/* CONNECTION ERROR OUTLET */}
      {errorStatus && (
        <div style={{ 
          backgroundColor: "rgba(239, 68, 68, 0.08)", 
          border: "1px solid rgba(239, 68, 68, 0.2)", 
          color: "#f87171", 
          padding: "16px 20px", 
          borderRadius: "12px", 
          marginBottom: "24px",
          display: "flex", 
          alignItems: "center", 
          gap: "10px" 
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Verbindungsfehler:</strong> {errorStatus} (Stellen Sie sicher, dass Sie <code>netlify dev</code> in der Konsole ausführen.)
          </div>
        </div>
      )}

      {/* DASHBOARD GRID SYSTEM */}
      <div className="dashboard-grid">
        
        {/* LEFT COLUMN: LESSON PREVIEW SCREEN */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "18px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={18} color="var(--primary)" /> Lektionsvorschau (Tag {previewDay})
            </h2>
            {loadingPreview && <span className="badge badge-blue">Generiere / Lade...</span>}
          </div>
          
          <LessonPreview 
            dayNumber={previewDay}
            lesson={previewLesson}
            loading={loadingPreview}
            error={errorPreview}
          />
        </section>

        {/* RIGHT COLUMN: ACTION CONTROLS & STATUS */}
        <aside>
          <StatusCard 
            status={status}
            secret={secret}
            setSecret={handleSetSecret}
            loading={loadingStatus}
            onSendToday={handleSendToday}
            onSendTest={handleSendTest}
            onPreviewDay={fetchPreview}
            todayError={todayError}
            todaySuccess={todaySuccess}
          />
        </aside>

      </div>

      {/* HISTORIES / LOGS FOOTER SECTION */}
      <footer style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginTop: "16px" }}>
        
        {/* Sent logs */}
        <RecentLessons 
          logs={recentLessons}
          loading={loadingLogs}
          onRefresh={fetchLogs}
        />

        {/* Vocabulary items */}
        <RecentVocabulary 
          vocabulary={recentVocabulary}
          loading={loadingVocab}
        />
        
      </footer>
      
      <div style={{ 
        textAlign: "center", 
        color: "var(--text-muted)", 
        fontSize: "12px", 
        marginTop: "40px", 
        borderTop: "1px solid var(--border-glass)", 
        paddingTop: "20px" 
      }}>
        Daily German B1 Email Tutor • Entwickelt für den schnellen telc B1 Erfolg
      </div>

    </div>
  );
}
