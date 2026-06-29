import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ModuleStub } from "@/components/module-stub";
import { Upload, Camera } from "lucide-react";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Evidence Hub · SchoolMate AU" }] }),
  component: () => (
    <AppShell>
      <PageHeader
        title="Evidence Hub"
        subtitle="Photos, videos, documents, AAC samples, work samples — auto-linked to curriculum & IEP goals"
        actions={
          <>
            <Button variant="outline" size="sm"><Camera className="h-4 w-4" />Capture</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" />Upload</Button>
          </>
        }
      />
      <div className="px-4 py-6 md:px-8">
        <ModuleStub
          feature="Evidence-First Capture"
          points={[
            "One upload → AI tags by student, curriculum strand, and IEP goal",
            "Drag straight into reports, lessons, or behaviour notes",
            "Voice-to-evidence capture on the planned roadmap",
            "Strict per-student RLS — only your caseload and class",
          ]}
        />
      </div>
    </AppShell>
  ),
});
