import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="Analytics" subtitle="School-wide performance and wellbeing signals." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Whole-School Analytics"
            points={[
              "IEP goal completion by domain & class",
              "Behaviour trend heatmap",
              "Attendance patterns · at-risk flags",
              "Lesson plan submission rate",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
