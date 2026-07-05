import { NextRequest, NextResponse } from "next/server";

const API_KEY   = process.env.GEMMA_API_KEY ?? "";
const MODEL     = "gemma-4-31b-it";
const API_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    const { question, context } = (await req.json()) as {
      question: string;
      context?: string; // optional note/PDF text
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    // Build the prompt
    const systemParts = [
      "You are StudyOffline, an AI study companion for university students.",
      "Give clear, concise explanations suitable for students.",
      "Use simple language, examples where helpful, and structure your answer with headings if it's long.",
      "Keep answers focused and educational.",
    ].join(" ");

    const userText = context
      ? `Context from lecture notes:\n\n${context.slice(0, 8000)}\n\nStudent question: ${question}`
      : question;

    const body = {
      system_instruction: { parts: [{ text: systemParts }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemma API error:", errText);
      return NextResponse.json(
        { error: `AI API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const answer: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Ask route error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
