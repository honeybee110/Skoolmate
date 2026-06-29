import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Settings" subtitle="Users, roles, system, Compass integration" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Admin & System Settings"
          points={[
            "Role management: Teacher / Allied Health / Learning Specialist / Admin",
            "Compass sync configuration (students, staff, classes, attendance, timetable)",
            "Branding, school year, term dates, curriculum version",
          ]}
        />
      </div>
    </AppShell>
  ),
});
