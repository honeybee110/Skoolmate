import { createFileRoute, Link } from "@tanstack/react-router";
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
  Folder, FolderOpen, Search, CheckCircle2, ArrowLeft, FileText, ChevronRight, Sparkles, Upload,
  Cloud, Smartphone, HardDrive, Loader2, Clock3, XCircle, ShieldCheck, Trash2, Download,
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
  head: () => ({ meta: [{ title: "Weekly Lesson Bank · skoolmate" }] }),
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
  const listFn = useServerFn(listWeeklyUploads);
  const query = useQuery({ queryKey: ["weekly-uploads"], queryFn: () => listFn() });
  const [openWeek, setOpenWeek] = useState<{ term: LessonTerm; week: LessonWeek } | null>(null);
  const [q, setQ] = useState("");

  const uploads = query.data ?? [];
  const filtered = useMemo(() => {
    if (!q.trim()) return uploads;
    const n = q.toLowerCase();
    return uploads.filter((u) => `${u.title} ${u.uploader_name ?? ""}`.toLowerCase().includes(n));
  }, [uploads, q]);

  // Map term → week → uploads
  const grid = useMemo(() => {
    const m: Record<LessonTerm, Map<LessonWeek, WeeklyUpload[]>> = {
      "Term 1": new Map(), "Term 2": new Map(), "Term 3": new Map(), "Term 4": new Map(),
    };
    for (const t of TERMS) for (const w of LESSON_WEEKS) m[t].set(w, []);
    for (const u of filtered) m[u.term as LessonTerm]?.get(u.week as LessonWeek)?.push(u);
    return m;
  }, [filtered]);

  return (
    <AppShell>
      <PageHeader
        title="Lesson Bank"
        subtitle="Term 1 – 4 · Week 1 – 12 · click any week to attach or view weekly planners"
        actions={
          <>
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search uploaded plans…" className="h-9 pl-8" data-guest-safe="true" />
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
              <p className="text-sm font-semibold text-foreground">Bank vs Planner</p>
              <p className="text-xs text-muted-foreground">
                The <strong>Lesson Planner</strong> is where teachers draft with AI. The <strong>Lesson Bank</strong> is the
                shared library of weekly plans, organised by term and week. Click any week cell to attach files from your
                computer, phone or drive — <strong>Leadership</strong> reviews and approves each weekly plan.
              </p>
            </div>
          </div>
        </Card>

        {/* Grid: Terms across, Weeks down (matches sample layout) */}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-4 border-b bg-muted/40">
            {TERMS.map((t) => (
              <div key={t} className={cn("px-4 py-3 text-center text-sm font-bold uppercase tracking-wide border-r last:border-r-0", "text-foreground")}>
                {t}
              </div>
            ))}
          </div>
          <div className="divide-y">
            {LESSON_WEEKS.map((w) => (
              <div key={w} className="grid grid-cols-4">
                {TERMS.map((t) => {
                  const list = grid[t].get(w) ?? [];
                  const approved = list.filter((u) => u.status === "approved").length;
                  const pending = list.filter((u) => u.status === "pending").length;
                  return (
                    <button
                      key={t + w}
                      onClick={() => setOpenWeek({ term: t, week: w })}
                      className={cn(
                        "group flex flex-col items-center gap-1 border-r px-3 py-3 text-center transition last:border-r-0",
                        "hover:bg-primary-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Folder className="h-4 w-4 text-primary/70 group-hover:text-primary" />
                        <span className="text-sm font-semibold text-foreground">{w}</span>
                      </div>
                      {(approved > 0 || pending > 0) && (
                        <div className="flex gap-1">
                          {approved > 0 && <Badge className="h-4 bg-emerald-100 px-1.5 text-[9px] text-emerald-800 hover:bg-emerald-100">{approved} ✓</Badge>}
                          {pending > 0 && <Badge className="h-4 bg-amber-100 px-1.5 text-[9px] text-amber-800 hover:bg-amber-100">{pending} ⏳</Badge>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
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

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <DialogTitle>{term} · {week}</DialogTitle>
          </div>
          <DialogDescription>
            Upload your weekly plan from computer, phone or drive. Leadership will review and approve each plan.
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
                PDF, DOCX, PPTX, JPG or PNG — from computer, phone camera roll, Google Drive or OneDrive.
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
  const statusText = upload.status === "approved" ? "Approved" : upload.status === "rejected" ? "Rejected" : "Pending leadership review";

  return (
    <div className={cn("rounded-lg border p-3", tone)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{upload.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {upload.uploader_name ?? "Teacher"} · {new Date(upload.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Leadership note (optional)…" className="text-xs" />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}>Cancel</Button>
            <Button size="sm" variant="outline" className="text-rose-700" onClick={() => { onReview({ id: upload.id, status: "rejected", leadership_note: note }); setReviewing(false); }}>
              <XCircle className="h-3.5 w-3.5" />Reject
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
