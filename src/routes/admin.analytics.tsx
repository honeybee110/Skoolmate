import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, AlertTriangle, BookOpen, Activity, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <Analytics />
    </RoleGate>
  ),
});

const iepByDomain = [
  { domain: "English", pct: 68, tone: "bg-blue-500" },
  { domain: "Maths", pct: 61, tone: "bg-violet-500" },
  { domain: "Personal & Social", pct: 74, tone: "bg-accent" },
  { domain: "Science", pct: 52, tone: "bg-emerald-500" },
  { domain: "History", pct: 46, tone: "bg-amber-500" },
  { domain: "PE", pct: 71, tone: "bg-orange-500" },
  { domain: "Visual Arts", pct: 66, tone: "bg-pink-500" },
  { domain: "Music", pct: 58, tone: "bg-rose-500" },
  { domain: "Learn to Play", pct: 63, tone: "bg-cyan-500" },
];

const classes = [
  { code: "P5", teacher: "Marc", students: 8, iep: 78, attend: 94, beh: 2 },
  { code: "P6", teacher: "Priya", students: 9, iep: 65, attend: 91, beh: 5 },
  { code: "P7", teacher: "Honey", students: 8, iep: 72, attend: 92, beh: 3 },
  { code: "P8", teacher: "Ava", students: 8, iep: 59, attend: 88, beh: 7 },
];

// heat: 0 = none, 1 = low, 2 = med, 3 = high
const heatmap: number[][] = [
  [0, 0, 1, 2, 1, 0, 0], // Mon
  [0, 1, 2, 3, 2, 1, 0],
  [0, 0, 1, 2, 1, 1, 0],
  [1, 1, 2, 3, 2, 1, 0],
  [0, 1, 1, 2, 1, 0, 0],
];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const hourLabels = ["9", "10", "11", "12", "1", "2", "3"];

const heatTone = ["bg-muted/30", "bg-orange-200/70", "bg-orange-400/80", "bg-accent/80"];

const lessonSubmission = { onTime: 84, late: 11, missing: 5 };

function Analytics() {
  return (
    <AppShell variant="admin">
      <PageHeader
        title="Analytics"
        subtitle="Whole-school signals · Semester 2 · 2026"
        actions={<Badge variant="outline">Rosella Campus</Badge>}
      />

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* Top KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Target className="h-4 w-4" />} label="IEP goals on track" value="68%" trend="up" delta="+4 vs last term" />
          <Kpi icon={<Activity className="h-4 w-4" />} label="Behaviour incidents" value="17" trend="down" delta="−31% vs last term" tone="text-success" />
          <Kpi icon={<Users className="h-4 w-4" />} label="Attendance" value="91%" trend="up" delta="+1.2 vs last term" />
          <Kpi icon={<BookOpen className="h-4 w-4" />} label="Lesson plans on time" value={`${lessonSubmission.onTime}%`} trend="up" delta={`${lessonSubmission.late}% late · ${lessonSubmission.missing}% missing`} />
        </div>

        {/* AI narrative */}
        <Card className="flex items-start gap-4 border-primary/25 bg-gradient-to-br from-primary-soft/40 via-background to-background p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-primary">AI insight</div>
            <p className="mt-1 text-sm leading-relaxed">
              Behaviour incidents cluster on <b>Tue &amp; Thu at 11:00–12:00</b>, matching post-recess transitions in P6 &amp; P8.
              Consider a proactive sensory break at 10:55. History goals lag other domains (46%) — schedule a PLC to
              review Semester 1 scope alignment.
            </p>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* IEP by domain */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">IEP goal completion by domain</h3>
              <Badge variant="outline">This semester</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {iepByDomain.map((d) => (
                <div key={d.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{d.domain}</span>
                    <span className="tabular-nums text-muted-foreground">{d.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", d.tone)} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Behaviour heatmap */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Behaviour incident heatmap</h3>
              <Badge variant="outline">Last 4 wks</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="inline-block">
                <div className="grid" style={{ gridTemplateColumns: `48px repeat(${hourLabels.length}, 44px)` }}>
                  <div />
                  {hourLabels.map((h) => (
                    <div key={h} className="text-center text-[10px] text-muted-foreground pb-1">{h}</div>
                  ))}
                  {heatmap.map((row, i) => (
                    <Fragment key={`row-${i}`}>
                      <div className="pr-2 text-right text-[11px] text-muted-foreground flex items-center justify-end">{dayLabels[i]}</div>
                      {row.map((v, j) => (
                        <div key={`${i}-${j}`} className={cn("h-8 m-0.5 rounded", heatTone[v])} title={`${dayLabels[i]} ${hourLabels[j]}: ${v}`} />
                      ))}
                    </Fragment>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Fewer</span>
                  {heatTone.map((t, i) => <div key={i} className={cn("h-3 w-6 rounded", t)} />)}
                  <span>More</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Per-class table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3">
            <h3 className="text-sm font-semibold">Class performance</h3>
            <Badge variant="outline">4 classes</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left">Class</th>
                  <th className="px-4 py-2 text-left">Teacher</th>
                  <th className="px-4 py-2 text-right">Students</th>
                  <th className="px-4 py-2 text-left">IEP on track</th>
                  <th className="px-4 py-2 text-left">Attendance</th>
                  <th className="px-4 py-2 text-right">Incidents</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.code} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">{c.code}</td>
                    <td className="px-4 py-3">{c.teacher}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={c.iep} className="h-1.5 w-24" />
                        <span className="text-xs tabular-nums text-muted-foreground">{c.iep}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={c.attend} className="h-1.5 w-24" />
                        <span className="text-xs tabular-nums text-muted-foreground">{c.attend}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", c.beh >= 5 ? "bg-accent/15 text-accent-foreground" : "bg-muted text-muted-foreground")}>
                        {c.beh >= 5 && <AlertTriangle className="h-3 w-3" />}
                        {c.beh}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* At-risk */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">At-risk flags</h3>
            <Button size="sm" variant="ghost">Review with wellbeing</Button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <Flag name="Noah Williams" reason="Behaviour cluster · 6 incidents last 2 wks" tone="bg-accent/10 border-accent/30" />
            <Flag name="Charlotte Reid" reason="Attendance 74% · 3 unexplained absences" tone="bg-amber-50 border-amber-200" />
            <Flag name="Jack O'Brien" reason="IEP English goal stalled 4 wks" tone="bg-orange-50 border-orange-200" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ icon, label, value, trend, delta, tone }: { icon: React.ReactNode; label: string; value: string; trend: "up" | "down"; delta: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {trend === "up" ? <TrendingUp className={cn("h-4 w-4", tone ?? "text-primary")} /> : <TrendingDown className={cn("h-4 w-4", tone ?? "text-success")} />}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{delta}</p>
    </Card>
  );
}

function Flag({ name, reason, tone }: { name: string; reason: string; tone: string }) {
  return (
    <div className={cn("rounded-lg border p-3", tone)}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold">{name}</span>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">{reason}</p>
    </div>
  );
}
