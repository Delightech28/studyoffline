import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMMA_API_KEY ?? "";
const MODEL   = "gemma-4-31b-it";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/** Call Gemma with one retry on 500 errors */
async function callGemma(prompt: string, attempt = 1): Promise<string> {
  const body = {
    system_instruction: {
      parts: [{ text: "You are StudyOffline, an AI study assistant for university students. Be concise, clear, and educational." }],
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Retry once on Gemma internal errors (500) with a short delay
    if (res.status === 500 && attempt === 1) {
      await new Promise((r) => setTimeout(r, 2000));
      return callGemma(prompt, 2);
    }
    throw new Error(`Gemma API ${res.status}: ${errText}`);
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

    // Keep text short — Gemma 4 works best under 4000 chars per prompt
    // to avoid internal errors from context overflow
    const text = content.slice(0, 4000);

    // ── Sequential calls — avoids hammering the API simultaneously ────────────

    // 1. Summary
    const summaryRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `Write a clear, student-friendly summary in 3-5 short paragraphs. Plain language only.`
    );

    // 2. Key concepts
    const conceptsRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `List the 6-10 most important key concepts. ` +
      `Return ONLY a plain list, one item per line, each starting with "- ". No headers or extra text.`
    );

    // 3. Practice questions
    const questionsRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `Generate exactly 4 practice questions with answers. ` +
      `Use this exact format for each:\nQ: [question]\nA: [answer]\n\n` +
      `Output only the Q/A pairs, nothing else.`
    );

    // ── Parse concepts ────────────────────────────────────────────────────────
    const concepts = conceptsRaw
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((l) => l.length > 3)
      .slice(0, 10);

    // ── Parse Q&A pairs ───────────────────────────────────────────────────────
    const questions: { q: string; a: string }[] = [];

    // Try block-based parsing first (Q: ... \n\n A: ...)
    const qaBlocks = questionsRaw.split(/\n\s*\n/).filter(Boolean);
    for (const block of qaBlocks) {
      const qMatch = block.match(/Q:\s*(.+)/i);
      const aMatch = block.match(/A:\s*([\s\S]+)/i);
      if (qMatch && aMatch) {
        questions.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
      }
    }

    // Fallback: line-by-line parsing if block parsing found nothing
    if (questions.length === 0) {
      const lines = questionsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
      let current: { q?: string; a?: string } = {};
      for (const line of lines) {
        if (/^Q:/i.test(line)) {
          if (current.q && current.a) questions.push({ q: current.q, a: current.a });
          current = { q: line.replace(/^Q:\s*/i, "") };
        } else if (/^A:/i.test(line)) {
          current.a = line.replace(/^A:\s*/i, "");
        } else if (current.a) {
          current.a += " " + line;
        }
      }
      if (current.q && current.a) questions.push({ q: current.q, a: current.a });
    }

    return NextResponse.json({
      summary:   summaryRaw.trim(),
      concepts:  concepts,
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
