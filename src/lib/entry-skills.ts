// Entry Skills — DIP-gated, per-substrand, level-aware.
//
// Behaviour spec:
//   - Only students whose DIP status is "Potentially Funded (DIP Meeting
//     Scheduled)" have Entry Skills prepared ahead of their DIP meeting.
//   - For English & Maths, entry skills are 3 Success Criteria per substrand
//     pulled from the school's Crosschecks document at the student's level
//     (B / C / D). Measurement and Space are separate substrands.
//   - Personal & Social entry skills are constant across Semester 1 & 2 and
//     are drawn from IEP goals in the Scope & Sequence document.

import type { CohortLevel, Semester, Student } from "./mock-data";
import { scopeSequence, type ScopeItem } from "./scope-sequence";

export type EntrySkillArea = "English" | "Maths" | "Personal & Social";
export type EnglishSubstrand = "Reading & Viewing" | "Speaking & Listening" | "Writing";
export type MathsSubstrand = "Number" | "Measurement" | "Space" | "Algebra" | "Statistics";
export type Substrand = EnglishSubstrand | MathsSubstrand | "Personal & Social";

export interface EntrySkill {
  criterion: string;
  source: "crosschecks" | "scope-sequence";
  scopeItemId?: string;
}

export interface EntrySkillGroup {
  area: EntrySkillArea;
  substrand: Substrand;
  level: CohortLevel | "constant";
  skills: EntrySkill[];
}

// -------- Crosschecks Success Criteria (mocked, per level & substrand) --------
// Three criteria per (level, substrand). Real deployment would read these from
// the school's Crosschecks document.

type LevelBook = Record<CohortLevel, string[]>;

const englishCrosschecks: Record<EnglishSubstrand, LevelBook> = {
  "Reading & Viewing": {
    B: [
      "Attends to a shared picture book for 2–3 minutes with an adult.",
      "Turns pages one at a time and shows interest in familiar images.",
      "Points to a named picture when given a choice of two.",
    ],
    C: [
      "Identifies the initial sound in 3–5 familiar spoken words.",
      "Matches a printed word to its picture in familiar contexts.",
      "Tracks left-to-right across a line of text during shared reading.",
    ],
    D: [
      "Blends and reads simple CVC words with a model.",
      "Answers a literal 'who/what' question about a shared text.",
      "Recognises 10+ high-frequency words on sight.",
    ],
  },
  "Speaking & Listening": {
    B: [
      "Uses eye gaze, gesture or an AAC symbol to request a preferred item.",
      "Responds to own name in a small-group routine.",
      "Follows a 1-step familiar instruction with a visual cue.",
    ],
    C: [
      "Combines 2 symbols or words to comment (e.g. 'more juice').",
      "Follows a 2-step instruction in a familiar routine.",
      "Turn-takes across 2 exchanges with an adult.",
    ],
    D: [
      "Uses 3–4 word phrases (or AAC equivalent) to share news.",
      "Asks a 'who/what/where' question of a peer with prompting.",
      "Retells a familiar story with picture supports.",
    ],
  },
  Writing: {
    B: [
      "Makes marks on paper with a preferred tool for 2 minutes.",
      "Copies a vertical or horizontal line with a model.",
      "Explores letter-shape stamps or magnetic letters.",
    ],
    C: [
      "Traces own first name with dotted guides.",
      "Forms 3–5 familiar letters legibly with a model.",
      "Selects a symbol/letter to label a drawing.",
    ],
    D: [
      "Writes own first name unaided on lined paper.",
      "Composes a 3–4 word caption for a picture with word banks.",
      "Uses a capital letter and full stop with prompting.",
    ],
  },
};

const mathsCrosschecks: Record<Exclude<MathsSubstrand, never>, LevelBook> = {
  Number: {
    B: [
      "Attends to a counting song and joins actions.",
      "Gives 'one' when asked from a set of objects.",
      "Matches identical numerals 1–3.",
    ],
    C: [
      "Rote-counts to 10 with a model.",
      "Counts a set of 1–5 objects with 1-to-1 correspondence.",
      "Names numerals 0–10 in random order.",
    ],
    D: [
      "Represents numbers 0–20 using materials and numerals.",
      "Combines two small sets to 10 to find a total.",
      "Orders numerals 0–20 on a number line.",
    ],
  },
  Measurement: {
    B: [
      "Explores objects of different sizes with adult modelling.",
      "Fills and empties containers with sand or water.",
      "Responds to 'big' / 'little' with a matched pair.",
    ],
    C: [
      "Compares length of two objects using 'longer / shorter'.",
      "Compares capacity of two containers using 'more / less'.",
      "Sequences 2–3 daily events using picture cards.",
    ],
    D: [
      "Measures length using informal units (blocks, hands).",
      "Compares mass of two objects using a balance scale.",
      "Reads time to the hour on an analogue clock with support.",
    ],
  },
  Space: {
    B: [
      "Fits a shape into a matching inset puzzle.",
      "Follows the positional cue 'in' during a routine.",
      "Attends to a familiar shape sorter for 2 minutes.",
    ],
    C: [
      "Names circle, square and triangle in familiar contexts.",
      "Follows positional language 'on / under / next to'.",
      "Copies a simple 2-block model.",
    ],
    D: [
      "Describes 2D shapes by number of sides and corners.",
      "Follows and gives simple directions on a floor map.",
      "Constructs a 3D model from a picture with support.",
    ],
  },
  Algebra: {
    B: [
      "Attends to a repeating movement pattern (clap-stomp-clap).",
      "Continues a physical AB pattern with hand-over-hand support.",
      "Sorts identical objects into a matching container.",
    ],
    C: [
      "Copies an AB colour pattern using blocks.",
      "Continues an AB pattern by 1–2 items.",
      "Sorts objects by one attribute (colour, size).",
    ],
    D: [
      "Creates and continues an ABC pattern with materials.",
      "Describes the 'rule' of a simple repeating pattern.",
      "Uses a symbol to stand for an unknown in a familiar routine.",
    ],
  },
  Statistics: {
    B: [
      "Chooses between two objects to indicate a preference.",
      "Places an object onto a labelled photo (yes / no board).",
      "Attends while the group tallies a 'who is here' chart.",
    ],
    C: [
      "Sorts objects into two labelled categories.",
      "Answers a yes/no question by pointing to a symbol.",
      "Compares two groups using 'more / same / less'.",
    ],
    D: [
      "Collects data by asking 3 peers a yes/no question.",
      "Represents data on a picture graph with 1:1 correspondence.",
      "Interprets a simple picture graph — 'which has most?'.",
    ],
  },
};

const englishSubstrands: EnglishSubstrand[] = ["Reading & Viewing", "Speaking & Listening", "Writing"];

function mathsSubstrandsFor(semester: Semester): MathsSubstrand[] {
  const isSem1 = semester === "Semester 1 · 2026";
  return isSem1 ? ["Number", "Measurement", "Space"] : ["Number", "Algebra", "Statistics"];
}

// -------- Personal & Social — constant, sourced from Scope & Sequence --------

function personalSocialFromScope(): EntrySkill[] {
  const items = scopeSequence.filter((s: ScopeItem) => s.domain === "Personal & Social");
  const seed: EntrySkill[] = items.slice(0, 3).map((s) => ({
    criterion: s.intention,
    source: "scope-sequence" as const,
    scopeItemId: s.id,
  }));
  const fallbacks: EntrySkill[] = [
    { criterion: "Names 2–3 emotions in self using picture cards or AAC.", source: "scope-sequence" },
    { criterion: "Uses a taught strategy (breathing, break card) with an adult cue.", source: "scope-sequence" },
    { criterion: "Turn-takes across 2–3 exchanges with a peer during a shared activity.", source: "scope-sequence" },
  ];
  return [...seed, ...fallbacks].slice(0, 3);
}

// -------- Public API --------

/**
 * Whether Entry Skills should be prepared for this student. Only triggers
 * when a DIP meeting is scheduled.
 */
export function shouldPrepareEntrySkills(student: Pick<Student, "dipStatus">): boolean {
  return student.dipStatus === "Potentially Funded (DIP Meeting Scheduled)";
}

/**
 * Build Entry Skill groups for a student. Returns [] when the student's DIP
 * status does not warrant preparing entry skills.
 */
export function getEntrySkillsForStudent(
  student: Pick<Student, "dipStatus" | "level">,
  semester: Semester,
): EntrySkillGroup[] {
  if (!shouldPrepareEntrySkills(student)) return [];
  const level = student.level;
  const groups: EntrySkillGroup[] = [];

  for (const sub of englishSubstrands) {
    groups.push({
      area: "English",
      substrand: sub,
      level,
      skills: englishCrosschecks[sub][level].map((c) => ({ criterion: c, source: "crosschecks" })),
    });
  }
  for (const sub of mathsSubstrandsFor(semester)) {
    groups.push({
      area: "Maths",
      substrand: sub,
      level,
      skills: mathsCrosschecks[sub][level].map((c) => ({ criterion: c, source: "crosschecks" })),
    });
  }
  groups.push({
    area: "Personal & Social",
    substrand: "Personal & Social",
    level: "constant",
    skills: personalSocialFromScope(),
  });
  return groups;
}

// -------- Goal-level Entry Skills (from the Entry Skills 2025 documents) --------

import { entrySkillRecords, type EntryLevel, type EntrySkillRecord } from "./entry-skills-data";

/** Maps an IEP planner subject + strand onto the Entry Skills document taxonomy. */
function mapToEntryTaxonomy(subject: string, strand: string): { area: EntrySkillRecord["area"]; strand: string } | null {
  const s = strand.toLowerCase();
  if (subject === "English") {
    if (s.startsWith("reading")) return { area: "English", strand: "Reading & Viewing" };
    if (s.startsWith("speaking")) return { area: "English", strand: "Speaking & Listening" };
    if (s.startsWith("writing")) return { area: "English", strand: "Writing" };
    return null;
  }
  if (subject === "Mathematics") {
    if (s.startsWith("number") || s.startsWith("algebra")) return { area: "Maths", strand: "Number" };
    if (s.startsWith("measurement") || s.startsWith("space")) return { area: "Maths", strand: "Measurement" };
    if (s.startsWith("statistic")) return { area: "Maths", strand: "Statistics" };
    return null;
  }
  if (subject.startsWith("Personal")) {
    if (s.startsWith("self")) return { area: "Personal & Social", strand: "Self-Awareness & Management" };
    return { area: "Personal & Social", strand: "Social Awareness & Management" };
  }
  return null;
}

const STOP = new Set(["and","the","a","an","of","to","with","in","for","on","using","their","own","or"]);
function overlap(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));
  const wb = b.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  return wb.reduce((n, w) => n + (wa.has(w) ? 1 : 0), 0);
}

export interface GoalEntrySkills {
  topic: string;
  level: EntryLevel;
  skills: string[];
}

/**
 * Three entry skills for a selected IEP goal, at the chosen level, drawn from
 * the school's Entry Skills 2025 documents. Returns null when the subject or
 * strand is outside the documented taxonomy.
 */
export function getEntrySkillsForGoal(
  subject: string,
  strand: string,
  level: string | undefined,
  goalText = "",
): GoalEntrySkills | null {
  if (!level) return null;
  const map = mapToEntryTaxonomy(subject, strand);
  if (!map) return null;
  const atLevel = entrySkillRecords.filter(
    (r) => r.area === map.area && r.strand === map.strand && r.level === (level as EntryLevel),
  );
  if (!atLevel.length) return null;

  const ranked = [...atLevel].sort(
    (a, b) => overlap(goalText, b.topic) - overlap(goalText, a.topic),
  );
  const best = ranked[0];
  const skills = [...best.skills];
  for (const r of ranked.slice(1)) {
    for (const sk of r.skills) {
      if (skills.length >= 3) break;
      if (!skills.includes(sk)) skills.push(sk);
    }
  }
  return { topic: best.topic, level: level as EntryLevel, skills: skills.slice(0, 3) };
}
