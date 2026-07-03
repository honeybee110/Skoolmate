import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/wellbeing")({
  head: () => ({ meta: [{ title: "Wellbeing · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing"]}>
      <AppShell variant="admin">
        <PageHeader title="Wellbeing" subtitle="Nurse, Wellbeing & Attendance officer dashboards." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Wellbeing Hub"
            points={[
              "Medical alert register & PRN medication log",
              "Attendance patterns · at-risk flags",
              "Wellbeing check-ins",
              "Confidential incident notes (role-scoped)",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
