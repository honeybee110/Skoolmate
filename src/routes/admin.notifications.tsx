import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell, Plus, CheckCheck, Trash2, AlertTriangle, ClipboardCheck, Info,
  Loader2, Search, Megaphone,
} from "lucide-react";
import {
  listAdminNotifications, createAdminNotification, markNotificationRead,
  markAllRead, deleteAdminNotification, type AdminNotification,
} from "@/lib/admin-notifications.functions";
import { listWeeklyUploads } from "@/lib/lesson-uploads.functions";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["leadership", "allied_health", "wellbeing", "it"]}>
      <NotificationsPage />
    </RoleGate>
  ),
});

const CATEGORIES = ["Approval", "System", "Reminder", "Broadcast", "Wellbeing", "IT"] as const;

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminNotifications);
  const createFn = useServerFn(createAdminNotification);
  const readFn = useServerFn(markNotificationRead);
  const allReadFn = useServerFn(markAllRead);
  const delFn = useServerFn(deleteAdminNotification);
  const uploadsFn = useServerFn(listWeeklyUploads);

  const query = useQuery({ queryKey: ["admin-notifications"], queryFn: () => listFn() });
  const uploadsQuery = useQuery({ queryKey: ["weekly-uploads"], queryFn: () => uploadsFn() });

  const notifs = query.data ?? [];
  const [tab, setTab] = useState<"all" | "unread">("unread");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");

  const pendingUploads = (uploadsQuery.data ?? []).filter((u) => u.status === "pending");

  // Derived "system" notification for pending lesson-plan approvals.
  const derived: AdminNotification[] = useMemo(() => {
    if (pendingUploads.length === 0) return [];
    return [{
      id: "derived-approvals",
      category: "Approval",
      title: `${pendingUploads.length} weekly lesson plan${pendingUploads.length === 1 ? "" : "s"} awaiting approval`,
      body: `Classes: ${Array.from(new Set(pendingUploads.map((u) => u.class_name).filter(Boolean))).join(", ") || "unspecified"}`,
      priority: "high",
      target_group: "leadership",
      link_url: "/admin/approvals",
      created_by: null,
      created_at: new Date().toISOString(),
      read_by: [],
    }];
  }, [pendingUploads]);

  const combined = useMemo(() => [...derived, ...notifs], [derived, notifs]);

  const filtered = useMemo(() => {
    return combined.filter((n) => {
      if (tab === "unread" && user && n.read_by.includes(user.id)) return false;
      if (category !== "all" && n.category !== category) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (!`${n.title} ${n.body ?? ""} ${n.category}`.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [combined, tab, category, q, user]);

  const unreadCount = user ? combined.filter((n) => !n.read_by.includes(user.id)).length : combined.length;

  const create = useMutation({
    mutationFn: (v: { category: string; title: string; body?: string; priority: "low"|"normal"|"high"; target_group?: string; link_url?: string }) => createFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("Notification sent."); },
    onError: (e: Error) => toast.error(e.message),
  });
  const read = useMutation({
    mutationFn: (id: string) => readFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });
  const allRead = useMutation({
    mutationFn: () => allReadFn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("All marked as read."); },
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("Deleted."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Notifications"
        subtitle="Approval requests, system alerts, reminders and broadcasts across the Admin Portal."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />{unreadCount} unread
            </Badge>
            <Button size="sm" variant="outline" onClick={() => allRead.mutate()}>
              <CheckCheck className="h-4 w-4" />Mark all read
            </Button>
            <NewNotificationDialog onSubmit={(v) => create.mutate(v)} loading={create.isPending} />
          </div>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications…" className="h-9 pl-8" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-2">
            {(query.isLoading || uploadsQuery.isLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />Loading notifications…
              </div>
            )}
            {!query.isLoading && filtered.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No notifications match your filters. Enjoy the quiet moment.
              </Card>
            )}
            {filtered.map((n) => {
              const isRead = user ? n.read_by.includes(user.id) : false;
              const isDerived = n.id.startsWith("derived-");
              const Icon = n.category === "Approval" ? ClipboardCheck : n.category === "System" ? AlertTriangle : n.category === "Broadcast" ? Megaphone : Info;
              return (
                <Card key={n.id} className={cn(
                  "p-3 flex items-start gap-3",
                  !isRead && "border-primary/30 bg-primary-soft/20",
                  n.priority === "high" && "border-l-4 border-l-rose-500",
                )}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold">{n.title}</span>
                      <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                      {n.priority === "high" && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]">High</Badge>}
                      {n.target_group && <Badge variant="outline" className="text-[10px]">{n.target_group}</Badge>}
                    </div>
                    {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {n.link_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={n.link_url}>Open</a>
                      </Button>
                    )}
                    {!isRead && !isDerived && (
                      <Button size="sm" variant="ghost" onClick={() => read.mutate(n.id)}>Mark read</Button>
                    )}
                    {!isDerived && (
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function NewNotificationDialog({ onSubmit, loading }: {
  onSubmit: (v: { category: string; title: string; body?: string; priority: "low"|"normal"|"high"; target_group?: string; link_url?: string }) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("Broadcast");
  const [priority, setPriority] = useState<"low"|"normal"|"high">("normal");
  const [target, setTarget] = useState("");

  function submit() {
    if (!title.trim()) return toast.error("Title is required.");
    onSubmit({ category, title: title.trim(), body: body.trim() || undefined, priority, target_group: target.trim() || undefined });
    setOpen(false);
    setTitle(""); setBody(""); setTarget("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body (optional)" rows={3} />
          <div className="grid grid-cols-3 gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Audience (opt.)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
