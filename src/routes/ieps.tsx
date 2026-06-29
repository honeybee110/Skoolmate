import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import {
  iepGoals, students,
  type IepGoal, type IepStatus, type IepDomain, type SuccessCriterion,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEPs · SchoolMate AU" }] }),
  component: IepsPage,
});

type ActiveStatus = Exclude<IepStatus, "not-started">;

const statusMeta: Record<IepStatus, { label: string; tone: string; pct: number; dot: string }> = {
  "not-started": { label: "Not started", tone: "bg-muted text-muted-foreground", pct: 0, dot: "bg-muted-foreground" },
  "working-towards": { label: "Working Towards", tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", pct: 33, dot: "bg-orange-500" },
  developing: { label: "Developing", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", pct: 66, dot: "bg-amber-500" },
  achieved: { label: "Achieved", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", pct: 100, dot: "bg-emerald-500" },
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

function IepsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActiveStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(iepGoals[0].id);

  const filtered = useMemo(() => iepGoals.filter((g) => {
    const q = query.toLowerCase();
    const matchesQ = !q || g.smart.toLowerCase().includes(q) || g.studentName.toLowerCase().includes(q) || g.learningArea.toLowerCase().includes(q) || g.vcLink.toLowerCase().includes(q);
    const matchesF = filter === "all" || g.status === filter;
    return matchesQ && matchesF;
  }), [query, filter]);

  const selected = iepGoals.find((g) => g.id === selectedId) ?? iepGoals[0];

  const stats = useMemo(() => {
    const total = iepGoals.length;
    const achieved = iepGoals.filter((g) => g.status === "achieved").length;
    const developing = iepGoals.filter((g) => g.status === "developing").length;
    const reviewSoon = iepGoals.filter((g) => g.reviewDue === "Wk 6" || g.reviewDue === "Wk 7").length;
    return { total, achieved, developing, reviewSoon };
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="IEP Goals"
        subtitle="Structured from Scope & Sequence · cross-checked against Working Towards → Developing → Achieved"
        actions={
          <>
            <Button variant="outline" size="sm"><Calendar className="h-4 w-4" />Schedule review</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />New goal from S&S</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatCard label="Active goals" value={stats.total} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Achieved this term" value={stats.achieved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Developing" value={stats.developing} icon={<Target className="h-4 w-4 text-amber-600" />} />
        <StatCard label="Reviews due ≤ 2 wks" value={stats.reviewSoon} icon={<AlertTriangle className="h-4 w-4 text-accent" />} highlight />
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
              {(["all", "working-towards", "developing", "achieved"] as const).map((f) => (
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

        <CrossCheckPanel goal={selected} />
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

function CrossCheckPanel({ goal }: { goal: IepGoal }) {
  const meta = statusMeta[goal.status];
  const pct = goalProgress(goal);

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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />Cross-Check
          </div>
          <span className="text-[10px] text-muted-foreground">Semester 1 2026 master</span>
        </div>
        <div className="divide-y">
          {goal.successCriteria.map((c, i) => (
            <CrossCheckRow key={i} index={i + 1} criterion={c} />
          ))}
        </div>
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
              <Button size="sm" variant="ghost" className="h-7 text-xs">View evidence ({goal.evidenceCount})</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CrossCheckRow({ index, criterion }: { index: number; criterion: SuccessCriterion }) {
  const stages: Array<{ key: ActiveStatus; label: string; text: string }> = [
    { key: "working-towards", label: "Working Towards", text: criterion.workingTowards },
    { key: "developing", label: "Developing", text: criterion.developing },
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
