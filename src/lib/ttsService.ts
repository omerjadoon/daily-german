/**
 * ttsService.ts
 *
 * German text-to-speech using ElevenLabs API (primary).
 * ElevenLabs free tier: 10,000 chars/month — sufficient for daily German lessons.
 * Set ELEVENLABS_API_KEY in your Netlify environment variables.
 *
 * If ELEVENLABS_API_KEY is not set, TTS is skipped (returns null silently).
 *
 * Usage:
 *   const mp3Buffer = await getGermanTtsBuffer("Guten Morgen! Wie geht es Ihnen?");
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

// German-capable ElevenLabs voice (can be overridden via env)
// Default: "Sarah" — a clear, natural German-capable multilingual voice
// Browse voices at: https://elevenlabs.io/voice-library
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

// Model: eleven_turbo_v2_5 — fastest multilingual model, supports German natively
const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

/**
 * Converts a German text string into an MP3 Buffer using ElevenLabs API.
 * Returns null on any error so callers can fail gracefully.
 *
 * @param text   German text to synthesise (any length, capped at 4500 chars)
 */
export async function getGermanTtsBuffer(text: string): Promise<Buffer | null> {
  if (!ELEVENLABS_API_KEY) {
    console.warn("[TTS] ELEVENLABS_API_KEY is not set. Skipping audio generation.");
    return null;
  }

  if (!text || text.trim().length === 0) return null;

  // Normalise whitespace and cap length to stay within free tier limits
  const normalised = text.replace(/\s+/g, " ").trim();
  const clipped = normalised.length > 4500 ? normalised.slice(0, 4500).trimEnd() + "." : normalised;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn("[TTS] ElevenLabs request timed out after 8s.");
    controller.abort();
  }, 8000);

  try {
    console.log(`[TTS] Requesting ElevenLabs synthesis for ${clipped.length} chars of German text.`);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: clipped,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`ElevenLabs TTS HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    console.log(`[TTS] Audio generated: ${buf.length} bytes (${(buf.length / 1024).toFixed(1)} KB).`);
    return buf;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[TTS] Failed to generate audio (non-fatal):", err?.message ?? err);
    return null;
  }
}

/**
 * Convenience: returns a base64 string suitable for Resend attachment `content`.
 * Returns null on failure.
 */
export async function getGermanTtsBase64(text: string): Promise<string | null> {
  const buf = await getGermanTtsBuffer(text);
  return buf ? buf.toString("base64") : null;
}
