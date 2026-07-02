import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Reports"
          subtitle="Semester reports for IEPs, behaviour, attendance and NCCD — whole-school view."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="School-wide reporting"
            points={[
              "Semester report packs per class, per year level, per learning area",
              "Sign-off pipeline with Leadership approval",
              "Export bundled PDFs to parent portals and DE compliance",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
