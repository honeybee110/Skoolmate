import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, Search, FolderKanban, ClipboardCheck, ShieldCheck,
  FileDown, MessageSquarePlus, ArrowLeftRight, History, Pin,
  Users, Filter, CheckCircle2, AlertCircle, Clock, ExternalLink, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { availableSemesters, currentSemester, type Semester } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/ieps")({
  head: () => ({ meta: [{ title: "IEP Management · skoolmate" }] }),
  component: AdminIepManagement,
});

// ---------- Class registry ----------

type ClassStage = "Primary" | "Secondary";
interface ClassRow {
  code: string;
  stage: ClassStage;
  teacher: string;
  students: number;
  completion: number;
  approval: "not-started" | "in-progress" | "pending" | "approved" | "returned";
  lastUpdated: string;
}

const TEACHERS = [
  "Honey Reyes", "Marcus Wu", "Priya Shah", "Aisha Kone", "Tom Berger",
  "Lena Park", "Nina Rossi", "Jamal Idris", "Kate Lynch", "Sofia Meyer",
  "David Wong", "Ella Todd", "Ravi Naidu", "Grace Kim", "Ben Foster",
  "Chloe Adams", "Isaac Bell", "Maya Cohen", "Nate Ford", "Olive Green",
  "Piper Hall", "Quinn Ives", "Riley Jung", "Sam King", "Tara Lowe",
];

const seedClasses: ClassRow[] = [
  ...Array.from({ length: 15 }, (_, i) => {
    const idx = i;
    const completion = [85, 92, 60, 45, 100, 78, 33, 88, 55, 70, 95, 20, 68, 82, 40][idx];
    const approval = (
      completion === 100 ? "approved" :
      completion >= 80 ? "pending" :
      completion >= 40 ? "in-progress" :
      completion > 0 ? "in-progress" : "not-started"
    ) as ClassRow["approval"];
    return {
      code: `P${idx + 1}`, stage: "Primary" as const,
      teacher: TEACHERS[idx],
      students: 6 + (idx % 4),
      completion, approval,
      lastUpdated: ["Today 09:30","Yesterday","2 days ago","3 days ago","Today 12:00","Today 14:20","Last week","Today 08:00","3 days ago","Yesterday","Today 15:45","Last week","Yesterday","Today 10:10","2 days ago"][idx],
    };
  }),
  ...Array.from({ length: 10 }, (_, i) => {
    const idx = i;
    const completion = [70, 100, 50, 88, 30, 92, 60, 40, 75, 100][idx];
    const approval = (
      completion === 100 ? "approved" :
      completion >= 80 ? "pending" :
      completion >= 40 ? "in-progress" :
      "not-started"
    ) as ClassRow["approval"];
    return {
      code: `S${idx + 1}`, stage: "Secondary" as const,
      teacher: TEACHERS[15 + idx],
      students: 7 + (idx % 3),
      completion, approval,
      lastUpdated: ["Today","Yesterday","Today","3 days ago","Last week","Today","Yesterday","2 days ago","Today","Today 16:00"][idx],
    };
  }),
];

const APPROVAL_META: Record<ClassRow["approval"], { label: string; tone: string; icon: React.ComponentType<{className?:string}> }> = {
  "not-started":  { label: "Not started",   tone: "bg-slate-100 text-slate-600", icon: Clock },
  "in-progress":  { label: "In progress",   tone: "bg-orange-100 text-orange-700", icon: Clock },
  pending:        { label: "Pending review", tone: "bg-amber-100 text-amber-800", icon: AlertCircle },
  approved:       { label: "Approved",      tone: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  returned:       { label: "Returned",      tone: "bg-rose-100 text-rose-700", icon: AlertCircle },
};

function AdminIepManagement() {
  const [semester, setSemester] = useState<Semester>(currentSemester);
  const [stage, setStage] = useState<ClassStage | "all">("all");
  const [status, setStatus] = useState<ClassRow["approval"] | "all">("all");
  const [q, setQ] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);

  const rows = useMemo(() => seedClasses.filter((r) => {
    if (stage !== "all" && r.stage !== stage) return false;
    if (status !== "all" && r.approval !== status) return false;
    if (q && !`${r.code} ${r.teacher}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [stage, status, q]);

  const summary = useMemo(() => {
    const all = seedClasses;
    return {
      total: all.length,
      approved: all.filter((c) => c.approval === "approved").length,
      pending: all.filter((c) => c.approval === "pending").length,
      inProgress: all.filter((c) => c.approval === "in-progress").length,
      avg: Math.round(all.reduce((a, c) => a + c.completion, 0) / all.length),
    };
  }, []);

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Whole-School IEP Management"
        subtitle="Every class · every semester · every approval · with leadership templates pinned per class"
        actions={
          <>
            <Button variant="outline" size="sm"><FileDown className="h-4 w-4" />Export Semester Report</Button>
            <Button size="sm" className="bg-navy text-white hover:bg-navy-light"><ShieldCheck className="h-4 w-4" />Approvals Queue</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-6 md:grid-cols-5 md:px-8">
        <SummaryCard label="Total classes" value={summary.total} icon={<GraduationCap className="h-4 w-4" />} navy />
        <SummaryCard label="Approved" value={summary.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <SummaryCard label="Pending review" value={summary.pending} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} />
        <SummaryCard label="In progress" value={summary.inProgress} icon={<Clock className="h-4 w-4 text-orange-600" />} />
        <SummaryCard label="Avg completion" value={`${summary.avg}%`} icon={<ClipboardCheck className="h-4 w-4 text-primary" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 md:px-8">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          {availableSemesters.map((s) => (
            <button key={s} onClick={() => setSemester(s)}
              className={cn("rounded-md px-2.5 py-1 transition whitespace-nowrap",
                semester === s ? "bg-navy text-white" : "hover:bg-secondary")}>
              {s.replace(" · 2026", "")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          {(["all","Primary","Secondary"] as const).map((v) => (
            <button key={v} onClick={() => setStage(v)}
              className={cn("rounded-md px-2.5 py-1 transition",
                stage === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
              {v === "all" ? "All stages" : v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          {(["all","not-started","in-progress","pending","approved"] as const).map((v) => (
            <button key={v} onClick={() => setStatus(v)}
              className={cn("rounded-md px-2 py-1 transition capitalize",
                status === v ? "bg-secondary-foreground text-secondary" : "hover:bg-secondary")}>
              {v === "all" ? "All" : APPROVAL_META[v as ClassRow["approval"]].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search P1, S3, teacher…" className="pl-8 h-9" />
        </div>
      </div>

      <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_420px]">
        {/* Class grid grouped by stage */}
        <div className="space-y-6">
          {(["Primary","Secondary"] as const).map((stg) => {
            const stageRows = rows.filter((r) => r.stage === stg);
            if (stageRows.length === 0) return null;
            return (
              <Card key={stg} className="overflow-hidden border-navy/10">
                <div className="flex items-center justify-between bg-gradient-to-r from-navy to-navy-light px-4 py-2.5 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    <FolderKanban className="h-3.5 w-3.5" />{stg} · {stg === "Primary" ? "P1–P15" : "S1–S10"}
                  </div>
                  <span className="text-[10px] text-white/80">{stageRows.length} classes · {stageRows.reduce((a,r)=>a+r.students,0)} students</span>
                </div>
                <div className="divide-y">
                  {stageRows.map((r) => (
                    <ClassRowItem key={r.code} row={r} onOpen={() => setSelectedClass(r)} semester={semester} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right rail: pinned templates + selected class detail */}
        <div className="space-y-4">
          <LeadershipTemplates />
          {selectedClass ? (
            <ClassDetail row={selectedClass} onClose={() => setSelectedClass(null)} semester={semester} />
          ) : (
            <Card className="p-5 text-center text-xs text-muted-foreground border-dashed">
              Select a class to open the full IEP view, edit goals, leave comments and approve.
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, icon, navy }: { label: string; value: React.ReactNode; icon: React.ReactNode; navy?: boolean }) {
  return (
    <Card className={cn("p-4 relative overflow-hidden", navy && "border-navy/20")}>
      {navy && <div className="absolute inset-0 bg-gradient-to-br from-navy/10 via-transparent to-primary/5" />}
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="relative mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function ClassRowItem({ row, onOpen, semester }: { row: ClassRow; onOpen: () => void; semester: Semester }) {
  const A = APPROVAL_META[row.approval];
  const AIcon = A.icon;
  return (
    <button onClick={onOpen}
      className="grid w-full grid-cols-[80px_1fr_1fr_140px_120px_20px] items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/8 font-bold text-navy">
        {row.code}
      </div>
      <div>
        <p className="text-sm font-semibold">{row.teacher}</p>
        <p className="text-[11px] text-muted-foreground">{row.students} students · {row.lastUpdated}</p>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Progress value={row.completion} className="h-1.5 flex-1 max-w-[160px]" />
          <span className="text-xs font-semibold tabular-nums">{row.completion}%</span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{semester.replace(" · 2026", "")}</p>
      </div>
      <Badge className={cn("justify-center font-normal", A.tone)}>
        <AIcon className="h-3 w-3" />{A.label}
      </Badge>
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{row.students}</span>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

const DEFAULT_TEMPLATES = [
  { id: "iep",  name: "Leadership IEP Template (Word)",         category: "IEP" as const },
  { id: "ho",   name: "Handover Template — Semester (Word)",    category: "Handover" as const },
  { id: "ssg",  name: "SSG Meeting Template (Word)",            category: "SSG" as const },
  { id: "ss",   name: "Semestral Scope & Sequence — Master 2026", category: "Scope & Sequence" as const },
  { id: "cc",   name: "Cross-Check Masterlist — Literacy",      category: "Cross-Check" as const },
  { id: "ccn",  name: "Cross-Check Masterlist — Numeracy",      category: "Cross-Check" as const },
];
type TemplateItem = { id: string; name: string; category: "IEP" | "Handover" | "SSG" | "Scope & Sequence" | "Cross-Check"; updatedAt?: string };

function LeadershipTemplates() {
  const [items, setItems] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);
  const [category, setCategory] = useState<TemplateItem["category"]>("IEP");
  const fileRef = useRef<HTMLInputElement>(null);

  function addFromDevice(list: FileList | null) {
    if (!list?.length) return;
    const now = new Date().toLocaleDateString("en-AU");
    const added: TemplateItem[] = Array.from(list).map((f) => ({
      id: `${Date.now()}-${f.name}`, name: f.name, category, updatedAt: now,
    }));
    setItems((prev) => [...added, ...prev]);
    toast.success(`Uploaded ${added.length} template${added.length === 1 ? "" : "s"} to ${category}.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  function renameItem(id: string) {
    const cur = items.find((i) => i.id === id);
    const name = window.prompt("Rename template", cur?.name ?? "");
    if (!name?.trim()) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: name.trim() } : i)));
    toast.success("Template renamed.");
  }
  function removeItem(id: string) {
    if (!window.confirm("Remove this pinned template from every class folder?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Template removed.");
  }

  const grouped = ["IEP", "Handover", "SSG", "Scope & Sequence", "Cross-Check"] as const;

  return (
    <Card className="overflow-hidden border-navy/20">
      <div className="flex items-center justify-between bg-gradient-to-r from-navy/90 to-navy-light px-4 py-2.5 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Pin className="h-3.5 w-3.5" />Pinned in every class folder
        </div>
        <span className="text-[10px] text-white/80">Admin-managed · read-only for teachers</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <span className="text-[11px] font-medium text-muted-foreground">Upload to:</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TemplateItem["category"])}
          className="rounded-md border bg-background px-2 py-1 text-xs"
        >
          {grouped.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input ref={fileRef} type="file" hidden multiple accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx" onChange={(e) => addFromDevice(e.target.files)} />
        <Button size="sm" className="h-7 text-[11px] bg-navy text-white hover:bg-navy-light" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3 w-3" />Upload template
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
          <Link to="/admin/crosscheck-builder"><ClipboardCheck className="h-3 w-3" />CrossCheck Builder</Link>
        </Button>
      </div>
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <Pin className="h-3 w-3 shrink-0 text-navy" />
              <span className="min-w-0 truncate">
                {it.name}
                <span className="ml-1.5 text-[10px] text-muted-foreground">· {it.category}{it.updatedAt ? ` · ${it.updatedAt}` : ""}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => toast.success(`Opening “${it.name}”…`)}><FileDown className="h-3 w-3" />Open</Button>
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => renameItem(it.id)}>Rename</Button>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-rose-600 hover:text-rose-700" onClick={() => removeItem(it.id)}>Remove</Button>
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            No templates pinned yet. Upload to start.
          </li>
        )}
      </ul>
    </Card>
  );
}

function ClassDetail({ row, onClose, semester }: { row: ClassRow; onClose: () => void; semester: Semester }) {
  const A = APPROVAL_META[row.approval];
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-secondary/60 to-transparent px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/10 text-sm font-bold text-navy">{row.code}</div>
          <div>
            <p className="text-sm font-semibold">{row.teacher}</p>
            <p className="text-[10px] text-muted-foreground">{semester} · {row.students} students</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={onClose}>Close</Button>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Detail label="Completion" value={`${row.completion}%`} />
          <Detail label="Status" value={<Badge className={cn("font-normal", A.tone)}>{A.label}</Badge>} />
          <Detail label="Last updated" value={row.lastUpdated} />
          <Detail label="Stage" value={row.stage} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="h-8 bg-navy text-white text-xs hover:bg-navy-light">
            <Link to="/ieps"><ExternalLink className="h-3.5 w-3.5" />Open class IEP</Link>
          </Button>
          {row.approval === "pending" && (
            <>
              <Button size="sm" className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-600/90"
                onClick={() => toast.success(`${row.code} IEP approved.`)}>
                <CheckCircle2 className="h-3.5 w-3.5" />Approve
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs"
                onClick={() => toast(`${row.code} returned for revision.`)}>
                Return for revision
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast("Comment added.")}>
            <MessageSquarePlus className="h-3.5 w-3.5" />Comment
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast("Comparing S1 vs S2…")}>
            <ArrowLeftRight className="h-3.5 w-3.5" />Compare S1 vs S2
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast("Version history opened.")}>
            <History className="h-3.5 w-3.5" />Version history
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success("Exported to PDF")}>
            <FileDown className="h-3.5 w-3.5" />PDF
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success("Exported to Word")}>
            <FileDown className="h-3.5 w-3.5" />Word
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
