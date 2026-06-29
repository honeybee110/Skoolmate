import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/ieps")({
  head: () => ({ meta: [{ title: "IEPs · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Individual Education Plans" subtitle="AI-assisted goal creation, Cross-Check progression, curriculum mapping" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="IEP System with Cross-Check Progress"
          points={[
            "AI suggests goals from entry skills + curriculum strand",
            "Each goal tracks Developing → Working Towards → Achieved",
            "Evidence Hub auto-links to goals — no double entry",
            "Generates draft IEP reports with up to 3 evidence photos per subject",
          ]}
        />
      </div>
    </AppShell>
  ),
});
