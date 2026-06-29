import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { availableSemesters, currentSemester, type Semester } from "@/lib/mock-data";

type SemesterScope = Semester | "all";

interface SemesterContextValue {
  activeSemester: SemesterScope;
  setActiveSemester: (s: SemesterScope) => void;
  options: SemesterScope[];
  matches: (s: Semester | undefined | null) => boolean;
}

const SemesterContext = createContext<SemesterContextValue | null>(null);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const [activeSemester, setActiveSemester] = useState<SemesterScope>(currentSemester);

  const value = useMemo<SemesterContextValue>(
    () => ({
      activeSemester,
      setActiveSemester,
      options: ["all", ...availableSemesters],
      matches: (s) => activeSemester === "all" || s === activeSemester,
    }),
    [activeSemester],
  );

  return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>;
}

export function useActiveSemester() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useActiveSemester must be used inside SemesterProvider");
  return ctx;
}

export function semesterShortLabel(s: SemesterScope) {
  if (s === "all") return "All semesters";
  return s.replace("Semester ", "Sem ");
}

export type { SemesterScope };
