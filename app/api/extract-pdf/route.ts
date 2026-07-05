import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = (await req.json()) as {
      base64: string;
      filename: string;
    };

    if (!base64) {
      return NextResponse.json({ error: "No file data provided." }, { status: 400 });
    }

    const buffer = Buffer.from(base64, "base64");

    // Use pdfjs-dist legacy build — works in Node.js without a DOM/canvas/worker
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.cjs");

    // Disable the worker — we're running server-side
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const numPages: number = pdf.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as Array<{ str?: string }>)
        .map((item) => item.str ?? "")
        .join(" ");
      pageTexts.push(pageText);
    }

    const text = pageTexts.join("\n\n").trim();

    if (!text) {
      return NextResponse.json(
        {
          error: `Could not extract text from "${filename}". The PDF may be image-based or scanned.`,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, pages: numPages });
  } catch (err) {
    console.error("extract-pdf error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse PDF: ${message}` },
      { status: 500 }
    );
  }
}
