/**
 * Search query construction for profile lookups.
 * Generates multiple query variations to maximize recall across search engines.
 */

/**
 * Common university name transformations.
 * Returns an array of aliases for the given university name.
 */
export function getUniversityAliases(university: string): string[] {
  const aliases = new Set<string>();
  const trimmed = university.trim();

  // Always include the original
  aliases.add(trimmed);

  // Handle "and" / "&" swaps
  if (trimmed.includes(" and ")) {
    aliases.add(trimmed.replace(/ and /gi, " & "));
  }
  if (trimmed.includes(" & ")) {
    aliases.add(trimmed.replace(/ & /gi, " and "));
  }

  // Add "University" suffix if not present
  const lower = trimmed.toLowerCase();
  if (!lower.includes("university") && !lower.includes("college") && !lower.includes("institute")) {
    aliases.add(`${trimmed} University`);
  }

  // Generate common abbreviations based on patterns
  const words = trimmed.split(/\s+/).filter((w) => !["of", "the", "and", "&"].includes(w.toLowerCase()));

  // Abbreviation from first letters of significant words (e.g., "W&L", "MIT", "USC")
  if (words.length >= 2) {
    const abbrev = words.map((w) => w.charAt(0).toUpperCase()).join("");
    if (abbrev.length >= 2 && abbrev.length <= 5) {
      aliases.add(abbrev);
    }
  }

  // Handle "and" in abbreviation form (e.g., "Washington and Lee" -> "W&L")
  if (trimmed.toLowerCase().includes(" and ")) {
    const parts = trimmed.split(/\s+and\s+/i);
    if (parts.length === 2) {
      const abbrevAnd = parts[0].charAt(0).toUpperCase() + "&" + parts[1].charAt(0).toUpperCase();
      aliases.add(abbrevAnd);
    }
  }

  // Handle "Saint" / "St." swaps
  if (lower.startsWith("saint ")) {
    aliases.add("St." + trimmed.slice(5));
  }
  if (lower.startsWith("st.") || lower.startsWith("st ")) {
    aliases.add("Saint" + trimmed.slice(trimmed.indexOf(" ")));
  }

  return Array.from(aliases);
}

/**
 * Extract a short abbreviation for use in broader queries.
 * Returns the most recognizable short form of the university name.
 */
function getShortAlias(university: string): string {
  const aliases = getUniversityAliases(university);
  // Prefer a short abbreviation (2-5 chars) if available
  const short = aliases.find((a) => a.length <= 5 && a.length >= 2 && a !== university.trim());
  return short ?? university.trim();
}

/**
 * Build an array of search query strings for finding a person's profiles.
 *
 * Generates 6 query variations:
 * 1. LinkedIn site-scoped with university
 * 2. General web search with university
 * 3. Full context with fraternity
 * 4. LinkedIn with university abbreviation
 * 5. Instagram-focused with university
 * 6. Broad recall query (no fraternity)
 *
 * @param name - Full name of the person to search
 * @param university - University name
 * @param fraternity - Fraternity/sorority name
 * @returns Array of search query strings
 */
export function buildSearchQueries(
  name: string,
  university: string,
  fraternity: string
): string[] {
  const shortAlias = getShortAlias(university);

  return [
    // 1. LinkedIn site-scoped search with full university name
    `"${name}" "${university}" site:linkedin.com/in`,

    // 2. General web search with university
    `"${name}" "${university}"`,

    // 3. Full context: name + university + fraternity
    `"${name}" "${university}" "${fraternity}"`,

    // 4. LinkedIn with abbreviated university name for broader matching
    `"${name}" LinkedIn "${shortAlias}"`,

    // 5. Instagram-focused search
    `"${name}" Instagram "${university}"`,

    // 6. Broad recall query without fraternity (catches career-focused profiles)
    `"${name}" "${university}"`,
  ];
}
