"use client";

/**
 * Client-side PDF text extraction using pdfjs-dist.
 * The worker is served from /public so it works offline too.
 */
export async function extractPdfText(
  file: File
): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await import("pdfjs-dist");

  // Use the locally served worker from /public — cached by service worker, works offline
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = (pdfjsLib as any).getDocument({
    data,
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
    throw new Error(
      `Could not extract text from "${file.name}". The PDF may be image-based or scanned — only text-based PDFs are supported.`
    );
  }

  return { text, pages: numPages };
}
