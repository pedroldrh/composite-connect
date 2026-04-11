/**
 * Name extraction and cleaning pipeline.
 * Takes raw OCR text and produces a list of clean, deduplicated names.
 */

import type { ExtractedName } from "@/types";

/** Noise keywords to filter out (case-insensitive) */
const NOISE_PATTERNS = [
  // Organizational / header text
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
  "executive",
  "board",
  "copyright",
  "all rights",
  "reserved",
  "established",
  "chartered",
  "brothers",
  "brotherhood",
  "tradition",
  "honor",

  // Greek letters (composite headers often spell these out)
  "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta",
  "iota", "kappa", "lambda", "sigma", "omega", "phi", "psi", "chi",
  "tau", "rho", "omicron", "upsilon", "mu", "nu", "xi", "pi",

  // Fraternity officer positions — these are NOT names
  "president",
  "vice president",
  "secretary",
  "treasurer",
  "social chair",
  "rush chair",
  "recruitment chair",
  "philanthropy chair",
  "scholarship chair",
  "historian",
  "chaplain",
  "marshal",
  "sergeant at arms",
  "sergeant-at-arms",
  "house manager",
  "risk manager",
  "new member educator",
  "pledge educator",
  "warden",
  "herald",
  "sentinel",
  "ritualist",
  "alumni relations",
  "public relations",
  "intramural",
  "athletics chair",
  "standards board",
  "judicial board",
  "corresponding secretary",
  "recording secretary",
  "number one",
  "number two",
  "number three",
  "number four",
  "number five",
  "eminent",
  "knight commander",
  "chapter advisor",
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
 * Check if a line looks like a real person's name.
 * Rejects OCR junk like "Sr E--", "—~—", single letters, etc.
 */
function looksLikeName(line: string): boolean {
  // Zero tolerance: if ANY weird symbol is present, reject immediately.
  // Only allow letters, spaces, periods, apostrophes, and hyphens.
  if (/[^A-Za-z\s'.\-]/.test(line)) return false;

  const cleaned = line.trim();

  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  // Must have exactly 2 or 3 words (first + last, or first + middle + last)
  if (words.length < 2 || words.length > 3) return false;

  // First and last word must be at least 2 letters (rejects "E", "Sr", "A")
  const first = words[0];
  const last = words[words.length - 1];
  if (first.replace(/['.]/g, "").length < 2) return false;
  if (last.replace(/['.]/g, "").length < 2) return false;

  // Middle word (if present) can be a single initial like "A." or "J"
  // but must be a letter
  if (words.length === 3) {
    const mid = words[1];
    if (!/^[A-Za-z][A-Za-z'.-]*$/.test(mid)) return false;
  }

  // Each word must be only letters (with optional apostrophe/period)
  return words.every((w) => /^[A-Za-z][A-Za-z'.]*$/.test(w));
}

/**
 * Common female first names to filter out.
 * Fraternity composites are all-male — any female name detected by OCR
 * is either misread text or a non-member label on the composite.
 */
const FEMALE_NAMES = new Set([
  "mary", "patricia", "jennifer", "linda", "elizabeth", "barbara", "susan",
  "jessica", "sarah", "karen", "nancy", "lisa", "betty", "margaret", "sandra",
  "ashley", "dorothy", "kimberly", "emily", "donna", "michelle", "carol",
  "amanda", "melissa", "deborah", "stephanie", "rebecca", "sharon", "laura",
  "cynthia", "kathleen", "amy", "angela", "shirley", "anna", "brenda",
  "pamela", "emma", "nicole", "helen", "samantha", "katherine", "christine",
  "debra", "rachel", "carolyn", "janet", "catherine", "maria", "heather",
  "diane", "ruth", "julie", "olivia", "joyce", "virginia", "victoria",
  "kelly", "lauren", "christina", "joan", "evelyn", "judith", "megan",
  "andrea", "cheryl", "hannah", "jacqueline", "martha", "gloria", "teresa",
  "ann", "sara", "madison", "frances", "kathryn", "janice", "jean",
  "abigail", "alice", "judy", "sophia", "grace", "denise", "amber",
  "doris", "marilyn", "danielle", "beverly", "isabella", "theresa", "diana",
  "natalie", "brittany", "charlotte", "marie", "kayla", "alexis", "lori",
  "alyssa", "brooke", "allison", "savannah", "sydney", "morgan", "taylor",
  "mackenzie", "jenna", "tiffany", "courtney", "paige", "claire", "molly",
  "lily", "haley", "shelby", "leah", "jasmine", "caroline", "gabrielle",
  "brianna", "bailey", "addison", "eleanor", "natasha", "adriana", "ariana",
  "vanessa", "alexandra", "cassandra", "tara", "kristen", "lindsey",
  "chelsea", "erin", "reagan", "sloane", "blair", "kendall", "avery",
]);

function isFemaleFirstName(name: string): boolean {
  const firstName = name.split(/\s+/)[0].toLowerCase();
  return FEMALE_NAMES.has(firstName);
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
      const cleaned = titleCase(trimmed);
      // Skip female names — fraternity composites are all-male
      if (isFemaleFirstName(cleaned)) continue;
      candidates.push({
        rawText: trimmed,
        cleanedName: cleaned,
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

/**
 * Extract the composite year from OCR text.
 * Looks for 4-digit years (2000-2099) that appear standalone or in patterns
 * like "20 18" (OCR often splits the year), "2018", "Class of 2018".
 * Returns the most likely composite year, or undefined if not found.
 */
export function extractCompositeYear(rawText: string): number | undefined {
  // First try: standard 4-digit year
  const fourDigit = rawText.match(/\b(20[0-2]\d)\b/g);
  if (fourDigit && fourDigit.length > 0) {
    // Pick the most common year found, or the first reasonable one
    const years = fourDigit.map(Number).filter((y) => y >= 2000 && y <= 2030);
    if (years.length > 0) {
      // Count occurrences, return the most frequent
      const counts: Record<number, number> = {};
      for (const y of years) counts[y] = (counts[y] ?? 0) + 1;
      const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
      return Number(sorted[0][0]);
    }
  }

  // Second try: OCR often splits "2018" as "20 18" or "20\n18"
  const splitYear = rawText.match(/20\s*(\d{2})\b/g);
  if (splitYear) {
    for (const match of splitYear) {
      const digits = match.replace(/\s/g, "");
      const year = parseInt(digits, 10);
      if (year >= 2000 && year <= 2030) return year;
    }
  }

  return undefined;
}
