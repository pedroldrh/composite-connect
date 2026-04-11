"use client";

import { useState } from "react";
import type { PersonResult, CareerCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

const confidenceColors: Record<string, string> = {
  High: "bg-emerald-500/15 text-emerald-400",
  Medium: "bg-amber-500/15 text-amber-400",
  Low: "bg-red-500/15 text-red-400",
};

export function PersonCard({ person, onToggleSelect }: PersonCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <Card className={cn("transition-colors", person.selected && "ring-primary/40")}>
      <CardContent>
        <div className="flex gap-3">
          <div className="pt-0.5">
            <Checkbox
              checked={person.selected}
              onCheckedChange={() => onToggleSelect(person.id)}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground truncate">
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
              <Badge
                className={cn(
                  "border-0",
                  confidenceColors[person.confidenceLabel]
                )}
              >
                {person.confidenceLabel}
              </Badge>
            </div>

            {person.bestLinkedIn?.headline && (
              <p className="text-sm text-muted-foreground truncate">
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
                className="inline-flex items-center gap-1.5 text-[#0A66C2] hover:text-[#004182] transition-colors text-sm"
              >
                <LinkedInIcon className="h-4 w-4" />
                View Profile
              </a>
            )}

            {person.reasoning.length > 0 && (
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowReasoning((v) => !v)}
                >
                  {showReasoning ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {showReasoning ? "Hide" : "Show"} reasoning
                </button>
                {showReasoning && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {person.reasoning.map((r, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground list-disc"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
