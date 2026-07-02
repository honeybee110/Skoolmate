import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["it", "leadership"]}>
      <AppShell variant="admin">
        <PageHeader title="User Management" subtitle="Invite staff, assign roles, deactivate accounts." />
        <div className="px-4 py-6 md:px-8">
          <ModuleStub
            feature="User & Role Management"
            points={[
              "Invite by email · assign role and role group",
              "Bulk import staff from CSV",
              "Deactivate & audit sign-in history",
              "Wired to user_roles & profiles (RLS-safe)",
            ]}
          />
        </div>
      </AppShell>
    </RoleGate>
  ),
});
