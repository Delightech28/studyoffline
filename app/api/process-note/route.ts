import { NextRequest, NextResponse } from "next/server";
import { callGemma } from "@/lib/gemma";

export async function POST(req: NextRequest) {
  try {
    const { content, filename } = (await req.json()) as {
      content: string;
      filename: string;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: "No content provided." }, { status: 400 });
    }
    if (!process.env.GEMMA_API_KEY) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    // Keep context short to avoid Gemma internal errors
    const text = content.slice(0, 4000);
    const opts = { maxOutputTokens: 900, temperature: 0.4 };

    // Sequential calls — avoids hammering the API simultaneously
    const summaryRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `Write a clear, student-friendly summary in 3-5 short paragraphs. Plain language only.`,
      opts
    );

    const conceptsRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `List the 6-10 most important key concepts. ` +
      `Return ONLY a plain list, one item per line, each starting with "- ". No headers or extra text.`,
      opts
    );

    const questionsRaw = await callGemma(
      `Lecture notes from "${filename}":\n\n${text}\n\n` +
      `Generate exactly 4 practice questions with answers. ` +
      `Use this exact format for each:\nQ: [question]\nA: [answer]\n\n` +
      `Output only the Q/A pairs, nothing else.`,
      opts
    );

    // ── Parse concepts ────────────────────────────────────────────────────────
    const concepts = conceptsRaw
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((l) => l.length > 3)
      .slice(0, 10);

    // ── Parse Q&A pairs ───────────────────────────────────────────────────────
    const questions: { q: string; a: string }[] = [];

    const qaBlocks = questionsRaw.split(/\n\s*\n/).filter(Boolean);
    for (const block of qaBlocks) {
      const qMatch = block.match(/Q:\s*(.+)/i);
      const aMatch = block.match(/A:\s*([\s\S]+)/i);
      if (qMatch && aMatch) {
        questions.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
      }
    }

    // Fallback line-by-line parsing
    if (questions.length === 0) {
      const lines = questionsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
      let cur: { q?: string; a?: string } = {};
      for (const line of lines) {
        if (/^Q:/i.test(line)) {
          if (cur.q && cur.a) questions.push({ q: cur.q, a: cur.a });
          cur = { q: line.replace(/^Q:\s*/i, "") };
        } else if (/^A:/i.test(line)) {
          cur.a = line.replace(/^A:\s*/i, "");
        } else if (cur.a) {
          cur.a += " " + line;
        }
      }
      if (cur.q && cur.a) questions.push({ q: cur.q, a: cur.a });
    }

    return NextResponse.json({
      summary:   summaryRaw.trim(),
      concepts,
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
