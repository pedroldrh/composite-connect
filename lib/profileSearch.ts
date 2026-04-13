/**
 * Profile search provider implementation.
 * Uses an adapter pattern so the mock provider can be swapped for a real API.
 */

import type { SearchProvider, ProfileCandidate } from "@/types";

// --------------------------------------------------------------------------
// Mock data pools for generating realistic fake results
// --------------------------------------------------------------------------

const COMPANIES = [
  "Goldman Sachs",
  "Morgan Stanley",
  "J.P. Morgan",
  "Evercore",
  "Lazard",
  "Centerview Partners",
  "Moelis & Company",
  "McKinsey & Company",
  "Boston Consulting Group",
  "Bain & Company",
  "Deloitte",
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Jane Street",
  "Citadel",
  "Two Sigma",
  "KKR",
  "Blackstone",
  "Apollo Global Management",
  "Carlyle Group",
  "Kirkland & Ellis",
  "Wachtell Lipton",
  "Skadden Arps",
  "Cravath Swaine & Moore",
  "Andreessen Horowitz",
  "Sequoia Capital",
  "Bessemer Venture Partners",
  "Johns Hopkins Hospital",
  "Mayo Clinic",
  "HubSpot",
  "Stripe",
  "Coinbase",
];

const HEADLINES_BY_CATEGORY: Record<string, string[]> = {
  ib: [
    "Investment Banking Analyst at {company}",
    "IBD Associate at {company}",
    "Analyst, Investment Banking Division at {company}",
  ],
  pe: [
    "Private Equity Associate at {company}",
    "Vice President at {company}",
    "PE Associate at {company}",
  ],
  vc: [
    "Associate at {company}",
    "Venture Capital Analyst at {company}",
    "Principal at {company}",
  ],
  consulting: [
    "Management Consultant at {company}",
    "Associate at {company}",
    "Senior Consultant at {company}",
  ],
  engineering: [
    "Software Engineer at {company}",
    "SWE at {company}",
    "Full-Stack Developer at {company}",
  ],
  law: [
    "Associate Attorney at {company}",
    "JD Candidate | Previously at {company}",
    "Litigation Associate at {company}",
  ],
  medicine: [
    "Medical Resident at {company}",
    "MD Candidate at {company}",
    "Physician at {company}",
  ],
  finance: [
    "Financial Analyst at {company}",
    "Trader at {company}",
    "Portfolio Analyst at {company}",
  ],
  marketing: [
    "Marketing Manager at {company}",
    "Growth Lead at {company}",
    "Brand Strategist at {company}",
  ],
  sales: [
    "Account Executive at {company}",
    "Business Development at {company}",
    "Sales Associate at {company}",
  ],
  founder: [
    "Co-Founder & CEO at {company}",
    "Founder at {company}",
    "Entrepreneur | Previously at {company}",
  ],
};

const LOCATIONS = [
  "New York, NY",
  "San Francisco, CA",
  "Washington, DC",
  "Boston, MA",
  "Chicago, IL",
  "Charlotte, NC",
  "Los Angeles, CA",
  "Dallas, TX",
  "Atlanta, GA",
  "Houston, TX",
  "Richmond, VA",
  "Nashville, TN",
];

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Simple seeded random from a string (for deterministic mock results per name) */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// --------------------------------------------------------------------------
// MockSearchProvider
// --------------------------------------------------------------------------

/**
 * Mock search provider that generates realistic-looking profile results.
 * Used for demo / development before plugging in a real search API.
 *
 * Distribution: ~60% high confidence, ~25% medium, ~15% low/no match.
 */
export class MockSearchProvider implements SearchProvider {
  async searchProfiles(
    name: string,
    university: string,
    _compositeYear?: number
  ): Promise<ProfileCandidate[]> {
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 300));

    const seed = hashCode(name);

    // ~15% of names return no results
    if (seed % 100 < 15) return [];

    const slug = slugify(name);
    const categories = Object.keys(HEADLINES_BY_CATEGORY);
    const category = pick(categories, seed);
    const companyPool =
      category === "ib"
        ? COMPANIES.filter((c) => ["Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "Evercore", "Lazard"].includes(c))
        : category === "pe"
        ? COMPANIES.filter((c) => ["KKR", "Blackstone", "Apollo Global Management", "Carlyle Group"].includes(c))
        : category === "consulting"
        ? COMPANIES.filter((c) => ["McKinsey & Company", "Boston Consulting Group", "Bain & Company", "Deloitte"].includes(c))
        : category === "law"
        ? COMPANIES.filter((c) => ["Kirkland & Ellis", "Wachtell Lipton", "Skadden Arps"].includes(c))
        : COMPANIES;

    const company = pick(companyPool, seed + 1);
    const headline = pick(HEADLINES_BY_CATEGORY[category], seed + 2).replace("{company}", company);
    const location = pick(LOCATIONS, seed + 3);

    return [{
      platform: "LinkedIn",
      url: `https://www.linkedin.com/in/${slug}-${(seed % 900) + 100}`,
      title: `${name} - ${headline}`,
      snippet: `${university} alum. ${headline}.`,
      company,
      headline,
      location,
    }];
  }
}

// --------------------------------------------------------------------------
// SerperSearchProvider — real Google search via /api/search proxy
// --------------------------------------------------------------------------

interface SerperResult {
  title?: string;
  link?: string;
  snippet?: string;
}

function detectPlatform(url: string): ProfileCandidate["platform"] {
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("twitter.com") || url.includes("x.com")) return "X";
  return "Other";
}

function extractCompanyFromSnippet(title: string, snippet: string): string | undefined {
  // Try "at {Company}" pattern from LinkedIn titles like "John Smith - Analyst at Goldman Sachs"
  const atMatch = (title + " " + snippet).match(/(?:at|@)\s+([A-Z][A-Za-z&.\s]+?)(?:\s*[-–|·]|\s*$)/);
  if (atMatch) return atMatch[1].trim();
  return undefined;
}

function extractHeadline(title: string): string | undefined {
  // LinkedIn titles are usually "Name - Headline - LinkedIn"
  const parts = title.split(/\s*[-–|]\s*/);
  if (parts.length >= 3 && title.toLowerCase().includes("linkedin")) {
    return parts.slice(1, -1).join(" - ").trim();
  }
  if (parts.length >= 2) {
    return parts[1]?.trim();
  }
  return undefined;
}

function extractClassYear(text: string): string | undefined {
  // Look for patterns like '24, '25, 2024, Class of 2024
  const match = text.match(/(?:class\s*of\s*|')\s*(\d{2,4})/i);
  if (match) {
    const year = match[1];
    return year.length === 2 ? `20${year}` : year;
  }
  return undefined;
}

function extractLocation(snippet: string): string | undefined {
  // Common city/state patterns
  const match = snippet.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})/);
  return match ? match[1] : undefined;
}

/**
 * Grad school indicators — if a different university appears near these keywords,
 * it's likely their grad school, NOT their undergrad. Don't reject.
 */
const GRAD_SCHOOL_KEYWORDS = [
  "mba", "jd", "md", "phd", "ph.d", "masters", "master's", "m.s.", "m.a.",
  "m.b.a.", "law school", "medical school", "business school", "graduate",
  "school of law", "school of medicine", "school of business",
  "school of engineering", "doctoral", "resident", "fellow",
];

/**
 * Check if a LinkedIn snippet/title mentions a different UNDERGRAD university.
 * Returns true only if a different university is mentioned AND it's clearly
 * an undergrad context (not grad school).
 *
 * Rules:
 * - If the target university is mentioned anywhere → keep (good match)
 * - If a different university is mentioned but near grad school keywords → keep
 *   (they probably did undergrad at target, grad school elsewhere)
 * - If a different university is mentioned with undergrad indicators
 *   (bachelor's, B.A., B.S., class of, alumnus) → reject (wrong person)
 * - If a different university is mentioned with no context → keep (inconclusive)
 */
function mentionsDifferentUniversity(text: string, targetUniversity: string): boolean {
  const lower = text.toLowerCase();
  const targetLower = targetUniversity.toLowerCase();

  // Build target fragments (e.g., "Washington and Lee" → ["washington", "lee"])
  const skipWords = new Set(["and", "the", "of", "at", "in", "university", "college", "state"]);
  const targetWords = targetLower
    .split(/[\s&]+/)
    .filter((w) => w.length > 2 && !skipWords.has(w));

  // If target university is mentioned → good, keep
  const targetMentioned = targetWords.some((w) => lower.includes(w));
  if (targetMentioned) return false;

  // Check if any university-like keyword exists
  const uniKeywords = ["university", "college", "institute of technology"];
  const hasOtherUni = uniKeywords.some((kw) => lower.includes(kw));
  if (!hasOtherUni) return false; // No university mentioned → inconclusive, keep

  // A different university IS mentioned. Check if it's grad school context.
  const isGradContext = GRAD_SCHOOL_KEYWORDS.some((kw) => lower.includes(kw));
  if (isGradContext) return false; // Likely grad school at the other uni → keep

  // Check if it's clearly an undergrad context at the OTHER university
  const undergradIndicators = [
    "bachelor", "b.a.", "b.s.", "b.b.a.", "b.sc.", "alumnus", "alumni", "alum",
    "class of", "undergraduate",
  ];
  const isUndergradContext = undergradIndicators.some((kw) => lower.includes(kw));
  if (isUndergradContext) return true; // Clearly did undergrad elsewhere → reject

  // Different university mentioned but no clear undergrad/grad context → keep (inconclusive)
  return false;
}

function parseSerperResults(results: SerperResult[], name: string, compositeYear?: number, university?: string): ProfileCandidate[] {
  const candidates: ProfileCandidate[] = [];
  const seenUrls = new Set<string>();

  for (const r of results) {
    if (!r.link) continue;

    // Only accept direct LinkedIn profile URLs (linkedin.com/in/...)
    // Skip search pages, company pages, posts, pub pages, etc.
    if (!r.link.includes("linkedin.com/in/")) continue;

    const platform: ProfileCandidate["platform"] = "LinkedIn";

    // Deduplicate by base URL
    const baseUrl = r.link.split("?")[0];
    if (seenUrls.has(baseUrl)) continue;
    seenUrls.add(baseUrl);

    const title = r.title ?? "";
    const snippet = r.snippet ?? "";
    const fullText = `${title} ${snippet}`;

    candidates.push({
      platform,
      url: baseUrl,
      title: title || undefined,
      snippet: snippet || undefined,
      company: extractCompanyFromSnippet(title, snippet),
      headline: extractHeadline(title),
      location: extractLocation(snippet),
      classYear: extractClassYear(fullText),
    });
  }

  let filtered = candidates;

  // Year filter: reject profiles where class year is 5+ years before composite
  if (compositeYear) {
    filtered = filtered.filter((c) => {
      if (!c.classYear) return true;
      const profileYear = parseInt(c.classYear, 10);
      if (isNaN(profileYear)) return true;
      return profileYear >= compositeYear - 5;
    });
  }

  // University filter: reject profiles that clearly attended a different university.
  // If no university is mentioned in the snippet, keep (inconclusive).
  // Only reject when a DIFFERENT university is explicitly mentioned.
  if (university) {
    filtered = filtered.filter((c) => {
      const text = `${c.title ?? ""} ${c.snippet ?? ""} ${c.headline ?? ""}`;
      return !mentionsDifferentUniversity(text, university);
    });
  }

  return filtered;
}

// Common nickname → formal name expansions
const NICKNAME_MAP: Record<string, string[]> = {
  matt: ["matthew"],
  tommy: ["thomas"],
  tom: ["thomas"],
  mike: ["michael"],
  mikey: ["michael"],
  rob: ["robert"],
  bob: ["robert"],
  bobby: ["robert"],
  robby: ["robert"],
  bill: ["william"],
  billy: ["william"],
  will: ["william"],
  willy: ["william"],
  liam: ["william"],
  jim: ["james"],
  jimmy: ["james"],
  jamie: ["james"],
  dan: ["daniel"],
  danny: ["daniel"],
  dave: ["david"],
  chris: ["christopher"],
  nick: ["nicholas"],
  nicky: ["nicholas"],
  rick: ["richard"],
  dick: ["richard"],
  rich: ["richard"],
  jack: ["john", "jackson"],
  johnny: ["john"],
  jon: ["jonathan", "john"],
  ben: ["benjamin"],
  benny: ["benjamin"],
  sam: ["samuel", "samantha"],
  sammy: ["samuel"],
  joe: ["joseph"],
  joey: ["joseph"],
  alex: ["alexander", "alexandra"],
  al: ["alexander", "albert", "alan"],
  andy: ["andrew"],
  drew: ["andrew"],
  steve: ["steven", "stephen"],
  pat: ["patrick", "patricia"],
  ed: ["edward", "edwin"],
  ted: ["theodore", "edward"],
  teddy: ["theodore"],
  charlie: ["charles"],
  chuck: ["charles"],
  tony: ["anthony"],
  jeff: ["jeffrey"],
  greg: ["gregory"],
  larry: ["lawrence"],
  harry: ["harold", "harrison"],
  hank: ["henry"],
  hal: ["harold", "henry"],
  walt: ["walter"],
  wes: ["wesley"],
  ken: ["kenneth"],
  kenny: ["kenneth"],
  tim: ["timothy"],
  timmy: ["timothy"],
  pete: ["peter"],
  ray: ["raymond"],
  phil: ["philip"],
  stu: ["stuart"],
  zach: ["zachary"],
  zack: ["zachary"],
  nate: ["nathan", "nathaniel"],
  max: ["maxwell", "maximilian"],
  jake: ["jacob"],
  josh: ["joshua"],
  conner: ["connor"],
  connor: ["conner"],
  coop: ["cooper"],
  cam: ["cameron"],
  ty: ["tyler"],
  trey: ["william", "charles"], // often a III nickname
  trip: ["william", "charles"], // often a III nickname
  chip: ["charles"],
  hart: ["hartwell", "hartley"],
  lee: ["robert lee", "william lee"],
};

/** Get formal name variants for a given first name */
function getNameExpansions(firstName: string): string[] {
  const lower = firstName.toLowerCase();
  return NICKNAME_MAP[lower] ?? [];
}

/** Thrown when the search API quota is exhausted */
export class QuotaExhaustedError extends Error {
  constructor() {
    super("quota_exhausted");
    this.name = "QuotaExhaustedError";
  }
}

/** Run a single search query and return parsed LinkedIn candidates */
async function runSearchQuery(query: string, name: string, compositeYear?: number, university?: string): Promise<ProfileCandidate[]> {
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (res.status === 429) {
      throw new QuotaExhaustedError();
    }

    if (!res.ok) return [];
    const data = await res.json();
    if (data.error === "quota_exhausted") throw new QuotaExhaustedError();
    if (data.error && data.results?.length === 0) return [];
    return parseSerperResults(data.results ?? [], name, compositeYear, university);
  } catch (err) {
    if (err instanceof QuotaExhaustedError) throw err;
    return [];
  }
}

/** Deduplicate candidates by URL */
function deduplicateCandidates(candidates: ProfileCandidate[]): ProfileCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.url.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Real search provider using Serper.dev via our /api/search proxy.
 * LinkedIn-only with multi-strategy fallback:
 * 1. Direct name search (plain Google query — most reliable)
 * 2. If no LinkedIn found: try nickname → formal name expansions
 * 3. If still nothing: try last name + university only
 */
export class SerperSearchProvider implements SearchProvider {
  async searchProfiles(
    name: string,
    university: string,
    compositeYear?: number
  ): Promise<ProfileCandidate[]> {
    const allCandidates: ProfileCandidate[] = [];
    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    // --- Round 1: Plain Google search — just the name + university ---
    // This is what a human would do: Google "John Smith Washington and Lee"
    // and click the first LinkedIn link. Most reliable for unique names.
    const googleQuery = `${name} ${university}`;
    const googleResults = await runSearchQuery(googleQuery, name, compositeYear, university);
    allCandidates.push(...googleResults);

    let deduped = deduplicateCandidates(allCandidates);
    if (deduped.length > 0) return deduped;

    // --- Round 2: LinkedIn-specific search ---
    await new Promise((resolve) => setTimeout(resolve, 80));
    const linkedinQuery = `"${name}" "${university}" site:linkedin.com/in`;
    const linkedinResults = await runSearchQuery(linkedinQuery, name, compositeYear, university);
    allCandidates.push(...linkedinResults);

    deduped = deduplicateCandidates(allCandidates);
    if (deduped.length > 0) return deduped;

    // --- Round 3: Broader LinkedIn search (no site: restriction) ---
    await new Promise((resolve) => setTimeout(resolve, 80));
    const broaderQuery = `"${name}" "${university}" LinkedIn`;
    const broaderResults = await runSearchQuery(broaderQuery, name, compositeYear, university);
    allCandidates.push(...broaderResults);

    deduped = deduplicateCandidates(allCandidates);
    if (deduped.length > 0) return deduped;

    // --- Round 4: Nickname expansions (Matt → Matthew, Tommy → Thomas) ---
    const expansions = getNameExpansions(firstName);

    for (const formal of expansions) {
      const expandedName = [formal, ...parts.slice(1)].join(" ");
      await new Promise((resolve) => setTimeout(resolve, 80));
      const results = await runSearchQuery(`${expandedName} ${university}`, expandedName, compositeYear, university);
      allCandidates.push(...results);

      deduped = deduplicateCandidates(allCandidates);
      if (deduped.length > 0) return deduped;
    }

    // --- Round 5: Last name + university fallback ---
    await new Promise((resolve) => setTimeout(resolve, 80));
    const lastNameResults = await runSearchQuery(`"${lastName}" "${university}" site:linkedin.com/in`, name, compositeYear, university);
    allCandidates.push(...lastNameResults);

    return deduplicateCandidates(allCandidates);
  }
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Search for profiles matching a given name using the provided search provider.
 */
export async function searchProfilesForName(
  provider: SearchProvider,
  name: string,
  university: string,
  compositeYear?: number
): Promise<ProfileCandidate[]> {
  return provider.searchProfiles(name, university, compositeYear);
}

/**
 * Check if a real search API key is configured by pinging the API route.
 */
let _hasRealSearch: boolean | null = null;
async function hasRealSearch(): Promise<boolean> {
  if (_hasRealSearch !== null) return _hasRealSearch;
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test" }),
    });
    const data = await res.json();
    _hasRealSearch = !data.error;
    return _hasRealSearch;
  } catch {
    _hasRealSearch = false;
    return false;
  }
}

/**
 * Factory function to get the active search provider.
 * Returns SerperSearchProvider if SERPER_API_KEY is configured, otherwise mock.
 */
export async function getSearchProvider(): Promise<SearchProvider> {
  const real = await hasRealSearch();
  if (real) return new SerperSearchProvider();
  return new MockSearchProvider();
}
