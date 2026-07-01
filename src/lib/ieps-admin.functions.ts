// Admin-only override server functions. These allow updating specialist notes
// or cross-check status even when semesters/students/domains don't match the
// underlying goal, but every override is written to `iep_override_audit`.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  iepGoals,
  specialistEntries,
  availableSemesters,
  type Semester,
  type SpecialistSubject,
  type SpecialistEntry,
  type SuccessCriterion,
} from "./mock-data";

const SPECIALIST_ROLES: SpecialistSubject[] = [
  "PE",
  "Music",
  "Drama",
  "Visual Arts",
  "Learn to Play",
];
const STATUSES = ["developing", "working-towards", "achieved"] as const;

function assertSemester(v: unknown): Semester {
  if (typeof v !== "string" || !availableSemesters.includes(v as Semester)) {
    throw new Error(`Invalid semester: ${String(v)}`);
  }
  return v as Semester;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) {
    const err: any = new Error("forbidden: admin role required");
    err.code = "forbidden";
    throw err;
  }
}

function requireReason(reason: string) {
  const r = String(reason ?? "").trim();
  if (r.length < 5) {
    throw new Error("An override reason of at least 5 characters is required.");
  }
  return r;
}

// --- Cross-check override ---
export const adminUpdateCrossCheckStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: {
    goalId: string;
    criterionIndex: number;
    status: string;
    activeSemester: string;
    reason: string;
  }) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid payload");
    const goalId = String(raw.goalId ?? "");
    const criterionIndex = Number(raw.criterionIndex);
    if (!goalId) throw new Error("goalId is required.");
    if (!Number.isInteger(criterionIndex) || criterionIndex < 0) {
      throw new Error("criterionIndex must be a non-negative integer.");
    }
    if (!(STATUSES as readonly string[]).includes(raw.status)) {
      throw new Error(`Invalid status: ${raw.status}`);
    }
    const activeSemester =
      raw.activeSemester === "all" ? "all" : assertSemester(raw.activeSemester);
    return {
      goalId,
      criterionIndex,
      status: raw.status as (typeof STATUSES)[number],
      activeSemester,
      reason: requireReason(raw.reason),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const goal = iepGoals.find((g) => g.id === data.goalId);
    if (!goal) return { ok: false as const, error: "goal_not_found" };
    if (data.criterionIndex >= goal.successCriteria.length) {
      return { ok: false as const, error: "invalid_index" };
    }

    const semesterMismatch =
      data.activeSemester !== "all" && data.activeSemester !== goal.semester;

    // Persist audit + apply to DB (best-effort; still mutate in-memory model for UI).
    const { data: rpc, error } = await context.supabase.rpc(
      "admin_update_cross_check_status",
      {
        p_goal_id: data.goalId,
        p_criterion_index: data.criterionIndex,
        p_status: data.status,
        p_active_semester: data.activeSemester,
        p_reason: data.reason,
      },
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }

    const updated: SuccessCriterion = {
      ...goal.successCriteria[data.criterionIndex],
      status: data.status,
    };
    goal.successCriteria[data.criterionIndex] = updated;

    return {
      ok: true as const,
      override: true,
      semesterMismatch,
      goalId: goal.id,
      criterionIndex: data.criterionIndex,
      status: data.status,
      audit: rpc,
    };
  });

// --- Specialist note override ---
export const adminSaveSpecialistNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: {
    specialistName: string;
    specialistRole: string;
    studentId: string;
    goalId: string;
    comment: string;
    withPhoto?: boolean;
    activeSemester: string;
    reason: string;
  }) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid payload");
    const specialistName = String(raw.specialistName ?? "").trim();
    const comment = String(raw.comment ?? "").trim();
    const studentId = String(raw.studentId ?? "");
    const goalId = String(raw.goalId ?? "");
    if (!specialistName) throw new Error("Specialist name is required.");
    if (!comment) throw new Error("Comment is required.");
    if (!studentId) throw new Error("Student is required.");
    if (!goalId) throw new Error("Goal is required.");
    if (!SPECIALIST_ROLES.includes(raw.specialistRole as SpecialistSubject)) {
      throw new Error(`Invalid specialist role: ${raw.specialistRole}`);
    }
    return {
      specialistName,
      specialistRole: raw.specialistRole as SpecialistSubject,
      studentId,
      goalId,
      comment,
      withPhoto: Boolean(raw.withPhoto),
      activeSemester: assertSemester(raw.activeSemester),
      reason: requireReason(raw.reason),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const goal = iepGoals.find((g) => g.id === data.goalId);
    if (!goal) return { ok: false as const, error: "goal_not_found" };

    const mismatch = {
      student: goal.studentId !== data.studentId,
      domain: goal.learningArea !== data.specialistRole,
      semester: goal.semester !== data.activeSemester,
    };
    const anyMismatch = mismatch.student || mismatch.domain || mismatch.semester;

    const { data: rpc, error } = await context.supabase.rpc(
      "admin_upsert_specialist_note",
      {
        p_note_id: null,
        p_goal_id: data.goalId,
        p_student_id: data.studentId,
        p_specialist_role: data.specialistRole,
        p_specialist_name: data.specialistName,
        p_semester: data.activeSemester,
        p_comment: data.comment,
        p_photo_hue: data.withPhoto ? Math.floor(Math.random() * 360) : null,
        p_reason: data.reason,
      },
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }

    const entry: SpecialistEntry = {
      id: `sp-admin-${Date.now()}`,
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

    return {
      ok: true as const,
      override: true,
      anyMismatch,
      mismatch,
      entry,
      audit: rpc,
    };
  });

// --- Audit log reader (admin only) ---
export const listOverrideAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("iep_override_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, rows: data ?? [] };
  });

// Helper: is current user an admin? Used to conditionally render override UI.
export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return { isAdmin: false };
    return { isAdmin: Boolean(data) };
  });
