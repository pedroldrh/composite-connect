"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Download,
  Contact,
  ExternalLink,
  CheckSquare,
  XSquare,
} from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportCsv: () => void;
  onExportVCard: () => void;
  onOpenLinkedIns: () => void;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onExportCsv,
  onExportVCard,
  onOpenLinkedIns,
}: BulkActionsProps) {
  const linkedInDisabled = selectedCount === 0 || selectedCount > 10;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{selectedCount}</span> of{" "}
        {totalCount} selected
      </span>

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          <CheckSquare className="h-4 w-4 mr-1" />
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={onDeselectAll}>
          <XSquare className="h-4 w-4 mr-1" />
          Deselect All
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExportCsv}
          disabled={selectedCount === 0}
        >
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExportVCard}
          disabled={selectedCount === 0}
        >
          <Contact className="h-4 w-4 mr-1" />
          Export vCard
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenLinkedIns}
                  disabled={linkedInDisabled}
                />
              }
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open LinkedIns
            </TooltipTrigger>
            {selectedCount > 10 && (
              <TooltipContent>
                Select 10 or fewer to open in new tabs
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
