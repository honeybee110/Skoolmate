import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Users, ClipboardCheck, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reminders")({
  head: () => ({ meta: [{ title: "Reminders · SchoolMate AU" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <Reminders />
    </RoleGate>
  ),
});

const templates = [
  { id: "t1", icon: ClipboardCheck, label: "Lesson plan overdue", body: "Reminder: your lesson plan for tomorrow is still pending submission. Please submit by 4pm today." },
  { id: "t2", icon: FileText, label: "Semester IEP report due", body: "Semester 1 IEP reports are due Friday 27 June. Draft in the Reports module." },
  { id: "t3", icon: Users, label: "Staff meeting", body: "Whole-staff meeting this Thursday 3:30pm in the Hall. Agenda posted in Resource Bank." },
];

const audiences = ["All teachers", "P5–P8 team", "Allied Health", "Wellbeing team", "Leadership"];

function Reminders() {
  const [audience, setAudience] = useState(audiences[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message before sending.");
      return;
    }
    toast.success(`Reminder sent to ${audience}.`);
    setSubject("");
    setBody("");
  };

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Reminders"
        subtitle="Send targeted notifications to staff groups."
      />
      <div className="px-4 py-6 md:px-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Audience</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {audiences.map((a) => (
                <Button
                  key={a}
                  variant={audience === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAudience(a)}
                  className="rounded-full"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2" placeholder="e.g. Lesson plans due today" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-2 min-h-32" placeholder="Write your reminder…" />
          </div>
          <div className="flex justify-end">
            <Button onClick={send} className="gap-1.5">
              <Send className="h-4 w-4" /> Send reminder
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Quick templates</h3>
          </div>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSubject(t.label);
                  setBody(t.body);
                }}
                className="w-full rounded-lg border p-3 text-left text-sm hover:bg-secondary/50"
              >
                <div className="flex items-center gap-2 font-medium">
                  <t.icon className="h-4 w-4 text-primary" />
                  {t.label}
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</div>
              </button>
            ))}
          </div>
          <Badge variant="outline" className="mt-3 w-full justify-center">Sends log · Milestone 4</Badge>
        </Card>
      </div>
    </AppShell>
  );
}
