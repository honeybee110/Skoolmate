import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Sparkles, Plus, Target, ChevronRight, Filter } from "lucide-react";
import { scopeSequence, type ScopeItem } from "@/lib/scope-sequence";
import { availableSemesters, students, type IepDomain, type Semester } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/scope-sequence")({
  head: () => ({ meta: [{ title: "Scope & Sequence · skoolmate" }] }),
  component: ScopeSequencePage,
});

const DOMAINS: (IepDomain | "all")[] = [
  "all", "English", "Maths", "Personal & Social", "Science", "History",
  "PE", "Visual Arts", "Music", "Drama", "Learn to Play",
];

function ScopeSequencePage() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState<IepDomain | "all">("all");
  const [semester, setSemester] = useState<Semester>(availableSemesters[0]);
  const [picked, setPicked] = useState<ScopeItem | null>(null);
  const [studentId, setStudentId] = useState<string>(students[0].id);

  const filtered = useMemo(() => scopeSequence.filter((s) => {
    if (domain !== "all" && s.domain !== domain) return false;
    if (q && !`${s.intention} ${s.vcLink} ${s.learningArea}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, domain]);

  const student = students.find((s) => s.id === studentId)!;

  function draftGoal() {
    if (!picked) return;
    toast.success(`Draft goal created for ${student.firstName} · ${picked.learningArea}`, {
      description: `${picked.vcLink} · ${semester.replace(" · 2026", "")} · sent to IEP inbox.`,
    });
  }

  return (
    <AppShell>
      <PageHeader
        title="Scope & Sequence Picker"
        subtitle="Browse the school Scope & Sequence and draft SMART IEP goals aligned to Victorian Curriculum 2.0."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/ieps"><Target className="h-4 w-4" /> Open IEPs</Link>
          </Button>
        }
      />

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          <Card className="flex flex-wrap items-center gap-2 p-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search descriptor, VC code, learning area…" className="pl-8 h-9" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              {DOMAINS.map((d) => (
                <button key={d} onClick={() => setDomain(d)} className={cn("rounded-md px-2 py-1 transition whitespace-nowrap", domain === d ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  {d === "all" ? "All" : d}
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">No descriptors match.</Card>
            )}
            {filtered.map((s) => (
              <Card
                key={s.id}
                onClick={() => setPicked(s)}
                className={cn(
                  "cursor-pointer p-4 transition hover:border-primary/40 hover:shadow-sm",
                  picked?.id === s.id && "border-primary ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{s.domain}</Badge>
                      <Badge variant="outline" className="text-[10px]">Level {s.level} · {s.learningArea}</Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">{s.vcLink}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm leading-snug">{s.intention}</p>
                    <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground md:grid-cols-3">
                      <span><b className="text-orange-700">Developing:</b> {s.descriptors.developing}</span>
                      <span><b className="text-amber-700">Working Towards:</b> {s.descriptors.workingTowards}</span>
                      <span><b className="text-emerald-700">Achieved:</b> {s.descriptors.achieved}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Draft goal panel */}
        <Card className="p-5 h-fit sticky top-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Draft an IEP goal</h3>
              <p className="text-[11px] text-muted-foreground">Semester-scoped, aligned to VC 2.0</p>
            </div>
          </div>

          {!picked && (
            <div className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Pick a Scope &amp; Sequence descriptor from the list to draft a SMART goal.
            </div>
          )}

          {picked && (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Semester</label>
                <div className="mt-1 flex gap-1 rounded-md border bg-background p-1">
                  {availableSemesters.map((s) => (
                    <button key={s} onClick={() => setSemester(s)} className={cn("flex-1 rounded px-2 py-1 text-xs transition", semester === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                      {s.replace(" · 2026", "")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
                <Badge variant="outline" className="text-[10px]">{picked.domain} · Level {picked.level}</Badge>
                <p className="text-sm font-medium leading-snug">{picked.intention}</p>
                <div className="text-[11px] text-muted-foreground">
                  <b>Suggested SMART:</b> {student.firstName} will {picked.intention.toLowerCase().replace(/\.$/, "")} in 4/5 opportunities across 3 sessions by end of {semester.replace(" · 2026", "")}.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-md border border-orange-200 bg-orange-50 p-2">
                  <div className="font-semibold text-orange-700 uppercase tracking-wider">Developing</div>
                  <p className="mt-1 text-orange-900/80">{picked.descriptors.developing}</p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                  <div className="font-semibold text-amber-700 uppercase tracking-wider">Working Towards</div>
                  <p className="mt-1 text-amber-900/80">{picked.descriptors.workingTowards}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2">
                  <div className="font-semibold text-emerald-700 uppercase tracking-wider">Achieved</div>
                  <p className="mt-1 text-emerald-900/80">{picked.descriptors.achieved}</p>
                </div>
              </div>

              <Button onClick={draftGoal} className="w-full bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Create draft goal
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
