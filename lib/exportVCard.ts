import type { PersonResult } from "@/types";

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildVCard(person: PersonResult): string {
  const parts = person.name.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(person.name)}`,
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
  ];

  if (person.company) lines.push(`ORG:${escapeVCardValue(person.company)}`);
  if (person.careerCategory !== "Unknown") lines.push(`TITLE:${escapeVCardValue(person.careerCategory)}`);
  if (person.bestLinkedIn?.url) lines.push(`URL:${person.bestLinkedIn.url}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function exportToVCard(results: PersonResult[]): void {
  const vcfContent = results.map(buildVCard).join("\r\n");
  const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `composite-connect-${new Date().toISOString().slice(0, 10)}.vcf`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
