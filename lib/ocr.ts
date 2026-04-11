/**
 * OCR processing using tesseract.js with image preprocessing.
 * Preprocesses the image (contrast, sharpen, upscale) before running OCR
 * to improve text extraction from composite photos.
 */

import { createWorker, PSM } from "tesseract.js";

/**
 * Preprocess an image for better OCR results on composite photos.
 * - Converts to grayscale
 * - Enhances contrast (adaptive thresholding approximation)
 * - Upscales small images to at least 2000px wide
 * - Sharpens the result
 */
async function preprocessImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const { width, height } = imageBitmap;

  // Upscale if needed — Tesseract works best with text at ~30px+ height
  const minWidth = 2000;
  const scale = width < minWidth ? minWidth / width : 1;
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  // Draw upscaled
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageBitmap, 0, 0, outW, outH);
  imageBitmap.close();

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, outW, outH);
  const data = imageData.data;

  // Convert to grayscale and enhance contrast
  for (let i = 0; i < data.length; i += 4) {
    // Luminance-weighted grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Simple contrast stretch: push values toward 0 or 255
    // This helps with composite photos where text is printed on a tinted background
    const contrast = 1.5;
    const midpoint = 128;
    let enhanced = (gray - midpoint) * contrast + midpoint;
    enhanced = Math.max(0, Math.min(255, enhanced));

    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply a simple sharpen via convolution
  // Re-read the enhanced data, apply unsharp mask approximation
  const enhanced = ctx.getImageData(0, 0, outW, outH);
  const sharpened = ctx.createImageData(outW, outH);
  const src = enhanced.data;
  const dst = sharpened.data;
  const w4 = outW * 4;

  for (let y = 1; y < outH - 1; y++) {
    for (let x = 1; x < outW - 1; x++) {
      const idx = (y * outW + x) * 4;
      for (let c = 0; c < 3; c++) {
        // 3x3 sharpen kernel: center=5, neighbors=-1
        const val =
          5 * src[idx + c] -
          src[idx - 4 + c] -
          src[idx + 4 + c] -
          src[idx - w4 + c] -
          src[idx + w4 + c];
        dst[idx + c] = Math.max(0, Math.min(255, val));
      }
      dst[idx + 3] = 255;
    }
  }

  ctx.putImageData(sharpened, 0, 0);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/png"
    );
  });
}

/**
 * Run OCR on an image file and return the extracted text.
 * Preprocesses the image first for better results on composite photos.
 *
 * @param file - The image file to process
 * @param onProgress - Optional callback for progress updates (0-1)
 * @returns The extracted text from the image
 */
export async function runOCR(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Preprocess the image for better OCR
  if (onProgress) onProgress(0.05);
  const processedBlob = await preprocessImage(file);
  if (onProgress) onProgress(0.15);

  const worker = await createWorker("eng", undefined, {
    logger: (info) => {
      if (info.status === "recognizing text" && onProgress) {
        // Scale OCR progress to 0.15-1.0 range (preprocessing takes first 15%)
        onProgress(0.15 + info.progress * 0.85);
      }
    },
  });

  try {
    // Configure for sparse text (composites have names scattered in a grid)
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    });

    const imageUrl = URL.createObjectURL(processedBlob);

    try {
      const result = await worker.recognize(imageUrl);
      return result.data.text;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } finally {
    await worker.terminate();
  }
}
