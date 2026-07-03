import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="Admin Settings" subtitle="School configuration, branding, integrations and policies." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="School settings"
            points={[
              "School details, semester dates, term calendar (VIC DE aligned)",
              "Branding, email templates, parent-portal appearance",
              "Third-party integrations (Compass, Sentral, XUNO, SSO)",
              "Data retention and privacy controls",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
