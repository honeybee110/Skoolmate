import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Target, Plus, Sparkles, AlertTriangle, CheckCircle2,
  Search, Filter, ChevronRight, Calendar, BookOpen, ListChecks,
  FileDown, ExternalLink, Send, ShieldCheck, Clock, Link2, X,
  Camera, MessageSquarePlus, Pencil, UserCog,
} from "lucide-react";
import {
  iepGoals as seedGoals, students, evidenceItems as seedEvidence,
  specialistEntries as seedSpecialists,
  availableSemesters, currentSemester,
  type IepGoal, type IepStatus, type IepDomain, type IepApproval,
  type SuccessCriterion, type EvidenceItem, type Semester,
  type SpecialistEntry, type SpecialistSubject,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEPs · SchoolMate AU" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    student: typeof s.student === "string" ? s.student : undefined,
    semester: typeof s.semester === "string" ? (s.semester as Semester | "all") : undefined,
    goal: typeof s.goal === "string" ? s.goal : undefined,
  }),
  component: IepsPage,
});


type ActiveStatus = Exclude<IepStatus, "not-started">;

const statusMeta: Record<IepStatus, { label: string; tone: string; pct: number; dot: string }> = {
  "not-started": { label: "Not started", tone: "bg-muted text-muted-foreground", pct: 0, dot: "bg-muted-foreground" },
  developing: { label: "Developing", tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", pct: 33, dot: "bg-orange-500" },
  "working-towards": { label: "Working Towards", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", pct: 66, dot: "bg-amber-500" },
  achieved: { label: "Achieved", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", pct: 100, dot: "bg-emerald-500" },
};

const approvalMeta: Record<IepApproval, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Draft", tone: "bg-muted text-muted-foreground", icon: Clock },
  pending: { label: "Pending approval", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", icon: Send },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", icon: ShieldCheck },
};

const domainTone: Record<IepDomain, string> = {
  English: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Maths: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Personal & Social": "bg-accent/15 text-accent",
  Science: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  HASS: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PE: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Visual Arts": "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  Music: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  Drama: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  "Learn to Play": "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "Self-care": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

function goalProgress(goal: IepGoal) {
  const sum = goal.successCriteria.reduce((acc, s) => acc + statusMeta[s.status].pct, 0);
  return Math.round(sum / goal.successCriteria.length);
}

const initialApproval = (id: string): IepApproval => {
  if (["g5", "g6"].includes(id)) return "approved";
  if (["g1", "g3"].includes(id)) return "pending";
  return "draft";
};
const seeded: IepGoal[] = seedGoals.map((g) => ({
  ...g,
  approval: g.approval ?? initialApproval(g.id),
  approvedBy: ["g5", "g6"].includes(g.id) ? "K. Patel (Learning Specialist)" : undefined,
  approvedAt: ["g5", "g6"].includes(g.id) ? "Wk 4 · 2026" : undefined,
}));

const SUBJECTS: IepDomain[] = [
  "English",
  "Maths",
  "Personal & Social",
  "Science",
  "HASS",
  "PE",
  "Visual Arts",
  "Music",
  "Drama",
  "Learn to Play",
  "Self-care",
];


function IepsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [goals, setGoals] = useState<IepGoal[]>(seeded);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(seedEvidence);
  const [specialists, setSpecialists] = useState<SpecialistEntry[]>(seedSpecialists);
  const [subject, setSubject] = useState<IepDomain | "all">("all");
  const [semesterFilter, setSemesterFilter] = useState<Semester | "all">(search.semester ?? currentSemester);
  const studentScope = search.student;

  const initialGoalId = search.goal && seeded.some((g) => g.id === search.goal)
    ? search.goal
    : (studentScope ? (seeded.find((g) => g.studentId === studentScope)?.id ?? seeded[0].id) : seeded[0].id);
  const [selectedId, setSelectedId] = useState<string>(initialGoalId);

  const scopedStudent = studentScope ? students.find((s) => s.id === studentScope) : undefined;

  const scopedGoals = useMemo(() => goals.filter((g) => {
    if (semesterFilter !== "all" && g.semester !== semesterFilter) return false;
    if (studentScope && g.studentId !== studentScope) return false;
    if (subject !== "all" && g.domain !== subject) return false;
    return true;
  }), [goals, semesterFilter, studentScope, subject]);

  const selected = goals.find((g) => g.id === selectedId) ?? scopedGoals[0] ?? goals[0];

  const stats = useMemo(() => {
    const xs = semesterFilter === "all" ? goals : goals.filter((g) => g.semester === semesterFilter);
    const scope = studentScope ? xs.filter((g) => g.studentId === studentScope) : xs;
    return {
      total: scope.length,
      achieved: scope.filter((g) => g.status === "achieved").length,
      developing: scope.filter((g) => g.status === "developing").length,
      pending: scope.filter((g) => g.approval === "pending").length,
    };
  }, [goals, semesterFilter, studentScope]);

  function setApproval(id: string, approval: IepApproval) {
    setGoals((prev) => prev.map((g) => g.id === id ? {
      ...g, approval,
      approvedBy: approval === "approved" ? "K. Patel (Learning Specialist)" : g.approvedBy,
      approvedAt: approval === "approved" ? "Today" : g.approvedAt,
    } : g));
    if (approval === "pending") toast.success("Submitted for Learning Specialist approval.");
    if (approval === "approved") toast.success("IEP goal approved.");
    if (approval === "draft") toast("Returned to draft for edits.");
  }

  function linkEvidence(evId: string, goalId: string) {
    setEvidence((prev) => prev.map((e) => e.id === evId
      ? { ...e, aiTagged: true, goalIds: [...e.goalIds, goalId], aiSuggestedGoal: undefined }
      : e));
    setGoals((prev) => prev.map((g) => g.id === goalId
      ? { ...g, evidenceCount: g.evidenceCount + 1, lastEvidence: "Just now" }
      : g));
    toast.success("Evidence linked to goal.");
  }
  function dismissSuggestion(evId: string) {
    setEvidence((prev) => prev.map((e) => e.id === evId ? { ...e, aiSuggestedGoal: undefined } : e));
  }

  function addSpecialistEntry(entry: Omit<SpecialistEntry, "id" | "addedAt" | "semester">) {
    setSpecialists((prev) => [
      { ...entry, id: `sp${prev.length + 1}-${Date.now()}`, addedAt: "Just now", semester: currentSemester },
      ...prev,
    ]);
    toast.success(`Specialist note from ${entry.specialistName} added.`);
  }

  // Build class roster: one row per student, with per-subject goal aggregates
  const roster = useMemo(() => students.map((s) => {
    const studentGoals = (semesterFilter === "all" ? goals : goals.filter((g) => g.semester === semesterFilter))
      .filter((g) => g.studentId === s.id);
    const bySubject = SUBJECTS.reduce<Record<IepDomain, IepGoal[]>>((acc, d) => {
      acc[d] = studentGoals.filter((g) => g.domain === d);
      return acc;
    }, {} as Record<IepDomain, IepGoal[]>);
    return { student: s, all: studentGoals, bySubject };
  }), [goals, semesterFilter]);

  const rosterFiltered = studentScope ? roster.filter((r) => r.student.id === studentScope) : roster;

  return (
    <AppShell>
      <PageHeader
        title="IEP Goals"
        subtitle="Class list · cross-subject goal tracker · specialist teacher notes"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/parent" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Parent portal</a>
            </Button>
            <Button variant="outline" size="sm"><Calendar className="h-4 w-4" />Schedule review</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />New goal from S&S</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatCard label={semesterFilter === "all" ? "Active goals (all sem.)" : `Active goals · ${semesterFilter.replace(" · 2026", "")}`} value={stats.total} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Achieved" value={stats.achieved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Developing" value={stats.developing} icon={<Target className="h-4 w-4 text-orange-600" />} />
        <StatCard label="Pending approval" value={stats.pending} icon={<Send className="h-4 w-4 text-amber-600" />} highlight />
      </div>

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_460px]">
        <div className="space-y-3">
          {scopedStudent && (
            <Card className="flex items-center justify-between gap-3 border-primary/30 bg-primary-soft/30 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-primary" />
                <span>Drilled in from report · showing goals for</span>
                <Badge variant="outline" className="font-medium">{scopedStudent.firstName} {scopedStudent.lastName}</Badge>
                {search.semester && <Badge variant="outline">{search.semester}</Badge>}
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate({ search: {} })}>
                <X className="h-3 w-3" /> Clear
              </Button>
            </Card>
          )}

          {/* Semester + subject tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <Calendar className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              <button onClick={() => setSemesterFilter("all")} className={cn("rounded-md px-2.5 py-1 transition", semesterFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>All sem.</button>
              {availableSemesters.map((s) => (
                <button key={s} onClick={() => setSemesterFilter(s)} className={cn("rounded-md px-2.5 py-1 transition whitespace-nowrap", semesterFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  {s.replace(" · 2026", "")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <BookOpen className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              <button onClick={() => setSubject("all")} className={cn("rounded-md px-2.5 py-1 transition", subject === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>All subjects</button>
              {SUBJECTS.map((d) => (
                <button key={d} onClick={() => setSubject(d)} className={cn("rounded-md px-2.5 py-1 transition whitespace-nowrap", subject === d ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Class roster table — subjects as columns */}
          <ClassRoster
            rows={rosterFiltered}
            subjectFilter={subject}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />

          {/* Specialist teachers — comments + photos */}
          <SpecialistsSection
            entries={specialists.filter((e) => semesterFilter === "all" || e.semester === semesterFilter)}
            goals={goals}
            onAdd={addSpecialistEntry}
            scopedStudentId={studentScope}
          />
        </div>

        <CrossCheckPanel
          goal={selected}
          evidence={evidence}
          onApprovalChange={(a) => setApproval(selected.id, a)}
          onLinkEvidence={(evId) => linkEvidence(evId, selected.id)}
          onDismiss={dismissSuggestion}
        />
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={cn("p-4", highlight && "border-accent/40 bg-accent/5")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function GoalRow({ goal, selected, onSelect }: { goal: IepGoal; selected: boolean; onSelect: () => void }) {
  const meta = statusMeta[goal.status];
  const appr = approvalMeta[goal.approval ?? "draft"];
  const ApprIcon = appr.icon;
  const student = students.find((s) => s.id === goal.studentId);
  const pct = goalProgress(goal);
  return (
    <Card onClick={onSelect} className={cn("cursor-pointer p-4 transition hover:border-primary/40 hover:shadow-sm", selected && "border-primary shadow-sm ring-1 ring-primary/30")}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-foreground/80", student?.avatarColor)}>
          {student?.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{goal.studentName}</span>
            <Badge variant="outline" className={cn("font-normal", domainTone[goal.domain])}>{goal.domain}</Badge>
            <Badge variant="outline" className="font-normal text-[10px]">Level {goal.level} · {goal.learningArea}</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">{goal.vcLink}</Badge>
            <Badge variant="outline" className="font-normal text-[10px]"><Calendar className="h-2.5 w-2.5" />{goal.semester.replace(" · 2026", "")}</Badge>
            <Badge className={cn("font-normal text-[10px]", appr.tone)}><ApprIcon className="h-2.5 w-2.5" />{appr.label}</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-foreground/85 line-clamp-2">{goal.smart}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1"><Progress value={pct} className="h-1.5" /></div>
            <Badge className={cn("font-normal", meta.tone)}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground tabular-nums">{goal.evidenceCount} ev.</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Card>
  );
}

function CrossCheckPanel({
  goal, evidence, onApprovalChange, onLinkEvidence, onDismiss,
}: {
  goal: IepGoal;
  evidence: EvidenceItem[];
  onApprovalChange: (a: IepApproval) => void;
  onLinkEvidence: (evId: string) => void;
  onDismiss: (evId: string) => void;
}) {
  const { activeSemester } = useActiveSemester();
  const meta = statusMeta[goal.status];
  const pct = goalProgress(goal);
  const appr = approvalMeta[goal.approval ?? "draft"];
  const ApprIcon = appr.icon;

  const suggestions = evidence.filter(
    (e) => e.studentId === goal.studentId && !e.goalIds.includes(goal.id) && (e.aiSuggestedGoal === goal.id || !e.aiTagged),
  ).slice(0, 3);

  const recommendation = useMemo(() => {
    const achievedSteps = goal.successCriteria.filter((s) => s.status === "achieved").length;
    const total = goal.successCriteria.length;
    if (achievedSteps === total) return { title: "Ready to extend", body: `All ${total} success criteria are Achieved. Promote ${goal.studentName.split(" ")[0]} to the next Scope & Sequence level (currently Level ${goal.level}) and draft a new SMART goal.` };
    if (achievedSteps >= Math.ceil(total / 2) && goal.evidenceCount >= 8) return { title: "Promote status", body: `${achievedSteps}/${total} criteria Achieved with ${goal.evidenceCount} pieces of evidence — cross-check supports moving overall status from "${meta.label}" → "Achieved" at the ${goal.reviewDue} review.` };
    if (goal.evidenceCount < 4) return { title: "Evidence gap", body: `Only ${goal.evidenceCount} pieces of evidence linked across ${total} criteria. Plan 2 focused activities this week to capture progress before ${goal.reviewDue}.` };
    return { title: "On track", body: `Steady progression across ${total} criteria with ${goal.evidenceCount} evidence pieces. Continue current supports and re-check at ${goal.reviewDue}.` };
  }, [goal, meta.label]);

  return (
    <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary-soft/40 to-background px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Scope & Sequence</span>
            <Badge className={cn("font-normal", meta.tone)}>{meta.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="font-normal text-[10px]">Level {goal.level}</Badge>
            <Badge variant="outline" className={cn("font-normal text-[10px]", domainTone[goal.domain])}>{goal.learningArea}</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">{goal.vcLink}</Badge>
          </div>
          <p className="mt-2 text-xs italic text-muted-foreground">Learning intention: {goal.learningIntention}</p>
          <h3 className="mt-2 text-base font-semibold leading-snug">{goal.smart}</h3>
        </div>

        <div className="space-y-3 p-5 text-sm">
          <Detail label="Student">{goal.studentName}</Detail>
          <Detail label="Baseline">{goal.baseline}</Detail>
          <Detail label="Semester">{goal.semester}</Detail>
          <Detail label="Review due">{goal.reviewDue}</Detail>

          <div className="border-t pt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Step-by-step progress</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a href={`/ieps/${goal.id}/print`} target="_blank" rel="noreferrer"><FileDown className="h-3.5 w-3.5" />Generate IEP PDF</a>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
              <a href={`/parent?goal=${goal.id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Open in parent portal</a>
            </Button>
          </div>
        </div>
      </Card>

      {/* Approval flow */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />Approval flow
          </div>
          <Badge className={cn("font-normal text-[10px]", appr.tone)}><ApprIcon className="h-2.5 w-2.5" />{appr.label}</Badge>
        </div>
        <div className="space-y-3 p-4 text-sm">
          <div className="flex items-center gap-2 text-xs">
            <Stage active={["draft", "pending", "approved"].includes(goal.approval ?? "draft")} label="Draft" />
            <span className="text-muted-foreground">→</span>
            <Stage active={["pending", "approved"].includes(goal.approval ?? "draft")} label="Pending" />
            <span className="text-muted-foreground">→</span>
            <Stage active={goal.approval === "approved"} label="Approved" />
          </div>
          {goal.approval === "approved" && goal.approvedBy && (
            <p className="text-xs text-muted-foreground">Approved by <span className="font-medium text-foreground">{goal.approvedBy}</span> · {goal.approvedAt}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {(goal.approval ?? "draft") === "draft" && (
              <Button size="sm" className="h-8 bg-primary text-xs hover:bg-primary/90" onClick={() => onApprovalChange("pending")}><Send className="h-3.5 w-3.5" />Submit for approval</Button>
            )}
            {goal.approval === "pending" && (
              <>
                <Button size="sm" className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-600/90" onClick={() => onApprovalChange("approved")}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onApprovalChange("draft")}>Return to draft</Button>
              </>
            )}
            {goal.approval === "approved" && (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onApprovalChange("draft")}>Reopen for edits</Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />Cross-Check
          </div>
          <span className="text-[10px] text-muted-foreground">{goal.semester} master</span>
        </div>
        <div className="divide-y">
          {goal.successCriteria.map((c, i) => (
            <CrossCheckRow key={i} index={i + 1} criterion={c} />
          ))}
        </div>
      </Card>

      {/* One-click evidence linking */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />Suggested evidence
          </div>
          <span className="text-[10px] text-muted-foreground">{suggestions.length} match{suggestions.length === 1 ? "" : "es"}</span>
        </div>
        {suggestions.length === 0 ? (
          <p className="p-4 text-xs italic text-muted-foreground">No unlinked evidence for {goal.studentName.split(" ")[0]} right now.</p>
        ) : (
          <div className="divide-y">
            {suggestions.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3">
                <div
                  className="h-10 w-10 shrink-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, oklch(0.85 0.08 ${e.thumbHue}) 0%, oklch(0.92 0.05 ${e.thumbHue + 30}) 100%)` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{e.medium} · {e.capturedAt}</p>
                  <p className="text-xs leading-snug text-foreground/85 line-clamp-2">{e.caption}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" className="h-7 bg-primary text-[11px] hover:bg-primary/90" onClick={() => onLinkEvidence(e.id)}><Link2 className="h-3 w-3" />Link</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => onDismiss(e.id)}><X className="h-3 w-3" />Skip</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary-soft/30 via-background to-background p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">AI cross-check</h4>
              <Badge variant="outline" className="text-[10px]">S&S + Evidence Hub</Badge>
            </div>
            <p className="mt-1 text-xs font-medium text-primary">{recommendation.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{recommendation.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Apply suggestion</Button>
              <Link
                to="/evidence"
                search={scopedSearch(activeSemester, { student: goal.studentId, semester: goal.semester, goal: goal.id })}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                View evidence ({goal.evidenceCount})
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stage({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
      {label}
    </span>
  );
}

function CrossCheckRow({ index, criterion }: { index: number; criterion: SuccessCriterion }) {
  const stages: Array<{ key: ActiveStatus; label: string; text: string }> = [
    { key: "developing", label: "Developing", text: criterion.developing },
    { key: "working-towards", label: "Working Towards", text: criterion.workingTowards },
    { key: "achieved", label: "Achieved", text: criterion.achieved },
  ];
  return (
    <div className="p-4">
      <p className="mb-2 text-sm font-medium leading-snug">
        <span className="mr-1.5 text-muted-foreground tabular-nums">{index}.</span>{criterion.step}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {stages.map((s) => {
          const active = s.key === criterion.status;
          const meta = statusMeta[s.key];
          return (
            <div
              key={s.key}
              className={cn(
                "rounded-md border p-2 text-[11px] leading-snug transition",
                active ? `${meta.tone} border-transparent font-medium shadow-sm` : "bg-muted/30 text-muted-foreground",
              )}
            >
              <div className="mb-1 flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? meta.dot : "bg-muted-foreground/40")} />
                <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
              </div>
              {s.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}

// ---------- Class Roster ----------

function ClassRoster({
  rows, subjectFilter, selectedId, onSelect,
}: {
  rows: { student: typeof students[number]; all: IepGoal[]; bySubject: Record<IepDomain, IepGoal[]> }[];
  subjectFilter: IepDomain | "all";
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const columns: IepDomain[] = subjectFilter === "all" ? SUBJECTS : [subjectFilter];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-secondary/30 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Target className="h-3.5 w-3.5" />Class IEP Goal Tracker · {classInfoCode()}
        </div>
        <span className="text-[10px] text-muted-foreground">{rows.length} students · {columns.length} subject{columns.length === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/30 px-3 py-2 font-medium">Student</th>
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, bySubject }) => (
              <tr key={student.id} className="border-b align-top last:border-b-0 hover:bg-secondary/20">
                <td className="sticky left-0 z-10 w-[180px] bg-card px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-foreground/80", student.avatarColor)}>
                      {student.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{student.yearLevel}</p>
                    </div>
                  </div>
                </td>
                {columns.map((c) => (
                  <td key={c} className="px-3 py-3 align-top">
                    <SubjectCell
                      goals={bySubject[c] ?? []}
                      selectedId={selectedId}
                      onSelect={onSelect}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function classInfoCode() {
  return "P7 · Honey";
}

function SubjectCell({ goals, selectedId, onSelect }: { goals: IepGoal[]; selectedId: string; onSelect: (id: string) => void }) {
  if (goals.length === 0) {
    return (
      <button className="rounded-md border border-dashed border-border/60 px-2 py-1 text-[11px] text-muted-foreground/70 hover:border-primary/40 hover:text-primary">
        <Plus className="mr-0.5 inline h-3 w-3" />Add
      </button>
    );
  }
  return (
    <div className="space-y-1.5">
      {goals.map((g) => {
        const pct = goalProgress(g);
        const meta = statusMeta[g.status];
        const isSel = g.id === selectedId;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className={cn(
              "group block w-full rounded-md border px-2 py-1.5 text-left transition",
              isSel ? "border-primary bg-primary-soft/40 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/40 hover:bg-secondary/40",
            )}
            title={g.smart}
          >
            <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground/90">{g.learningArea.replace(/^[^·]+·\s*/, "")}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full", meta.dot)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-1">
              <Badge variant="outline" className={cn("h-4 px-1 text-[9px] font-normal", meta.tone)}>{meta.label}</Badge>
              <span className="text-[9px] text-muted-foreground">L{g.level} · {g.evidenceCount}ev</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Specialists ----------

const SPECIALIST_ROLES: SpecialistSubject[] = [
  "PE",
  "Music",
  "Drama",
  "Visual Arts",
  "Learn to Play",
];

function SpecialistsSection({
  entries, goals, onAdd, scopedStudentId,
}: {
  entries: SpecialistEntry[];
  goals: IepGoal[];
  onAdd: (entry: Omit<SpecialistEntry, "id" | "addedAt" | "semester">) => void;
  scopedStudentId?: string;
}) {
  const visible = scopedStudentId ? entries.filter((e) => e.studentId === scopedStudentId) : entries;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    specialistName: "",
    specialistRole: "PE" as SpecialistSubject,
    studentId: scopedStudentId ?? students[0].id,
    goalId: "",
    comment: "",
    withPhoto: true,
  });

  function submit() {
    if (!form.specialistName.trim() || !form.comment.trim()) {
      toast.error("Add your name and a comment.");
      return;
    }
    onAdd({
      specialistName: form.specialistName.trim(),
      specialistRole: form.specialistRole,
      studentId: form.studentId,
      goalId: form.goalId || undefined,
      comment: form.comment.trim(),
      photoHue: form.withPhoto ? Math.floor(Math.random() * 360) : undefined,
    });
    setForm((f) => ({ ...f, specialistName: "", comment: "", goalId: "" }));
    setOpen(false);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-accent/10 to-background px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <UserCog className="h-3.5 w-3.5 text-accent" />Specialist teachers · IEP edits, comments & photos
        </div>
        <Button size="sm" variant={open ? "outline" : "default"} className={cn("h-7 text-xs", !open && "bg-accent text-accent-foreground hover:bg-accent/90")} onClick={() => setOpen((v) => !v)}>
          {open ? <><X className="h-3 w-3" />Close</> : <><MessageSquarePlus className="h-3 w-3" />Add specialist note</>}
        </Button>
      </div>

      {open && (
        <div className="grid gap-2 border-b bg-secondary/30 p-4 text-xs md:grid-cols-2">
          <label className="space-y-1">
            <span className="font-medium text-muted-foreground">Specialist name</span>
            <Input value={form.specialistName} onChange={(e) => setForm((f) => ({ ...f, specialistName: e.target.value }))} placeholder="e.g. Coach Tom" className="h-8" />
          </label>
          <label className="space-y-1">
            <span className="font-medium text-muted-foreground">Role</span>
            <select className="h-8 w-full rounded-md border bg-card px-2 text-xs" value={form.specialistRole} onChange={(e) => setForm((f) => ({ ...f, specialistRole: e.target.value as SpecialistSubject }))}>
              {SPECIALIST_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-medium text-muted-foreground">Student</span>
            <select className="h-8 w-full rounded-md border bg-card px-2 text-xs" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, goalId: "" }))}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-medium text-muted-foreground">Link to IEP goal ({form.specialistRole} only)</span>
            <select className="h-8 w-full rounded-md border bg-card px-2 text-xs" value={form.goalId} onChange={(e) => setForm((f) => ({ ...f, goalId: e.target.value }))}>
              <option value="">— None —</option>
              {goals
                .filter((g) => g.studentId === form.studentId && g.learningArea === form.specialistRole)
                .map((g) => (
                  <option key={g.id} value={g.id}>{g.learningArea} — {g.smart.slice(0, 60)}…</option>
                ))}
              {goals.filter((g) => g.studentId === form.studentId && g.learningArea === form.specialistRole).length === 0 && (
                <option value="" disabled>No {form.specialistRole} goals for this student yet</option>
              )}
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="font-medium text-muted-foreground">Comment</span>
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="e.g. Noah caught the ball 3/5 today — best result yet."
              className="min-h-[64px] w-full rounded-md border bg-card p-2 text-xs"
            />
          </label>
          <div className="flex items-center justify-between md:col-span-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.withPhoto} onChange={(e) => setForm((f) => ({ ...f, withPhoto: e.target.checked }))} />
              <Camera className="h-3.5 w-3.5" />Attach session photo
            </label>
            <Button size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>
              <Send className="h-3.5 w-3.5" />Post to IEP
            </Button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="p-4 text-xs italic text-muted-foreground">No specialist notes yet for this scope.</p>
      ) : (
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {visible.map((e) => {
            const student = students.find((s) => s.id === e.studentId);
            const linkedGoal = e.goalId ? goals.find((g) => g.id === e.goalId) : undefined;
            return (
              <div key={e.id} className="flex gap-3 rounded-lg border bg-card p-3">
                {e.photoHue !== undefined ? (
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-border"
                    style={{ background: `linear-gradient(135deg, oklch(0.82 0.09 ${e.photoHue}) 0%, oklch(0.92 0.05 ${(e.photoHue + 40) % 360}) 100%)` }}
                  >
                    <Camera className="absolute bottom-1 right-1 h-3 w-3 text-foreground/40" />
                  </div>
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-muted text-[10px] text-muted-foreground">No photo</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold">{e.specialistName}</span>
                    <Badge variant="outline" className="text-[10px]">{e.specialistRole}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {student ? `${student.firstName} ${student.lastName}` : "—"} · {e.addedAt}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-foreground/85">{e.comment}</p>
                  {linkedGoal && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                      <Link2 className="h-3 w-3 text-primary" />
                      <Badge variant="outline" className="font-normal text-[10px]">{linkedGoal.learningArea}</Badge>
                      <span className="truncate text-muted-foreground">{linkedGoal.smart}</span>
                    </div>
                  )}
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]"><Pencil className="h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]"><Plus className="h-3 w-3" />Add to goal</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

