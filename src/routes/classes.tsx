import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BehaviourPill, AttendanceDot } from "@/components/status-chips";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";
import {
  students,
  todayTimetable,
  classInfo,
  actionQueue,
  iepGoals,
  evidenceItems,
  behaviourReports,
  iepReports,
} from "@/lib/mock-data";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Pill,
  Camera,
  Target,
  ChevronRight,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "Class Dashboard · skoolmate" },
      { name: "description", content: "P7 class dashboard — attendance, behaviour, IEP progress, evidence and lesson timeline at a glance." },
    ],
  }),
  component: ClassDashboard,
});

const blockColor: Record<string, string> = {
  literacy: "border-l-primary bg-primary-soft/40",
  numeracy: "border-l-[oklch(0.58_0.12_280)] bg-[oklch(0.96_0.03_280)]/40",
  specialist: "border-l-accent bg-accent-soft/40",
  therapy: "border-l-[oklch(0.65_0.13_155)] bg-[oklch(0.95_0.04_155)]/40",
  break: "border-l-muted-foreground/40 bg-muted/40",
};

function ClassDashboard() {
  const { activeSemester } = useActiveSemester();

  const inScope = <T extends { semester: string }>(rows: T[]) =>
    activeSemester === "all" ? rows : rows.filter((r) => r.semester === activeSemester);

  const goals = useMemo(() => inScope(iepGoals), [activeSemester]);
  const evidence = useMemo(() => inScope(evidenceItems), [activeSemester]);
  const behaviour = useMemo(() => inScope(behaviourReports), [activeSemester]);
  const reports = useMemo(() => inScope(iepReports), [activeSemester]);
  const actions = useMemo(() => inScope(actionQueue), [activeSemester]);

  const present = students.filter((s) => s.attendance === "present").length;
  const late = students.filter((s) => s.attendance === "late").length;
  const absent = students.filter((s) => s.attendance === "absent").length;
  const partial = students.filter((s) => s.attendance === "partial").length;
  const attendancePct = Math.round(((present + late * 0.75 + partial * 0.5) / students.length) * 100);

  const totalGoals = goals.length;
  const achieved = goals.filter((g) => g.status === "achieved").length;
  const workingTowards = goals.filter((g) => g.status === "working-towards").length;
  const developing = goals.filter((g) => g.status === "developing").length;
  const evidenceToday = evidence.filter((e) => e.capturedAt.startsWith("Today")).length;
  const openBehaviour = behaviour.filter((b) => b.status !== "resolved").length;
  const reportsDraft = reports.filter((r) => r.status === "draft" || r.status === "in-review").length;

  // Per-student rollup
  const rollup = students.map((s) => {
    const sGoals = goals.filter((g) => g.studentId === s.id);
    const sAchieved = sGoals.filter((g) => g.status === "achieved").length;
    const sEvidence = evidence.filter((e) => e.studentId === s.id).length;
    const sBehaviour = behaviour
      .filter((b) => b.studentId === s.id)
      .reduce((sum, b) => sum + b.incidents, 0);
    const progress = sGoals.length ? Math.round((sAchieved / sGoals.length) * 100) : 0;
    return { student: s, sGoals: sGoals.length, sAchieved, sEvidence, sBehaviour, progress };
  });

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {classInfo.term} · {classInfo.semester}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Class {classInfo.code} — Teacher {classInfo.teacher}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              ES {classInfo.educationSupport} · Room {classInfo.room} · {students.length} students
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/students" search={scopedSearch(activeSemester)}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="h-4 w-4" /> Student list
              </Button>
            </Link>
            <Link to="/ieps" search={scopedSearch(activeSemester)}>
              <Button size="sm" className="gap-1.5">
                <Target className="h-4 w-4" /> Open IEPs
              </Button>
            </Link>
          </div>
        </div>

        {/* Medical alerts strip */}
        {classInfo.medicalAlerts.length > 0 && (
          <Card className="mt-4 border-accent/40 bg-accent-soft/40 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-accent-foreground">
                <Pill className="h-3.5 w-3.5" /> Medical alerts
              </span>
              {classInfo.medicalAlerts.map((a) => (
                <span
                  key={a.student}
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 font-medium"
                >
                  <AlertTriangle className="h-3 w-3 text-accent" />
                  {a.student} — {a.plan}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Attendance" value={`${attendancePct}%`} sub={`${present}/${students.length} present`} icon={CheckCircle2} tone="success" />
          <StatCard label="IEP goals" value={totalGoals} sub={`${achieved} achieved`} icon={Target} tone="primary" />
          <StatCard label="Working towards" value={workingTowards} sub={`${developing} developing`} icon={TrendingUp} tone="muted" />
          <StatCard label="Evidence today" value={evidenceToday} sub={`${evidence.length} this semester`} icon={Camera} tone="primary" />
          <StatCard label="Behaviour" value={openBehaviour} sub={`${behaviour.length} reports`} icon={AlertTriangle} tone={openBehaviour > 0 ? "accent" : "muted"} />
          <StatCard label="Reports" value={reportsDraft} sub={`${reports.length} total`} icon={FileText} tone="muted" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's timetable */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Today — Monday</h2>
                <p className="text-[11px] text-muted-foreground">Lesson timeline for {classInfo.code}</p>
              </div>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="text-xs">
                  Weekly view <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-1.5">
              {todayTimetable.map((b, i) => (
                <div key={i} className={cn("flex items-center gap-4 rounded-lg border-l-4 px-3 py-2.5", blockColor[b.type])}>
                  <div className="flex w-20 shrink-0 flex-col text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{b.start}</span>
                    <span>{b.end}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground">{b.room}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.type}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI class summary + actions */}
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/50 via-background to-background p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">AI Class Summary</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Class {classInfo.code} is tracking <strong className="text-foreground">{Math.round((achieved / Math.max(totalGoals, 1)) * 100)}%</strong> of IEP goals at <em>achieved</em>, with {workingTowards} more close behind. {openBehaviour > 0 ? `${openBehaviour} behaviour report${openBehaviour > 1 ? "s" : ""} need attention` : "No open behaviour reports"} this semester.
              </p>
              <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-xs">
                Generate weekly write-up <ChevronRight className="h-3 w-3" />
              </Button>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Class action queue</h2>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {actions.filter((a) => a.urgent).length} urgent
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {actions.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-xs">
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", a.urgent ? "bg-accent" : "bg-muted-foreground/40")} />
                    <div className="min-w-0 flex-1">
                      <div className="leading-snug text-foreground">{a.title}</div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {a.due}
                      </div>
                    </div>
                  </li>
                ))}
                {actions.length === 0 && (
                  <li className="rounded-md border border-dashed py-3 text-center text-xs text-muted-foreground">
                    No outstanding actions.
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>

        {/* Per-student rollup */}
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold">Student rollup</h2>
              <p className="text-[11px] text-muted-foreground">Attendance, behaviour, IEP progress and evidence captured this semester</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Student</th>
                  <th className="px-3 py-2.5 text-left font-medium">Attend.</th>
                  <th className="px-3 py-2.5 text-left font-medium">Behaviour</th>
                  <th className="px-3 py-2.5 text-left font-medium">IEP progress</th>
                  <th className="px-3 py-2.5 text-right font-medium">Evidence</th>
                  <th className="px-3 py-2.5 text-right font-medium">Incidents</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rollup.map((r) => (
                  <tr key={r.student.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: r.student.id }}
                        className="flex items-center gap-2.5"
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-foreground/70", r.student.avatarColor)}>
                          {r.student.initials}
                        </div>
                        <div>
                          <div className="font-medium leading-tight">{r.student.firstName} {r.student.lastName}</div>
                          <div className="text-[11px] text-muted-foreground">{r.student.funding}{r.student.aacUser ? " · AAC" : ""}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3"><AttendanceDot status={r.student.attendance} /></td>
                    <td className="px-3 py-3"><BehaviourPill status={r.student.behaviour} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${r.progress}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{r.sAchieved}/{r.sGoals}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to="/evidence"
                        search={scopedSearch(activeSemester, { student: r.student.id })}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {r.sEvidence}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to="/behaviour"
                        search={scopedSearch(activeSemester, { student: r.student.id })}
                        className={cn("text-xs font-medium hover:underline", r.sBehaviour > 0 ? "text-accent-foreground" : "text-muted-foreground")}
                      >
                        {r.sBehaviour}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/ieps"
                        search={scopedSearch(activeSemester, { student: r.student.id })}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Goals <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Attendance & recent evidence */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Attendance today</h2>
            <div className="mt-4 space-y-2">
              <AttRow label="Present" count={present} total={students.length} tone="bg-success" />
              <AttRow label="Late" count={late} total={students.length} tone="bg-[oklch(0.78_0.13_85)]" />
              <AttRow label="Partial" count={partial} total={students.length} tone="bg-accent" />
              <AttRow label="Absent" count={absent} total={students.length} tone="bg-destructive" />
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent evidence</h2>
              <Link to="/evidence" search={scopedSearch(activeSemester)}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Evidence Hub <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <ul className="mt-3 divide-y">
              {evidence.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className="h-9 w-9 shrink-0 rounded-md"
                    style={{ background: `oklch(0.85 0.08 ${e.thumbHue})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{e.caption}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.studentName} · {e.medium} · {e.capturedAt}
                    </div>
                  </div>
                  <Link
                    to="/evidence"
                    search={scopedSearch(activeSemester, { student: e.studentId, goal: e.goalIds[0] })}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
              {evidence.length === 0 && (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  No evidence captured this semester yet.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof Users;
  tone: "primary" | "accent" | "success" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent-foreground",
    success: "bg-[oklch(0.94_0.05_155)] text-success",
    muted: "bg-secondary text-muted-foreground",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </Card>
  );
}

function AttRow({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
