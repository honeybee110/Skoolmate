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
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pin, PinOff, Plus, Search, Download, History, Archive, FileText, FileSpreadsheet,
  Presentation, FileType2, Send, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCuration, curationActions, type LeadershipTemplate, type TemplateCategory, type TemplateStatus,
} from "@/lib/curation-store";

export const Route = createFileRoute("/admin/templates")({
  head: () => ({
    meta: [
      { title: "Leadership Templates Library · skoolmate" },
      { name: "description", content: "Master IEP, lesson plan and handover templates — versioned, pinned to every class folder and read-only for teachers." },
      { property: "og:title", content: "Leadership Templates Library · skoolmate" },
      { property: "og:description", content: "Publish versioned master templates pinned to every P1–P15 and S1–S10 class folder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TemplatesLibrary,
});

const CATEGORIES: TemplateCategory[] = ["IEP", "Lesson Plan", "Handover", "Meeting", "Compliance"];
const SCOPES: LeadershipTemplate["scope"][] = ["All classes", "Primary (P1–P15)", "Secondary (S1–S10)"];
const FILE_TYPES: LeadershipTemplate["fileType"][] = ["docx", "xlsx", "pdf", "pptx"];

const fileMeta: Record<LeadershipTemplate["fileType"], { icon: typeof FileText; tone: string }> = {
  docx: { icon: FileText, tone: "bg-blue-100 text-blue-700" },
  xlsx: { icon: FileSpreadsheet, tone: "bg-emerald-100 text-emerald-700" },
  pdf: { icon: FileType2, tone: "bg-rose-100 text-rose-700" },
  pptx: { icon: Presentation, tone: "bg-amber-100 text-amber-700" },
};

const statusTone: Record<TemplateStatus, string> = {
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  archived: "bg-muted text-muted-foreground border-border",
};

const categoryTone: Record<TemplateCategory, string> = {
  IEP: "bg-primary/10 text-primary",
  "Lesson Plan": "bg-sky-100 text-sky-700",
  Handover: "bg-violet-100 text-violet-700",
  Meeting: "bg-teal-100 text-teal-700",
  Compliance: "bg-orange-100 text-orange-700",
};

function TemplatesLibrary() {
  const { templates } = useCuration();
  const [tab, setTab] = useState<TemplateStatus | "all">("published");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "All">("All");
  const [historyOf, setHistoryOf] = useState<LeadershipTemplate | null>(null);
  const [versionOf, setVersionOf] = useState<LeadershipTemplate | null>(null);
  const [versionNote, setVersionNote] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "IEP" as TemplateCategory, fileType: "docx" as LeadershipTemplate["fileType"],
    description: "", scope: "All classes" as LeadershipTemplate["scope"], owner: "Leadership", pinned: true, publish: true,
  });

  const counts = useMemo(() => ({
    published: templates.filter((t) => t.status === "published").length,
    draft: templates.filter((t) => t.status === "draft").length,
    archived: templates.filter((t) => t.status === "archived").length,
    pinned: templates.filter((t) => t.pinned && t.status === "published").length,
    downloads: templates.reduce((s, t) => s + t.downloads, 0),
  }), [templates]);

  const filtered = useMemo(() => templates.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (category !== "All" && t.category !== category) return false;
    if (q && !`${t.name} ${t.description} ${t.owner}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [templates, tab, category, q]);

  const createTemplate = () => {
    if (!form.name.trim()) { toast.error("Give the template a name."); return; }
    curationActions.addTemplate({
      name: form.name.trim(),
      category: form.category,
      fileType: form.fileType,
      description: form.description.trim() || "No description provided.",
      status: form.publish ? "published" : "draft",
      pinned: form.pinned,
      scope: form.scope,
      owner: form.owner,
    });
    toast.success(form.publish ? "Template published to class folders" : "Draft template saved");
    setNewOpen(false);
    setTab(form.publish ? "published" : "draft");
    setForm({ ...form, name: "", description: "" });
  };

  return (
    <RoleGate groups={["leadership"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Leadership Templates"
          subtitle="Master templates pinned to every class's IEP, Lesson Plan and Handover folders — versioned, read-only for teachers."
          actions={
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> New template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New leadership template</DialogTitle>
                  <DialogDescription>Published templates pin to the top of every class folder in scope.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Template name</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. IEP Goal Planner 2026" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as TemplateCategory })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">File type</label>
                      <Select value={form.fileType} onValueChange={(v) => setForm({ ...form, fileType: v as LeadershipTemplate["fileType"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{FILE_TYPES.map((f) => <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Applies to</label>
                    <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as LeadershipTemplate["scope"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What teachers use this for…" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Pin to class folders</div>
                      <div className="text-xs text-muted-foreground">Teachers can download but not edit or delete.</div>
                    </div>
                    <Switch checked={form.pinned} onCheckedChange={(v) => setForm({ ...form, pinned: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Publish now</div>
                      <div className="text-xs text-muted-foreground">Off keeps it as a leadership-only draft.</div>
                    </div>
                    <Switch checked={form.publish} onCheckedChange={(v) => setForm({ ...form, publish: v })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
                  <Button onClick={createTemplate}>Save template</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="space-y-4 px-4 py-6 md:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={ShieldCheck} label="Published" value={counts.published} tone="border-l-emerald-400 bg-emerald-50 text-emerald-700" />
            <Kpi icon={Pin} label="Pinned to class folders" value={counts.pinned} tone="border-l-primary bg-primary/5 text-primary" />
            <Kpi icon={Send} label="Drafts in review" value={counts.draft} tone="border-l-amber-400 bg-amber-50 text-amber-700" />
            <Kpi icon={Download} label="Teacher downloads" value={counts.downloads} tone="border-l-sky-400 bg-sky-50 text-sky-700" />
          </div>

          <Card className="flex flex-wrap items-center gap-2 p-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TemplateStatus | "all")}>
              <TabsList>
                <TabsTrigger value="published" className="text-xs">Published</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs">Drafts</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="h-9 pl-8" />
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1 text-xs">
              {(["All", ...CATEGORIES] as const).map((c) => (
                <button key={c} onClick={() => setCategory(c as TemplateCategory | "All")} className={cn("whitespace-nowrap rounded-md px-2 py-1 transition", category === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{c}</button>
              ))}
            </div>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.length === 0 && (
              <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">No templates match these filters.</Card>
            )}
            {filtered.map((t) => {
              const fm = fileMeta[t.fileType];
              const Icon = fm.icon;
              const latest = t.versions[0];
              return (
                <Card key={t.id} className="p-4 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", fm.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        <Badge variant="outline" className={cn("text-[10px]", statusTone[t.status])}>{t.status}</Badge>
                        <Badge variant="secondary" className={cn("text-[10px]", categoryTone[t.category])}>{t.category}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.scope} · v{latest?.version ?? 1} · {t.owner} · updated {latest ? new Date(latest.updatedAt).toLocaleDateString("en-AU") : "—"} · {t.downloads} downloads
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                    <Button size="sm" variant="outline" onClick={() => { curationActions.registerDownload(t.id); toast.success(`Downloading ${t.name}.${t.fileType}`); }}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistoryOf(t)}><History className="h-4 w-4" /> History</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setVersionOf(t); setVersionNote(""); }}><Send className="h-4 w-4" /> New version</Button>
                    <Button size="sm" variant="ghost" onClick={() => { curationActions.togglePinned(t.id); toast.success(t.pinned ? "Unpinned from class folders" : "Pinned to every class folder in scope"); }}>
                      {t.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1" />
                    {t.status !== "archived" ? (
                      <Button size="sm" variant="ghost" onClick={() => { curationActions.setTemplateStatus(t.id, "archived"); toast.success("Archived — removed from class folders"); }}>
                        <Archive className="h-4 w-4" /> Archive
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { curationActions.setTemplateStatus(t.id, "published"); toast.success("Restored and published"); }}>
                        Restore
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pin className="h-3.5 w-3.5" /> Pinned templates sit at the top of every P1–P15 and S1–S10 class folder. Teachers always see the latest version and cannot edit or delete them.
          </p>
        </div>

        {/* Version history */}
        <Dialog open={!!historyOf} onOpenChange={(o) => !o && setHistoryOf(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Version history</DialogTitle>
              <DialogDescription>{historyOf?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {historyOf?.versions.map((v, i) => (
                <div key={v.version} className="flex items-start gap-3 rounded-lg border p-3">
                  <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px]">v{v.version}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{v.note}</p>
                    <p className="text-xs text-muted-foreground">{v.updatedBy} · {new Date(v.updatedAt).toLocaleDateString("en-AU")}</p>
                  </div>
                  {i === 0 && <span className="text-[10px] uppercase tracking-widest text-primary">Current</span>}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish new version */}
        <Dialog open={!!versionOf} onOpenChange={(o) => !o && setVersionOf(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish new version</DialogTitle>
              <DialogDescription>{versionOf?.name} — teachers will immediately see the new version in their class folders.</DialogDescription>
            </DialogHeader>
            <Textarea rows={3} value={versionNote} onChange={(e) => setVersionNote(e.target.value)} placeholder="What changed in this version?" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setVersionOf(null)}>Cancel</Button>
              <Button onClick={() => {
                if (!versionOf) return;
                curationActions.publishVersion(versionOf.id, versionNote.trim());
                toast.success("New version published");
                setVersionOf(null);
              }}>Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </RoleGate>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Pin; label: string; value: number; tone: string }) {
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
