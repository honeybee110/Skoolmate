// Shared, isomorphic rules for IEP goal linkage.
// Used on the client for optimistic UI and on the server for authoritative
// enforcement, so a mismatched save can never be persisted via the API.

import type { IepGoal, Semester, SpecialistSubject } from "./mock-data";

export type IepRuleError =
  | { code: "goal_not_found"; message: string }
  | { code: "semester_mismatch"; message: string; goalSemester: Semester; activeSemester: Semester }
  | { code: "student_mismatch"; message: string }
  | { code: "domain_mismatch"; message: string }
  | { code: "goal_required"; message: string }
  | { code: "invalid_status"; message: string };

export interface SpecialistNoteInput {
  studentId: string;
  goalId: string;
  specialistRole: SpecialistSubject;
  activeSemester: Semester;
}

export interface CrossCheckSelectionInput {
  goalId: string;
  criterionIndex: number;
  status: "developing" | "working-towards" | "achieved";
  activeSemester: Semester | "all";
}

export function validateSpecialistNote(
  input: SpecialistNoteInput,
  goals: readonly IepGoal[],
): IepRuleError | null {
  if (!input.goalId) {
    return { code: "goal_required", message: "A matching IEP goal must be linked before saving." };
  }
  const goal = goals.find((g) => g.id === input.goalId);
  if (!goal) return { code: "goal_not_found", message: `IEP goal ${input.goalId} does not exist.` };

  if (goal.studentId !== input.studentId) {
    return { code: "student_mismatch", message: "Linked goal belongs to a different student." };
  }
  if (goal.learningArea !== input.specialistRole) {
    return {
      code: "domain_mismatch",
      message: `Specialist role (${input.specialistRole}) does not match the goal's learning area (${goal.learningArea}).`,
    };
  }
  if (goal.semester !== input.activeSemester) {
    return {
      code: "semester_mismatch",
      message: `Goal belongs to ${goal.semester}, but the active semester is ${input.activeSemester}. Specialist notes must be filed in the same semester as the goal.`,
      goalSemester: goal.semester,
      activeSemester: input.activeSemester,
    };
  }
  return null;
}

export function validateCrossCheckSelection(
  input: CrossCheckSelectionInput,
  goals: readonly IepGoal[],
): IepRuleError | null {
  const goal = goals.find((g) => g.id === input.goalId);
  if (!goal) return { code: "goal_not_found", message: `IEP goal ${input.goalId} does not exist.` };

  if (input.activeSemester !== "all" && goal.semester !== input.activeSemester) {
    return {
      code: "semester_mismatch",
      message: `Cross-Check descriptors for this goal are locked to ${goal.semester}. Switch the active semester to modify them.`,
      goalSemester: goal.semester,
      activeSemester: input.activeSemester,
    };
  }
  if (input.criterionIndex < 0 || input.criterionIndex >= goal.successCriteria.length) {
    return { code: "invalid_status", message: "Criterion index out of range." };
  }
  if (!["developing", "working-towards", "achieved"].includes(input.status)) {
    return { code: "invalid_status", message: `Unknown status "${input.status}".` };
  }
  return null;
}
