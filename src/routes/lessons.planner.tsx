import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Plus, Save, Send, Trash2, Copy, History, FileDown,
  CheckCircle2, Clock3, RotateCcw, XCircle, PencilLine, Loader2,
  Filter, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useLessonStore, saveLesson, deleteLesson, duplicateLesson,
  restoreLessonSnapshot, setLessonStatus, LESSON_WEEKS,
  type SavedLesson, type LessonNotes, type LessonTerm, type LessonWeek,
  type LessonStatus,
} from "@/lib/lesson-store";
import { useCurriculumStore } from "@/lib/curriculum-store";
import { CURRICULUM_SUBJECTS } from "@/lib/curriculum-db";
import { generateLessonPlan } from "@/lib/lessons.functions";
import { registerWeeklyUpload } from "@/lib/lesson-uploads.functions";
import { useAuth } from "@/lib/auth-context";
import { useDirectory, getApprovedOrPublishedTimetable, statusLabel } from "@/lib/directory-store";

export const Route = createFileRoute("/lessons/planner")({
  head: () => ({
    meta: [
      { title: "Lesson Planner · skoolmate" },
      { name: "description", content: "Compose, align and submit weekly lesson plans." },
    ],
  }),
  component: LessonPlannerPage,
});

const TERMS: LessonTerm[] = ["Term 1", "Term 2", "Term 3", "Term 4"];

const EMPTY_NOTES: LessonNotes = {
  learningIntention: "",
  successCriteria: "",
  hook: "",
  iDo: "",
  weDo: "",
  youDo: "",
};

const STATUS_META: Record<LessonStatus, { label: string; className: string; Icon: typeof Clock3 }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200", Icon: PencilLine },
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-800 border-amber-200", Icon: Clock3 },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  returned: { label: "Returned", className: "bg-rose-100 text-rose-800 border-rose-200", Icon: RotateCcw },
};

type CohortLevel = "B" | "C" | "D";

interface Draft {
  id?: string;
  title: string;
  subject: string;
  strand: string;
  topic: string;
  duration: string;
  abilityRange: string;
  level: CohortLevel;
  term: LessonTerm;
  week?: LessonWeek;
  vcCode?: string;
  notes: LessonNotes;
}

const NEW_DRAFT: Draft = {
  title: "",
  subject: CURRICULUM_SUBJECTS[0].label,
  strand: CURRICULUM_SUBJECTS[0].strands[0],
  topic: "",
  duration: "45 min",
  abilityRange: "Towards Foundation A–D",
  level: "C",
  term: "Term 1",
  week: "Week 1",
  vcCode: "",
  notes: EMPTY_NOTES,
};

function LessonPlannerPage() {
  const { profile, user } = useAuth();
  const { lessons } = useLessonStore();
  const { records } = useCurriculumStore();
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(NEW_DRAFT);
  const [dirty, setDirty] = useState(false);
  const [filter, setFilter] = useState<"all" | LessonStatus>("all");

  const authorName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Teacher";

  const selected = useMemo(
    () => (selectedId ? lessons.find((l) => l.id === selectedId) : undefined),
    [selectedId, lessons],
  );

  const filteredLessons = useMemo(() => {
    const mine = lessons; // author scoping stays flexible for demo store
    return filter === "all" ? mine : mine.filter((l) => l.status === filter);
  }, [lessons, filter]);

  const grouped = useMemo(() => {
    const map: Record<LessonTerm, SavedLesson[]> = {
      "Term 1": [], "Term 2": [], "Term 3": [], "Term 4": [],
    };
    for (const l of filteredLessons) map[l.term]?.push(l);
    return map;
  }, [filteredLessons]);

  const currentSubject = CURRICULUM_SUBJECTS.find((s) => s.label === draft.subject) ?? CURRICULUM_SUBJECTS[0];
  const alignmentSuggestions = useMemo(() => {
    return records
      .filter((r) => r.subject === draft.subject && r.strand === draft.strand)
      .slice(0, 8);
  }, [records, draft.subject, draft.strand]);

  const openLesson = (l: SavedLesson) => {
    setSelectedId(l.id);
    setDraft({
      id: l.id,
      title: l.title,
      subject: l.subject,
      strand: l.strand,
      topic: l.topic,
      duration: l.duration,
      abilityRange: l.abilityRange,
      level: "C",
      term: l.term,
      week: l.week,
      vcCode: l.vcCode,
      notes: { ...l.notes },
    });
    setDirty(false);
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft(NEW_DRAFT);
    setDirty(false);
  };

  const patchDraft = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const patchNotes = (patch: Partial<LessonNotes>) => {
    setDraft((d) => ({ ...d, notes: { ...d.notes, ...patch } }));
    setDirty(true);
  };

  const saveDraft = (status?: LessonStatus) => {
    if (!draft.title.trim()) {
      toast.error("Give your lesson a title first.");
      return;
    }
    const saved = saveLesson({
      id: draft.id,
      title: draft.title.trim(),
      subject: draft.subject,
      strand: draft.strand,
      topic: draft.topic || draft.title.trim(),
      duration: draft.duration,
      abilityRange: draft.abilityRange,
      term: draft.term,
      week: draft.week,
      vcCode: draft.vcCode,
      notes: draft.notes,
      author: authorName,
      status,
    });
    setSelectedId(saved.id);
    setDraft((d) => ({ ...d, id: saved.id }));
    setDirty(false);
    return saved;
  };

  const generateFn = useServerFn(generateLessonPlan);
  const generate = useMutation({
    mutationFn: async () => {
      return generateFn({
        data: {
          subject: draft.subject,
          strand: draft.strand,
          topic: draft.topic || draft.title || draft.strand,
          duration: draft.duration,
          abilityRange: draft.abilityRange,
          notes: "",
        },
      });
    },
    onSuccess: (out) => {
      patchDraft({
        title: draft.title || out.title,
        vcCode: draft.vcCode || out.vcCode,
      });
      patchNotes({
        learningIntention: out.learningIntention,
        successCriteria: out.successCriteria.join("\n"),
        hook: out.hook,
        iDo: out.iDo,
        weDo: out.weDo,
        youDo: out.youDo,
      });
      toast.success("Mate drafted the 6-part plan — review and edit.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  const registerFn = useServerFn(registerWeeklyUpload);
  const submit = useMutation({
    mutationFn: async () => {
      const saved = saveDraft("pending");
      if (!saved) throw new Error("Save failed");
      // Also register a placeholder Bank row so admins see it in the Approval Centre.
      const path = `planner/${saved.id}.md`;
      await registerFn({
        data: {
          term: saved.term,
          week: (saved.week ?? "Week 1") as LessonWeek,
          title: saved.title,
          storage_path: path,
          content_type: "text/markdown",
          uploader_name: authorName,
          class_name: saved.subject,
        },
      }).catch(() => {
        // Cloud registration is best-effort in demo — local status still updates.
      });
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-uploads"] });
      toast.success("Sent to leadership for approval.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submit failed"),
  });

  const onDelete = () => {
    if (!selected) return;
    deleteLesson(selected.id);
    startNew();
    toast.success("Lesson deleted.");
  };

  const onDuplicate = () => {
    if (!selected) return;
    const copy = duplicateLesson(selected.id);
    if (copy) {
      openLesson(copy);
      toast.success("Duplicated to draft — edit and save.");
    }
  };

  const onRestore = (at: string) => {
    if (!selected) return;
    restoreLessonSnapshot(selected.id, at);
    const fresh = lessons.find((l) => l.id === selected.id);
    if (fresh) openLesson(fresh);
    toast.success("Restored previous version.");
  };

  const onExport = () => {
    // Simple Markdown export — same shape works in Word/Docs.
    const md = buildMarkdown(draft);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(draft.title || "lesson").replace(/[^a-z0-9]+/gi, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const isBusy = generate.isPending || submit.isPending;

  return (
    <AppShell variant="teacher">
      <PageHeader
        title="Lesson Planner"
        subtitle="Draft 6-part weekly plans aligned to Victorian Curriculum 2.0 — save, revise and send for approval."
        actions={
          <Button size="sm" onClick={startNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> New lesson
          </Button>
        }
      />

      <PublishedTimetableBanner />



      <div className="grid gap-4 p-4 md:grid-cols-[320px_1fr] md:p-6">
        {/* Left rail */}
        <aside className="flex flex-col gap-3">
          <Card className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lessons</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="pending">Pending review</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px] pr-2">
              <div className="space-y-4">
                {TERMS.map((term) => {
                  const list = grouped[term];
                  if (!list.length) return null;
                  return (
                    <div key={term}>
                      <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>{term}</span>
                        <span>{list.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {list.map((l) => {
                          const meta = STATUS_META[l.status];
                          const active = l.id === selectedId;
                          return (
                            <button
                              key={l.id}
                              onClick={() => openLesson(l)}
                              className={cn(
                                "w-full rounded-md border p-2 text-left text-xs transition",
                                active
                                  ? "border-primary bg-primary/5"
                                  : "border-transparent hover:border-border hover:bg-muted/50",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="line-clamp-1 font-medium text-foreground">{l.title}</span>
                                <Badge variant="outline" className={cn("shrink-0 text-[10px]", meta.className)}>
                                  <meta.Icon className="mr-1 h-3 w-3" />
                                  {meta.label}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>{l.subject}</span>
                                {l.week && <><span>·</span><span>{l.week}</span></>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {!filteredLessons.length && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    No lessons yet — click "New lesson" to start.
                  </p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Editor */}
        <section>
          <Card className="p-4 md:p-6">
            {selected?.status === "returned" && selected.reviewerComment && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <RotateCcw className="h-4 w-4" /> Returned with comments
                </div>
                <p>{selected.reviewerComment}</p>
              </div>
            )}
            {selected?.status === "pending" && (
              <div className="mb-4 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <Clock3 className="h-3.5 w-3.5" /> Awaiting leadership approval — you can still edit and re-save.
              </div>
            )}
            {selected?.status === "approved" && (
              <div className="mb-4 flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved and published to the Lesson Bank.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1fr_240px]">
              <div>
                <Label className="text-xs">Lesson title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                  placeholder="e.g. Counting to 20 with 10-frames"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">VC 2.0 code</Label>
                <Input
                  value={draft.vcCode ?? ""}
                  onChange={(e) => patchDraft({ vcCode: e.target.value })}
                  placeholder="VC2MFN01"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Subject</Label>
                <Select
                  value={draft.subject}
                  onValueChange={(v) => {
                    const subj = CURRICULUM_SUBJECTS.find((s) => s.label === v);
                    patchDraft({ subject: v, strand: subj?.strands[0] ?? draft.strand });
                  }}
                >
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRICULUM_SUBJECTS.map((s) => (
                      <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Strand</Label>
                <Select value={draft.strand} onValueChange={(v) => patchDraft({ strand: v })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currentSubject.strands.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Term</Label>
                <Select value={draft.term} onValueChange={(v) => patchDraft({ term: v as LessonTerm })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Week</Label>
                <Select value={draft.week ?? "Week 1"} onValueChange={(v) => patchDraft({ week: v as LessonWeek })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LESSON_WEEKS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <Label className="text-xs">Topic</Label>
                <Input
                  value={draft.topic}
                  onChange={(e) => patchDraft({ topic: e.target.value })}
                  placeholder="e.g. Blend and read CVC words"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Duration</Label>
                <Input
                  value={draft.duration}
                  onChange={(e) => patchDraft({ duration: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Ability range</Label>
                <Input
                  value={draft.abilityRange}
                  onChange={(e) => patchDraft({ abilityRange: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
            </div>

            {alignmentSuggestions.length > 0 && (
              <div className="mt-3 rounded-md border bg-muted/40 p-3">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Scope & Sequence alignment
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {alignmentSuggestions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => patchDraft({ vcCode: r.curriculumCode })}
                      className={cn(
                        "rounded-full border px-2 py-1 text-[11px] transition",
                        draft.vcCode === r.curriculumCode
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/60",
                      )}
                      title={`${r.curriculumCode} · L${r.level}`}
                    >
                      {r.goal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-5" />

            <div className="grid gap-4 md:grid-cols-2">
              <NotesField
                label="Learning Intention"
                value={draft.notes.learningIntention}
                onChange={(v) => patchNotes({ learningIntention: v })}
                placeholder="We are learning to…"
              />
              <NotesField
                label="Success Criteria"
                value={draft.notes.successCriteria}
                onChange={(v) => patchNotes({ successCriteria: v })}
                placeholder={"I can …\nI can …\nI can …"}
                rows={4}
              />
              <NotesField
                label="Hook"
                value={draft.notes.hook}
                onChange={(v) => patchNotes({ hook: v })}
                placeholder="Short warm-up / engagement routine…"
              />
              <NotesField
                label="I do"
                value={draft.notes.iDo}
                onChange={(v) => patchNotes({ iDo: v })}
                placeholder="Teacher models the target skill…"
              />
              <NotesField
                label="We do"
                value={draft.notes.weDo}
                onChange={(v) => patchNotes({ weDo: v })}
                placeholder="Guided small-group practice…"
              />
              <NotesField
                label="You do"
                value={draft.notes.youDo}
                onChange={(v) => patchNotes({ youDo: v })}
                placeholder="Independent applied task…"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate.mutate()}
                  disabled={isBusy}
                  className="gap-1.5"
                >
                  {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate with Mate
                </Button>
                {selected && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5" disabled={!selected.history?.length}>
                        <History className="h-4 w-4" /> History
                        {selected.history?.length ? (
                          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                            {selected.history.length}
                          </Badge>
                        ) : null}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-72 p-0">
                      <div className="border-b p-2 text-xs font-semibold">Version history</div>
                      <ScrollArea className="max-h-64">
                        <ul className="divide-y">
                          {(selected.history ?? []).map((h) => (
                            <li key={h.at} className="flex items-center justify-between gap-2 p-2 text-xs">
                              <div className="min-w-0">
                                <div className="truncate font-medium">{h.title}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {new Date(h.at).toLocaleString()}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => onRestore(h.at)}>Restore</Button>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
                {selected && (
                  <Button variant="outline" size="sm" onClick={onDuplicate} className="gap-1.5">
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
                  <FileDown className="h-4 w-4" /> Export
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selected && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-rose-700 hover:text-rose-800">
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="outline" size="sm" onClick={() => saveDraft()} disabled={isBusy || !dirty} className="gap-1.5">
                  <Save className="h-4 w-4" /> Save draft
                </Button>
                <Button size="sm" onClick={() => submit.mutate()} disabled={isBusy} className="gap-1.5">
                  {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit for approval
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function NotesField({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1"
      />
    </div>
  );
}

function buildMarkdown(d: Draft): string {
  return [
    `# ${d.title || "Untitled lesson"}`,
    ``,
    `**Subject:** ${d.subject} · ${d.strand}`,
    `**Term/Week:** ${d.term}${d.week ? ` · ${d.week}` : ""}`,
    `**Duration:** ${d.duration}`,
    `**Ability range:** ${d.abilityRange}`,
    d.vcCode ? `**VC 2.0 code:** ${d.vcCode}` : "",
    ``,
    `## Learning Intention`, d.notes.learningIntention, ``,
    `## Success Criteria`, d.notes.successCriteria, ``,
    `## Hook`, d.notes.hook, ``,
    `## I do`, d.notes.iDo, ``,
    `## We do`, d.notes.weDo, ``,
    `## You do`, d.notes.youDo, ``,
  ].filter(Boolean).join("\n");
}

function PublishedTimetableBanner() {
  const { classes, timetables } = useDirectory();
  void timetables;
  // Find the first class with an approved/published timetable — teacher's class in mock.
  const cls = classes.find((c) => c.teacherId === "t-honey") ?? classes.find((c) => !!c.teacherId);
  const tt = cls ? getApprovedOrPublishedTimetable(cls.id) : undefined;
  if (!cls || !tt) return null;
  const totalCells = Object.values(tt.grid).reduce((n, day) => n + Object.values(day).filter((c) => c.subject).length, 0);
  return (
    <div className="mx-4 mt-3 md:mx-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--primary)]/20 bg-gradient-to-r from-[color:var(--primary)]/5 to-[color:var(--accent)]/5 px-4 py-3 text-sm">
        <CalendarClock className="h-4 w-4 text-[color:var(--primary)]" />
        <div className="flex-1">
          <div className="font-medium">Approved timetable synced · {cls.name}</div>
          <div className="text-xs text-muted-foreground">Leadership {statusLabel(tt.status).toLowerCase()} v{tt.version} · {totalCells} sessions imported into your planner.</div>
        </div>
        <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--primary)]">Auto-sync</span>
      </div>
    </div>
  );
}
