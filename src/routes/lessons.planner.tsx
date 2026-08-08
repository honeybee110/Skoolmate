import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { withRetry } from "@/lib/async-guard";
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
import { generateLessonPlan, LEARNING_AREAS, type LearningArea } from "@/lib/lessons.functions";
import { registerWeeklyUpload } from "@/lib/lesson-uploads.functions";
import { recordAuditEvent } from "@/lib/audit-log";
import { useFormDraft } from "@/lib/use-form-draft";
import { getEntrySkillsForLesson } from "@/lib/entry-skills";

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
const COHORT_LEVELS: CohortLevel[] = ["B", "C", "D"];

interface Draft {
  id?: string;
  title: string;
  learningArea: LearningArea;
  subject: string;
  strand: string;
  topic: string;
  duration: string;
  abilityRange: string;
  level: CohortLevel;
  levels: CohortLevel[];
  term: LessonTerm;
  week?: LessonWeek;
  vcCode?: string;
  notes: LessonNotes;
}

const NEW_DRAFT: Draft = {
  title: "",
  learningArea: "Literacy",
  subject: CURRICULUM_SUBJECTS[0].label,
  strand: CURRICULUM_SUBJECTS[0].strands[0],
  topic: "",
  duration: "45 min",
  abilityRange: "Towards Foundation A–D",
  level: "C",
  levels: ["B", "C", "D"],
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

  // Keep unsaved planner work on the device so a refresh never loses typing.
  const { restoredDraft, draftSavedAt, clearDraft, discardDraft } = useFormDraft<Draft>(
    "lesson-planner",
    draft,
    { scope: user?.id, isEmpty: (d) => !d.title.trim() && !d.topic.trim() && d.id === undefined },
  );

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
      learningArea: (LEARNING_AREAS as readonly string[]).includes(l.subject)
        ? (l.subject as LearningArea)
        : inferLearningArea(l.subject),
      subject: l.subject,
      strand: l.strand,
      topic: l.topic,
      duration: l.duration,
      abilityRange: l.abilityRange,
      level: "C",
      levels: ["B", "C", "D"],
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
    clearDraft();
    return saved;
  };

  const generateFn = useServerFn(generateLessonPlan);
  const lessonEntrySkills = useMemo(
    () => getEntrySkillsForLesson(draft.learningArea, draft.strand, draft.topic || draft.title, draft.levels),
    [draft.learningArea, draft.strand, draft.topic, draft.title, draft.levels],
  );
  const generate = useMutation({
    mutationFn: async () => {
      if (!draft.levels.length) throw new Error("Select at least one ability level.");
      return await withRetry(
        () =>
          generateFn({
        data: {
          learningArea: draft.learningArea,
          strand: draft.strand,
          topic: draft.topic || draft.title || draft.strand,
          duration: draft.duration,
          levels: draft.levels,
          entrySkills: lessonEntrySkills.map((s) => `Level ${s.level} · ${s.strand} › ${s.topic}: ${s.text}`),
          notes: "",
        },
          }),
        { retries: 1, timeoutMs: 90_000, timeoutMessage: "Mate took too long to draft this planner. Please try again." },
      );
    },
    onSuccess: (out) => {
      patchDraft({
        title: draft.title || out.title,
        topic: draft.topic || out.topic,
        vcCode: draft.vcCode || out.vcCode,
      });
      patchNotes({
        learningIntention: out.learningIntention,
        successCriteria: out.successCriteria
          .map((c: string) => (c.startsWith("I can") ? c : `I can ${c}`))
          .join("\n"),
        alignment: out.alignment,
        resources: out.resources.join("\n"),
        hook: out.flow.hook,
        iDo: out.flow.iDo,
        weDo: out.flow.weDo,
        youDo: out.flow.youDo,
        reflection: out.flow.reflection,
      });

      toast.success("Mate drafted a full specialist-school planner — review, edit or regenerate.");
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
      void recordAuditEvent({
        action: "lesson_plan.submitted_for_approval",
        entityType: "lesson_plan",
        entityId: draft.id ?? null,
        summary: `Lesson "${draft.title}" sent to leadership for approval`,
        metadata: { term: draft.term, week: draft.week, subject: draft.subject },
      });
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

      {restoredDraft && !restoredDraft.id && !draft.id && !dirty && (
        <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm md:mx-6">
          <span>
            Unsaved lesson draft from{" "}
            {draftSavedAt ? new Date(draftSavedAt).toLocaleString() : "an earlier session"} was kept on this device.
          </span>
          <span className="flex gap-2">
            <Button size="sm" onClick={() => { setDraft(restoredDraft); setDirty(true); discardDraft(); }}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={discardDraft}>Discard</Button>
          </span>
        </div>
      )}



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

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">1. Learning Area</Label>
                <Select
                  value={draft.learningArea}
                  onValueChange={(v) => patchDraft({ learningArea: v as LearningArea })}
                >
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEARNING_AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">2. Topic</Label>
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
                <Label className="text-xs">Student ability levels</Label>
                <div className="mt-1 flex h-9 items-center gap-1.5">
                  {COHORT_LEVELS.map((lv) => {
                    const on = draft.levels.includes(lv);
                    return (
                      <button
                        key={lv}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          patchDraft({
                            levels: on ? draft.levels.filter((x) => x !== lv) : [...draft.levels, lv].sort(),
                            level: on ? draft.level : lv,
                          })
                        }
                        className={cn(
                          "flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition",
                          on
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        Level {lv}
                      </button>
                    );
                  })}
                </div>
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
                label="3. Learning Intention"
                value={draft.notes.learningIntention}
                onChange={(v) => patchNotes({ learningIntention: v })}
                placeholder="We are learning to…"
              />
              <NotesField
                label="4. Success Criteria"
                value={draft.notes.successCriteria}
                onChange={(v) => patchNotes({ successCriteria: v })}
                placeholder={"I can …\nI can …\nI can …"}
                rows={4}
              />
              <NotesField
                label="5. Victorian Curriculum / Entry Skills alignment"
                value={draft.notes.alignment ?? ""}
                onChange={(v) => patchNotes({ alignment: v })}
                placeholder="VC 2.0 code, content description and how it maps to each level's entry skills…"
                rows={4}
              />
              <NotesField
                label="6. Resources"
                value={draft.notes.resources ?? ""}
                onChange={(v) => patchNotes({ resources: v })}
                placeholder={"Visual schedule\nCore-word AAC board\n1 teacher + 2 ES"}
                rows={4}
              />
            </div>

            <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                7. Lesson Flow
              </div>
              <div className="grid gap-4">
                <NotesField
                  label="HOOK"
                  value={draft.notes.hook}
                  onChange={(v) => patchNotes({ hook: v })}
                  placeholder="Engagement routine, timing, teacher scripting, AAC supports…"
                  rows={5}
                />
                <NotesField
                  label="I DO"
                  value={draft.notes.iDo}
                  onChange={(v) => patchNotes({ iDo: v })}
                  placeholder="Explicit teacher model, step by step, with exact wording…"
                  rows={5}
                />
                <NotesField
                  label="WE DO"
                  value={draft.notes.weDo}
                  onChange={(v) => patchNotes({ weDo: v })}
                  placeholder="Guided practice, staffing, prompt hierarchy and fading…"
                  rows={5}
                />
                <NotesField
                  label="YOU DO"
                  value={draft.notes.youDo}
                  onChange={(v) => patchNotes({ youDo: v })}
                  placeholder="Independent applied task with visual checklist…"
                  rows={5}
                />
                <NotesField
                  label="REFLECTION"
                  value={draft.notes.reflection ?? ""}
                  onChange={(v) => patchNotes({ reflection: v })}
                  placeholder="What worked, who met criteria, what changes next session…"
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-4">
              <NotesField
                label={`Differentiation by ability level (${draft.levels.join(", ") || "—"})`}
                value={draft.notes.differentiation ?? ""}
                onChange={(v) => patchNotes({ differentiation: v })}
                placeholder={"Level B: …\n\nLevel C: …\n\nLevel D: …"}
                rows={6}
              />
            </div>

            {lessonEntrySkills.length > 0 && (
              <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Entry skills feeding this lesson
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {lessonEntrySkills.map((s, i) => (
                    <li key={`${s.level}-${i}`}>
                      <span className="font-medium text-foreground">Level {s.level}</span> · {s.strand} › {s.topic} — {s.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <NotesField
                label="Entry skill → activity alignment"
                value={draft.notes.entrySkillAlignment ?? ""}
                onChange={(v) => patchNotes({ entrySkillAlignment: v })}
                placeholder={"Level B — attends to shared book\n→ Sits with ES during HOOK…"}
                rows={6}
              />
              <NotesField
                label="Sensory supports"
                value={draft.notes.sensorySupports ?? ""}
                onChange={(v) => patchNotes({ sensorySupports: v })}
                placeholder={"Wobble cushion at the table\nMovement break after I DO"}
                rows={6}
              />
              <NotesField
                label="Communication supports"
                value={draft.notes.communicationSupports ?? ""}
                onChange={(v) => patchNotes({ communicationSupports: v })}
                placeholder={"Model core words: more, stop, my turn\nKey Word Sign for 'finished'"}
                rows={5}
              />
              <NotesField
                label="Visuals to prepare"
                value={draft.notes.visuals ?? ""}
                onChange={(v) => patchNotes({ visuals: v })}
                placeholder={"Now/Next board\n3-step task strip with finished box"}
                rows={5}
              />
              <NotesField
                label="Assessment evidence"
                value={draft.notes.assessmentEvidence ?? ""}
                onChange={(v) => patchNotes({ assessmentEvidence: v })}
                placeholder={"Prompt-level tick sheet against success criteria\nPhoto/video to Evidence hub"}
                rows={5}
              />
              <NotesField
                label="Extension activities"
                value={draft.notes.extension ?? ""}
                onChange={(v) => patchNotes({ extension: v })}
                placeholder={"Generalise the skill in the kitchen\nPeer modelling with staff supervision"}
                rows={5}
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
    `**Learning Area:** ${d.learningArea}`,
    `**Subject/Strand:** ${d.subject} · ${d.strand}`,
    `**Topic:** ${d.topic}`,
    `**Term/Week:** ${d.term}${d.week ? ` · ${d.week}` : ""}`,
    `**Duration:** ${d.duration}`,
    `**Ability levels:** ${d.levels.join(", ")}`,
    d.vcCode ? `**VC 2.0 code:** ${d.vcCode}` : "",
    ``,
    `## Learning Intention`, d.notes.learningIntention, ``,
    `## Success Criteria`, d.notes.successCriteria, ``,
    `## Victorian Curriculum / Entry Skills alignment`, d.notes.alignment ?? "", ``,
    `## Resources`, d.notes.resources ?? "", ``,
    `## Lesson Flow`, ``,
    `### HOOK`, d.notes.hook, ``,
    `### I DO`, d.notes.iDo, ``,
    `### WE DO`, d.notes.weDo, ``,
    `### YOU DO`, d.notes.youDo, ``,
    `### REFLECTION`, d.notes.reflection ?? "", ``,
    `## Differentiation`, d.notes.differentiation ?? "", ``,
    `## Entry skill → activity alignment`, d.notes.entrySkillAlignment ?? "", ``,
    `## Sensory supports`, d.notes.sensorySupports ?? "", ``,
    `## Communication supports`, d.notes.communicationSupports ?? "", ``,
    `## Visuals to prepare`, d.notes.visuals ?? "", ``,
    `## Assessment evidence`, d.notes.assessmentEvidence ?? "", ``,
    `## Extension activities`, d.notes.extension ?? "", ``,

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

/** Best-effort mapping of a legacy curriculum subject onto a Learning Area. */
function inferLearningArea(subject: string): LearningArea {
  const s = subject.toLowerCase();
  if (/english|literacy|reading|writing|speak/.test(s)) return "Literacy";
  if (/math|numeracy/.test(s)) return "Numeracy";
  if (/geograph/.test(s)) return "Geography";
  if (/histor/.test(s)) return "History";
  if (/science/.test(s)) return "Science";
  if (/sensory/.test(s)) return "Sensory Learning";
  if (/personal|self|care|social/.test(s)) return "Personal Care";
  return "Literacy";
}

