import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({ meta: [{ title: "Teachers · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="Teachers" subtitle="All classroom teachers, their classes and workload." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Teacher directory"
            points={[
              "List of all teachers with class assignment, subjects and status",
              "Drill into lesson plan / IEP approval history",
              "Assign classes and cover teachers",
              "Signed in as leadership only",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
