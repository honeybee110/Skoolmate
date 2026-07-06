import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  documentCentreTree,
  documentCentreStats,
  findNode,
  nodePath,
  searchNodes,
  type DocNode,
} from "@/lib/document-centre";
import {
  Folder, FolderOpen, FileText, FileImage, FileSpreadsheet, Presentation,
  Search, Upload, Pin, ChevronRight, Home, Download, MoreVertical, Plus,
  ShieldCheck, GraduationCap, ClipboardList, HeartPulse, BookOpen, Users,
  Landmark, AlertTriangle, Archive, MessageSquare, Award, ScrollText,
  Stethoscope, Activity, Sparkles, Layers, Book,
} from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Document Centre · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <DocumentCentre />
      </AppShell>
    </RoleGate>
  ),
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  iep: GraduationCap, lesson: BookOpen, handover: ClipboardList, report: ScrollText,
  policy: ShieldCheck, pd: Award, form: FileText, medical: Stethoscope,
  behaviour: Activity, wellbeing: HeartPulse, curriculum: Book, assessment: ClipboardList,
  compliance: ShieldCheck, resource: Sparkles, staff: Users, communication: MessageSquare,
  governance: Landmark, incident: AlertTriangle, archive: Archive, class: Layers,
  semester: Folder, pinned: Pin, uploads: Upload, doc: FileText, pdf: FileText,
  image: FileImage, sheet: FileSpreadsheet, slides: Presentation,
};

function iconFor(node: DocNode) {
  const C = ICONS[node.icon] ?? (node.kind === "folder" ? Folder : FileText);
  return C;
}

function DocumentCentre() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [localFolders, setLocalFolders] = useState<Record<string, string[]>>({});
  const [localFiles, setLocalFiles] = useState<Record<string, { name: string; size: number; at: string }[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = currentId ? findNode(currentId) : null;
  const crumbs = currentId ? nodePath(currentId) : [];
  const children = current?.children ?? documentCentreTree;
  const searchResults = useMemo(() => (query ? searchNodes(query) : []), [query]);

  const scopeKey = currentId ?? "__root";
  const extraFolders = localFolders[scopeKey] ?? [];
  const extraFiles = localFiles[scopeKey] ?? [];

  const folders = children.filter((n) => n.kind === "folder");
  const files = children.filter((n) => n.kind === "file");
  // Pinned first
  folders.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  function handleNewFolder() {
    const name = window.prompt("New folder name?");
    if (!name?.trim()) return;
    setLocalFolders((m) => ({ ...m, [scopeKey]: [...(m[scopeKey] ?? []), name.trim()] }));
    toast.success(`Folder “${name.trim()}” created here.`);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    const added = Array.from(list).map((f) => ({ name: f.name, size: f.size, at: new Date().toLocaleString("en-AU") }));
    setLocalFiles((m) => ({ ...m, [scopeKey]: [...(m[scopeKey] ?? []), ...added] }));
    toast.success(`Uploaded ${added.length} file${added.length === 1 ? "" : "s"} from your device.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <>
      <PageHeader
        title="Document Centre"
        subtitle="Cloud-drive workspace for the whole school — IEPs, plans, handovers, policies, PD and more."
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={Folder} label="Top-level folders" value={documentCentreStats.topFolders} />
          <StatTile icon={Layers} label="Classes seeded" value={documentCentreStats.classes} note="P1–P15 · S1–S10" />
          <StatTile icon={Pin} label="Auto-seeded subfolders" value={documentCentreStats.autoSeeded} note="3 sections × 25 × 2 sem × 2" />
          <StatTile icon={ShieldCheck} label="Leadership templates" value="Pinned" note="Undeletable by teachers" />
        </div>

        {/* Toolbar */}
        <Card className="p-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 flex-1">
            <button
              onClick={() => setCurrentId(null)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" /> Document Centre
            </button>
            {crumbs.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 min-w-0">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => setCurrentId(c.id)}
                  className="truncate hover:text-foreground max-w-[180px]"
                  title={c.name}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files & folders…"
              className="pl-7 h-9 w-64"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleNewFolder}>
            <Plus className="h-3.5 w-3.5" /> New folder
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleUploadClick} title="Upload from computer, phone or drive">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        </Card>

        {/* Search results overlay */}
        {query ? (
          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {searchResults.length} results for "{query}"
            </div>
            <ul className="divide-y">
              {searchResults.map((n) => {
                const Icon = iconFor(n);
                const path = nodePath(n.id).slice(0, -1).map((p) => p.name).join(" / ");
                return (
                  <li key={n.id}>
                    <button
                      className="w-full text-left flex items-center gap-3 py-2 hover:bg-muted/50 rounded px-2"
                      onClick={() => {
                        setQuery("");
                        setCurrentId(n.kind === "folder" ? n.id : nodePath(n.id).slice(-2, -1)[0]?.id ?? null);
                      }}
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{n.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{path || "Document Centre"}</div>
                      </div>
                      {n.pinned && <Badge variant="outline" className="text-[10px] gap-1"><Pin className="h-3 w-3" />Pinned</Badge>}
                    </button>
                  </li>
                );
              })}
              {searchResults.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">No matches.</li>
              )}
            </ul>
          </Card>
        ) : (
          <>
            {current?.description && (
              <p className="text-sm text-muted-foreground">{current.description}</p>
            )}

            {/* Folder grid */}
            {folders.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Folders</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {folders.map((f) => {
                    const Icon = iconFor(f);
                    const childCount = f.children?.length ?? 0;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setCurrentId(f.id)}
                        className={`group text-left rounded-xl border bg-card p-3 hover:border-primary/50 hover:shadow-sm transition ${f.pinned ? "border-amber-200 bg-amber-50/40" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.pinned ? "bg-amber-100 text-amber-700" : "bg-primary-soft text-primary"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="text-sm font-medium truncate">{f.name}</div>
                              {f.pinned && <Pin className="h-3 w-3 text-amber-600 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {childCount} item{childCount === 1 ? "" : "s"}
                              {f.leadershipOnly && " · Leadership only"}
                            </div>
                          </div>
                          <FolderOpen className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File table */}
            {files.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">Files</div>
                <Card className="divide-y">
                  {files.map((f) => {
                    const Icon = iconFor(f);
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate flex items-center gap-1.5">
                            {f.name}
                            {f.pinned && <Badge variant="outline" className="text-[10px] gap-1"><Pin className="h-3 w-3" />Template</Badge>}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {f.sizeKb ? `${f.sizeKb} KB` : "—"}
                            {f.updatedAt && ` · Updated ${f.updatedAt}`}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* Locally-added folders & files (session) */}
            {(extraFolders.length > 0 || extraFiles.length > 0) && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">Added this session</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {extraFolders.map((n) => (
                    <div key={n} className="rounded-xl border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Folder className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{n}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">New folder</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {extraFiles.length > 0 && (
                  <Card className="divide-y mt-2">
                    {extraFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-[11px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB · {f.at}</div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {folders.length === 0 && files.length === 0 && extraFolders.length === 0 && extraFiles.length === 0 && (
              <Card className="p-10 text-center">
                <Folder className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">This folder is empty</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload files or create a subfolder to get started.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleNewFolder}><Plus className="h-3.5 w-3.5" />New folder</Button>
                  <Button size="sm" className="gap-1.5" onClick={handleUploadClick}><Upload className="h-3.5 w-3.5" />Upload</Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {note && <div className="text-[11px] text-muted-foreground mt-0.5">{note}</div>}
    </Card>
  );
}
