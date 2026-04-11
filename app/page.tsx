"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  UserInput,
  ExtractedName,
  PersonResult,
  CareerCategory,
  ImageQualityResult,
  AppStep,
} from "@/types";
import { analyzeImageQuality } from "@/lib/imageQuality";
import { runOCR } from "@/lib/ocr";
import { cleanNames } from "@/lib/nameCleaner";
import {
  getSearchProvider,
  searchProfilesForName,
} from "@/lib/profileSearch";
import { scoreConfidence } from "@/lib/confidence";
import { classifyCareer } from "@/lib/careerClassifier";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToVCard } from "@/lib/exportVCard";
import { getDemoNames, DEMO_INPUT } from "@/lib/demoData";

import { StepIndicator } from "@/components/StepIndicator";
import { InputForm } from "@/components/InputForm";
import { ImageQualityFeedback } from "@/components/ImageQualityFeedback";
import { OcrReview } from "@/components/OcrReview";
import { SearchProgress } from "@/components/SearchProgress";
import { SummaryBar } from "@/components/SummaryBar";
import { Filters } from "@/components/Filters";
import { BulkActions } from "@/components/BulkActions";
import { PersonCard } from "@/components/PersonCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCcw } from "lucide-react";

const ALL_CAREER_CATEGORIES: CareerCategory[] = [
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

export default function Home() {
  // Wizard state
  const [step, setStep] = useState<AppStep>("input");
  const [stepsCompleted, setStepsCompleted] = useState<AppStep[]>([]);

  // Data state
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [extractedNames, setExtractedNames] = useState<ExtractedName[]>([]);
  const [results, setResults] = useState<PersonResult[]>([]);

  // Progress state
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchCurrentName, setSearchCurrentName] = useState("");

  // Filter state
  const [filters, setFilters] = useState<{
    career?: CareerCategory;
    confidence?: string;
    search?: string;
  }>({});

  const completeStep = useCallback((s: AppStep) => {
    setStepsCompleted((prev) => (prev.includes(s) ? prev : [...prev, s]));
  }, []);

  // Step 1: Handle form submission → run quality check
  const handleFormSubmit = useCallback(
    async (input: UserInput, imageFile: File) => {
      setUserInput(input);
      setFile(imageFile);
      setStep("quality-check");
      setIsAnalyzingQuality(true);
      completeStep("input");

      try {
        const quality = await analyzeImageQuality(imageFile);
        setQualityResult(quality);
      } catch {
        // If quality check fails, let user continue anyway
        setQualityResult({
          pass: true,
          warnings: [],
          metrics: { width: 0, height: 0, brightness: 128, blurScore: 200, megapixels: 0 },
        });
      } finally {
        setIsAnalyzingQuality(false);
      }
    },
    [completeStep]
  );

  // Step 2: Quality check passed → run OCR
  const handleQualityContinue = useCallback(async () => {
    if (!file) return;
    completeStep("quality-check");
    setStep("ocr-review");
    setIsRunningOcr(true);
    setOcrProgress(0);

    try {
      const text = await runOCR(file, (p) => setOcrProgress(p));
      const names = cleanNames(text);
      setExtractedNames(names);
    } catch {
      setExtractedNames([]);
    } finally {
      setIsRunningOcr(false);
    }
  }, [file, completeStep]);

  // Step 2b: Retake → go back to input
  const handleRetake = useCallback(() => {
    setStep("input");
    setQualityResult(null);
    setFile(null);
  }, []);

  // Step 3: Names confirmed → run profile search
  const handleNamesConfirmed = useCallback(
    async (names: ExtractedName[]) => {
      if (!userInput) return;
      const activeNames = names.filter((n) => !n.excluded);
      if (activeNames.length === 0) return;

      completeStep("ocr-review");
      setStep("searching");
      setSearchTotal(activeNames.length);
      setSearchCurrent(0);

      const provider = await getSearchProvider();
      const personResults: PersonResult[] = [];

      for (let i = 0; i < activeNames.length; i++) {
        const name = activeNames[i].cleanedName;
        setSearchCurrentName(name);
        setSearchCurrent(i);

        const profiles = await searchProfilesForName(
          provider,
          name,
          userInput.university,
          userInput.fraternity,
          userInput.compositeYear
        );

        const { score, label, reasoning } = scoreConfidence(
          name,
          profiles,
          userInput.university,
          userInput.fraternity,
          userInput.compositeYear
        );

        const { category, company } = classifyCareer(profiles);

        const bestLinkedIn = profiles.find((p) => p.platform === "LinkedIn");
        const bestInstagram = profiles.find((p) => p.platform === "Instagram");

        personResults.push({
          id: activeNames[i].id,
          name,
          profiles,
          bestLinkedIn,
          bestInstagram,
          company,
          careerCategory: category,
          confidenceScore: score,
          confidenceLabel: label,
          reasoning,
          selected: label === "High",
          noReliableMatch: profiles.length === 0,
        });
      }

      setSearchCurrent(activeNames.length);
      setResults(personResults);
      completeStep("searching");
      setStep("results");
    },
    [userInput, completeStep]
  );

  // Results actions
  const toggleSelect = useCallback((id: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const selectAll = useCallback(() => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: false })));
  }, []);

  const handleExportCsv = useCallback(() => {
    const selected = results.filter((r) => r.selected);
    if (selected.length === 0) return;
    exportToCsv(selected);
  }, [results]);

  const handleExportVCard = useCallback(() => {
    const selected = results.filter((r) => r.selected);
    if (selected.length === 0) return;
    exportToVCard(selected);
  }, [results]);

  const handleOpenLinkedIns = useCallback(() => {
    const selected = results.filter((r) => r.selected && r.bestLinkedIn);
    if (selected.length === 0 || selected.length > 10) return;
    selected.forEach((r) => {
      if (r.bestLinkedIn) window.open(r.bestLinkedIn.url, "_blank");
    });
  }, [results]);

  const handleStartOver = useCallback(() => {
    setStep("input");
    setStepsCompleted([]);
    setUserInput(null);
    setFile(null);
    setQualityResult(null);
    setExtractedNames([]);
    setResults([]);
    setFilters({});
  }, []);

  // Demo mode: skip upload/OCR, load sample W&L names
  const handleDemo = useCallback(() => {
    setUserInput({
      university: DEMO_INPUT.university,
      fraternity: DEMO_INPUT.fraternity,
      compositeYear: DEMO_INPUT.compositeYear,
    });
    setExtractedNames(getDemoNames());
    completeStep("input");
    completeStep("quality-check");
    setStep("ocr-review");
  }, [completeStep]);

  // Filtered results
  const filteredResults = useMemo(() => {
    let filtered = results;
    if (filters.career) {
      filtered = filtered.filter((r) => r.careerCategory === filters.career);
    }
    if (filters.confidence) {
      filtered = filtered.filter((r) => r.confidenceLabel === filters.confidence);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.company && r.company.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [results, filters]);

  const selectedCount = results.filter((r) => r.selected).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CompositeConnect
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Upload a fraternity composite, extract names, and discover public
            profiles and career paths.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} stepsCompleted={stepsCompleted} />

        {/* Step content */}
        <div className="mt-6 space-y-6">
          {/* Step 1: Input form */}
          {step === "input" && (
            <div className="space-y-4">
              <InputForm onSubmit={handleFormSubmit} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDemo}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Try demo with sample W&L names
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Quality check */}
          {step === "quality-check" && (
            <div className="w-full max-w-lg mx-auto space-y-4">
              {isAnalyzingQuality ? (
                <div className="text-center space-y-3 py-8">
                  <p className="text-sm text-muted-foreground">
                    Analyzing image quality...
                  </p>
                  <Progress value={50} className="w-48 mx-auto" />
                </div>
              ) : qualityResult ? (
                <ImageQualityFeedback
                  result={qualityResult}
                  onContinue={handleQualityContinue}
                  onRetake={handleRetake}
                />
              ) : null}
            </div>
          )}

          {/* Step 3: OCR review */}
          {step === "ocr-review" && (
            <div className="w-full max-w-lg mx-auto space-y-4">
              {isRunningOcr ? (
                <div className="text-center space-y-3 py-8">
                  <p className="text-sm text-muted-foreground">
                    Extracting names from composite...
                  </p>
                  <Progress
                    value={Math.round(ocrProgress * 100)}
                    className="w-64 mx-auto"
                  />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(ocrProgress * 100)}%
                  </p>
                </div>
              ) : (
                <OcrReview
                  names={extractedNames}
                  onConfirm={handleNamesConfirmed}
                  onBack={handleRetake}
                />
              )}
            </div>
          )}

          {/* Step 4: Searching */}
          {step === "searching" && (
            <SearchProgress
              current={searchCurrent}
              total={searchTotal}
              currentName={searchCurrentName}
            />
          )}

          {/* Step 5: Results */}
          {step === "results" && (
            <div className="space-y-4">
              <SummaryBar results={results} />

              <BulkActions
                selectedCount={selectedCount}
                totalCount={results.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onExportCsv={handleExportCsv}
                onExportVCard={handleExportVCard}
                onOpenLinkedIns={handleOpenLinkedIns}
              />

              <Filters
                careerCategories={ALL_CAREER_CATEGORIES}
                activeFilters={filters}
                onFilterChange={setFilters}
              />

              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    No results match your filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={handleStartOver}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
