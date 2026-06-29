import { cn } from "@/lib/utils";
import type { BehaviourStatus, AttendanceStatus } from "@/lib/mock-data";

export function BehaviourPill({ status }: { status: BehaviourStatus }) {
  const map: Record<BehaviourStatus, { label: string; className: string }> = {
    calm: { label: "Calm", className: "bg-success/15 text-success" },
    settled: { label: "Settled", className: "bg-primary-soft text-primary" },
    alert: { label: "Watching", className: "bg-warning/20 text-warning-foreground" },
    incident: { label: "Incident", className: "bg-accent/20 text-accent-foreground" },
  };
  const { label, className } = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {label}
    </span>
  );
}

export function AttendanceDot({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, string> = {
    present: "bg-success",
    late: "bg-warning",
    partial: "bg-accent",
    absent: "bg-destructive",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[status])} title={status} />;
}
