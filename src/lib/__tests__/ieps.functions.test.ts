// Integration tests for the IEP server-function pipeline.
//
// createServerFn's client stub relies on the Vite plugin's runtime resolver,
// which isn't wired up in Vitest. So we invoke the *same* input validator
// and handler that createServerFn wraps — this is the full server-side
// pipeline (validate raw input -> enforce shared IEP rules -> persist),
// just without the RPC transport in between.
import { describe, it, expect, beforeEach } from "vitest";
import {
  validateSpecialistNoteInput,
  saveSpecialistNoteHandler,
  validateCrossCheckInput,
  updateCrossCheckStatusHandler,
} from "../ieps.functions";
import {
  iepGoals,
  specialistEntries,
  type IepGoal,
  type SpecialistEntry,
} from "../mock-data";

const SEM1 = "Semester 1 · 2026" as const;
const SEM2 = "Semester 2 · 2026" as const;

async function saveSpecialistNote(raw: Parameters<typeof validateSpecialistNoteInput>[0]) {
  return saveSpecialistNoteHandler(validateSpecialistNoteInput(raw));
}
async function updateCrossCheckStatus(raw: Parameters<typeof validateCrossCheckInput>[0]) {
  return updateCrossCheckStatusHandler(validateCrossCheckInput(raw));
}

// Snapshot + restore shared mock stores so tests never leak into each other.
let goalsSnapshot: IepGoal[];
let entriesSnapshot: SpecialistEntry[];
beforeEach(() => {
  goalsSnapshot = iepGoals.map((g) => ({
    ...g,
    successCriteria: g.successCriteria.map((c) => ({ ...c })),
  }));
  entriesSnapshot = [...specialistEntries];
  return () => {
    iepGoals.splice(0, iepGoals.length, ...goalsSnapshot);
    specialistEntries.splice(0, specialistEntries.length, ...entriesSnapshot);
  };
});

describe("saveSpecialistNote", () => {
  it("persists a note when student, domain and semester all match", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE"; // align with specialist role for happy-path
    const before = specialistEntries.length;

    const result = await saveSpecialistNote({
      specialistName: "Ms Kate",
      specialistRole: "PE",
      studentId: goal.studentId,
      goalId: goal.id,
      comment: "Completed warm-up circuit independently.",
      activeSemester: SEM1,
    });

    expect(result.ok).toBe(true);
    expect(specialistEntries.length).toBe(before + 1);
    if (result.ok) {
      expect(result.entry.semester).toBe(SEM1);
      expect(result.entry.goalId).toBe(goal.id);
    }
  });

  it("rejects a note when the goal is from a different semester than the active one", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE";
    const before = specialistEntries.length;

    const result = await saveSpecialistNote({
      specialistName: "Ms Kate",
      specialistRole: "PE",
      studentId: goal.studentId,
      goalId: goal.id,
      comment: "Should be rejected.",
      activeSemester: SEM2,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.code === "semester_mismatch") {
      expect(result.error.goalSemester).toBe(SEM1);
      expect(result.error.activeSemester).toBe(SEM2);
    } else {
      throw new Error(`expected semester_mismatch, got ${JSON.stringify(result)}`);
    }
    expect(specialistEntries.length).toBe(before);
  });

  it("rejects the reverse mismatch: Sem2 goal saved under active Sem1", async () => {
    // Move an existing goal to Semester 2 so the mismatch is real, not synthetic.
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.semester = SEM2;
    goal.learningArea = "Music";

    const result = await saveSpecialistNote({
      specialistName: "Mr Dan",
      specialistRole: "Music",
      studentId: goal.studentId,
      goalId: goal.id,
      comment: "Rejected due to semester scope.",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("semester_mismatch");
  });

  it("rejects a note when the linked goal belongs to a different student", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE";

    const result = await saveSpecialistNote({
      specialistName: "Ms Kate",
      specialistRole: "PE",
      studentId: "not-the-owner",
      goalId: goal.id,
      comment: "Should be rejected.",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("student_mismatch");
  });

  it("rejects a note when specialist role does not match the goal's learning area", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE";

    const result = await saveSpecialistNote({
      specialistName: "Ms Kate",
      specialistRole: "Music",
      studentId: goal.studentId,
      goalId: goal.id,
      comment: "Should be rejected.",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("domain_mismatch");
  });

  it("rejects a note with no goalId", async () => {
    const result = await saveSpecialistNote({
      specialistName: "Ms Kate",
      specialistRole: "PE",
      studentId: "s1",
      goalId: "",
      comment: "Missing goal.",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("goal_required");
  });

  it("input validator throws on an unknown specialist role", () => {
    expect(() =>
      validateSpecialistNoteInput({
        specialistName: "X",
        specialistRole: "SLP", // removed role
        studentId: "s1",
        goalId: "g1",
        comment: "x",
        activeSemester: SEM1,
      }),
    ).toThrow(/Invalid specialist role/);
  });

  it("input validator throws on an unknown semester", () => {
    expect(() =>
      validateSpecialistNoteInput({
        specialistName: "X",
        specialistRole: "PE",
        studentId: "s1",
        goalId: "g1",
        comment: "x",
        activeSemester: "Semester 3 · 2099",
      }),
    ).toThrow(/Invalid semester/);
  });
});

describe("updateCrossCheckStatus", () => {
  it("updates a criterion when the active semester matches the goal", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    const originalStatus = goal.successCriteria[0].status;
    const targetStatus = originalStatus === "achieved" ? "developing" : "achieved";

    const result = await updateCrossCheckStatus({
      goalId: goal.id,
      criterionIndex: 0,
      status: targetStatus,
      activeSemester: SEM1,
    });

    expect(result.ok).toBe(true);
    expect(goal.successCriteria[0].status).toBe(targetStatus);
  });

  it("allows updates when active semester is 'all'", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    const result = await updateCrossCheckStatus({
      goalId: goal.id,
      criterionIndex: 0,
      status: "working-towards",
      activeSemester: "all",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects when active semester does not match the goal's semester (Sem2 active, Sem1 goal)", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    const before = goal.successCriteria[0].status;

    const result = await updateCrossCheckStatus({
      goalId: goal.id,
      criterionIndex: 0,
      status: "achieved",
      activeSemester: SEM2,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.code === "semester_mismatch") {
      expect(result.error.goalSemester).toBe(SEM1);
      expect(result.error.activeSemester).toBe(SEM2);
    } else {
      throw new Error(`expected semester_mismatch, got ${JSON.stringify(result)}`);
    }
    expect(goal.successCriteria[0].status).toBe(before);
  });

  it("rejects the reverse mismatch: Sem1 active, Sem2 goal", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.semester = SEM2;
    const before = goal.successCriteria[0].status;

    const result = await updateCrossCheckStatus({
      goalId: goal.id,
      criterionIndex: 0,
      status: "achieved",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("semester_mismatch");
    expect(goal.successCriteria[0].status).toBe(before);
  });

  it("rejects an update to an unknown goal id", async () => {
    const result = await updateCrossCheckStatus({
      goalId: "no-such-goal",
      criterionIndex: 0,
      status: "achieved",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("goal_not_found");
  });

  it("rejects an out-of-range criterion index", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    const result = await updateCrossCheckStatus({
      goalId: goal.id,
      criterionIndex: 999,
      status: "achieved",
      activeSemester: SEM1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid_status");
  });

  it("input validator throws on an invalid status string", () => {
    expect(() =>
      validateCrossCheckInput({
        goalId: "g1",
        criterionIndex: 0,
        status: "bogus",
        activeSemester: SEM1,
      }),
    ).toThrow(/Invalid status/);
  });

  it("input validator throws on an invalid semester", () => {
    expect(() =>
      validateCrossCheckInput({
        goalId: "g1",
        criterionIndex: 0,
        status: "achieved",
        activeSemester: "Semester 9 · 3000",
      }),
    ).toThrow(/Invalid semester/);
  });
});
