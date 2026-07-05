import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ClipboardCheck, FileText, Check, X, Download, School, CalendarClock, User,
  Info, Loader2, Search,
} from "lucide-react";
import {
  listWeeklyUploads, reviewWeeklyUpload, signWeeklyUpload,
  type WeeklyUpload,
} from "@/lib/lesson-uploads.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({ meta: [{ title: "Approval Centre · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <ApprovalCentre />
    </RoleGate>
  ),
});

type Status = "pending" | "approved" | "rejected";

function ApprovalCentre() {
  const listFn = useServerFn(listWeeklyUploads);
  const reviewFn = useServerFn(reviewWeeklyUpload);
  const signFn = useServerFn(signWeeklyUpload);
  const qc = useQueryClient();

  const query = useQuery({ queryKey: ["weekly-uploads"], queryFn: () => listFn() });
  const uploads = query.data ?? [];

  const [tab, setTab] = useState<Status>("pending");
  const [q, setQ] = useState("");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const classes = useMemo(() => {
    const s = new Set<string>();
    uploads.forEach((u) => u.class_name && s.add(u.class_name));
    return Array.from(s).sort();
  }, [uploads]);

  const filtered = useMemo(() => {
    return uploads.filter((u) => {
      if (u.status !== tab) return false;
      if (termFilter !== "all" && u.term !== termFilter) return false;
      if (classFilter !== "all" && (u.class_name ?? "") !== classFilter) return false;
      if (q.trim()) {
        const n = q.toLowerCase();
        if (!`${u.title} ${u.uploader_name ?? ""} ${u.class_name ?? ""}`.toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [uploads, tab, termFilter, classFilter, q]);

  const counts = useMemo(() => ({
    pending: uploads.filter((u) => u.status === "pending").length,
    approved: uploads.filter((u) => u.status === "approved").length,
    rejected: uploads.filter((u) => u.status === "rejected").length,
  }), [uploads]);

  const review = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected"; leadership_note?: string }) =>
      reviewFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-uploads"] });
      toast.success("Review saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openFile(u: WeeklyUpload) {
    try {
      const { url } = await signFn({ data: { path: u.storage_path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    }
  }

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Approval Centre"
        subtitle="Review and approve every class's weekly lesson plan uploaded to the Lesson Bank."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {counts.pending} awaiting review
          </Badge>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary-soft/40 via-background to-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">One weekly plan per class</p>
              <p className="text-xs text-muted-foreground">
                Teachers upload one weekly lesson plan per class (not per subject) into the Lesson Bank —
                <strong> preferred format is Microsoft Word (.docx)</strong> as it stays editable across
                devices, keeps formatting for tables and images, and is what most Australian schools
                already use. PDF is accepted as read-only fallback.
              </p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, teacher, class…" className="h-9 pl-8" />
          </div>
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              <SelectItem value="Term 1">Term 1</SelectItem>
              <SelectItem value="Term 2">Term 2</SelectItem>
              <SelectItem value="Term 3">Term 3</SelectItem>
              <SelectItem value="Term 4">Term 4</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending<Badge variant="secondary">{counts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Approved<Badge variant="secondary">{counts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              Rejected<Badge variant="secondary">{counts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-3 mt-4">
            {query.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />Loading uploads…
              </div>
            )}
            {!query.isLoading && filtered.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No {tab} weekly plans match your filters.
              </Card>
            )}
            {filtered.map((u) => (
              <Card key={u.id} className={cn(
                "p-4",
                u.status === "pending" && "border-amber-200 bg-amber-50/30",
                u.status === "approved" && "border-emerald-200 bg-emerald-50/30",
                u.status === "rejected" && "border-rose-200 bg-rose-50/30",
              )}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold truncate">{u.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="gap-1"><School className="h-3 w-3" />{u.class_name ?? "Unassigned class"}</Badge>
                      <Badge variant="outline" className="gap-1"><CalendarClock className="h-3 w-3" />{u.term} · {u.week}</Badge>
                      <Badge variant="outline" className="gap-1"><User className="h-3 w-3" />{u.uploader_name ?? "Teacher"}</Badge>
                      <Badge variant="outline">{new Date(u.created_at).toLocaleDateString("en-AU", { day:"numeric", month:"short" })}</Badge>
                    </div>
                    {u.status === "pending" && (
                      <Textarea
                        value={notes[u.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [u.id]: e.target.value }))}
                        placeholder="Optional feedback for the teacher…"
                        className="mt-3 min-h-16"
                      />
                    )}
                    {u.leadership_note && u.status !== "pending" && (
                      <p className="mt-2 text-xs italic text-muted-foreground">Note: “{u.leadership_note}”</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <Button size="sm" variant="outline" onClick={() => openFile(u)}>
                      <Download className="h-4 w-4" />Open file
                    </Button>
                    {u.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                          onClick={() => review.mutate({ id: u.id, status: "approved", leadership_note: notes[u.id] })}
                          disabled={review.isPending}
                        >
                          <Check className="h-4 w-4" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-700"
                          onClick={() => review.mutate({ id: u.id, status: "rejected", leadership_note: notes[u.id] })}
                          disabled={review.isPending}
                        >
                          <X className="h-4 w-4" />Return
                        </Button>
                      </>
                    )}
                    {u.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => review.mutate({ id: u.id, status: u.status === "approved" ? "rejected" : "approved", leadership_note: notes[u.id] })}
                      >
                        Reopen review
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
