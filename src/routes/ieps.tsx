import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Target, Sparkles, Search, Calendar, Save, ChevronDown, ChevronRight,
  BookOpen, CheckCircle2, Camera, MessageSquarePlus, ExternalLink,
  Plus, Filter, LayoutGrid, User, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  students, availableSemesters, currentSemester, classInfo,
  type Semester, type VcLevel,
} from "@/lib/mock-data";
import {
  CURRICULUM_SUBJECTS, LEVEL_TONE, visibleSubjects, strandsForSemester,
  type CurriculumRecord, type CurriculumSubject,
} from "@/lib/curriculum-db";
import { getEntrySkillsForGoal } from "@/lib/entry-skills";
import {
  useCurriculumStore, updateCell as storeUpdateCell, pickGoal as storePickGoal,
  cellKey, findRecordIn, recordsForIn, deriveFromChecks, CROSS_CHECK_LABELS,
  MAX_EVIDENCE_ATTACHMENTS,
  type IepCellState, type IepStatus, type CrossChecks,
  type EvidenceAttachment, type EvidenceSource,
} from "@/lib/curriculum-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useRef } from "react";
import { Laptop, Cloud, HardDrive, Trash2, Paperclip } from "lucide-react";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEP Builder · skoolmate" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    student: typeof s.student === "string" ? s.student : undefined,
    semester: typeof s.semester === "string" ? (s.semester as Semester | "all") : undefined,
  }),
  component: IepBuilderPage,
});

// ---------- Cell state ----------

type Status = IepStatus;
type CellState = IepCellState;

const STATUS_META: Record<Status, { label: string; tone: string; pct: number }> = {
  developing:        { label: "Developing",      tone: "bg-orange-100 text-orange-700 border-orange-200", pct: 10 },
  "working-towards": { label: "Working Towards", tone: "bg-amber-100 text-amber-700 border-amber-200",   pct: 50 },
  achieved:          { label: "Achieved",        tone: "bg-emerald-100 text-emerald-700 border-emerald-200", pct: 100 },
};

// ---------- Page ----------

function IepBuilderPage() {
  const search = Route.useSearch();
  const { cells, records } = useCurriculumStore();
  const [semester, setSemester] = useState<Semester>(
    (search.semester && search.semester !== "all" ? (search.semester as Semester) : currentSemester),
  );
  const [view, setView] = useState<"matrix" | "detail">("matrix");
  const [detailStudentId, setDetailStudentId] = useState<string>(search.student ?? students[0].id);
  const [query, setQuery] = useState("");
  const [editorKey, setEditorKey] = useState<string | null>(null);

  const subjects = visibleSubjects(semester);
  const filteredStudents = students.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (`${s.firstName} ${s.lastName}`).toLowerCase().includes(q);
  });

  const updateCell = (key: string, patch: Partial<CellState>) => storeUpdateCell(key, patch, "teacher");

  function pickGoal(key: string, curriculumId: string) {
    const rec = findRecordIn(records, curriculumId);
    storePickGoal(key, curriculumId, "teacher");
    if (rec) toast.success(`Goal set · Level ${rec.level} · ${rec.curriculumCode}`, {
      description: "Level and Entry Skills auto-filled from Scope & Sequence.",
    });
  }

  const stats = useMemo(() => {
    const scoped = Object.values(cells);
    return {
      total: scoped.length,
      achieved: scoped.filter((c) => c.status === "achieved").length,
      inProgress: scoped.filter((c) => c.status === "working-towards").length,
      avg: scoped.length
        ? Math.round(scoped.reduce((a, c) => a + Math.min(c.progress, 100), 0) / scoped.length)
        : 0,
    };
  }, [cells]);

  const editorCell = editorKey ? { key: editorKey, state: cells[editorKey] } : null;
  const editorParts = editorKey ? editorKey.split("::") : null;
  const editorStudent = editorParts ? students.find((s) => s.id === editorParts[0]) : null;

  return (
    <AppShell>
      <PageHeader
        title="IEP Builder"
        subtitle={`${classInfo.code} · ${classInfo.teacher} · Curriculum-aligned goal matrix (VC 2.0)`}
        actions={
          <>
            <div className="hidden items-center gap-1 rounded-lg border bg-card p-1 text-xs md:flex">
              <button
                onClick={() => setView("matrix")}
                className={cn("flex items-center gap-1 rounded-md px-2 py-1 transition",
                  view === "matrix" ? "bg-navy text-white" : "hover:bg-secondary")}
              ><LayoutGrid className="h-3.5 w-3.5" />Class Matrix</button>
              <button
                onClick={() => setView("detail")}
                className={cn("flex items-center gap-1 rounded-md px-2 py-1 transition",
                  view === "detail" ? "bg-navy text-white" : "hover:bg-secondary")}
              ><User className="h-3.5 w-3.5" />Student Detail</button>
            </div>
            <Button size="sm" variant="outline"><Save className="h-4 w-4" />Auto-saved</Button>
          </>
        }
      />

      {/* Stat strip with navy gradient */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-4 md:px-8">
        <StatTile label={`Goals set · ${semester.replace(" · 2026", "")}`} value={stats.total} icon={<Target className="h-4 w-4" />} accent />
        <StatTile label="Achieved / Exceeded" value={stats.achieved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatTile label="In progress" value={stats.inProgress} icon={<ClipboardList className="h-4 w-4 text-amber-600" />} />
        <StatTile label="Class avg progress" value={`${stats.avg}%`} icon={<Sparkles className="h-4 w-4 text-primary" />} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 md:px-8">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          <Calendar className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          {availableSemesters.map((s) => (
            <button key={s} onClick={() => setSemester(s)}
              className={cn("rounded-md px-2.5 py-1 transition whitespace-nowrap",
                semester === s ? "bg-navy text-white" : "hover:bg-secondary")}>
              {s.replace(" · 2026", "")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student…" className="pl-8 h-9" />
        </div>
        {view === "detail" && (
          <Select value={detailStudentId} onValueChange={setDetailStudentId}>
            <SelectTrigger className="h-9 w-[220px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.yearLevel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
          <Filter className="h-3 w-3" />
          {subjects.length} subjects visible · semester-aware
        </span>
      </div>

      <div className="px-4 py-6 md:px-8">
        {view === "matrix" ? (
          <ClassMatrix
            students={filteredStudents}
            subjects={subjects}
            cells={cells}
            semester={semester}
            onOpenCell={(k) => setEditorKey(k)}
          />
        ) : (
          <StudentDetail
            studentId={detailStudentId}
            subjects={subjects}
            semester={semester}
            cells={cells}
            onPickGoal={pickGoal}
            onUpdate={updateCell}
          />
        )}
      </div>

      {/* Editor sheet — inline cell edit */}
      <Sheet open={editorCell !== null} onOpenChange={(o) => !o && setEditorKey(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {editorCell && editorParts && editorStudent && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-foreground/80", editorStudent.avatarColor)}>
                    {editorStudent.initials}
                  </span>
                  {editorStudent.firstName} {editorStudent.lastName}
                </SheetTitle>
                <SheetDescription>
                  {editorParts[1]} · <span className="font-medium">{editorParts[2]}</span> · {semester.replace(" · 2026", "")}
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <CellEditor
                  cellKey={editorCell.key}
                  state={editorCell.state}
                  subject={editorParts[1]}
                  strand={editorParts[2]}
                  semester={semester}
                  onPickGoal={pickGoal}
                  onUpdate={updateCell}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

// ---------- Stat tile ----------

function StatTile({ label, value, icon, accent }: { label: string; value: React.ReactNode; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={cn("p-4 relative overflow-hidden", accent && "border-navy/20")}>
      {accent && (
        <div className="absolute inset-0 bg-gradient-to-br from-navy/8 via-transparent to-primary/5 pointer-events-none" />
      )}
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="relative mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

// ---------- Class Matrix ----------

function ClassMatrix({
  students, subjects, cells, semester, onOpenCell,
}: {
  students: typeof import("@/lib/mock-data").students;
  subjects: CurriculumSubject[];
  cells: Record<string, CellState>;
  semester: Semester;
  onOpenCell: (key: string) => void;
}) {
  // Flatten (subject, strand) into column list — semester-aware.
  const subjectStrands = subjects.map((sub) => ({ sub, strands: strandsForSemester(sub, semester) }));
  const columns = subjectStrands.flatMap(({ sub, strands }) =>
    strands.map((strand) => ({ subject: sub.label, strand, color: sub.color })),
  );

  return (
    <Card className="overflow-hidden border-navy/10">
      <div className="flex items-center justify-between bg-gradient-to-r from-navy to-navy-light px-4 py-2.5 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <LayoutGrid className="h-3.5 w-3.5" />Class IEP Matrix · {classInfo.code}
        </div>
        <span className="text-[10px] text-white/80">{students.length} students · {columns.length} strands · click any cell to edit</span>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted/60 text-left text-[10px] uppercase tracking-wide text-muted-foreground backdrop-blur">
              <th className="sticky left-0 z-30 bg-muted/80 px-3 py-2 font-semibold min-w-[180px]">Student</th>
              {subjectStrands.map(({ sub, strands }) => (
                <th key={sub.label} colSpan={strands.length}
                  className={cn("px-3 py-1.5 text-center font-semibold border-l border-border/60", sub.color)}>
                  {sub.label}
                </th>
              ))}
            </tr>
            <tr className="border-b bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground/80">
              <th className="sticky left-0 z-30 bg-muted/60 px-3 py-1.5"></th>
              {columns.map((c, i) => (
                <th key={i} className="px-2 py-1.5 min-w-[200px] font-medium border-l border-border/40">
                  {c.strand}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b align-top last:border-b-0 hover:bg-secondary/20">
                <td className="sticky left-0 z-10 bg-card px-3 py-2.5 border-r border-border/60">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-foreground/80", s.avatarColor)}>
                      {s.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{s.yearLevel}</p>
                    </div>
                  </div>
                </td>
                {columns.map((c, i) => {
                  const key = cellKey(s.id, c.subject, c.strand);
                  const cell = cells[key];
                  return (
                    <td key={i} className="p-1.5 border-l border-border/40">
                      <MatrixCell cell={cell} semester={semester} onClick={() => onOpenCell(key)} subject={c.subject} strand={c.strand} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MatrixCell({
  cell, semester, subject, strand, onClick,
}: {
  cell?: CellState;
  semester: Semester;
  subject: string;
  strand: string;
  onClick: () => void;
}) {
  void semester;
  void subject; void strand;
  if (!cell || !cell.curriculumId) {
    return (
      <button onClick={onClick}
        className="w-full rounded-md border border-dashed border-border/60 px-2 py-2 text-[11px] text-muted-foreground/70 hover:border-navy/40 hover:bg-navy/5 hover:text-navy transition">
        <Plus className="mr-0.5 inline h-3 w-3" />Set goal
      </button>
    );
  }
  const { records } = useCurriculumStore();
  const rec = findRecordIn(records, cell.curriculumId);
  if (!rec) {
    // Curriculum record was deleted by admin — surface an orphan banner so
    // the teacher can reassign instead of the cell silently disappearing.
    return (
      <button onClick={onClick}
        className="w-full rounded-md border border-dashed border-rose-300 bg-rose-50 px-2 py-2 text-left text-[11px] text-rose-800 transition hover:border-rose-400">
        <p className="font-medium">Goal removed from Scope & Sequence</p>
        <p className="mt-0.5 text-[10px] text-rose-700/80">Click to reassign a current goal.</p>
      </button>
    );
  }
  const level = cell.levelOverride ?? rec.level;
  const status = STATUS_META[cell.status];
  return (
    <button onClick={onClick}
      className="w-full rounded-md border border-border/60 bg-card px-2 py-1.5 text-left transition hover:border-navy/40 hover:shadow-sm">
      <p className="line-clamp-2 text-[11px] font-medium leading-snug">{rec.goal}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-to-r from-navy to-primary" style={{ width: `${Math.min(cell.progress, 100)}%` }} />
        </div>
        <span className="text-[9px] tabular-nums text-muted-foreground">{cell.progress}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className={cn("rounded border px-1 text-[9px] font-semibold", LEVEL_TONE[level])}>L{level}</span>
        <span className={cn("rounded border px-1 text-[9px]", status.tone)}>{status.label}</span>
      </div>
    </button>
  );
}

// ---------- Student Detail ----------

function StudentDetail({
  studentId, subjects, semester, cells, onPickGoal, onUpdate,
}: {
  studentId: string;
  subjects: CurriculumSubject[];
  semester: Semester;
  cells: Record<string, CellState>;
  onPickGoal: (key: string, curriculumId: string) => void;
  onUpdate: (key: string, patch: Partial<CellState>) => void;
}) {
  const student = students.find((s) => s.id === studentId)!;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(subjects.map((s) => [s.label, s.label === "English" || s.label === "Mathematics"])),
  );

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4 p-5 border-navy/20 bg-gradient-to-r from-navy/5 via-primary-soft/40 to-background">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl text-lg font-semibold text-foreground/80", student.avatarColor)}>
          {student.initials}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight">{student.firstName} {student.lastName}</h2>
          <p className="text-xs text-muted-foreground">{student.yearLevel} · {student.className} · {semester}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/students/${student.id}`}><ExternalLink className="h-4 w-4" />Student profile</a>
        </Button>
      </Card>

      {subjects.map((sub) => (
        <SubjectAccordion
          key={sub.label}
          subject={sub}
          open={expanded[sub.label] ?? false}
          onToggle={() => setExpanded((e) => ({ ...e, [sub.label]: !e[sub.label] }))}
          studentId={studentId}
          semester={semester}
          cells={cells}
          onPickGoal={onPickGoal}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

function SubjectAccordion({
  subject, open, onToggle, studentId, semester, cells, onPickGoal, onUpdate,
}: {
  subject: CurriculumSubject;
  open: boolean;
  onToggle: () => void;
  studentId: string;
  semester: Semester;
  cells: Record<string, CellState>;
  onPickGoal: (key: string, curriculumId: string) => void;
  onUpdate: (key: string, patch: Partial<CellState>) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b bg-gradient-to-r from-secondary/60 to-transparent px-4 py-2.5 text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <BookOpen className={cn("h-4 w-4", subject.color)} />
          <span className="text-sm font-semibold">{subject.label}</span>
          {subject.semesterLock && (
            <Badge variant="outline" className="text-[10px]">{subject.semesterLock} only</Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{strandsForSemester(subject, semester).length} strand{strandsForSemester(subject, semester).length === 1 ? "" : "s"}</span>
      </button>
      {open && (
        <div className="divide-y">
          {strandsForSemester(subject, semester).map((strand) => {
            const key = cellKey(studentId, subject.label, strand);
            return (
              <StrandRow key={strand}
                cellKey={key}
                state={cells[key]}
                subject={subject.label}
                strand={strand}
                semester={semester}
                onPickGoal={onPickGoal}
                onUpdate={onUpdate}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

function StrandRow({
  cellKey, state, subject, strand, semester, onPickGoal, onUpdate,
}: {
  cellKey: string;
  state?: CellState;
  subject: string;
  strand: string;
  semester: Semester;
  onPickGoal: (key: string, curriculumId: string) => void;
  onUpdate: (key: string, patch: Partial<CellState>) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-navy/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">{strand}</span>
      </div>
      <CellEditor
        cellKey={cellKey}
        state={state}
        subject={subject}
        strand={strand}
        semester={semester}
        onPickGoal={onPickGoal}
        onUpdate={onUpdate}
        compact
      />
    </div>
  );
}

// ---------- Cell Editor (shared for sheet + detail) ----------

function CellEditor({
  cellKey, state, subject, strand, semester, onPickGoal, onUpdate, compact,
}: {
  cellKey: string;
  state?: CellState;
  subject: string;
  strand: string;
  semester: Semester;
  onPickGoal: (key: string, curriculumId: string) => void;
  onUpdate: (key: string, patch: Partial<CellState>) => void;
  compact?: boolean;
}) {
  const { records } = useCurriculumStore();
  const options = recordsForIn(records, subject, strand, semester);
  const currentId = state?.curriculumId;
  const rec: CurriculumRecord | undefined = currentId ? findRecordIn(records, currentId) : undefined;
  const level = state?.levelOverride ?? rec?.level;
  const entrySkills = state?.entrySkillsOverride ?? rec?.entrySkills ?? "";
  const status: Status = state?.status ?? "developing";
  const progress = state?.progress ?? 0;
  const checks: CrossChecks = state?.crossChecks ?? [false, false, false];
  const s = STATUS_META[status];

  const toggleCheck = (i: number) => {
    const next: CrossChecks = [...checks] as CrossChecks;
    next[i] = !next[i];
    const derived = deriveFromChecks(next);
    onUpdate(cellKey, { crossChecks: next, status: derived.status, progress: derived.progress });
  };

  return (
    <div className={cn("space-y-3", !compact && "space-y-4")}>
      {/* Goal dropdown */}
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <div>
          <Label>Goal (Scope & Sequence)</Label>
          <Select value={currentId ?? ""} onValueChange={(v) => onPickGoal(cellKey, v)}>
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="▼ Select Goal from curriculum…" />
            </SelectTrigger>
            <SelectContent className="max-w-[520px]">
              {options.length === 0 && (
                <div className="p-3 text-xs text-muted-foreground">No S&S entries for this strand in {semester.replace(" · 2026", "")}.</div>
              )}
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded border px-1 text-[9px] font-bold", LEVEL_TONE[o.level])}>L{o.level}</span>
                    <span className="text-sm">{o.goal}</span>
                    <span className="ml-auto font-mono text-[9px] text-muted-foreground">{o.curriculumCode}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Level</Label>
          {rec ? (
            <Select value={level} onValueChange={(v) => onUpdate(cellKey, { levelOverride: v as VcLevel })}>
              <SelectTrigger className={cn("h-9 mt-1 w-24 font-bold", level && LEVEL_TONE[level])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["A","B","C","D","F","1","2"] as VcLevel[]).map((L) => (
                  <SelectItem key={L} value={L}>Level {L}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="mt-1 flex h-9 w-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">—</div>
          )}
        </div>
        <div>
          <Label>VC 2.0</Label>
          <div className="mt-1 flex h-9 items-center rounded-md border bg-muted/40 px-2 font-mono text-xs text-muted-foreground">
            {rec?.curriculumCode ?? "—"}
          </div>
        </div>
      </div>

      {/* Entry skills for the selected goal at the chosen level (Entry Skills 2025) */}
      {rec && (() => {
        const es = getEntrySkillsForGoal(subject, strand, level, rec.goal);
        if (!es) return null;
        return (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Entry Skills · Level {es.level}</Label>
              <Badge variant="outline" className="text-[10px]">{es.topic}</Badge>
            </div>
            <ol className="mt-2 space-y-1.5">
              {es.skills.map((sk, i) => (
                <li key={i} className="flex gap-2 text-xs leading-snug">
                  <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">{i + 1}</span>
                  <span>{sk}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="mt-2 text-[10px] font-semibold text-primary underline underline-offset-2"
              onClick={() => onUpdate(cellKey, { entrySkillsOverride: es.skills.map((sk, i) => `${i + 1}. ${sk}`).join("\n") })}
            >
              Copy into Entry Skills notes
            </button>
          </div>
        );
      })()}

      {/* Auto-filled entry skills */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Entry Skills <span className="ml-1 text-[10px] text-muted-foreground">(auto-filled · editable)</span></Label>
          {rec && <Badge variant="outline" className="text-[10px]">{rec.yearLevel}</Badge>}
        </div>
        <Textarea
          value={entrySkills}
          disabled={!rec}
          onChange={(e) => onUpdate(cellKey, { entrySkillsOverride: e.target.value })}
          className="mt-1 min-h-[70px] text-sm"
          placeholder="Select a Goal to auto-fill Entry Skills from the curriculum."
        />
      </div>


      {rec && (
        <div className="grid gap-2 md:grid-cols-2">
          <ReadOnlyBlock label="Achievement Standard" value={rec.achievementStandard} />
          <ReadOnlyBlock label="Content Description" value={rec.contentDescription} />
        </div>
      )}

      {/* Cross-Check steps drive Status + Progress — each step shows a curriculum-aligned descriptor. */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Cross-Check steps <span className="ml-1 text-[10px] text-muted-foreground normal-case">Status is auto-set from completed steps</span></Label>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", s.tone)}>{s.label}</span>
        </div>
        {(() => {
          const stepDescriptions: [string, string, string] = rec
            ? [
                rec.entrySkills || "Entry skill demonstrated with adult modelling and prompts.",
                rec.contentDescription || "Applies the skill in structured practice with reduced prompts.",
                rec.achievementStandard || "Demonstrates the achievement standard independently across contexts.",
              ]
            : [
                "Select a curriculum goal to load the Step 1 descriptor.",
                "Select a curriculum goal to load the Step 2 descriptor.",
                "Select a curriculum goal to load the Step 3 descriptor.",
              ];
          return (
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {CROSS_CHECK_LABELS.map((lbl, i) => {
                const done = checks[i];
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => toggleCheck(i)}
                    disabled={!rec}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      done
                        ? i === 2
                          ? "border-emerald-300 bg-emerald-50"
                          : i === 1
                            ? "border-amber-300 bg-amber-50"
                            : "border-orange-300 bg-orange-50"
                        : "border-dashed bg-muted/30 hover:border-navy/40",
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      done ? "bg-navy border-navy text-white" : "border-muted-foreground/40 bg-white",
                    )}>
                      {done && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider">Step {i + 1} · {lbl}</p>
                      <p className="mt-1 text-[11px] leading-snug text-foreground/80">{stepDescriptions[i]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}
        <div className="mt-2 flex items-center gap-2">
          <Progress value={Math.min(progress, 100)} className="h-1.5 flex-1" />
          <span className="w-12 text-right text-xs font-semibold tabular-nums text-muted-foreground">{progress}%</span>
        </div>
      </div>


      {/* Comment + evidence */}
      <div>
        <Label>Teacher comment</Label>
        <Textarea
          value={state?.comment ?? ""}
          onChange={(e) => onUpdate(cellKey, { comment: e.target.value })}
          className="mt-1 min-h-[60px] text-sm"
          placeholder="Add an observation, next step or teaching note…"
        />
      </div>

      <EvidenceBlock cellKey={cellKey} state={state} onUpdate={onUpdate} />

      {/* AI smart suggestion when nothing set */}
      {!rec && options.length > 0 && (
        <SmartSuggestion recommend={options[Math.min(1, options.length - 1)]} onAccept={(id) => onPickGoal(cellKey, id)} />
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{children}</span>;
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 rounded-md border bg-muted/30 p-2 text-xs leading-snug text-foreground/80">{value}</div>
    </div>
  );
}

function SmartSuggestion({ recommend, onAccept }: { recommend: CurriculumRecord; onAccept: (id: string) => void }) {
  return (
    <Card className="border-navy/30 bg-gradient-to-br from-navy/10 via-primary-soft/30 to-background p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-navy">AI Smart Goal Suggestion</p>
          <p className="mt-0.5 text-xs text-foreground/85">
            Based on previous semester progress and evidence trends, we recommend <span className="font-medium">"{recommend.goal}"</span> at <span className="font-medium">Level {recommend.level}</span>.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 bg-navy text-white text-[11px] hover:bg-navy-light" onClick={() => onAccept(recommend.id)}>
              <CheckCircle2 className="h-3 w-3" />Accept suggestion
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]">Choose another</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- Evidence block + link-evidence dialog ----------

const SOURCE_META: Record<EvidenceSource, { label: string; icon: React.ReactNode; accept?: string; hint: string }> = {
  "computer":       { label: "This computer",  icon: <Laptop className="h-4 w-4" />,   accept: "image/*,application/pdf,video/*", hint: "Choose photos, PDFs or short videos from your device." },
  "school-server":  { label: "School server",  icon: <HardDrive className="h-4 w-4" />, accept: "*",                              hint: "Browse shared teacher network drive (H:\\Shared\\Evidence)." },
  "google-drive":   { label: "Google Drive",   icon: <Cloud className="h-4 w-4" />,     hint: "Pick from your school Google Drive folder." },
  "onedrive":       { label: "OneDrive",       icon: <Cloud className="h-4 w-4" />,     hint: "Pick from your school Microsoft OneDrive." },
};

function EvidenceBlock({
  cellKey, state, onUpdate,
}: {
  cellKey: string;
  state?: IepCellState;
  onUpdate: (key: string, patch: Partial<IepCellState>) => void;
}) {
  const [open, setOpen] = useState(false);
  const attachments = state?.attachments ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          {attachments.length} of {MAX_EVIDENCE_ATTACHMENTS} evidence attachment{attachments.length === 1 ? "" : "s"} linked
        </span>
        <div className="flex gap-1">
          <Button
            size="sm" variant="outline" className="h-7 text-[11px]"
            onClick={() => setOpen(true)}
          >
            <Paperclip className="h-3 w-3" />Link evidence
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px]"
            onClick={() => toast("Comment thread opened")}>
            <MessageSquarePlus className="h-3 w-3" />Comment
          </Button>
        </div>
      </div>
      {attachments.length > 0 && (
        <ul className="mt-1 space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-[11px]">
              <span className="text-muted-foreground">{SOURCE_META[a.source].icon}</span>
              <span className="flex-1 truncate">{a.name}</span>
              <Badge variant="outline" className="text-[9px]">{SOURCE_META[a.source].label}</Badge>
              <button
                onClick={() => {
                  const next = attachments.filter((x) => x.id !== a.id);
                  onUpdate(cellKey, { attachments: next, evidenceCount: next.length });
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove attachment"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <LinkEvidenceDialog
        open={open}
        onOpenChange={setOpen}
        attachments={attachments}
        onSave={(next) => {
          onUpdate(cellKey, { attachments: next, evidenceCount: next.length });
          setOpen(false);
          toast.success(`${next.length} evidence attachment${next.length === 1 ? "" : "s"} linked.`);
        }}
      />
    </>
  );
}

function LinkEvidenceDialog({
  open, onOpenChange, attachments, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  attachments: EvidenceAttachment[];
  onSave: (next: EvidenceAttachment[]) => void;
}) {
  const [source, setSource] = useState<EvidenceSource>("computer");
  const [pending, setPending] = useState<EvidenceAttachment[]>(attachments);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const remaining = MAX_EVIDENCE_ATTACHMENTS - pending.length;

  function addFromFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, remaining);
    const next: EvidenceAttachment[] = [
      ...pending,
      ...list.map((f) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        source: "computer" as EvidenceSource,
        sizeKb: Math.round(f.size / 1024),
        addedAt: new Date().toISOString(),
      })),
    ];
    setPending(next.slice(0, MAX_EVIDENCE_ATTACHMENTS));
  }

  function addFromCloud() {
    if (remaining <= 0) return;
    // Simulated picker — in production this would open the provider's OAuth picker.
    const name = window.prompt(
      `Enter file name from ${SOURCE_META[source].label} (e.g. "Mia_counting_10frame.jpg")`,
      "",
    );
    if (!name) return;
    setPending((p) => [
      ...p,
      { id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, source, addedAt: new Date().toISOString() },
    ].slice(0, MAX_EVIDENCE_ATTACHMENTS));
  }

  const canAdd = pending.length < MAX_EVIDENCE_ATTACHMENTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link evidence</DialogTitle>
          <DialogDescription>
            Attach up to <strong>{MAX_EVIDENCE_ATTACHMENTS}</strong> pieces of evidence (photos, PDFs, videos) from your computer,
            school Google Drive / OneDrive, or the school network server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(SOURCE_META) as EvidenceSource[]).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition",
                source === s ? "border-primary bg-primary-soft/40 text-primary" : "hover:border-primary/40",
              )}
            >
              {SOURCE_META[s].icon}
              <span className="font-medium">{SOURCE_META[s].label}</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">{SOURCE_META[source].hint}</p>

        <div className="rounded-lg border border-dashed p-4">
          {source === "computer" ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={SOURCE_META.computer.accept}
                multiple
                className="hidden"
                onChange={(e) => addFromFiles(e.target.files)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!canAdd}
                onClick={() => fileRef.current?.click()}
                className="w-full"
              >
                <Laptop className="h-4 w-4" />Choose files from computer
              </Button>
            </>
          ) : (
            <Button
              size="sm" variant="outline" disabled={!canAdd}
              onClick={addFromCloud} className="w-full"
            >
              {SOURCE_META[source].icon}Pick from {SOURCE_META[source].label}
            </Button>
          )}
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {canAdd ? `${remaining} slot${remaining === 1 ? "" : "s"} remaining` : "Maximum reached — remove one to add another."}
          </p>
        </div>

        {pending.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {pending.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs">
                {SOURCE_META[a.source].icon}
                <span className="flex-1 truncate">{a.name}</span>
                <Badge variant="outline" className="text-[9px]">{SOURCE_META[a.source].label}</Badge>
                <button
                  onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(pending)} disabled={pending.length === 0 && attachments.length === 0}>
            Save {pending.length} attachment{pending.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
