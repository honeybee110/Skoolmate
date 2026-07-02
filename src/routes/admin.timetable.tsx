import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weeklyTimetable, sessionTimes, type WeekDay } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/timetable")({
  head: () => ({ meta: [{ title: "Whole-School Timetable · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <WholeSchoolTimetable />
    </RoleGate>
  ),
});

const classes = [
  { code: "P5", teacher: "Marc", room: "P5" },
  { code: "P6", teacher: "Priya", room: "P6" },
  { code: "P7", teacher: "Honey", room: "P7" },
  { code: "P8", teacher: "Ava", room: "P8" },
];

const days: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const typeTone: Record<string, string> = {
  literacy: "bg-teal-50 text-teal-800 border-teal-200",
  numeracy: "bg-indigo-50 text-indigo-800 border-indigo-200",
  specialist: "bg-amber-50 text-amber-800 border-amber-200",
  therapy: "bg-purple-50 text-purple-800 border-purple-200",
  break: "bg-slate-50 text-slate-700 border-slate-200",
};

function WholeSchoolTimetable() {
  return (
    <AppShell variant="admin">
      <PageHeader
        title="Whole-School Timetable"
        subtitle="Every class, every session — read-only overview for leadership."
        actions={<Badge variant="outline">Semester 2 · 2026</Badge>}
      />
      <div className="px-4 py-6 md:px-8 space-y-6">
        {classes.map((c) => (
          <Card key={c.code} className="overflow-hidden">
            <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3">
              <div>
                <h3 className="font-semibold">Class {c.code}</h3>
                <p className="text-xs text-muted-foreground">
                  Teacher: {c.teacher} · Room {c.room}
                </p>
              </div>
              <Badge variant="outline">5 sessions/day</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left">Session</th>
                    {days.map((d) => (
                      <th key={d} className="px-3 py-2 text-left">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessionTimes.map((s) => (
                    <tr key={s.session} className="border-b last:border-0">
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs font-semibold">S{s.session}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {s.start}–{s.end}
                        </div>
                      </td>
                      {days.map((d) => {
                        const slot = weeklyTimetable[d].find((x) => x.session === s.session);
                        if (!slot) return <td key={d} className="px-3 py-2 text-muted-foreground">—</td>;
                        return (
                          <td key={d} className="px-3 py-2 align-top">
                            <div
                              className={`rounded-md border px-2 py-1.5 text-xs font-medium ${typeTone[slot.type]}`}
                            >
                              {slot.title}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
