/**
 * ttsService.ts
 *
 * German text-to-speech engine using Google Translate (tw-ob client).
 * Features multi-domain fallback, text clipping (350 chars max for fast email delivery),
 * and strict error reporting.
 */

const TTS_CHUNK_MAX = 180;

const GOOGLE_DOMAINS = [
  "translate.google.com",
  "translate.google.de",
  "translate.google.co.uk",
];

/**
 * Splits text into clean chunks <= TTS_CHUNK_MAX characters on sentence/word boundaries.
 */
function splitIntoChunks(text: string): string[] {
  const normalised = text.replace(/[\*\_\#]/g, "").replace(/\s+/g, " ").trim();
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
 * Fetches a single MP3 chunk from Google Translate TTS with domain fallback.
 */
async function fetchTtsChunk(text: string, signal?: AbortSignal): Promise<Buffer> {
  let lastError: Error | null = null;

  for (const domain of GOOGLE_DOMAINS) {
    const url = `https://${domain}/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`;
    try {
      const response = await fetch(url, {
        signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": `https://${domain}/`,
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        if (buf.length > 500) { // Valid MP3 is > 500 bytes
          return buf;
        }
      }
      lastError = new Error(`Domain ${domain} returned HTTP ${response.status}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error(`All Google TTS domains failed for chunk: "${text.slice(0, 30)}..."`);
}

/**
 * Converts German text into a single MP3 Buffer.
 * Default maxCharsTotal = 350 ensures small email attachments & ultra-fast <1.5s generation.
 */
export async function getGermanTtsBuffer(
  text: string,
  maxCharsTotal = 350
): Promise<Buffer | null> {
  try {
    if (!text || text.trim().length === 0) return null;

    // Clean markdown formatting & clip length for fast serverless execution
    const cleaned = text.replace(/[\*\_\#]/g, "").trim();
    const clipped = cleaned.length > maxCharsTotal
      ? cleaned.slice(0, maxCharsTotal).trimEnd() + "."
      : cleaned;

    const chunks = splitIntoChunks(clipped);
    if (chunks.length === 0) return null;

    console.log(`[TTS] Synthesising ${chunks.length} chunk(s) (${clipped.length} chars) for German audio.`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[TTS] Fetch timeout reached (6s), aborting.");
      controller.abort();
    }, 6000);

    try {
      const buffers = await Promise.all(
        chunks.map(chunk => fetchTtsChunk(chunk, controller.signal))
      );
      clearTimeout(timeoutId);

      const combined = Buffer.concat(buffers);
      console.log(`[TTS] Success: ${combined.length} bytes (${(combined.length / 1024).toFixed(1)} KB) audio generated.`);
      return combined;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[TTS] Failed fetching audio chunks (non-fatal):", err?.message || err);
      return null;
    }
  } catch (err: any) {
    console.error("[TTS] Critical error in getGermanTtsBuffer:", err?.message || err);
    return null;
  }
}

/**
 * Returns base64 encoded MP3 string for email attachment.
 */
export async function getGermanTtsBase64(text: string): Promise<string | null> {
  const buf = await getGermanTtsBuffer(text);
  return buf ? buf.toString("base64") : null;
}
