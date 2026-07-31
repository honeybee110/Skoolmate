import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Sparkles, Search, Upload, FileText, FileImage, FileSpreadsheet, Presentation,
  Loader2, ExternalLink, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Highlighter, Lock,
} from "lucide-react";
import {
  listDocuments, registerDocument, indexDocument, searchDocuments,
  getDocumentChunks, signDocument, deleteDocument,
  ACCESS_LEVELS,
  type IndexedDocument, type SearchHit, type DocumentAccessLevel,
} from "@/lib/doc-search.functions";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "AI Document Search · skoolmate" },
      { name: "description", content: "Ask for any plan, report or IEP in plain English — skoolmate reads every uploaded document and returns the exact section that answers you." },
      { property: "og:title", content: "AI Document Search · skoolmate" },
      { property: "og:description", content: "Semantic search across every uploaded school document — PDFs, Word, PowerPoint, Excel, images and text." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <DocumentSearch />
    </AppShell>
  ),
});

const EXAMPLES = [
  "Find Liam's Behaviour Support Plan",
  "Find every lesson about money",
  "Find all IEPs mentioning communication",
  "Find OT recommendations for Noah",
  "Find reports written by Honey",
];

const CATEGORIES = ["General", "IEP", "Lesson Plan", "Behaviour Support", "Allied Health", "Report", "Assessment", "Wellbeing", "Policy"];

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.rtf,.png,.jpg,.jpeg,.webp,.gif";

function iconFor(mime: string | null, title: string) {
  const t = `${mime ?? ""} ${title}`.toLowerCase();
  if (t.includes("image") || /\.(png|jpe?g|webp|gif)$/.test(t)) return FileImage;
  if (t.includes("sheet") || /\.(xlsx?|csv)$/.test(t)) return FileSpreadsheet;
  if (t.includes("presentation") || /\.pptx?$/.test(t)) return Presentation;
  return FileText;
}

function highlight(text: string, query: string) {
  const tokens = Array.from(new Set((query.toLowerCase().match(/[a-z0-9']{4,}/g) ?? []))).slice(0, 8);
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    re.test(part) && tokens.includes(part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-[color:var(--accent)]/30 px-0.5 text-foreground">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function DocumentSearch() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useServerFn(listDocuments);
  const register = useServerFn(registerDocument);
  const runIndex = useServerFn(indexDocument);
  const runSearch = useServerFn(searchDocuments);
  const loadChunks = useServerFn(getDocumentChunks);
  const sign = useServerFn(signDocument);
  const removeDoc = useServerFn(deleteDocument);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [uploading, setUploading] = useState(false);
  const [meta, setMeta] = useState({ category: "General", access_level: "all_staff" as DocumentAccessLevel, student_name: "", author_name: "" });
  const [viewer, setViewer] = useState<{ hit: SearchHit } | null>(null);

  const docsQuery = useQuery({ queryKey: ["documents"], queryFn: () => list({}) });
  const documents = (docsQuery.data ?? []) as IndexedDocument[];

  const search = useMutation({
    mutationFn: (q: string) => runSearch({ data: { query: q } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const indexing = useMutation({
    mutationFn: (id: string) => runIndex({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document indexed and searchable");
    },
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.error(e.message);
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!user) {
      toast.error("Sign in to upload documents.");
      return;
    }
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (error) throw new Error(error.message);
        const row = await register({
          data: {
            title: file.name,
            storage_path: path,
            mime_type: file.type || undefined,
            size_bytes: file.size,
            category: meta.category,
            access_level: meta.access_level,
            student_name: meta.student_name || undefined,
            author_name: meta.author_name || undefined,
            uploader_name: profile?.display_name || user.email || undefined,
          },
        });
        qc.invalidateQueries({ queryKey: ["documents"] });
        toast.success(`${file.name} uploaded — reading contents…`);
        indexing.mutate(row.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const readyCount = useMemo(() => documents.filter((d) => d.index_status === "ready").length, [documents]);
  const hits = (search.data ?? []) as SearchHit[];

  function submit(q: string) {
    const value = q.trim();
    if (value.length < 2) return;
    setQuery(value);
    setSubmitted(value);
    search.mutate(value);
  }

  return (
    <>
      <PageHeader
        title="AI Document Search"
        subtitle="Ask in plain English. Every uploaded PDF, Word, PowerPoint, Excel, image and text file is read and indexed — results are ranked by meaning, not filenames."
        actions={
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" /> {readyCount} document{readyCount === 1 ? "" : "s"} indexed
          </Badge>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <Card className="overflow-hidden border-[color:var(--primary)]/20">
          <div className="bg-gradient-to-r from-[color:var(--primary)]/10 via-[color:var(--accent)]/10 to-transparent p-5">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                submit(query);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Find OT recommendations for Noah"
                  className="h-11 pl-9 text-base"
                  aria-label="Search documents"
                />
              </div>
              <Button type="submit" className="h-11 gap-2" disabled={search.isPending}>
                {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Search
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => submit(ex)}
                  className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground transition hover:border-[color:var(--primary)] hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results */}
        {search.isPending && (
          <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the document index…
          </Card>
        )}

        {!search.isPending && submitted && hits.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">
            Nothing matched “{submitted}”. Upload the document below, or try describing the content instead of the file name.
          </Card>
        )}

        {hits.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {hits.length} result{hits.length === 1 ? "" : "s"} for “{submitted}”
            </h2>
            {hits.map((hit, i) => {
              const Icon = iconFor(hit.document.mime_type, hit.document.title);
              const pct = Math.round(hit.score * 100);
              return (
                <Card key={hit.document.id} className="p-4 transition hover:shadow-md">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                        <h3 className="truncate font-semibold">{hit.document.title}</h3>
                        <Badge variant="outline">{hit.document.category}</Badge>
                        {hit.document.student_name && <Badge variant="secondary">{hit.document.student_name}</Badge>}
                        {hit.document.author_name && (
                          <Badge variant="secondary">by {hit.document.author_name}</Badge>
                        )}
                      </div>
                      <p className="mt-2 rounded-md border-l-2 border-[color:var(--accent)] bg-muted/40 p-3 text-sm leading-relaxed">
                        {highlight(hit.snippet, submitted)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Highlighter className="h-3.5 w-3.5" />
                          {hit.bestSectionLabel ?? `Section ${hit.bestChunkIndex}`}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          Relevance
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full bg-[color:var(--primary)]" style={{ width: `${pct}%` }} />
                          </span>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setViewer({ hit })}>Open & highlight</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload / library */}
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Document library</h2>
              <p className="text-sm text-muted-foreground">
                Upload from your computer, another drive or a shared folder — PDF, Word, PowerPoint, Excel, images and text are all read and indexed.
              </p>
            </div>
            <Button className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload documents
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-muted-foreground">
              Category
              <select
                value={meta.category}
                onChange={(e) => setMeta({ ...meta, category: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Who can see this
              <select
                value={meta.access_level}
                onChange={(e) => setMeta({ ...meta, access_level: e.target.value as DocumentAccessLevel })}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              >
                {ACCESS_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Student (optional)
              <Input className="mt-1 h-9" value={meta.student_name} onChange={(e) => setMeta({ ...meta, student_name: e.target.value })} placeholder="e.g. Liam" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Written by (optional)
              <Input className="mt-1 h-9" value={meta.author_name} onChange={(e) => setMeta({ ...meta, author_name: e.target.value })} placeholder="e.g. Honey" />
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="mt-4 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            Drag and drop files here to index them.
          </div>

          <div className="mt-4 divide-y rounded-lg border">
            {docsQuery.isLoading && <div className="p-4 text-sm text-muted-foreground">Loading library…</div>}
            {!docsQuery.isLoading && documents.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No documents indexed yet.</div>
            )}
            {documents.map((doc) => {
              const Icon = iconFor(doc.mime_type, doc.title);
              return (
                <div key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{doc.title}</span>
                  <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  <AccessBadge level={doc.access_level} />
                  <StatusBadge status={doc.index_status} error={doc.index_error} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    disabled={indexing.isPending}
                    onClick={() => indexing.mutate(doc.id)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Re-index
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const { url } = await sign({ data: { path: doc.storage_path } });
                        window.open(url, "_blank", "noopener");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not open file");
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await removeDoc({ data: { id: doc.id, path: doc.storage_path } });
                        qc.invalidateQueries({ queryKey: ["documents"] });
                        toast.success("Document removed");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not delete");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Sheet open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {viewer && (
            <DocumentViewer
              hit={viewer.hit}
              query={submitted}
              loadChunks={loadChunks}
              sign={sign}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function AccessBadge({ level }: { level: DocumentAccessLevel }) {
  if (!level || level === "all_staff") return null;
  const label = ACCESS_LEVELS.find((a) => a.value === level)?.label ?? level;
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Lock className="h-3 w-3" /> {label}
    </Badge>
  );
}

function StatusBadge({ status, error }: { status: IndexedDocument["index_status"]; error: string | null }) {
  if (status === "ready") {
    return <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3" /> Indexed</Badge>;
  }
  if (status === "failed") {
    return <Badge variant="destructive" className="gap-1" title={error ?? undefined}><AlertTriangle className="h-3 w-3" /> Failed</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {status === "indexing" ? "Reading" : "Queued"}</Badge>;
}

function DocumentViewer({
  hit,
  query,
  loadChunks,
  sign,
}: {
  hit: SearchHit;
  query: string;
  loadChunks: ReturnType<typeof useServerFn<typeof getDocumentChunks>>;
  sign: ReturnType<typeof useServerFn<typeof signDocument>>;
}) {
  const chunks = useQuery({
    queryKey: ["document-chunks", hit.document.id],
    queryFn: () => loadChunks({ data: { id: hit.document.id } }),
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle className="pr-8">{hit.document.title}</SheetTitle>
      </SheetHeader>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{hit.document.category}</Badge>
        {hit.document.student_name && <Badge variant="secondary">{hit.document.student_name}</Badge>}
        {hit.document.author_name && <Badge variant="secondary">by {hit.document.author_name}</Badge>}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1"
          onClick={async () => {
            try {
              const { url } = await sign({ data: { path: hit.document.storage_path } });
              window.open(url, "_blank", "noopener");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not open the original file");
            }
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open original
        </Button>
      </div>

      <div className="mt-4 rounded-lg border-l-4 border-[color:var(--accent)] bg-[color:var(--accent)]/10 p-3 text-sm">
        <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Highlighter className="h-3.5 w-3.5" /> Section that answered your search
        </p>
        {highlight(hit.snippet, query)}
      </div>

      <div className="mt-5 space-y-3 pb-10">
        {chunks.isLoading && <p className="text-sm text-muted-foreground">Loading document text…</p>}
        {(chunks.data ?? []).map((c) => {
          const isMatch = c.chunk_index === hit.bestChunkIndex;
          const isSupporting = hit.supporting.some((s) => s.chunkIndex === c.chunk_index);
          return (
            <div
              key={c.chunk_index}
              className={cn(
                "rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap",
                isMatch && "border-[color:var(--accent)] bg-[color:var(--accent)]/10 ring-1 ring-[color:var(--accent)]",
                !isMatch && isSupporting && "border-[color:var(--primary)]/40 bg-[color:var(--primary)]/5",
              )}
            >
              <p className="mb-1 text-xs font-medium text-muted-foreground">{c.section_label ?? `Section ${c.chunk_index}`}</p>
              {isMatch || isSupporting ? highlight(c.content, query) : c.content}
            </div>
          );
        })}
      </div>
    </>
  );
}
