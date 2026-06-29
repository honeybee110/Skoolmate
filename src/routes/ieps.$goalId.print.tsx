import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { iepGoals, students, classInfo, evidenceItems, type SuccessCriterion } from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";
import { Printer, ArrowLeft } from "lucide-react";

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

const stageLabel: Record<Exclude<import("@/lib/mock-data").IepStatus, "not-started">, string> = {
  developing: "Developing",
  "working-towards": "Working Towards",
  achieved: "Achieved",
};

function IepPrintPage() {
  const { goal } = Route.useLoaderData();
  const student = students.find((s) => s.id === goal.studentId);
  const evidence = evidenceItems.filter((e) => e.goalIds.includes(goal.id));

  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 18mm; } body { background: white !important; } }`}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-6 py-3 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ieps" search={{ student: goal.studentId, semester: goal.semester, goal: goal.id }}>
            <ArrowLeft className="h-4 w-4" />Back to IEPs
          </Link>
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-foreground/15 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">SchoolMate AU</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Individual Education Plan</h1>
            <p className="text-xs text-muted-foreground">{classInfo.term} · Class {classInfo.code} · Teacher {classInfo.teacher}</p>
          </div>
          <div className="text-right text-xs">
            <p><span className="text-muted-foreground">Status: </span><span className="font-medium">{goal.status === "not-started" ? "Not started" : stageLabel[goal.status as keyof typeof stageLabel]}</span></p>
            <p><span className="text-muted-foreground">Approval: </span><span className="font-medium capitalize">{goal.approval ?? "draft"}</span></p>
            {goal.approvedBy && <p className="mt-0.5 text-[10px] text-muted-foreground">{goal.approvedBy} · {goal.approvedAt}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-x-8 gap-y-3 py-5 text-sm">
          <Row label="Student">{goal.studentName}</Row>
          <Row label="Date of birth">{student?.dob ?? "—"}</Row>
          <Row label="Year level">{student?.yearLevel ?? "—"}</Row>
          <Row label="Funding">{student?.funding ?? "—"}</Row>
          <Row label="Learning area">{goal.learningArea}</Row>
          <Row label="VC 2.0 level">Level {goal.level} · {goal.vcLink}</Row>
          <Row label="Semester">{goal.semester}</Row>
          <Row label="Review due">{goal.reviewDue}</Row>

          <Row label="Domain">{goal.domain}</Row>
        </section>

        <Section title="Learning intention"><p>{goal.learningIntention}</p></Section>
        <Section title="SMART goal"><p className="font-medium">{goal.smart}</p></Section>
        <Section title="Baseline"><p>{goal.baseline}</p></Section>

        <Section title="Success criteria · Cross-Check">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-foreground/20 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-2 pr-2">#</th>
                <th className="py-2 pr-3">Step</th>
                <th className="py-2 pr-3">Developing</th>
                <th className="py-2 pr-3">Working Towards</th>
                <th className="py-2 pr-3">Achieved</th>
                <th className="py-2">Current</th>
              </tr>
            </thead>
            <tbody>
              {goal.successCriteria.map((c: SuccessCriterion, i: number) => (
                <tr key={i} className="border-b border-foreground/10 align-top">
                  <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium">{c.step}</td>
                  <td className="py-2 pr-3">{c.developing}</td>
                  <td className="py-2 pr-3">{c.workingTowards}</td>
                  <td className="py-2 pr-3">{c.achieved}</td>
                  <td className="py-2 font-medium capitalize">{c.status.replace("-", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title={`Evidence linked (${evidence.length})`}>
          {evidence.length === 0 ? <p className="text-xs italic text-muted-foreground">No evidence linked yet.</p> : (
            <ul className="space-y-1.5 text-[12px]">
              {evidence.map((e) => (
                <li key={e.id}>· <span className="font-medium capitalize">{e.medium}</span> — {e.caption} <span className="text-muted-foreground">({e.capturedAt}, {e.capturedBy})</span></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Signatures">
          <div className="grid grid-cols-3 gap-6 pt-6 text-[11px]">
            {["Teacher (Honey)", "Learning Specialist", "Parent / Guardian"].map((r) => (
              <div key={r}>
                <div className="h-12 border-b border-foreground/40" />
                <p className="mt-1 text-muted-foreground">{r}</p>
              </div>
            ))}
          </div>
        </Section>

        <footer className="mt-8 border-t border-foreground/15 pt-3 text-[10px] text-muted-foreground">
          SchoolMate AU · Generated {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })} · Confidential — for educational and family use only.
        </footer>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-foreground/10 py-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
