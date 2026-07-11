import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { weeklyTimetable, sessionTimes, classInfo, type WeekDay } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { subjectFromTitle, subjectTones } from "@/lib/subject-colors";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar · skoolmate" }] }),
  component: CalendarPage,
});

const dayLabels: Record<WeekDay, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

const breaks = [
  { after: 2, label: "Morning Tea · Morning Play", time: "10:30 – 11:30" },
  { after: 4, label: "Lunch · Lunch Play", time: "1:00 – 2:00" },
];

function CalendarPage() {
  const days: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <AppShell>
      <PageHeader
        title={`Weekly Timetable — ${classInfo.code}`}
        subtitle={`${classInfo.term} · Teacher ${classInfo.teacher} · ES ${classInfo.educationSupport}`}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden p-0">
          {/* Header row */}
          <div className="grid grid-cols-[110px_repeat(5,minmax(0,1fr))] border-b bg-secondary/40">
            <div className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Session
            </div>
            {days.map((d) => (
              <div
                key={d}
                className="border-l px-3 py-3 text-sm font-semibold tracking-tight"
              >
                {dayLabels[d]}
              </div>
            ))}
          </div>

          {/* Sessions */}
          {sessionTimes.map((slot, i) => (
            <div key={slot.session}>
              <div className="grid grid-cols-[110px_repeat(5,minmax(0,1fr))] border-b">
                <div className="flex flex-col justify-center px-3 py-3">
                  <span className="text-xs font-semibold">Session {slot.session}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {slot.start} – {slot.end}
                  </span>
                </div>
                {days.map((d) => {
                  const cell = weeklyTimetable[d][i];
                  const tone = subjectFromTitle(cell.title, cell.type);
                  return (
                    <div key={d} className="border-l p-2">
                      <div
                        className={cn(
                          "h-full rounded-md border-l-4 px-3 py-2 text-sm leading-snug",
                          tone.cell,
                        )}
                      >
                        {cell.title}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Insert break rows after sessions 2 and 4 */}
              {breaks
                .filter((b) => b.after === slot.session)
                .map((b) => (
                  <div
                    key={b.label}
                    className="grid grid-cols-[110px_1fr] border-b bg-muted/30"
                  >
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {b.time}
                    </div>
                    <div className="border-l px-3 py-2 text-xs font-medium text-muted-foreground">
                      {b.label}
                    </div>
                  </div>
                ))}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-secondary/30 px-4 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Legend swatch="bg-primary" label="Literacy" />
              <Legend swatch="bg-[oklch(0.58_0.12_280)]" label="Maths" />
              <Legend swatch="bg-accent" label="Specialist" />
              <Legend swatch="bg-[oklch(0.65_0.13_155)]" label="Therapy" />
            </div>
            <div className="font-medium text-accent">
              Medical alert · Callum — Asthma Plan
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", swatch)} />
      {label}
    </span>
  );
}
