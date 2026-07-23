// Semester-aware Entry Skills logic.
// Replaces the previous static "entry skills" string on a student with
// substrand rosters that vary by learning area and semester.

import type { Semester } from "./mock-data";
import { scopeSequence, type ScopeItem } from "./scope-sequence";

export type EntrySkillArea = "English" | "Maths" | "Personal & Social";

export interface EntrySkill {
  substrand: string;
  descriptor: string;
  source: "victorian-curriculum" | "scope-sequence";
  scopeItemId?: string;
}

export interface EntrySkillGroup {
  area: EntrySkillArea;
  semester: Semester | "constant";
  skills: EntrySkill[];
}

// English — 3 success-criteria substrands, same each semester.
const englishSubstrands: EntrySkill[] = [
  {
    substrand: "Reading & Viewing",
    descriptor: "Identifies and produces initial sounds in familiar spoken words; tracks left-to-right when shared reading.",
    source: "victorian-curriculum",
  },
  {
    substrand: "Speaking & Listening",
    descriptor: "Uses phrases (2–3 words or AAC equivalent) to communicate preferences, likes and dislikes across the day.",
    source: "victorian-curriculum",
  },
  {
    substrand: "Writing",
    descriptor: "Forms familiar letters or symbols to represent name and meaningful words with a model.",
    source: "victorian-curriculum",
  },
];

// Maths — semester-aware substrands.
const mathsSemester1: EntrySkill[] = [
  { substrand: "Number", descriptor: "Names, represents and orders numbers 0–20 using materials and numerals.", source: "victorian-curriculum" },
  { substrand: "Measurement", descriptor: "Compares length and capacity of two objects using direct comparison and everyday language.", source: "victorian-curriculum" },
  { substrand: "Space", descriptor: "Identifies and describes 2D shapes and their features in familiar contexts.", source: "victorian-curriculum" },
];

const mathsSemester2: EntrySkill[] = [
  { substrand: "Number", descriptor: "Combines and separates quantities to 20 to solve simple addition and subtraction problems.", source: "victorian-curriculum" },
  { substrand: "Algebra", descriptor: "Copies, continues and creates simple repeating patterns using objects, sound and movement.", source: "victorian-curriculum" },
  { substrand: "Statistics", descriptor: "Answers yes/no questions by sorting objects into categories and comparing group size.", source: "victorian-curriculum" },
];

// Personal & Social — constant, sourced from the school's Scope & Sequence.
function personalSocialFromScope(): EntrySkill[] {
  const items = scopeSequence.filter((s: ScopeItem) => s.domain === "Personal & Social");
  const seed: EntrySkill[] =
    items.length > 0
      ? items.map((s) => ({
          substrand: s.intention.split(/[.,;]/)[0].trim(),
          descriptor: s.descriptors.workingTowards,
          source: "scope-sequence" as const,
          scopeItemId: s.id,
        }))
      : [];

  // Ensure a stable set of three even if scope-sequence grows/shrinks.
  const fallbacks: EntrySkill[] = [
    { substrand: "Self-awareness", descriptor: "Names 2–3 emotions in self using picture cards or AAC.", source: "scope-sequence" },
    { substrand: "Self-management", descriptor: "Uses a taught strategy (breathing, break card) with an adult cue.", source: "scope-sequence" },
    { substrand: "Social awareness", descriptor: "Turn-takes across 2–3 exchanges with a peer during a shared activity.", source: "scope-sequence" },
  ];
  const merged = [...seed, ...fallbacks];
  const seen = new Set<string>();
  const unique = merged.filter((s) => {
    if (seen.has(s.substrand)) return false;
    seen.add(s.substrand);
    return true;
  });
  return unique.slice(0, 3);
}

export function getEntrySkills(area: EntrySkillArea, semester: Semester): EntrySkillGroup {
  if (area === "English") {
    return { area, semester, skills: englishSubstrands };
  }
  if (area === "Maths") {
    const isSem1 = semester === "Semester 1 · 2026";
    return { area, semester, skills: isSem1 ? mathsSemester1 : mathsSemester2 };
  }
  return { area, semester: "constant", skills: personalSocialFromScope() };
}

export function getAllEntrySkills(semester: Semester): EntrySkillGroup[] {
  return [
    getEntrySkills("English", semester),
    getEntrySkills("Maths", semester),
    getEntrySkills("Personal & Social", semester),
  ];
}
