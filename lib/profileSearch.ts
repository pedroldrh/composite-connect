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
    fraternity: string,
    compositeYear?: string
  ): Promise<ProfileCandidate[]> {
    // Simulate a short network delay
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 300));

    const seed = hashCode(name);
    const confidenceBucket = seed % 100;

    // ~15% of names return no good results
    if (confidenceBucket < 15) {
      return [];
    }

    const profiles: ProfileCandidate[] = [];
    const slug = slugify(name);

    // Determine career category for this mock person
    const categories = Object.keys(HEADLINES_BY_CATEGORY);
    const category = pick(categories, seed);
    const companyPool =
      category === "ib"
        ? COMPANIES.filter((c) =>
            ["Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "Evercore", "Lazard", "Centerview Partners", "Moelis & Company"].includes(c)
          )
        : category === "pe"
        ? COMPANIES.filter((c) =>
            ["KKR", "Blackstone", "Apollo Global Management", "Carlyle Group"].includes(c)
          )
        : category === "vc"
        ? COMPANIES.filter((c) =>
            ["Andreessen Horowitz", "Sequoia Capital", "Bessemer Venture Partners"].includes(c)
          )
        : category === "consulting"
        ? COMPANIES.filter((c) =>
            ["McKinsey & Company", "Boston Consulting Group", "Bain & Company", "Deloitte"].includes(c)
          )
        : category === "law"
        ? COMPANIES.filter((c) =>
            ["Kirkland & Ellis", "Wachtell Lipton", "Skadden Arps", "Cravath Swaine & Moore"].includes(c)
          )
        : category === "medicine"
        ? COMPANIES.filter((c) =>
            ["Johns Hopkins Hospital", "Mayo Clinic"].includes(c)
          )
        : COMPANIES;

    const company = pick(companyPool, seed + 1);
    const headlineTemplates = HEADLINES_BY_CATEGORY[category];
    const headline = pick(headlineTemplates, seed + 2).replace("{company}", company);
    const location = pick(LOCATIONS, seed + 3);
    const classYear = compositeYear ?? String(2020 + (seed % 6));

    // LinkedIn profile (most people have one)
    if (confidenceBucket >= 15) {
      const hasUniMention = confidenceBucket >= 40; // ~60% mention university
      profiles.push({
        platform: "LinkedIn",
        url: `https://www.linkedin.com/in/${slug}-${(seed % 900) + 100}`,
        title: `${name} - ${headline}`,
        snippet: hasUniMention
          ? `${university} alum. ${headline}. ${fraternity} member.`
          : `${headline}. Based in ${location}.`,
        company,
        headline,
        location,
        classYear: hasUniMention ? classYear : undefined,
      });
    }

    // Instagram profile (~50% have a findable one)
    if (seed % 2 === 0) {
      const handle = slug.replace(/-/g, "") + (seed % 100);
      profiles.push({
        platform: "Instagram",
        url: `https://www.instagram.com/${handle}`,
        title: `@${handle}`,
        snippet: `${name} | ${university} '${classYear.slice(-2)}`,
      });
    }

    // Facebook profile (~30% turn up)
    if (seed % 3 === 0 && confidenceBucket >= 30) {
      profiles.push({
        platform: "Facebook",
        url: `https://www.facebook.com/${slug}.${seed % 1000}`,
        title: name,
        snippet: `${university} - ${fraternity}`,
        location,
      });
    }

    // For medium-confidence results, add some ambiguity
    if (confidenceBucket >= 15 && confidenceBucket < 40) {
      // Reduce detail: remove university mentions, class year
      profiles.forEach((p) => {
        p.classYear = undefined;
        if (p.snippet) {
          p.snippet = p.snippet.replace(university, "").replace(fraternity, "").trim();
        }
      });
    }

    return profiles;
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

function parseSerperResults(results: SerperResult[], name: string): ProfileCandidate[] {
  const candidates: ProfileCandidate[] = [];
  const seenUrls = new Set<string>();

  for (const r of results) {
    if (!r.link) continue;
    // Skip irrelevant results
    if (r.link.includes("youtube.com") || r.link.includes("pinterest.com")) continue;

    const platform = detectPlatform(r.link);
    // LinkedIn-only: skip non-LinkedIn results
    if (platform !== "LinkedIn") continue;

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
      headline: platform === "LinkedIn" ? extractHeadline(title) : undefined,
      location: extractLocation(snippet),
      classYear: extractClassYear(fullText),
    });
  }

  return candidates;
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

/** Run a single search query and return parsed LinkedIn candidates */
async function runSearchQuery(query: string, name: string): Promise<ProfileCandidate[]> {
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error && data.results?.length === 0) return [];
    return parseSerperResults(data.results ?? [], name);
  } catch {
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
    fraternity: string,
    compositeYear?: string
  ): Promise<ProfileCandidate[]> {
    const allCandidates: ProfileCandidate[] = [];

    // --- Round 1: Direct search (plain query — this is what works for "Spencer Alascio") ---
    const round1Queries = [
      `${name} ${university} LinkedIn`,
      `"${name}" "${university}" site:linkedin.com/in`,
    ];

    for (const query of round1Queries) {
      const results = await runSearchQuery(query, name);
      allCandidates.push(...results);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    let deduped = deduplicateCandidates(allCandidates);
    if (deduped.length > 0) return deduped;

    // --- Round 2: Nickname expansions (Matt → Matthew, Tommy → Thomas) ---
    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const expansions = getNameExpansions(firstName);

    for (const formal of expansions) {
      const expandedName = [formal, ...parts.slice(1)].join(" ");
      const query = `${expandedName} ${university} LinkedIn`;
      const results = await runSearchQuery(query, expandedName);
      allCandidates.push(...results);
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Stop early if we found something
      deduped = deduplicateCandidates(allCandidates);
      if (deduped.length > 0) return deduped;
    }

    // --- Round 3: Last name + university fallback (for people who go by a different first name) ---
    const lastNameQuery = `"${lastName}" "${university}" site:linkedin.com/in`;
    const lastNameResults = await runSearchQuery(lastNameQuery, name);
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
  fraternity: string,
  compositeYear?: string
): Promise<ProfileCandidate[]> {
  return provider.searchProfiles(name, university, fraternity, compositeYear);
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
