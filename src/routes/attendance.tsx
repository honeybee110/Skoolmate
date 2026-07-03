import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle2, Save, RotateCcw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { students, classInfo } from "@/lib/mock-data";
import {
  useAttendanceStore, markAttendance, bulkMark, clearDay, attendanceKey, todayISO,
  ATTENDANCE_MARKS, type AttendanceMark,
} from "@/lib/attendance-store";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Daily Attendance · skoolmate" },
      { name: "description", content: "Mark the daily class roll — Present, Absent, Late, Medical, Excused — with per-student notes." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const [date, setDate] = useState<string>(todayISO());
  const { entries } = useAttendanceStore();

  const roll = useMemo(() => students.map((s) => ({
    student: s,
    entry: entries[attendanceKey(date, s.id)],
  })), [entries, date]);

  const stats = useMemo(() => {
    const acc: Record<AttendanceMark | "unmarked", number> = {
      present: 0, absent: 0, late: 0, medical: 0, excused: 0, unmarked: 0,
    };
    for (const r of roll) {
      if (!r.entry) acc.unmarked += 1;
      else acc[r.entry.mark] += 1;
    }
    return acc;
  }, [roll]);

  const total = students.length;
  const marked = total - stats.unmarked;

  return (
    <AppShell>
      <PageHeader
        title="Daily Attendance"
        subtitle={`${classInfo.code} · ${classInfo.teacher} · Roll marking with per-student status & notes`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => { bulkMark(date, students.map((s) => s.id), "present"); toast.success("All students marked present."); }}>
              <CheckCircle2 className="h-4 w-4" />Mark all present
            </Button>
            <Button size="sm" variant="outline" onClick={() => { clearDay(date, students.map((s) => s.id)); toast("Roll cleared for the day."); }}>
              <RotateCcw className="h-4 w-4" />Clear
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => toast.success(`Roll for ${date} saved.`)}>
              <Save className="h-4 w-4" />Save roll
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-6 md:px-8">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 h-9" />
          <p className="mt-1 text-[10px] text-muted-foreground">{marked} of {total} marked</p>
        </Card>
        <StatTile label="Present" value={stats.present} tone="text-emerald-700" />
        <StatTile label="Late" value={stats.late} tone="text-amber-700" />
        <StatTile label="Absent" value={stats.absent} tone="text-rose-700" />
        <StatTile label="Medical / Excused" value={stats.medical + stats.excused} tone="text-sky-700" />
      </div>

      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-gradient-to-r from-primary-soft/40 to-background px-4 py-2.5">
            <UserCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Class roll · {new Date(date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2>
            <Badge variant="outline" className="ml-auto text-[10px]">{total} students</Badge>
          </div>
          <div className="divide-y">
            {roll.map(({ student, entry }) => (
              <RollRow
                key={student.id}
                student={student}
                mark={entry?.mark}
                note={entry?.note}
                onMark={(m) => { markAttendance(date, student.id, m, entry?.note); }}
                onNote={(note) => { markAttendance(date, student.id, entry?.mark ?? "present", note); }}
              />
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", tone)}>{value}</p>
    </Card>
  );
}

function RollRow({
  student, mark, note, onMark, onNote,
}: {
  student: typeof students[number];
  mark?: AttendanceMark;
  note?: string;
  onMark: (m: AttendanceMark) => void;
  onNote: (n: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-secondary/20">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-foreground/80", student.avatarColor)}>
        {student.initials}
      </div>
      <div className="min-w-[140px]">
        <p className="text-sm font-semibold leading-tight">{student.firstName} {student.lastName}</p>
        <p className="text-[10px] text-muted-foreground">{student.yearLevel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {ATTENDANCE_MARKS.map((opt) => {
          const active = mark === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onMark(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
                active ? opt.tone : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              title={opt.label}
            >
              <span className="mr-1 font-bold">{opt.short}</span>{opt.label}
            </button>
          );
        })}
      </div>
      <Input
        value={note ?? ""}
        onChange={(e) => onNote(e.target.value)}
        placeholder="Note (e.g. GP appointment)"
        className="ml-auto h-8 max-w-[260px] text-xs"
      />
    </div>
  );
}
