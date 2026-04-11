"use client";

import { useState, useMemo } from "react";
import type { PersonResult, CareerCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonCard } from "@/components/PersonCard";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import {
  Search,
  CheckSquare,
  XSquare,
  Download,
  Contact,
  RotateCcw,
} from "lucide-react";

interface ResultsViewProps {
  results: PersonResult[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportCsv: () => void;
  onExportVCard: () => void;
  onOpenLinkedIns: () => void;
  onStartOver: () => void;
}

const ALL_CATEGORIES: CareerCategory[] = [
  "Investment Banking",
  "Private Equity",
  "Venture Capital",
  "Consulting",
  "Engineering",
  "Marketing",
  "Sales",
  "Startup / Founder",
  "Law",
  "Medicine",
  "Finance Other",
  "Other",
  "Unknown",
];

export function ResultsView({
  results,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onExportCsv,
  onExportVCard,
  onOpenLinkedIns,
  onStartOver,
}: ResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Top industries
  const topIndustries = useMemo(() => {
    const counts = new Map<CareerCategory, number>();
    for (const r of results) {
      if (r.careerCategory !== "Unknown") {
        counts.set(r.careerCategory, (counts.get(r.careerCategory) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  }, [results]);

  // Categories present in results (for filter dropdown)
  const presentCategories = useMemo(() => {
    const cats = new Set(results.map((r) => r.careerCategory));
    return ALL_CATEGORIES.filter((c) => cats.has(c));
  }, [results]);

  // Filtered results
  const filtered = useMemo(() => {
    let list = results;

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.careerCategory === categoryFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.company && r.company.toLowerCase().includes(q))
      );
    }

    return list;
  }, [results, searchQuery, categoryFilter]);

  const selectedCount = results.filter((r) => r.selected).length;
  const totalCount = results.length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {totalCount} people found
        </h1>
        {topIndustries.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Top industries: {topIndustries.join(", ")}
          </p>
        )}
      </div>

      {/* Search and filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {presentCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">
          {selectedCount} of {totalCount} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          <CheckSquare className="h-4 w-4" data-icon="inline-start" />
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={onDeselectAll}>
          <XSquare className="h-4 w-4" data-icon="inline-start" />
          Deselect All
        </Button>
        <Button variant="secondary" size="sm" onClick={onExportCsv}>
          <Download className="h-4 w-4" data-icon="inline-start" />
          Export CSV
        </Button>
        <Button variant="secondary" size="sm" onClick={onExportVCard}>
          <Contact className="h-4 w-4" data-icon="inline-start" />
          Export vCard
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenLinkedIns}
          disabled={selectedCount > 10 || selectedCount === 0}
        >
          <LinkedInIcon className="h-4 w-4" />
          Open LinkedIns
        </Button>
      </div>

      {/* Person cards list */}
      <div className="space-y-2">
        {filtered.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onToggleSelect={onToggleSelect}
          />
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No results match your filters.
          </p>
        )}
      </div>

      {/* Start Over */}
      <div className="pt-4 text-center">
        <Button variant="ghost" onClick={onStartOver}>
          <RotateCcw className="h-4 w-4" data-icon="inline-start" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
