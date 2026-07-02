import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="My Students" subtitle="Every enrolled student, filterable by class, year level and support needs." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Whole-school student directory"
            points={[
              "Filter by class, year level, allied-health caseload and medical alerts",
              "Cross-portal search preserves semester scope",
              "Bulk export enrolments and NCCD categories",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
