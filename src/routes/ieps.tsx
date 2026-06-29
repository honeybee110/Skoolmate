import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Target, Plus, Sparkles, AlertTriangle, CheckCircle2, Search, Filter, ChevronRight, Calendar } from "lucide-react";
import { iepGoals, students, type IepGoal, type IepStatus, type IepDomain } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEPs · SchoolMate AU" }] }),
  component: IepsPage,
});

const statusMeta: Record<IepStatus, { label: string; tone: string; pct: number }> = {
  "not-started": { label: "Not started", tone: "bg-muted text-muted-foreground", pct: 0 },
  emerging: { label: "Emerging", tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", pct: 30 },
  "working-towards": { label: "Working towards", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", pct: 65 },
  achieved: { label: "Achieved", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", pct: 100 },
};

const domainTone: Record<IepDomain, string> = {
  Communication: "bg-primary/10 text-primary",
  Literacy: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Numeracy: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Social-Emotional": "bg-accent/15 text-accent",
  "Self-care": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  Motor: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
};

function IepsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<IepStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(iepGoals[0].id);

  const filtered = useMemo(() => iepGoals.filter((g) => {
    const matchesQ = !query || g.smart.toLowerCase().includes(query.toLowerCase()) || g.studentName.toLowerCase().includes(query.toLowerCase());
    const matchesF = filter === "all" || g.status === filter;
    return matchesQ && matchesF;
  }), [query, filter]);

  const selected = iepGoals.find((g) => g.id === selectedId) ?? iepGoals[0];

  const stats = useMemo(() => {
    const total = iepGoals.length;
    const achieved = iepGoals.filter((g) => g.status === "achieved").length;
    const working = iepGoals.filter((g) => g.status === "working-towards").length;
    const reviewSoon = iepGoals.filter((g) => g.reviewDue === "Wk 6" || g.reviewDue === "Wk 7").length;
    return { total, achieved, working, reviewSoon };
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="IEP Goals"
        subtitle="SMART goals · Victorian Curriculum-linked · evidence cross-checked"
        actions={
          <>
            <Button variant="outline" size="sm"><Calendar className="h-4 w-4" />Schedule review</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />New goal</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatCard label="Active goals" value={stats.total} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Achieved this term" value={stats.achieved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Working towards" value={stats.working} icon={<Target className="h-4 w-4 text-amber-600" />} />
        <StatCard label="Reviews due ≤ 2 wks" value={stats.reviewSoon} icon={<AlertTriangle className="h-4 w-4 text-accent" />} highlight />
      </div>

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_420px]">
        {/* Goals list */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search goals or students…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              {(["all", "emerging", "working-towards", "achieved"] as const).map((f) => (
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

        {/* Cross-check panel */}
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
            <Badge variant="outline" className="font-mono text-[10px]">{goal.vcLink}</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-foreground/85 line-clamp-2">{goal.smart}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <Progress value={meta.pct} className="h-1.5" />
            </div>
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
  // AI-style cross-check: matches goal domain → suggested actions
  const recommendation = useMemo(() => {
    if (goal.status === "achieved") return { tone: "emerald", title: "Ready to extend", body: `${goal.studentName.split(" ")[0]} has met this goal across ${goal.evidenceCount} pieces of evidence. Consider promoting to the next level and drafting a new SMART goal for ${goal.domain}.` };
    if (goal.evidenceCount >= 8) return { tone: "amber", title: "Promote status", body: `Evidence trend is strong (${goal.evidenceCount} pieces, last seen ${goal.lastEvidence}). The AI suggests moving from "${meta.label}" → "Achieved" at next review.` };
    if (goal.evidenceCount < 4) return { tone: "accent", title: "Evidence gap", body: `Only ${goal.evidenceCount} pieces of evidence linked. Plan 2 focused activities this week to capture progress before ${goal.reviewDue} review.` };
    return { tone: "primary", title: "On track", body: `Steady progression with ${goal.evidenceCount} evidence pieces. Continue current supports and re-check at ${goal.reviewDue}.` };
  }, [goal, meta.label]);

  return (
    <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary-soft/40 to-background px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Goal detail</span>
            <Badge className={cn("font-normal", meta.tone)}>{meta.label}</Badge>
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug">{goal.smart}</h3>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <Detail label="Student">{goal.studentName}</Detail>
          <Detail label="Domain"><Badge variant="outline" className={cn("font-normal", domainTone[goal.domain])}>{goal.domain}</Badge></Detail>
          <Detail label="Baseline">{goal.baseline}</Detail>
          <Detail label="VC 2.0 link"><Badge variant="outline" className="font-mono">{goal.vcLink}</Badge></Detail>
          <Detail label="Review due">{goal.reviewDue}</Detail>
          <div className="border-t pt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Progress</span>
              <span className="tabular-nums">{meta.pct}%</span>
            </div>
            <Progress value={meta.pct} className="h-2" />
          </div>
        </div>
      </Card>

      {/* AI cross-check */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary-soft/30 via-background to-background p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">AI cross-check</h4>
              <Badge variant="outline" className="text-[10px]">Evidence Hub linked</Badge>
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

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
