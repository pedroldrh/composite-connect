/**
 * Rule-based career classification from profile data.
 * Analyzes headlines, titles, companies, and snippets to determine
 * the most likely career category.
 */

import type { ProfileCandidate, CareerCategory } from "@/types";

/** Classification rule: keyword patterns mapped to career categories. */
interface ClassificationRule {
  category: CareerCategory;
  keywords: string[];
}

/**
 * Ordered list of classification rules.
 * More specific categories come first to prevent false positives
 * (e.g., "private equity" before generic "finance").
 */
const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    category: "Investment Banking",
    keywords: [
      "investment bank",
      "ib analyst",
      "ibd",
      "bulge bracket",
      "investment banking",
      "m&a analyst",
      "leveraged finance",
      "debt capital markets",
      "equity capital markets",
    ],
  },
  {
    category: "Private Equity",
    keywords: ["private equity", "buyout", "pe associate", "pe analyst", "lbo"],
  },
  {
    category: "Venture Capital",
    keywords: ["venture capital", "venture partner", "vc analyst", "vc associate", "seed stage"],
  },
  {
    category: "Startup / Founder",
    keywords: ["founder", "co-founder", "cofounder", "ceo", "startup", "entrepreneur"],
  },
  {
    category: "Consulting",
    keywords: [
      "consultant",
      "consulting",
      "mckinsey",
      "boston consulting",
      "bcg",
      "bain",
      "deloitte",
      "advisory",
      "strategy&",
      "accenture",
      "oliver wyman",
    ],
  },
  {
    category: "Law",
    keywords: [
      "attorney",
      "lawyer",
      "law firm",
      "jd candidate",
      "jd ",
      "legal",
      "litigation",
      "kirkland",
      "wachtell",
      "skadden",
      "cravath",
      "sullivan & cromwell",
      "davis polk",
    ],
  },
  {
    category: "Medicine",
    keywords: [
      "doctor",
      "physician",
      "md candidate",
      "medical student",
      "medical resident",
      "resident physician",
      "surgeon",
      "md ",
    ],
  },
  {
    category: "Engineering",
    keywords: [
      "engineer",
      "developer",
      "software",
      "swe",
      "programmer",
      "full-stack",
      "fullstack",
      "front-end",
      "frontend",
      "backend",
      "back-end",
      "devops",
      "machine learning",
      "data scientist",
    ],
  },
  {
    category: "Marketing",
    keywords: [
      "marketing",
      "brand manager",
      "brand strategist",
      "growth",
      "content strategist",
      "content manager",
      "digital marketing",
      "social media manager",
    ],
  },
  {
    category: "Sales",
    keywords: [
      "sales",
      "account executive",
      "business development",
      "bdr",
      "sdr",
      "sales representative",
      "sales manager",
      "revenue",
    ],
  },
  {
    category: "Finance Other",
    keywords: [
      "finance",
      "financial",
      "analyst",
      "trader",
      "portfolio",
      "asset management",
      "wealth management",
      "hedge fund",
      "quantitative",
      "risk analyst",
    ],
  },
];

/**
 * Collect all searchable text from a profile into a single lowercase string.
 */
function getProfileText(profile: ProfileCandidate): string {
  return [profile.headline, profile.title, profile.snippet, profile.company]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Extract a clean company name from the best LinkedIn profile.
 * Looks at the company field first, then parses the headline for "at {Company}" patterns.
 */
function extractCompany(profiles: ProfileCandidate[]): string | undefined {
  // Prefer the LinkedIn profile
  const linkedin = profiles.find((p) => p.platform === "LinkedIn");
  const target = linkedin ?? profiles[0];

  if (!target) return undefined;

  // Direct company field
  if (target.company && target.company.trim().length > 0) {
    return target.company.trim();
  }

  // Try to extract from headline: "Title at Company"
  if (target.headline) {
    const atMatch = target.headline.match(/\bat\s+(.+)$/i);
    if (atMatch) {
      // Clean up trailing punctuation or extra text
      return atMatch[1].replace(/[|,;].*$/, "").trim();
    }
  }

  // Try snippet
  if (target.snippet) {
    const atMatch = target.snippet.match(/\bat\s+([A-Z][A-Za-z\s&.,']+)/);
    if (atMatch) {
      return atMatch[1].replace(/[|,;].*$/, "").trim();
    }
  }

  return undefined;
}

/**
 * Classify a person's career category based on their profile data.
 *
 * Scans all profile text (headlines, titles, snippets, companies) against
 * keyword rules. Returns the first matching category in priority order,
 * or "Unknown" if no keywords match.
 *
 * @param profiles - The person's found profile candidates
 * @returns The career category and extracted company name
 */
export function classifyCareer(
  profiles: ProfileCandidate[]
): { category: CareerCategory; company: string | undefined } {
  if (profiles.length === 0) {
    return { category: "Unknown", company: undefined };
  }

  // Combine all profile text for matching
  const allText = profiles.map(getProfileText).join(" ");

  // Check rules in priority order
  for (const rule of CLASSIFICATION_RULES) {
    const matched = rule.keywords.some((keyword) => allText.includes(keyword));
    if (matched) {
      return {
        category: rule.category,
        company: extractCompany(profiles),
      };
    }
  }

  // Default: Unknown
  return {
    category: "Unknown",
    company: extractCompany(profiles),
  };
}
