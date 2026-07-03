import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { behaviourReports, students, type BehaviourReportStatus } from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";
import { AlertTriangle, Activity, CheckCircle2, CalendarRange, Target, Camera, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/behaviour")({
  head: () => ({ meta: [{ title: "Behaviour & Wellbeing · skoolmate" }] }),
  component: BehaviourPage,
});

const statusMeta: Record<BehaviourReportStatus, { label: string; tone: string; Icon: typeof Activity }> = {
  open:       { label: "Open",       tone: "bg-red-100 text-red-700",         Icon: AlertTriangle },
  monitoring: { label: "Monitoring", tone: "bg-amber-100 text-amber-800",     Icon: Activity },
  resolved:   { label: "Resolved",   tone: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
};

function BehaviourPage() {
  const { activeSemester, matches, setActiveSemester } = useActiveSemester();
  const visible = useMemo(() => behaviourReports.filter((r) => matches(r.semester)), [matches]);

  const counts = useMemo(() => {
    const c = { open: 0, monitoring: 0, resolved: 0 } as Record<BehaviourReportStatus, number>;
    for (const r of visible) c[r.status]++;
    return c;
  }, [visible]);

  return (
    <AppShell>
      <PageHeader title="Behaviour & Wellbeing" subtitle="ABC data, triggers, heatmaps, positive behaviour tracking" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/20 bg-primary-soft/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="font-medium">Showing reports for:</span>
            <Badge variant="outline" className="font-normal">
              {activeSemester === "all" ? "All semesters" : activeSemester}
            </Badge>
            <span className="text-xs text-muted-foreground">({visible.length} report{visible.length === 1 ? "" : "s"})</span>
          </div>
          {activeSemester !== "all" && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setActiveSemester("all")}>
              View all semesters
            </Button>
          )}
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          {(["open", "monitoring", "resolved"] as BehaviourReportStatus[]).map((k) => {
            const meta = statusMeta[k];
            return (
              <Card key={k} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{meta.label}</p>
                  <meta.Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{counts[k]}</p>
              </Card>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No behaviour reports for {activeSemester === "all" ? "any semester" : activeSemester}.
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">Semester</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Summary</th>
                  <th className="px-4 py-2.5 font-medium">Incidents</th>
                  <th className="px-4 py-2.5 font-medium">Evidence</th>
                  <th className="px-4 py-2.5 font-medium">Updated</th>
                  <th className="px-4 py-2.5 font-medium text-right">Drill-down</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const meta = statusMeta[r.status];
                  const student = students.find((s) => s.id === r.studentId);
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {student && (
                            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-semibold", student.avatarColor)}>
                              {student.initials}
                            </div>
                          )}
                          <span className="font-medium">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal text-[10px]">{r.semester}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("gap-1 font-normal text-[10px]", meta.tone)}>
                          <meta.Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[260px] text-muted-foreground">{r.summary}</td>
                      <td className="px-4 py-3 tabular-nums">{r.incidents}</td>
                      <td className="px-4 py-3">
                        <Link
                          to="/evidence"
                          search={scopedSearch(activeSemester, { student: r.studentId, semester: r.semester })}
                          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 tabular-nums text-primary hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Camera className="h-3 w-3" /> {r.evidenceCount} items
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.updatedAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link to="/ieps" search={scopedSearch(activeSemester, { student: r.studentId, semester: r.semester })}>
                              <Target className="h-3 w-3" /> Goals
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link to="/evidence" search={scopedSearch(activeSemester, { student: r.studentId, semester: r.semester })}>
                              <FileText className="h-3 w-3" /> Evidence
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
