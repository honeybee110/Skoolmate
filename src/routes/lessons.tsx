import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ModuleStub } from "@/components/module-stub";
import { Sparkles, Plus } from "lucide-react";

export const Route = createFileRoute("/lessons")({
  head: () => ({ meta: [{ title: "Lesson Planner · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader
        title="Lesson Planner"
        subtitle="Aligned to Victorian Curriculum 2.0 · AI-assisted"
        actions={
          <>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4" />Blank lesson</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Sparkles className="h-4 w-4" />Generate with AI</Button>
          </>
        }
      />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="AI Lesson Planner & Approval"
          points={[
            "Generate Learning intention · Success criteria · Hook · I do / We do / You do",
            "Auto-suggest differentiation, AAC supports, sensory & behaviour supports",
            "Resource Bank recommendations (Twinkl, Topmarks, Starfall, Boardmaker, Canva)",
            "Submit → Learning Specialist reviews → Approve or return",
          ]}
        />
      </div>
    </AppShell>
  ),
});
