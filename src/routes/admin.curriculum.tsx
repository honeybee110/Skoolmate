import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookOpen, Plus, Pencil, Trash2, Search, RotateCcw, Save, ShieldCheck,
  Sparkles, ExternalLink, Filter, ClipboardList, History, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CURRICULUM_SUBJECTS, LEVEL_TONE, type CurriculumRecord, type CurriculumSemester,
} from "@/lib/curriculum-db";
import {
  useCurriculumStore, upsertRecord, deleteRecord, resetCurriculumToDefaults,
  adminOverrideCell, findRecordIn, type IepStatus,
} from "@/lib/curriculum-store";
import { students } from "@/lib/mock-data";
import type { VcLevel } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/curriculum")({
  head: () => ({ meta: [{ title: "Curriculum & Scope and Sequence · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership"]}>
      <AdminCurriculumPage />
    </RoleGate>
  ),
});

const LEVELS: VcLevel[] = ["A", "B", "C", "D", "F", "1", "2"];
const SEMESTERS: CurriculumSemester[] = ["Both", "Semester 1", "Semester 2"];

const STATUS_LABEL: Record<IepStatus, string> = {
  "not-started": "Not started",
  "working-towards": "Working Towards",
  "nearly-there": "Nearly There",
  achieved: "Achieved",
  exceeded: "Exceeded",
};

function AdminCurriculumPage() {
  const { records, cells, audit } = useCurriculumStore();

  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [strandFilter, setStrandFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<CurriculumSemester | "all">("all");
  const [levelFilter, setLevelFilter] = useState<VcLevel | "all">("all");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<CurriculumRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const availableStrands = useMemo(() => {
    const set = new Set<string>();
    records
      .filter((r) => subjectFilter === "all" || r.subject === subjectFilter)
      .forEach((r) => set.add(r.strand));
    return Array.from(set).sort();
  }, [records, subjectFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (subjectFilter !== "all" && r.subject !== subjectFilter) return false;
      if (strandFilter !== "all" && r.strand !== strandFilter) return false;
      if (semesterFilter !== "all" && r.semester !== semesterFilter) return false;
      if (levelFilter !== "all" && r.level !== levelFilter) return false;
      if (!q) return true;
      return (
        r.goal.toLowerCase().includes(q) ||
        r.curriculumCode.toLowerCase().includes(q) ||
        r.entrySkills.toLowerCase().includes(q)
      );
    });
  }, [records, subjectFilter, strandFilter, semesterFilter, levelFilter, query]);

  const stats = useMemo(() => {
    const total = records.length;
    const bySubject: Record<string, number> = {};
    for (const r of records) bySubject[r.subject] = (bySubject[r.subject] ?? 0) + 1;
    const totalCells = Object.values(cells).filter((c) => c.curriculumId).length;
    const orphaned = Object.values(cells).filter(
      (c) => c.curriculumId && !records.find((r) => r.id === c.curriculumId),
    ).length;
    return { total, bySubject, totalCells, orphaned };
  }, [records, cells]);

  // Recent teacher edits (student cells) for the admin oversight card.
  const recentEdits = useMemo(() => {
    return Object.entries(cells)
      .filter(([, c]) => c.updatedAt && c.curriculumId)
      .sort((a, b) => (b[1].updatedAt ?? "").localeCompare(a[1].updatedAt ?? ""))
      .slice(0, 8)
      .map(([key, cell]) => {
        const [studentId, subject, strand] = key.split("::");
        const student = students.find((s) => s.id === studentId);
        const rec = cell.curriculumId ? findRecordIn(records, cell.curriculumId) : undefined;
        return { key, cell, student, subject, strand, rec };
      });
  }, [cells, records]);

  const overrideEvents = audit.slice(0, 8);

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Curriculum & Scope and Sequence"
        subtitle="Master Victorian Curriculum 2.0 database — powers every teacher's IEP Builder dropdowns."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ieps"><ExternalLink className="h-4 w-4" />Open Teacher IEP Builder</Link>
            </Button>
            <Button size="sm" className="bg-navy hover:bg-navy-light" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />Add Curriculum Entry
            </Button>
          </>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* Stat strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Curriculum records" value={stats.total} icon={<BookOpen className="h-4 w-4" />} accent />
          <StatTile label="Subjects covered" value={Object.keys(stats.bySubject).length} icon={<Target className="h-4 w-4 text-primary" />} />
          <StatTile label="Live IEP cells" value={stats.totalCells} icon={<ClipboardList className="h-4 w-4 text-emerald-600" />} />
          <StatTile
            label="Orphaned links"
            value={stats.orphaned}
            icon={<Sparkles className="h-4 w-4 text-amber-600" />}
            hint={stats.orphaned > 0 ? "Cells referencing deleted records" : undefined}
          />
        </div>

        {/* Filters */}
        <Card className="p-4 border-navy/10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search goal, code or entry skill…"
                className="pl-8 h-9"
              />
            </div>
            <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setStrandFilter("all"); }}>
              <SelectTrigger className="h-9 w-[190px] text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {CURRICULUM_SUBJECTS.map((s) => (
                  <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={strandFilter} onValueChange={setStrandFilter}>
              <SelectTrigger className="h-9 w-[190px] text-xs"><SelectValue placeholder="Strand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All strands</SelectItem>
                {availableStrands.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semesterFilter} onValueChange={(v) => setSemesterFilter(v as CurriculumSemester | "all")}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as VcLevel | "all")}>
              <SelectTrigger className="h-9 w-[110px] text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {LEVELS.map((L) => <SelectItem key={L} value={L}>Level {L}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <Filter className="h-3 w-3" />
              {filtered.length} of {records.length} records
            </span>
            <ResetButton />
          </div>
        </Card>

        {/* Records table */}
        <Card className="overflow-hidden border-navy/10">
          <div className="flex items-center justify-between bg-gradient-to-r from-navy to-navy-light px-4 py-2.5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="h-3.5 w-3.5" />Scope & Sequence master list
            </div>
            <span className="text-[10px] text-white/80">Edits flow through to every teacher instantly</span>
          </div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-semibold w-[110px]">VC 2.0 Code</th>
                  <th className="px-3 py-2 font-semibold">Goal</th>
                  <th className="px-3 py-2 font-semibold w-[130px]">Subject</th>
                  <th className="px-3 py-2 font-semibold w-[160px]">Strand</th>
                  <th className="px-3 py-2 font-semibold w-[70px] text-center">Level</th>
                  <th className="px-3 py-2 font-semibold w-[110px]">Semester</th>
                  <th className="px-3 py-2 font-semibold w-[70px]">Year</th>
                  <th className="px-3 py-2 font-semibold w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No curriculum entries match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-secondary/30 align-top">
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{r.curriculumCode}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium leading-snug">{r.goal}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{r.entrySkills}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.subject}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.strand}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", LEVEL_TONE[r.level])}>L{r.level}</span>
                    </td>
                    <td className="px-3 py-2 text-[11px]"><Badge variant="outline">{r.semester}</Badge></td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">{r.yearLevel}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DeleteButton id={r.id} label={r.goal} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent teacher edits + admin overrides */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-navy" />
              <h3 className="font-semibold">Recent teacher IEP edits</h3>
              <Badge variant="outline" className="ml-auto text-[10px]">live</Badge>
            </div>
            {recentEdits.length === 0 && (
              <p className="text-xs text-muted-foreground">No teacher edits yet.</p>
            )}
            <ul className="space-y-2">
              {recentEdits.map(({ key, cell, student, subject, strand, rec }) => (
                <li key={key} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={cn("mt-0.5 h-8 w-8 shrink-0 rounded-lg text-[10px] font-semibold flex items-center justify-center text-foreground/80",
                    student?.avatarColor ?? "bg-muted")}>
                    {student?.initials ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {student ? `${student.firstName} ${student.lastName}` : "Unknown student"}
                      <span className="text-muted-foreground font-normal"> · {subject} · {strand}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{rec?.goal ?? "—"}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px]">{STATUS_LABEL[cell.status]}</Badge>
                      <span className="text-[9px] tabular-nums text-muted-foreground">{cell.progress}%</span>
                      {cell.updatedAt && (
                        <span className="text-[9px] text-muted-foreground">· {relativeTime(cell.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  <OverrideButton cellKey={key} currentStatus={cell.status} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-navy" />
              <h3 className="font-semibold">Curriculum & override audit</h3>
              <Button asChild size="sm" variant="ghost" className="ml-auto h-7 text-[11px]">
                <Link to="/admin/audit">Full log <ExternalLink className="h-3 w-3" /></Link>
              </Button>
            </div>
            {overrideEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">No admin actions yet — edits will appear here.</p>
            )}
            <ul className="space-y-2">
              {overrideEvents.map((e) => (
                <li key={e.id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={cn("h-3.5 w-3.5", e.actor === "admin" ? "text-navy" : "text-primary")} />
                    <span className="font-semibold capitalize">{e.actor}</span>
                    <Badge variant="outline" className="text-[9px]">{e.kind.replace(/-/g, " ")}</Badge>
                    <span className="ml-auto text-[10px] text-muted-foreground">{relativeTime(e.at)}</span>
                  </div>
                  <p className="mt-1 text-foreground/85">{e.detail}</p>
                  {e.reason && <p className="mt-1 text-[11px] italic text-muted-foreground">Reason: {e.reason}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Editor sheet */}
      <RecordEditor
        open={editing !== null || creating}
        onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}
        record={editing}
      />
    </AppShell>
  );
}

// ---------- Stat tile ----------

function StatTile({
  label, value, icon, accent, hint,
}: {
  label: string; value: React.ReactNode; icon: React.ReactNode; accent?: boolean; hint?: string;
}) {
  return (
    <Card className={cn("p-4 relative overflow-hidden", accent && "border-navy/20")}>
      {accent && <div className="absolute inset-0 bg-gradient-to-br from-navy/10 via-transparent to-primary/5 pointer-events-none" />}
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="relative mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="relative mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </Card>
  );
}

// ---------- Reset ----------

function ResetButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />Reset defaults
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the Curriculum database?</AlertDialogTitle>
          <AlertDialogDescription>
            This restores the seeded Victorian Curriculum 2.0 scope and sequence and clears all
            saved IEP cells across every teacher. Use only during setup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { resetCurriculumToDefaults(); toast.success("Curriculum reset to defaults."); }}>
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- Delete ----------

function DeleteButton({ id, label }: { id: string; label: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete curriculum entry?</AlertDialogTitle>
          <AlertDialogDescription>
            "{label}" will be removed from every teacher's IEP dropdown. Existing cell links to
            this entry will become orphaned until reassigned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { deleteRecord(id); toast.success("Curriculum entry deleted."); }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- Record editor sheet ----------

function RecordEditor({
  open, onOpenChange, record,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: CurriculumRecord | null;
}) {
  const isNew = !record;
  const [form, setForm] = useState<CurriculumRecord>(() => defaultForm(record));

  // Re-seed form when record changes.
  useMemo(() => setForm(defaultForm(record)), [record]);

  const subjectMeta = CURRICULUM_SUBJECTS.find((s) => s.label === form.subject);

  function save() {
    if (!form.goal.trim() || !form.subject || !form.strand || !form.curriculumCode.trim()) {
      toast.error("Goal, Subject, Strand and VC 2.0 code are required.");
      return;
    }
    const finalForm: CurriculumRecord = {
      ...form,
      id: form.id || slugId(form),
    };
    upsertRecord(finalForm);
    toast.success(isNew ? "Curriculum entry added." : "Curriculum entry updated.");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-navy" />
            {isNew ? "Add Curriculum Entry" : "Edit Curriculum Entry"}
          </SheetTitle>
          <SheetDescription>
            Scope & Sequence entry — becomes selectable in every teacher's IEP Builder dropdown for
            the matching Subject and Strand.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v, strand: CURRICULUM_SUBJECTS.find(s => s.label === v)?.strands[0] ?? "" })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRICULUM_SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Strand">
              <Select value={form.strand} onValueChange={(v) => setForm({ ...form, strand: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(subjectMeta?.strands ?? []).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Goal (short — appears in teacher dropdown)">
            <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="e.g. Name, represent and order numbers 0–20" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-[110px_1fr_140px]">
            <Field label="Level">
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as VcLevel })}>
                <SelectTrigger className={cn("h-9 font-bold", LEVEL_TONE[form.level])}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((L) => <SelectItem key={L} value={L}>Level {L}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="VC 2.0 Curriculum Code">
              <Input value={form.curriculumCode}
                onChange={(e) => setForm({ ...form, curriculumCode: e.target.value.toUpperCase() })}
                placeholder="e.g. VC2MFN01" className="font-mono uppercase" />
            </Field>
            <Field label="Year Level">
              <Input value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}
                placeholder="F–2" />
            </Field>
          </div>

          <Field label="Semester">
            <div className="flex gap-1 rounded-lg border bg-card p-1 w-max">
              {SEMESTERS.map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, semester: s })}
                  className={cn("rounded-md px-3 py-1 text-xs transition",
                    form.semester === s ? "bg-navy text-white" : "hover:bg-secondary")}>
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Entry Skills (auto-fills the teacher's editor)">
            <Textarea value={form.entrySkills} onChange={(e) => setForm({ ...form, entrySkills: e.target.value })}
              className="min-h-[70px]" placeholder="What the student can already do that qualifies them for this goal." />
          </Field>

          <Field label="Achievement Standard">
            <Textarea value={form.achievementStandard} onChange={(e) => setForm({ ...form, achievementStandard: e.target.value })}
              className="min-h-[60px]" />
          </Field>

          <Field label="Content Description">
            <Textarea value={form.contentDescription} onChange={(e) => setForm({ ...form, contentDescription: e.target.value })}
              className="min-h-[60px]" />
          </Field>
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-navy hover:bg-navy-light" onClick={save}>
            <Save className="h-4 w-4" />{isNew ? "Publish to teachers" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function defaultForm(r: CurriculumRecord | null): CurriculumRecord {
  if (r) return { ...r };
  const first = CURRICULUM_SUBJECTS[0];
  return {
    id: "",
    subject: first.label,
    strand: first.strands[0],
    semester: "Both",
    goal: "",
    level: "F",
    entrySkills: "",
    achievementStandard: "",
    contentDescription: "",
    curriculumCode: "",
    yearLevel: "F–2",
  };
}

function slugId(r: CurriculumRecord) {
  const base = `${r.subject}-${r.strand}-${r.level}-${r.goal}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------- Admin override on an existing cell ----------

function OverrideButton({ cellKey, currentStatus }: { cellKey: string; currentStatus: IepStatus }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<IepStatus>(currentStatus);
  const [reason, setReason] = useState("");

  function apply() {
    if (reason.trim().length < 5) {
      toast.error("Provide a reason (≥ 5 characters).");
      return;
    }
    adminOverrideCell(cellKey, { status }, reason.trim());
    toast.success("Override applied and audited.");
    setOpen(false);
    setReason("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0" onClick={() => setOpen(true)}>
        <ShieldCheck className="h-3 w-3" />Override
      </Button>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-navy" />Admin override
          </SheetTitle>
          <SheetDescription>
            Change this student's IEP cell status even outside the active semester. The change is
            written to the Override Audit log.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 py-4">
          <Field label="New status">
            <Select value={status} onValueChange={(v) => setStatus(v as IepStatus)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_LABEL) as [IepStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reason (required, ≥ 5 chars)">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[80px]"
              placeholder="e.g. Late evidence submitted after report cut-off." />
          </Field>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-navy hover:bg-navy-light" onClick={apply}>Apply override</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------- utils ----------

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
