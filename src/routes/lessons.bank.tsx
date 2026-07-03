import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Search, CheckCircle2, Clock, ArrowLeft, FileText, Filter, LayoutGrid, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessonStore, setLessonStatus, type LessonTerm, type LessonStatus, type SavedLesson } from "@/lib/lesson-store";

export const Route = createFileRoute("/lessons/bank")({
  head: () => ({ meta: [{ title: "Lesson Bank · skoolmate" }] }),
  component: LessonBankPage,
});

const TERMS: LessonTerm[] = ["Term 1", "Term 2", "Term 3", "Term 4"];

function LessonBankPage() {
  const { lessons } = useLessonStore();
  const [term, setTerm] = useState<LessonTerm | "all">("all");
  const [status, setStatus] = useState<LessonStatus | "all">("all");
  const [group, setGroup] = useState<"term" | "subject">("term");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => lessons.filter((e) => {
    if (term !== "all" && e.term !== term) return false;
    if (status !== "all" && e.status !== status) return false;
    if (group === "subject" && e.status !== "approved") return false; // "bank of approved plans grouped per subject"
    if (q && !`${e.title} ${e.subject} ${e.strand} ${e.vcCode ?? ""} ${e.author}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [lessons, term, status, group, q]);

  const groupedByTerm = useMemo(() => {
    const map: Record<LessonTerm, SavedLesson[]> = { "Term 1": [], "Term 2": [], "Term 3": [], "Term 4": [] };
    for (const e of filtered) map[e.term].push(e);
    return map;
  }, [filtered]);

  const groupedBySubject = useMemo(() => {
    const map = new Map<string, SavedLesson[]>();
    for (const e of filtered) {
      if (!map.has(e.subject)) map.set(e.subject, []);
      map.get(e.subject)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const counts = useMemo(() => ({
    approved: lessons.filter((e) => e.status === "approved").length,
    pending:  lessons.filter((e) => e.status === "pending").length,
    draft:    lessons.filter((e) => e.status === "draft").length,
  }), [lessons]);

  return (
    <AppShell>
      <PageHeader
        title="Lesson Planner Bank"
        subtitle="Saved lesson plans across Term 1 – Term 4 · Approved bank grouped per subject · Victorian Curriculum 2.0"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/lessons"><ArrowLeft className="h-4 w-4" />Back to Planner</Link>
          </Button>
        }
      />

      <div className="grid gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatTile label="Total lessons" value={lessons.length} icon={<Library className="h-4 w-4 text-primary" />} />
        <StatTile label="Approved" value={counts.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} tone="border-emerald-200 bg-emerald-50/30" />
        <StatTile label="Pending review" value={counts.pending} icon={<Clock className="h-4 w-4 text-amber-600" />} tone="border-amber-200 bg-amber-50/30" />
        <StatTile label="Drafts" value={counts.draft} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 md:px-8">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          <LayoutGrid className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          <button onClick={() => setGroup("term")} className={cn("rounded-md px-2.5 py-1 transition", group === "term" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>By Term</button>
          <button onClick={() => setGroup("subject")} className={cn("rounded-md px-2.5 py-1 transition", group === "subject" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>By Subject (Approved)</button>
        </div>
        {group === "term" && (
          <>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              <button onClick={() => setTerm("all")} className={cn("rounded-md px-2.5 py-1 transition", term === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>All Terms</button>
              {TERMS.map((t) => (
                <button key={t} onClick={() => setTerm(t)} className={cn("rounded-md px-2.5 py-1 transition", term === t ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              {(["all", "approved", "pending", "draft"] as const).map((v) => (
                <button key={v} onClick={() => setStatus(v)} className={cn("rounded-md px-2.5 py-1 capitalize transition", status === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{v}</button>
              ))}
            </div>
          </>
        )}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, subject, VC code, author…" className="h-9 pl-8" />
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {group === "term" ? (
          TERMS.map((t) => {
            const rows = groupedByTerm[t];
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
                    {rows.filter((r) => r.status === "approved").length} approved · {rows.filter((r) => r.status === "pending").length} pending · {rows.filter((r) => r.status === "draft").length} draft
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((e) => <LessonRow key={e.id} entry={e} />)}
                </div>
              </div>
            );
          })
        ) : (
          groupedBySubject.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">No approved lessons yet. Submit a draft from the planner and mark it approved to see it here.</Card>
          ) : groupedBySubject.map(([subject, rows]) => (
            <div key={subject}>
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-navy" />
                <h2 className="text-sm font-semibold tracking-tight">{subject}</h2>
                <Badge variant="outline" className="text-[10px]">{rows.length} approved</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((e) => <LessonRow key={e.id} entry={e} />)}
              </div>
            </div>
          ))
        )}
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

function LessonRow({ entry }: { entry: SavedLesson }) {
  const approved = entry.status === "approved";
  const pending = entry.status === "pending";
  return (
    <Card className="p-4 hover:border-primary/40 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <Badge
          className={cn(
            "text-[10px] capitalize",
            approved
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              : pending
                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                : "bg-muted text-muted-foreground hover:bg-muted",
          )}
        >
          {approved ? <CheckCircle2 className="mr-1 h-3 w-3" /> : pending ? <Clock className="mr-1 h-3 w-3" /> : <FileText className="mr-1 h-3 w-3" />}
          {entry.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug">{entry.title}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">{entry.subject}</Badge>
        <Badge variant="outline" className="text-[10px]">{entry.strand}</Badge>
        {entry.vcCode && <Badge variant="outline" className="font-mono text-[10px]">{entry.vcCode}</Badge>}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{entry.term} · {entry.duration}</span>
        <span>{entry.author}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
          <Link to="/lessons">Open in planner</Link>
        </Button>
        {pending && (
          <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-600/90 text-[11px]"
            onClick={() => setLessonStatus(entry.id, "approved")}>
            <CheckCircle2 className="h-3 w-3" />Approve
          </Button>
        )}
        {entry.status === "draft" && (
          <Button size="sm" variant="outline" className="h-7 text-[11px]"
            onClick={() => setLessonStatus(entry.id, "pending")}>
            <Clock className="h-3 w-3" />Submit
          </Button>
        )}
      </div>
    </Card>
  );
}
