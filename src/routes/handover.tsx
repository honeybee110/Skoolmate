import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Folder, FileText, Pin, Upload, ShieldCheck, Users, ClipboardList, CheckCircle2, Sparkles,
  Download, Trash2, Search, ChevronRight, Cloud, Smartphone, HardDrive, Clock,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { classInfo } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PortalGuard } from "@/components/portal-guard";

export const Route = createFileRoute("/handover")({
  head: () => ({ meta: [{ title: "Handover Workspace · skoolmate" }] }),
  component: () => (
    <PortalGuard portal="teacher">
      <Handover />
    </PortalGuard>
  ),
});

// -----------------------------------------------------------------------------
// Milestone C — Handover Workspace
//
// Class P7 end-of-semester handover. Two semester folders each holding:
//   • Leadership Templates (read-only, pinned)
//   • Teacher Uploads (staff drop their completed docs here)
//   • Checklist of required handover items with progress
// Uploads persist locally for the demo (real Cloud storage lives in the
// Weekly Lesson Bank feature); this workspace focuses on structure, checklist
// completeness and the leadership audit view.
// -----------------------------------------------------------------------------

type SemesterKey = "s1" | "s2";
const SEMESTERS: { key: SemesterKey; label: string }[] = [
  { key: "s1", label: "Semester 1 · 2026" },
  { key: "s2", label: "Semester 2 · 2026" },
];

const CHECKLIST: { id: string; label: string; note: string }[] = [
  { id: "profile",   label: "Student profiles (class list, DOB, alerts)", note: "Includes medical, behaviour, communication alerts." },
  { id: "iep",       label: "Signed IEP snapshots (all students)",         note: "Printed & parent-signed for the current semester." },
  { id: "iep-parent",label: "Translated parent copies where required",     note: "Mandarin, Amharic, Hakka Chin, Punjabi, Arabic, Thai, Vietnamese." },
  { id: "goals",     label: "Cross-check progress export",                 note: "Developing → Working Towards → Achieved snapshot." },
  { id: "seating",   label: "Seating plan & group dynamics",               note: "Grouping notes and 1:1 pairings." },
  { id: "medical",   label: "Medical & risk management plans",             note: "Asthma, allergy, epilepsy, PEG, hoist, standing frame." },
  { id: "behaviour", label: "Behaviour Support Plans & regulation profiles", note: "Triggers, strategies and de-escalation scripts." },
  { id: "specialist",label: "Allied health handover notes",                note: "OT, SLP, Physio, Wellbeing, Psychology." },
  { id: "timetable", label: "Weekly timetable & specialist rotations",     note: "PE, Music, Art, Learn to Play, Library, Swimming." },
  { id: "resources", label: "Classroom resource inventory",                note: "AAC devices, sensory tools, communication books." },
];

const TEMPLATES: Record<SemesterKey, { name: string; kind: "docx" | "pdf" }[]> = {
  s1: [
    { name: "Handover_Template_v3.docx", kind: "docx" },
    { name: "Medical_Alert_Handover.pdf", kind: "pdf" },
    { name: "Behaviour_Support_Handover.docx", kind: "docx" },
  ],
  s2: [
    { name: "Handover_Template_v3.docx", kind: "docx" },
    { name: "End_of_Year_Reflection.docx", kind: "docx" },
    { name: "Transitions_Report.pdf", kind: "pdf" },
  ],
};

// -------- Local persistence for uploads + checklist --------
interface HandoverFile { id: string; name: string; size: number; type: string; uploader: string; at: string; }
interface HandoverState {
  uploads: Record<SemesterKey, HandoverFile[]>;
  checked: Record<SemesterKey, Record<string, boolean>>;
  notes: Record<SemesterKey, string>;
}
const KEY = "skoolmate.handover.v1";
const emptyState: HandoverState = {
  uploads: { s1: [], s2: [] },
  checked: { s1: {}, s2: {} },
  notes:   { s1: "", s2: "" },
};

let state: HandoverState = load() ?? emptyState;
const listeners = new Set<() => void>();
function load(): HandoverState | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function persist() { if (typeof window !== "undefined") try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /**/ } }
function emit() { persist(); for (const l of listeners) l(); }
function useHandover() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => state, () => emptyState);
}
function addUpload(sem: SemesterKey, file: HandoverFile) {
  state = { ...state, uploads: { ...state.uploads, [sem]: [file, ...state.uploads[sem]] } };
  emit();
}
function removeUpload(sem: SemesterKey, id: string) {
  state = { ...state, uploads: { ...state.uploads, [sem]: state.uploads[sem].filter((f) => f.id !== id) } };
  emit();
}
function toggleCheck(sem: SemesterKey, id: string) {
  state = { ...state, checked: { ...state.checked, [sem]: { ...state.checked[sem], [id]: !state.checked[sem][id] } } };
  emit();
}
function setNotes(sem: SemesterKey, notes: string) {
  state = { ...state, notes: { ...state.notes, [sem]: notes } };
  emit();
}

// -----------------------------------------------------------------------------

function Handover() {
  const s = useHandover();
  const [tab, setTab] = useState<SemesterKey>("s2");
  const [templateSel, setTemplateSel] = useState<{ sem: SemesterKey; name: string } | null>(null);
  const [q, setQ] = useState("");

  const done = (sem: SemesterKey) => CHECKLIST.filter((c) => s.checked[sem][c.id]).length;

  return (
    <AppShell>
      <PageHeader
        title="Handover Workspace"
        subtitle={`Class ${classInfo.code} · Milestone C · End-of-semester handover for the next teaching team`}
        actions={
          <>
            <div className="relative min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search checklist / uploads…" className="h-9 pl-8" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 gap-1"><Sparkles className="h-3 w-3" />Milestone C</Badge>
          </>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* Overview tiles */}
        <div className="grid gap-3 md:grid-cols-4">
          {SEMESTERS.map((sem) => {
            const pct = Math.round((done(sem.key) / CHECKLIST.length) * 100);
            return (
              <Card key={sem.key} className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{sem.label}</p>
                <p className="mt-1 text-2xl font-semibold">{done(sem.key)}<span className="text-sm text-muted-foreground">/{CHECKLIST.length}</span></p>
                <p className="text-[10px] text-muted-foreground">checklist items complete</p>
                <Progress value={pct} className="mt-2 h-1.5" />
              </Card>
            );
          })}
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Uploads</p>
            <p className="mt-1 text-2xl font-semibold">{s.uploads.s1.length + s.uploads.s2.length}</p>
            <p className="text-[10px] text-muted-foreground">files across both semesters</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Leadership visibility</p>
            <p className="mt-1 text-sm font-medium flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" />All classes</p>
            <p className="text-[10px] text-muted-foreground">Leadership can view every teacher's handover.</p>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as SemesterKey)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {SEMESTERS.map((sem) => (
              <TabsTrigger key={sem.key} value={sem.key}>
                {sem.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SEMESTERS.map((sem) => (
            <TabsContent key={sem.key} value={sem.key} className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                {/* Left column: templates + uploads */}
                <div className="space-y-4">
                  {/* Templates */}
                  <Card className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Pin className="h-4 w-4 text-amber-600" />
                      <h3 className="text-sm font-semibold">Leadership Templates</h3>
                      <Badge variant="secondary" className="ml-auto text-[10px]">Pinned · read-only</Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {TEMPLATES[sem.key].map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setTemplateSel({ sem: sem.key, name: t.name })}
                          className="group flex items-center gap-2 rounded-lg border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-sm"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <p className="text-xs font-medium">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground">{t.kind.toUpperCase()} · Leadership template</p>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Uploads */}
                  <UploadCard sem={sem.key} files={s.uploads[sem.key].filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))} />

                  {/* Notes */}
                  <Card className="p-4">
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Handover notes</h3>
                    <Textarea
                      value={s.notes[sem.key]}
                      onChange={(e) => setNotes(sem.key, e.target.value)}
                      rows={5}
                      placeholder="Notes for the incoming team — routines, communication styles, family preferences, warm handover context…"
                      className="text-sm"
                    />
                  </Card>
                </div>

                {/* Right column: checklist */}
                <Card className="h-fit p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold">Handover checklist</h3>
                    <Badge variant="outline" className="ml-auto text-[10px]">{done(sem.key)}/{CHECKLIST.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {CHECKLIST.filter((c) => !q.trim() || c.label.toLowerCase().includes(q.toLowerCase())).map((c) => (
                      <label key={c.id} className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border bg-card p-2 text-xs transition hover:bg-muted/40",
                        s.checked[sem.key][c.id] && "border-emerald-300 bg-emerald-50/50",
                      )}>
                        <input
                          type="checkbox"
                          checked={!!s.checked[sem.key][c.id]}
                          onChange={() => toggleCheck(sem.key, c.id)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div className="flex-1">
                          <p className={cn("font-medium leading-tight", s.checked[sem.key][c.id] && "line-through text-muted-foreground")}>{c.label}</p>
                          <p className="text-[10px] text-muted-foreground">{c.note}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Leadership audit strip */}
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary-soft/30 via-background to-background">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Leadership audit view</p>
              <p className="text-xs text-muted-foreground">
                Leadership sees every teacher's checklist completion, uploaded files and notes across all classes in one view.
                Warm handovers can be scheduled via the Calendar; parent-facing communication uses the translated IEPs from
                the IEP module.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]"><Clock className="mr-1 h-3 w-3" />Sync: local demo</Badge>
          </div>
        </Card>
      </div>

      {templateSel && (
        <Dialog open onOpenChange={(o) => !o && setTemplateSel(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{templateSel.name}</DialogTitle>
              <DialogDescription>
                Read-only Leadership template for {SEMESTERS.find((x) => x.key === templateSel.sem)?.label}.
                Download, complete on your device, then upload the finished copy into Teacher Uploads.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">
              Template preview isn't available in the demo build — the real workspace serves the file from the Leadership library.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateSel(null)}>Close</Button>
              <Button onClick={() => { toast.success(`Downloaded ${templateSel.name}`); setTemplateSel(null); }}>
                <Download className="h-4 w-4" />Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

function UploadCard({ sem, files }: { sem: SemesterKey; files: HandoverFile[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleFiles(fl: FileList | null) {
    if (!fl) return;
    for (const f of Array.from(fl)) {
      addUpload(sem, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name, size: f.size, type: f.type,
        uploader: classInfo.teacher, at: new Date().toISOString(),
      });
    }
    toast.success(`${fl.length} file${fl.length === 1 ? "" : "s"} uploaded to handover.`);
    if (inputRef.current) inputRef.current.value = "";
  }
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Folder className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Teacher Uploads</h3>
        <Badge variant="outline" className="ml-auto text-[10px]">Leadership can view</Badge>
      </div>
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" hidden multiple onChange={(e) => handleFiles(e.target.files)} />
          <Button size="sm" onClick={() => inputRef.current?.click()} className="bg-primary hover:bg-primary/90"><HardDrive className="h-4 w-4" />From computer</Button>
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}><Smartphone className="h-4 w-4" />From phone</Button>
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}><Cloud className="h-4 w-4" />From drive</Button>
          <span className="text-[11px] text-muted-foreground ml-auto">PDF, DOCX, PPTX, JPG, PNG</span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {files.length === 0 && <p className="rounded-md border border-dashed p-3 text-center text-xs italic text-muted-foreground">No files uploaded yet.</p>}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 truncate">{f.name}</span>
            <span className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB · {new Date(f.at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
            <Button size="sm" variant="ghost" onClick={() => removeUpload(sem, f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
