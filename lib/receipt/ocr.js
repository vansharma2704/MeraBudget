"use client";

// On-device receipt OCR: the photo is processed in the browser and never uploaded.
// Tesseract's engine + English model download once from the CDN and are cached by the browser.

const MAX_SIDE = 1600;

// Downscale big phone photos and convert to grayscale — faster and usually more accurate OCR
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1) contrast(1.15)";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
}

/**
 * @param {File} file
 * @param {(progress: number, status: string) => void} [onProgress] - progress 0..1
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function readReceipt(file, onProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => onProgress?.(m.progress ?? 0, m.status || ""),
  });
  try {
    const image = await prepareImage(file);
    const { data } = await worker.recognize(image);
    return { text: data.text || "", confidence: data.confidence || 0 };
  } finally {
    await worker.terminate();
  }
}
