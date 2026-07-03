import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({ meta: [{ title: "Classes · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <PageHeader title="My Classes" subtitle="Every Primary and Secondary class in the school." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="School-wide class list"
            points={[
              "Primary P1–P15 and Secondary S1–S10",
              "Teacher, aides, student count, semester progress",
              "Drill into class dashboard, timetable and IEPs",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
