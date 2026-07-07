import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Folder, FolderOpen, Search, CheckCircle2, ArrowLeft, FileText, Upload,
  Cloud, Smartphone, HardDrive, Loader2, Clock3, XCircle, ShieldCheck, Trash2, Download,
  Sparkles, BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LESSON_WEEKS, type LessonWeek, type LessonTerm } from "@/lib/lesson-store";
import {
  listWeeklyUploads, registerWeeklyUpload, reviewWeeklyUpload, deleteWeeklyUpload, signWeeklyUpload,
  type WeeklyUpload,
} from "@/lib/lesson-uploads.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons/bank")({
  head: () => ({ meta: [{ title: "Lesson Bank · skoolmate" }] }),
  component: LessonBankPage,
});

const TERMS: LessonTerm[] = ["Term 1", "Term 2", "Term 3", "Term 4"];

// Vibrant per-term palette (still classroom-appropriate, not neon).
const TERM_THEME: Record<LessonTerm, { grad: string; ring: string; chip: string; ink: string; accent: string }> = {
  "Term 1": {
    grad: "from-sky-400 via-sky-500 to-cyan-500",
    ring: "ring-sky-200",
    chip: "bg-sky-100 text-sky-800",
    ink: "text-sky-900",
    accent: "bg-sky-500",
  },
  "Term 2": {
    grad: "from-emerald-400 via-teal-500 to-emerald-600",
    ring: "ring-emerald-200",
    chip: "bg-emerald-100 text-emerald-800",
    ink: "text-emerald-900",
    accent: "bg-emerald-500",
  },
  "Term 3": {
    grad: "from-amber-400 via-orange-500 to-rose-500",
    ring: "ring-amber-200",
    chip: "bg-amber-100 text-amber-900",
    ink: "text-amber-900",
    accent: "bg-amber-500",
  },
  "Term 4": {
    grad: "from-violet-500 via-fuchsia-500 to-pink-500",
    ring: "ring-violet-200",
    chip: "bg-violet-100 text-violet-800",
    ink: "text-violet-900",
    accent: "bg-violet-500",
  },
};

function LessonBankPage() {
  const listFn = useServerFn(listWeeklyUploads);
  const query = useQuery({ queryKey: ["weekly-uploads"], queryFn: () => listFn() });
  const [openTerm, setOpenTerm] = useState<LessonTerm | null>(null);
  const [openWeek, setOpenWeek] = useState<{ term: LessonTerm; week: LessonWeek } | null>(null);
  const [q, setQ] = useState("");

  const uploads = query.data ?? [];
  const filtered = useMemo(() => {
    if (!q.trim()) return uploads;
    const n = q.toLowerCase();
    return uploads.filter((u) =>
      `${u.title} ${u.uploader_name ?? ""} ${u.class_name ?? ""}`.toLowerCase().includes(n),
    );
  }, [uploads, q]);

  // Rollups per term
  const termCounts = useMemo(() => {
    const c: Record<LessonTerm, { total: number; approved: number; pending: number; rejected: number }> = {
      "Term 1": { total: 0, approved: 0, pending: 0, rejected: 0 },
      "Term 2": { total: 0, approved: 0, pending: 0, rejected: 0 },
      "Term 3": { total: 0, approved: 0, pending: 0, rejected: 0 },
      "Term 4": { total: 0, approved: 0, pending: 0, rejected: 0 },
    };
    for (const u of filtered) {
      const t = c[u.term as LessonTerm]; if (!t) continue;
      t.total += 1;
      if (u.status === "approved") t.approved += 1;
      else if (u.status === "rejected") t.rejected += 1;
      else t.pending += 1;
    }
    return c;
  }, [filtered]);

  // Week-level rollup for the active term
  const weekMap = useMemo(() => {
    const m = new Map<LessonWeek, WeeklyUpload[]>();
    for (const w of LESSON_WEEKS) m.set(w, []);
    if (openTerm) for (const u of filtered) if (u.term === openTerm) m.get(u.week as LessonWeek)?.push(u);
    return m;
  }, [filtered, openTerm]);

  return (
    <AppShell>
      <PageHeader
        title="Lesson Bank"
        subtitle="Weekly lesson plans, organised by Term and Week — attach MS Word (.docx) plans from your computer, phone or drive."
        actions={
          <>
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search plans, teacher, class…"
                className="h-9 pl-8"
                data-guest-safe="true"
              />
            </div>
            {openTerm && (
              <Button variant="outline" size="sm" onClick={() => setOpenTerm(null)}>
                <ArrowLeft className="h-4 w-4" />All terms
              </Button>
            )}
          </>
        }
      />

      <div className="relative px-4 py-6 md:px-8">
        {/* Decorative brand graphics */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-56 overflow-hidden opacity-70">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="absolute left-1/3 -top-10 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
        </div>

        {/* Intro banner */}
        <Card className="relative z-10 mb-6 overflow-hidden border-primary/20 bg-gradient-to-r from-primary-soft/60 via-background to-background p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Four term folders · Twelve weeks each</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Open a term folder, then a week to <strong>attach or upload</strong> your weekly plan
                (<strong>MS Word .docx recommended</strong>). Leadership reviews each plan — you'll see
                <em> approved</em>, <em>pending</em>, <em>rejected</em> or <em>returned with comments</em> right on the folder.
              </p>
            </div>
            <Sparkles className="hidden h-5 w-5 text-primary/60 md:block" />
          </div>
        </Card>

        {/* Term folders (level 1) */}
        {!openTerm && (
          <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TERMS.map((term) => {
              const c = termCounts[term];
              const theme = TERM_THEME[term];
              return (
                <button
                  key={term}
                  onClick={() => setOpenTerm(term)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition",
                    "hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2",
                    theme.ring,
                  )}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-90", theme.grad)} />
                  <div className="relative flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/95 shadow-md ring-1 ring-black/5">
                      <Folder className={cn("h-7 w-7", theme.ink)} />
                    </div>
                    <Badge className="bg-white/95 text-foreground hover:bg-white">{c.total} plan{c.total === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="relative mt-10">
                    <p className={cn("text-lg font-bold tracking-tight", theme.ink)}>{term}</p>
                    <p className="text-xs text-muted-foreground">Weeks 1 – 12</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                        <CheckCircle2 className="mr-1 h-3 w-3" />{c.approved} approved
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                        <Clock3 className="mr-1 h-3 w-3" />{c.pending} pending
                      </Badge>
                      {c.rejected > 0 && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                          <XCircle className="mr-1 h-3 w-3" />{c.rejected} returned
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Week folders (level 2) */}
        {openTerm && (
          <div className="relative z-10">
            <div className={cn("mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r p-4 text-white shadow-sm", TERM_THEME[openTerm].grad)}>
              <FolderOpen className="h-6 w-6" />
              <div>
                <p className="text-lg font-bold">{openTerm}</p>
                <p className="text-xs text-white/90">Click a week folder to attach or view weekly lesson plans.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {LESSON_WEEKS.map((w) => {
                const list = weekMap.get(w) ?? [];
                const approved = list.filter((u) => u.status === "approved").length;
                const pending = list.filter((u) => u.status === "pending").length;
                const rejected = list.filter((u) => u.status === "rejected").length;
                const theme = TERM_THEME[openTerm];
                return (
                  <button
                    key={w}
                    onClick={() => setOpenWeek({ term: openTerm, week: w })}
                    className={cn(
                      "group flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition",
                      "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2",
                      theme.ring,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", theme.chip)}>
                        <Folder className="h-5 w-5" />
                      </div>
                      {list.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground">{list.length} file{list.length === 1 ? "" : "s"}</span>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">{w}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {approved > 0 && <Badge className="h-4 bg-emerald-100 px-1.5 text-[9px] text-emerald-800 hover:bg-emerald-100">{approved} approved</Badge>}
                      {pending > 0 && <Badge className="h-4 bg-amber-100 px-1.5 text-[9px] text-amber-800 hover:bg-amber-100">{pending} pending</Badge>}
                      {rejected > 0 && <Badge className="h-4 bg-rose-100 px-1.5 text-[9px] text-rose-700 hover:bg-rose-100">{rejected} returned</Badge>}
                      {list.length === 0 && (
                        <span className="text-[10px] italic text-muted-foreground">empty · click to attach</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {openWeek && (
        <WeekFolderDialog
          term={openWeek.term}
          week={openWeek.week}
          onClose={() => setOpenWeek(null)}
          uploads={uploads.filter((u) => u.term === openWeek.term && u.week === openWeek.week)}
        />
      )}
    </AppShell>
  );
}

function WeekFolderDialog({ term, week, uploads, onClose }: {
  term: LessonTerm; week: LessonWeek; uploads: WeeklyUpload[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const registerFn = useServerFn(registerWeeklyUpload);
  const reviewFn = useServerFn(reviewWeeklyUpload);
  const deleteFn = useServerFn(deleteWeeklyUpload);
  const signFn = useServerFn(signWeeklyUpload);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["weekly-uploads"] });

  const review = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected"; leadership_note?: string }) =>
      reviewFn({ data: v }),
    onSuccess: () => { invalidate(); toast.success("Review saved."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (v: { id: string; storage_path: string }) => deleteFn({ data: v }),
    onSuccess: () => { invalidate(); toast.success("File removed."); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to upload.");
      const className = window.prompt("Class this weekly plan is for (e.g. Rosella / P5 / Year 3)?", "") ?? undefined;
      for (const file of Array.from(files)) {
        const path = `${term}/${week}/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("lesson-uploads").upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (upErr) throw new Error(upErr.message);
        await registerFn({ data: {
          term, week, title: file.name, storage_path: path,
          content_type: file.type, size_bytes: file.size,
          uploader_name: user.user_metadata?.display_name ?? user.email ?? undefined,
          class_name: className?.trim() || undefined,
        }});
      }
      invalidate();
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"} to ${term} · ${week}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function openFile(u: WeeklyUpload) {
    try {
      const { url } = await signFn({ data: { path: u.storage_path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    }
  }

  const theme = TERM_THEME[term];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className={cn("-mx-6 -mt-6 mb-2 flex items-center gap-2 rounded-t-lg bg-gradient-to-r px-6 py-4 text-white", theme.grad)}>
            <FolderOpen className="h-5 w-5" />
            <DialogTitle className="text-white">{term} · {week}</DialogTitle>
          </div>
          <DialogDescription>
            Attach weekly lesson plans from your computer, phone or drive. Leadership will review and approve each plan.
          </DialogDescription>
        </DialogHeader>

        {/* Upload zone */}
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/20 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Attach weekly planners</p>
              <p className="text-[11px] text-muted-foreground">
                <strong>Preferred format: MS Word (.docx)</strong> — also accepts PDF, PPTX, JPG or PNG from computer, phone camera roll, Google Drive or OneDrive.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input ref={fileRef} type="file" hidden multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,image/*" onChange={(e) => handleFiles(e.target.files)} />
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-primary hover:bg-primary/90">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "From computer"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Smartphone className="h-4 w-4" />From phone
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Cloud className="h-4 w-4" />From drive
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* File list */}
        <div className="mt-4 space-y-2">
          {uploads.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No files uploaded yet for {term} · {week}. Attach a weekly planner above.
            </div>
          )}
          {uploads.map((u) => (
            <UploadRow key={u.id} upload={u} onOpen={() => openFile(u)} onReview={review.mutate} onDelete={() => del.mutate({ id: u.id, storage_path: u.storage_path })} />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadRow({ upload, onOpen, onReview, onDelete }: {
  upload: WeeklyUpload;
  onOpen: () => void;
  onReview: (v: { id: string; status: "approved" | "rejected"; leadership_note?: string }) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(upload.leadership_note ?? "");
  const [reviewing, setReviewing] = useState(false);
  const tone =
    upload.status === "approved" ? "border-emerald-200 bg-emerald-50/50" :
    upload.status === "rejected" ? "border-rose-200 bg-rose-50/50" :
    "border-amber-200 bg-amber-50/40";
  const StatusIcon =
    upload.status === "approved" ? CheckCircle2 :
    upload.status === "rejected" ? XCircle : Clock3;
  const statusText =
    upload.status === "approved" ? "Approved" :
    upload.status === "rejected" ? (upload.leadership_note ? "Returned with comments" : "Rejected") :
    "Pending leadership review";

  return (
    <div className={cn("rounded-lg border p-3", tone)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{upload.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {upload.uploader_name ?? "Teacher"}
            {upload.class_name ? ` · ${upload.class_name}` : ""}
            {" · "}
            {new Date(upload.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {upload.size_bytes ? ` · ${(upload.size_bytes / 1024).toFixed(0)} KB` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className={cn(
              "text-[10px]",
              upload.status === "approved" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
              upload.status === "rejected" && "bg-rose-100 text-rose-700 hover:bg-rose-100",
              upload.status === "pending" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
            )}>
              <StatusIcon className="mr-1 h-3 w-3" />{statusText}
            </Badge>
            {upload.leadership_note && <span className="text-[10px] italic text-muted-foreground">“{upload.leadership_note}”</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" onClick={onOpen}><Download className="h-3.5 w-3.5" />Open</Button>
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {reviewing ? (
        <div className="mt-3 space-y-2 rounded-md border bg-background p-2">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Leadership note or return-with-comments feedback…" className="text-xs" />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}>Cancel</Button>
            <Button size="sm" variant="outline" className="text-rose-700" onClick={() => { onReview({ id: upload.id, status: "rejected", leadership_note: note }); setReviewing(false); }}>
              <XCircle className="h-3.5 w-3.5" />Return
            </Button>
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={() => { onReview({ id: upload.id, status: "approved", leadership_note: note }); setReviewing(false); }}>
              <CheckCircle2 className="h-3.5 w-3.5" />Approve
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setReviewing(true)}>
            <ShieldCheck className="h-3.5 w-3.5" />Leadership review
          </Button>
        </div>
      )}
    </div>
  );
}
