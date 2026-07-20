import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Clock, LogIn, LogOut, Search, Download, Timer, Users, Activity } from "lucide-react";
import { toast } from "sonner";
import { useDirectory, directoryActions, STAFF_ROLES, type Teacher, type StaffRole } from "@/lib/directory-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/timeclock")({
  head: () => ({ meta: [{ title: "Time & Attendance · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <StaffTimeClock />
      </AppShell>
    </RoleGate>
  ),
});

function initials(t: Teacher) {
  return `${t.firstName[0] ?? ""}${t.lastName[0] ?? ""}`.toUpperCase();
}

function lastEvent(t: Teacher) {
  return t.clock.length ? t.clock[t.clock.length - 1] : null;
}

function isClockedIn(t: Teacher) {
  return lastEvent(t)?.type === "in";
}

function todayHours(t: Teacher): string {
  // Best-effort readable summary from the mock string timestamps.
  const events = t.clock;
  if (events.length === 0) return "—";
  const ins = events.filter((e) => e.type === "in").length;
  const outs = events.filter((e) => e.type === "out").length;
  return `${ins} in · ${outs} out`;
}

function StaffTimeClock() {
  const { teachers } = useDirectory();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<StaffRole | "All">("All");
  const [status, setStatus] = useState<"all" | "in" | "out">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const active = useMemo(() => teachers.filter((t) => !t.archived), [teachers]);

  const filtered = useMemo(() => active.filter((t) => {
    if (role !== "All" && t.role !== role) return false;
    const inNow = isClockedIn(t);
    if (status === "in" && !inNow) return false;
    if (status === "out" && inNow) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!`${t.firstName} ${t.lastName} ${t.email} ${t.employeeId} ${t.role}`.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [active, q, role, status]);

  const kpis = useMemo(() => {
    const onSite = active.filter(isClockedIn).length;
    const total = active.length;
    const withPunches = active.filter((t) => t.clock.length > 0).length;
    return {
      onSite,
      offSite: total - onSite,
      total,
      participation: total ? Math.round((withPunches / total) * 100) : 0,
    };
  }, [active]);

  const selected = teachers.find((t) => t.id === selectedId) ?? null;

  function exportCsv() {
    const rows = [["Employee ID", "Name", "Role", "Employment", "Status", "Punches", "Last event"]];
    for (const t of active) {
      const last = lastEvent(t);
      rows.push([
        t.employeeId,
        `${t.firstName} ${t.lastName}`,
        t.role,
        t.employment,
        isClockedIn(t) ? "IN" : "OUT",
        String(t.clock.length),
        last ? `${last.type.toUpperCase()} @ ${last.at}` : "—",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skoolmate-timeclock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  return (
    <>
      <PageHeader
        title="Staff Time Clock"
        subtitle="Live clock-in status, timesheet history and payroll export."
        actions={
          <Button onClick={exportCsv} className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white shadow-md hover:opacity-95">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Users} label="On-site now" value={kpis.onSite} hue="from-emerald-400 to-teal-500" />
          <Kpi icon={LogOut} label="Off-site" value={kpis.offSite} hue="from-slate-400 to-slate-600" />
          <Kpi icon={Timer} label="Active staff" value={kpis.total} hue="from-[color:var(--primary)] to-indigo-400" />
          <Kpi icon={Activity} label="Punch participation" value={`${kpis.participation}%`} hue="from-[color:var(--accent)] to-cyan-500" />
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff…" className="h-9 pl-8" />
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole | "All")}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All roles</SelectItem>
                {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-full border bg-background p-1 text-xs">
              {(["all", "in", "out"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  className={cn(
                    "rounded-full px-3 py-1 font-medium capitalize transition-colors",
                    status === v ? "bg-[color:var(--primary)] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "all" ? "All" : v === "in" ? "Clocked in" : "Clocked out"}
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <div>Staff</div>
            <div>Role</div>
            <div>Status</div>
            <div>Today</div>
            <div className="text-right pr-1">Actions</div>
          </div>
          <ul className="divide-y">
            {filtered.map((t) => {
              const inNow = isClockedIn(t);
              const last = lastEvent(t);
              return (
                <li
                  key={t.id}
                  className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer"
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundImage: `linear-gradient(135deg, hsl(${t.avatarHue} 70% 55%), hsl(${t.avatarHue + 40} 75% 60%))` }}
                    >
                      {initials(t)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.firstName} {t.lastName}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.employeeId} · {t.employment}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        inNow ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", inNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                      {inNow ? "On-site" : "Off-site"}
                    </span>
                    {last && <div className="mt-1 text-[10px] text-muted-foreground">Last: {last.at}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground">{todayHours(t)}</div>
                  <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {inNow ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { directoryActions.clockOut(t.id); toast.success(`${t.firstName} clocked out`); }}
                        className="h-8 gap-1.5"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Out
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => { directoryActions.clockIn(t.id); toast.success(`${t.firstName} clocked in`); }}
                        className="h-8 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95"
                      >
                        <LogIn className="h-3.5 w-3.5" /> In
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-16 text-center text-sm text-muted-foreground">No staff match those filters.</li>
            )}
          </ul>
        </Card>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white"
                    style={{ backgroundImage: `linear-gradient(135deg, hsl(${selected.avatarHue} 70% 55%), hsl(${selected.avatarHue + 40} 75% 60%))` }}
                  >
                    {initials(selected)}
                  </div>
                  <div>
                    <SheetTitle>{selected.firstName} {selected.lastName}</SheetTitle>
                    <SheetDescription>{selected.role} · {selected.employeeId}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{isClockedIn(selected) ? "Currently on-site" : "Off-site"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => { directoryActions.clockIn(selected.id); toast.success("Clocked in"); }}
                      className="h-8 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    >
                      <LogIn className="h-3.5 w-3.5" /> In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { directoryActions.clockOut(selected.id); toast.success("Clocked out"); }}
                      className="h-8 gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Out
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Punch history
                  </div>
                  {selected.clock.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No clock events yet.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {[...selected.clock].reverse().map((c, i) => (
                        <li key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                          <span className="tabular-nums">{c.at}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              c.type === "in" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-50 text-slate-700"
                            )}
                          >
                            {c.type === "in" ? "IN" : "OUT"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Kpi({ icon: Icon, label, value, hue }: { icon: React.ElementType; label: string; value: string | number; hue: string }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div aria-hidden className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${hue} opacity-15 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${hue} p-2 text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
