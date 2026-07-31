import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { BehaviourCentre } from "@/components/behaviour/behaviour-centre";

export const Route = createFileRoute("/behaviour")({
  head: () => ({
    meta: [
      { title: "Behaviour Intelligence Centre · SkoolMate" },
      {
        name: "description",
        content:
          "Turn ABC behaviour records into decision support: trends, triggers, sequences, intervention effectiveness and heat maps.",
      },
      { property: "og:title", content: "Behaviour Intelligence Centre · SkoolMate" },
      {
        property: "og:description",
        content:
          "Evidence-based behaviour analytics for teachers, allied health staff and school leaders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BehaviourPage,
});

function BehaviourPage() {
  return (
    <AppShell>
      <PageHeader
        title="Behaviour Intelligence Centre"
        subtitle="ABC analysis, trigger detection, escalation forecasting and intervention effectiveness — evidence first."
      />
      <BehaviourCentre scope="teacher" />
    </AppShell>
  );
}
