# CompositeConnect

Upload a fraternity composite photo, extract names via OCR, and discover public profiles and career paths for each person.

## What It Does

1. **Upload** a composite image (drag-and-drop or camera capture)
2. **Quality check** analyzes brightness, blur, and resolution before OCR
3. **OCR extraction** uses Tesseract.js to pull names from the image
4. **Name review** lets you edit, remove, or restore extracted names
5. **Profile search** runs multiple queries per name to find LinkedIn, Instagram, and other profiles
6. **Career classification** categorizes each person (IB, PE, VC, Consulting, Engineering, Law, etc.)
7. **Confidence scoring** rates each match as High / Medium / Low with reasoning
8. **Export** selected results to CSV or vCard, or open LinkedIn profiles in new tabs

## Quick Start

```bash
cd composite-connect
npm install
npm run dev
```

Open http://localhost:3000.

## Mock Mode

The app ships with a **MockSearchProvider** that generates realistic fake profile results so the full flow works end-to-end without any external API keys. The mock:

- Returns deterministic results per name (same name always gets same profiles)
- Simulates ~60% high confidence, ~25% medium, ~15% no match
- Includes realistic companies (Goldman Sachs, McKinsey, Google, KKR, etc.)
- Generates plausible LinkedIn/Instagram URLs, headlines, and locations

No API keys or environment variables are needed to run the demo.

## Plugging In a Real Search Provider

The search layer uses an adapter pattern. To connect a real search API:

1. Open `lib/profileSearch.ts`
2. Create a new class implementing the `SearchProvider` interface:

```ts
import type { SearchProvider, ProfileCandidate } from "@/types";

export class RealSearchProvider implements SearchProvider {
  async searchProfiles(
    name: string,
    university: string,
    fraternity: string,
    compositeYear?: string
  ): Promise<ProfileCandidate[]> {
    // Call your search API (SerpAPI, Google Custom Search, etc.)
    // Parse results into ProfileCandidate[]
    // Return them
  }
}
```

3. Update the `getSearchProvider()` factory function to return your new provider:

```ts
export function getSearchProvider(): SearchProvider {
  return new RealSearchProvider();
}
```

The rest of the app (confidence scoring, career classification, export) works unchanged.

## Project Structure

```
composite-connect/
  app/
    page.tsx          # Main wizard page (client component)
    layout.tsx        # Root layout with dark mode + TooltipProvider
    globals.css       # Tailwind + shadcn theme
  components/
    ui/               # shadcn/ui primitives (Button, Card, etc.)
    InputForm.tsx     # University/fraternity form + image upload
    ImageQualityFeedback.tsx  # Quality check results
    OcrReview.tsx     # Editable name list
    SearchProgress.tsx # Search progress indicator
    SummaryBar.tsx    # Results summary stats
    Filters.tsx       # Career/confidence/text filters
    PersonCard.tsx    # Individual person result card
    BulkActions.tsx   # Select all, export, open links
    StepIndicator.tsx # Wizard step progress
  lib/
    imageQuality.ts   # Canvas-based image quality analysis
    ocr.ts            # Tesseract.js OCR wrapper
    nameCleaner.ts    # Name extraction + dedup pipeline
    queryBuilder.ts   # Search query generation + university aliases
    profileSearch.ts  # SearchProvider interface + MockSearchProvider
    confidence.ts     # Multi-signal confidence scoring
    careerClassifier.ts # Rule-based career classification
    exportCsv.ts      # CSV export via papaparse
    exportVCard.ts    # vCard 3.0 export
    utils.ts          # cn() utility (shadcn)
  types/
    index.ts          # All TypeScript types and interfaces
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix UI)
- Lucide icons
- Tesseract.js (client-side OCR)
- Papaparse (CSV export)
- Zod (validation)

## Deploy

```bash
vercel --yes --prod
```
