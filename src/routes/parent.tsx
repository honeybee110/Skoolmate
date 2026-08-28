import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/role-gate";
import { iepGoals, students, evidenceItems, iepReports, classInfo, availableSemesters, type IepGoal, type IepReportStatus } from "@/lib/mock-data";
import { useActiveSemester, semesterShortLabel } from "@/lib/semester-context";
import { Sparkles, Heart, BookOpen, Camera, FileDown, ChevronRight, FileText, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [
    { title: "Parent Portal · skoolmate" },
    { name: "description", content: "A simple, friendly view of your child's learning goals, progress and evidence." },
  ] }),
  component: () => (
    <RequireAuth>
      <ParentPortal />
    </RequireAuth>
  ),
});

const stageMeta: Record<string, { label: string; pct: number; tone: string }> = {
  developing: { label: "Developing", pct: 33, tone: "bg-orange-100 text-orange-700" },
  "working-towards": { label: "Working Towards", pct: 66, tone: "bg-amber-100 text-amber-800" },
  achieved: { label: "Achieved!", pct: 100, tone: "bg-emerald-100 text-emerald-700" },
  "not-started": { label: "Not yet", pct: 0, tone: "bg-muted text-muted-foreground" },
};
function progressOf(g: IepGoal) {
  const sum = g.successCriteria.reduce((a, c) => a + (stageMeta[c.status]?.pct ?? 0), 0);
  return Math.round(sum / g.successCriteria.length);
}

const reportStatusTone: Record<IepReportStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-review": "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  published: "bg-primary/15 text-primary",
};

function ParentPortal() {
  const { activeSemester, setActiveSemester, matches } = useActiveSemester();
  const parentStudents = useMemo(() => students.slice(0, 3), []);
  const [activeId, setActiveId] = useState(parentStudents[0].id);
  const child = parentStudents.find((s) => s.id === activeId)!;
  const childGoals = iepGoals.filter((g) => g.studentId === child.id && g.approval === "approved" && matches(g.semester));
  const draftGoals = iepGoals.filter((g) => g.studentId === child.id && g.approval !== "approved" && matches(g.semester));
  const childEvidence = evidenceItems.filter((e) => e.studentId === child.id && matches(e.semester)).slice(0, 6);
  const childReports = iepReports.filter((r) => r.studentId === child.id && matches(r.semester) && (r.status === "approved" || r.status === "published"));

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/30 via-background to-background">
      <header className="border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">skoolmate · Parent Portal</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{classInfo.term} · {classInfo.code}</p>
            </div>
          </div>
          <div className="hidden text-right text-xs sm:block">
            <p className="font-medium">Welcome, parent of {child.firstName}</p>
            <p className="text-muted-foreground">Teacher {classInfo.teacher} · Class {classInfo.code}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Child switcher */}
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your children</p>
          <div className="flex flex-wrap gap-2">
            {parentStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left transition hover:border-primary/40",
                  activeId === s.id && "border-primary shadow-sm ring-1 ring-primary/30",
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold", s.avatarColor)}>{s.initials}</div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{s.yearLevel}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Semester switcher */}
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reporting period</p>
            <div className="ml-1 flex flex-wrap items-center gap-1 rounded-full border bg-card p-1">
              {(["all", ...availableSemesters] as const).map((opt) => {
                const active = opt === activeSemester;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setActiveSemester(opt)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {semesterShortLabel(opt)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hero */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/40 to-background">
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Badge variant="outline" className="font-normal text-[10px]"><Heart className="h-2.5 w-2.5" />This week with {child.firstName}</Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{child.firstName} had a settled week and made progress on {childGoals.length} learning {childGoals.length === 1 ? "goal" : "goals"}.</h1>
              <p className="mt-2 text-sm text-muted-foreground">Below is a friendly summary of the goals their teacher set, how they're tracking, and the moments we captured.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Goals approved</p>
                <p className="text-2xl font-semibold">{childGoals.length}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidence pieces</p>
                <p className="text-2xl font-semibold">{childEvidence.length}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Semester reports */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Semester reports</h2>
          </div>
          {childReports.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No reports have been published for {child.firstName} in {activeSemester === "all" ? "any semester" : activeSemester} yet.
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {childReports.map((r) => (
                <Card key={r.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-normal text-[10px]">{r.semester}</Badge>
                      <Badge className={cn("font-normal text-[10px] capitalize", reportStatusTone[r.status])}>{r.status === "in-review" ? "In review" : r.status}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug">{r.semester.startsWith("Semester 1") ? "Mid-year" : "End-of-year"} IEP report</p>
                    <p className="text-[11px] text-muted-foreground">{r.goalsIncluded} goals · {r.evidenceCount} evidence pieces · updated {r.updatedAt}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs">
                    <FileDown className="h-3 w-3" /> PDF
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Goals */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Approved learning goals</h2>
          </div>
          {childGoals.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No approved goals for {child.firstName} in {activeSemester === "all" ? "any semester" : activeSemester} yet.
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {childGoals.map((g) => {
                const pct = progressOf(g);
                const meta = stageMeta[g.status];
                return (
                  <Card key={g.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="font-normal text-[10px]">{g.learningArea}</Badge>
                        <Badge variant="outline" className="font-normal text-[10px]">{g.semester}</Badge>
                      </div>
                      <Badge className={cn("font-normal text-[10px]", meta.tone)}>{meta.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-snug">{g.smart}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span><span className="tabular-nums">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">Next check-in: {g.reviewDue}</p>
                      <Button asChild size="sm" variant="ghost" className="h-7 text-[11px]">
                        <a href={`/ieps/${g.id}/print`} target="_blank" rel="noreferrer"><FileDown className="h-3 w-3" />Download IEP</a>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {draftGoals.length > 0 && (
            <p className="mt-3 text-xs italic text-muted-foreground">{draftGoals.length} more {draftGoals.length === 1 ? "goal is" : "goals are"} being finalised with the Learning Specialist and will appear here once approved.</p>
          )}
        </section>

        {/* Evidence */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Moments from the classroom</h2>
          </div>
          {childEvidence.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No classroom moments captured in {activeSemester === "all" ? "any semester" : activeSemester} yet.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {childEvidence.map((e) => (
                <Card key={e.id} className="overflow-hidden">
                  <div className="aspect-[4/3] w-full" style={{ background: `linear-gradient(135deg, oklch(0.85 0.08 ${e.thumbHue}) 0%, oklch(0.92 0.05 ${e.thumbHue + 30}) 100%)` }} />
                  <div className="space-y-1 p-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="font-normal text-[10px] capitalize">{e.medium}</Badge>
                      <Badge variant="outline" className="font-normal text-[10px]">{e.semester}</Badge>
                    </div>
                    <p className="text-xs leading-snug">{e.caption}</p>
                    <p className="text-[10px] text-muted-foreground">{e.capturedAt} · {e.capturedBy}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Want to talk about {child.firstName}'s plan?</p>
            <p className="text-xs text-muted-foreground">Message Teacher {classInfo.teacher} or request a meeting.</p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90">Message teacher <ChevronRight className="h-4 w-4" /></Button>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground hover:underline">← Back to teacher view</Link> · skoolmate
        </p>
      </main>
    </div>
  );
}
