import { type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function makeStubRoute(
  path:
    | "/classes" | "/calendar" | "/lessons" | "/ieps" | "/resources"
    | "/evidence" | "/behaviour" | "/reports" | "/settings" | "/parent",
  title: string,
  subtitle: string,
  body: ReactNode,
) {
  return createFileRoute(path)({
    head: () => ({ meta: [{ title: `${title} · SchoolMate AU` }] }),
    component: () => (
      <AppShell>
        <PageHeader title={title} subtitle={subtitle} />
        <div className="px-4 py-6 md:px-8">{body}</div>
      </AppShell>
    ),
  });
}

export function ComingSoon({ feature, points }: { feature: string; points: string[] }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/30 via-background to-background p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight">{feature} — designed, building next</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is part of Phase 2 of the SchoolMate AU shell. The data model and AI flows are scoped — the polished UI for this surface lands in the next build pass.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
