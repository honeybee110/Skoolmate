// SchoolMate AU — Shared Curriculum + IEP store.
// Backed by localStorage so admin edits to the Scope & Sequence and
// teacher IEP cell edits persist across reloads and appear in both portals.

import { useSyncExternalStore } from "react";
import {
  CURRICULUM_DB,
  CURRICULUM_SUBJECTS,
  type CurriculumRecord,
  type CurriculumSemester,
} from "./curriculum-db";
import type { Semester, VcLevel } from "./mock-data";

// ---------- Types ----------

export type IepStatus =
  | "not-started"
  | "working-towards"
  | "nearly-there"
  | "achieved"
  | "exceeded";

export interface IepCellState {
  curriculumId?: string;
  levelOverride?: VcLevel;
  entrySkillsOverride?: string;
  progress: number;
  status: IepStatus;
  comment: string;
  evidenceCount: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface OverrideEvent {
  id: string;
  at: string;
  actor: "teacher" | "admin";
  kind: "curriculum-edit" | "curriculum-add" | "curriculum-delete" | "cell-override";
  targetId: string;
  reason?: string;
  detail: string;
}

interface StoreState {
  records: CurriculumRecord[];
  cells: Record<string, IepCellState>;
  audit: OverrideEvent[];
}

const STORAGE_KEY = "schoolmate.curriculum.v2";
const MAX_AUDIT = 100;

// ---------- Seed IEP cells (matches previous demo state) ----------

const cellKey = (studentId: string, subject: string, strand: string) =>
  `${studentId}::${subject}::${strand}`;

function seedCells(): Record<string, IepCellState> {
  const base: IepCellState = { progress: 0, status: "not-started", comment: "", evidenceCount: 0 };
  const seeds: Array<[string, string, string, Partial<IepCellState>]> = [
    ["s1", "Mathematics", "Number", { curriculumId: "ma-n-f", progress: 55, status: "working-towards", evidenceCount: 8, comment: "Mia counting 0–15 confidently." }],
    ["s1", "English", "Reading and Viewing", { curriculumId: "en-rv-b1", progress: 40, status: "working-towards", evidenceCount: 3 }],
    ["s2", "English", "Speaking and Listening", { curriculumId: "en-sl-c", progress: 30, status: "working-towards", evidenceCount: 12 }],
    ["s2", "English", "Reading and Viewing", { curriculumId: "en-rv-d", progress: 65, status: "nearly-there", evidenceCount: 3 }],
    ["s3", "English", "Writing", { curriculumId: "en-w-f", progress: 100, status: "achieved", evidenceCount: 14 }],
    ["s3", "Science", "Science Understanding", { curriculumId: "sc-f", progress: 40, status: "working-towards", evidenceCount: 3 }],
    ["s4", "Self-Care", "Daily Living", { curriculumId: "sc-c-d", progress: 45, status: "working-towards", evidenceCount: 6 }],
    ["s4", "Physical Education", "Movement and Physical Activity", { curriculumId: "pe-d", progress: 60, status: "nearly-there", evidenceCount: 4 }],
    ["s5", "Music", "Making and Responding", { curriculumId: "mu-c", progress: 35, status: "working-towards", evidenceCount: 2 }],
    ["s5", "English", "Speaking and Listening", { curriculumId: "en-sl-c", progress: 100, status: "achieved", evidenceCount: 9 }],
    ["s7", "Learn to Play", "Play Skills", { curriculumId: "l2p-d", progress: 40, status: "working-towards", evidenceCount: 2 }],
    ["s8", "Drama", "Making and Responding", { curriculumId: "dr-c", progress: 35, status: "working-towards", evidenceCount: 1 }],
    ["s8", "English", "Speaking and Listening", { curriculumId: "en-sl-c", progress: 50, status: "working-towards", evidenceCount: 7 }],
  ];
  const out: Record<string, IepCellState> = {};
  for (const [sid, subj, strand, patch] of seeds) {
    out[cellKey(sid, subj, strand)] = { ...base, ...patch, updatedAt: new Date().toISOString() };
  }
  return out;
}

// ---------- Store ----------

function initialState(): StoreState {
  return {
    records: CURRICULUM_DB.map((r) => ({ ...r })),
    cells: seedCells(),
    audit: [],
  };
}

let state: StoreState = load() ?? initialState();
const listeners = new Set<() => void>();

function load(): StoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    if (!parsed.records || !parsed.cells) return null;
    return {
      records: parsed.records,
      cells: parsed.cells,
      audit: parsed.audit ?? [],
    };
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function set(patch: (s: StoreState) => StoreState) {
  state = patch(state);
  emit();
}

function pushAudit(evt: Omit<OverrideEvent, "id" | "at">) {
  const entry: OverrideEvent = {
    ...evt,
    id: `ov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
  };
  set((s) => ({ ...s, audit: [entry, ...s.audit].slice(0, MAX_AUDIT) }));
}

// ---------- Subscription ----------

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const getServerSnapshot = () => initialState();

export function useCurriculumStore(): StoreState {
  return useSyncExternalStore(subscribe, () => state, getServerSnapshot);
}

// ---------- Curriculum mutations ----------

export function upsertRecord(record: CurriculumRecord, actor: "teacher" | "admin" = "admin") {
  const existing = state.records.find((r) => r.id === record.id);
  set((s) => ({
    ...s,
    records: existing
      ? s.records.map((r) => (r.id === record.id ? record : r))
      : [...s.records, record],
  }));
  pushAudit({
    actor,
    kind: existing ? "curriculum-edit" : "curriculum-add",
    targetId: record.id,
    detail: `${record.subject} · ${record.strand} · L${record.level} — ${record.goal}`,
  });
}

export function deleteRecord(id: string, actor: "teacher" | "admin" = "admin") {
  const rec = state.records.find((r) => r.id === id);
  if (!rec) return;
  set((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
  pushAudit({
    actor,
    kind: "curriculum-delete",
    targetId: id,
    detail: `${rec.subject} · ${rec.strand} — ${rec.goal}`,
  });
}

export function resetCurriculumToDefaults() {
  set(() => initialState());
}

// ---------- IEP cell mutations ----------

export { cellKey };

export function updateCell(key: string, patch: Partial<IepCellState>, actor: "teacher" | "admin" = "teacher") {
  const base: IepCellState = { progress: 0, status: "not-started", comment: "", evidenceCount: 0 };
  set((s) => ({
    ...s,
    cells: {
      ...s.cells,
      [key]: {
        ...base,
        ...s.cells[key],
        ...patch,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      },
    },
  }));
}

export function pickGoal(key: string, curriculumId: string, actor: "teacher" | "admin" = "teacher") {
  updateCell(
    key,
    {
      curriculumId,
      levelOverride: undefined,
      entrySkillsOverride: undefined,
      status: state.cells[key]?.status ?? "working-towards",
      progress: state.cells[key]?.progress ?? 10,
    },
    actor,
  );
}

/**
 * Admin override — updates a cell and records the reason in the audit trail.
 * Bypasses the semester-scope guardrails a teacher would face.
 */
export function adminOverrideCell(key: string, patch: Partial<IepCellState>, reason: string) {
  updateCell(key, patch, "admin");
  pushAudit({
    actor: "admin",
    kind: "cell-override",
    targetId: key,
    reason,
    detail:
      patch.status
        ? `Status → ${patch.status}`
        : patch.curriculumId
          ? `Goal → ${patch.curriculumId}`
          : `Progress → ${patch.progress ?? "?"}%`,
  });
}

// ---------- Read helpers (store-aware) ----------

export function findRecordIn(records: CurriculumRecord[], id: string) {
  return records.find((r) => r.id === id);
}

export function recordsForIn(
  records: CurriculumRecord[],
  subject: string,
  strand: string,
  semester: Semester,
) {
  const sem: CurriculumSemester = semester.startsWith("Semester 1") ? "Semester 1" : "Semester 2";
  return records.filter(
    (r) =>
      r.subject === subject &&
      r.strand === strand &&
      (r.semester === "Both" || r.semester === sem),
  );
}

export { CURRICULUM_SUBJECTS };
