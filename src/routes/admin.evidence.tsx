import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/evidence")({
  head: () => ({ meta: [{ title: "Evidence Hub · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Evidence Hub"
          subtitle="Whole-school view of evidence captured against IEP goals — NCCD audit-ready."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="School-wide Evidence Hub"
            points={[
              "Filter evidence by class, learning area, semester and student",
              "Verify NCCD categorisation and download audit packs",
              "Cross-reference with IEP progress and specialist notes",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
