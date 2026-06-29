import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/behaviour")({
  head: () => ({ meta: [{ title: "Behaviour & Wellbeing · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Behaviour & Wellbeing" subtitle="ABC data, triggers, heatmaps, positive behaviour tracking" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Behaviour Analytics & ABC Dashboard"
          points={[
            "Quick ABC incident logging from the dashboard",
            "Time × location heatmaps to surface patterns",
            "AI insight: \"Noah's incidents cluster at 11:15 after recess\"",
            "Positive behaviour tracking with severity indicators",
          ]}
        />
      </div>
    </AppShell>
  ),
});
