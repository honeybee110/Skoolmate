import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { History, Filter, User, GraduationCap, CalendarClock, ClipboardList } from "lucide-react";
import { useDirectory, type AuditAction } from "@/lib/directory-store";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "Admin Activity Log · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "it"]}>
      <AppShell variant="admin">
        <ActivityPage />
      </AppShell>
    </RoleGate>
  ),
});

const CATEGORIES: Record<string, AuditAction[]> = {
  Teachers: ["teacher.add", "teacher.update", "teacher.archive", "teacher.restore"],
  Classes: ["class.create", "class.update", "class.assignTeacher", "class.addES", "class.removeES", "student.move"],
  Timetable: ["timetable.submit", "timetable.approve", "timetable.publish", "timetable.return"],
  Year: ["year.create", "year.activate", "year.archive", "year.duplicate"],
};

function categoryOf(a: AuditAction) {
  return Object.entries(CATEGORIES).find(([, list]) => list.includes(a))?.[0] ?? "Other";
}

function iconFor(cat: string) {
  switch (cat) {
    case "Teachers": return User;
    case "Classes": return GraduationCap;
    case "Timetable": return CalendarClock;
    default: return ClipboardList;
  }
}

function ActivityPage() {
  const { auditLog } = useDirectory();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    return auditLog.filter((e) => {
      if (cat !== "all" && categoryOf(e.action) !== cat) return false;
      if (query && !e.summary.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [auditLog, cat, query]);

  return (
    <>
      <PageHeader
        title="Admin Activity Log"
        subtitle="Every change to teachers, classes, timetables and school years — tamper-evident."
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <Card className="flex flex-wrap items-center gap-3 p-3">
          <Filter className="h-4 w-4 text-[color:var(--primary)]" />
          <Input placeholder="Search activity…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 max-w-sm" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.keys(CATEGORIES).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-auto">{filtered.length} events</Badge>
        </Card>

        {filtered.length === 0 ? (
          <Card className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <History className="h-4 w-4" /> No activity recorded yet. Admin actions will appear here.
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => {
              const category = categoryOf(e.action);
              const Icon = iconFor(category);
              return (
                <Card key={e.id} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 rounded-md bg-[color:var(--primary)]/10 p-2 text-[color:var(--primary)]"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{e.action}</Badge>
                      <Badge variant="outline" className="text-[10px]">{category}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-sm">{e.summary}</div>
                    <div className="text-[11px] text-muted-foreground">by {e.actor}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
