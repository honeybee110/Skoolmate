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
} from "lucide-react";
import {
  iepGoals as seedGoals, students, evidenceItems as seedEvidence,
  type IepGoal, type IepStatus, type IepDomain, type IepApproval,
  type SuccessCriterion, type EvidenceItem,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEPs · SchoolMate AU" }] }),
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
  Communication: "bg-primary/10 text-primary",
  Literacy: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Numeracy: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Social-Emotional": "bg-accent/15 text-accent",
  "Self-care": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  Motor: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
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

function IepsPage() {
  const [goals, setGoals] = useState<IepGoal[]>(seeded);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(seedEvidence);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActiveStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(seeded[0].id);

  const filtered = useMemo(() => goals.filter((g) => {
    const q = query.toLowerCase();
    const matchesQ = !q || g.smart.toLowerCase().includes(q) || g.studentName.toLowerCase().includes(q) || g.learningArea.toLowerCase().includes(q) || g.vcLink.toLowerCase().includes(q);
    const matchesF = filter === "all" || g.status === filter;
    return matchesQ && matchesF;
  }), [query, filter, goals]);

  const selected = goals.find((g) => g.id === selectedId) ?? goals[0];

  const stats = useMemo(() => ({
    total: goals.length,
    achieved: goals.filter((g) => g.status === "achieved").length,
    developing: goals.filter((g) => g.status === "developing").length,
    pending: goals.filter((g) => g.approval === "pending").length,
  }), [goals]);

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

  return (
    <AppShell>
      <PageHeader
        title="IEP Goals"
        subtitle="Structured from Scope & Sequence · cross-checked against Developing → Working Towards → Achieved"
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
        <StatCard label="Active goals" value={stats.total} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Achieved this semester" value={stats.achieved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Developing" value={stats.developing} icon={<Target className="h-4 w-4 text-orange-600" />} />
        <StatCard label="Pending approval" value={stats.pending} icon={<Send className="h-4 w-4 text-amber-600" />} highlight />
      </div>

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_460px]">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by student, goal, learning area or VC code…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              {(["all", "developing", "working-towards", "achieved"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-2.5 py-1 transition", filter === f ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  {f === "all" ? "All" : statusMeta[f].label}
                </button>
              ))}
            </div>
          </div>

          {filtered.map((g) => (
            <GoalRow key={g.id} goal={g} selected={g.id === selected.id} onSelect={() => setSelectedId(g.id)} />
          ))}
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
              <Link to="/evidence" className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">View evidence ({goal.evidenceCount})</Link>
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
