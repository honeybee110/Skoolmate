import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BellRing, FlaskConical, Loader2, Save, Send, Trash2, Users, ArrowLeft,
} from "lucide-react";
import {
  ALERT_RULES, LEADERSHIP_ROLES, defaultAlertRuleConfig, mergeConfig,
  type AlertRuleKey, type AlertThresholds,
} from "@/lib/leadership-alert-rules";
import {
  getAlertSettings, saveAlertSettings, listAlertSubscriptions, upsertAlertSubscription,
  deleteAlertSubscription, previewAlertRules, dispatchLeadershipAlerts, listAlertDeliveries,
} from "@/lib/leadership-alerts.functions";
import { CAMPUSES } from "@/lib/behaviour-leadership";

export const Route = createFileRoute("/admin/behaviour/alerts")({
  head: () => ({
    meta: [
      { title: "Leadership Alert Rules · SkoolMate Admin" },
      {
        name: "description",
        content:
          "Configure behaviour alert thresholds, subscribe leaders by campus and role, and test alert rules before switching them on.",
      },
      { property: "og:title", content: "Leadership Alert Rules · SkoolMate Admin" },
      {
        property: "og:description",
        content:
          "Threshold configuration, campus and role subscriptions, and a dry-run tester for behaviour leadership alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGate groups={["leadership", "wellbeing", "allied_health"]}>
      <AlertsAdminPage />
    </RoleGate>
  ),
});

const THRESHOLD_FIELDS: { key: keyof AlertThresholds; label: string; hint: string; suffix: string }[] = [
  { key: "riskIncreasePct", label: "Risk change", hint: "Week-on-week incident increase that raises a critical alert.", suffix: "%" },
  { key: "capacityIndexHigh", label: "Capacity index ceiling", hint: "Behaviour Capacity Index at or above this is a resourcing signal.", suffix: "/100" },
  { key: "deEscalationFloorPct", label: "De-escalation floor", hint: "Alert when fewer incidents than this resolve within 10 minutes.", suffix: "%" },
  { key: "teachingTimeLostMins", label: "Teaching time lost", hint: "Minutes lost per class in the period before alerting.", suffix: "min" },
  { key: "emergingPatternSharePct", label: "Emerging pattern share", hint: "Share of a class's incidents in one antecedent, place or time window.", suffix: "%" },
  { key: "improvementDropPct", label: "Improvement drop", hint: "Week-on-week drop worth sharing with other classes.", suffix: "%" },
  { key: "minIncidents", label: "Minimum incidents", hint: "Pattern rules stay quiet below this many incidents in scope.", suffix: "" },
];

function AlertsAdminPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getAlertSettings);
  const saveFn = useServerFn(saveAlertSettings);
  const subsFn = useServerFn(listAlertSubscriptions);
  const upsertSubFn = useServerFn(upsertAlertSubscription);
  const delSubFn = useServerFn(deleteAlertSubscription);
  const previewFn = useServerFn(previewAlertRules);
  const dispatchFn = useServerFn(dispatchLeadershipAlerts);
  const deliveriesFn = useServerFn(listAlertDeliveries);

  const settingsQ = useQuery({ queryKey: ["alert-settings"], queryFn: () => getFn() });
  const subsQ = useQuery({ queryKey: ["alert-subs"], queryFn: () => subsFn() });
  const deliveriesQ = useQuery({ queryKey: ["alert-deliveries"], queryFn: () => deliveriesFn() });

  const [draft, setDraft] = useState(defaultAlertRuleConfig);
  useEffect(() => {
    if (settingsQ.data) setDraft(mergeConfig(settingsQ.data));
  }, [settingsQ.data]);

  const [scopeCampus, setScopeCampus] = useState("all");

  const save = useMutation({
    mutationFn: () => saveFn({ data: draft }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-settings"] });
      toast.success("Alert rules saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const preview = useMutation({
    mutationFn: () => previewFn({ data: { config: draft, scope: { campus: scopeCampus, term: "all", from: "", to: "" } } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const dispatch = useMutation({
    mutationFn: () => dispatchFn({ data: { scope: { campus: scopeCampus, term: "all", from: "", to: "" } } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["alert-deliveries"] });
      toast.success(`${r.inAppSent} in-app and ${r.emailQueued} email alerts dispatched.`);
      r.notes.forEach((n) => toast.info(n));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delSub = useMutation({
    mutationFn: (id: string) => delSubFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-subs"] });
      toast.success("Subscription removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSub = useMutation({
    mutationFn: (v: {
      display_name?: string;
      email?: string;
      campus: string;
      leadership_role: string;
      min_severity: "critical" | "warning" | "info";
      channels: ("in_app" | "email")[];
      rules: AlertRuleKey[];
      active: boolean;
    }) => upsertSubFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-subs"] });
      toast.success("Subscription saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Leadership alert rules"
        subtitle="Set the thresholds, choose who hears about what, and test the rules before switching them on."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/behaviour"><ArrowLeft className="h-4 w-4" />Behaviour Centre</Link>
            </Button>
            <Badge variant="outline" className="gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              {draft.active ? "Alerting live" : "Alerting paused"}
            </Badge>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save rules
            </Button>
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <Tabs defaultValue="thresholds">
          <TabsList>
            <TabsTrigger value="thresholds">Thresholds &amp; rules</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="test">Test &amp; dispatch</TabsTrigger>
            <TabsTrigger value="history">Delivery history</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------ Thresholds */}
          <TabsContent value="thresholds" className="mt-4 space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Alerting is live</p>
                  <p className="text-xs text-muted-foreground">
                    While paused you can still test rules — nothing reaches subscribers.
                  </p>
                </div>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                />
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold">Thresholds</p>
              <p className="text-xs text-muted-foreground">
                These values decide when a class crosses from "watch" into "act".
              </p>
              <Separator className="my-3" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {THRESHOLD_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={f.key} className="text-xs font-medium">
                      {f.label} {f.suffix && <span className="text-muted-foreground">({f.suffix})</span>}
                    </Label>
                    <Input
                      id={f.key}
                      type="number"
                      className="h-9"
                      value={draft.thresholds[f.key]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          thresholds: { ...draft.thresholds, [f.key]: Number(e.target.value) || 0 },
                        })
                      }
                    />
                    <p className="text-[11px] leading-snug text-muted-foreground">{f.hint}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold">Active rules</p>
              <Separator className="my-3" />
              <div className="space-y-3">
                {ALERT_RULES.map((r) => (
                  <div key={r.key} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.label}</span>
                        <Badge
                          variant="outline"
                          className={
                            r.severity === "critical"
                              ? "border-rose-300 text-rose-700 text-[10px]"
                              : r.severity === "warning"
                                ? "border-amber-300 text-amber-700 text-[10px]"
                                : "text-[10px]"
                          }
                        >
                          {r.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                    <Switch
                      checked={draft.enabled[r.key]}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, enabled: { ...draft.enabled, [r.key]: v } })
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ----------------------------------------------------- Subscribers */}
          <TabsContent value="subscribers" className="mt-4 space-y-4">
            <SubscriptionForm onSubmit={(v) => addSub.mutate(v)} loading={addSub.isPending} />
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Subscribed leaders</p>
              </div>
              <Separator className="my-3" />
              {subsQ.isLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading subscriptions…
                </p>
              )}
              {!subsQ.isLoading && (subsQ.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No one is subscribed yet. Add yourself above to start receiving alerts.
                </p>
              )}
              <div className="space-y-2">
                {(subsQ.data ?? []).map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2.5">
                    <span className="text-sm font-medium">{s.display_name ?? s.email ?? "Subscriber"}</span>
                    <Badge variant="outline" className="text-[10px]">{s.leadership_role}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {s.campus === "all" ? "All campuses" : s.campus}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{s.min_severity}+</Badge>
                    {s.channels.map((c) => (
                      <Badge key={c} className="bg-primary-soft text-primary hover:bg-primary-soft text-[10px]">
                        {c === "in_app" ? "In-app" : "Email"}
                      </Badge>
                    ))}
                    {s.rules.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">{s.rules.length} rule filter(s)</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => delSub.mutate(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------------------ Test */}
          <TabsContent value="test" className="mt-4 space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Campus scope</Label>
                  <Select value={scopeCampus} onValueChange={setScopeCampus}>
                    <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All campuses</SelectItem>
                      {CAMPUSES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => preview.mutate()} disabled={preview.isPending}>
                  {preview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  Test rules (dry run)
                </Button>
                <Button onClick={() => dispatch.mutate()} disabled={dispatch.isPending || !draft.active}>
                  {dispatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Dispatch now
                </Button>
                {!draft.active && (
                  <p className="text-xs text-muted-foreground">
                    Save with alerting live to enable dispatch.
                  </p>
                )}
              </div>
            </Card>

            {preview.data && (
              <Card className="p-4">
                <p className="text-sm font-semibold">
                  {preview.data.rows.length} alert{preview.data.rows.length === 1 ? "" : "s"} would fire
                  <span className="text-muted-foreground font-normal">
                    {" "}· {preview.data.subscriberCount} active subscriber{preview.data.subscriberCount === 1 ? "" : "s"}
                  </span>
                </p>
                <Separator className="my-3" />
                <div className="space-y-2">
                  {preview.data.rows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nothing crosses these thresholds right now — that is a good sign, but consider tightening
                      them if you expect to see more.
                    </p>
                  )}
                  {preview.data.rows.map(({ alert, recipients }) => (
                    <div key={alert.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            alert.severity === "critical"
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]"
                              : alert.severity === "warning"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]"
                                : "bg-sky-100 text-sky-700 hover:bg-sky-100 text-[10px]"
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium">{alert.title}</span>
                        <Badge variant="outline" className="text-[10px]">{alert.scope}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {recipients.length === 0
                          ? "No subscriber matches this alert — nobody would be notified."
                          : `Would notify: ${recipients.map((r) => `${r.name} (${r.role}, ${r.channels.join(" + ")})`).join("; ")}`}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* --------------------------------------------------------- History */}
          <TabsContent value="history" className="mt-4">
            <Card className="p-4">
              <p className="text-sm font-semibold">Recent deliveries</p>
              <Separator className="my-3" />
              {deliveriesQ.isLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading history…
                </p>
              )}
              {!deliveriesQ.isLoading && (deliveriesQ.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No alerts have been dispatched yet.</p>
              )}
              <div className="space-y-2">
                {(deliveriesQ.data ?? []).map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2.5">
                    <Badge variant="outline" className="text-[10px]">{d.channel === "in_app" ? "In-app" : "Email"}</Badge>
                    <span className="text-sm">{d.title}</span>
                    <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                    {d.recipient_email && (
                      <span className="text-[11px] text-muted-foreground">{d.recipient_email}</span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(d.created_at).toLocaleString("en-AU", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function SubscriptionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (v: {
    display_name?: string;
    email?: string;
    campus: string;
    leadership_role: string;
    min_severity: "critical" | "warning" | "info";
    channels: ("in_app" | "email")[];
    rules: AlertRuleKey[];
    active: boolean;
  }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState("all");
  const [role, setRole] = useState<string>(LEADERSHIP_ROLES[0]);
  const [severity, setSeverity] = useState<"critical" | "warning" | "info">("warning");
  const [inApp, setInApp] = useState(true);
  const [email_, setEmailOn] = useState(false);

  function submit() {
    const channels: ("in_app" | "email")[] = [];
    if (inApp) channels.push("in_app");
    if (email_) channels.push("email");
    if (channels.length === 0) return toast.error("Choose at least one channel.");
    if (email_ && !email.trim()) return toast.error("Add an email address for email alerts.");
    onSubmit({
      display_name: name.trim() || undefined,
      email: email.trim() || undefined,
      campus,
      leadership_role: role,
      min_severity: severity,
      channels,
      rules: [],
      active: true,
    });
    setName("");
    setEmail("");
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">Subscribe a leader</p>
      <p className="text-xs text-muted-foreground">
        Alerts are matched by campus, role and severity, so people only hear about what they can act on.
      </p>
      <Separator className="my-3" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rachel Wu" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email (for email alerts)</Label>
          <Input className="h-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.vic.edu.au" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Campus</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campuses</SelectItem>
              {CAMPUSES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Leadership role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEADERSHIP_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Minimum severity</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical only</SelectItem>
              <SelectItem value="warning">Warning and above</SelectItem>
              <SelectItem value="info">Everything</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Channels</Label>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={inApp} onCheckedChange={setInApp} />In-app
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={email_} onCheckedChange={setEmailOn} />Email
            </label>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Add subscription
        </Button>
      </div>
    </Card>
  );
}
