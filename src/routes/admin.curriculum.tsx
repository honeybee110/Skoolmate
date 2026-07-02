import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/curriculum")({
  head: () => ({ meta: [{ title: "Curriculum & Scope and Sequence · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Curriculum & Scope and Sequence"
          subtitle="Victorian Curriculum 2.0 scope and sequence — school-wide view for Leadership."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Whole-school scope and sequence"
            points={[
              "Publish scope and sequence per semester and per learning area",
              "Aligned to Victorian Curriculum 2.0 levels A–D and 1–10",
              "Compare planned vs delivered coverage across classes",
              "Feeds the teacher-facing Scope & Sequence picker",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
