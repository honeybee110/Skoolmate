// SchoolMate AU — Lesson Planner store.
// Persists 6-part lesson notes (Learning Intention, Success Criteria, Hook,
// I do, We do, You do) plus AI output and approval status to localStorage,
// so teachers can save drafts, reload them into the planner and see approved
// plans in the Lesson Bank grouped by subject.

import { useSyncExternalStore } from "react";

export type LessonStatus = "draft" | "pending" | "approved";
export type LessonTerm = "Term 1" | "Term 2" | "Term 3" | "Term 4";

export interface LessonNotes {
  learningIntention: string;
  successCriteria: string;
  hook: string;
  iDo: string;
  weDo: string;
  youDo: string;
}

export interface SavedLesson {
  id: string;
  title: string;
  subject: string;
  strand: string;
  topic: string;
  duration: string;
  abilityRange: string;
  term: LessonTerm;
  vcCode?: string;
  status: LessonStatus;
  notes: LessonNotes;
  /** Optional AI-generated payload, JSON-stringified snapshot. */
  aiPlan?: unknown;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  lessons: SavedLesson[];
}

const KEY = "schoolmate.lessons.v1";

// ---- Seed a small library so the Bank isn't empty on first load ----
const seed: SavedLesson[] = [
  demo("Counting to 20 with 10-frames", "Mathematics", "Number", "Term 1", "approved", "VC2MFN01", {
    learningIntention: "We are learning to count and represent numbers 0–20.",
    successCriteria: "I can count 0–20 aloud.\nI can match numeral to quantity to 10.\nI can fill a 10-frame with support.",
    hook: "Number of the day song with body percussion; each learner touches the numeral card.",
    iDo: "Teacher models 1:1 counting on the 10-frame using magnetic counters.",
    weDo: "Small groups build sets of 5, 8, 10 with adult and peer prompts.",
    youDo: "Each learner completes their own 10-frame task card with visual supports.",
  }),
  demo("Blend and read CVC words", "English", "Reading and Viewing", "Term 2", "approved", "VC2EFDLY02", {
    learningIntention: "We are learning to blend sounds to read CVC words.",
    successCriteria: "I can say each sound.\nI can blend the sounds together.\nI can read 3 CVC words.",
    hook: "Sound-of-the-day cards — echo 3 phonemes.",
    iDo: "Teacher segments and blends /c/-/a/-/t/ using magnetic letters.",
    weDo: "Partner sound-tap using Elkonin boxes.",
    youDo: "Read 3 CVC words on a picture-match sheet.",
  }),
  demo("Compare length of two objects", "Mathematics", "Measurement and Space", "Term 1", "pending", "VC2MAM01", {
    learningIntention: "We are learning to compare which object is longer or shorter.",
    successCriteria: "I can line objects up at one end.\nI can say longer / shorter.\nI can order 3 objects.",
    hook: "Which snake is longer? Play-dough warm-up.",
    iDo: "Teacher models aligning ends and using longer / shorter.",
    weDo: "Pairs compare pencils, sort into two hoops.",
    youDo: "Independent worksheet: circle the longer object.",
  }),
  demo("Form lower-case letters — m, a, s", "English", "Writing", "Term 2", "approved", "VC2EFLY15", {
    learningIntention: "We are learning to form lower-case letters m, a, s.",
    successCriteria: "I can trace m, a, s.\nI can start at the top.\nI can copy one letter unaided.",
    hook: "Sky-write letters to the music.",
    iDo: "Teacher models formation with verbal path cues.",
    weDo: "Guided rainbow tracing in trays.",
    youDo: "Handwriting sheet — 3 letters with fine-motor grip.",
  }),
  demo("Catch a soft ball from 1m", "Physical Education", "Movement and Physical Activity", "Term 4", "approved", "VC2HPFM02", {
    learningIntention: "We are learning to track and catch a large soft ball.",
    successCriteria: "I can watch the ball.\nI can put my hands ready.\nI can trap the ball to my chest.",
    hook: "Balloon tap warm-up in a circle.",
    iDo: "Coach models 'watch, ready, trap' with slow tosses.",
    weDo: "Paired soft-ball tosses from 1m with adult support.",
    youDo: "Score-sheet — attempt 5 catches with a partner.",
  }),
];

function demo(
  title: string, subject: string, strand: string, term: LessonTerm,
  status: LessonStatus, vcCode: string, notes: LessonNotes,
): SavedLesson {
  const now = new Date().toISOString();
  return {
    id: `seed-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
    title, subject, strand, topic: title, duration: "45 min",
    abilityRange: "Towards Foundation A–D",
    term, status, vcCode, notes,
    author: "Honey P.",
    createdAt: now, updatedAt: now,
  };
}

// ---- Store ----
function load(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as State;
    if (!parsed?.lessons) return null;
    return parsed;
  } catch { return null; }
}

let state: State = load() ?? { lessons: seed };
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
function emit() { persist(); for (const l of listeners) l(); }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const getServer = () => ({ lessons: seed });

export function useLessonStore(): State {
  return useSyncExternalStore(subscribe, () => state, getServer);
}

export function saveLesson(input: Omit<SavedLesson, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string; status?: LessonStatus }): SavedLesson {
  const now = new Date().toISOString();
  const existing = input.id ? state.lessons.find((l) => l.id === input.id) : undefined;
  const lesson: SavedLesson = existing
    ? { ...existing, ...input, id: existing.id, status: input.status ?? existing.status, updatedAt: now }
    : {
        ...input,
        id: `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        status: input.status ?? "draft",
        createdAt: now, updatedAt: now,
      };
  state = {
    lessons: existing
      ? state.lessons.map((l) => (l.id === lesson.id ? lesson : l))
      : [lesson, ...state.lessons],
  };
  emit();
  return lesson;
}

export function setLessonStatus(id: string, status: LessonStatus) {
  state = { lessons: state.lessons.map((l) => (l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l)) };
  emit();
}

export function deleteLesson(id: string) {
  state = { lessons: state.lessons.filter((l) => l.id !== id) };
  emit();
}

export function getLesson(id: string): SavedLesson | undefined {
  return state.lessons.find((l) => l.id === id);
}
