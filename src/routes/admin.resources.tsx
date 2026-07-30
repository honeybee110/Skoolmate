import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Library, Search, Check, Undo2, Archive, Star, Upload, Tag, FileText, Video, Image as ImgIcon,
  Music2, BookOpen, Sparkles, Clock, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCuration, curationActions, type CuratedResource, type ResourceKind, type ResourceStatus,
} from "@/lib/curation-store";

export const Route = createFileRoute("/admin/resources")({
  head: () => ({
    meta: [
      { title: "Resource Curation · Leadership · skoolmate" },
      { name: "description", content: "Approve, tag, feature and retire school-wide teaching resources from one leadership curation queue." },
      { property: "og:title", content: "Resource Curation · skoolmate Leadership" },
      { property: "og:description", content: "Leadership review queue for teacher-submitted resources, curriculum tagging and bulk imports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResourceCuration,
});

const kindMeta: Record<ResourceKind, { label: string; icon: typeof FileText; tone: string }> = {
  worksheet: { label: "Worksheet", icon: FileText, tone: "bg-blue-100 text-blue-700" },
  video: { label: "Video", icon: Video, tone: "bg-rose-100 text-rose-700" },
  visual: { label: "Visual", icon: ImgIcon, tone: "bg-violet-100 text-violet-700" },
  song: { label: "Song", icon: Music2, tone: "bg-amber-100 text-amber-700" },
  lesson: { label: "Lesson", icon: BookOpen, tone: "bg-emerald-100 text-emerald-700" },
  aac: { label: "AAC", icon: Sparkles, tone: "bg-teal-100 text-teal-700" },
};

const statusMeta: Record<ResourceStatus, { label: string; tone: string }> = {
  pending: { label: "Pending review", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  returned: { label: "Returned", tone: "bg-orange-100 text-orange-800 border-orange-200" },
  retired: { label: "Retired", tone: "bg-muted text-muted-foreground border-border" },
};

const TABS: Array<{ key: ResourceStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "returned", label: "Returned" },
  { key: "retired", label: "Retired" },
  { key: "all", label: "All" },
];

const SUBJECTS = ["All", "English", "Maths", "Science", "History", "Personal & Social", "PE", "Music", "Learn to Play"];

function ResourceCuration() {
  const { resources } = useCuration();
  const [tab, setTab] = useState<ResourceStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [returnTarget, setReturnTarget] = useState<CuratedResource | null>(null);
  const [returnNote, setReturnNote] = useState("");
  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [tagTarget, setTagTarget] = useState<CuratedResource | null>(null);
  const [tagDescriptor, setTagDescriptor] = useState("");
  const [tagLevels, setTagLevels] = useState("");
  const [tagTags, setTagTags] = useState("");

  const counts = useMemo(() => ({
    pending: resources.filter((r) => r.status === "pending").length,
    approved: resources.filter((r) => r.status === "approved").length,
    returned: resources.filter((r) => r.status === "returned").length,
    retired: resources.filter((r) => r.status === "retired").length,
    featured: resources.filter((r) => r.featured).length,
    untagged: resources.filter((r) => !r.descriptor).length,
  }), [resources]);

  const filtered = useMemo(() => resources.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (subject !== "All" && r.subject !== subject) return false;
    if (q && !`${r.title} ${r.source} ${r.submittedBy} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [resources, tab, subject, q]);

  const allShownSelected = filtered.length > 0 && filtered.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allShownSelected ? [] : filtered.map((r) => r.id));
  const toggleOne = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const bulk = (status: ResourceStatus, verb: string) => {
    if (selected.length === 0) return;
    curationActions.bulkSetStatus(selected, status);
    toast.success(`${selected.length} resource${selected.length > 1 ? "s" : ""} ${verb}`);
    setSelected([]);
  };

  const runImport = () => {
    const rows = importText.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const [title, source, kind, subj] = line.split(",").map((s) => s?.trim());
      return {
        title: title || "Untitled resource",
        source: source || "Bulk import",
        kind: (Object.keys(kindMeta).includes(kind ?? "") ? kind : "worksheet") as ResourceKind,
        subject: subj || "English",
      };
    });
    if (rows.length === 0) { toast.error("Add at least one line to import."); return; }
    const n = curationActions.importResources(rows);
    toast.success(`${n} resource${n > 1 ? "s" : ""} queued for review`);
    setImportText("");
    setImportOpen(false);
    setTab("pending");
  };

  const openTagger = (r: CuratedResource) => {
    setTagTarget(r);
    setTagDescriptor(r.descriptor ?? "");
    setTagLevels(r.levels.join(", "));
    setTagTags(r.tags.join(", "));
  };

  const saveTags = () => {
    if (!tagTarget) return;
    curationActions.updateResource(tagTarget.id, {
      descriptor: tagDescriptor.trim() || undefined,
      levels: tagLevels.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tagTags.split(",").map((s) => s.trim()).filter(Boolean),
    });
    toast.success("Tags updated");
    setTagTarget(null);
  };

  return (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Resource Curation"
          subtitle="Review teacher submissions, tag to the Victorian Curriculum, feature the best, and retire what's outdated."
          actions={
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" /> Bulk import</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk import resources</DialogTitle>
                  <DialogDescription>
                    One per line: <code>Title, Source, kind, Subject</code> — e.g. <code>Number line 0–20, Twinkl, worksheet, Maths</code>.
                    Imports land in the Pending queue.
                  </DialogDescription>
                </DialogHeader>
                <Textarea rows={7} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"Number line 0–20, Twinkl, worksheet, Maths\nPODD 15 core board, PODD, aac, English"} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button onClick={runImport}>Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="space-y-4 px-4 py-6 md:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Clock} label="Awaiting review" value={counts.pending} tone="border-l-amber-400 text-amber-700 bg-amber-50" />
            <KpiCard icon={ShieldCheck} label="Approved school-wide" value={counts.approved} tone="border-l-emerald-400 text-emerald-700 bg-emerald-50" />
            <KpiCard icon={Star} label="Featured picks" value={counts.featured} tone="border-l-primary text-primary bg-primary/5" />
            <KpiCard icon={Tag} label="Missing curriculum tag" value={counts.untagged} tone="border-l-rose-400 text-rose-700 bg-rose-50" />
          </div>

          <Card className="flex flex-wrap items-center gap-2 p-3">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as ResourceStatus | "all"); setSelected([]); }}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    {t.label}
                    {t.key !== "all" && <span className="ml-1.5 text-[10px] opacity-70">{counts[t.key as keyof typeof counts]}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, source, teacher…" className="h-9 pl-8" />
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSubject(s)} className={cn("whitespace-nowrap rounded-md px-2 py-1 transition", subject === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{s}</button>
              ))}
            </div>
          </Card>

          {selected.length > 0 && (
            <Card className="flex flex-wrap items-center gap-2 border-primary/30 bg-primary/5 p-3 text-sm">
              <span className="font-medium">{selected.length} selected</span>
              <div className="flex-1" />
              <Button size="sm" onClick={() => bulk("approved", "approved")}><Check className="h-4 w-4" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => bulk("returned", "returned to teachers")}><Undo2 className="h-4 w-4" /> Return</Button>
              <Button size="sm" variant="outline" onClick={() => bulk("retired", "retired")}><Archive className="h-4 w-4" /> Retire</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </Card>
          )}

          <Card className="p-3">
            <label className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <Checkbox checked={allShownSelected} onCheckedChange={toggleAll} /> Select all shown ({filtered.length})
            </label>

            <div className="space-y-2">
              {filtered.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">Nothing here — the queue is clear.</p>
              )}
              {filtered.map((r) => {
                const meta = kindMeta[r.kind];
                const Icon = meta.icon;
                const st = statusMeta[r.status];
                return (
                  <div key={r.id} className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40">
                    <Checkbox className="mt-1" checked={selected.includes(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{r.title}</span>
                        {r.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
                        <Badge variant="outline" className={cn("text-[10px]", st.tone)}>{st.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.source} · {r.subject}
                        {r.levels.length > 0 && ` · Level ${r.levels.join("/")}`}
                        {r.descriptor ? ` · ${r.descriptor}` : " · no curriculum tag"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Submitted by {r.submittedBy} · {new Date(r.submittedAt).toLocaleDateString("en-AU")}
                      </p>
                      {r.reviewNote && <p className="mt-1 rounded-md bg-muted px-2 py-1 text-xs">Leadership note: {r.reviewNote}</p>}
                      {r.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => openTagger(r)}><Tag className="h-4 w-4" /> Tag</Button>
                      <Button size="sm" variant="ghost" onClick={() => { curationActions.toggleFeatured(r.id); toast.success(r.featured ? "Removed from featured" : "Featured for teachers"); }}>
                        <Star className={cn("h-4 w-4", r.featured && "fill-amber-400 text-amber-500")} />
                      </Button>
                      {r.status !== "approved" && (
                        <Button size="sm" onClick={() => { curationActions.setResourceStatus(r.id, "approved"); toast.success("Approved — now visible school-wide"); }}>
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                      )}
                      {r.status !== "returned" && (
                        <Button size="sm" variant="outline" onClick={() => { setReturnTarget(r); setReturnNote(""); }}>
                          <Undo2 className="h-4 w-4" /> Return
                        </Button>
                      )}
                      {r.status !== "retired" && (
                        <Button size="sm" variant="outline" onClick={() => { curationActions.setResourceStatus(r.id, "retired"); toast.success("Retired — existing lesson plans keep their link"); }}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Library className="h-3.5 w-3.5" /> Retiring a resource hides it from the teacher Resource Bank but keeps historical lesson plan links intact.
          </p>
        </div>

        {/* Return with comments */}
        <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return to teacher</DialogTitle>
              <DialogDescription>{returnTarget?.title} — {returnTarget?.submittedBy} will see your comment.</DialogDescription>
            </DialogHeader>
            <Textarea rows={4} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="What needs changing before this can be approved?" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnTarget(null)}>Cancel</Button>
              <Button onClick={() => {
                if (!returnTarget) return;
                curationActions.setResourceStatus(returnTarget.id, "returned", returnNote.trim() || "Returned for revision.");
                toast.success("Returned with comments");
                setReturnTarget(null);
              }}>Send back</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tagging */}
        <Dialog open={!!tagTarget} onOpenChange={(o) => !o && setTagTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tag resource</DialogTitle>
              <DialogDescription>{tagTarget?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Victorian Curriculum descriptor</label>
                <Input value={tagDescriptor} onChange={(e) => setTagDescriptor(e.target.value)} placeholder="e.g. VC2M1N01" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Levels (comma separated)</label>
                <Input value={tagLevels} onChange={(e) => setTagLevels(e.target.value)} placeholder="A, B, C" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tags</label>
                <Input value={tagTags} onChange={(e) => setTagTags(e.target.value)} placeholder="numeracy, fine-motor" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTagTarget(null)}>Cancel</Button>
              <Button onClick={saveTags}>Save tags</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </RoleGate>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: number; tone: string }) {
  return (
    <Card className={cn("flex items-center gap-3 border-l-4 p-4", tone)}>
      <Icon className="h-5 w-5" />
      <div>
        <div className="text-2xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-xs opacity-80">{label}</div>
      </div>
    </Card>
  );
}
