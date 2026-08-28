import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { PortalGuard } from "@/components/portal-guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, AlertTriangle, HeartPulse, Target, ClipboardCheck } from "lucide-react";
import { useDirectory } from "@/lib/directory-store";
import { students as seedStudents, iepGoals, behaviourReports, currentSemester, availableSemesters, type AttendanceStatus, type BehaviourStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Student Directory · skoolmate" }] }),
  component: () => (
    <PortalGuard portal="admin">
      <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
        <AppShell variant="admin">
          <StudentsDirectory />
        </AppShell>
      </RoleGate>
    </PortalGuard>
  ),
});

const behaviourTone: Record<BehaviourStatus, string> = {
  calm: "bg-emerald-100 text-emerald-800 border-emerald-200",
  settled: "bg-teal-100 text-teal-800 border-teal-200",
  alert: "bg-amber-100 text-amber-800 border-amber-200",
  incident: "bg-rose-100 text-rose-800 border-rose-200",
};

const attendanceTone: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 border-emerald-200",
  late: "bg-amber-100 text-amber-800 border-amber-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
  absent: "bg-rose-100 text-rose-800 border-rose-200",
};

function StudentsDirectory() {
  const { classes, teachers, studentClass } = useDirectory();
  const [q, setQ] = useState("");
  const [classId, setClassId] = useState<string>("All");
  const [yearLevel, setYearLevel] = useState<string>("All");
  const [teacherId, setTeacherId] = useState<string>("All");
  const [semester, setSemester] = useState<string>(currentSemester);
  const [behaviour, setBehaviour] = useState<string>("All");
  const [attendance, setAttendance] = useState<string>("All");
  const [iepFilter, setIepFilter] = useState<string>("All");

  const yearLevels = useMemo(() => Array.from(new Set(seedStudents.map((s) => s.yearLevel))), []);

  const enriched = useMemo(() => seedStudents.map((s) => {
    const cid = studentClass[s.id];
    const cls = classes.find((c) => c.id === cid);
    const t = cls ? teachers.find((x) => x.id === cls.teacherId) : undefined;
    const es = cls ? cls.esStaffIds.map((id) => teachers.find((x) => x.id === id)).filter(Boolean) : [];
    const goals = iepGoals.filter((g) => g.studentId === s.id);
    const iepPercent = goals.length ? Math.round((goals.filter((g) => g.status === "achieved").length / goals.length) * 100) : 0;
    const crossCheckPercent = goals.length ? Math.round(
      goals.flatMap((g) => g.successCriteria).filter((c) => c.status === "achieved").length /
      Math.max(1, goals.flatMap((g) => g.successCriteria).length) * 100
    ) : 0;
    const beh = behaviourReports.filter((b) => b.studentId === s.id && b.status !== "resolved").length;
    return { s, cls, teacher: t, es, iepPercent, crossCheckPercent, openBehaviours: beh };
  }), [classes, teachers, studentClass]);

  const filtered = enriched.filter(({ s, cls, teacher, iepPercent }) => {
    if (q.trim()) {
      const q2 = q.toLowerCase();
      if (!`${s.firstName} ${s.lastName}`.toLowerCase().includes(q2)) return false;
    }
    if (classId !== "All" && cls?.id !== classId) return false;
    if (yearLevel !== "All" && s.yearLevel !== yearLevel) return false;
    if (teacherId !== "All" && teacher?.id !== teacherId) return false;
    if (behaviour !== "All" && s.behaviour !== behaviour) return false;
    if (attendance !== "All" && s.attendance !== attendance) return false;
    if (iepFilter === "complete" && iepPercent < 100) return false;
    if (iepFilter === "in-progress" && (iepPercent === 0 || iepPercent === 100)) return false;
    if (iepFilter === "not-started" && iepPercent > 0) return false;
    void semester;
    return true;
  });

  return (
    <>
      <PageHeader title="Whole-School Student Directory" subtitle="Every enrolled student. Filter by class, year level, teacher, behaviour, attendance and IEP progress." />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <Card className="p-4">
          <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-8">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student…" className="h-9 pl-8" />
            </div>
            <Select value={classId} onValueChange={setClassId}><SelectTrigger className="h-9"><SelectValue placeholder="Class" /></SelectTrigger><SelectContent><SelectItem value="All">All classes</SelectItem>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select value={yearLevel} onValueChange={setYearLevel}><SelectTrigger className="h-9"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent><SelectItem value="All">All years</SelectItem>{yearLevels.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
            <Select value={teacherId} onValueChange={setTeacherId}><SelectTrigger className="h-9"><SelectValue placeholder="Teacher" /></SelectTrigger><SelectContent><SelectItem value="All">All teachers</SelectItem>{teachers.filter((t) => !t.archived).map((t) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent></Select>
            <Select value={semester} onValueChange={setSemester}><SelectTrigger className="h-9"><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent>{availableSemesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={behaviour} onValueChange={setBehaviour}><SelectTrigger className="h-9"><SelectValue placeholder="Behaviour" /></SelectTrigger><SelectContent><SelectItem value="All">All behaviour</SelectItem>{["calm","settled","alert","incident"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            <Select value={attendance} onValueChange={setAttendance}><SelectTrigger className="h-9"><SelectValue placeholder="Attendance" /></SelectTrigger><SelectContent><SelectItem value="All">All attendance</SelectItem>{["present","late","partial","absent"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            <Select value={iepFilter} onValueChange={setIepFilter}><SelectTrigger className="h-9"><SelectValue placeholder="IEP" /></SelectTrigger><SelectContent><SelectItem value="All">All IEP</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="in-progress">In progress</SelectItem><SelectItem value="not-started">Not started</SelectItem></SelectContent></Select>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{filtered.length} of {enriched.length} students</div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ s, cls, teacher, es, iepPercent, crossCheckPercent, openBehaviours }) => (
            <Link key={s.id} to="/students/$studentId" params={{ studentId: s.id }} className="block">
              <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-foreground ${s.avatarColor}`}>{s.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.yearLevel} · {cls?.name ?? "Unassigned"}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground truncate">
                      Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"}
                      {es.length > 0 && <> · ES: {es.map((e) => e?.firstName).join(", ")}</>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`rounded-md border px-2 py-1 ${attendanceTone[s.attendance]}`}>Att · {s.attendance}</div>
                  <div className={`rounded-md border px-2 py-1 ${behaviourTone[s.behaviour]}`}>Beh · {s.behaviour}</div>
                  <div className="rounded-md border px-2 py-1 bg-[color:var(--primary)]/10 text-[color:var(--primary)] border-[color:var(--primary)]/20 flex items-center gap-1"><Target className="h-3 w-3" />IEP {iepPercent}%</div>
                  <div className="rounded-md border px-2 py-1 bg-[color:var(--accent)]/10 text-[color:var(--accent)] border-[color:var(--accent)]/20 flex items-center gap-1"><ClipboardCheck className="h-3 w-3" />CrossCheck {crossCheckPercent}%</div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {s.medicalAlerts.map((m) => <Badge key={m} className="bg-rose-100 text-rose-800 border-rose-200 gap-1"><HeartPulse className="h-3 w-3" />{m}</Badge>)}
                  {openBehaviours > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><AlertTriangle className="h-3 w-3" />{openBehaviours} open behaviour</Badge>}
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No students match those filters.</div>}
        </div>
      </div>
    </>
  );
}
