import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Document Centre · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Document Centre"
          subtitle="Cloud-drive workspace for the whole school — IEPs, lesson plans, handovers, policies and more."
        />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="Document Centre (Milestone C)"
            points={[
              "19 top-level folders auto-seeded (IEPs, Weekly Lesson Plans, Handover Documents, Reports, Policies, PD, etc.)",
              "IEPs / Weekly Lesson Plans / Handover Documents auto-generate P1–P15, S1–S10, Semester 1/2 subfolders",
              "Pinned Leadership Templates on top of every class folder — undeletable by teachers",
              "Cloud-drive UI: search, filter, breadcrumbs, upload, rename, move, archive, download",
              "Storage bucket + RLS-backed permissions per folder",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
