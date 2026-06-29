import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Users, Camera, ClipboardList, Target, X } from "lucide-react";
import {
  students,
  evidenceItems,
  iepGoals,
  actionQueue,
} from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";

type Result =
  | { kind: "student"; id: string; title: string; subtitle: string; to: string; params: { studentId: string } }
  | { kind: "evidence"; id: string; title: string; subtitle: string; to: string }
  | { kind: "iep"; id: string; title: string; subtitle: string; to: string }
  | { kind: "report"; id: string; title: string; subtitle: string; to: string };

const groupMeta: Record<Result["kind"], { label: string; Icon: typeof Users }> = {
  student: { label: "Students", Icon: Users },
  iep: { label: "IEP goals", Icon: Target },
  evidence: { label: "Evidence", Icon: Camera },
  report: { label: "Reports & tasks", Icon: ClipboardList },
};

export function GlobalSearch() {
  const { activeSemester, matches } = useActiveSemester();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const studentResults: Result[] = students
      .filter((s) =>
        `${s.firstName} ${s.lastName} ${s.yearLevel} ${s.className}`.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((s) => ({
        kind: "student" as const,
        id: s.id,
        title: `${s.firstName} ${s.lastName}`,
        subtitle: `${s.yearLevel} · ${s.className}`,
        to: "/students/$studentId",
        params: { studentId: s.id },
      }));

    const iepResults: Result[] = iepGoals
      .filter((g) => matches(g.semester))
      .filter((g) =>
        `${g.studentName} ${g.learningArea} ${g.learningIntention} ${g.smart}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 5)
      .map((g) => ({
        kind: "iep" as const,
        id: g.id,
        title: `${g.learningArea} — ${g.studentName}`,
        subtitle: `${g.semester} · ${g.level} · ${g.status.replace("-", " ")}`,
        to: "/ieps",
      }));

    const evidenceResults: Result[] = evidenceItems
      .filter((e) => matches(e.semester))
      .filter((e) =>
        `${e.studentName} ${e.caption} ${e.vcStrand} ${e.medium}`.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((e) => ({
        kind: "evidence" as const,
        id: e.id,
        title: e.caption,
        subtitle: `${e.studentName} · ${e.medium} · ${e.semester}`,
        to: "/evidence",
      }));

    const reportResults: Result[] = actionQueue
      .filter((a) => matches(a.semester))
      .filter((a) => `${a.title} ${a.kind}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((a) => ({
        kind: "report" as const,
        id: a.id,
        title: a.title,
        subtitle: `${a.kind} · due ${a.due} · ${a.semester}`,
        to: a.kind === "report" ? "/reports" : "/",
      }));

    return [...studentResults, ...iepResults, ...evidenceResults, ...reportResults];
  }, [query, matches]);

  const grouped = useMemo(() => {
    const map = new Map<Result["kind"], Result[]>();
    for (const r of results) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return map;
  }, [results]);

  return (
    <div ref={wrapperRef} className="relative ml-2 hidden flex-1 max-w-xl md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={`Search ${activeSemester === "all" ? "all semesters" : activeSemester.replace("Semester ", "Sem ")}…`}
        className="w-full rounded-full border bg-secondary/60 py-2 pl-10 pr-9 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Scoped to {activeSemester === "all" ? "all semesters" : activeSemester}</span>
            <span>{results.length} match{results.length === 1 ? "" : "es"}</span>
          </div>
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches in this semester. Switch to All semesters to widen the search.
            </div>
          ) : (
            Array.from(grouped.entries()).map(([kind, items]) => {
              const { label, Icon } = groupMeta[kind];
              return (
                <div key={kind} className="mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <ul>
                    {items.map((r) => (
                      <li key={`${r.kind}-${r.id}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            if (r.kind === "student") {
                              navigate({ to: "/students/$studentId", params: r.params });
                            } else {
                              navigate({ to: r.to as "/" | "/ieps" | "/evidence" | "/reports" });
                            }
                          }}
                          className="flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left hover:bg-muted"
                        >
                          <span className="text-sm font-medium text-foreground line-clamp-1">{r.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{r.subtitle}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
