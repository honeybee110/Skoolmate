import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { iepGoals, students, classInfo, evidenceItems, type IepGoal, type SuccessCriterion } from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";
import { Printer, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ieps/$goalId/print")({
  head: () => ({ meta: [{ title: "IEP · Printable" }] }),
  component: IepPrintPage,
  notFoundComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Goal not found</div>,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-destructive">{error.message}</div>,
  loader: ({ params }) => {
    const goal = iepGoals.find((g) => g.id === params.goalId);
    if (!goal) throw notFound();
    return { goal };
  },
});

const SCHOOL_NAME = "Sunshine Special Developmental School";
const PRINCIPAL = "Lisa Murphy";

// Template alert / plan checklist — page 2
const ALERT_PLANS: string[][] = [
  ["Asthma Plan", "Toileting Plan", "Regulation Profile"],
  ["Allergy Plan", "Complex Toileting Plan", "Mealtime Management Plan"],
  ["Anaphylaxis Plan", "Period Management Plan", "Behaviour Support Plan"],
  ["Epilepsy Plan", "Standing Frame Profile", "Behaviour Alert"],
  ["Midazolam Plan", "Individual Physical Needs Profile", "Risk Management Plan"],
  ["PEG Feeding Plan", "Walking Frame Profile", "Risk Assessment"],
  ["Medical Alert", "Hoist Transfer Profile", "Absence Learning Plan"],
  ["Shunt Alert", "Personal Care Medical Advice Form", "Attendance Improvement Plan"],
  ["Choking and Swallowing Alert", "Student Health Support Plan", "Re-engagement Plan"],
  ["Medication Authorisation Form", "Communication Profile", "Modified Timetable"],
];

// Map learning areas → template page sections
type SectionKey = "English" | "Maths" | "Personal & Social" | "Science" | "Specialist";
const SECTIONS: { key: SectionKey; title: string; areas: string[]; subBuckets?: { label: string; match: (a: string) => boolean }[] }[] = [
  {
    key: "English",
    title: "English",
    areas: ["English · Reading & Viewing", "English · Speaking & Listening", "English · Writing", "English · Phonics"],
    subBuckets: [
      { label: "Reading and Viewing", match: (a) => a.includes("Reading") || a.includes("Phonics") },
      { label: "Speaking and Listening", match: (a) => a.includes("Speaking") },
      { label: "Writing", match: (a) => a.includes("Writing") },
    ],
  },
  {
    key: "Maths",
    title: "Maths",
    areas: ["Maths · Number", "Maths · Measurement", "Maths · Space"],
    subBuckets: [
      { label: "Measurement", match: (a) => a.includes("Measurement") },
      { label: "Number", match: (a) => a.includes("Number") },
      { label: "Space", match: (a) => a.includes("Space") },
    ],
  },
  {
    key: "Personal & Social",
    title: "Personal and Social Capabilities",
    areas: [],
    subBuckets: [
      { label: "Self-awareness and Management", match: () => false },
      { label: "Social Awareness and Management", match: () => false },
    ],
  },
  { key: "Science", title: "Science", areas: ["Science"] },
  { key: "Specialist", title: "Specialist Subjects", areas: [] },
];

const STAGE_LABEL: Record<Exclude<import("@/lib/mock-data").IepStatus, "not-started">, string> = {
  developing: "Developing",
  "working-towards": "Working Towards",
  achieved: "Achieved",
};

function IepPrintPage() {
  const { goal } = Route.useLoaderData();
  const { activeSemester } = useActiveSemester();
  const student = students.find((s) => s.id === goal.studentId);
  // The full IEP for this student in the goal's semester
  const studentGoals = iepGoals.filter((g) => g.studentId === goal.studentId && g.semester === goal.semester);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, []);

  if (!student) return null;
  const fullName = `${student.firstName} ${student.lastName}`;
  const alertSet = new Set(student.medicalAlerts.map((a) => a.toLowerCase()));
  const isTicked = (label: string) =>
    alertSet.has(label.toLowerCase()) || (label === "Communication Profile" && student.aacUser);

  return (
    <div className="min-h-screen bg-muted/40 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          .iep-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          .iep-page:last-child { page-break-after: auto; }
        }
        .iep-page { width: 210mm; min-height: 297mm; padding: 18mm 16mm; margin: 0 auto 12px; background: white; }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-6 py-3 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ieps" search={scopedSearch(activeSemester, { student: goal.studentId, semester: goal.semester, goal: goal.id })}>
            <ArrowLeft className="h-4 w-4" />Back to IEPs
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">Privacy: photo and school logo are placeholder graphics — no real images embedded.</p>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />Print / Save as PDF
        </Button>
      </div>

      <div className="py-6 print:py-0">
        {/* PAGE 1 — COVER */}
        <section className="iep-page shadow-lg ring-1 ring-foreground/5 print:shadow-none print:ring-0">
          <div className="flex h-full min-h-[260mm] flex-col">
            <header className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Placeholder school logo — abstract, no real branding */}
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-base font-bold text-white shadow-sm">
                  ☀
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{SCHOOL_NAME.split(" ").slice(0, 1).join(" ").toUpperCase()} · SDS</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Special Developmental School</p>
                </div>
              </div>
              <div className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                <p>Confidential</p><p>{goal.semester}</p>
              </div>
            </header>

            <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
              <h1 className="text-4xl font-light tracking-tight text-foreground">{SCHOOL_NAME}</h1>
              <div className="mt-12 grid place-items-center">
                {/* Placeholder avatar — initials in a soft framed circle, NOT a real photo */}
                <div className={cn("relative grid h-44 w-44 place-items-center rounded-full ring-4 ring-primary/20", student.avatarColor)}>
                  <span className="text-5xl font-semibold text-foreground/70">{student.initials}</span>
                  <span className="absolute -bottom-2 rounded-full bg-card px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground ring-1 ring-border">Photo placeholder</span>
                </div>
              </div>
              <h2 className="mt-14 text-5xl font-semibold tracking-tight text-primary">Individual Education Plan</h2>
            </div>

            <footer className="mt-auto grid grid-cols-3 gap-6 border-t border-foreground/10 pt-6 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Student Name</p>
                <p className="mt-1 text-base font-medium">{fullName}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Classroom</p>
                <p className="mt-1 text-base font-medium">{classInfo.code} · {classInfo.teacher}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Principal</p>
                <p className="mt-1 text-base font-medium">{PRINCIPAL}</p>
              </div>
            </footer>
          </div>
        </section>

        {/* PAGE 2 — STUDENT PROFILE */}
        <section className="iep-page shadow-lg ring-1 ring-foreground/5 print:shadow-none print:ring-0">
          <h1 className="border-b-4 border-primary pb-2 text-2xl font-semibold tracking-tight text-primary">Individual Student Profile</h1>

          <ProfileTable className="mt-5">
            <ProfileRow cells={[["Student name", fullName], ["Date of birth", student.dob]]} />
            <ProfileRow cells={[["Teacher", classInfo.teacher], ["Review", goal.semester.split(" · ")[0]]]} />
          </ProfileTable>

          <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-foreground">Student Support Group (SSG) Members</h3>
          <ProfileTable className="mt-2">
            <ProfileRow cells={[["Name", classInfo.teacher], ["Name", "—"]]} />
            <ProfileRow cells={[["Role", "Teacher"], ["Role", "Occupational Therapist"]]} />
            <ProfileRow cells={[["Name", "—"], ["Name", "—"]]} />
            <ProfileRow cells={[["Role", "Speech Pathologist"], ["Role", "Parent / Guardian"]]} />
            <ProfileRow cells={[["Name", classInfo.educationSupport], ["Name", "—"]]} />
            <ProfileRow cells={[["Role", "Education Support"], ["Role", "Learning Specialist"]]} />
          </ProfileTable>

          <p className="mt-6 text-xs italic text-muted-foreground">Please tick all boxes relevant to the student and provide additional information as required:</p>

          <ProfileTable className="mt-2">
            <tr className="align-top">
              <th className="w-[34%] border border-foreground/15 bg-muted/40 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">Diagnosis</th>
              <td className="border border-foreground/15 px-3 py-2 text-[12px]">{student.funding.includes("NDIS") ? "Intellectual Disability" : "Developmental Delay"} · {student.funding}</td>
            </tr>
            <tr className="align-top">
              <th className="border border-foreground/15 bg-muted/40 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">Functional needs</th>
              <td className="border border-foreground/15 px-3 py-2 text-[12px]">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {["Learning and Applying Knowledge", "General Tasks and Demands", "Communication", "Self-care", "Interpersonal Interactions", "Mobility"].map((n) => (
                    <li key={n}>☒ {n}</li>
                  ))}
                </ul>
              </td>
            </tr>
          </ProfileTable>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground">Strengths and Interests</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px]">
            <li>Enjoys music, sensory play and structured routines.</li>
            <li>Responds well to visual supports and predictable transitions.</li>
            <li>Motivated by 1:1 attention with the classroom team.</li>
          </ul>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground">Plans &amp; Alerts</h3>
          <table className="mt-2 w-full border-collapse">
            <tbody>
              {ALERT_PLANS.map((row, i) => (
                <tr key={i}>
                  {row.map((label) => (
                    <td key={label} className="w-1/3 border border-foreground/15 px-3 py-1.5 text-[11px]">
                      <span className="mr-1.5">{isTicked(label) ? "☒" : "☐"}</span>{label}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <PageFooter page={2} total={2 + SECTIONS.length} fullName={fullName} semester={goal.semester} />
        </section>

        {/* PAGES 3+ — LEARNING AREAS */}
        {SECTIONS.map((section, idx) => {
          const sectionGoals = section.areas.length
            ? studentGoals.filter((g) => section.areas.includes(g.learningArea))
            : section.key === "Personal & Social"
              ? studentGoals.filter((g) => g.domain === "Personal & Social" || g.domain === "Self-care")
              : [];

          return (
            <section key={section.key} className="iep-page shadow-lg ring-1 ring-foreground/5 print:shadow-none print:ring-0">
              <h1 className="border-b-4 border-primary pb-2 text-2xl font-semibold uppercase tracking-tight text-primary">{section.title}</h1>

              {section.subBuckets ? (
                <div className="mt-5 space-y-5">
                  {section.subBuckets.map((bucket) => {
                    const bucketGoals = sectionGoals.filter((g) => bucket.match(g.learningArea));
                    return <SubBucket key={bucket.label} title={bucket.label} goals={bucketGoals} highlightGoalId={goal.id} />;
                  })}
                </div>
              ) : sectionGoals.length ? (
                <div className="mt-5 space-y-5">
                  {sectionGoals.map((g) => <GoalBlock key={g.id} goal={g} highlight={g.id === goal.id} />)}
                </div>
              ) : section.key === "Specialist" ? (
                <div className="mt-5 space-y-3 text-[12px]">
                  {["PE", "Visual Arts", "Music", "Drama", "Learn to Play"].map((sub) => (
                    <div key={sub} className="border border-foreground/15 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">{sub}</p>
                      <p className="mt-1"><span className="text-muted-foreground">Learning Goal: </span>Participate with adapted equipment and adult support.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-[12px] italic text-muted-foreground">No goals recorded in this learning area for {goal.semester}.</p>
              )}

              <PageFooter page={3 + idx} total={2 + SECTIONS.length} fullName={fullName} semester={goal.semester} />
            </section>
          );
        })}

        {/* SIGNATURES PAGE */}
        <section className="iep-page shadow-lg ring-1 ring-foreground/5 print:shadow-none print:ring-0">
          <h1 className="border-b-4 border-primary pb-2 text-2xl font-semibold uppercase tracking-tight text-primary">Sign-off &amp; Evidence Summary</h1>

          <p className="mt-5 text-[12px] text-muted-foreground">Evidence linked across all goals this semester: <span className="font-semibold text-foreground">{evidenceItems.filter((e) => e.studentId === goal.studentId && e.semester === goal.semester).length}</span> items.</p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground">Recent evidence</h3>
          <ul className="mt-2 space-y-1 text-[12px]">
            {evidenceItems
              .filter((e) => e.studentId === goal.studentId && e.semester === goal.semester)
              .slice(0, 6)
              .map((e) => (
                <li key={e.id}>· <span className="font-medium capitalize">{e.medium}</span> — {e.caption} <span className="text-muted-foreground">({e.capturedAt})</span></li>
              ))}
            {evidenceItems.filter((e) => e.studentId === goal.studentId && e.semester === goal.semester).length === 0 && (
              <li className="italic text-muted-foreground">No evidence captured yet for this semester.</li>
            )}
          </ul>

          <div className="mt-12 grid grid-cols-3 gap-6 text-[11px]">
            {[`Teacher (${classInfo.teacher})`, "Learning Specialist", "Parent / Guardian"].map((r) => (
              <div key={r}>
                <div className="h-14 border-b border-foreground/50" />
                <p className="mt-1 text-muted-foreground">{r}</p>
                <p className="text-[10px] text-muted-foreground">Date: ____ / ____ / ______</p>
              </div>
            ))}
          </div>

          <PageFooter page={3 + SECTIONS.length} total={3 + SECTIONS.length} fullName={fullName} semester={goal.semester} />
        </section>
      </div>
    </div>
  );
}

function ProfileTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <table className={cn("w-full border-collapse text-[12px]", className)}>
      <tbody>{children}</tbody>
    </table>
  );
}
function ProfileRow({ cells }: { cells: [string, string][] }) {
  return (
    <tr>
      {cells.flatMap(([label, value], i) => [
        <th key={`${i}-l`} className="w-[18%] border border-foreground/15 bg-muted/40 px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide">{label}</th>,
        <td key={`${i}-v`} className="w-[32%] border border-foreground/15 px-3 py-1.5">{value}</td>,
      ])}
    </tr>
  );
}

function SubBucket({ title, goals, highlightGoalId }: { title: string; goals: IepGoal[]; highlightGoalId: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">{title}</p>
      {goals.length === 0 ? (
        <div className="mt-1.5 border border-dashed border-foreground/20 px-3 py-2 text-[11px] italic text-muted-foreground">
          Learning Goal: <span className="not-italic">—</span> · Entry Skills: <span className="not-italic">—</span>
        </div>
      ) : (
        <div className="mt-1.5 space-y-2">
          {goals.map((g) => <GoalBlock key={g.id} goal={g} highlight={g.id === highlightGoalId} compact />)}
        </div>
      )}
    </div>
  );
}

function GoalBlock({ goal, highlight, compact }: { goal: IepGoal; highlight?: boolean; compact?: boolean }) {
  return (
    <div className={cn("border px-3 py-2", highlight ? "border-primary/50 bg-primary/[0.04]" : "border-foreground/15")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">{goal.learningArea}</p>
        <p className="text-[10px] text-muted-foreground">VC 2.0 Level {goal.level} · {goal.vcLink} · {STAGE_LABEL[goal.status as keyof typeof STAGE_LABEL] ?? "Not started"}</p>
      </div>
      <p className="mt-1.5 text-[12px]"><span className="font-semibold">Learning Goal: </span>{goal.learningIntention}</p>
      <p className="mt-1 text-[12px]"><span className="font-semibold">SMART: </span>{goal.smart}</p>
      <p className="mt-1 text-[12px]"><span className="font-semibold">Entry Skills: </span>{goal.baseline}</p>
      {!compact && (
        <table className="mt-2 w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="border-b border-foreground/20 text-left text-muted-foreground">
              <th className="py-1 pr-2 font-medium">Step</th>
              <th className="py-1 pr-2 font-medium">Developing</th>
              <th className="py-1 pr-2 font-medium">Working Towards</th>
              <th className="py-1 pr-2 font-medium">Achieved</th>
              <th className="py-1 font-medium">Current</th>
            </tr>
          </thead>
          <tbody>
            {goal.successCriteria.map((c: SuccessCriterion, i) => (
              <tr key={i} className="border-b border-foreground/10 align-top">
                <td className="py-1 pr-2 font-medium">{c.step}</td>
                <td className="py-1 pr-2">{c.developing}</td>
                <td className="py-1 pr-2">{c.workingTowards}</td>
                <td className="py-1 pr-2">{c.achieved}</td>
                <td className="py-1 font-medium capitalize">{c.status.replace("-", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PageFooter({ page, total, fullName, semester }: { page: number; total: number; fullName: string; semester: string }) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-foreground/10 pt-2 text-[9px] uppercase tracking-widest text-muted-foreground">
      <span>{SCHOOL_NAME}</span>
      <span>{fullName} · IEP · {semester}</span>
      <span>Page {page} of {total}</span>
    </div>
  );
}
