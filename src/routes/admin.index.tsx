import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth, roleLabel } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Portal · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AdminHome />
    </RoleGate>
  ),
});

const stats = [
  { label: "Pending Lesson Plans", value: 7, icon: ClipboardCheck, tone: "text-amber-600 bg-amber-50" },
  { label: "Pending IEP Approvals", value: 4, icon: Target, tone: "text-primary bg-primary-soft" },
  { label: "Reports Due", value: 12, icon: FileText, tone: "text-rose-600 bg-rose-50" },
  { label: "Behaviour Incidents", value: 3, icon: Activity, tone: "text-orange-600 bg-orange-50" },
  { label: "Attendance Today", value: "94%", icon: Users, tone: "text-emerald-600 bg-emerald-50" },
  { label: "Upcoming Meetings", value: 5, icon: CalendarClock, tone: "text-indigo-600 bg-indigo-50" },
  { label: "Teacher Absences", value: 2, icon: Users, tone: "text-slate-600 bg-slate-50" },
  { label: "Today's Clock-ins", value: 38, icon: Timer, tone: "text-teal-600 bg-teal-50" },
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
  const { profile, roles } = useAuth();
  return (
    <AppShell variant="admin">
      <PageHeader
        title={`Good morning, ${profile?.display_name?.split(" ")[0] ?? "Admin"}`}
        subtitle={
          roles.length
            ? `Signed in as ${roles.map(roleLabel).join(" · ")}`
            : "Admin Portal overview"
        }
        actions={
          <Button className="rounded-full gap-1.5">
            <Sparkles className="h-4 w-4" /> AI Brief
          </Button>
        }
      />


      <div className="px-4 py-6 md:px-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{s.value}</div>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                  <s.icon className="h-4 w-4" />
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
