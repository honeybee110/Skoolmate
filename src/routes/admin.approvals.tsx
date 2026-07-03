import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Target,
  Check,
  X,
  MessageSquare,
  ClipboardCheck,
  User,
  CalendarClock,
} from "lucide-react";
import { iepGoals, weeklyTimetable, type WeekDay } from "@/lib/mock-data";
import { useActiveSemester } from "@/lib/semester-context";
import { scopedSearch } from "@/lib/scope";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({ meta: [{ title: "Approval Centre · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <ApprovalCentre />
    </RoleGate>
  ),
});

type PlanStatus = "pending" | "approved" | "returned";

interface LessonPlanSubmission {
  id: string;
  title: string;
  teacher: string;
  className: string;
  day: WeekDay;
  session: number;
  submittedAt: string;
  status: PlanStatus;
  vcLink: string;
}

const seedPlans: LessonPlanSubmission[] = [
  { id: "lp1", title: weeklyTimetable.Mon[1].title, teacher: "Honey", className: "P7", day: "Mon", session: 2, submittedAt: "2h ago", status: "pending", vcLink: "VC2EW02" },
  { id: "lp2", title: weeklyTimetable.Wed[2].title, teacher: "Honey", className: "P7", day: "Wed", session: 3, submittedAt: "5h ago", status: "pending", vcLink: "VC2MA01" },
  { id: "lp3", title: weeklyTimetable.Fri[2].title, teacher: "Honey", className: "P7", day: "Fri", session: 3, submittedAt: "yesterday", status: "pending", vcLink: "VC2MST02" },
  { id: "lp4", title: weeklyTimetable.Tue[4].title, teacher: "Priya", className: "P6", day: "Tue", session: 5, submittedAt: "yesterday", status: "pending", vcLink: "VC2HG01" },
  { id: "lp5", title: weeklyTimetable.Thu[1].title, teacher: "Marc", className: "P5", day: "Thu", session: 2, submittedAt: "2 days ago", status: "returned", vcLink: "VC2EW01" },
];

function ApprovalCentre() {
  const { activeSemester } = useActiveSemester();
  const [plans, setPlans] = useState(seedPlans);
  const [goals, setGoals] = useState(iepGoals);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const pendingIeps = useMemo(
    () =>
      goals.filter(
        (g) =>
          (g.approval === "pending" || g.approval === "draft" || !g.approval) &&
          (activeSemester === "all" || g.semester === activeSemester),
      ),
    [goals, activeSemester],
  );

  const pendingPlans = plans.filter((p) => p.status === "pending");

  const decide = (id: string, next: PlanStatus) => {
    setPlans((cur) => cur.map((p) => (p.id === id ? { ...p, status: next } : p)));
    toast.success(`Lesson plan ${next === "approved" ? "approved" : "returned to teacher"}.`);
  };
  const decideIep = (id: string, next: "approved" | "draft") => {
    setGoals((cur) =>
      cur.map((g) =>
        g.id === id
          ? { ...g, approval: next, approvedBy: next === "approved" ? "You" : undefined }
          : g,
      ),
    );
    toast.success(`IEP goal ${next === "approved" ? "approved" : "returned for revision"}.`);
  };

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Approval Centre"
        subtitle="One-click approve or return with comments. Filters follow the active semester."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {pendingPlans.length + pendingIeps.length} awaiting you
          </Badge>
        }
      />

      <div className="px-4 py-6 md:px-8">
        <Tabs defaultValue="lessons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="h-4 w-4" /> Lesson Plans
              <Badge variant="secondary" className="ml-1">{pendingPlans.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ieps" className="gap-2">
              <Target className="h-4 w-4" /> IEP Goals
              <Badge variant="secondary" className="ml-1">{pendingIeps.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-3">
            {plans.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{p.title}</h3>
                      <Badge variant="outline">{p.className}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {p.day} · S{p.session}
                      </Badge>
                      <Badge variant="outline">{p.vcLink}</Badge>
                      <StatusPill status={p.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" /> {p.teacher} · submitted {p.submittedAt}
                    </div>
                    <Textarea
                      value={feedback[p.id] ?? ""}
                      onChange={(e) => setFeedback((f) => ({ ...f, [p.id]: e.target.value }))}
                      placeholder="Optional feedback for the teacher…"
                      className="mt-3 min-h-16"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => decide(p.id, "approved")}
                      disabled={p.status === "approved"}
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(p.id, "returned")}
                      disabled={p.status === "returned"}
                      className="gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" /> Return
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ieps" className="space-y-3">
            {pendingIeps.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No IEP goals awaiting approval in {activeSemester}.
              </Card>
            )}
            {pendingIeps.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{g.domain}</Badge>
                      <Badge variant="outline">Level {g.level}</Badge>
                      <Badge variant="outline">{g.vcLink}</Badge>
                      <Badge variant="outline">{g.semester}</Badge>
                      <StatusPill status={(g.approval ?? "draft") as PlanStatus} />
                    </div>
                    <h3 className="mt-2 font-semibold">
                      {g.studentName} — {g.learningArea}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{g.smart}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Baseline: {g.baseline} · Evidence: {g.evidenceCount}
                    </div>
                    <div className="mt-3">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link
                          to="/ieps"
                          search={scopedSearch(activeSemester, { student: g.studentId })}
                        >
                          Open in IEP dashboard →
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => decideIep(g.id, "approved")}
                      disabled={g.approval === "approved"}
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideIep(g.id, "draft")}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" /> Return
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: PlanStatus }) {
  const map: Record<PlanStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    returned: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
