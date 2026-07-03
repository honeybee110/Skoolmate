import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Target, BookOpen, MessageSquare, Camera, ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications · skoolmate" }] }),
  component: NotificationsPage,
});

type Cat = "all" | "approvals" | "iep" | "evidence" | "messages" | "system";
interface Notif {
  id: string;
  category: Exclude<Cat, "all">;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  actor?: string;
}

const seed: Notif[] = [
  { id: "n1", category: "approvals", title: "Lesson plan approved", body: "K. Patel approved 'Wed · Maths — Algebra'. Ready to teach.", time: "12 min ago", unread: true, actor: "K. Patel" },
  { id: "n2", category: "iep", title: "IEP goal returned for edits", body: "Mia Nguyen · Maths · Number — reviewer requested clearer baseline.", time: "42 min ago", unread: true, actor: "K. Patel" },
  { id: "n3", category: "evidence", title: "AI linked 3 photos", body: "Turn-taking session photos linked to Jack O'Brien's Personal & Social goal.", time: "1 hr ago", unread: true },
  { id: "n4", category: "messages", title: "Specialist note added", body: "Music specialist added a note for Zara Patel (Semester 1).", time: "2 hr ago", unread: false, actor: "Music Specialist" },
  { id: "n5", category: "approvals", title: "IEP goal approved", body: "Aaliyah Tahir · English — approved. Now visible in the parent portal.", time: "Yesterday", unread: false, actor: "K. Patel" },
  { id: "n6", category: "system", title: "Semester 2 reports draft due Fri 4 Jul", body: "8 students remaining. Auto-reminders enabled.", time: "Yesterday", unread: false },
  { id: "n7", category: "iep", title: "Cross-check descriptor moved", body: "Noah Williams · Personal & Social — Working Towards → Achieved.", time: "2 days ago", unread: false },
  { id: "n8", category: "messages", title: "Reminder from leadership", body: "PLC meeting Thursday 3:15pm — bring semester 2 IEP updates.", time: "3 days ago", unread: false, actor: "Principal" },
];

const iconFor: Record<Notif["category"], typeof Bell> = {
  approvals: ShieldCheck,
  iep: Target,
  evidence: Camera,
  messages: MessageSquare,
  system: BookOpen,
};
const toneFor: Record<Notif["category"], string> = {
  approvals: "bg-emerald-100 text-emerald-700",
  iep: "bg-primary-soft text-primary",
  evidence: "bg-violet-100 text-violet-700",
  messages: "bg-amber-100 text-amber-800",
  system: "bg-slate-100 text-slate-700",
};

function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>(seed);
  const [cat, setCat] = useState<Cat>("all");
  const filtered = cat === "all" ? items : items.filter((n) => n.category === cat);
  const unread = items.filter((n) => n.unread).length;

  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const toggle = (id: string) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));

  const tabs: { key: Cat; label: string }[] = [
    { key: "all", label: `All (${items.length})` },
    { key: "approvals", label: "Approvals" },
    { key: "iep", label: "IEP" },
    { key: "evidence", label: "Evidence" },
    { key: "messages", label: "Messages" },
    { key: "system", label: "System" },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · real-time updates across approvals, IEP goals, evidence and messages`}
        actions={
          <Button size="sm" variant="outline" onClick={markAll} disabled={!unread}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <div className="px-4 py-6 md:px-8 space-y-4">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1 text-xs w-fit">
          <Bell className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setCat(t.key)} className={cn("rounded-md px-2.5 py-1 transition", cat === t.key ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
              {t.label}
            </button>
          ))}
        </div>

        <Card className="divide-y">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications in this category.</div>
          )}
          {filtered.map((n) => {
            const Icon = iconFor[n.category];
            return (
              <div key={n.id} onClick={() => toggle(n.id)} className={cn("flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/40 transition", n.unread && "bg-primary-soft/20")}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneFor[n.category])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {n.actor && <Badge variant="outline" className="text-[10px] font-normal">{n.actor}</Badge>}
                    {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{n.body}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {n.time}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </AppShell>
  );
}
