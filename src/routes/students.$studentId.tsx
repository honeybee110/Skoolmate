import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { students } from "@/lib/mock-data";
import { getAllEntrySkills } from "@/lib/entry-skills";
import { useActiveSemester } from "@/lib/semester-context";
import { currentSemester } from "@/lib/mock-data";
import { BehaviourPill, AttendanceDot } from "@/components/status-chips";
import {
  Sparkles, ChevronLeft, Pill, MessageSquareText, Calendar, FileText,
  Camera, Activity, Target, BookOpen, GraduationCap, Heart, ShieldCheck, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/students/$studentId")({
  loader: ({ params }) => {
    const student = students.find((s) => s.id === params.studentId);
    if (!student) throw notFound();
    return { student };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.student.firstName ?? "Student"} ${loaderData?.student.lastName ?? ""} · skoolmate` }],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="px-8 py-16 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students" className="mt-4 inline-block text-primary underline">Back to Students</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="px-8 py-16 text-center">
        <p className="text-destructive">{error.message}</p>
        <Button className="mt-4" onClick={reset}>Try again</Button>
      </div>
    </AppShell>
  ),
  component: StudentProfile,
});

function StudentProfile() {
  const { student } = Route.useLoaderData();

  return (
    <AppShell>
      <div className="border-b bg-background/60 px-4 py-5 md:px-8">
        <Link to="/students" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3" /> Students
        </Link>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-semibold text-foreground/70", student.avatarColor)}>
              {student.initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{student.firstName} {student.lastName}</h1>
              <p className="text-sm text-muted-foreground">
                {student.yearLevel} · {student.className} · DOB {student.dob} · {student.funding}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <AttendanceDot status={student.attendance} /> <span className="capitalize">{student.attendance}</span>
                </span>
                <BehaviourPill status={student.behaviour} />
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                  student.ndisFunded ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
                )}>
                  <ShieldCheck className="h-3 w-3" />NDIS {student.ndisFunded ? "funded" : "not funded"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                  student.dipStatus === "NDIS Funded" ? "bg-primary/15 text-primary"
                  : student.dipStatus === "Potentially Funded (DIP Meeting Scheduled)" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-muted text-muted-foreground",
                )}>
                  <ClipboardList className="h-3 w-3" />DIP · {student.dipStatus}
                  {student.dipStatus === "Potentially Funded (DIP Meeting Scheduled)" && student.dipMeetingDate ? ` · Mtg ${student.dipMeetingDate}` : ""}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]">Level {student.level}</span>
                {student.aacUser && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]"><MessageSquareText className="h-3 w-3" />AAC user</span>
                )}

                {student.medicalAlerts.map((m: string) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                    <Pill className="h-3 w-3" />{m}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Camera className="h-4 w-4" />Add evidence</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Sparkles className="h-4 w-4" />AI snapshot</Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8">
        {/* AI snapshot card */}
        <Card className="mb-6 border-primary/20 bg-primary-soft/30 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Today's Snapshot</div>
              <p className="mt-1 text-sm leading-relaxed">
                {student.firstName} arrived {student.attendance === "late" ? "10 minutes late but settled within 5 minutes" : "calm and engaged"} this morning. {student.iepGoalsAchieved} of {student.iepGoalsActive} IEP goals achieved this semester. Last week's behaviour data shows consistent regulation through the morning block — consider extending independent work time by 5 minutes.
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="learning">
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="personal"><Heart className="h-3.5 w-3.5" />Personal</TabsTrigger>
            <TabsTrigger value="learning"><GraduationCap className="h-3.5 w-3.5" />Learning Profile</TabsTrigger>
            <TabsTrigger value="iep"><Target className="h-3.5 w-3.5" />IEP</TabsTrigger>
            <TabsTrigger value="behaviour"><Activity className="h-3.5 w-3.5" />Behaviour</TabsTrigger>
            <TabsTrigger value="evidence"><Camera className="h-3.5 w-3.5" />Evidence</TabsTrigger>
            <TabsTrigger value="therapy"><MessageSquareText className="h-3.5 w-3.5" />Therapy</TabsTrigger>
            <TabsTrigger value="attendance"><Calendar className="h-3.5 w-3.5" />Attendance</TabsTrigger>
            <TabsTrigger value="reports"><FileText className="h-3.5 w-3.5" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="mt-4 space-y-4">
            <EntrySkillsPanel />
          </TabsContent>


          <TabsContent value="iep" className="mt-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Active IEP Goals — Semester 1, 2026</h3>
              <ul className="mt-4 space-y-4">
                {["Request a break using AAC device independently", "Count and match groups of 1–10 objects", "Take turns in a 3-person game with verbal prompts", "Write own first name on lined paper"].map((g, i) => (
                  <li key={i} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{g}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">Personal & Social · 4 pieces of evidence</div>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        i === 0 ? "bg-success/15 text-success" : i === 1 ? "bg-primary-soft text-primary" : "bg-warning/20 text-warning-foreground"
                      )}>
                        {i === 0 ? "Achieved" : i === 1 ? "Working Towards" : "Developing"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          {(["personal", "behaviour", "evidence", "therapy", "attendance", "reports"] as const).map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              <Card className="p-12 text-center text-sm text-muted-foreground">
                <BookOpen className="mx-auto mb-2 h-6 w-6 opacity-40" />
                {t[0].toUpperCase() + t.slice(1)} tab — coming in the next build pass.
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

function EntrySkillsPanel() {
  const { activeSemester } = useActiveSemester();
  const semester = activeSemester === "all" ? currentSemester : activeSemester;
  const groups = getAllEntrySkills(semester);
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Entry skills</h3>
          <p className="text-xs text-muted-foreground">
            Semester-aware substrands used to seed IEP success criteria.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">Active: {semester}</span>
      </div>
      {groups.map((group) => (
        <Card key={group.area} className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{group.area}</h3>
            <span className="text-[11px] text-muted-foreground">
              {group.area === "Personal & Social"
                ? "Scope & Sequence · constant"
                : group.area === "Maths"
                  ? `Victorian Curriculum 2.0 · ${semester === "Semester 1 · 2026" ? "Sem 1 strands" : "Sem 2 strands"}`
                  : "Victorian Curriculum 2.0"}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.skills.map((skill, i) => {
              const progress = [30, 55, 75][i % 3];
              return (
                <div key={skill.substrand} className="rounded-lg border bg-card p-3">
                  <div className="text-xs font-semibold">{skill.substrand}</div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{skill.descriptor}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>{skill.source === "scope-sequence" ? "S&S" : "VC 2.0"}</span>
                    <span>T1 · T2 · T3 · T4</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </>
  );
}

