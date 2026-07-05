/**
 * Shared Gemma API helper for StudyOffline.
 *
 * Key behaviours:
 *  - Sets thinkingBudget: 0 to suppress internal reasoning output server-side
 *  - Filters out any parts with thought === true as a client-side safety net
 *  - Retries once on transient 500 errors with a 2s delay
 */

const API_KEY = process.env.GEMMA_API_KEY ?? "";
const MODEL   = "gemma-4-31b-it";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT =
  "You are StudyOffline, an AI study assistant for university students. " +
  "Be concise, clear, and educational. Never show your reasoning or thinking process — only provide the final answer.";

interface GemmaOptions {
  maxOutputTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Call Gemma 4 and return only the final answer text,
 * with thought parts filtered out.
 */
export async function callGemma(
  prompt: string,
  options: GemmaOptions = {},
  attempt = 1
): Promise<string> {
  const {
    maxOutputTokens = 900,
    temperature = 0.4,
    systemPrompt = SYSTEM_PROMPT,
  } = options;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Single retry on Gemma internal errors
    if (res.status === 500 && attempt === 1) {
      await new Promise((r) => setTimeout(r, 2000));
      return callGemma(prompt, options, 2);
    }
    throw new Error(`Gemma API ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Extract only non-thought parts — filters out thought: true even if
  // thinkingBudget: 0 is ignored by older API versions
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts ?? [];

  const answerText = parts
    .filter((p) => p.thought !== true)
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  return answerText || "No response from AI.";
}
