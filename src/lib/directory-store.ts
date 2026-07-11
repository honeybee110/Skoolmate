// Client-side directory of record for teachers, classes, students, timetables,
// and school years. Persisted to localStorage; reactive via useSyncExternalStore.
// Seeded from mock-data on first load. Does NOT touch the Supabase schema.

import { useSyncExternalStore } from "react";
import { students as seedStudents, weeklyTimetable, type WeekDay } from "@/lib/mock-data";

export type StaffRole =
  | "Teacher"
  | "ES"
  | "Learning Specialist"
  | "AP"
  | "Principal"
  | "OT"
  | "SLP"
  | "Physio"
  | "Wellbeing"
  | "Nurse"
  | "IT";

export type EmploymentStatus = "Full-time" | "Part-time" | "Casual" | "Archived";
export type ClassBand = "Prep" | "Primary" | "Secondary";
export type TimetableStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "returned"
  | "approved"
  | "published";
export type YearStatus = "archived" | "active" | "planning";

export interface ClockEvent { at: string; type: "in" | "out" }
export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  email: string;
  phone?: string;
  employment: EmploymentStatus;
  classIds: string[];
  avatarHue: number;
  archived: boolean;
  clock: ClockEvent[];
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "Prep 1", "Primary 7", "Secondary 3"
  band: ClassBand;
  yearLevel: string;
  room: string;
  teacherId?: string;
  esStaffIds: string[];
  studentIds: string[];
  yearId: string;
}

export interface TimetableCell { subject: string; room: string }
export interface TimetableComment { id: string; author: string; at: string; body: string }
export interface Timetable {
  id: string;
  classId: string;
  yearId: string;
  status: TimetableStatus;
  grid: Record<WeekDay, Record<number, TimetableCell>>;
  comments: TimetableComment[];
  version: number;
  updatedAt: string;
}

export interface SchoolYear {
  id: string;
  label: string; // e.g. "2026", "2027"
  status: YearStatus;
}

export type AuditAction =
  | "teacher.add" | "teacher.update" | "teacher.archive" | "teacher.restore"
  | "class.create" | "class.update" | "class.assignTeacher" | "class.addES" | "class.removeES"
  | "student.move"
  | "timetable.submit" | "timetable.approve" | "timetable.return" | "timetable.publish"
  | "year.create" | "year.activate" | "year.archive" | "year.duplicate";

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  summary: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export interface DirectoryState {
  years: SchoolYear[];
  activeYearId: string;
  teachers: Teacher[];
  classes: ClassRoom[];
  studentClass: Record<string, string>; // studentId -> classId
  timetables: Timetable[];
  auditLog: AuditEntry[];
}

const STORAGE_KEY = "skoolmate.directory.v1";
const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function emptyGrid(): Timetable["grid"] {
  const g = {} as Timetable["grid"];
  for (const d of DAYS) {
    g[d] = {};
    for (let s = 1; s <= 5; s++) g[d][s] = { subject: "", room: "" };
  }
  return g;
}

function seedGridForClass(): Timetable["grid"] {
  const g = emptyGrid();
  for (const d of DAYS) {
    for (const slot of weeklyTimetable[d]) {
      g[d][slot.session] = { subject: slot.title, room: "" };
    }
  }
  return g;
}

function seed(): DirectoryState {
  const yearId = "yr-2026";
  const nextYearId = "yr-2027";
  const years: SchoolYear[] = [
    { id: "yr-2025", label: "2025", status: "archived" },
    { id: yearId, label: "2026", status: "active" },
    { id: nextYearId, label: "2027", status: "planning" },
  ];

  const teachers: Teacher[] = [
    { id: "t-honey", employeeId: "EMP-1001", firstName: "Honey", lastName: "Cruz", role: "Teacher", email: "honey.cruz@skoolmate.edu", phone: "+61 400 111 001", employment: "Full-time", classIds: ["c-p7"], avatarHue: 210, archived: false, clock: [{ at: "Mon 08:12", type: "in" }, { at: "Mon 16:04", type: "out" }] },
    { id: "t-priya", employeeId: "EMP-1002", firstName: "Priya", lastName: "Patel", role: "ES", email: "priya.patel@skoolmate.edu", phone: "+61 400 111 002", employment: "Full-time", classIds: ["c-p7"], avatarHue: 300, archived: false, clock: [] },
    { id: "t-marc", employeeId: "EMP-1003", firstName: "Marc", lastName: "Adebayo", role: "Teacher", email: "marc.adebayo@skoolmate.edu", employment: "Full-time", classIds: ["c-p5"], avatarHue: 25, archived: false, clock: [] },
    { id: "t-ava", employeeId: "EMP-1004", firstName: "Ava", lastName: "Nguyen", role: "Teacher", email: "ava.nguyen@skoolmate.edu", employment: "Part-time", classIds: ["c-p8"], avatarHue: 155, archived: false, clock: [] },
    { id: "t-lena", employeeId: "EMP-1005", firstName: "Lena", lastName: "Brooks", role: "Learning Specialist", email: "lena.brooks@skoolmate.edu", employment: "Full-time", classIds: [], avatarHue: 260, archived: false, clock: [] },
    { id: "t-ari", employeeId: "EMP-1006", firstName: "Ari", lastName: "Thompson", role: "Principal", email: "ari.thompson@skoolmate.edu", employment: "Full-time", classIds: [], avatarHue: 220, archived: false, clock: [] },
    { id: "t-callum", employeeId: "EMP-1007", firstName: "Callum", lastName: "Reid", role: "AP", email: "callum.reid@skoolmate.edu", employment: "Full-time", classIds: [], avatarHue: 190, archived: false, clock: [] },
    { id: "t-shanti", employeeId: "EMP-1008", firstName: "Shanti", lastName: "Rao", role: "OT", email: "shanti.rao@skoolmate.edu", employment: "Part-time", classIds: [], avatarHue: 140, archived: false, clock: [] },
    { id: "t-jem", employeeId: "EMP-1009", firstName: "Jem", lastName: "Ok", role: "IT", email: "jem.ok@skoolmate.edu", employment: "Full-time", classIds: [], avatarHue: 60, archived: false, clock: [] },
    { id: "t-noor", employeeId: "EMP-1010", firstName: "Noor", lastName: "Haddad", role: "SLP", email: "noor.haddad@skoolmate.edu", employment: "Part-time", classIds: [], avatarHue: 320, archived: false, clock: [] },
    { id: "t-sam", employeeId: "EMP-1011", firstName: "Sam", lastName: "Fischer", role: "Wellbeing", email: "sam.fischer@skoolmate.edu", employment: "Full-time", classIds: [], avatarHue: 355, archived: false, clock: [] },
    { id: "t-riya", employeeId: "EMP-1012", firstName: "Riya", lastName: "Kaur", role: "Nurse", email: "riya.kaur@skoolmate.edu", employment: "Part-time", classIds: [], avatarHue: 10, archived: false, clock: [] },
    { id: "t-elena", employeeId: "EMP-1013", firstName: "Elena", lastName: "Ruiz", role: "ES", email: "elena.ruiz@skoolmate.edu", employment: "Casual", classIds: ["c-p5"], avatarHue: 280, archived: false, clock: [] },
    { id: "t-tom", employeeId: "EMP-1014", firstName: "Tom", lastName: "Baker", role: "Physio", email: "tom.baker@skoolmate.edu", employment: "Part-time", classIds: [], avatarHue: 100, archived: false, clock: [] },
  ];

  const buildClasses = (): ClassRoom[] => {
    const list: ClassRoom[] = [];
    // Prep 1–5
    for (let i = 1; i <= 5; i++) {
      list.push({ id: `c-prep${i}`, name: `Prep ${i}`, band: "Prep", yearLevel: "Prep", room: `Pr${i}`, teacherId: undefined, esStaffIds: [], studentIds: [], yearId });
    }
    // Primary 6–15 (P5, P7, P8 preassigned; rest empty for planning)
    for (let i = 6; i <= 15; i++) {
      const id = `c-p${i}`;
      const teacherId = i === 7 ? "t-honey" : i === 5 ? "t-marc" : i === 8 ? "t-ava" : undefined;
      const es = i === 7 ? ["t-priya"] : i === 5 ? ["t-elena"] : [];
      list.push({ id, name: `Primary ${i}`, band: "Primary", yearLevel: `Year ${i - 3}`, room: `P${i}`, teacherId, esStaffIds: es, studentIds: [], yearId });
    }
    // Also register c-p5, c-p7 as-is (matching id above ok)
    // Secondary 1–10
    for (let i = 1; i <= 10; i++) {
      list.push({ id: `c-s${i}`, name: `Secondary ${i}`, band: "Secondary", yearLevel: `Year ${6 + i}`, room: `S${i}`, teacherId: undefined, esStaffIds: [], studentIds: [], yearId });
    }
    return list;
  };

  const classes = buildClasses();

  // Assign existing mock students to Primary 7 (their class per mock).
  const p7 = classes.find((c) => c.id === "c-p7")!;
  p7.studentIds = seedStudents.map((s) => s.id);
  const studentClass: Record<string, string> = {};
  for (const s of seedStudents) studentClass[s.id] = "c-p7";

  const timetables: Timetable[] = classes
    .filter((c) => c.teacherId)
    .map((c, idx) => ({
      id: `tt-${c.id}`,
      classId: c.id,
      yearId,
      status: (["published", "approved", "submitted", "draft"] as TimetableStatus[])[idx % 4],
      grid: seedGridForClass(),
      comments: [],
      version: 1,
      updatedAt: "Today",
    }));

  return { years, activeYearId: yearId, teachers, classes, studentClass, timetables, auditLog: [] };
}

// ---------- Store ----------

let state: DirectoryState = load();
const listeners = new Set<() => void>();

function load(): DirectoryState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as DirectoryState;
    return { ...parsed, auditLog: parsed.auditLog ?? [] };
  } catch {
    return seed();
  }
}

function logAudit(action: AuditAction, summary: string, targetId?: string, meta?: Record<string, unknown>) {
  const entry: AuditEntry = {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: new Date().toISOString(),
    actor: "Leadership",
    action,
    summary,
    targetId,
    meta,
  };
  state = { ...state, auditLog: [entry, ...state.auditLog].slice(0, 500) };
}

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function set(next: DirectoryState) {
  state = next;
  persist();
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): DirectoryState {
  return state;
}

export function useDirectory(): DirectoryState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---------- Mutations ----------

export const directoryActions = {
  resetSeed() { set(seed()); },

  // Teachers
  addTeacher(input: Omit<Teacher, "id" | "clock" | "classIds" | "archived" | "avatarHue"> & { classIds?: string[]; avatarHue?: number }) {
    const t: Teacher = {
      id: `t-${crypto.randomUUID().slice(0, 8)}`,
      employeeId: input.employeeId,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      email: input.email,
      phone: input.phone,
      employment: input.employment,
      classIds: input.classIds ?? [],
      avatarHue: input.avatarHue ?? Math.floor(Math.random() * 360),
      archived: false,
      clock: [],
    };
    set({ ...state, teachers: [...state.teachers, t] });
  },
  updateTeacher(id: string, patch: Partial<Teacher>) {
    set({ ...state, teachers: state.teachers.map((t) => t.id === id ? { ...t, ...patch } : t) });
  },
  archiveTeacher(id: string) {
    set({ ...state, teachers: state.teachers.map((t) => t.id === id ? { ...t, archived: true, employment: "Archived" as EmploymentStatus } : t) });
  },
  restoreTeacher(id: string) {
    set({ ...state, teachers: state.teachers.map((t) => t.id === id ? { ...t, archived: false, employment: "Full-time" as EmploymentStatus } : t) });
  },
  clockIn(id: string) {
    const stamp = new Date().toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
    set({ ...state, teachers: state.teachers.map((t) => t.id === id ? { ...t, clock: [...t.clock, { at: stamp, type: "in" }] } : t) });
  },
  clockOut(id: string) {
    const stamp = new Date().toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
    set({ ...state, teachers: state.teachers.map((t) => t.id === id ? { ...t, clock: [...t.clock, { at: stamp, type: "out" }] } : t) });
  },

  // Classes
  createClass(input: Omit<ClassRoom, "id" | "esStaffIds" | "studentIds"> & { yearId?: string }) {
    const c: ClassRoom = {
      id: `c-${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      band: input.band,
      yearLevel: input.yearLevel,
      room: input.room,
      teacherId: input.teacherId,
      esStaffIds: [],
      studentIds: [],
      yearId: input.yearId ?? state.activeYearId,
    };
    set({ ...state, classes: [...state.classes, c] });
  },
  updateClass(id: string, patch: Partial<ClassRoom>) {
    set({ ...state, classes: state.classes.map((c) => c.id === id ? { ...c, ...patch } : c) });
  },
  assignTeacher(classId: string, teacherId: string | undefined) {
    const cls = state.classes.find((c) => c.id === classId);
    if (!cls) return;
    // remove teacher from other classes if being assigned as classroom teacher
    const teachers = teacherId
      ? state.teachers.map((t) => {
          if (t.id === teacherId) return { ...t, classIds: Array.from(new Set([...t.classIds, classId])) };
          return t;
        })
      : state.teachers;
    set({
      ...state,
      teachers,
      classes: state.classes.map((c) => c.id === classId ? { ...c, teacherId } : c),
    });
  },
  addES(classId: string, teacherId: string) {
    const cls = state.classes.find((c) => c.id === classId);
    if (!cls || cls.esStaffIds.includes(teacherId)) return;
    set({
      ...state,
      classes: state.classes.map((c) => c.id === classId ? { ...c, esStaffIds: [...c.esStaffIds, teacherId] } : c),
      teachers: state.teachers.map((t) => t.id === teacherId ? { ...t, classIds: Array.from(new Set([...t.classIds, classId])) } : t),
    });
  },
  removeES(classId: string, teacherId: string) {
    set({
      ...state,
      classes: state.classes.map((c) => c.id === classId ? { ...c, esStaffIds: c.esStaffIds.filter((x) => x !== teacherId) } : c),
      teachers: state.teachers.map((t) => t.id === teacherId ? { ...t, classIds: t.classIds.filter((x) => x !== classId) } : t),
    });
  },
  moveStudent(studentId: string, toClassId: string) {
    const fromClassId = state.studentClass[studentId];
    const classes = state.classes.map((c) => {
      if (c.id === fromClassId) return { ...c, studentIds: c.studentIds.filter((x) => x !== studentId) };
      if (c.id === toClassId) return { ...c, studentIds: Array.from(new Set([...c.studentIds, studentId])) };
      return c;
    });
    set({ ...state, classes, studentClass: { ...state.studentClass, [studentId]: toClassId } });
  },

  // Timetables
  updateTimetable(classId: string, patch: Partial<Timetable>) {
    set({ ...state, timetables: state.timetables.map((t) => t.classId === classId ? { ...t, ...patch, updatedAt: "Just now" } : t) });
  },
  ensureTimetable(classId: string): Timetable {
    let tt = state.timetables.find((t) => t.classId === classId);
    if (!tt) {
      tt = { id: `tt-${classId}`, classId, yearId: state.activeYearId, status: "draft", grid: emptyGrid(), comments: [], version: 1, updatedAt: "Just now" };
      set({ ...state, timetables: [...state.timetables, tt] });
    }
    return tt;
  },
  submitTimetable(classId: string) { directoryActions.updateTimetable(classId, { status: "submitted" }); },
  reviewTimetable(classId: string) { directoryActions.updateTimetable(classId, { status: "in_review" }); },
  approveTimetable(classId: string) { directoryActions.updateTimetable(classId, { status: "approved" }); },
  publishTimetable(classId: string) {
    const tt = state.timetables.find((t) => t.classId === classId);
    if (!tt) return;
    directoryActions.updateTimetable(classId, { status: "published", version: tt.version + 1 });
  },
  returnTimetable(classId: string, comment: string, author = "Leadership") {
    const tt = state.timetables.find((t) => t.classId === classId);
    if (!tt) return;
    directoryActions.updateTimetable(classId, {
      status: "returned",
      comments: [...tt.comments, { id: crypto.randomUUID(), author, at: "Just now", body: comment }],
    });
  },
  setCell(classId: string, day: WeekDay, session: number, cell: TimetableCell) {
    const tt = state.timetables.find((t) => t.classId === classId);
    if (!tt) return;
    const grid = { ...tt.grid, [day]: { ...tt.grid[day], [session]: cell } };
    directoryActions.updateTimetable(classId, { grid });
  },

  // School year
  createYear(label: string) {
    const id = `yr-${label}`;
    if (state.years.find((y) => y.id === id)) return;
    set({ ...state, years: [...state.years, { id, label, status: "planning" }] });
  },
  activateYear(id: string) {
    set({
      ...state,
      activeYearId: id,
      years: state.years.map((y) => y.id === id ? { ...y, status: "active" } : y.status === "active" ? { ...y, status: "archived" } : y),
    });
  },
  archiveYear(id: string) {
    set({ ...state, years: state.years.map((y) => y.id === id ? { ...y, status: "archived" } : y) });
  },
  duplicateClassesToYear(sourceYearId: string, targetYearId: string) {
    const source = state.classes.filter((c) => c.yearId === sourceYearId);
    const clones = source.map((c) => ({
      ...c,
      id: `c-${crypto.randomUUID().slice(0, 8)}`,
      yearId: targetYearId,
      studentIds: [],
      teacherId: undefined,
      esStaffIds: [],
    }));
    set({ ...state, classes: [...state.classes, ...clones] });
  },
};

// ---------- Selectors ----------

export function classDisplay(c: ClassRoom | undefined) { return c ? c.name : "Unassigned"; }
export function teacherDisplay(t: Teacher | undefined) { return t ? `${t.firstName} ${t.lastName}` : "—"; }

export const STAFF_ROLES: StaffRole[] = [
  "Teacher", "ES", "Learning Specialist", "AP", "Principal",
  "OT", "SLP", "Physio", "Wellbeing", "Nurse", "IT",
];

export const EMPLOYMENT_OPTIONS: EmploymentStatus[] = ["Full-time", "Part-time", "Casual", "Archived"];

export function statusTone(s: TimetableStatus): string {
  switch (s) {
    case "draft": return "bg-slate-100 text-slate-700 border-slate-200";
    case "submitted": return "bg-amber-100 text-amber-800 border-amber-200";
    case "in_review": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "returned": return "bg-rose-100 text-rose-800 border-rose-200";
    case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "published": return "bg-[color:var(--primary)]/10 text-[color:var(--primary)] border-[color:var(--primary)]/20";
  }
}

export function statusLabel(s: TimetableStatus): string {
  return { draft: "Draft", submitted: "Submitted", in_review: "In Review", returned: "Returned", approved: "Approved", published: "Published" }[s];
}
