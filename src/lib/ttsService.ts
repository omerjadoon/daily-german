/**
 * ttsService.ts
 *
 * German text-to-speech using Google Translate (tw-ob client endpoint).
 * Free, no API key needed, high reliability for German pronunciation.
 *
 * Usage:
 *   const mp3Base64 = await getGermanTtsBase64("Guten Morgen! Wie geht es Ihnen?");
 */

const TTS_CHUNK_MAX = 180; // Safe URL length per chunk

/**
 * Splits text into chunks <= TTS_CHUNK_MAX characters, breaking cleanly at sentence/punctuation boundaries.
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
 * Fetches one MP3 audio chunk from Google Translate TTS API (tw-ob client).
 */
async function fetchTtsChunk(text: string, signal?: AbortSignal): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`;

  const response = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Google TTS HTTP ${response.status} for text: "${text.slice(0, 30)}..."`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Converts German text string into an MP3 Buffer.
 * Returns null on any error so callers fail gracefully without crashing email delivery.
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

    console.log(`[TTS] Synthesising ${chunks.length} chunk(s) via Google Translate (tw-ob).`);

    // 5-second abort controller for parallel chunk fetching
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[TTS] Fetch timeout reached (5s), aborting chunk fetch.");
      controller.abort();
    }, 5000);

    try {
      const buffers = await Promise.all(
        chunks.map(chunk => fetchTtsChunk(chunk, controller.signal))
      );
      clearTimeout(timeoutId);

      const combined = Buffer.concat(buffers);
      console.log(`[TTS] German audio generated successfully: ${combined.length} bytes (${(combined.length / 1024).toFixed(1)} KB).`);
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
