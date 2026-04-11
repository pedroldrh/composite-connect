/**
 * Sample W&L-style names for demo mode.
 * Allows testing the full flow without needing a real composite image.
 */

import type { ExtractedName } from "@/types";

const DEMO_NAMES = [
  "William Harrison",
  "James Crawford",
  "Thomas Bennett",
  "Robert Mitchell",
  "Charles Whitfield",
  "Andrew Patterson",
  "David Locklear",
  "Michael Sullivan",
  "John Alexander",
  "Christopher Hayes",
  "Daniel Morrison",
  "Matthew Caldwell",
  "Benjamin Ross",
  "Samuel Thornton",
  "Nicholas Prescott",
  "Edward Chambers",
  "Patrick Donovan",
  "Alexander Merritt",
  "Henry Beaumont",
  "George Langston",
  "Richard Kingsley",
  "Jonathan Whitmore",
  "Stephen Hartley",
  "Peter Ashworth",
];

export function getDemoNames(): ExtractedName[] {
  return DEMO_NAMES.map((name, i) => ({
    id: `demo_${i}_${Math.random().toString(36).substring(2, 9)}`,
    rawText: name,
    cleanedName: name,
    sourceIndex: i,
  }));
}

export const DEMO_INPUT = {
  university: "Washington and Lee University",
  fraternity: "Kappa Alpha Order",
  compositeYear: "2023",
};
