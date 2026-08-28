import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCheck, CheckCircle2, Save, RotateCcw, Calendar, Sun, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { students, classInfo } from "@/lib/mock-data";
import {
  useAttendanceStore, markAttendance, bulkMark, clearDay, attendanceKey, todayISO, isSessionOverdue,
  ATTENDANCE_MARKS, SESSION_META, type AttendanceMark, type RollSession,
} from "@/lib/attendance-store";
import { PortalGuard } from "@/components/portal-guard";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Daily Attendance · skoolmate" },
      { name: "description", content: "Mark the class roll twice a day — Morning (before 9:30 AM) and Afternoon (12:30 PM)." },
    ],
  }),
  component: () => (
    <PortalGuard portal="teacher">
      <AttendancePage />
    </PortalGuard>
  ),
});

function AttendancePage() {
  const [date, setDate] = useState<string>(todayISO());
  const [session, setSession] = useState<RollSession>(() => {
    const h = new Date().getHours();
    return h >= 12 ? "PM" : "AM";
  });

  return (
    <AppShell>
      <PageHeader
        title="Daily Attendance"
        subtitle={`${classInfo.code} · ${classInfo.teacher} · Roll marked twice daily — Morning (before 9:30 AM) and Afternoon (12:30 PM)`}
      />

      <div className="grid grid-cols-1 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 h-9" />
        </Card>
        <SessionStatusTile date={date} session="AM" />
        <SessionStatusTile date={date} session="PM" />
        <Card className="flex flex-col justify-between p-4">
          <span className="text-xs font-medium text-muted-foreground">Class</span>
          <div>
            <p className="text-lg font-semibold">{classInfo.code}</p>
            <p className="text-[11px] text-muted-foreground">{students.length} students on roll</p>
          </div>
        </Card>
      </div>

      <div className="px-4 py-6 md:px-8">
        <Tabs value={session} onValueChange={(v) => setSession(v as RollSession)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="AM" className="gap-2"><Sun className="h-3.5 w-3.5" />Morning · before 9:30 AM</TabsTrigger>
            <TabsTrigger value="PM" className="gap-2"><Clock className="h-3.5 w-3.5" />Afternoon · 12:30 PM</TabsTrigger>
          </TabsList>
          {(["AM", "PM"] as RollSession[]).map((s) => (
            <TabsContent key={s} value={s} className="mt-4">
              <SessionRoll date={date} session={s} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

function SessionStatusTile({ date, session }: { date: string; session: RollSession }) {
  const { entries } = useAttendanceStore();
  const marked = students.filter((s) => entries[attendanceKey(date, session, s.id)]).length;
  const total = students.length;
  const complete = marked === total;
  const overdue = !complete && isSessionOverdue(session, date);
  const meta = SESSION_META[session];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
        {session === "AM" ? <Sun className="h-4 w-4 text-amber-500" /> : <Clock className="h-4 w-4 text-sky-500" />}
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums">{marked}<span className="text-sm text-muted-foreground">/{total}</span></p>
      <p className="text-[10px] text-muted-foreground">{meta.window}</p>
      {complete ? (
        <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">
          <CheckCircle2 className="mr-1 h-3 w-3" />Complete
        </Badge>
      ) : overdue ? (
        <Badge className="mt-1 bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]">
          <AlertTriangle className="mr-1 h-3 w-3" />Overdue
        </Badge>
      ) : (
        <Badge variant="outline" className="mt-1 text-[10px]">Pending</Badge>
      )}
    </Card>
  );
}

function SessionRoll({ date, session }: { date: string; session: RollSession }) {
  const { entries } = useAttendanceStore();
  const roll = useMemo(() => students.map((s) => ({
    student: s,
    entry: entries[attendanceKey(date, session, s.id)],
  })), [entries, date, session]);

  const stats = useMemo(() => {
    const acc: Record<AttendanceMark | "unmarked", number> = { present: 0, absent: 0, late: 0, medical: 0, excused: 0, unmarked: 0 };
    for (const r of roll) { if (!r.entry) acc.unmarked += 1; else acc[r.entry.mark] += 1; }
    return acc;
  }, [roll]);

  const meta = SESSION_META[session];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b bg-gradient-to-r from-primary-soft/40 to-background px-4 py-2.5">
        <UserCheck className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">{meta.label} · {new Date(date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</h2>
        <Badge variant="outline" className="text-[10px]">{meta.window}</Badge>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-emerald-700">P {stats.present}</span>
          <span className="text-amber-700">L {stats.late}</span>
          <span className="text-rose-700">A {stats.absent}</span>
          <span className="text-sky-700">M {stats.medical}</span>
          <span className="text-violet-700">E {stats.excused}</span>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => { bulkMark(date, session, students.map((s) => s.id), "present"); toast.success(`${meta.label}: all present.`); }}>
            <CheckCircle2 className="h-4 w-4" />All present
          </Button>
          <Button size="sm" variant="outline" onClick={() => { clearDay(date, session, students.map((s) => s.id)); toast(`${meta.label} cleared.`); }}>
            <RotateCcw className="h-4 w-4" />Clear
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => toast.success(`${meta.label} for ${date} saved.`)}>
            <Save className="h-4 w-4" />Save
          </Button>
        </div>
      </div>
      <div className="divide-y">
        {roll.map(({ student, entry }) => (
          <RollRow
            key={student.id}
            student={student}
            mark={entry?.mark}
            note={entry?.note}
            onMark={(m) => markAttendance(date, session, student.id, m, entry?.note)}
            onNote={(note) => markAttendance(date, session, student.id, entry?.mark ?? "present", note)}
          />
        ))}
      </div>
    </Card>
  );
}

function RollRow({ student, mark, note, onMark, onNote }: {
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
        className="ml-auto h-8 max-w-[240px] text-xs"
      />
    </div>
  );
}
