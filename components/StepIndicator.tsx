"use client";

import type { AppStep } from "@/types";
import { cn } from "@/lib/utils";
import { Upload, Shield, List, Search, BarChart, Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: AppStep;
  stepsCompleted: AppStep[];
}

const steps: { key: AppStep; label: string; icon: React.ReactNode }[] = [
  { key: "input", label: "Upload", icon: <Upload className="h-4 w-4" /> },
  {
    key: "quality-check",
    label: "Quality Check",
    icon: <Shield className="h-4 w-4" />,
  },
  { key: "ocr-review", label: "Review Names", icon: <List className="h-4 w-4" /> },
  { key: "searching", label: "Search", icon: <Search className="h-4 w-4" /> },
  { key: "results", label: "Results", icon: <BarChart className="h-4 w-4" /> },
];

export function StepIndicator({ currentStep, stepsCompleted }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto py-4">
      {steps.map((step, i) => {
        const isCompleted = stepsCompleted.includes(step.key);
        const isCurrent = currentStep === step.key;

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 transition-colors",
                  isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                )}
              />
            )}

            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-primary/20 text-primary",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  isCurrent
                    ? "text-foreground"
                    : isCompleted
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
