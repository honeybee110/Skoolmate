import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { students, availableSemesters, type Semester } from "@/lib/mock-data";
import { getIsAdmin, listOverrideAudit } from "@/lib/ieps-admin.functions";
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  X,
  AlertTriangle,
  History,
  Loader2,
} from "lucide-react";

type AuditRow = {
  id: string;
  actor_id: string;
  action: string;
  goal_id: string | null;
  student_id: string | null;
  goal_semester: Semester | null;
  active_semester: string | null;
  note_semester: Semester | null;
  reason: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Override audit log · SchoolMate AU" }] }),
  component: AdminAuditPage,
});

type MismatchFilter = "any" | "mismatch" | "clean";

function studentLabel(id: string | null) {
  if (!id) return "—";
  const s = students.find((x) => x.id === id);
  return s ? `${s.firstName} ${s.lastName}` : id;
}

function isMismatchRow(row: AuditRow): boolean {
  if (row.action === "cross_check_status_override") {
    return (
      row.active_semester !== null &&
      row.active_semester !== "all" &&
      row.goal_semester !== null &&
      row.active_semester !== row.goal_semester
    );
  }
  const p = row.payload ?? {};
  return Boolean(p.student_mismatch || p.domain_mismatch || p.semester_mismatch || p.any_mismatch);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminAuditPage() {
  const isAdminFn = useServerFn(getIsAdmin);
  const listFn = useServerFn(listOverrideAudit);

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AuditRow[]>([]);

  // Filters
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [mismatchFilter, setMismatchFilter] = useState<MismatchFilter>("any");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await isAdminFn();
        if (cancelled) return;
        setIsAdmin(Boolean(r?.isAdmin));
        if (r?.isAdmin) {
          setLoading(true);
          const res = await listFn();
          if (cancelled) return;
          if (res.ok) setRows(res.rows as AuditRow[]);
          else setError(res.error);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load audit log.");
      } finally {
        if (!cancelled) {
          setChecking(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminFn, listFn]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (studentFilter !== "all" && r.student_id !== studentFilter) return false;
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      const mm = isMismatchRow(r);
      if (mismatchFilter === "mismatch" && !mm) return false;
      if (mismatchFilter === "clean" && mm) return false;
      const ts = new Date(r.created_at).getTime();
      if (fromDate) {
        const from = new Date(fromDate).getTime();
        if (Number.isFinite(from) && ts < from) return false;
      }
      if (toDate) {
        // include the whole day
        const to = new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (Number.isFinite(to) && ts > to) return false;
      }
      return true;
    });
  }, [rows, studentFilter, actionFilter, mismatchFilter, fromDate, toDate]);

  const mismatchCount = useMemo(() => filtered.filter(isMismatchRow).length, [filtered]);

  const resetFilters = () => {
    setStudentFilter("all");
    setMismatchFilter("any");
    setFromDate("");
    setToDate("");
    setActionFilter("all");
  };

  return (
    <AppShell>
      <PageHeader
        title="Override audit log"
        subtitle="Admin-authorised exceptions to semester, student, and domain rules · read-only"
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
        {checking ? (
          <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </Card>
        ) : !isAdmin ? (
          <Card className="flex items-start gap-3 border-destructive/30 bg-destructive/5 p-6">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-destructive">Admin access required</div>
              <p className="text-muted-foreground">
                This page lists override exceptions to IEP semester and domain rules. Ask an
                administrator to grant your account the <code>admin</code> role to view it.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Summary strip */}
            <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/20 bg-primary-soft/30 p-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">Signed in as admin</span>
                <Badge variant="outline" className="font-normal">
                  {filtered.length} event{filtered.length === 1 ? "" : "s"}
                </Badge>
                {mismatchCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {mismatchCount} with mismatch
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Showing latest 100 records.</div>
            </Card>

            {/* Filters */}
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-primary" /> Filters
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetFilters}>
                  <X className="mr-1 h-3 w-3" /> Reset
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">Student</Label>
                  <Select value={studentFilter} onValueChange={setStudentFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All students</SelectItem>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mismatch</Label>
                  <Select
                    value={mismatchFilter}
                    onValueChange={(v) => setMismatchFilter(v as MismatchFilter)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="mismatch">Semester / domain mismatch</SelectItem>
                      <SelectItem value="clean">No mismatch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="cross_check_status_override">
                        Cross-check status
                      </SelectItem>
                      <SelectItem value="specialist_note_insert_override">
                        Specialist note · insert
                      </SelectItem>
                      <SelectItem value="specialist_note_update_override">
                        Specialist note · update
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </Card>

            {/* Log */}
            {error && (
              <Card className="flex items-start gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Failed to load audit log</div>
                  <div className="text-muted-foreground">{error}</div>
                </div>
              </Card>
            )}

            {loading ? (
              <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading override events…
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="flex items-start gap-3 p-6 text-sm text-muted-foreground">
                <History className="mt-0.5 h-4 w-4" />
                No override events match the current filters.
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((r) => {
                  const mm = isMismatchRow(r);
                  return (
                    <Card key={r.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {r.action}
                            </Badge>
                            {mm ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Mismatch override
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="mr-1 h-3 w-3" /> In-scope
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            {studentLabel(r.student_id)}
                            {r.goal_id && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                · goal {r.goal_id}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {r.goal_semester && (
                              <span>
                                Goal:{" "}
                                <span className="font-medium text-foreground">
                                  {r.goal_semester}
                                </span>
                              </span>
                            )}
                            {r.active_semester && (
                              <span>
                                Active:{" "}
                                <span className="font-medium text-foreground">
                                  {r.active_semester === "all"
                                    ? "All semesters"
                                    : r.active_semester}
                                </span>
                              </span>
                            )}
                            {r.note_semester && (
                              <span>
                                Note:{" "}
                                <span className="font-medium text-foreground">
                                  {r.note_semester}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{fmtDate(r.created_at)}</div>
                          <div className="font-mono">actor {r.actor_id.slice(0, 8)}…</div>
                        </div>
                      </div>
                      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Reason
                        </div>
                        <div className="mt-0.5 whitespace-pre-wrap">{r.reason}</div>
                      </div>
                      {r.payload && Object.keys(r.payload).length > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Payload
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-[11px]">
                            {JSON.stringify(r.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Extra semester quick filter — audit is history so keep as separate control
                rather than tied to the global semester context. */}
            <Card className="p-3 text-xs text-muted-foreground">
              Tip: goal semester values are drawn from{" "}
              {availableSemesters.map((s, i) => (
                <span key={s}>
                  <span className="font-medium text-foreground">{s}</span>
                  {i < availableSemesters.length - 1 ? " and " : ""}
                </span>
              ))}
              . Use the mismatch filter to isolate cross-semester overrides.
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
