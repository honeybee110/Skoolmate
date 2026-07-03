import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Users, ClipboardList, CalendarClock, Link2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/allied-health")({
  head: () => ({ meta: [{ title: "Allied Health · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health"]}>
      <AlliedHealth />
    </RoleGate>
  ),
});

const clinicians = [
  { name: "R. Aoki", role: "Occupational Therapy", caseload: 22, sessions: 18, alerts: 2, tone: "bg-emerald-100 text-emerald-700" },
  { name: "P. Devi", role: "Speech Pathology", caseload: 28, sessions: 21, alerts: 3, tone: "bg-blue-100 text-blue-700" },
  { name: "T. Nguyen", role: "Physiotherapy", caseload: 12, sessions: 9, alerts: 0, tone: "bg-violet-100 text-violet-700" },
  { name: "M. Osei", role: "Psychology", caseload: 15, sessions: 11, alerts: 1, tone: "bg-amber-100 text-amber-700" },
  { name: "S. Ali", role: "Behaviour Specialist", caseload: 9, sessions: 7, alerts: 4, tone: "bg-rose-100 text-rose-700" },
];

const referrals = [
  { student: "Noah Williams", need: "OT · sensory profile review", status: "New", days: 2, tone: "bg-accent/15 text-accent-foreground" },
  { student: "Aaliyah Tahir", need: "SLP · AAC device evaluation", status: "Consent sent", days: 5, tone: "bg-amber-100 text-amber-800" },
  { student: "Jack O'Brien", need: "Behaviour · FBA follow-up", status: "In session", days: 1, tone: "bg-emerald-100 text-emerald-700" },
  { student: "Zara Patel", need: "Physio · gait assessment", status: "Scheduled", days: 8, tone: "bg-blue-100 text-blue-700" },
];

const notes = [
  { clinician: "R. Aoki (OT)", student: "Mia Nguyen", goal: "Fine-motor · pencil grip", date: "Today 11:20", body: "Introduced triangular pencil grip. Mia maintained grip for 4 minutes with two verbal prompts. Progressed from working towards → achieved on tripod hold." },
  { clinician: "P. Devi (SLP)", student: "Zara Patel", goal: "English · Speaking & Listening", date: "Yesterday 14:00", body: "Modelled 3-word phrases with core board. 8/10 exchanges independent. Recommend generalising to snack time in P7." },
  { clinician: "S. Ali (Behaviour)", student: "Noah Williams", goal: "Personal & Social · Regulation", date: "2 days ago", body: "Reduced 11:15 sensory incidents from 3 → 1 with proactive break. Continue visual timer strategy." },
];

function AlliedHealth() {
  return (
    <AppShell variant="admin">
      <PageHeader
        title="Allied Health"
        subtitle="OT, Speech, Physio, Psychology & Behaviour caseloads across Rosella Campus."
        actions={
          <>
            <Button size="sm" variant="outline"><CalendarClock className="h-4 w-4" /> Roster</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> New referral</Button>
          </>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* Team caseloads */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Team caseloads</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {clinicians.map((c) => (
              <Card key={c.name} className="p-4">
                <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", c.tone)}>
                  <Stethoscope className="h-3 w-3" /> {c.role}
                </div>
                <div className="mt-2 text-sm font-semibold">{c.name}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-lg font-semibold tabular-nums">{c.caseload}</div><div className="text-[10px] text-muted-foreground">Caseload</div></div>
                  <div><div className="text-lg font-semibold tabular-nums text-primary">{c.sessions}</div><div className="text-[10px] text-muted-foreground">This wk</div></div>
                  <div><div className={cn("text-lg font-semibold tabular-nums", c.alerts > 0 ? "text-accent" : "text-muted-foreground")}>{c.alerts}</div><div className="text-[10px] text-muted-foreground">Alerts</div></div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
          {/* Referral pipeline */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4" /> Referral & consent pipeline</div>
              <Badge variant="outline">{referrals.length} active</Badge>
            </div>
            <div className="divide-y">
              {referrals.map((r) => (
                <div key={r.student} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{r.student}</div>
                    <div className="text-[11px] text-muted-foreground">{r.need}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]", r.tone)}>{r.status}</Badge>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{r.days}d</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cross-team recommendations */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> Cross-team recommendations
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="rounded-md border p-3">
                <div className="text-xs font-semibold text-primary">Noah Williams</div>
                <p className="mt-1 text-[12px] leading-snug">OT + Behaviour align: proactive sensory break at 11:10 before Maths — evidenced across 3 weeks.</p>
              </li>
              <li className="rounded-md border p-3">
                <div className="text-xs font-semibold text-primary">Aaliyah Tahir</div>
                <p className="mt-1 text-[12px] leading-snug">SLP AAC device recommendation ready for parent consent. Trial in Learn to Play sessions.</p>
              </li>
              <li className="rounded-md border p-3">
                <div className="text-xs font-semibold text-primary">Zara Patel</div>
                <p className="mt-1 text-[12px] leading-snug">Physio + PE — gait supports functional PE participation. Update IEP goal descriptor.</p>
              </li>
            </ul>
          </Card>
        </div>

        {/* Recent session notes */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4" /> Session notes linked to IEP goals</div>
            <Button size="sm" variant="ghost">View all</Button>
          </div>
          <div className="divide-y">
            {notes.map((n, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{n.clinician}</Badge>
                  <span className="font-medium">{n.student}</span>
                  <Badge variant="outline" className="text-[10px]">{n.goal}</Badge>
                  <span className="ml-auto text-[11px] text-muted-foreground">{n.date}</span>
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
