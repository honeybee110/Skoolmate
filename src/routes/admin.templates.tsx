import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/templates")({
  head: () => ({ meta: [{ title: "Leadership Templates · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Leadership Templates"
          subtitle="Master templates pinned to every class's IEP, Lesson Plan and Handover folders."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Leadership Templates library"
            points={[
              "Master templates for IEP goals, weekly lesson plans, and handover documents",
              "Automatically pinned at the top of every P1–P15 and S1–S10 class folder",
              "Version history — teachers always see the latest",
              "Teachers can download but cannot edit or delete templates",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
