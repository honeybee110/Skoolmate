import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { students } from "@/lib/mock-data";
import { BehaviourPill, AttendanceDot } from "@/components/status-chips";
import { Filter, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students · SchoolMate AU" }] }),
  component: StudentsList,
});

function StudentsList() {
  return (
    <AppShell>
      <PageHeader
        title="Students"
        subtitle="All students across your classes and caseload"
        actions={
          <>
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" />Filter</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />Add student</Button>
          </>
        }
      />
      <div className="px-4 py-6 md:px-8">
        <div className="relative mb-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, year, class…"
            className="w-full rounded-full border bg-card py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Today</th>
                <th className="px-4 py-3 font-medium">Behaviour</th>
                <th className="px-4 py-3 font-medium">IEP progress</th>
                <th className="px-4 py-3 font-medium">Medical</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to="/students/$studentId" params={{ studentId: s.id }} className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${s.avatarColor}`}>
                        {s.initials}
                      </span>
                      <span>
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <span className="block text-[11px] text-muted-foreground">{s.yearLevel}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.className}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs capitalize">
                      <AttendanceDot status={s.attendance} /> {s.attendance}
                    </span>
                  </td>
                  <td className="px-4 py-3"><BehaviourPill status={s.behaviour} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(s.iepGoalsAchieved / s.iepGoalsActive) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">{s.iepGoalsAchieved}/{s.iepGoalsActive}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.medicalAlerts.length ? s.medicalAlerts.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}
