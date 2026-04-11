/**
 * CSV export using papaparse.
 * Generates and triggers a browser download of person results as CSV.
 */

import Papa from "papaparse";
import type { PersonResult } from "@/types";

/**
 * Export an array of PersonResult to a CSV file and trigger a browser download.
 *
 * Columns: Name, Company, Career Category, Confidence Score, Confidence Label,
 * LinkedIn URL, Instagram URL, Other URLs, Reasoning
 *
 * @param results - The person results to export
 */
export function exportToCsv(results: PersonResult[]): void {
  // Transform results into flat rows for CSV
  const rows = results.map((person) => ({
    Name: person.name,
    Company: person.company ?? "",
    "Career Category": person.careerCategory,
    "Confidence Score": person.confidenceScore,
    "Confidence Label": person.confidenceLabel,
    "LinkedIn URL": person.bestLinkedIn?.url ?? "",
    "Instagram URL": person.bestInstagram?.url ?? "",
    "Other URLs": person.profiles
      .filter((p) => p.platform !== "LinkedIn" && p.platform !== "Instagram")
      .map((p) => p.url)
      .join("; "),
    Reasoning: person.reasoning.join(" | "),
  }));

  // Generate CSV string using papaparse
  const csv = Papa.unparse(rows);

  // Trigger browser download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `composite-connect-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
