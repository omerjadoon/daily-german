import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const defaultModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Warn if API key is missing, but don't crash on import so that seed scripts or other modules can import it cleanly
if (!apiKey) {
  console.warn("WARNING: GROQ_API_KEY is not defined in the environment variables.");
}

// Initializing the Groq Client
export const groq = new Groq({
  apiKey: apiKey || "dummy-key-for-now",
});

interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  model?: string;
  jsonMode?: boolean;
}

/**
 * Sends a prompt to the Groq API and returns the parsed JSON or raw string.
 * Uses JSON Mode for structural reliability when enabled.
 */
export async function generateContent(options: GenerateOptions): Promise<string> {
  const modelToUse = options.model || defaultModel;
  const temp = options.temperature !== undefined ? options.temperature : 0.2;

  try {
    const params: any = {
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: options.systemPrompt,
        },
        {
          role: "user",
          content: options.userPrompt,
        },
      ],
      temperature: temp,
    };

    // If jsonMode is requested, force Groq to return a valid JSON object
    if (options.jsonMode) {
      params.response_format = { type: "json_object" };
    }

    const completion = await groq.chat.completions.create(params);
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq API returned an empty completion response.");
    }

    return content;
  } catch (error) {
    console.error("Groq API Call Error:", error);
    throw error;
  }
}
