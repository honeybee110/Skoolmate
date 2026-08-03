// Server functions that enforce IEP semester-scope rules authoritatively.
// The client calls these; any mismatch is rejected before persistence.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { iepGoals, specialistEntries, availableSemesters } from "./mock-data";
import type { Semester, SpecialistSubject, SpecialistEntry, SuccessCriterion } from "./mock-data";
import { validateSpecialistNote, validateCrossCheckSelection } from "./iep-rules";

const SPECIALIST_ROLES: SpecialistSubject[] = ["PE", "Music", "Drama", "Visual Arts", "Learn to Play"];
const STATUSES = ["developing", "working-towards", "achieved"] as const;

function assertSemester(v: unknown): Semester {
  if (typeof v !== "string" || !availableSemesters.includes(v as Semester)) {
    throw new Error(`Invalid semester: ${String(v)}`);
  }
  return v as Semester;
}

// Exported so integration tests can exercise validator + handler together
// without bundler-specific server-fn dispatch. createServerFn below wraps
// exactly these same functions, so tests remain authoritative.
export function validateSpecialistNoteInput(raw: {
  specialistName: string;
  specialistRole: string;
  studentId: string;
  goalId: string;
  comment: string;
  withPhoto?: boolean;
  activeSemester: string;
}) {
  if (!raw || typeof raw !== "object") throw new Error("Invalid payload");
  const specialistName = String(raw.specialistName ?? "").trim();
  const comment = String(raw.comment ?? "").trim();
  const studentId = String(raw.studentId ?? "");
  const goalId = String(raw.goalId ?? "");
  const withPhoto = Boolean(raw.withPhoto);
  if (!specialistName) throw new Error("Specialist name is required.");
  if (!comment) throw new Error("Comment is required.");
  if (!studentId) throw new Error("Student is required.");
  if (!SPECIALIST_ROLES.includes(raw.specialistRole as SpecialistSubject)) {
    throw new Error(`Invalid specialist role: ${raw.specialistRole}`);
  }
  return {
    specialistName,
    specialistRole: raw.specialistRole as SpecialistSubject,
    studentId,
    goalId,
    comment,
    withPhoto,
    activeSemester: assertSemester(raw.activeSemester),
  };
}

export async function saveSpecialistNoteHandler(
  data: ReturnType<typeof validateSpecialistNoteInput>,
) {
  const err = validateSpecialistNote(
    {
      studentId: data.studentId,
      goalId: data.goalId,
      specialistRole: data.specialistRole,
      activeSemester: data.activeSemester,
    },
    iepGoals,
  );
  if (err) {
    return { ok: false as const, error: err };
  }
  const entry: SpecialistEntry = {
    id: `sp-${Date.now()}`,
    specialistName: data.specialistName,
    specialistRole: data.specialistRole,
    studentId: data.studentId,
    goalId: data.goalId,
    comment: data.comment,
    photoHue: data.withPhoto ? Math.floor(Math.random() * 360) : undefined,
    addedAt: "Just now",
    semester: data.activeSemester,
  };
  specialistEntries.unshift(entry);
  return { ok: true as const, entry };
}

export const saveSpecialistNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateSpecialistNoteInput)
  .handler(async ({ data }) => saveSpecialistNoteHandler(data));

export function validateCrossCheckInput(raw: {
  goalId: string;
  criterionIndex: number;
  status: string;
  activeSemester: string;
}) {
  if (!raw || typeof raw !== "object") throw new Error("Invalid payload");
  const goalId = String(raw.goalId ?? "");
  const criterionIndex = Number(raw.criterionIndex);
  if (!Number.isInteger(criterionIndex) || criterionIndex < 0) {
    throw new Error("criterionIndex must be a non-negative integer.");
  }
  if (!(STATUSES as readonly string[]).includes(raw.status)) {
    throw new Error(`Invalid status: ${raw.status}`);
  }
  const activeSemester =
    raw.activeSemester === "all" ? ("all" as const) : assertSemester(raw.activeSemester);
  return {
    goalId,
    criterionIndex,
    status: raw.status as (typeof STATUSES)[number],
    activeSemester,
  };
}

export async function updateCrossCheckStatusHandler(
  data: ReturnType<typeof validateCrossCheckInput>,
) {
  const err = validateCrossCheckSelection(
    {
      goalId: data.goalId,
      criterionIndex: data.criterionIndex,
      status: data.status,
      activeSemester: data.activeSemester,
    },
    iepGoals,
  );
  if (err) return { ok: false as const, error: err };

  const goal = iepGoals.find((g) => g.id === data.goalId)!;
  const updated: SuccessCriterion = {
    ...goal.successCriteria[data.criterionIndex],
    status: data.status,
  };
  goal.successCriteria[data.criterionIndex] = updated;
  return {
    ok: true as const,
    goalId: goal.id,
    criterionIndex: data.criterionIndex,
    status: data.status,
  };
}

export const updateCrossCheckStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCrossCheckInput)
  .handler(async ({ data }) => updateCrossCheckStatusHandler(data));
