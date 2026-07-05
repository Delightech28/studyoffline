import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMMA_API_KEY ?? "";
const MODEL   = "gemma-4-31b-it";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function callGemma(prompt: string): Promise<string> {
  const body = {
    system_instruction: {
      parts: [{
        text: "You are StudyOffline, an AI study assistant for university students. Be concise, clear, and educational.",
      }],
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemma API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { content, filename } = (await req.json()) as {
      content: string;
      filename: string;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: "No content provided." }, { status: 400 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    // Truncate to avoid token limits — 8000 chars is ~2000 tokens
    const text = content.slice(0, 8000);

    // Run all three prompts in parallel for speed
    const [summaryRaw, conceptsRaw, questionsRaw] = await Promise.all([
      callGemma(
        `Here are lecture notes from "${filename}":\n\n${text}\n\n` +
        `Write a clear, student-friendly summary in 3-5 paragraphs. Use plain language.`
      ),
      callGemma(
        `Here are lecture notes from "${filename}":\n\n${text}\n\n` +
        `Extract the 8-12 most important key concepts. ` +
        `Return ONLY a plain list, one concept per line, starting each line with "- ". No headers, no extra text.`
      ),
      callGemma(
        `Here are lecture notes from "${filename}":\n\n${text}\n\n` +
        `Generate 5 practice questions a student might be tested on. ` +
        `Return ONLY the following format, exactly:\n` +
        `Q: [question]\nA: [answer]\n\n` +
        `Repeat for all 5 questions. No extra text.`
      ),
    ]);

    // Parse concepts — lines starting with "- "
    const concepts = conceptsRaw
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter((l) => l.length > 3);

    // Parse Q&A pairs
    const questions: { q: string; a: string }[] = [];
    const qaBlocks = questionsRaw.split(/\n\s*\n/).filter(Boolean);
    for (const block of qaBlocks) {
      const qMatch = block.match(/Q:\s*(.+)/i);
      const aMatch = block.match(/A:\s*([\s\S]+)/i);
      if (qMatch && aMatch) {
        questions.push({
          q: qMatch[1].trim(),
          a: aMatch[1].trim(),
        });
      }
    }

    return NextResponse.json({
      summary:   summaryRaw.trim(),
      concepts:  concepts.slice(0, 12),
      questions: questions.slice(0, 5),
    });
  } catch (err) {
    console.error("process-note error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
