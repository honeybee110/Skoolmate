import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Image, CheckCircle2, ShieldCheck } from "lucide-react";
import { students as seedStudents } from "@/lib/mock-data";
import { useDirectory } from "@/lib/directory-store";

export const Route = createFileRoute("/admin/evidence")({
  head: () => ({ meta: [{ title: "Evidence Hub · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health"]}>
      <AppShell variant="admin">
        <EvidencePage />
      </AppShell>
    </RoleGate>
  ),
});

function EvidencePage() {
  const { classes, activeYearId } = useDirectory();
  const stats = useMemo(() => {
    const totalEvidence = seedStudents.length * 4; // mock
    const totalGoals = seedStudents.reduce((s, x) => s + x.iepGoalsActive, 0);
    const linked = Math.round(totalGoals * 0.72);
    return { totalEvidence, totalGoals, linked, coverage: Math.round((linked / totalGoals) * 100) };
  }, []);

  const activeClasses = classes.filter((c) => c.yearId === activeYearId && c.teacherId);

  return (
    <>
      <PageHeader
        title="Evidence Hub"
        subtitle="Whole-school view of evidence captured against IEP goals — NCCD audit-ready."
      />
      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Camera} label="Evidence items" value={stats.totalEvidence} hue="from-sky-500 to-cyan-500" />
          <Kpi icon={CheckCircle2} label="Goals with evidence" value={`${stats.linked}/${stats.totalGoals}`} hue="from-emerald-500 to-teal-500" />
          <Kpi icon={ShieldCheck} label="NCCD coverage" value={`${stats.coverage}%`} hue="from-violet-500 to-fuchsia-500" />
          <Kpi icon={Image} label="Classes reporting" value={activeClasses.length} hue="from-amber-500 to-orange-500" />
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Recent evidence — school-wide</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {seedStudents.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`h-8 w-8 rounded-full ${s.avatarColor} flex items-center justify-center text-[11px] font-semibold`}>{s.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.firstName} {s.lastName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{s.latestEvidence}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{s.className}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, hue }: { icon: React.ElementType; label: string; value: string | number; hue: string }) {
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
