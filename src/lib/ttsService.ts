/**
 * ttsService.ts
 *
 * Free German text-to-speech using the Google Translate TTS endpoint.
 * No API key required. Splits long text into chunks ≤180 chars (the URL
 * length limit), fetches each as an MP3 Buffer, then concatenates them —
 * MP3 frames are self-contained so raw concatenation is a valid audio file.
 *
 * Usage:
 *   const mp3Buffer = await getGermanTtsBuffer("Guten Morgen! Wie geht es Ihnen?");
 *   // attach mp3Buffer to a Resend email as content: mp3Buffer.toString("base64")
 */

const TTS_MAX_CHUNK = 180;
const TTS_DELAY_MS  = 150; // polite delay between requests

/**
 * Splits text into chunks that each fit within TTS_MAX_CHUNK characters.
 * Tries to break at sentence endings (. ! ?), then at commas, then at spaces.
 */
function splitIntoChunks(text: string): string[] {
  // Normalise line breaks → spaces and collapse multiple spaces
  const normalised = text.replace(/\s+/g, " ").trim();

  // Tokenise at sentence boundaries first
  const rawSentences = normalised.match(/[^.!?\n]+[.!?]*/g) ?? [normalised];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of rawSentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (current.length + s.length + 1 <= TTS_MAX_CHUNK) {
      current = current ? `${current} ${s}` : s;
    } else {
      if (current) chunks.push(current);
      // Sentence itself might be too long — split on comma or space
      if (s.length <= TTS_MAX_CHUNK) {
        current = s;
      } else {
        // Force-split on whitespace
        const words = s.split(" ");
        current = "";
        for (const word of words) {
          if (current.length + word.length + 1 <= TTS_MAX_CHUNK) {
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

/** Tiny async sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches one MP3 chunk from Google Translate TTS.
 * Returns a Buffer or throws on HTTP error.
 */
async function fetchTtsChunk(text: string, signal?: AbortSignal): Promise<Buffer> {
  const url =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&tl=de&client=tw-ob&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    signal,
    headers: {
      // Mimic a browser to avoid 403s from the endpoint
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
      "Accept": "audio/mpeg, */*",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google TTS HTTP ${response.status} for chunk: "${text.slice(0, 40)}..."`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Converts a German text string into a single MP3 Buffer using Google TTS.
 * Returns null on any error so callers can fail gracefully.
 *
 * @param text   German text to synthesise (any length)
 * @param maxCharsTotal  Safety cap — skip TTS if text exceeds this (default 2000 chars)
 */
export async function getGermanTtsBuffer(
  text: string,
  maxCharsTotal = 2000
): Promise<Buffer | null> {
  try {
    if (!text || text.trim().length === 0) return null;

    // Guard against extremely long texts that would generate too many requests
    const clipped = text.length > maxCharsTotal
      ? text.slice(0, maxCharsTotal).trimEnd() + "."
      : text;

    const chunks = splitIntoChunks(clipped);
    if (chunks.length === 0) return null;

    console.log(`[TTS] Synthesising ${chunks.length} chunk(s) in parallel.`);

    // 5-second timeout — safe now that lesson generation is cached separately.
    // Lessons are loaded from DB in ~100ms, leaving ~8s for TTS + email send.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[TTS] Fetch timeout reached (5s), aborting all chunks.");
      controller.abort();
    }, 5000);

    try {
      const fetchPromises = chunks.map(chunk => fetchTtsChunk(chunk, controller.signal));
      const buffers = await Promise.all(fetchPromises);
      clearTimeout(timeoutId);
      
      const combined = Buffer.concat(buffers);
      console.log(`[TTS] Audio generated: ${combined.length} bytes.`);
      return combined;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[TTS] Failed to retrieve some chunks (non-fatal):", err?.message || err);
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
