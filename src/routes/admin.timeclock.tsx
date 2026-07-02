import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/timeclock")({
  head: () => ({ meta: [{ title: "Time & Attendance · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="Time & Attendance" subtitle="Staff clock-in/out and payroll export." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Staff Time Clock"
            points={[
              "One-tap clock-in / clock-out",
              "Break tracking & overtime flags",
              "Weekly rollup by staff & role",
              "CSV export for payroll",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
