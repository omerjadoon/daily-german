/**
 * ttsService.ts
 *
 * German text-to-speech using StreamElements TTS API (free, no API key).
 * Uses Amazon Polly "Marlene" — a high-quality German female voice.
 * StreamElements powers TTS for millions of Twitch streams globally.
 *
 * Usage:
 *   const mp3Buffer = await getGermanTtsBuffer("Guten Morgen! Wie geht es Ihnen?");
 */

const TTS_CHUNK_MAX = 200; // StreamElements safe URL length per chunk
const TTS_VOICE = "Marlene";   // German female (Amazon Polly via StreamElements)

/**
 * Splits text into chunks ≤ TTS_CHUNK_MAX characters, breaking at sentence/word boundaries.
 */
function splitIntoChunks(text: string): string[] {
  const normalised = text.replace(/\s+/g, " ").trim();
  const rawSentences = normalised.match(/[^.!?\n]+[.!?]*/g) ?? [normalised];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of rawSentences) {
    const s = sentence.trim();
    if (!s) continue;
    if (current.length + s.length + 1 <= TTS_CHUNK_MAX) {
      current = current ? `${current} ${s}` : s;
    } else {
      if (current) chunks.push(current);
      if (s.length <= TTS_CHUNK_MAX) {
        current = s;
      } else {
        const words = s.split(" ");
        current = "";
        for (const word of words) {
          if (current.length + word.length + 1 <= TTS_CHUNK_MAX) {
            current = current ? `${current} ${word}` : word;
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Fetches one MP3 chunk from StreamElements TTS.
 */
async function fetchTtsChunk(text: string, signal?: AbortSignal): Promise<Buffer> {
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${TTS_VOICE}&text=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DailyGermanBot/1.0)",
      "Accept": "audio/mpeg, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`StreamElements TTS HTTP ${response.status} for: "${text.slice(0, 40)}..."`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Converts a German text string into a single MP3 Buffer using StreamElements TTS.
 * Returns null on any error so callers can fail gracefully.
 */
export async function getGermanTtsBuffer(
  text: string,
  maxCharsTotal = 2000
): Promise<Buffer | null> {
  try {
    if (!text || text.trim().length === 0) return null;

    const clipped = text.length > maxCharsTotal
      ? text.slice(0, maxCharsTotal).trimEnd() + "."
      : text;

    const chunks = splitIntoChunks(clipped);
    if (chunks.length === 0) return null;

    console.log(`[TTS] Synthesising ${chunks.length} chunk(s) via StreamElements (voice: ${TTS_VOICE}).`);

    // Shared 7-second abort for all parallel chunk fetches
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[TTS] Fetch timeout reached (7s), aborting.");
      controller.abort();
    }, 7000);

    try {
      const buffers = await Promise.all(
        chunks.map(chunk => fetchTtsChunk(chunk, controller.signal))
      );
      clearTimeout(timeoutId);

      const combined = Buffer.concat(buffers);
      console.log(`[TTS] Audio generated: ${combined.length} bytes (${(combined.length / 1024).toFixed(1)} KB).`);
      return combined;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[TTS] Chunk fetch failed (non-fatal):", err?.message || err);
      return null;
    }
  } catch (err: any) {
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
