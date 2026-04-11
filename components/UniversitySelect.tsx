"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchUniversities } from "@/lib/universities";
import { Search } from "lucide-react";

interface UniversitySelectProps {
  onSelect: (university: string) => void;
}

export function UniversitySelect({ onSelect }: UniversitySelectProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchUniversities(query), [query]);

  const trimmed = query.trim();
  const hasExactMatch = results.some(
    (u) => u.toLowerCase() === trimmed.toLowerCase()
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
          What university is this composite from?
        </h1>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search universities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-9 text-base"
            autoFocus
          />
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {results.map((university) => (
                <button
                  key={university}
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                  onClick={() => onSelect(university)}
                >
                  {university}
                </button>
              ))}

              {trimmed && !hasExactMatch && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60"
                  onClick={() => onSelect(trimmed)}
                >
                  Use &ldquo;{trimmed}&rdquo;
                </button>
              )}

              {results.length === 0 && !trimmed && (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No universities found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
