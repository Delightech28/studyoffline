import { NextRequest, NextResponse } from "next/server";
import { callGemma } from "@/lib/gemma";

export const maxDuration = 60; // Vercel Pro allows up to 300s; on Hobby this is capped at 10s

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

    // Short context + parallel calls — must complete within Vercel's timeout
    const text = content.slice(0, 3000);
    const opts = { maxOutputTokens: 600, temperature: 0.4 };

    // Run all 3 in parallel — 3x faster than sequential
    const [summaryRaw, conceptsRaw, questionsRaw] = await Promise.all([
      callGemma(
        `Notes from "${filename}":\n\n${text}\n\nSummarise in 2-3 short paragraphs. Plain language.`,
        opts
      ),
      callGemma(
        `Notes from "${filename}":\n\n${text}\n\nList 5-8 key concepts, one per line starting with "- ". No headers.`,
        opts
      ),
      callGemma(
        `Notes from "${filename}":\n\n${text}\n\nWrite 3 practice questions. Format exactly:\nQ: [question]\nA: [answer]\n\nRepeat for all 3.`,
        opts
      ),
    ]);

    // Parse concepts
    const concepts = conceptsRaw
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((l) => l.length > 3)
      .slice(0, 8);

    // Parse Q&A
    const questions: { q: string; a: string }[] = [];
    const blocks = questionsRaw.split(/\n\s*\n/).filter(Boolean);
    for (const block of blocks) {
      const q = block.match(/Q:\s*(.+)/i)?.[1]?.trim();
      const a = block.match(/A:\s*([\s\S]+)/i)?.[1]?.trim();
      if (q && a) questions.push({ q, a });
    }

    // Fallback line-by-line parser
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
      summary: summaryRaw.trim(),
      concepts,
      questions: questions.slice(0, 4),
    });
  } catch (err) {
    console.error("process-note error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
