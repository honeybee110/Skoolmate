import type { SemesterScope } from "./semester-context";
import type { Semester } from "./mock-data";

export type ScopedSearch = {
  student?: string;
  semester?: Semester | "all";
  goal?: string;
};

/**
 * Build a search-params object for drill-down navigation that always preserves
 * the active semester scope and (optionally) a student / goal focus.
 *
 * - `semester` is omitted when the active scope is "all", so URLs stay clean
 *   but still implicitly inherit the global chip.
 * - Explicit `override.semester` (e.g. a row's own semester from a report)
 *   wins over the active scope so cross-semester drill-downs work.
 */
export function scopedSearch(
  activeSemester: SemesterScope,
  override: { student?: string; semester?: SemesterScope; goal?: string } = {},
): ScopedSearch {
  const semester = override.semester ?? activeSemester;
  const out: ScopedSearch = {};
  if (semester && semester !== "all") out.semester = semester as Semester;
  if (override.student) out.student = override.student;
  if (override.goal) out.goal = override.goal;
  return out;
}
