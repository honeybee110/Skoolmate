import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Classes · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="My Classes" subtitle="Rosella · Year 3 — plus any classes you teach across" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Class Dashboard"
          points={[
            "8 student cards per class with quick profile access",
            "Attendance overview at a glance",
            "Behaviour + learning summary per student",
            "Class-level evidence and lesson timeline",
          ]}
        />
      </div>
    </AppShell>
  ),
});
