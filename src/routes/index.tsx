import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentCard } from "@/components/student-card";
import {
  students,
  todayTimetable,
  actionQueue,
  notifications,
  aiSnapshot,
} from "@/lib/mock-data";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Pill,
  AlertTriangle,
  BookOpen,
  Target,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SchoolMate AU" },
      { name: "description", content: "Your teaching day at a glance: timetable, behaviour alerts, lessons due, IEP reminders, and your class." },
    ],
  }),
  component: Dashboard,
});

const kindIcon = {
  medication: Pill,
  behaviour: AlertTriangle,
  lesson: BookOpen,
  iep: Target,
  report: FileText,
} as const;

const blockColor: Record<string, string> = {
  literacy: "border-l-primary bg-primary-soft/40",
  numeracy: "border-l-[oklch(0.58_0.12_280)] bg-[oklch(0.96_0.03_280)]/40",
  specialist: "border-l-accent bg-accent-soft/40",
  therapy: "border-l-[oklch(0.65_0.13_155)] bg-[oklch(0.95_0.04_155)]/40",
  break: "border-l-muted-foreground/40 bg-muted/40",
};

function Dashboard() {
  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Monday, 29 June 2026 · Term 3</p>
          <h1 className="text-3xl font-semibold tracking-tight">Good morning, Honey</h1>
          <p className="mt-1 text-xs text-muted-foreground">P7 · ES Sharifa · <span className="text-accent font-medium">Medical alert — Kristian: Asthma Plan</span></p>
        </div>

        {/* AI Daily Snapshot */}
        <Card className="mt-6 overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/50 via-background to-background p-0">
          <div className="flex items-start gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">AI Daily Snapshot</span>
                <span className="text-[10px] text-muted-foreground">· Rosella · generated 7:42am</span>
              </div>
              <h2 className="mt-1 text-lg font-semibold leading-snug">{aiSnapshot.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{aiSnapshot.body}</p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0">Open <ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
            {aiSnapshot.highlights.map((h) => {
              const trend = "trend" in h ? (h as { trend?: string }).trend : undefined;
              return (
                <div key={h.label} className="bg-card px-5 py-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{h.label}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight">{h.value}</span>
                    {trend === "down" && <TrendingDown className="h-4 w-4 text-success" />}
                    {trend === "up" && <TrendingUp className="h-4 w-4 text-accent" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Timetable */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Today's Timetable</h2>
              <Button variant="ghost" size="sm" className="text-xs">Open calendar <ChevronRight className="h-3 w-3" /></Button>
            </div>
            <div className="mt-4 space-y-1.5">
              {todayTimetable.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border-l-4 px-3 py-2.5",
                    blockColor[b.type]
                  )}
                >
                  <div className="flex w-20 shrink-0 flex-col text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{b.start}</span>
                    <span>{b.end}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground">{b.room}</div>
                  </div>
                  {b.type === "therapy" && (
                    <span className="text-[10px] uppercase tracking-wider text-success">Therapy</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Action queue + notifications */}
          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Action Queue</h2>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {actionQueue.filter((a) => a.urgent).length} urgent
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {actionQueue.map((a) => {
                  const Icon = kindIcon[a.kind];
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          a.urgent ? "bg-accent/15 text-accent-foreground" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm leading-snug">{a.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {a.due}</span>
                          {(a.kind === "iep" || a.kind === "report") && (
                            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">{a.semester}</span>
                          )}
                        </div>

                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <ul className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-2.5">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.unread ? "bg-primary" : "bg-transparent")} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground">{n.body}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{n.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Class roster */}
        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">P7 — Term 3 2026</h2>
              <p className="text-xs text-muted-foreground">8 students · 7 present today</p>
            </div>
            <Button variant="outline" size="sm">Open class view</Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {students.map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
