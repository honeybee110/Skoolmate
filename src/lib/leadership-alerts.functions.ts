// Leadership behaviour alerts — configuration, subscriptions and delivery.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireLeadership } from "@/lib/require-role";
import {
  applyFilters,
  defaultCapacityWeights,
  leadershipAlerts,
  leadershipIncidents,
  type LeadershipAlert,
} from "@/lib/behaviour-leadership";
import {
  ALERT_RULES,
  defaultAlertRuleConfig,
  defaultAlertThresholds,
  defaultEnabledRules,
  mergeConfig,
  SEVERITY_ORDER,
  type AlertRuleConfig,
  type AlertRuleKey,
} from "@/lib/leadership-alert-rules";

export interface AlertSubscription {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  campus: string;
  leadership_role: string;
  min_severity: "critical" | "warning" | "info";
  channels: string[];
  rules: string[];
  active: boolean;
}

export interface AlertDelivery {
  id: string;
  alert_key: string;
  severity: string;
  campus: string;
  title: string;
  detail: string | null;
  channel: string;
  recipient_user_id: string | null;
  recipient_email: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

const ThresholdSchema = z.object({
  riskIncreasePct: z.number().min(0).max(500),
  capacityIndexHigh: z.number().min(0).max(100),
  deEscalationFloorPct: z.number().min(0).max(100),
  teachingTimeLostMins: z.number().min(0).max(100000),
  emergingPatternSharePct: z.number().min(0).max(100),
  improvementDropPct: z.number().min(0).max(100),
  minIncidents: z.number().min(0).max(1000),
});

const RuleKeys = ALERT_RULES.map((r) => r.key) as [AlertRuleKey, ...AlertRuleKey[]];
const EnabledSchema = z.record(z.enum(RuleKeys), z.boolean());

const ConfigSchema = z.object({
  thresholds: ThresholdSchema,
  enabled: EnabledSchema,
  active: z.boolean(),
});

/* ----------------------------------------------------------------- Settings */

export const getAlertSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertRuleConfig & { updated_at: string | null }> => {
    const { data, error } = await (context.supabase as any)
      .from("leadership_alert_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { ...defaultAlertRuleConfig, updated_at: null };
    return {
      ...mergeConfig({ thresholds: data.thresholds, enabled: data.enabled, active: data.active }),
      updated_at: data.updated_at,
    };
  });

export const saveAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConfigSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireLeadership(context.supabase, context.userId, "change alert settings");
    const { error } = await (context.supabase as any)
      .from("leadership_alert_settings")
      .upsert(
        {
          id: "default",
          thresholds: data.thresholds,
          enabled: data.enabled,
          active: data.active,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------ Subscriptions */

export const listAlertSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertSubscription[]> => {
    const { data, error } = await (context.supabase as any)
      .from("leadership_alert_subscriptions")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AlertSubscription[];
  });

const SubscriptionInput = z.object({
  id: z.string().uuid().optional(),
  display_name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional(),
  campus: z.string().max(60).default("all"),
  leadership_role: z.string().max(60),
  min_severity: z.enum(["critical", "warning", "info"]).default("warning"),
  channels: z.array(z.enum(["in_app", "email"])).min(1),
  rules: z.array(z.enum(RuleKeys)).default([]),
  active: z.boolean().default(true),
});

export const upsertAlertSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubscriptionInput.parse(input))
  .handler(async ({ data, context }): Promise<AlertSubscription> => {
    const row = {
      ...(data.id ? { id: data.id } : {}),
      user_id: context.userId,
      display_name: data.display_name ?? null,
      email: data.email ?? null,
      campus: data.campus,
      leadership_role: data.leadership_role,
      min_severity: data.min_severity,
      channels: data.channels,
      rules: data.rules,
      active: data.active,
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error } = await (context.supabase as any)
      .from("leadership_alert_subscriptions")
      .upsert(row, { onConflict: "user_id,campus,leadership_role" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return saved as AlertSubscription;
  });

export const deleteAlertSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("leadership_alert_subscriptions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------------------------------------- Evaluation */

const ScopeInput = z.object({
  campus: z.string().default("all"),
  term: z.string().default("all"),
  from: z.string().default(""),
  to: z.string().default(""),
});

function evaluate(scope: z.infer<typeof ScopeInput>, config: AlertRuleConfig): LeadershipAlert[] {
  const incidents = applyFilters(leadershipIncidents, {
    campus: scope.campus,
    yearLevel: "all",
    classId: "all",
    term: scope.term,
    from: scope.from,
    to: scope.to,
  });
  return leadershipAlerts(incidents, defaultCapacityWeights, config);
}

function matches(sub: AlertSubscription, alert: LeadershipAlert): boolean {
  if (!sub.active) return false;
  if (sub.campus !== "all" && alert.campus !== "all" && sub.campus !== alert.campus) return false;
  if (SEVERITY_ORDER[alert.severity] > SEVERITY_ORDER[sub.min_severity]) return false;
  if (sub.rules.length && !sub.rules.includes(alert.rule)) return false;
  return true;
}

export interface AlertPreviewRow {
  alert: LeadershipAlert;
  recipients: { name: string; role: string; campus: string; channels: string[] }[];
}

/**
 * Dry-run the rule set: evaluate every alert and show who would receive it.
 * Nothing is written and nothing is sent.
 */
export const previewAlertRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ config: ConfigSchema, scope: ScopeInput }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ rows: AlertPreviewRow[]; subscriberCount: number }> => {
    const alerts = evaluate(data.scope, mergeConfig(data.config));
    const { data: subs, error } = await (context.supabase as any)
      .from("leadership_alert_subscriptions")
      .select("*")
      .eq("active", true);
    if (error) throw new Error(error.message);
    const list = (subs ?? []) as AlertSubscription[];
    return {
      subscriberCount: list.length,
      rows: alerts.map((alert) => ({
        alert,
        recipients: list.filter((s) => matches(s, alert)).map((s) => ({
          name: s.display_name ?? s.email ?? "Subscriber",
          role: s.leadership_role,
          campus: s.campus,
          channels: s.channels,
        })),
      })),
    };
  });

export interface DispatchResult {
  evaluated: number;
  inAppSent: number;
  emailQueued: number;
  skipped: number;
  emailConfigured: boolean;
  notes: string[];
}

/** Evaluate saved rules and deliver matching alerts to subscribers. */
export const dispatchLeadershipAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ scope: ScopeInput }).parse(input))
  .handler(async ({ data, context }): Promise<DispatchResult> => {
    await requireLeadership(context.supabase, context.userId, "dispatch leadership alerts");
    const { data: settingsRow } = await (context.supabase as any)
      .from("leadership_alert_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    const config = mergeConfig(
      settingsRow
        ? { thresholds: settingsRow.thresholds, enabled: settingsRow.enabled, active: settingsRow.active }
        : null,
    );
    const notes: string[] = [];
    if (!config.active) {
      return {
        evaluated: 0,
        inAppSent: 0,
        emailQueued: 0,
        skipped: 0,
        emailConfigured: false,
        notes: ["Alerting is switched off. Turn on 'Alerting is live' in settings to dispatch."],
      };
    }

    const alerts = evaluate(data.scope, config);
    const { data: subs, error } = await (context.supabase as any)
      .from("leadership_alert_subscriptions")
      .select("*")
      .eq("active", true);
    if (error) throw new Error(error.message);
    const list = (subs ?? []) as AlertSubscription[];

    // Email delivery activates once a sender domain is verified for the school.
    const emailConfigured = Boolean(process.env.SENDER_DOMAIN);
    if (!emailConfigured) {
      notes.push(
        "Email delivery is on hold until a school sender domain is verified — in-app alerts were still delivered.",
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    let inAppSent = 0;
    let emailQueued = 0;
    let skipped = 0;

    for (const alert of alerts) {
      const recipients = list.filter((s) => matches(s, alert));
      if (recipients.length === 0) continue;

      const inAppRecipients = recipients.filter((r) => r.channels.includes("in_app"));
      if (inAppRecipients.length) {
        const dedupe = `${alert.id}:in_app:${today}`;
        const { error: dErr } = await (context.supabase as any)
          .from("leadership_alert_deliveries")
          .insert({
            alert_key: alert.id,
            dedupe_key: dedupe,
            severity: alert.severity,
            campus: alert.campus,
            title: alert.title,
            detail: alert.detail,
            channel: "in_app",
            status: "sent",
          });
        if (dErr) {
          skipped++; // already delivered today
        } else {
          await (context.supabase as any).from("admin_notifications").insert({
            category: "Behaviour",
            title: alert.title,
            body: `${alert.detail}\n\nScope: ${alert.scope}. Evidence: ${alert.evidence}.`,
            priority: alert.severity === "critical" ? "high" : alert.severity === "warning" ? "normal" : "low",
            target_group: [...new Set(inAppRecipients.map((r) => r.leadership_role))].join(", "),
            link_url: alert.classId ? "/admin/behaviour" : "/admin/behaviour",
            created_by: context.userId,
          });
          inAppSent += inAppRecipients.length;
        }
      }

      for (const r of recipients.filter((r) => r.channels.includes("email") && r.email)) {
        const dedupe = `${alert.id}:email:${r.id}:${today}`;
        const { error: dErr } = await (context.supabase as any)
          .from("leadership_alert_deliveries")
          .insert({
            alert_key: alert.id,
            dedupe_key: dedupe,
            severity: alert.severity,
            campus: alert.campus,
            title: alert.title,
            detail: alert.detail,
            channel: "email",
            recipient_user_id: r.user_id,
            recipient_email: r.email,
            status: emailConfigured ? "queued" : "awaiting_domain",
            error: emailConfigured ? null : "No verified school sender domain",
          });
        if (dErr) skipped++;
        else emailQueued++;
      }
    }

    return { evaluated: alerts.length, inAppSent, emailQueued, skipped, emailConfigured, notes };
  });

export const listAlertDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertDelivery[]> => {
    const { data, error } = await (context.supabase as any)
      .from("leadership_alert_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AlertDelivery[];
  });

export { defaultAlertThresholds, defaultEnabledRules };
