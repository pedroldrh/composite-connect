"use client";

import { useState, useCallback } from "react";
import type { ExtractedName } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Undo2, FileText } from "lucide-react";

interface OcrReviewProps {
  names: ExtractedName[];
  onConfirm: (names: ExtractedName[]) => void;
  onBack: () => void;
}

export function OcrReview({ names: initialNames, onConfirm, onBack }: OcrReviewProps) {
  const [names, setNames] = useState<ExtractedName[]>(initialNames);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeNames = names.filter((n) => !n.excluded);

  const handleNameChange = useCallback((id: string, newValue: string) => {
    setNames((prev) =>
      prev.map((n) => (n.id === id ? { ...n, cleanedName: newValue } : n))
    );
  }, []);

  const toggleExclude = useCallback((id: string) => {
    setNames((prev) =>
      prev.map((n) => (n.id === id ? { ...n, excluded: !n.excluded } : n))
    );
  }, []);

  if (names.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              No names could be extracted
            </p>
            <p className="text-xs text-muted-foreground">
              Try uploading a clearer image.
            </p>
          </div>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Review Extracted Names</CardTitle>
          <Badge variant="secondary">{names.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="space-y-1">
          {names.map((name) => {
            const isEditing = editingId === name.id;
            const isExcluded = name.excluded;

            return (
              <div
                key={name.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                  isExcluded ? "opacity-40" : "hover:bg-muted/50"
                }`}
              >
                <span className="w-6 text-xs text-muted-foreground text-right shrink-0">
                  {name.sourceIndex + 1}
                </span>

                {isEditing && !isExcluded ? (
                  <Input
                    autoFocus
                    className="flex-1 h-7 text-sm"
                    value={name.cleanedName}
                    onChange={(e) => handleNameChange(name.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className={`flex-1 text-left text-sm ${
                      isExcluded
                        ? "line-through text-muted-foreground"
                        : "text-foreground cursor-text hover:text-primary"
                    }`}
                    onClick={() => {
                      if (!isExcluded) setEditingId(name.id);
                    }}
                    disabled={isExcluded}
                  >
                    {name.cleanedName}
                  </button>
                )}

                {isExcluded ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => toggleExclude(name.id)}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => toggleExclude(name.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <p className="text-sm text-muted-foreground text-center">
          {activeNames.length} name{activeNames.length !== 1 ? "s" : ""} ready for
          search
        </p>

        <div className="flex gap-3 pt-3 justify-center">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => onConfirm(names)} disabled={activeNames.length === 0}>
            Search Profiles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
