import { Link } from "@tanstack/react-router";
import type { Student } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { BehaviourPill, AttendanceDot } from "@/components/status-chips";
import { cn } from "@/lib/utils";
import { AlertCircle, MessageSquareText } from "lucide-react";

export function StudentCard({ student }: { student: Student }) {
  return (
    <Link
      to="/students/$studentId"
      params={{ studentId: student.id }}
      className="group block"
    >
      <Card className="p-4 transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 hover:border-primary/30">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-foreground/70",
              student.avatarColor
            )}
          >
            {student.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold leading-tight">
                {student.firstName} {student.lastName}
              </h3>
              <AttendanceDot status={student.attendance} />
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {student.yearLevel} · {student.className}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <BehaviourPill status={student.behaviour} />
              {student.aacUser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  <MessageSquareText className="h-3 w-3" /> AAC
                </span>
              )}
              {student.medicalAlerts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" /> {student.medicalAlerts.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{student.iepGoalsAchieved}</span>
            <span className="text-muted-foreground"> / {student.iepGoalsActive} goals</span>
          </span>
          <span className="truncate text-right max-w-[60%]">{student.latestEvidence}</span>
        </div>
      </Card>
    </Link>
  );
}
