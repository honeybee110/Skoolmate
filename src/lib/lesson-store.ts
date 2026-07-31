// skoolmate — Lesson Planner store.
// Persists 6-part lesson notes (Learning Intention, Success Criteria, Hook,
// I do, We do, You do) plus AI output and approval status to localStorage,
// so teachers can save drafts, reload them into the planner and see approved
// plans in the Lesson Bank grouped by subject.

import { useSyncExternalStore } from "react";

export type LessonStatus = "draft" | "pending" | "approved" | "returned";
export type LessonTerm = "Term 1" | "Term 2" | "Term 3" | "Term 4";
export type LessonWeek =
  | "Week 1" | "Week 2" | "Week 3" | "Week 4" | "Week 5" | "Week 6"
  | "Week 7" | "Week 8" | "Week 9" | "Week 10" | "Week 11" | "Week 12";
export const LESSON_WEEKS: LessonWeek[] = [
  "Week 1","Week 2","Week 3","Week 4","Week 5","Week 6",
  "Week 7","Week 8","Week 9","Week 10","Week 11","Week 12",
];

export interface LessonNotes {
  learningIntention: string;
  successCriteria: string;
  hook: string;
  iDo: string;
  weDo: string;
  youDo: string;
  /** Section 5 — Victorian Curriculum / Entry Skills alignment (optional for legacy plans). */
  alignment?: string;
  /** Section 6 — Resources. */
  resources?: string;
  /** Lesson Flow — Cool down / review. */
  coolDown?: string;
  /** Lesson Flow — Assessment. */
  assessment?: string;
  /** Lesson Flow — Teacher reflection. */
  reflection?: string;
  /** Differentiation by ability level (Level B / C / D). */
  differentiation?: string;
  /** How each selected entry skill is worked on in this lesson. */
  entrySkillAlignment?: string;
  /** Sensory / regulation supports. */
  sensorySupports?: string;
  /** AAC and communication supports. */
  communicationSupports?: string;
  /** Visuals to print or set up. */
  visuals?: string;
  /** Evidence staff collect for assessment. */
  assessmentEvidence?: string;
  /** Extension activities. */
  extension?: string;
}



export interface LessonSnapshot {
  at: string;
  notes: LessonNotes;
  title: string;
  vcCode?: string;
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
  week?: LessonWeek;
  vcCode?: string;
  status: LessonStatus;
  notes: LessonNotes;
  aiPlan?: unknown;
  author: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewerComment?: string;
  history?: LessonSnapshot[];
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
// Stable snapshot references — returning a fresh object each call causes
// useSyncExternalStore to loop ("The result of getServerSnapshot should be cached").
const serverSnapshot: State = { lessons: seed };
const getServer = () => serverSnapshot;
const getSnapshot = () => state;

export function useLessonStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServer);
}

export function saveLesson(input: Omit<SavedLesson, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string; status?: LessonStatus }): SavedLesson {
  const now = new Date().toISOString();
  const existing = input.id ? state.lessons.find((l) => l.id === input.id) : undefined;
  let history = existing?.history ?? [];
  if (existing) {
    const snap: LessonSnapshot = {
      at: existing.updatedAt,
      notes: existing.notes,
      title: existing.title,
      vcCode: existing.vcCode,
    };
    history = [snap, ...history].slice(0, 20);
  }
  const lesson: SavedLesson = existing
    ? { ...existing, ...input, id: existing.id, status: input.status ?? existing.status, updatedAt: now, history }
    : {
        ...input,
        id: `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        status: input.status ?? "draft",
        createdAt: now, updatedAt: now,
        history: [],
      };
  state = {
    lessons: existing
      ? state.lessons.map((l) => (l.id === lesson.id ? lesson : l))
      : [lesson, ...state.lessons],
  };
  emit();
  return lesson;
}

export function setLessonStatus(id: string, status: LessonStatus, reviewerComment?: string) {
  state = {
    lessons: state.lessons.map((l) =>
      l.id === id
        ? {
            ...l,
            status,
            reviewerComment: reviewerComment ?? l.reviewerComment,
            submittedAt: status === "pending" ? new Date().toISOString() : l.submittedAt,
            updatedAt: new Date().toISOString(),
          }
        : l,
    ),
  };
  emit();
}

export function duplicateLesson(id: string): SavedLesson | undefined {
  const src = state.lessons.find((l) => l.id === id);
  if (!src) return;
  const now = new Date().toISOString();
  const copy: SavedLesson = {
    ...src,
    id: `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: `${src.title} (copy)`,
    status: "draft",
    reviewerComment: undefined,
    submittedAt: undefined,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  state = { lessons: [copy, ...state.lessons] };
  emit();
  return copy;
}

export function restoreLessonSnapshot(id: string, snapshotAt: string) {
  const l = state.lessons.find((x) => x.id === id);
  if (!l?.history) return;
  const snap = l.history.find((s) => s.at === snapshotAt);
  if (!snap) return;
  saveLesson({ ...l, notes: snap.notes, title: snap.title, vcCode: snap.vcCode });
}

export function deleteLesson(id: string) {
  state = { lessons: state.lessons.filter((l) => l.id !== id) };
  emit();
}

export function getLesson(id: string): SavedLesson | undefined {
  return state.lessons.find((l) => l.id === id);
}
