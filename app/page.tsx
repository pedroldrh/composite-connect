"use client";

import { useState, useCallback } from "react";
import type { ExtractedName, PersonResult, AppStep } from "@/types";
import { analyzeImageQuality } from "@/lib/imageQuality";
import { runOCR } from "@/lib/ocr";
import { cleanNames } from "@/lib/nameCleaner";
import { getSearchProvider, searchProfilesForName } from "@/lib/profileSearch";
import { classifyCareer } from "@/lib/careerClassifier";

import { UniversitySelect } from "@/components/UniversitySelect";
import { CameraCapture } from "@/components/CameraCapture";
import { OcrReview } from "@/components/OcrReview";
import { SearchProgress } from "@/components/SearchProgress";
import { ResultsView } from "@/components/ResultsView";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToVCard } from "@/lib/exportVCard";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [step, setStep] = useState<AppStep>("university");
  const [university, setUniversity] = useState("");
  const [extractedNames, setExtractedNames] = useState<ExtractedName[]>([]);
  const [results, setResults] = useState<PersonResult[]>([]);

  // Progress
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchCurrentName, setSearchCurrentName] = useState("");

  // Step 1: University selected
  const handleUniversitySelect = useCallback((uni: string) => {
    setUniversity(uni);
    setStep("camera");
  }, []);

  // Step 2: Image captured → run quality check silently + OCR
  const handleImageCapture = useCallback(async (file: File) => {
    setStep("ocr-review");
    setIsRunningOcr(true);
    setOcrProgress(0);

    try {
      // Silent quality check — just log, don't block
      try { await analyzeImageQuality(file); } catch { /* ignore */ }

      const text = await runOCR(file, (p) => setOcrProgress(p));
      const names = cleanNames(text);
      setExtractedNames(names);
    } catch {
      setExtractedNames([]);
    } finally {
      setIsRunningOcr(false);
    }
  }, []);

  // Step 3: Names confirmed → search LinkedIn
  const handleNamesConfirmed = useCallback(
    async (names: ExtractedName[]) => {
      const activeNames = names.filter((n) => !n.excluded);
      if (activeNames.length === 0) return;

      setStep("searching");
      setSearchTotal(activeNames.length);
      setSearchCurrent(0);

      const provider = await getSearchProvider();
      const personResults: PersonResult[] = [];

      for (let i = 0; i < activeNames.length; i++) {
        const name = activeNames[i].cleanedName;
        setSearchCurrentName(name);
        setSearchCurrent(i);

        const profiles = await searchProfilesForName(provider, name, university);
        const { category, company } = classifyCareer(profiles);
        const bestLinkedIn = profiles.find((p) => p.platform === "LinkedIn");

        personResults.push({
          id: activeNames[i].id,
          name,
          profiles,
          bestLinkedIn,
          company,
          careerCategory: category,
          selected: !!bestLinkedIn,
          noReliableMatch: profiles.length === 0,
        });
      }

      setSearchCurrent(activeNames.length);
      setResults(personResults);
      setStep("results");
    },
    [university]
  );

  // Results actions
  const toggleSelect = useCallback((id: string) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  }, []);

  const selectAll = useCallback(() => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: false })));
  }, []);

  const handleExportCsv = useCallback(() => {
    exportToCsv(results.filter((r) => r.selected));
  }, [results]);

  const handleExportVCard = useCallback(() => {
    exportToVCard(results.filter((r) => r.selected));
  }, [results]);

  const handleOpenLinkedIns = useCallback(() => {
    const selected = results.filter((r) => r.selected && r.bestLinkedIn);
    if (selected.length > 10) return;
    selected.forEach((r) => { if (r.bestLinkedIn) window.open(r.bestLinkedIn.url, "_blank"); });
  }, [results]);

  const handleStartOver = useCallback(() => {
    setStep("university");
    setUniversity("");
    setExtractedNames([]);
    setResults([]);
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Step 1: University */}
        {step === "university" && (
          <UniversitySelect onSelect={handleUniversitySelect} />
        )}

        {/* Step 2: Camera */}
        {step === "camera" && (
          <CameraCapture
            university={university}
            onCapture={handleImageCapture}
            onBack={() => setStep("university")}
          />
        )}

        {/* Step 3: OCR review */}
        {step === "ocr-review" && (
          <div className="w-full max-w-lg">
            {isRunningOcr ? (
              <div className="text-center space-y-3 py-16">
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
                onBack={() => setStep("camera")}
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
          <div className="w-full max-w-2xl">
            <ResultsView
              results={results}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onExportCsv={handleExportCsv}
              onExportVCard={handleExportVCard}
              onOpenLinkedIns={handleOpenLinkedIns}
              onStartOver={handleStartOver}
            />
          </div>
        )}
      </div>

      {/* Minimal footer */}
      {step === "university" && (
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground">
            CompositeConnect
          </p>
        </div>
      )}
    </main>
  );
}
