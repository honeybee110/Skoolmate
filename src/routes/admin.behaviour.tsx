import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, TrendingDown, HeartPulse } from "lucide-react";
import { students as seedStudents, type BehaviourStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/behaviour")({
  head: () => ({ meta: [{ title: "Behaviour Analytics · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing", "allied_health"]}>
      <AppShell variant="admin">
        <BehaviourPage />
      </AppShell>
    </RoleGate>
  ),
});

const STATUS_TONE: Record<BehaviourStatus, string> = {
  calm: "bg-emerald-100 text-emerald-800",
  settled: "bg-sky-100 text-sky-800",
  alert: "bg-amber-100 text-amber-800",
  incident: "bg-rose-100 text-rose-800",
};

function BehaviourPage() {
  const counts = useMemo(() => {
    const c: Record<BehaviourStatus, number> = { calm: 0, settled: 0, alert: 0, incident: 0 };
    for (const s of seedStudents) c[s.behaviour]++;
    return c;
  }, []);
  const total = seedStudents.length;

  return (
    <>
      <PageHeader
        title="Behaviour Analytics"
        subtitle="Whole-school behaviour trends, incidents, and positive-behaviour supports."
      />
      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={HeartPulse} label="Calm / settled" value={counts.calm + counts.settled} hue="from-emerald-500 to-teal-500" />
          <Kpi icon={Activity} label="Alerts today" value={counts.alert} hue="from-amber-500 to-orange-500" />
          <Kpi icon={AlertTriangle} label="Incidents" value={counts.incident} hue="from-rose-500 to-red-500" />
          <Kpi icon={TrendingDown} label="Weekly trend" value="-8%" hue="from-sky-500 to-blue-500" />
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Distribution — this week</h2>
          <div className="space-y-3">
            {(Object.keys(counts) as BehaviourStatus[]).map((k) => {
              const pct = Math.round((counts[k] / total) * 100);
              return (
                <div key={k}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize font-medium">{k}</span>
                    <span className="text-muted-foreground">{counts[k]} · {pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Flagged students</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {seedStudents.filter((s) => s.behaviour === "alert" || s.behaviour === "incident").map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`h-8 w-8 rounded-full ${s.avatarColor} flex items-center justify-center text-[11px] font-semibold`}>{s.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                  <div className="text-[11px] text-muted-foreground">{s.className} · {s.yearLevel}</div>
                </div>
                <Badge className={STATUS_TONE[s.behaviour]}>{s.behaviour}</Badge>
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
