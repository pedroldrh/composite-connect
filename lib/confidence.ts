/**
 * Confidence scoring for profile-to-person matching.
 * Evaluates multiple signals to determine how likely the found profiles
 * belong to the target person.
 */

import type { ProfileCandidate } from "@/types";

interface ConfidenceResult {
  score: number;
  label: "High" | "Medium" | "Low";
  reasoning: string[];
}

/**
 * Check if any text in the profile mentions a specific term (case-insensitive).
 */
function profileMentions(profile: ProfileCandidate, term: string): boolean {
  const lower = term.toLowerCase();
  const fields = [
    profile.title,
    profile.snippet,
    profile.headline,
    profile.company,
    profile.location,
  ];
  return fields.some((f) => f?.toLowerCase().includes(lower));
}

/**
 * Check if a class year roughly aligns with the composite year (within 2 years).
 */
function classYearAligns(profileYear: string | undefined, compositeYear: string | undefined): boolean {
  if (!profileYear || !compositeYear) return false;

  // Extract 4-digit year or 2-digit year from strings
  const extractYear = (s: string): number | null => {
    const fourDigit = s.match(/\b(19|20)\d{2}\b/);
    if (fourDigit) return parseInt(fourDigit[0], 10);
    const twoDigit = s.match(/\b\d{2}\b/);
    if (twoDigit) {
      const num = parseInt(twoDigit[0], 10);
      return num >= 50 ? 1900 + num : 2000 + num;
    }
    return null;
  };

  const pYear = extractYear(profileYear);
  const cYear = extractYear(compositeYear);

  if (pYear === null || cYear === null) return false;
  return Math.abs(pYear - cYear) <= 2;
}

/**
 * Check if the person's full name appears in any profile URL.
 */
function nameInUrl(name: string, profiles: ProfileCandidate[]): boolean {
  const nameParts = name.toLowerCase().split(/\s+/);
  return profiles.some((p) => {
    const urlLower = p.url.toLowerCase();
    return nameParts.every((part) => urlLower.includes(part));
  });
}

/**
 * Score the confidence that the found profiles belong to the named person.
 *
 * Scoring signals (0-100):
 * - +25 if any profile mentions the university
 * - +15 if fraternity appears in any profile
 * - +20 if a LinkedIn profile exists
 * - +10 if class year roughly aligns (within 2 years)
 * - +10 if company/title looks plausible (non-empty)
 * - +5  if exact full name appears in a profile URL
 * - +5  if an Instagram profile is found
 * - +10 if multiple sources corroborate the same identity
 *
 * Labels: High >= 80, Medium >= 50, Low < 50
 *
 * @param name - The person's full name
 * @param profiles - Found profile candidates
 * @param university - The university to check against
 * @param fraternity - The fraternity to check against
 * @param compositeYear - Optional composite/class year
 * @returns Confidence score, label, and reasoning array
 */
export function scoreConfidence(
  name: string,
  profiles: ProfileCandidate[],
  university: string,
  fraternity: string,
  compositeYear?: string
): ConfidenceResult {
  let score = 0;
  const reasoning: string[] = [];

  // No profiles at all = very low confidence
  if (profiles.length === 0) {
    return {
      score: 0,
      label: "Low",
      reasoning: ["No profiles found for this person."],
    };
  }

  // Signal 1: University mentioned in any profile (+25)
  const universityMentioned = profiles.some((p) => profileMentions(p, university));
  if (universityMentioned) {
    score += 25;
    reasoning.push(`University "${university}" found in profile data.`);
  }

  // Signal 2: Fraternity mentioned in any profile (+15)
  const fraternityMentioned = profiles.some((p) => profileMentions(p, fraternity));
  if (fraternityMentioned) {
    score += 15;
    reasoning.push(`Fraternity "${fraternity}" found in profile data.`);
  }

  // Signal 3: LinkedIn profile exists (+20)
  const hasLinkedIn = profiles.some((p) => p.platform === "LinkedIn");
  if (hasLinkedIn) {
    score += 20;
    reasoning.push("LinkedIn profile found.");
  }

  // Signal 4: Class year alignment (+10)
  const yearAligned = profiles.some((p) => classYearAligns(p.classYear, compositeYear));
  if (yearAligned) {
    score += 10;
    reasoning.push(`Class year aligns with composite year (${compositeYear}).`);
  }

  // Signal 5: Plausible company/title (+10)
  const hasCompanyOrTitle = profiles.some(
    (p) => (p.company && p.company.trim().length > 0) || (p.title && p.title.trim().length > 0)
  );
  if (hasCompanyOrTitle) {
    score += 10;
    reasoning.push("Company or professional title found in profile.");
  }

  // Signal 6: Full name in URL (+5)
  if (nameInUrl(name, profiles)) {
    score += 5;
    reasoning.push("Full name appears in a profile URL.");
  }

  // Signal 7: Instagram profile found (+5)
  const hasInstagram = profiles.some((p) => p.platform === "Instagram");
  if (hasInstagram) {
    score += 5;
    reasoning.push("Instagram profile found.");
  }

  // Signal 8: Multiple platforms corroborate identity (+10)
  const platforms = new Set(profiles.map((p) => p.platform));
  if (platforms.size >= 2) {
    score += 10;
    reasoning.push(`Multiple platforms (${Array.from(platforms).join(", ")}) corroborate identity.`);
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine label
  let label: "High" | "Medium" | "Low";
  if (score >= 80) {
    label = "High";
  } else if (score >= 50) {
    label = "Medium";
  } else {
    label = "Low";
  }

  return { score, label, reasoning };
}
