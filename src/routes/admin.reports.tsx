import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, CheckCircle2, Target, Users, TrendingUp } from "lucide-react";
import { useDirectory, getStudentsForClass } from "@/lib/directory-store";
import { students as seedStudents } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "School-wide Reports · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing"]}>
      <AppShell variant="admin">
        <ReportsPage />
      </AppShell>
    </RoleGate>
  ),
});

function ReportsPage() {
  const { classes, teachers, activeYearId } = useDirectory();

  const stats = useMemo(() => {
    const active = classes.filter((c) => c.yearId === activeYearId);
    const totalStudents = active.reduce((sum, c) => sum + c.studentIds.length, 0);
    const totalGoals = seedStudents.reduce((s, x) => s + x.iepGoalsActive, 0);
    const achieved = seedStudents.reduce((s, x) => s + x.iepGoalsAchieved, 0);
    const pct = totalGoals ? Math.round((achieved / totalGoals) * 100) : 0;
    return { active, totalStudents, totalGoals, achieved, pct };
  }, [classes, activeYearId]);

  return (
    <>
      <PageHeader
        title="School-wide Reports"
        subtitle="Semester reports for IEPs, behaviour, attendance and NCCD — synced from every class."
      />
      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Users} label="Students" value={stats.totalStudents} hue="from-sky-500 to-blue-500" />
          <KpiCard icon={Target} label="Active IEP goals" value={stats.totalGoals} hue="from-violet-500 to-purple-500" />
          <KpiCard icon={CheckCircle2} label="Goals achieved" value={stats.achieved} hue="from-emerald-500 to-teal-500" />
          <KpiCard icon={TrendingUp} label="Achievement rate" value={`${stats.pct}%`} hue="from-amber-500 to-orange-500" />
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Semester report pipeline</h2>
              <p className="text-xs text-muted-foreground">Approval status per class · pulled from School-Wide Class List</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-3.5 w-3.5" />Export bundle</Button>
          </div>
          <div className="space-y-2">
            {stats.active.filter((c) => c.teacherId).map((c) => {
              const students = getStudentsForClass(c.id);
              const teacher = teachers.find((t) => t.id === c.teacherId);
              const progress = 40 + ((c.id.charCodeAt(2) * 7) % 60);
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <FileText className="h-4 w-4 text-[color:var(--primary)]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      <Badge variant="outline" className="text-[10px]">{students.length} students</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned"} · Semester 2 · 2026</div>
                  </div>
                  <div className="w-40"><Progress value={progress} /></div>
                  <Badge variant="outline" className="text-[10px]">{progress >= 80 ? "Ready" : progress >= 50 ? "In progress" : "Draft"}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

function KpiCard({ icon: Icon, label, value, hue }: { icon: React.ElementType; label: string; value: string | number; hue: string }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${hue} opacity-15 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${hue} p-2 text-white`}><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}
