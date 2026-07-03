import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Notifications"
          subtitle="System, approval and messaging notifications for the Admin Portal."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Admin notification hub"
            points={[
              "Approval requests from teachers (lesson plans, IEP goals)",
              "System alerts (failed uploads, sync issues, permission requests)",
              "Reminders and broadcasts sent via the Reminders module",
              "Mark all read, filter by category, priority sorting",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
