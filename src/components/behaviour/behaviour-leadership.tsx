import { useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAlertSettings } from "@/lib/leadership-alerts.functions";
import { mergeConfig } from "@/lib/leadership-alert-rules";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  ArrowLeft,
  ArrowUpRight,
  ClipboardList,
  Clock,
  Gauge,
  Info,
  Layers,
  Minus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
  applyFilters,
  CAMPUSES,
  classHeatCells,
  classIntelligence,
  defaultCapacityWeights,
  defaultFilters,
  executiveKpis,
  formatMinutes,
  interventionQueue,
  leadershipAlerts,
  leadershipIncidents,
  schoolClasses,
  TERMS,
  weeklyVolume,
  yearLevels,
  type CapacityWeights,
  type ClassHeatCell,
  type LeadershipFilters,
} from "@/lib/behaviour-leadership";

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

const PRIORITY_TONE: Record<string, string> = {
  Urgent: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/20 text-warning-foreground border-warning/40",
  Standard: "bg-muted text-muted-foreground border-border",
};

const CONFIDENCE_TONE: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Moderate: "bg-warning/20 text-warning-foreground",
  High: "bg-success/15 text-success-foreground",
};

export function BehaviourLeadership() {
  const [filters, setFilters] = useState<LeadershipFilters>(defaultFilters);
  const [weights, setWeights] = useState<CapacityWeights>(defaultCapacityWeights);
  const [drillClassId, setDrillClassId] = useState<string | null>(null);

  const incidents = useMemo(() => applyFilters(leadershipIncidents, filters), [filters]);
  const kpis = useMemo(() => executiveKpis(incidents), [incidents]);
  const cells = useMemo(() => classHeatCells(incidents, weights), [incidents, weights]);
  const queue = useMemo(() => interventionQueue(incidents), [incidents]);
  const settingsFn = useServerFn(getAlertSettings);
  const settingsQ = useQuery({
    queryKey: ["alert-settings"],
    queryFn: () => settingsFn(),
    staleTime: 60_000,
  });
  const alertConfig = useMemo(() => mergeConfig(settingsQ.data ?? null), [settingsQ.data]);
  const alerts = useMemo(
    () => leadershipAlerts(incidents, weights, { ...alertConfig, active: true }),
    [incidents, weights, alertConfig],
  );
  const trend = useMemo(() => weeklyVolume(incidents), [incidents]);

  const set = (patch: Partial<LeadershipFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  if (drillClassId) {
    return (
      <ClassDrillDown
        classId={drillClassId}
        incidents={incidents}
        cell={cells.find((c) => c.classId === drillClassId)}
        onBack={() => setDrillClassId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <FilterBar filters={filters} set={set} onReset={() => setFilters(defaultFilters)} />

      <Tabs defaultValue="executive" className="space-y-5">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="heatmap">Class heat map</TabsTrigger>
          <TabsTrigger value="queue">
            Intervention queue
            {queue.filter((q) => q.priority === "Urgent").length > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                {queue.filter((q) => q.priority === "Urgent").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="capacity">Capacity index</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.filter((a) => a.severity === "critical").length > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                {alerts.filter((a) => a.severity === "critical").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ask">Ask SkoolMate</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-5">
          <ExecutivePanel kpis={kpis} trend={trend} cells={cells} onDrill={setDrillClassId} />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-5">
          <ClassHeatMap cells={cells} onDrill={setDrillClassId} />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <InterventionQueuePanel queue={queue} onDrill={setDrillClassId} />
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <CapacityPanel cells={cells} weights={weights} setWeights={setWeights} onDrill={setDrillClassId} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          <AlertsPanel alerts={alerts} onDrill={setDrillClassId} />
        </TabsContent>

        <TabsContent value="ask">
          <AskLeadershipPanel filters={filters} kpis={kpis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ Filters */

function FilterBar({
  filters,
  set,
  onReset,
}: {
  filters: LeadershipFilters;
  set: (patch: Partial<LeadershipFilters>) => void;
  onReset: () => void;
}) {
  const classOptions = schoolClasses.filter(
    (c) =>
      (filters.campus === "all" || c.campus === filters.campus) &&
      (filters.yearLevel === "all" || c.yearLevel === filters.yearLevel),
  );

  return (
    <Card className="flex flex-wrap items-end gap-3 p-4">
      <FilterSelect
        label="Campus"
        allLabel="All campuses"
        value={filters.campus}
        onChange={(v) => set({ campus: v, classId: "all" })}
        options={["all", ...CAMPUSES]}
      />
      <FilterSelect
        label="Year level"
        allLabel="All year levels"
        value={filters.yearLevel}
        onChange={(v) => set({ yearLevel: v, classId: "all" })}
        options={["all", ...yearLevels]}
      />
      <FilterSelect
        label="Class"
        value={filters.classId}
        onChange={(v) => set({ classId: v })}
        options={["all", ...classOptions.map((c) => c.id)]}
        labelFor={(v) => (v === "all" ? "All classes" : schoolClasses.find((c) => c.id === v)?.name ?? v)}
      />
      <FilterSelect
        label="Term"
        allLabel="All terms"
        value={filters.term}
        onChange={(v) => set({ term: v })}
        options={["all", ...TERMS]}
      />
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</Label>
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => set({ from: e.target.value })}
          className="h-9 w-[150px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => set({ to: e.target.value })}
          className="h-9 w-[150px]"
        />
      </div>
      <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
        Reset
      </Button>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labelFor,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labelFor?: (v: string) => string;
  allLabel?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {labelFor ? labelFor(o) : o === "all" ? (allLabel ?? "All") : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------------------------------------------------------- Executive */

function ExecutivePanel({
  kpis,
  trend,
  cells,
  onDrill,
}: {
  kpis: ReturnType<typeof executiveKpis>;
  trend: ReturnType<typeof weeklyVolume>;
  cells: ClassHeatCell[];
  onDrill: (id: string) => void;
}) {
  const TrendIcon =
    kpis.trendDirection === "up" ? ArrowUpRight : kpis.trendDirection === "down" ? ArrowDownRight : Minus;
  const top = [...cells].filter((c) => c.incidents > 0).sort((a, b) => b.capacityIndex - a.capacityIndex).slice(0, 6);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          icon={Activity}
          label="Total incidents"
          value={kpis.totalIncidents.toLocaleString()}
          sub={`${kpis.classesInScope} classes in scope`}
        />
        <Kpi
          icon={TrendIcon}
          label="Behaviour trend"
          value={`${kpis.trendPct > 0 ? "+" : ""}${kpis.trendPct}%`}
          sub="Latest week vs previous week"
          tone={kpis.trendDirection === "up" ? "danger" : kpis.trendDirection === "down" ? "success" : "muted"}
        />
        <Kpi
          icon={Users}
          label="Students requiring intervention"
          value={kpis.studentsRequiringIntervention.toString()}
          sub="4 or more incidents in period"
        />
        <Kpi
          icon={AlertTriangle}
          label="High-risk students"
          value={kpis.highRiskStudents.toString()}
          sub="Frequent + repeated high intensity"
          tone={kpis.highRiskStudents > 0 ? "danger" : "muted"}
        />
        <Kpi
          icon={ShieldCheck}
          label="Behaviour Support Plans"
          value={`${kpis.bspActive} active`}
          sub={`${kpis.bspNeedingAttention} draft, due or overdue`}
          tone={kpis.bspNeedingAttention > 0 ? "warning" : "success"}
        />
        <Kpi
          icon={Clock}
          label="Estimated teaching time lost"
          value={formatMinutes(kpis.teachingMinutesLost)}
          sub={`${kpis.deEscalationRate}% de-escalated within 10 min`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold">Incident volume and teaching time lost</h3>
          <p className="text-xs text-muted-foreground">By school week across the selected period.</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="var(--chart-1)"
                  fill="url(#volGrad)"
                  name="Incidents"
                />
                <Line type="monotone" dataKey="deEscalated" stroke="var(--chart-2)" dot={false} name="De-escalated" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold">Classes needing most support</h3>
          <p className="text-xs text-muted-foreground">Ranked by Behaviour Capacity Index.</p>
          <ul className="mt-3 space-y-2">
            {top.map((c) => (
              <li key={c.classId}>
                <button
                  onClick={() => onDrill(c.classId)}
                  className="w-full rounded-lg border p-2.5 text-left transition hover:border-primary/50 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.className}</span>
                    <Badge variant="outline" className={cn("text-[10px]", RISK_TONE[c.risk])}>
                      {c.capacityIndex}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {c.campus} · {c.yearLevel} · {c.incidents} incidents
                  </div>
                  <Progress value={c.capacityIndex} className="mt-2 h-1.5" />
                </button>
              </li>
            ))}
            {top.length === 0 && (
              <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No incidents match the current filters.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "muted" | "success" | "warning" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning-foreground"
        : tone === "success"
          ? "text-success-foreground"
          : "text-primary";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold tracking-tight", toneCls)}>{value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <Icon className={cn("h-4 w-4", toneCls)} />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- Class heatmap */

function ClassHeatMap({
  cells,
  onDrill,
}: {
  cells: ClassHeatCell[];
  onDrill: (id: string) => void;
}) {
  const max = Math.max(1, ...cells.map((c) => c.density));
  const grouped = CAMPUSES.map((campus) => ({
    campus,
    rows: cells.filter((c) => c.campus === campus),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Interactive class heat map</h3>
            <p className="text-xs text-muted-foreground">
              Colour reflects incident density (incidents per enrolled student). Click a class to open its
              Behaviour Intelligence page.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-muted via-warning to-destructive" />
            <span>High</span>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {grouped.map((g) => (
            <div key={g.campus}>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {g.campus}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.rows.map((c) => {
                  const ratio = c.density / max;
                  return (
                    <button
                      key={c.classId}
                      onClick={() => onDrill(c.classId)}
                      className="rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--destructive) ${Math.round(ratio * 42)}%, var(--card))`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{c.className}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {c.yearLevel} · {c.room}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", RISK_TONE[c.risk])}>
                          {c.risk}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-muted-foreground">Incidents</div>
                          <div className="font-semibold">{c.incidents}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Per student</div>
                          <div className="font-semibold">{c.density}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Index</div>
                          <div className="font-semibold">{c.capacityIndex}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Time lost</div>
                          <div className="font-semibold">{formatMinutes(c.minutesLost)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold">Incident density by class</h3>
        <div className="mt-3 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...cells].sort((a, b) => b.density - a.density)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="className" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="density" name="Incidents per student" radius={[4, 4, 0, 0]}>
                {cells.map((c, i) => (
                  <Cell key={c.classId} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------- Drill-down */

function ClassDrillDown({
  classId,
  incidents,
  cell,
  onBack,
}: {
  classId: string;
  incidents: ReturnType<typeof applyFilters>;
  cell?: ClassHeatCell;
  onBack: () => void;
}) {
  const intel = useMemo(() => classIntelligence(classId, incidents), [classId, incidents]);
  if (!intel) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{intel.cls.name} — Behaviour Intelligence</h2>
            <p className="text-xs text-muted-foreground">
              {intel.cls.campus} · {intel.cls.yearLevel} · Room {intel.cls.room} · Class team led by{" "}
              {intel.cls.teacher}
            </p>
          </div>
        </div>
        {cell && (
          <Badge variant="outline" className={cn("text-xs", RISK_TONE[cell.risk])}>
            Capacity Index {cell.capacityIndex} · {cell.risk}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Activity} label="Incidents" value={intel.incidents.length.toString()} sub={`${intel.studentsInvolved} students involved`} />
        <Kpi icon={Clock} label="Teaching time lost" value={formatMinutes(intel.minutesLost)} sub="Incident plus recovery time" />
        <Kpi icon={ShieldCheck} label="De-escalation rate" value={`${intel.deEscalationRate}%`} sub="Resolved within 10 minutes" tone={intel.deEscalationRate >= 65 ? "success" : "warning"} />
        <Kpi icon={Layers} label="Peak time" value={intel.peakTimes[0]?.name ?? "—"} sub={`${intel.peakTimes[0]?.count ?? 0} incidents in this block`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold">Incident trend</h3>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intel.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="incidents" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Incidents" />
                <Line type="monotone" dataKey="deEscalated" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="De-escalated" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold">Behaviour Support Plan status</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {intel.bsp.map((b) => (
              <li key={b.status} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b.status}</span>
                  <Badge variant="outline" className="text-[10px]">{b.students.length}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{b.students.join(", ")}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard title="Dominant behaviour types" data={intel.behaviours} />
        <BreakdownCard title="Common antecedents" data={intel.antecedents} />
        <BreakdownCard title="Common locations" data={intel.locations} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Peak behaviour times</h3>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...intel.peakTimes].sort((a, b) => a.name.localeCompare(b.name))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold">Intervention effectiveness</h3>
          <p className="text-xs text-muted-foreground">Share of incidents de-escalated within 10 minutes.</p>
          <ul className="mt-3 space-y-2">
            {intel.interventions.map((iv) => (
              <li key={iv.intervention} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{iv.intervention}</span>
                  <span className="text-muted-foreground">
                    {iv.successRate}% · used {iv.used}×
                  </span>
                </div>
                <Progress value={iv.successRate} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-[11px]">
        {data.slice(0, 4).map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="text-muted-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------- Intervention queue */

function InterventionQueuePanel({
  queue,
  onDrill,
}: {
  queue: ReturnType<typeof interventionQueue>;
  onDrill: (id: string) => void;
}) {
  const [action, setAction] = useState("all");
  const actions = ["all", ...new Set(queue.map((q) => q.action))];
  const rows = queue.filter((q) => action === "all" || q.action === action);

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold">Student intervention queue</h3>
          <p className="text-xs text-muted-foreground">
            Recommendations derived from incident records and the behaviour support plan register. Each entry lists
            its supporting evidence — leadership judgement decides the action.
          </p>
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="h-9 w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "all" ? "All recommendations" : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {rows.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No students meet the intervention thresholds for the current filters.
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((q) => (
          <Card key={q.studentId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{q.studentName}</div>
                <button
                  onClick={() => onDrill(q.classId)}
                  className="text-[11px] text-primary underline-offset-2 hover:underline"
                >
                  {q.className} · {q.campus}
                </button>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className={cn("text-[10px]", PRIORITY_TONE[q.priority])}>
                  {q.priority}
                </Badge>
                <Badge variant="secondary" className={cn("text-[10px]", CONFIDENCE_TONE[q.confidence])}>
                  {q.confidence} confidence
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
              <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-medium text-primary">{q.action}</span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{q.rationale}</p>

            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</div>
              <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                {q.evidence.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------- Capacity index */

function CapacityPanel({
  cells,
  weights,
  setWeights,
  onDrill,
}: {
  cells: ClassHeatCell[];
  weights: CapacityWeights;
  setWeights: (w: CapacityWeights) => void;
  onDrill: (id: string) => void;
}) {
  const ranked = [...cells].sort((a, b) => b.capacityIndex - a.capacityIndex);
  const indicators: { key: keyof CapacityWeights; label: string; hint: string }[] = [
    { key: "frequency", label: "Incident frequency", hint: "Incidents per enrolled student" },
    { key: "severity", label: "Severity", hint: "Share of high-intensity incidents" },
    { key: "trend", label: "Trend", hint: "Week-on-week direction" },
    { key: "interventionSuccess", label: "Intervention success", hint: "Inverse of de-escalation rate" },
  ];

  return (
    <>
      <Card className="border-primary/30 bg-primary/5 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            The Behaviour Capacity Index is a <strong>resourcing and planning signal for a class</strong> — it
            reflects student support needs, not teacher performance, and must never be used in staff review.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Indicator weights</h3>
          </div>
          <div className="mt-4 space-y-5">
            {indicators.map((ind) => (
              <div key={ind.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{ind.label}</span>
                  <span className="text-muted-foreground">{weights[ind.key]}</span>
                </div>
                <Slider
                  value={[weights[ind.key]]}
                  min={0}
                  max={60}
                  step={5}
                  onValueChange={([v]) => setWeights({ ...weights, [ind.key]: v })}
                  className="mt-2"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{ind.hint}</p>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setWeights(defaultCapacityWeights)}
          >
            Reset weights
          </Button>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold">Class Behaviour Capacity Index</h3>
          <div className="mt-3 space-y-2">
            {ranked.map((c) => (
              <button
                key={c.classId}
                onClick={() => onDrill(c.classId)}
                className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="w-24 shrink-0">
                  <div className="text-xs font-medium">{c.className}</div>
                  <div className="text-[10px] text-muted-foreground">{c.yearLevel}</div>
                </div>
                <Progress value={c.capacityIndex} className="h-2 flex-1" />
                <div className="w-10 text-right text-xs font-semibold">{c.capacityIndex}</div>
                <Badge variant="outline" className={cn("w-20 justify-center text-[10px]", RISK_TONE[c.risk])}>
                  {c.risk}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- Alerts */

function AlertsPanel({
  alerts,
  onDrill,
}: {
  alerts: ReturnType<typeof leadershipAlerts>;
  onDrill: (id: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No leadership alerts for the current filters.
      </Card>
    );
  }
  const tone = {
    critical: "border-destructive/40 bg-destructive/5",
    warning: "border-warning/40 bg-warning/5",
    info: "border-primary/30 bg-primary/5",
  } as const;
  const iconTone = {
    critical: "text-destructive",
    warning: "text-warning-foreground",
    info: "text-primary",
  } as const;

  return (
    <>
      {alerts.map((a) => (
        <Card key={a.id} className={cn("p-4", tone[a.severity])}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", iconTone[a.severity])} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{a.title}</h3>
                <Badge variant="outline" className="text-[10px]">{a.scope}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Evidence: {a.evidence}
              </p>
            </div>
            {a.classId && (
              <Button variant="outline" size="sm" onClick={() => onDrill(a.classId!)}>
                Open class
              </Button>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}

/* --------------------------------------------------------- Ask leadership mode */

const LEADERSHIP_PROMPTS = [
  "Which classes need additional support this term and why?",
  "Summarise whole-school behaviour trends for the leadership meeting",
  "Which students should be prioritised for a Functional Behaviour Assessment?",
  "How much teaching time have we lost to behaviour incidents this term?",
  "Which interventions are working best across the school?",
];

function AskLeadershipPanel({
  filters,
  kpis,
}: {
  filters: LeadershipFilters;
  kpis: ReturnType<typeof executiveKpis>;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const send = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const scope = [
      filters.campus !== "all" ? `campus ${filters.campus}` : null,
      filters.yearLevel !== "all" ? `year level ${filters.yearLevel}` : null,
      filters.classId !== "all"
        ? `class ${schoolClasses.find((c) => c.id === filters.classId)?.name}`
        : null,
      filters.term !== "all" ? filters.term : null,
      filters.from || filters.to ? `${filters.from || "start"} to ${filters.to || "today"}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    try {
      sessionStorage.setItem(
        "ask-mate:pending",
        `${q}\n\n(Context: Admin Behaviour Intelligence Centre — leadership mode. Current view: ${
          scope || "whole school, all terms"
        }; ${kpis.totalIncidents} incident records, ${kpis.studentsRequiringIntervention} students flagged for intervention. Use Evidence Mode: cite the specific incident records, behaviour support plans and allied health documentation behind every claim, and say clearly if the information is not in our documents.)`,
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
          <h3 className="text-sm font-semibold">Ask SkoolMate — Leadership Mode</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask natural-language questions about behaviour across the school. Answers cite the incident records and
          behaviour documentation they draw on, and carry your current filters as context.
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
            placeholder="e.g. Which Year 7 classes have rising incident rates?"
            className="h-10"
          />
          <Button type="submit" className="h-10 gap-1">
            <Send className="h-4 w-4" /> Ask
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEADERSHIP_PROMPTS.map((p) => (
            <Button key={p} variant="outline" size="sm" className="h-7 text-xs" onClick={() => send(p)}>
              {p}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">Evidence sources</h3>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>• ABC incident records across all classes</li>
          <li>• Behaviour support plan register</li>
          <li>• Allied health reports and observation logs</li>
          <li>• SSG minutes and IEP evidence</li>
        </ul>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Ask SkoolMate never diagnoses students, never invents records, and always asks leadership to review
          before anything is finalised.
        </p>
      </Card>
    </div>
  );
}
