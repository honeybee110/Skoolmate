// skoolmate — Daily attendance/roll store, persisted to localStorage.
// The roll is marked TWICE per day:
//   • AM roll — before 9:30 AM (start of day)
//   • PM roll — at 12:30 PM (after lunch)
import { useSyncExternalStore } from "react";

export type AttendanceMark = "present" | "absent" | "late" | "medical" | "excused";
export type RollSession = "AM" | "PM";

export const ATTENDANCE_MARKS: { value: AttendanceMark; label: string; tone: string; short: string }[] = [
  { value: "present", label: "Present",  tone: "bg-emerald-100 text-emerald-700 border-emerald-300", short: "P" },
  { value: "late",    label: "Late",     tone: "bg-amber-100 text-amber-700 border-amber-300",       short: "L" },
  { value: "absent",  label: "Absent",   tone: "bg-rose-100 text-rose-700 border-rose-300",          short: "A" },
  { value: "medical", label: "Medical",  tone: "bg-sky-100 text-sky-700 border-sky-300",             short: "M" },
  { value: "excused", label: "Excused",  tone: "bg-violet-100 text-violet-700 border-violet-300",    short: "E" },
];

export const SESSION_META: Record<RollSession, { label: string; window: string; deadline: string }> = {
  AM: { label: "Morning roll",   window: "Before 9:30 AM", deadline: "09:30" },
  PM: { label: "Afternoon roll", window: "At 12:30 PM",    deadline: "12:30" },
};

export interface AttendanceEntry {
  studentId: string;
  session: RollSession;
  mark: AttendanceMark;
  note?: string;
  updatedAt: string;
}

interface State {
  /** key: `${dateISO}::${session}::${studentId}` */
  entries: Record<string, AttendanceEntry>;
}

const KEY = "skoolmate.attendance.v2";
let state: State = load() ?? { entries: {} };
const listeners = new Set<() => void>();

function load(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch { return null; }
}
function persist() { if (typeof window !== "undefined") try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }
function emit() { persist(); for (const l of listeners) l(); }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
const getServer = () => ({ entries: {} });

export function useAttendanceStore(): State {
  return useSyncExternalStore(subscribe, () => state, getServer);
}

export const attendanceKey = (date: string, session: RollSession, studentId: string) =>
  `${date}::${session}::${studentId}`;

export function markAttendance(date: string, session: RollSession, studentId: string, mark: AttendanceMark, note?: string) {
  state = {
    entries: {
      ...state.entries,
      [attendanceKey(date, session, studentId)]: { studentId, session, mark, note, updatedAt: new Date().toISOString() },
    },
  };
  emit();
}

export function bulkMark(date: string, session: RollSession, studentIds: string[], mark: AttendanceMark) {
  const now = new Date().toISOString();
  const next = { ...state.entries };
  for (const id of studentIds) next[attendanceKey(date, session, id)] = { studentId: id, session, mark, updatedAt: now };
  state = { entries: next };
  emit();
}

export function clearDay(date: string, session: RollSession, studentIds: string[]) {
  const next = { ...state.entries };
  for (const id of studentIds) delete next[attendanceKey(date, session, id)];
  state = { entries: next };
  emit();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns whether the current time is past the session deadline (for the "overdue" chip). */
export function isSessionOverdue(session: RollSession, date: string): boolean {
  const now = new Date();
  const today = todayISO();
  if (date < today) return true;
  if (date > today) return false;
  const [h, m] = SESSION_META[session].deadline.split(":").map(Number);
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
}
