import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ModuleStub({
  feature,
  points,
  extra,
}: {
  feature: string;
  points: string[];
  extra?: ReactNode;
}) {
  return (
    <>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/30 via-background to-background p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold tracking-tight">{feature}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scoped in the PRD and ready to build. Detailed UI lands in the next pass — pick this module to prioritise it.
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
      {extra}
    </>
  );
}
