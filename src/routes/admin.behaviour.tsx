import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { BehaviourLeadership } from "@/components/behaviour/behaviour-leadership";

export const Route = createFileRoute("/admin/behaviour")({
  head: () => ({
    meta: [
      { title: "Behaviour Intelligence Centre · SkoolMate Admin" },
      {
        name: "description",
        content:
          "Executive behaviour analytics for school leaders: class heat maps, intervention queues, capacity index and leadership alerts.",
      },
      { property: "og:title", content: "Behaviour Intelligence Centre · SkoolMate Admin" },
      {
        property: "og:description",
        content:
          "School-wide behaviour operational insight: risk, teaching time lost, intervention priorities and drill-down class intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing", "allied_health"]}>
      <AppShell variant="admin">
        <PageHeader
          title="Behaviour Intelligence Centre"
          subtitle="School-wide behaviour operations for leadership — heat maps, intervention priorities and capacity planning."
        />
        <BehaviourLeadership />
      </AppShell>
    </RoleGate>
  ),
});

