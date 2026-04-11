"use client";

import { useCallback } from "react";
import type { CareerCategory } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FiltersProps {
  careerCategories: CareerCategory[];
  onFilterChange: (filters: {
    career?: CareerCategory;
    confidence?: string;
    search?: string;
  }) => void;
  activeFilters: {
    career?: CareerCategory;
    confidence?: string;
    search?: string;
  };
}

export function Filters({
  careerCategories,
  onFilterChange,
  activeFilters,
}: FiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...activeFilters, search: e.target.value || undefined });
    },
    [onFilterChange, activeFilters]
  );

  const handleCareerChange = useCallback(
    (value: string | null) => {
      onFilterChange({
        ...activeFilters,
        career: !value || value === "__all__" ? undefined : (value as CareerCategory),
      });
    },
    [onFilterChange, activeFilters]
  );

  const handleConfidenceChange = useCallback(
    (value: string | null) => {
      onFilterChange({
        ...activeFilters,
        confidence: !value || value === "__all__" ? undefined : value,
      });
    },
    [onFilterChange, activeFilters]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or company..."
          className="pl-8"
          value={activeFilters.search ?? ""}
          onChange={handleSearchChange}
        />
      </div>

      <Select value={activeFilters.career ?? "__all__"} onValueChange={handleCareerChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Career Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Categories</SelectItem>
          {careerCategories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeFilters.confidence ?? "__all__"}
        onValueChange={handleConfidenceChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Confidence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
