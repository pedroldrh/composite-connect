"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";

interface SearchProgressProps {
  current: number;
  total: number;
  currentName: string;
}

export function SearchProgress({
  current,
  total,
  currentName,
}: SearchProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Search className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-sm text-foreground">
            Searching for{" "}
            <span className="font-semibold text-primary animate-pulse">
              {currentName}
            </span>
            ...
          </p>
        </div>

        <Progress value={percentage} />

        <p className="text-xs text-muted-foreground text-center tabular-nums">
          {current} of {total} complete
        </p>
      </CardContent>
    </Card>
  );
}
