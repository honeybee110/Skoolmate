import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CalendarClock,
  FlaskConical,
  Layers,
  Minus,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  abcBreakdown,
  behaviourIncidents,
  behaviourStudents,
  DAYS,
  escalationForecasts,
  executiveSummary,
  functionHypotheses,
  heatMap,
  interventionRankings,
  sequenceChains,
  triggerInsights,
} from "@/lib/behaviour-intelligence";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const RISK_TONE: Record<string, string> = {
  Low: "bg-success/15 text-success-foreground border-success/30",
  Moderate: "bg-warning/20 text-warning-foreground border-warning/40",
  Elevated: "bg-primary/15 text-primary border-primary/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
};

const CONFIDENCE_TONE: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Moderate: "bg-warning/20 text-warning-foreground",
  High: "bg-success/20 text-success-foreground",
};

export function BehaviourCentre({ scope = "teacher" }: { scope?: "teacher" | "admin" }) {
  const [studentFilter, setStudentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const incidents = useMemo(
    () =>
      behaviourIncidents.filter(
        (i) =>
          (studentFilter === "all" || i.studentId === studentFilter) &&
          (locationFilter === "all" || i.location === locationFilter),
      ),
    [studentFilter, locationFilter],
  );

  const summary = useMemo(() => executiveSummary(incidents), [incidents]);
  const abc = useMemo(() => abcBreakdown(incidents), [incidents]);
  const chains = useMemo(() => sequenceChains(incidents).slice(0, 6), [incidents]);
  const triggers = useMemo(() => triggerInsights(incidents), [incidents]);
  const forecasts = useMemo(() => escalationForecasts(incidents), [incidents]);
  const rankings = useMemo(() => interventionRankings(incidents), [incidents]);
  const hypotheses = useMemo(() => functionHypotheses(incidents), [incidents]);

  const TrendIcon =
    summary.trend.direction === "up"
      ? ArrowUpRight
      : summary.trend.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      {/* Filter bar */}
      <Card className="flex flex-wrap items-center gap-3 border-primary/20 bg-gradient-to-r from-primary-soft/60 via-background to-accent-soft/50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4 text-primary" />
          Behaviour Intelligence Centre
        </div>
        <Badge variant="outline" className="font-normal">
          {incidents.length} incident records
        </Badge>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {behaviourStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {["Classroom", "Playground", "Corridor", "Sensory room", "Hall", "Bus bay"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {incidents.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No incident records match these filters.
        </Card>
      ) : (
        <>
          {/* 1 — AI Executive Summary */}
          <Card className="overflow-hidden border-accent/25">
            <div className="flex flex-wrap items-center gap-2 border-b bg-gradient-to-r from-accent/10 via-primary/5 to-transparent px-5 py-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">AI Executive Summary</h2>
              <Badge className={cn("border font-normal", RISK_TONE[summary.riskLevel])}>
                Risk: {summary.riskLevel}
              </Badge>
              <span className="ml-auto text-[11px] text-muted-foreground">
                Derived from {summary.totalIncidents} ABC records · {summary.studentsInvolved} students · teacher review required
              </span>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCell
                icon={TrendingUp}
                label="Behaviour trend"
                value={summary.trend.label}
                detail={`${summary.trend.changePct > 0 ? "+" : ""}${summary.trend.changePct}% vs previous week`}
                accent={summary.trend.direction === "up" ? "warn" : "good"}
                Chevron={TrendIcon}
              />
              <SummaryCell
                icon={Activity}
                label="Dominant behaviour"
                value={summary.dominantBehaviour}
                detail={`${abc.behaviours[0]?.count ?? 0} recorded occurrences`}
              />
              <SummaryCell
                icon={Zap}
                label="Most common trigger"
                value={summary.commonTrigger}
                detail={`${triggers[0]?.share ?? 0}% of all antecedents`}
              />
              <SummaryCell
                icon={CalendarClock}
                label="Highest-risk day & time"
                value={summary.peakWindow}
                detail="Cluster identified in heat map"
                accent="warn"
              />
              <SummaryCell
                icon={ShieldCheck}
                label="Most effective intervention"
                value={summary.bestIntervention}
                detail={`${summary.bestInterventionRate}% de-escalation within 10 min`}
                accent="good"
              />
              <SummaryCell
                icon={Target}
                label="Overall de-escalation"
                value={`${summary.deEscalationRate}%`}
                detail="Responses that settled within 10 minutes"
              />
            </div>
          </Card>

          <Tabs defaultValue="abc">
            <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
              <TabsTrigger value="abc" className="text-xs">ABC Analysis</TabsTrigger>
              <TabsTrigger value="sequence" className="text-xs">Sequences</TabsTrigger>
              <TabsTrigger value="triggers" className="text-xs">Triggers</TabsTrigger>
              <TabsTrigger value="prediction" className="text-xs">Prediction</TabsTrigger>
              <TabsTrigger value="interventions" className="text-xs">Interventions</TabsTrigger>
              <TabsTrigger value="fba" className="text-xs">FBA Assistant</TabsTrigger>
              <TabsTrigger value="heatmaps" className="text-xs">Heat Maps</TabsTrigger>
              <TabsTrigger value="ask" className="text-xs">Ask SkoolMate</TabsTrigger>
            </TabsList>

            {/* 2 — ABC Analysis */}
            <TabsContent value="abc" className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard title="Antecedents" subtitle="What happened immediately before">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={abc.antecedents} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                      <Tooltip content={<SoftTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="var(--chart-1)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Behaviours" subtitle="Observable, recorded behaviour">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={abc.behaviours} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                      <Tooltip content={<SoftTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="var(--chart-2)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Consequence / response" subtitle="Staff response recorded">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={abc.consequences}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {abc.consequences.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<SoftTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard title="Incident volume by week" subtitle="Incidents vs responses that de-escalated within 10 minutes">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={useMemo(() => weeklySeries(incidents), [incidents])}>
                    <defs>
                      <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="gDe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip content={<SoftTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="incidents" stroke="var(--chart-1)" fill="url(#gInc)" strokeWidth={2} />
                    <Area type="monotone" dataKey="deEscalated" stroke="var(--chart-2)" fill="url(#gDe)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            {/* 3 — Sequence analysis */}
            <TabsContent value="sequence" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Recurring A → B → C chains detected across the filtered records. Chains are counted, not inferred.
              </p>
              {chains.map((c, idx) => (
                <Card key={c.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 p-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                      {idx + 1}
                    </span>
                    <ChainNode label="Antecedent" value={c.antecedent} tone="bg-chart1" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <ChainNode label="Behaviour" value={c.behaviour} tone="bg-chart2" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <ChainNode label="Response" value={c.consequence} tone="bg-chart3" />
                    <div className="ml-auto flex items-center gap-3 text-xs">
                      <span className="tabular-nums text-muted-foreground">{c.count}× recorded</span>
                      <Badge className={cn("font-normal", c.deEscalationRate >= 60 ? "bg-success/20 text-success-foreground" : "bg-warning/20 text-warning-foreground")}>
                        {c.deEscalationRate}% settled
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-muted">
                    <div
                      className="h-1 bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${Math.min(100, (c.count / (chains[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* 4 — Trigger analysis */}
            <TabsContent value="triggers" className="mt-4 grid gap-3 md:grid-cols-2">
              {triggers.map((t) => (
                <Card key={t.trigger} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{t.trigger}</span>
                      </div>
                      <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                        {t.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold tabular-nums">{t.share}%</div>
                      <div className="text-[10px] text-muted-foreground">{t.count} incidents</div>
                    </div>
                  </div>
                  <Progress value={t.share} className="mt-3" />
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <Stat label="Peak time" value={t.peakTime} />
                    <Stat label="Peak place" value={t.peakLocation} />
                    <Stat label="High intensity" value={`${t.escalationRate}%`} />
                  </dl>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Evidence: {t.incidentIds.join(", ")}
                  </p>
                </Card>
              ))}
            </TabsContent>

            {/* 5 — Prediction */}
            <TabsContent value="prediction" className="mt-4 space-y-3">
              <Card className="flex items-start gap-2 border-warning/40 bg-warning/10 p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                <p>
                  These are pattern-based estimates, not predictions of fact. They must be read alongside the
                  student's behaviour support plan and reviewed by the teacher and allied health team before
                  any change of practice.
                </p>
              </Card>
              {forecasts.map((f) => (
                <Card key={f.studentId} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{f.studentName}</span>
                    <Badge className={cn("border font-normal", RISK_TONE[f.band === "Elevated" ? "Elevated" : f.band])}>
                      {f.band} likelihood of escalation
                    </Badge>
                    <Badge className={cn("font-normal", CONFIDENCE_TONE[f.confidence])}>
                      Confidence: {f.confidence}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">Likely window: {f.window}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={f.likelihood} className="h-2 flex-1" />
                    <span className="w-12 text-right text-sm font-semibold tabular-nums">{f.likelihood}%</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    {f.drivers.map((d) => (
                      <li key={d}>• {d}</li>
                    ))}
                    <li>• Supporting records: {f.incidentIds.join(", ")}</li>
                  </ul>
                </Card>
              ))}
            </TabsContent>

            {/* 6 — Intervention effectiveness */}
            <TabsContent value="interventions" className="mt-4 space-y-4">
              <ChartCard title="Intervention success rate" subtitle="Share of incidents that de-escalated within 10 minutes">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={rankings} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis type="category" dataKey="intervention" width={170} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <Tooltip content={<SoftTooltip />} />
                    <Bar dataKey="successRate" radius={[0, 6, 6, 0]}>
                      {rankings.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <div className="grid gap-3 md:grid-cols-2">
                {rankings.map((r, i) => (
                  <Card key={r.intervention} className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold">{r.intervention}</span>
                      <Badge className="ml-auto bg-success/20 font-normal text-success-foreground">
                        {r.successRate}%
                      </Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <Stat label="Times used" value={String(r.used)} />
                      <Stat label="Avg duration" value={`${r.avgDuration} min`} />
                      <Stat label="Best for" value={r.bestFor} />
                    </dl>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 7 — FBA assistant */}
            <TabsContent value="fba" className="mt-4 space-y-3">
              <Card className="flex items-start gap-2 border-accent/30 bg-accent-soft/40 p-3 text-xs">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  Hypothesised functions only. These suggestions summarise recorded A–B–C patterns and are not a
                  diagnosis or a completed Functional Behaviour Assessment. Confirm with the allied health team.
                </p>
              </Card>
              {hypotheses.map((h) => (
                <Card key={h.fn} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Layers className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold">{h.fn}</span>
                    <Badge className={cn("font-normal", CONFIDENCE_TONE[h.confidence])}>
                      Confidence: {h.confidence}
                    </Badge>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {h.score}% of records match
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    Recorded patterns <span className="font-medium">may be consistent with</span> a{" "}
                    <span className="font-medium">{h.fn.toLowerCase()}</span> function.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Pattern: {h.pattern}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Supporting incidents: {h.incidentIds.join(", ") || "none in this filter"}
                  </p>
                </Card>
              ))}
            </TabsContent>

            {/* 8 — Heat maps */}
            <TabsContent value="heatmaps" className="mt-4 grid gap-4 lg:grid-cols-2">
              <HeatGrid title="Day × time of day" data={heatMap(incidents, "time")} />
              <HeatGrid title="Day × location" data={heatMap(incidents, "location")} />
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold">Classroom comparison</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {classroomTotals(incidents).map((c) => (
                    <div key={c.name} className="rounded-lg border p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.name}</div>
                      <div className="mt-1 flex items-end justify-between">
                        <span className="text-2xl font-semibold tabular-nums">{c.count}</span>
                        <span className="text-[11px] text-muted-foreground">{c.students} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* 9 — Ask SkoolMate */}
            <TabsContent value="ask" className="mt-4">
              <AskBehaviourPanel scope={scope} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function weeklySeries(incidents: typeof behaviourIncidents) {
  const map = new Map<string, { week: string; incidents: number; deEscalated: number }>();
  for (const i of incidents) {
    const week = i.date.split(" ·")[0];
    const row = map.get(week) ?? { week, incidents: 0, deEscalated: 0 };
    row.incidents++;
    if (i.deEscalated) row.deEscalated++;
    map.set(week, row);
  }
  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week, undefined, { numeric: true }));
}

function classroomTotals(incidents: typeof behaviourIncidents) {
  const map = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  for (const i of incidents) {
    counts.set(i.className, (counts.get(i.className) ?? 0) + 1);
    map.set(i.className, (map.get(i.className) ?? new Set()).add(i.studentId));
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, students: map.get(name)?.size ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

function SummaryCell({
  icon: Icon,
  label,
  value,
  detail,
  accent,
  Chevron,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  accent?: "good" | "warn";
  Chevron?: React.ElementType;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "mt-1 flex items-center gap-1 text-lg font-semibold leading-tight",
          accent === "good" && "text-success-foreground",
          accent === "warn" && "text-primary",
        )}
      >
        {value}
        {Chevron && <Chevron className="h-4 w-4" />}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="mb-2 text-[11px] text-muted-foreground">{subtitle}</p>}
      {children}
    </Card>
  );
}

function SoftTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="font-medium">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="text-muted-foreground">
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChainNode({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-lg border px-3 py-1.5", tone)}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function HeatGrid({
  title,
  data,
}: {
  title: string;
  data: { row: string; cells: { day: string; count: number }[] }[];
}) {
  const max = Math.max(1, ...data.flatMap((r) => r.cells.map((c) => c.count)));
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center text-[11px]">
          <thead>
            <tr>
              <th />
              {DAYS.map((d) => (
                <th key={d} className="font-medium text-muted-foreground">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.row}>
                <th className="pr-2 text-right font-normal text-muted-foreground">{r.row}</th>
                {r.cells.map((c) => (
                  <td key={c.day}>
                    <div
                      className="flex h-9 items-center justify-center rounded-md text-[11px] font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--chart-1) ${Math.round((c.count / max) * 85) + 6}%, var(--muted))`,
                        color:
                          c.count / max > 0.55 ? "var(--primary-foreground)" : "var(--foreground)",
                      }}
                      title={`${r.row} · ${c.day}: ${c.count}`}
                    >
                      {c.count || ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Darker cells indicate more recorded incidents.</p>
    </Card>
  );
}

const SUGGESTED = [
  "What patterns explain Noah's post-recess incidents?",
  "Which intervention works best for transition triggers?",
  "Summarise this term's behaviour data for the SSG meeting",
  "What supports does the behaviour support plan recommend for Jack?",
];

function AskBehaviourPanel({ scope }: { scope: "teacher" | "admin" }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const send = (question: string) => {
    const q = question.trim();
    if (!q) return;
    try {
      sessionStorage.setItem(
        "ask-mate:pending",
        `${q}\n\n(Context: Behaviour Intelligence Centre — ${scope} view. Cite the incident records, behaviour support plans or allied health documents used.)`,
      );
    } catch {
      /* storage unavailable — the thread still opens */
    }
    void navigate({ to: "/ask" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Ask SkoolMate about behaviour</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every answer cites the incident records, behaviour support plans or allied health documents it drew on.
          If the information isn't in your school documents, it will say so rather than guess.
        </p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(value);
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Which triggers appear most often before elopement?"
            className="h-10"
          />
          <Button type="submit" className="h-10 gap-1">
            <Send className="h-4 w-4" /> Ask
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => send(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Evidence sources available</h3>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>• ABC incident records (this centre)</li>
          <li>• Behaviour support plans</li>
          <li>• OT / speech / allied health reports</li>
          <li>• Observation logs</li>
          <li>• IEP goals and evidence</li>
        </ul>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Ask SkoolMate never diagnoses, never invents student information, and always asks you to review before
          anything is finalised.
        </p>
      </Card>
    </div>
  );
}
