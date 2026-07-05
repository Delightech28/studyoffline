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

    if (!buffer.slice(0, 5).toString("ascii").startsWith("%PDF")) {
      return NextResponse.json(
        { error: "File does not appear to be a valid PDF." },
        { status: 422 }
      );
    }

    // Use the package root — pdfjs-dist exports getDocument + GlobalWorkerOptions
    // We cast to any to avoid deep-import type issues across environments
    // @ts-expect-error — pdfjs-dist types vary by build target
    const pdfjsLib = await import("pdfjs-dist");

    // Disable worker — server-side, no WorkerGlobalScope
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const data = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf: any = await loadingTask.promise;
    const numPages: number = pdf.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const lines: string[] = [];
      let currentLine = "";
      let lastY: number | null = null;

      for (const item of content.items as Array<{
        str: string;
        transform: number[];
        hasEOL?: boolean;
      }>) {
        const y = item.transform?.[5] ?? null;

        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine +=
            currentLine && item.str && !currentLine.endsWith(" ")
              ? " " + item.str
              : item.str;
        }

        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }

        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      pageTexts.push(lines.join("\n"));
    }

    const text = pageTexts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

    if (!text || text.length < 10) {
      return NextResponse.json(
        {
          error: `Could not extract text from "${filename}". The PDF may be image-based or scanned — only text-based PDFs are supported.`,
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
