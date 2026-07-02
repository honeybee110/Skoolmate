import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/allied-health")({
  head: () => ({ meta: [{ title: "Allied Health · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health"]}>
      <AppShell variant="admin">
        <PageHeader title="Allied Health" subtitle="OT, Speech, Physio, Psychology & Behaviour caseloads." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Allied Health Team Hub"
            points={[
              "Caseload by clinician",
              "Referral & consent tracking",
              "Session notes linked to IEP goals",
              "Cross-team recommendations",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
