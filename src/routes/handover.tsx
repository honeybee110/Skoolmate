import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleStub } from "@/components/module-stub";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, FileText, Pin, Upload } from "lucide-react";

export const Route = createFileRoute("/handover")({
  head: () => ({ meta: [{ title: "Handover Documents · SchoolMate AU" }] }),
  component: Handover,
});

const semesters = ["Semester 1 · 2026", "Semester 2 · 2026"];

function Handover() {
  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Handover Documents"
          subtitle="Class P7 · End-of-semester handover for the next teaching team."
        />

        {semesters.map((sem) => (
          <Card key={sem} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{sem}</h3>
              <Badge variant="outline" className="text-[10px]">Class P7</Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border bg-amber-50/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Pin className="h-3.5 w-3.5 text-amber-600" />
                  Leadership Templates
                  <Badge variant="secondary" className="ml-auto text-[10px]">Pinned</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Read-only templates from Leadership. Download and complete.
                </p>
                <ul className="mt-3 space-y-1 text-xs">
                  <li className="flex items-center gap-2"><FileText className="h-3 w-3" /> Handover_Template_v3.docx</li>
                  <li className="flex items-center gap-2"><FileText className="h-3 w-3" /> Medical_Alert_Handover.pdf</li>
                </ul>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Folder className="h-3.5 w-3.5 text-primary" />
                  Teacher Uploads
                  <button className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground">
                    <Upload className="h-3 w-3" /> Upload
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your completed handover documents. Leadership can view all uploads.
                </p>
                <p className="mt-3 text-xs text-muted-foreground italic">No files yet.</p>
              </div>
            </div>
          </Card>
        ))}

        <ModuleStub
          feature="Full Handover workspace shipping in Milestone C"
          points={[
            "Drive-style folder browser scoped to your class (P7).",
            "Semester 1 & Semester 2 with pinned Leadership Templates on top.",
            "Upload PDF/DOCX/PPTX/JPG/PNG — versioning and audit trail.",
            "Leadership can view every teacher's uploads across all classes.",
          ]}
        />
      </div>
    </AppShell>
  );
}
