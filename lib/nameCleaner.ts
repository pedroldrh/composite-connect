/**
 * Name extraction and cleaning pipeline.
 * Takes raw OCR text and produces a list of clean, deduplicated names.
 */

import type { ExtractedName } from "@/types";

/** Noise keywords to filter out (case-insensitive) */
const NOISE_PATTERNS = [
  "university",
  "fraternity",
  "chapter",
  "class of",
  "founded",
  "spring",
  "fall",
  "composite",
  "greek",
  "annual",
  "photo",
  "pledge",
  "rush",
  "semester",
  "member",
  "officers",
  "president",
  "vice president",
  "secretary",
  "treasurer",
  "executive",
  "board",
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "zeta",
  "eta",
  "theta",
  "iota",
  "kappa",
  "lambda",
  "sigma",
  "omega",
  "phi",
  "psi",
  "chi",
  "tau",
  "rho",
  "omicron",
  "upsilon",
  "copyright",
  "all rights",
  "reserved",
];

/**
 * Basic Levenshtein distance implementation for deduplication.
 */
function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Quick early exits
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Use a single-row DP approach for efficiency
  const row = Array.from({ length: bLen + 1 }, (_, i) => i);

  for (let i = 1; i <= aLen; i++) {
    let prev = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j] + 1,      // deletion
        prev + 1,        // insertion
        row[j - 1] + cost // substitution
      );
      row[j - 1] = prev;
      prev = val;
    }
    row[bLen] = prev;
  }

  return row[bLen];
}

/**
 * Generate a unique ID for each extracted name.
 */
function generateId(): string {
  return `name_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a line is predominantly numbers (more than 60% digits).
 * Lines that are mostly numbers are unlikely to be names.
 */
function isMostlyNumbers(line: string): boolean {
  const digits = line.replace(/\s/g, "").replace(/[^0-9]/g, "").length;
  const total = line.replace(/\s/g, "").length;
  return total > 0 && digits / total > 0.6;
}

/**
 * Check if a line matches a known noise pattern.
 */
function isNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  return NOISE_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Check if a line looks like a name (2-3 words, mostly letters).
 * Accepts patterns like "John Smith", "John A. Smith", "Mary-Jane O'Brien".
 * Also accepts looser patterns for OCR output that may have minor artifacts.
 */
function looksLikeName(line: string): boolean {
  // Strip common OCR artifacts (stray punctuation, extra spaces)
  const cleaned = line.replace(/[^A-Za-z\s'.,-]/g, "").trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  // Must have 2-4 words
  if (words.length < 2 || words.length > 4) return false;

  // Each word must be mostly letters (allow middle initials like "A.")
  return words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w));
}

/**
 * Title-case a name string (capitalize first letter of each word).
 */
function titleCase(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      // Handle middle initials like "A." - keep as-is if already capitalized
      if (word.length <= 2 && word.endsWith(".")) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Handle hyphenated names like "Mary-Jane"
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("-");
      }
      // Handle names with apostrophes like "O'Brien"
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("'");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Deduplicate names that are near-duplicates (Levenshtein distance < 3).
 * Keeps the first occurrence.
 */
function deduplicateNames(
  names: { rawText: string; cleanedName: string; sourceIndex: number }[]
): { rawText: string; cleanedName: string; sourceIndex: number }[] {
  const unique: typeof names = [];

  for (const name of names) {
    const isDuplicate = unique.some(
      (existing) =>
        levenshtein(
          existing.cleanedName.toLowerCase(),
          name.cleanedName.toLowerCase()
        ) < 3
    );
    if (!isDuplicate) {
      unique.push(name);
    }
  }

  return unique;
}

/**
 * Clean and extract names from raw OCR text.
 *
 * Pipeline:
 * 1. Split by newlines and trim
 * 2. Remove empty lines
 * 3. Filter out noise lines (headers, Greek letters, etc.)
 * 4. Filter out lines that are mostly numbers
 * 5. Keep lines matching name patterns
 * 6. Title-case names
 * 7. Deduplicate near-duplicates
 * 8. Assign unique IDs
 *
 * @param rawText - The raw OCR text output
 * @returns Array of cleaned, deduplicated extracted names
 */
export function cleanNames(rawText: string): ExtractedName[] {
  // Split on newlines, commas, semicolons, pipes — composite OCR often merges names
  const lines = rawText.split(/[\n,;|]+/);

  const candidates: { rawText: string; cleanedName: string; sourceIndex: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip noise lines (headers, organizational text)
    if (isNoiseLine(trimmed)) continue;

    // Skip lines that are mostly numbers
    if (isMostlyNumbers(trimmed)) continue;

    // Check if the line looks like a name
    if (looksLikeName(trimmed)) {
      candidates.push({
        rawText: trimmed,
        cleanedName: titleCase(trimmed),
        sourceIndex: i,
      });
    }
  }

  // Deduplicate near-duplicates
  const deduplicated = deduplicateNames(candidates);

  // Build final ExtractedName array with unique IDs
  return deduplicated.map((entry) => ({
    id: generateId(),
    rawText: entry.rawText,
    cleanedName: entry.cleanedName,
    sourceIndex: entry.sourceIndex,
  }));
}
