import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, Send, FileCheck2, BookOpen, Volume2, Hand, Wand2, Loader2, RotateCcw, Library, Save, FolderOpen } from "lucide-react";
import { generateLessonPlan, type GeneratedLesson } from "@/lib/lessons.functions";
import { curriculumStrands, lessonExamples } from "@/lib/mock-data";
import { useLessonStore, saveLesson, setLessonStatus, LESSON_WEEKS, type LessonNotes, type LessonTerm, type LessonWeek, type SavedLesson } from "@/lib/lesson-store";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons")({
  head: () => ({ meta: [{ title: "AI Lesson Planner · skoolmate" }] }),
  component: LessonsPage,
});

const subjects = Object.keys(curriculumStrands) as Array<keyof typeof curriculumStrands>;

/** Six-part planning structure written into the Notes payload sent to the AI. */
type NotesStruct = {
  learningIntention: string;
  successCriteria: string;
  hook: string;
  iDo: string;
  weDo: string;
  youDo: string;
};

const NOTES_FIELDS: Array<{ key: keyof NotesStruct; label: string; placeholder: string }> = [
  { key: "learningIntention", label: "Learning Intention", placeholder: "We are learning to…" },
  { key: "successCriteria",   label: "Success Criteria",   placeholder: "I can… (one per line)" },
  { key: "hook",              label: "Hook",               placeholder: "Engagement / warm-up (2–3 min)…" },
  { key: "iDo",               label: "I do",               placeholder: "Explicit teacher modelling…" },
  { key: "weDo",              label: "We do",              placeholder: "Guided group / partner practice…" },
  { key: "youDo",             label: "You do",             placeholder: "Independent / applied task with supports…" },
];

function serialiseNotes(n: NotesStruct) {
  return NOTES_FIELDS
    .map((f) => `${f.label}:\n${n[f.key].trim() || "(to be drafted by AI)"}`)
    .join("\n\n");
}

function LessonsPage() {
  const generate = useServerFn(generateLessonPlan);
  const [subject, setSubject] = useState<string>("Mathematics");
  const [strand, setStrand] = useState<string>("Number");
  const [topic, setTopic] = useState("Counting to 20 with 10-frames");
  const [duration, setDuration] = useState("45 min");
  const [ability, setAbility] = useState("Towards Foundation A–D · mixed AAC users");
  const [notes, setNotes] = useState<NotesStruct>({
    learningIntention: "We are learning to count and represent numbers 0–20.",
    successCriteria: "I can count 0–20 aloud.\nI can match numeral to quantity to 10.\nI can fill a 10-frame with support.",
    hook: "Number of the day song with body percussion; each learner touches the numeral card.",
    iDo: "Teacher models 1:1 counting on the 10-frame using magnetic counters.",
    weDo: "Small groups build sets of 5, 8, 10 with adult and peer prompts.",
    youDo: "Each learner completes their own 10-frame task card with AAC/visual supports.",
  });
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [term, setTerm] = useState<LessonTerm>("Term 1");
  const [week, setWeek] = useState<LessonWeek>("Week 1");
  const [status, setStatus] = useState<"draft" | "pending" | "approved">("draft");
  const [currentId, setCurrentId] = useState<string | null>(null);

  const strandOptions = curriculumStrands[subject as keyof typeof curriculumStrands] ?? [];
  const notesPayload = useMemo(() => serialiseNotes(notes), [notes]);
  const { lessons: savedLessons } = useLessonStore();

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generate({ data: { subject, strand, topic, duration, abilityRange: ability, notes: notesPayload } });
      setLesson(result as GeneratedLesson);
      toast.success("Lesson drafted by AI — review and submit for approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  function applyExample(i: number) {
    const ex = lessonExamples[i];
    setSubject(ex.subject);
    setStrand(ex.strand);
    setTopic(ex.topic);
    setDuration(ex.duration);
  }

  function handleSave(nextStatus?: "draft" | "pending" | "approved") {
    const saved = saveLesson({
      id: currentId ?? undefined,
      title: topic,
      subject, strand, topic, duration,
      abilityRange: ability,
      term,
      week,
      vcCode: (lesson as GeneratedLesson | null)?.vcCode,
      notes: notes as LessonNotes,
      aiPlan: lesson ?? undefined,
      author: "Honey P.",
      status: nextStatus ?? status,
    });
    setCurrentId(saved.id);
    setStatus(saved.status);
    toast.success(
      nextStatus === "pending" ? "Submitted for approval." :
      nextStatus === "approved" ? "Marked as approved." :
      "Lesson saved to Lesson Bank.",
    );
  }

  function loadSaved(id: string) {
    const s = savedLessons.find((l) => l.id === id);
    if (!s) return;
    setCurrentId(s.id);
    setSubject(s.subject);
    setStrand(s.strand);
    setTopic(s.topic);
    setDuration(s.duration);
    setAbility(s.abilityRange);
    setTerm(s.term);
    if (s.week) setWeek(s.week);
    setStatus(s.status);
    setNotes(s.notes);
    setLesson((s.aiPlan as GeneratedLesson) ?? null);
    toast.success(`Loaded "${s.title}" (${s.status}).`);
  }



  return (
    <AppShell>
      <PageHeader
        title="AI Lesson Planner"
        subtitle="Victorian Curriculum 2.0 · differentiated · approval-ready"
        actions={
          <>
            {savedLessons.length > 0 && (
              <Select value={currentId ?? ""} onValueChange={loadSaved}>
                <SelectTrigger className="h-9 w-[220px] text-xs">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Load saved lesson…" />
                </SelectTrigger>
                <SelectContent>
                  {savedLessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="text-xs">{l.title}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">· {l.subject} · {l.status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to="/lessons/bank"><Library className="h-4 w-4" />Lesson Bank</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCurrentId(null); setLesson(null); setStatus("draft"); }}>
              <Plus className="h-4 w-4" />New
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave("draft")}>
              <Save className="h-4 w-4" />Save
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Drafting…" : "Generate with AI"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[380px_1fr]">
        {/* Brief panel */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Lesson brief</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Select value={subject} onValueChange={(v) => { setSubject(v); setStrand((curriculumStrands as any)[v]?.[0] ?? ""); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Strand</Label>
                <Select value={strand} onValueChange={setStrand}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{strandOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duration</Label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ability range</Label>
                <Input value={ability} onChange={(e) => setAbility(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {/* Structured Lesson Plan Notes — LI, SC, Hook, I do, We do, You do */}
            <div className="rounded-lg border border-primary/20 bg-primary-soft/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-primary">Lesson Plan Notes</p>
                <span className="text-[10px] text-muted-foreground">6-part structure · sent to AI</span>
              </div>
              <div className="space-y-2.5">
                {NOTES_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[11px] font-semibold">{f.label}</Label>
                    <Textarea
                      value={notes[f.key]}
                      onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
                      rows={f.key === "successCriteria" ? 3 : 2}
                      className="text-xs"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Term</Label>
                <Select value={term} onValueChange={(v) => setTerm(v as LessonTerm)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Term 1", "Term 2", "Term 3", "Term 4"] as LessonTerm[]).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Week</Label>
                <Select value={week} onValueChange={(v) => setWeek(v as LessonWeek)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LESSON_WEEKS.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <div className="flex h-9 items-center gap-1.5 rounded-md border bg-muted/30 px-2 text-xs">
                  <Badge variant="outline" className="capitalize">{status}</Badge>
                  {currentId && <span className="text-[10px] text-muted-foreground truncate">saved</span>}
                </div>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Drafting lesson…" : "Draft with AI"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSave("draft")}>
                <Save className="h-4 w-4" />Save draft
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSave("pending")}>
                <Send className="h-4 w-4" />Submit for approval
              </Button>
            </div>
            {currentId && status === "pending" && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setLessonStatus(currentId, "approved"); setStatus("approved"); toast.success("Approved."); }}>
                <FileCheck2 className="h-4 w-4" />Approve (Leadership)
              </Button>
            )}
          </div>


          <div className="mt-6 border-t pt-4">

            <p className="mb-2 text-xs font-medium text-muted-foreground">Quick starts</p>
            <div className="space-y-1.5">
              {lessonExamples.map((ex, i) => (
                <button key={ex.topic} onClick={() => applyExample(i)} className="block w-full rounded-lg border bg-card px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-primary-soft/30 transition">
                  <span className="font-medium">{ex.topic}</span>
                  <span className="ml-1 text-muted-foreground">· {ex.subject}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {!lesson && !loading && <EmptyState />}
          {loading && <LoadingSkeleton />}
          {lesson && <LessonOutput lesson={lesson} onRegenerate={handleGenerate} />}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary-soft/30 via-background to-background p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Draft a lesson in seconds</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Set the brief on the left and the AI will produce a VC 2.0-aligned plan with Learning Intention,
        Success Criteria, I do / We do / You do, differentiation and AAC supports — ready for your Learning Specialist.
      </p>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Asking the AI to draft a differentiated plan…
      </div>
      <div className="mt-6 space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-3 w-full rounded bg-secondary/70 animate-pulse" style={{ width: `${60 + (i * 6) % 40}%` }} />)}
      </div>
    </Card>
  );
}

function LessonOutput({ lesson, onRegenerate }: { lesson: GeneratedLesson; onRegenerate: () => void }) {
  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary-soft/40 to-background px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background">Draft</Badge>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{lesson.vcCode}</Badge>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{lesson.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRegenerate}><RotateCcw className="h-4 w-4" />Regenerate</Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Send className="h-4 w-4" />Submit for approval</Button>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <Field icon={<BookOpen className="h-4 w-4" />} label="Learning intention">{lesson.learningIntention}</Field>
          <Field icon={<FileCheck2 className="h-4 w-4" />} label="Success criteria">
            <ul className="space-y-1.5">{lesson.successCriteria.map((c, i) => (
              <li key={i} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}</li>
            ))}</ul>
          </Field>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <PhaseCard tag="Hook" body={lesson.hook} />
        <PhaseCard tag="I do" body={lesson.iDo} />
        <PhaseCard tag="We do" body={lesson.weDo} />
        <PhaseCard tag="You do" body={lesson.youDo} />
        <PhaseCard tag="Assessment" body={lesson.assessment} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Hand className="h-4 w-4 text-primary" />Differentiation</h3>
          <div className="space-y-3 text-sm">
            <div><span className="font-medium text-foreground">Support:</span> <span className="text-muted-foreground">{lesson.differentiation.support}</span></div>
            <div><span className="font-medium text-foreground">Extension:</span> <span className="text-muted-foreground">{lesson.differentiation.extension}</span></div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Volume2 className="h-4 w-4 text-primary" />AAC & sensory supports</h3>
          <div className="flex flex-wrap gap-1.5">
            {lesson.aacSupports.map((s, i) => <Badge key={`a${i}`} variant="secondary" className="font-normal">AAC · {s}</Badge>)}
            {lesson.sensorySupports.map((s, i) => <Badge key={`s${i}`} className="bg-accent/15 text-accent hover:bg-accent/15 font-normal">Sensory · {s}</Badge>)}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Resource bank</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {lesson.resources.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
              <span className="font-medium">{r.name}</span>
              <Badge variant="outline" className="text-xs">{r.source}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function PhaseCard({ tag, body }: { tag: string; body: string }) {
  return (
    <Card className="p-4">
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{tag}</Badge>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{body}</p>
    </Card>
  );
}
