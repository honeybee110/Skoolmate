import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Resource Bank · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader title="Resource Bank" subtitle="Numeracy · Literacy · Electives — with AI-recommended matches per lesson" />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Searchable Resource Library"
          points={[
            "Twinkl, Topmarks, Starfall, Boardmaker, Canva — and your school's own files",
            "Tag, favourite, and share with your team",
            "AI suggests resources inside the Lesson Planner based on goals + sensory needs",
          ]}
        />
      </div>
    </AppShell>
  ),
});
