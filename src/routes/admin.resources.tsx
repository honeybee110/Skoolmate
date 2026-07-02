import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/resources")({
  head: () => ({ meta: [{ title: "Resource Bank Management · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "learning_specialist" as never, "it"]}>
      <AppShell variant="admin">
        <PageHeader title="Resource Bank Management" subtitle="Curate the school's shared teaching resources." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Resource curation for leadership"
            points={[
              "Approve teacher-submitted resources before they appear school-wide",
              "Tag by learning area, year level and Victorian Curriculum descriptor",
              "Bulk import from Twinkl, Boardmaker, PODD and in-house uploads",
              "Retire outdated resources without breaking historical lesson plans",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
