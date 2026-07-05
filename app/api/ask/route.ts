import { NextRequest, NextResponse } from "next/server";
import { callGemma } from "@/lib/gemma";

export async function POST(req: NextRequest) {
  try {
    const { question, context } = (await req.json()) as {
      question: string;
      context?: string;
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (!process.env.GEMMA_API_KEY) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const userText = context
      ? `Context from lecture notes:\n\n${context.slice(0, 4000)}\n\nStudent question: ${question}`
      : question;

    const answer = await callGemma(userText, {
      maxOutputTokens: 1024,
      temperature: 0.7,
      systemPrompt:
        "You are StudyOffline, an AI study companion for university students. " +
        "Give clear, concise explanations in simple language. " +
        "Use examples where helpful. Structure long answers with headings. " +
        "Only provide the final answer — never show reasoning or thinking.",
    });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Ask route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
