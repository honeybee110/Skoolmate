// Integration tests for the IEP server functions.
// These exercise the full createServerFn pipeline (input validator + handler +
// shared rule validation) to prove cross-semester mismatches are rejected
// authoritatively — not just at the UI layer.
import { describe, it, expect, beforeEach } from "vitest";
import { saveSpecialistNote, updateCrossCheckStatus } from "../ieps.functions";
import { iepGoals, specialistEntries, type IepGoal, type SpecialistEntry } from "../mock-data";

// Snapshot + restore the shared mock stores so tests don't leak into each other.
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

// Helpers
const SEM1 = "Semester 1 · 2026" as const;
const SEM2 = "Semester 2 · 2026" as const;

function findGoalInSemester(sem: typeof SEM1 | typeof SEM2, role?: string) {
  return iepGoals.find(
    (g) => g.semester === sem && (role ? g.learningArea === role : true),
  );
}

describe("saveSpecialistNote", () => {
  it("persists a note when student, domain and semester all match", async () => {
    // Pick a PE-eligible goal if any; otherwise fabricate by aligning fields.
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    // Force the goal's learningArea to a specialist domain for a positive-path test.
    goal.learningArea = "PE";

    const before = specialistEntries.length;
    const result = await saveSpecialistNote({
      data: {
        specialistName: "Ms Kate",
        specialistRole: "PE",
        studentId: goal.studentId,
        goalId: goal.id,
        comment: "Completed warm-up circuit independently.",
        activeSemester: SEM1,
      },
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
      data: {
        specialistName: "Ms Kate",
        specialistRole: "PE",
        studentId: goal.studentId,
        goalId: goal.id,
        comment: "Should be rejected.",
        activeSemester: SEM2, // mismatched
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("semester_mismatch");
      if (result.error.code === "semester_mismatch") {
        expect(result.error.goalSemester).toBe(SEM1);
        expect(result.error.activeSemester).toBe(SEM2);
      }
    }
    // No write should occur.
    expect(specialistEntries.length).toBe(before);
  });

  it("rejects a note when the linked goal belongs to a different student", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE";

    const result = await saveSpecialistNote({
      data: {
        specialistName: "Ms Kate",
        specialistRole: "PE",
        studentId: "s-does-not-match",
        goalId: goal.id,
        comment: "Should be rejected.",
        activeSemester: SEM1,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("student_mismatch");
  });

  it("rejects a note when specialist role does not match the goal's learning area", async () => {
    const goal = iepGoals.find((g) => g.semester === SEM1) as IepGoal;
    goal.learningArea = "PE";

    const result = await saveSpecialistNote({
      data: {
        specialistName: "Ms Kate",
        specialistRole: "Music", // mismatch vs PE
        studentId: goal.studentId,
        goalId: goal.id,
        comment: "Should be rejected.",
        activeSemester: SEM1,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("domain_mismatch");
  });

  it("rejects a note with no goalId", async () => {
    const result = await saveSpecialistNote({
      data: {
        specialistName: "Ms Kate",
        specialistRole: "PE",
        studentId: "s1",
        goalId: "",
        comment: "Missing goal.",
        activeSemester: SEM1,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("goal_required");
  });
});

describe("updateCrossCheckStatus", () => {
  it("updates a criterion when the active semester matches the goal", async () => {
    const goal = findGoalInSemester(SEM1) as IepGoal;
    const originalStatus = goal.successCriteria[0].status;
    const targetStatus = originalStatus === "achieved" ? "developing" : "achieved";

    const result = await updateCrossCheckStatus({
      data: {
        goalId: goal.id,
        criterionIndex: 0,
        status: targetStatus,
        activeSemester: SEM1,
      },
    });

    expect(result.ok).toBe(true);
    expect(goal.successCriteria[0].status).toBe(targetStatus);
  });

  it("allows updates when active semester is 'all'", async () => {
    const goal = findGoalInSemester(SEM1) as IepGoal;
    const result = await updateCrossCheckStatus({
      data: {
        goalId: goal.id,
        criterionIndex: 0,
        status: "working-towards",
        activeSemester: "all",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an update when active semester does not match the goal's semester", async () => {
    const goal = findGoalInSemester(SEM1) as IepGoal;
    const before = goal.successCriteria[0].status;

    const result = await updateCrossCheckStatus({
      data: {
        goalId: goal.id,
        criterionIndex: 0,
        status: "achieved",
        activeSemester: SEM2, // mismatched
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("semester_mismatch");
      if (result.error.code === "semester_mismatch") {
        expect(result.error.goalSemester).toBe(SEM1);
        expect(result.error.activeSemester).toBe(SEM2);
      }
    }
    // Criterion must be unchanged.
    expect(goal.successCriteria[0].status).toBe(before);
  });

  it("rejects an update to an unknown goal id", async () => {
    const result = await updateCrossCheckStatus({
      data: {
        goalId: "no-such-goal",
        criterionIndex: 0,
        status: "achieved",
        activeSemester: SEM1,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("goal_not_found");
  });

  it("throws at the input validator on an invalid status string", async () => {
    const goal = findGoalInSemester(SEM1) as IepGoal;
    await expect(
      updateCrossCheckStatus({
        data: {
          goalId: goal.id,
          criterionIndex: 0,
          status: "bogus" as unknown as "achieved",
          activeSemester: SEM1,
        },
      }),
    ).rejects.toThrow(/Invalid status/);
  });
});
