import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { iepReports, students, type IepReportStatus, type Semester } from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";
import { FileText, FileDown, CheckCircle2, Clock, Eye, PenLine, CalendarRange, Target, Camera, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "IEP Reports · SchoolMate AU" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    student: typeof s.student === "string" ? s.student : undefined,
    semester: typeof s.semester === "string" ? (s.semester as Semester | "all") : undefined,
  }),
  component: ReportsPage,
});

const statusMeta: Record<IepReportStatus, { label: string; tone: string; Icon: typeof Clock }> = {
  draft:       { label: "Draft",     tone: "bg-muted text-muted-foreground",            Icon: PenLine },
  "in-review": { label: "In review", tone: "bg-amber-100 text-amber-800",               Icon: Clock },
  approved:    { label: "Approved",  tone: "bg-emerald-100 text-emerald-700",           Icon: CheckCircle2 },
  published:   { label: "Published", tone: "bg-primary/15 text-primary",                Icon: Eye },
};

function ReportsPage() {
  const { activeSemester, matches, setActiveSemester } = useActiveSemester();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const scopedStudent = search.student ? students.find((s) => s.id === search.student) : undefined;

  const visible = useMemo(
    () => iepReports
      .filter((r) => (search.semester ? r.semester === search.semester : matches(r.semester)))
      .filter((r) => (search.student ? r.studentId === search.student : true)),
    [matches, search.semester, search.student],
  );

  const counts = useMemo(() => {
    const c = { draft: 0, "in-review": 0, approved: 0, published: 0 } as Record<IepReportStatus, number>;
    for (const r of visible) c[r.status]++;
    return c;
  }, [visible]);

  return (
    <AppShell>
      <PageHeader
        title="IEP Reports"
        subtitle="Semester reports drafted from Evidence Hub · approved by Learning Specialist · published to parents"
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Scope bar */}
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

        {/* Stat strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["draft", "in-review", "approved", "published"] as IepReportStatus[]).map((k) => {
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

        {/* List */}
        {visible.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No IEP reports stored for {activeSemester === "all" ? "any semester" : activeSemester}.
            {activeSemester !== "all" && (
              <Button variant="link" size="sm" className="ml-1 h-auto p-0 text-xs" onClick={() => setActiveSemester("all")}>
                See all semesters
              </Button>
            )}
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">Semester</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Goals</th>
                  <th className="px-4 py-2.5 font-medium">Evidence</th>
                  <th className="px-4 py-2.5 font-medium">Updated</th>
                  <th className="px-4 py-2.5 font-medium">Approver</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
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
                      <td className="px-4 py-3">
                        <Link
                          to="/ieps"
                          search={{ student: r.studentId, semester: r.semester }}
                          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 tabular-nums text-primary hover:border-primary/40 hover:bg-primary/5"
                          title={`Open ${r.goalsIncluded} IEP goals for ${r.studentName} in ${r.semester}`}
                        >
                          <Target className="h-3 w-3" /> {r.goalsIncluded} goals
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/evidence"
                          search={{ student: r.studentId, semester: r.semester }}
                          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 tabular-nums text-primary hover:border-primary/40 hover:bg-primary/5"
                          title={`Open ${r.evidenceCount} evidence items`}
                        >
                          <Camera className="h-3 w-3" /> {r.evidenceCount} items
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.updatedAt}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.approver ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link to="/ieps" search={{ student: r.studentId, semester: r.semester }}>
                              <FileText className="h-3 w-3" /> Open
                            </Link>
                          </Button>
                          {(r.status === "approved" || r.status === "published") && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              <FileDown className="h-3 w-3" /> PDF
                            </Button>
                          )}
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
