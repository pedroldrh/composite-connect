/**
 * Canvas-based image quality analysis.
 * Draws the uploaded image onto an offscreen canvas and computes
 * resolution, brightness, and blur metrics.
 */

import type { ImageQualityResult, ImageQualityWarning, ImageQualityMetrics } from "@/types";

/**
 * Load a File as an HTMLImageElement via an object URL.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Compute average brightness (luminance 0-255) by sampling pixel data.
 * Uses the standard luminance formula: 0.299*R + 0.587*G + 0.114*B
 */
function computeBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let totalLuminance = 0;
  const pixelCount = data.length / 4;

  // Sample every 4th pixel for performance on large images
  const step = pixelCount > 250_000 ? 4 : 1;
  let sampled = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    sampled++;
  }

  return sampled > 0 ? totalLuminance / sampled : 0;
}

/**
 * Estimate image sharpness via a Laplacian variance approach.
 * Converts to grayscale, applies a 3x3 Laplacian kernel, and returns
 * the variance of the result. Higher values = sharper image.
 */
function computeBlurScore(imageData: ImageData, width: number, height: number): number {
  const data = imageData.data;

  // Build grayscale array
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4;
    gray[i] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }

  // Apply 3x3 Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
  const laplacianValues: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        gray[idx - width] +       // top
        gray[idx + width] +       // bottom
        gray[idx - 1] +           // left
        gray[idx + 1] -           // right
        4 * gray[idx];            // center
      laplacianValues.push(laplacian);
    }
  }

  if (laplacianValues.length === 0) return 0;

  // Compute variance of the Laplacian
  const mean = laplacianValues.reduce((a, b) => a + b, 0) / laplacianValues.length;
  const variance =
    laplacianValues.reduce((sum, val) => sum + (val - mean) ** 2, 0) / laplacianValues.length;

  return variance;
}

/**
 * Analyze an uploaded image file for quality issues.
 * Checks resolution, brightness, and blur; returns warnings and metrics.
 */
export async function analyzeImageQuality(file: File): Promise<ImageQualityResult> {
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas 2D context");
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const megapixels = (img.width * img.height) / 1_000_000;
  const brightness = computeBrightness(imageData);
  const blurScore = computeBlurScore(imageData, img.width, img.height);

  const metrics: ImageQualityMetrics = {
    width: img.width,
    height: img.height,
    brightness: Math.round(brightness),
    blurScore: Math.round(blurScore),
    megapixels: parseFloat(megapixels.toFixed(2)),
  };

  const warnings: ImageQualityWarning[] = [];

  // Resolution check: warn if under 1 megapixel
  if (img.width * img.height < 1_000_000) {
    warnings.push({
      type: "resolution",
      message: `Image resolution is low (${img.width}x${img.height}, ${metrics.megapixels}MP).`,
      suggestion: "Use a higher-resolution scan or photo for better OCR accuracy.",
    });
  }

  // Brightness check: warn if average luminance is below 60
  if (brightness < 60) {
    warnings.push({
      type: "brightness",
      message: `Image appears too dark (average brightness: ${metrics.brightness}/255).`,
      suggestion: "Try increasing exposure or using a better-lit scan of the composite.",
    });
  }

  // Blur check: warn if Laplacian variance is below 100
  if (blurScore < 100) {
    warnings.push({
      type: "blur",
      message: `Image may be blurry (sharpness score: ${metrics.blurScore}).`,
      suggestion: "Use a sharper image or re-scan the composite at higher quality.",
    });
  }

  // File size check: warn if over 20MB
  if (file.size > 20 * 1024 * 1024) {
    warnings.push({
      type: "size",
      message: `File is very large (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      suggestion: "Consider compressing the image to speed up processing.",
    });
  }

  // Pass if there are no critical warnings (blur and brightness are critical)
  const hasCritical = warnings.some((w) => w.type === "blur" || w.type === "brightness");

  return {
    pass: !hasCritical,
    warnings,
    metrics,
  };
}
