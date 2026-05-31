import React, { useState } from "react";
import { Play, ShieldAlert, Sparkles, Send, Eye, CheckCircle2, AlertCircle } from "lucide-react";

interface StatusCardProps {
  status: {
    dayNumber: number;
    topic: string;
    level: string;
    isGenerated: boolean;
    isSent: boolean;
  } | null;
  secret: string;
  setSecret: (val: string) => void;
  loading: boolean;
  onSendToday: () => Promise<void>;
  onSendTest: (day: number) => Promise<void>;
  onPreviewDay: (day: number) => void;
  todayError: string | null;
  todaySuccess: string | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  secret,
  setSecret,
  loading,
  onSendToday,
  onSendTest,
  onPreviewDay,
  todayError,
  todaySuccess,
}) => {
  const [testDay, setTestDay] = useState<number>(1);
  const [previewDayInput, setPreviewDayInput] = useState<number>(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  if (!status) {
    return (
      <div className="glass-card animate-pulse" style={{ padding: "40px", textAlign: "center" }}>
        <div className="loading-spinner" style={{ margin: "0 auto 15px auto" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Verbinde mit Serverless Engine...</p>
      </div>
    );
  }

  const handleManualSendToday = async () => {
    if (!secret) {
      setActionError("Bitte geben Sie das MANUAL_SEND_SECRET ein.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setLocalLoading(true);
    try {
      await onSendToday();
      setActionSuccess("Daily lesson email triggered successfully!");
    } catch (err: any) {
      setActionError(err.message || "Execution failed.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) {
      setActionError("Bitte geben Sie das MANUAL_SEND_SECRET ein.");
      return;
    }
    if (testDay < 1) {
      setActionError("Ungültige Tag-Nummer.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setLocalLoading(true);
    try {
      await onSendTest(testDay);
      setActionSuccess(`Test email for Day ${testDay} sent successfully!`);
    } catch (err: any) {
      setActionError(err.message || "Test dispatch failed.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewDayInput < 1) return;
    onPreviewDay(previewDayInput);
  };

  const syncPreviewInputToToday = () => {
    setPreviewDayInput(status.dayNumber);
    onPreviewDay(status.dayNumber);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* TODAY STATUS CARD */}
      <div className="glass-card" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
          <div>
            <span className="badge badge-blue">Status: Tag {status.dayNumber}</span>
            <h2 style={{ fontSize: "22px", marginTop: "8px", color: "var(--text-primary)" }}>
              Heute: {status.topic}
            </h2>
          </div>
          <span className="badge badge-purple" style={{ fontSize: "14px" }}>{status.level}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", margin: "20px 0", borderTop: "1px solid var(--border-glass)", paddingTop: "15px" }}>
          <div style={{ flex: "1 1 120px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color={status.isGenerated ? "var(--success)" : "var(--text-muted)"} />
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Generated</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: status.isGenerated ? "var(--success)" : "var(--text-muted)" }}>
                {status.isGenerated ? "Bereit im Cache" : "Noch nicht"}
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 120px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Send size={18} color={status.isSent ? "var(--success)" : "var(--text-muted)"} />
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>E-Mail Gesendet</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: status.isSent ? "var(--success)" : "var(--text-muted)" }}>
                {status.isSent ? "Gesendet" : "Wartend (06:00)"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
          <button 
            onClick={syncPreviewInputToToday}
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            disabled={loading || localLoading}
          >
            <Eye size={16} /> Lektion ansehen
          </button>
        </div>
      </div>

      {/* SECURITY SECRET BOX */}
      <div className="glass-card">
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <ShieldAlert size={18} color="var(--accent)" /> Admin-Authentifizierung
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
          Geben Sie das MANUAL_SEND_SECRET ein, um E-Mail-Aktionen freizuschalten.
        </p>
        <input
          type="password"
          placeholder="MANUAL_SEND_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="input-field"
          style={{ fontFamily: "monospace" }}
        />
      </div>

      {/* TRIGGER CONTROLS */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* MANUAL SEND TODAY */}
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Heute manuell senden
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Generiert und verschickt die Lektion für den heutigen Tag. Beachtet den Dubletten-Schutz!
          </p>
          <button
            onClick={handleManualSendToday}
            disabled={loading || localLoading || !secret}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {loading || localLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <Play size={16} /> Heute abschicken
              </>
            )}
          </button>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)" }} />

        {/* PREVIEW CUSTOM DAY */}
        <form onSubmit={handlePreviewSubmit}>
          <h4 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Beliebigen Tag vorschauen
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Generiert oder lädt Lektionen als Live-Vorschau ohne E-Mail-Versand.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              min="1"
              max="200"
              value={previewDayInput}
              onChange={(e) => setPreviewDayInput(parseInt(e.target.value))}
              className="input-field"
              style={{ width: "80px", textAlign: "center" }}
              disabled={loading || localLoading}
            />
            <button
              type="submit"
              disabled={loading || localLoading}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              <Eye size={16} /> Laden
            </button>
          </div>
        </form>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)" }} />

        {/* SEND CUSTOM TEST EMAIL */}
        <form onSubmit={handleSendTest}>
          <h4 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Test-E-Mail senden
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Schickt eine Test-Lektion für einen bestimmten Tag an Ihre E-Mail-Adresse.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              min="1"
              max="200"
              value={testDay}
              onChange={(e) => setTestDay(parseInt(e.target.value))}
              className="input-field"
              style={{ width: "80px", textAlign: "center" }}
              disabled={loading || localLoading || !secret}
            />
            <button
              type="submit"
              disabled={loading || localLoading || !secret}
              className="btn btn-primary"
              style={{ flex: 1, background: "linear-gradient(135deg, var(--secondary) 0%, #6d28d9 100%)" }}
            >
              <Send size={16} /> Test senden
            </button>
          </div>
        </form>

        {/* FEEDBACK OUTLETS */}
        {(actionError || todayError) && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            color: "#f87171", 
            padding: "12px", 
            borderRadius: "8px", 
            fontSize: "13px", 
            display: "flex", 
            alignItems: "flex-start", 
            gap: "8px" 
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Fehler:</strong> {actionError || todayError}
            </div>
          </div>
        )}

        {(actionSuccess || todaySuccess) && (
          <div style={{ 
            backgroundColor: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid rgba(16, 185, 129, 0.2)", 
            color: "#34d399", 
            padding: "12px", 
            borderRadius: "8px", 
            fontSize: "13px", 
            display: "flex", 
            alignItems: "flex-start", 
            gap: "8px" 
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Erfolg:</strong> {actionSuccess || todaySuccess}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
