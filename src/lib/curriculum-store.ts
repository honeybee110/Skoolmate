// skoolmate — Shared Curriculum + IEP store.
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

export type IepStatus = "developing" | "working-towards" | "achieved";

/** Three progressive cross-check steps. Toggling checks drives status + progress. */
export type CrossChecks = [boolean, boolean, boolean];

export const CROSS_CHECK_LABELS: [string, string, string] = [
  "Developing",
  "Working Towards",
  "Achieved",
];

export type EvidenceSource = "computer" | "google-drive" | "onedrive" | "school-server";

export interface EvidenceAttachment {
  id: string;
  name: string;
  source: EvidenceSource;
  sizeKb?: number;
  addedAt: string;
}

export const MAX_EVIDENCE_ATTACHMENTS = 3;

export interface IepCellState {
  curriculumId?: string;
  levelOverride?: VcLevel;
  entrySkillsOverride?: string;
  progress: number;
  status: IepStatus;
  /** 3-step cross-check state — drives status & progress. */
  crossChecks: CrossChecks;
  comment: string;
  evidenceCount: number;
  attachments?: EvidenceAttachment[];
  updatedAt?: string;
  updatedBy?: string;
}

/** Derive status + progress from the 3-step cross-check. */
export function deriveFromChecks(checks: CrossChecks): { status: IepStatus; progress: number } {
  const count = checks.filter(Boolean).length;
  if (count >= 3) return { status: "achieved", progress: 100 };
  if (count === 2) return { status: "working-towards", progress: 66 };
  if (count === 1) return { status: "working-towards", progress: 33 };
  return { status: "developing", progress: 10 };
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

const STORAGE_KEY = "schoolmate.curriculum.v3";
const MAX_AUDIT = 100;

// ---------- Seed IEP cells (matches previous demo state) ----------

const cellKey = (studentId: string, subject: string, strand: string) =>
  `${studentId}::${subject}::${strand}`;

function seedCells(): Record<string, IepCellState> {
  const mk = (checks: CrossChecks, patch: Partial<IepCellState> = {}): Partial<IepCellState> => {
    const { status, progress } = deriveFromChecks(checks);
    return { crossChecks: checks, status, progress, ...patch };
  };
  const base: IepCellState = {
    progress: 0, status: "developing", comment: "", evidenceCount: 0,
    crossChecks: [false, false, false],
  };
  const seeds: Array<[string, string, string, Partial<IepCellState>]> = [
    ["s1", "Mathematics", "Number", mk([true, false, false], { curriculumId: "ma-n-f", evidenceCount: 8, comment: "Mia counting 0–15 confidently." })],
    ["s1", "English", "Reading and Viewing", mk([true, false, false], { curriculumId: "en-rv-b1", evidenceCount: 3 })],
    ["s2", "English", "Speaking and Listening", mk([true, false, false], { curriculumId: "en-sl-c", evidenceCount: 12 })],
    ["s2", "English", "Reading and Viewing", mk([true, true, false], { curriculumId: "en-rv-d", evidenceCount: 3 })],
    ["s3", "English", "Writing", mk([true, true, true], { curriculumId: "en-w-f", evidenceCount: 14 })],
    ["s3", "Science", "Science Understanding", mk([true, false, false], { curriculumId: "sc-f", evidenceCount: 3 })],
    ["s4", "Physical Education", "Movement and Physical Activity", mk([true, true, false], { curriculumId: "pe-d", evidenceCount: 4 })],
    ["s5", "Music", "Making and Responding", mk([true, false, false], { curriculumId: "mu-c", evidenceCount: 2 })],
    ["s5", "English", "Speaking and Listening", mk([true, true, true], { curriculumId: "en-sl-c", evidenceCount: 9 })],
    ["s7", "Learn to Play", "Play Skills", mk([true, false, false], { curriculumId: "l2p-d", evidenceCount: 2 })],
    ["s8", "Drama", "Making and Responding", mk([true, false, false], { curriculumId: "dr-c", evidenceCount: 1 })],
    ["s8", "English", "Speaking and Listening", mk([true, false, false], { curriculumId: "en-sl-c", evidenceCount: 7 })],
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

// Cache the SSR snapshot so useSyncExternalStore doesn't loop.
const serverSnapshot: StoreState = initialState();
const getServerSnapshot = () => serverSnapshot;
const getSnapshot = () => state;

export function useCurriculumStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
  const base: IepCellState = {
    progress: 0, status: "developing", comment: "", evidenceCount: 0,
    crossChecks: [false, false, false],
  };
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
