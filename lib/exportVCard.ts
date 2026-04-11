/**
 * vCard 3.0 export.
 * Generates a .vcf file containing contact cards for all matched persons
 * and triggers a browser download.
 */

import type { PersonResult } from "@/types";

/**
 * Escape special characters in vCard field values.
 * vCard 3.0 requires escaping commas, semicolons, and backslashes.
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Split a full name into first and last name parts for the N field.
 * Handles "First Last" and "First Middle Last" patterns.
 */
function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }
  // Last word is last name, everything else is first/middle
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

/**
 * Build a single vCard 3.0 string for one person.
 */
function buildVCard(person: PersonResult): string {
  const { first, last } = splitName(person.name);
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(person.name)}`,
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
  ];

  // Organization (company)
  if (person.company) {
    lines.push(`ORG:${escapeVCardValue(person.company)}`);
  }

  // Title (career category)
  if (person.careerCategory !== "Unknown") {
    lines.push(`TITLE:${escapeVCardValue(person.careerCategory)}`);
  }

  // URL: best LinkedIn profile
  if (person.bestLinkedIn?.url) {
    lines.push(`URL:${person.bestLinkedIn.url}`);
  }

  // NOTE: reasoning + all profile URLs
  const noteLines: string[] = [];
  if (person.reasoning.length > 0) {
    noteLines.push(`Confidence: ${person.confidenceLabel} (${person.confidenceScore}/100)`);
    noteLines.push(`Reasoning: ${person.reasoning.join("; ")}`);
  }
  if (person.profiles.length > 0) {
    noteLines.push("Profiles:");
    for (const profile of person.profiles) {
      noteLines.push(`  ${profile.platform}: ${profile.url}`);
    }
  }
  if (noteLines.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(noteLines.join("\n"))}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/**
 * Export an array of PersonResult to a vCard (.vcf) file and trigger download.
 * Creates a multi-contact .vcf file in vCard 3.0 format.
 *
 * Each card includes:
 * - FN: Full name
 * - N: Structured name (last;first)
 * - ORG: Company (if available)
 * - TITLE: Career category
 * - URL: Best LinkedIn URL
 * - NOTE: Reasoning, confidence, and all profile URLs
 *
 * @param results - The person results to export
 */
export function exportToVCard(results: PersonResult[]): void {
  // Build all vCards and join with blank line separators
  const vcfContent = results.map(buildVCard).join("\r\n");

  // Trigger browser download
  const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `composite-connect-contacts-${new Date().toISOString().slice(0, 10)}.vcf`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
