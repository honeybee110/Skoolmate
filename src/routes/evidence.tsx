import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, Image as ImageIcon, Video, FileText, Mic, FileEdit, Search, Link2, Check, X, Filter } from "lucide-react";
import { evidenceItems, iepGoals, students, type EvidenceItem, type EvidenceMedium, type Semester } from "@/lib/mock-data";
import { useActiveSemester, type SemesterScope } from "@/lib/semester-context";
import { scopedSearch, type ScopedSearch } from "@/lib/scope";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Evidence Hub · skoolmate" }] }),
  validateSearch: (s: Record<string, unknown>): ScopedSearch => ({
    student: typeof s.student === "string" ? s.student : undefined,
    semester: typeof s.semester === "string" ? (s.semester as Semester | "all") : undefined,
    goal: typeof s.goal === "string" ? s.goal : undefined,
  }),

  component: EvidencePage,
});


const mediumMeta: Record<EvidenceMedium, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  photo: { icon: ImageIcon, label: "Photo", tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  video: { icon: Video, label: "Video", tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  "work-sample": { icon: FileText, label: "Work sample", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  anecdotal: { icon: FileEdit, label: "Anecdotal", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  audio: { icon: Mic, label: "Audio", tone: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300" },
};

function EvidencePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { activeSemester, matches } = useActiveSemester();
  const [items, setItems] = useState<EvidenceItem[]>(evidenceItems);
  const [query, setQuery] = useState("");
  const [medium, setMedium] = useState<EvidenceMedium | "all">("all");

  const studentScope = search.student;
  const semesterScope = search.semester;
  const goalScope = search.goal;
  const scopedStudent = studentScope ? students.find((s) => s.id === studentScope) : undefined;

  const filtered = useMemo(() => items.filter((e) => {
    const q = !query || e.caption.toLowerCase().includes(query.toLowerCase()) || e.studentName.toLowerCase().includes(query.toLowerCase());
    const m = medium === "all" || e.medium === medium;
    const stu = !studentScope || e.studentId === studentScope;
    const sem = !semesterScope || semesterScope === "all" || e.semester === semesterScope
      ? (semesterScope ? true : matches(e.semester))
      : false;
    const goal = !goalScope || e.goalIds.includes(goalScope);
    return q && m && stu && sem && goal;
  }), [items, query, medium, studentScope, semesterScope, goalScope, matches]);


  const untagged = items.filter((e) => !e.aiTagged && e.aiSuggestedGoal);

  function acceptSuggestion(id: string) {
    setItems((prev) => prev.map((e) => {
      if (e.id !== id || !e.aiSuggestedGoal) return e;
      return { ...e, aiTagged: true, goalIds: [...e.goalIds, e.aiSuggestedGoal], aiSuggestedGoal: undefined };
    }));
    toast.success("Evidence linked to IEP goal.");
  }
  function rejectSuggestion(id: string) {
    setItems((prev) => prev.map((e) => e.id === id ? { ...e, aiSuggestedGoal: undefined, aiTagged: true } : e));
  }

  const stats = useMemo(() => ({
    total: items.length,
    aiLinked: items.filter((e) => e.aiTagged).length,
    untagged: untagged.length,
    week: items.length,
  }), [items, untagged.length]);

  return (
    <AppShell>
      <PageHeader
        title="Evidence Hub"
        subtitle="Photos, videos, work samples — auto-linked to IEP goals by AI"
        actions={
          <>
            <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" />Re-run AI tagging</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" />Capture evidence</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatCard label="Total evidence" value={stats.total} />
        <StatCard label="AI auto-linked" value={stats.aiLinked} tone="primary" />
        <StatCard label="Awaiting review" value={stats.untagged} tone="accent" />
        <StatCard label="Captured this week" value={stats.week} />
      </div>

      {/* AI review queue */}
      {untagged.length > 0 && (
        <div className="px-4 pt-6 md:px-8">
          <Card className="border-primary/30 bg-gradient-to-br from-primary-soft/30 via-background to-background p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h3 className="text-sm font-semibold">AI found {untagged.length} possible goal {untagged.length === 1 ? "match" : "matches"}</h3>
                <p className="text-xs text-muted-foreground">Confirm to auto-link evidence to the student's IEP goal.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {untagged.map((e) => {
                const suggested = iepGoals.find((g) => g.id === e.aiSuggestedGoal);
                return (
                  <div key={e.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <Thumb item={e} className="h-14 w-14 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{e.studentName} · <span className="text-muted-foreground">{e.capturedAt}</span></p>
                        <p className="mt-0.5 text-sm leading-snug line-clamp-2">{e.caption}</p>
                        {suggested && (
                          <div className="mt-2 rounded-lg bg-primary-soft/40 px-2.5 py-1.5 text-xs">
                            <span className="font-medium text-primary">Suggested goal · </span>
                            <span className="text-foreground/85">{suggested.smart}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => rejectSuggestion(e.id)}><X className="h-3.5 w-3.5" />Dismiss</Button>
                      <Button size="sm" className="h-7 bg-primary text-xs hover:bg-primary/90" onClick={() => acceptSuggestion(e.id)}><Check className="h-3.5 w-3.5" />Link to goal</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {(scopedStudent || semesterScope || goalScope) && (
        <div className="px-4 pt-6 md:px-8">
          <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary-soft/30 px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Drilled in from report ·</span>
              {scopedStudent && <Badge variant="outline" className="font-medium">{scopedStudent.firstName} {scopedStudent.lastName}</Badge>}
              {semesterScope && semesterScope !== "all" && <Badge variant="outline">{semesterScope}</Badge>}
              {goalScope && <Badge variant="outline">Goal · {goalScope}</Badge>}
              <span className="text-muted-foreground">{filtered.length} item{filtered.length === 1 ? "" : "s"}</span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate({ search: {} })}>
              <X className="h-3 w-3" /> Clear
            </Button>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4 pt-6 sm:flex-row sm:items-center md:px-8">

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search captions, students…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          {(["all", "photo", "video", "work-sample", "anecdotal", "audio"] as const).map((m) => (
            <button key={m} onClick={() => setMedium(m)} className={cn("rounded-md px-2.5 py-1 capitalize transition", medium === m ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
              {m === "all" ? "All" : mediumMeta[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 px-4 py-6 sm:grid-cols-2 md:grid-cols-3 md:px-8 xl:grid-cols-4">
        {filtered.map((e) => <EvidenceCard key={e.id} item={e} activeSemester={activeSemester} />)}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "primary" | "accent" }) {
  return (
    <Card className={cn("p-4", tone === "primary" && "border-primary/30 bg-primary/5", tone === "accent" && "border-accent/40 bg-accent/5")}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function Thumb({ item, className }: { item: EvidenceItem; className?: string }) {
  const Icon = mediumMeta[item.medium].icon;
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, oklch(0.85 0.08 ${item.thumbHue}) 0%, oklch(0.92 0.05 ${item.thumbHue + 30}) 100%)` }}
    >
      <Icon className="h-5 w-5 text-foreground/60" />
      <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/85 text-[10px] font-semibold text-foreground/80">{item.studentInitials}</div>
    </div>
  );
}

function EvidenceCard({ item, activeSemester }: { item: EvidenceItem; activeSemester: SemesterScope }) {
  const goals = iepGoals.filter((g) => item.goalIds.includes(g.id));
  const primaryGoal = goals[0];
  const openInContext = primaryGoal
    ? { to: "/ieps" as const, search: scopedSearch(activeSemester, { student: item.studentId, semester: item.semester as Semester, goal: primaryGoal.id }) }
    : { to: "/evidence" as const, search: scopedSearch(activeSemester, { student: item.studentId, semester: item.semester as Semester }) };
  return (
    <Link {...openInContext} className="group block">
      <Card className="overflow-hidden transition hover:shadow-md hover:border-primary/30">
        <Thumb item={item} className="aspect-[4/3] w-full" />
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className={cn("font-normal text-[10px]", mediumMeta[item.medium].tone)}>{mediumMeta[item.medium].label}</Badge>
            {item.aiTagged && <Badge className="bg-primary/10 text-primary text-[10px] hover:bg-primary/10 font-normal"><Sparkles className="h-2.5 w-2.5" />AI-linked</Badge>}
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{item.caption}</p>
          <p className="text-xs text-muted-foreground">{item.studentName} · {item.capturedAt} · {item.capturedBy}</p>
          {goals.length > 0 ? (
            <div className="flex flex-wrap gap-1 border-t pt-2">
              {goals.map((g) => (
                <Badge key={g.id} variant="secondary" className="text-[10px] font-normal"><Link2 className="h-2.5 w-2.5" />{g.domain}</Badge>
              ))}
            </div>
          ) : (
            <p className="border-t pt-2 text-xs italic text-muted-foreground">Not yet linked to a goal</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
