import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Folder, FolderOpen, Search, CheckCircle2, ArrowLeft, FileText, BookOpen, ChevronRight, Sparkles, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessonStore, type LessonTerm, type SavedLesson } from "@/lib/lesson-store";

export const Route = createFileRoute("/lessons/bank")({
  head: () => ({ meta: [{ title: "Lesson Bank · skoolmate" }] }),
  component: LessonBankPage,
});

const TERMS: LessonTerm[] = ["Term 1", "Term 2", "Term 3", "Term 4"];
const TERM_COLORS: Record<LessonTerm, string> = {
  "Term 1": "from-primary/15 to-primary/5 border-primary/20 text-primary",
  "Term 2": "from-amber-100 to-amber-50 border-amber-200 text-amber-700",
  "Term 3": "from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700",
  "Term 4": "from-navy/15 to-navy/5 border-navy/20 text-navy",
};

function LessonBankPage() {
  const { lessons } = useLessonStore();
  const [openTerm, setOpenTerm] = useState<LessonTerm | null>("Term 1");
  const [preview, setPreview] = useState<SavedLesson | null>(null);
  const [q, setQ] = useState("");

  const approved = useMemo(() => lessons.filter((l) => l.status === "approved"), [lessons]);

  const filteredApproved = useMemo(() => {
    if (!q.trim()) return approved;
    const needle = q.toLowerCase();
    return approved.filter((e) =>
      `${e.title} ${e.subject} ${e.strand} ${e.vcCode ?? ""} ${e.author}`.toLowerCase().includes(needle),
    );
  }, [approved, q]);

  const byTerm = useMemo(() => {
    const map: Record<LessonTerm, SavedLesson[]> = { "Term 1": [], "Term 2": [], "Term 3": [], "Term 4": [] };
    for (const e of filteredApproved) map[e.term].push(e);
    return map;
  }, [filteredApproved]);

  return (
    <AppShell>
      <PageHeader
        title="Lesson Bank"
        subtitle="Approved lessons only · organised in Term 1 – Term 4 folders · separate from the Lesson Planner"
        actions={
          <>
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search approved lessons…" className="h-9 pl-8" />
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/lessons"><ArrowLeft className="h-4 w-4" />Back to Planner</Link>
            </Button>
          </>
        }
      />

      <div className="px-4 py-6 md:px-8">
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary-soft/40 via-background to-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bank vs Planner</p>
              <p className="text-xs text-muted-foreground">
                The <strong>Lesson Planner</strong> is where teachers draft with AI, edit, save, and submit for approval.
                The <strong>Lesson Bank</strong> only holds <strong>approved</strong> lessons, filed into Term 1 – 4 folders,
                grouped by subject inside each folder — ready to reuse.
              </p>
            </div>
          </div>
        </Card>

        {/* Folder grid */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TERMS.map((t) => (
            <TermFolderCard
              key={t}
              term={t}
              count={byTerm[t].length}
              open={openTerm === t}
              onToggle={() => setOpenTerm((cur) => (cur === t ? null : t))}
            />
          ))}
        </div>

        {/* Open folder contents — approved lessons grouped by subject */}
        {openTerm && (
          <TermFolderContents
            term={openTerm}
            rows={byTerm[openTerm]}
            onOpen={(l) => setPreview(l)}
          />
        )}
      </div>

      <LessonPreviewDialog lesson={preview} onClose={() => setPreview(null)} />
    </AppShell>
  );
}

function TermFolderCard({ term, count, open, onToggle }: { term: LessonTerm; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-gradient-to-br p-4 text-left transition hover:shadow-md",
        TERM_COLORS[term],
        open && "ring-2 ring-offset-2 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-3">
        {open ? <FolderOpen className="h-6 w-6" /> : <Folder className="h-6 w-6" />}
        <div>
          <p className="text-sm font-semibold">{term}</p>
          <p className="text-[11px] opacity-80">{count} approved lesson{count === 1 ? "" : "s"}</p>
        </div>
      </div>
      <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
    </button>
  );
}

function TermFolderContents({ term, rows, onOpen }: { term: LessonTerm; rows: SavedLesson[]; onOpen: (l: SavedLesson) => void }) {
  const bySubject = useMemo(() => {
    const map = new Map<string, SavedLesson[]>();
    for (const e of rows) {
      if (!map.has(e.subject)) map.set(e.subject, []);
      map.get(e.subject)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <Card className="mt-4 p-5">
      <div className="mb-4 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">{term} · approved</h2>
        <Badge variant="outline" className="text-[10px]">{rows.length} total</Badge>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No approved lessons in {term} yet. Draft one in the Planner and mark it approved to file it here.
        </div>
      ) : (
        <div className="space-y-5">
          {bySubject.map(([subject, list]) => (
            <div key={subject}>
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-navy" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subject}</h3>
                <Badge variant="outline" className="text-[10px]">{list.length}</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {list.map((l) => <LessonTile key={l.id} lesson={l} onOpen={() => onOpen(l)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LessonTile({ lesson, onOpen }: { lesson: SavedLesson; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group rounded-lg border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <FileText className="h-3.5 w-3.5" />
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] hover:bg-emerald-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />Approved
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{lesson.title}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">{lesson.strand}</Badge>
        {lesson.vcCode && <Badge variant="outline" className="font-mono text-[10px]">{lesson.vcCode}</Badge>}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{lesson.week ?? "—"} · {lesson.duration}</span>
        <span className="text-primary opacity-0 group-hover:opacity-100 transition">Open →</span>
      </div>
    </button>
  );
}

function LessonPreviewDialog({ lesson, onClose }: { lesson: SavedLesson | null; onClose: () => void }) {
  return (
    <Dialog open={lesson !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {lesson && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>
                {lesson.vcCode && <Badge variant="outline" className="font-mono text-[10px]">{lesson.vcCode}</Badge>}
              </div>
              <DialogTitle className="mt-2">{lesson.title}</DialogTitle>
              <DialogDescription>
                {lesson.subject} · {lesson.strand} · {lesson.term}{lesson.week ? ` · ${lesson.week}` : ""} · {lesson.duration}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <PreviewField label="Learning Intention" value={lesson.notes.learningIntention} />
              <PreviewField label="Success Criteria" value={lesson.notes.successCriteria} />
              <div className="grid gap-3 md:grid-cols-2">
                <PreviewField label="Hook" value={lesson.notes.hook} />
                <PreviewField label="I do" value={lesson.notes.iDo} />
                <PreviewField label="We do" value={lesson.notes.weDo} />
                <PreviewField label="You do" value={lesson.notes.youDo} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              <Button asChild size="sm">
                <Link to="/lessons"><ExternalLink className="h-4 w-4" />Open in Planner</Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line rounded-md border bg-muted/30 p-2 text-xs leading-relaxed">{value || "—"}</p>
    </div>
  );
}
