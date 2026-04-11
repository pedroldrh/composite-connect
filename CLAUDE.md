# CompositeConnect

## Tech Stack
Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Tesseract.js, Papaparse

## Architecture
Single-page wizard app. All state in `app/page.tsx`. Flow: input → quality check → OCR → name review → profile search → results.

## Key Files
- `lib/profileSearch.ts` — SearchProvider interface + MockSearchProvider. To add a real search API, implement SearchProvider and update `getSearchProvider()`.
- `lib/confidence.ts` — Multi-signal scoring (0-100). Signals: university mention, fraternity, LinkedIn exists, class year, company, URL match, Instagram, multi-source.
- `lib/careerClassifier.ts` — Rule-based keyword classification. Priority-ordered rules.
- `lib/nameCleaner.ts` — OCR text → cleaned name list. Includes Levenshtein dedup.

## Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
```
