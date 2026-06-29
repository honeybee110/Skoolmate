import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Reports" subtitle="Semester reports · IEP reports · Behaviour reports — AI-drafted from Evidence Hub" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="AI Reporting + IEP Report Workflow"
          points={[
            "Per-subject teacher comments, curriculum level, progress summary, up to 3 evidence photos",
            "AI draft → teacher edits → Learning Specialist approval → Leadership approval",
            "Auto PDF generation, published to the Parent Portal",
            "Full audit trail of edits & approvals",
          ]}
        />
      </div>
    </AppShell>
  ),
});
