/**
 * Shared Gemma API helper for StudyOffline.
 *
 * Fallback chain: gemma-4-31b-it → gemma-4-26b-a4b-it → gemma-4-9b-it
 * Each model gets 3 retries with exponential backoff before moving to the next.
 * Thought parts (thought: true) are filtered from all responses.
 */

const API_KEY = process.env.GEMMA_API_KEY ?? "";

const MODEL_CHAIN = [
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
  "gemma-4-9b-it",
] as const;

function apiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
}

const SYSTEM_PROMPT =
  "You are StudyOffline, an AI study assistant for university students. " +
  "Be concise, clear, and educational. Only provide the final answer — never show internal reasoning.";

export interface GemmaOptions {
  maxOutputTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Call Gemma and return only the final answer text.
 * Tries each model in MODEL_CHAIN, retrying up to 3 times per model on 500s.
 */
export async function callGemma(
  prompt: string,
  options: GemmaOptions = {}
): Promise<string> {
  const {
    maxOutputTokens = 900,
    temperature = 0.4,
    systemPrompt = SYSTEM_PROMPT,
  } = options;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };

  let lastError = "";

  for (const model of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(apiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();

        // Filter out thought: true parts — keeps only the final answer
        const parts: Array<{ text?: string; thought?: boolean }> =
          data?.candidates?.[0]?.content?.parts ?? [];

        const answerText = parts
          .filter((p) => p.thought !== true)
          .map((p) => p.text ?? "")
          .join("")
          .trim();

        return answerText || "No response from AI.";
      }

      const errText = await res.text();
      lastError = `Gemma API ${res.status} (${model}): ${errText}`;

      // Only retry on transient 500s — hard errors (400, 401, 403) skip immediately
      if (res.status !== 500) break;

      if (attempt < 3) {
        const delay = attempt * 2000; // 2s, 4s
        console.warn(`[${model}] attempt ${attempt} failed, retrying in ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.warn(`[${model}] all 3 attempts failed, trying next model…`);
      }
    }
  }

  throw new Error(lastError || "All Gemma models failed.");
}
