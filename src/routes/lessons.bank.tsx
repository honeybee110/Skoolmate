import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Search, CheckCircle2, Clock, ArrowLeft, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lessons/bank")({
  head: () => ({ meta: [{ title: "Lesson Bank · SchoolMate AU" }] }),
  component: LessonBankPage,
});

type Term = "Term 1" | "Term 2" | "Term 3" | "Term 4";
type Status = "approved" | "pending";
type Entry = {
  id: string; term: Term; status: Status;
  title: string; subject: string; strand: string; vcCode: string;
  author: string; week: number; duration: string;
};

const BANK: Entry[] = [
  // Term 1 — Semester 1
  { id: "l-t1-01", term: "Term 1", status: "approved", title: "Counting to 20 with 10-frames",         subject: "Mathematics", strand: "Number",                 vcCode: "VC2MFN01",  author: "Honey P.",  week: 2, duration: "45 min" },
  { id: "l-t1-02", term: "Term 1", status: "approved", title: "Naming characters in shared texts",     subject: "English",     strand: "Reading and Viewing",     vcCode: "VC2ELB07",  author: "Honey P.",  week: 3, duration: "40 min" },
  { id: "l-t1-03", term: "Term 1", status: "approved", title: "Compare length of two objects",         subject: "Mathematics", strand: "Measurement and Space",   vcCode: "VC2MAM01",  author: "Miriam K.", week: 4, duration: "30 min" },
  { id: "l-t1-04", term: "Term 1", status: "pending",  title: "Now / Then / Later — my morning",       subject: "History",     strand: "Historical Knowledge",    vcCode: "VC2HFHK01", author: "Honey P.",  week: 5, duration: "35 min" },
  { id: "l-t1-05", term: "Term 1", status: "pending",  title: "AAC requesting during snack",           subject: "English",     strand: "Speaking and Listening",  vcCode: "VC2EFCLA01",author: "Sina T.",   week: 6, duration: "20 min" },
  // Term 2
  { id: "l-t2-01", term: "Term 2", status: "approved", title: "Blend and read CVC words",              subject: "English",     strand: "Reading and Viewing",     vcCode: "VC2EFDLY02",author: "Honey P.",  week: 1, duration: "45 min" },
  { id: "l-t2-02", term: "Term 2", status: "approved", title: "Sequence a 3-step play routine",        subject: "Learn to Play", strand: "Play Skills",           vcCode: "L2P-PS-D01",author: "Ivy R.",    week: 2, duration: "30 min" },
  { id: "l-t2-03", term: "Term 2", status: "approved", title: "Form lower-case letters — m, a, s",     subject: "English",     strand: "Writing",                 vcCode: "VC2EFLY15", author: "Honey P.",  week: 4, duration: "40 min" },
  { id: "l-t2-04", term: "Term 2", status: "pending",  title: "Body percussion to a steady beat",      subject: "Music",       strand: "Making and Responding",   vcCode: "VC2AMU01",  author: "Ivy R.",    week: 6, duration: "25 min" },
  // Term 3 — Semester 2
  { id: "l-t3-01", term: "Term 3", status: "approved", title: "Sort and copy AB colour patterns",      subject: "Mathematics", strand: "Algebra",                 vcCode: "VC2MFA01",  author: "Honey P.",  week: 1, duration: "35 min" },
  { id: "l-t3-02", term: "Term 3", status: "approved", title: "Places I belong — home & classroom",    subject: "Geography",   strand: "Geographical Knowledge",  vcCode: "VC2HGFK01", author: "Miriam K.", week: 2, duration: "40 min" },
  { id: "l-t3-03", term: "Term 3", status: "pending",  title: "Yes / No picture surveys",              subject: "Mathematics", strand: "Statistics",              vcCode: "VC2MFST01", author: "Honey P.",  week: 3, duration: "30 min" },
  { id: "l-t3-04", term: "Term 3", status: "pending",  title: "Take on a role using a prop",           subject: "Drama",       strand: "Making and Responding",   vcCode: "VC2ADRFE01",author: "Ivy R.",    week: 5, duration: "35 min" },
  // Term 4
  { id: "l-t4-01", term: "Term 4", status: "approved", title: "Catch a soft ball from 1m",             subject: "Physical Education", strand: "Movement and Physical Activity", vcCode: "VC2HPFM02", author: "Coach D.", week: 1, duration: "30 min" },
  { id: "l-t4-02", term: "Term 4", status: "approved", title: "Sort living / non-living",              subject: "Science",     strand: "Science Understanding",   vcCode: "VC2SFU01",  author: "Honey P.",  week: 2, duration: "40 min" },
  { id: "l-t4-03", term: "Term 4", status: "pending",  title: "End-of-year showcase — mixed media",    subject: "Visual Arts", strand: "Making and Responding",   vcCode: "VC2AVA01",  author: "Ivy R.",    week: 8, duration: "60 min" },
];

const TERMS: Term[] = ["Term 1", "Term 2", "Term 3", "Term 4"];

function LessonBankPage() {
  const [term, setTerm] = useState<Term | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => BANK.filter((e) => {
    if (term !== "all" && e.term !== term) return false;
    if (status !== "all" && e.status !== status) return false;
    if (q && !`${e.title} ${e.subject} ${e.strand} ${e.vcCode} ${e.author}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [term, status, q]);

  const grouped = useMemo(() => {
    const map: Record<Term, Entry[]> = { "Term 1": [], "Term 2": [], "Term 3": [], "Term 4": [] };
    for (const e of filtered) map[e.term].push(e);
    return map;
  }, [filtered]);

  const counts = useMemo(() => ({
    approved: BANK.filter((e) => e.status === "approved").length,
    pending:  BANK.filter((e) => e.status === "pending").length,
  }), []);

  return (
    <AppShell>
      <PageHeader
        title="Lesson Planner Bank"
        subtitle="Approved and pending lessons across Term 1 – Term 4 · Victorian Curriculum 2.0"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/lessons"><ArrowLeft className="h-4 w-4" />Back to Planner</Link>
          </Button>
        }
      />

      <div className="grid gap-3 px-4 pt-6 md:grid-cols-3 md:px-8">
        <StatTile label="Total lessons" value={BANK.length} icon={<Library className="h-4 w-4 text-primary" />} />
        <StatTile label="Approved" value={counts.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} tone="border-emerald-200 bg-emerald-50/30" />
        <StatTile label="Pending review" value={counts.pending} icon={<Clock className="h-4 w-4 text-amber-600" />} tone="border-amber-200 bg-amber-50/30" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 md:px-8">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          <button onClick={() => setTerm("all")} className={cn("rounded-md px-2.5 py-1 transition", term === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>All Terms</button>
          {TERMS.map((t) => (
            <button key={t} onClick={() => setTerm(t)} className={cn("rounded-md px-2.5 py-1 transition", term === t ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          {(["all", "approved", "pending"] as const).map((v) => (
            <button key={v} onClick={() => setStatus(v)} className={cn("rounded-md px-2.5 py-1 capitalize transition", status === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{v}</button>
          ))}
        </div>
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, subject, VC code, author…" className="h-9 pl-8" />
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {TERMS.map((t) => {
          const rows = grouped[t];
          if (term !== "all" && term !== t) return null;
          if (rows.length === 0 && term === t) return (
            <Card key={t} className="p-6 text-center text-sm text-muted-foreground">No lessons in {t} match these filters.</Card>
          );
          if (rows.length === 0) return null;
          return (
            <div key={t}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">{t}</h2>
                <Badge variant="outline" className="text-[10px]">{rows.length} lesson{rows.length === 1 ? "" : "s"}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {rows.filter((r) => r.status === "approved").length} approved · {rows.filter((r) => r.status === "pending").length} pending
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((e) => <LessonRow key={e.id} entry={e} />)}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
  return (
    <Card className={cn("p-4", tone)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function LessonRow({ entry }: { entry: Entry }) {
  const approved = entry.status === "approved";
  return (
    <Card className="p-4 hover:border-primary/40 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <Badge
          className={cn(
            "text-[10px]",
            approved
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              : "bg-amber-100 text-amber-700 hover:bg-amber-100",
          )}
        >
          {approved ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
          {approved ? "Approved" : "Pending"}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug">{entry.title}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">{entry.subject}</Badge>
        <Badge variant="outline" className="text-[10px]">{entry.strand}</Badge>
        <Badge variant="outline" className="font-mono text-[10px]">{entry.vcCode}</Badge>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Week {entry.week} · {entry.duration}</span>
        <span>{entry.author}</span>
      </div>
    </Card>
  );
}
