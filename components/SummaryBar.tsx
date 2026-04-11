"use client";

import { useMemo } from "react";
import type { PersonResult, CareerCategory } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Briefcase } from "lucide-react";

interface SummaryBarProps {
  results: PersonResult[];
}

export function SummaryBar({ results }: SummaryBarProps) {
  const highConfidence = useMemo(
    () => results.filter((r) => r.confidenceLabel === "High").length,
    [results]
  );

  const topIndustries = useMemo(() => {
    const counts: Partial<Record<CareerCategory, number>> = {};
    for (const r of results) {
      if (r.careerCategory !== "Unknown") {
        counts[r.careerCategory] = (counts[r.careerCategory] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
  }, [results]);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-semibold text-foreground">
              {results.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">High Confidence</span>
            <span className="text-sm font-semibold text-emerald-400">
              {highConfidence}
            </span>
          </div>

          {topIndustries.length > 0 && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Top Industries</span>
              <span className="text-sm font-medium text-foreground">
                {topIndustries.join(", ")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
