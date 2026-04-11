// CompositeConnect – Core type definitions

export type CareerCategory =
  | "Investment Banking"
  | "Private Equity"
  | "Venture Capital"
  | "Consulting"
  | "Engineering"
  | "Marketing"
  | "Sales"
  | "Startup / Founder"
  | "Law"
  | "Medicine"
  | "Finance Other"
  | "Other"
  | "Unknown";

export interface UserInput {
  university: string;
  fraternity: string;
  compositeYear?: string;
  image?: File | null;
}

export interface ExtractedName {
  id: string;
  rawText: string;
  cleanedName: string;
  sourceIndex: number;
  excluded?: boolean;
}

export interface ProfileCandidate {
  platform: "LinkedIn" | "Instagram" | "Facebook" | "X" | "Other";
  url: string;
  title?: string;
  snippet?: string;
  company?: string;
  headline?: string;
  location?: string;
  classYear?: string;
}

export interface PersonResult {
  id: string;
  name: string;
  profiles: ProfileCandidate[];
  bestLinkedIn?: ProfileCandidate;
  bestInstagram?: ProfileCandidate;
  company?: string;
  careerCategory: CareerCategory;
  confidenceScore: number;
  confidenceLabel: "High" | "Medium" | "Low";
  reasoning: string[];
  selected: boolean;
  noReliableMatch: boolean;
}

export interface ImageQualityMetrics {
  width: number;
  height: number;
  brightness: number; // 0-255
  blurScore: number; // higher = sharper
  megapixels: number;
}

export interface ImageQualityWarning {
  type: "blur" | "brightness" | "resolution" | "size";
  message: string;
  suggestion: string;
}

export interface ImageQualityResult {
  pass: boolean;
  warnings: ImageQualityWarning[];
  metrics: ImageQualityMetrics;
}

export type AppStep =
  | "input"
  | "quality-check"
  | "ocr-review"
  | "searching"
  | "results";

// Search provider interface – implement this to plug in a real search API
export interface SearchProvider {
  searchProfiles(
    name: string,
    university: string,
    fraternity: string,
    compositeYear?: string
  ): Promise<ProfileCandidate[]>;
}
