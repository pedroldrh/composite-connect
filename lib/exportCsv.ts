import Papa from "papaparse";
import type { PersonResult } from "@/types";

export function exportToCsv(results: PersonResult[]): void {
  const rows = results.map((person) => ({
    Name: person.name,
    Company: person.company ?? "",
    "Career Category": person.careerCategory,
    "LinkedIn URL": person.bestLinkedIn?.url ?? "",
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `composite-connect-${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
