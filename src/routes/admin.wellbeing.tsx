import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Pill, AlertTriangle, UserX } from "lucide-react";
import { students as seedStudents, type AttendanceStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/wellbeing")({
  head: () => ({ meta: [{ title: "Wellbeing Hub · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing"]}>
      <AppShell variant="admin">
        <WellbeingPage />
      </AppShell>
    </RoleGate>
  ),
});

const ATTEND_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-800",
  absent: "bg-rose-100 text-rose-800",
  partial: "bg-sky-100 text-sky-800",
};

function WellbeingPage() {
  const stats = useMemo(() => {
    const withAlerts = seedStudents.filter((s) => s.medicalAlerts.length > 0);
    const absent = seedStudents.filter((s) => s.attendance === "absent").length;
    const late = seedStudents.filter((s) => s.attendance === "late").length;
    const prn = withAlerts.filter((s) => s.medicalAlerts.some((a) => /PRN|meds|Midazolam/i.test(a))).length;
    return { withAlerts, absent, late, prn };
  }, []);

  return (
    <>
      <PageHeader title="Wellbeing Hub" subtitle="Nurse, Wellbeing & Attendance officer dashboards." />
      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={HeartPulse} label="Medical alerts" value={stats.withAlerts.length} hue="from-rose-500 to-pink-500" />
          <Kpi icon={Pill} label="PRN medication" value={stats.prn} hue="from-violet-500 to-fuchsia-500" />
          <Kpi icon={UserX} label="Absent today" value={stats.absent} hue="from-amber-500 to-orange-500" />
          <Kpi icon={AlertTriangle} label="Late arrivals" value={stats.late} hue="from-sky-500 to-cyan-500" />
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Medical alert register</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.withAlerts.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`h-8 w-8 rounded-full ${s.avatarColor} flex items-center justify-center text-[11px] font-semibold`}>{s.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {s.medicalAlerts.map((a, i) => <Badge key={i} variant="outline" className="text-[10px]">{a}</Badge>)}
                  </div>
                </div>
                <Badge className={ATTEND_TONE[s.attendance]}>{s.attendance}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Attendance at a glance</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(["present", "late", "partial", "absent"] as AttendanceStatus[]).map((k) => {
              const n = seedStudents.filter((s) => s.attendance === k).length;
              return (
                <div key={k} className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="mt-1 text-2xl font-semibold">{n}</div>
                </div>
              );
            })}
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
