import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/behaviour")({
  head: () => ({ meta: [{ title: "Behaviour Analytics · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing", "allied_health"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Behaviour Analytics"
          subtitle="Whole-school behaviour trends, incidents, and positive-behaviour supports."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Behaviour analytics for leadership"
            points={[
              "Heatmap of incidents by class, time of day and semester",
              "Track intensity of support and function-of-behaviour trends",
              "Alert Wellbeing when thresholds are crossed",
              "Cross-team recommendations with Behaviour Specialist and OT",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
