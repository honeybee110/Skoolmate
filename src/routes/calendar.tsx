import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Calendar" subtitle="Lessons, meetings, therapy, medication, due dates, reports" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Unified Calendar & Notifications"
          points={[
            "Pulls from Compass sync (students, staff, timetable, attendance)",
            "Per-role views — Teacher / Allied Health / Specialist / Admin",
            "Medication and PRN reminders flagged in the Action Queue",
          ]}
        />
      </div>
    </AppShell>
  ),
});
