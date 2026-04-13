"use client";

import { useState, useCallback } from "react";
import type { ExtractedName, PersonResult, AppStep } from "@/types";
import { analyzeImageQuality } from "@/lib/imageQuality";
import { runOCR } from "@/lib/ocr";
import { cleanNames, extractCompositeYear } from "@/lib/nameCleaner";
import { getSearchProvider, searchProfilesForName, QuotaExhaustedError } from "@/lib/profileSearch";
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
  const [compositeYear, setCompositeYear] = useState<number | undefined>();
  const [extractedNames, setExtractedNames] = useState<ExtractedName[]>([]);
  const [results, setResults] = useState<PersonResult[]>([]);

  // Progress
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchCurrentName, setSearchCurrentName] = useState("");
  const [quotaExhausted, setQuotaExhausted] = useState(false);

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
      const year = extractCompositeYear(text);
      if (year) setCompositeYear(year);
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

      let hitQuota = false;
      for (let i = 0; i < activeNames.length; i++) {
        const name = activeNames[i].cleanedName;
        setSearchCurrentName(name);
        setSearchCurrent(i);

        try {
          const profiles = await searchProfilesForName(provider, name, university, compositeYear);
          const { category, company } = classifyCareer(profiles);
          const bestLinkedIn = profiles.find((p) => p.platform === "LinkedIn");

          personResults.push({
            id: activeNames[i].id,
            name,
            profiles,
            bestLinkedIn,
            company,
            careerCategory: category,
            selected: false,
            noReliableMatch: profiles.length === 0,
          });
        } catch (err) {
          if (err instanceof QuotaExhaustedError) {
            hitQuota = true;
            break;
          }
        }
      }

      setSearchCurrent(activeNames.length);
      setResults(personResults);
      if (hitQuota) setQuotaExhausted(true);
      setStep("results");
    },
    [university, compositeYear]
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
    setCompositeYear(undefined);
    setExtractedNames([]);
    setResults([]);
    setQuotaExhausted(false);
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
            {quotaExhausted && (
              <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
                <p className="font-medium">Search limit reached</p>
                <p className="mt-1 text-amber-200/70">
                  CompositeConnect has run out of search queries and needs to purchase more.
                  Please reach out to{" "}
                  <a
                    href="mailto:plironderobles@mail.wlu.edu"
                    className="underline text-amber-200 hover:text-amber-100"
                  >
                    plironderobles@mail.wlu.edu
                  </a>{" "}
                  and let him know!
                </p>
              </div>
            )}
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
