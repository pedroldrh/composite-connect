"use client";

import type { PersonResult, CareerCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import { AlertCircle } from "lucide-react";

interface PersonCardProps {
  person: PersonResult;
  onToggleSelect: (id: string) => void;
}

const categoryColors: Partial<Record<CareerCategory, string>> = {
  "Investment Banking": "bg-blue-500/15 text-blue-400",
  "Private Equity": "bg-violet-500/15 text-violet-400",
  "Venture Capital": "bg-purple-500/15 text-purple-400",
  Consulting: "bg-cyan-500/15 text-cyan-400",
  Engineering: "bg-emerald-500/15 text-emerald-400",
  Marketing: "bg-pink-500/15 text-pink-400",
  Sales: "bg-orange-500/15 text-orange-400",
  "Startup / Founder": "bg-amber-500/15 text-amber-400",
  Law: "bg-slate-500/15 text-slate-300",
  Medicine: "bg-red-500/15 text-red-400",
  "Finance Other": "bg-indigo-500/15 text-indigo-400",
  Other: "bg-zinc-500/15 text-zinc-400",
  Unknown: "bg-zinc-500/10 text-zinc-500",
};

export function PersonCard({ person, onToggleSelect }: PersonCardProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl bg-card p-4 transition-colors",
        person.selected && "ring-1 ring-primary/40"
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={person.selected}
          onCheckedChange={() => onToggleSelect(person.id)}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-foreground">
            {person.name}
          </h3>
          <Badge
            className={cn(
              "border-0",
              categoryColors[person.careerCategory] ?? categoryColors.Unknown
            )}
          >
            {person.careerCategory}
          </Badge>
        </div>

        {person.bestLinkedIn?.headline && (
          <p className="truncate text-sm text-muted-foreground">
            {person.bestLinkedIn.headline}
          </p>
        )}

        {person.company && !person.bestLinkedIn?.headline && (
          <p className="text-sm text-muted-foreground">{person.company}</p>
        )}

        {person.noReliableMatch && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">No LinkedIn profile found</span>
          </div>
        )}

        {person.bestLinkedIn && (
          <a
            href={person.bestLinkedIn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#0A66C2] transition-colors hover:text-[#004182]"
          >
            <LinkedInIcon className="h-4 w-4" />
            View Profile
          </a>
        )}
      </div>
    </div>
  );
}
