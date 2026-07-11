import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileHeader } from "@/components/profile-header";
import {
  ClipboardCheck,
  Target,
  FileText,
  Activity,
  CalendarClock,
  Users,
  Timer,
  Bell,
  BarChart3,
  Library,
  UserCog,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PortalGuard } from "@/components/portal-guard";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Portal · skoolmate" }] }),
  component: () => (
    <PortalGuard portal="admin">
      <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
        <AdminHome />
      </RoleGate>
    </PortalGuard>
  ),
});

const stats = [
  { label: "Pending Lesson Plans", value: 7, icon: ClipboardCheck, gradient: "from-amber-400 to-orange-500", ring: "ring-amber-200" },
  { label: "Pending IEP Approvals", value: 4, icon: Target, gradient: "from-[color:var(--primary)] to-indigo-400", ring: "ring-indigo-200" },
  { label: "Reports Due", value: 12, icon: FileText, gradient: "from-rose-400 to-pink-500", ring: "ring-rose-200" },
  { label: "Behaviour Incidents", value: 3, icon: Activity, gradient: "from-orange-400 to-red-500", ring: "ring-orange-200" },
  { label: "Attendance Today", value: "94%", icon: Users, gradient: "from-emerald-400 to-teal-500", ring: "ring-emerald-200" },
  { label: "Upcoming Meetings", value: 5, icon: CalendarClock, gradient: "from-indigo-400 to-violet-500", ring: "ring-violet-200" },
  { label: "Teacher Absences", value: 2, icon: Users, gradient: "from-slate-400 to-slate-600", ring: "ring-slate-200" },
  { label: "Today's Clock-ins", value: 38, icon: Timer, gradient: "from-[color:var(--accent)] to-cyan-500", ring: "ring-cyan-200" },
];

const quickActions: Array<{ label: string; to: string; icon: typeof Bell }> = [
  { label: "Approve Lesson Plans", to: "/admin/approvals", icon: ClipboardCheck },
  { label: "Approve IEPs", to: "/admin/approvals", icon: Target },
  { label: "Send Reminder", to: "/admin/reminders", icon: Bell },
  { label: "Manage Users", to: "/admin/users", icon: UserCog },
  { label: "Resource Bank", to: "/resources", icon: Library },
  { label: "Reports", to: "/reports", icon: FileText },
];


function AdminHome() {
  const { profile } = useAuth();
  void profile;
  return (
    <AppShell variant="admin">
      <div className="px-4 pt-6 md:px-8">
        <ProfileHeader
          variant="admin"
          eyebrow="Admin Portal · Monday, 29 June 2026"
          subtitle="School-wide overview"
          actions={
            <Button className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-5 text-white shadow-lg hover:opacity-95">
              <Sparkles className="h-4 w-4" /> AI Brief
            </Button>
          }
        />
      </div>

      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.label}
              className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.25)]"
            >
              <div
                aria-hidden
                className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-15 blur-2xl transition-opacity group-hover:opacity-25`}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {s.value}
                  </div>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-md ring-4 ${s.ring}/40`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>


        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Quick Actions</h3>
              <p className="text-xs text-muted-foreground">
                Everything leadership needs one click away.
              </p>
            </div>
            <Badge variant="outline">Live</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((a) => (
              <Button
                key={a.label}
                asChild
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
              >
                <Link to={a.to}>
                  <a.icon className="h-4 w-4 text-primary" />
                  <span>{a.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">This week</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Live analytics dashboards (goal completion, behaviour trends, attendance, planning
              completion) are wired in Milestone 4.
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Realtime submission, overdue, and clock-in alerts activate with Milestone 2.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
