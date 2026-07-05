import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = (await req.json()) as { base64: string; filename: string };

    if (!base64) {
      return NextResponse.json({ error: "No file data provided." }, { status: 400 });
    }

    // Decode base64 to Buffer
    const buffer = Buffer.from(base64, "base64");

    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        { error: `Could not extract text from "${filename}". The PDF may be image-based or scanned.` },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, pages: parsed.numpages });
  } catch (err) {
    console.error("extract-pdf error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. Make sure it is a valid text-based PDF." },
      { status: 500 }
    );
  }
}
