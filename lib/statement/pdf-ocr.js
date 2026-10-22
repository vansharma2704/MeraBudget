"use client";

// Reads a scanned (image-only) statement PDF in the browser: each page is rendered to an image and
// run through on-device OCR. Only the recognised text lines leave the device.
// Rendering uses PDFium (Chrome's PDF engine, WebAssembly): PDF.js skips the CCITT/fax text layers
// that many scanned bank statements are made of.

const MAX_PAGES = 15;
const SCALE = 3; // 3x of 72dpi ≈ 216dpi — sharp enough for small statement fonts

/** Render one page to a canvas (PDFium gives raw RGBA pixels). */
function toCanvas({ width, height, data }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width, height), 0, 0);
  return canvas;
}

/**
 * @param {File} file
 * @param {{ password?: string, onProgress?: (info: { page: number, pages: number, progress: number }) => void }} [opts]
 * @returns {Promise<string[]>} text lines in reading order
 */
export async function ocrStatementPdf(file, { password, onProgress } = {}) {
  const [{ PDFiumLibrary }, { createWorker }] = await Promise.all([
    import("@hyzyla/pdfium/browser/cdn"),
    import("tesseract.js"),
  ]);

  const library = await PDFiumLibrary.init({ disableCDNWarning: true });
  let document;
  try {
    document = await library.loadDocument(new Uint8Array(await file.arrayBuffer()), password || undefined);
  } catch {
    library.destroy();
    const e = new Error(password ? "Wrong PDF password" : "Could not open this PDF (is it password protected?)");
    e.code = "PDF_PASSWORD";
    throw e;
  }

  const pages = Math.min(document.getPageCount(), MAX_PAGES);
  let pageNo = 0;
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.({ page: pageNo, pages, progress: m.progress });
    },
  });
  try {
    // PSM 6 = one uniform block of text: keeps each table row on a single line
    await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    const lines = [];
    for (pageNo = 1; pageNo <= pages; pageNo++) {
      onProgress?.({ page: pageNo, pages, progress: 0 });
      const image = await document.getPage(pageNo - 1).render({ scale: SCALE, render: "bitmap" });
      const { data } = await worker.recognize(toCanvas(image));
      lines.push(...data.text.split("\n"));
    }
    return lines;
  } finally {
    await worker.terminate();
    document.destroy();
    library.destroy();
  }
}
