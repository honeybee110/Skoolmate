import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { BehaviourCentre } from "@/components/behaviour/behaviour-centre";

export const Route = createFileRoute("/admin/behaviour")({
  head: () => ({
    meta: [
      { title: "Behaviour Intelligence Centre · SkoolMate Admin" },
      {
        name: "description",
        content:
          "Whole-school behaviour intelligence: risk levels, recurring behaviour chains, functional hypotheses and intervention rankings.",
      },
      { property: "og:title", content: "Behaviour Intelligence Centre · SkoolMate Admin" },
      {
        property: "og:description",
        content:
          "Leadership view of school-wide behaviour patterns, escalation forecasts and intervention effectiveness.",
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
          subtitle="Whole-school behaviour insight for leadership, wellbeing and allied health teams."
        />
        <BehaviourCentre scope="admin" />
      </AppShell>
    </RoleGate>
  ),
});
