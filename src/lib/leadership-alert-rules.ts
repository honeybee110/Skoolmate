/**
 * Leadership alert rule configuration.
 *
 * Pure types + defaults with no data imports, so both the analytics layer
 * (`behaviour-leadership.ts`) and the server functions can share them.
 */

export type AlertRuleKey =
  | "risk_trend"
  | "capacity_index"
  | "de_escalation"
  | "teaching_time_lost"
  | "emerging_pattern"
  | "improvement"
  | "bsp_overdue";

export const ALERT_RULES: {
  key: AlertRuleKey;
  label: string;
  description: string;
  severity: "critical" | "warning" | "info";
}[] = [
  {
    key: "risk_trend",
    label: "Risk change",
    description: "A class's week-on-week incident volume rises by more than the risk-change threshold.",
    severity: "critical",
  },
  {
    key: "capacity_index",
    label: "Capacity index high",
    description: "A class's Behaviour Capacity Index reaches the configured ceiling.",
    severity: "critical",
  },
  {
    key: "de_escalation",
    label: "De-escalation below floor",
    description: "Fewer incidents are resolving within 10 minutes than the configured floor.",
    severity: "warning",
  },
  {
    key: "teaching_time_lost",
    label: "Teaching time lost",
    description: "Estimated teaching minutes lost in a class exceeds the configured budget for the period.",
    severity: "warning",
  },
  {
    key: "emerging_pattern",
    label: "Emerging pattern",
    description:
      "A single antecedent, location or time window accounts for an outsized share of a class's incidents.",
    severity: "warning",
  },
  {
    key: "improvement",
    label: "Improvement worth sharing",
    description: "A class's incidents drop sharply — worth capturing what changed.",
    severity: "info",
  },
  {
    key: "bsp_overdue",
    label: "Behaviour Support Plan overdue",
    description: "Students with overdue support plans still recording incidents.",
    severity: "critical",
  },
];

export interface AlertThresholds {
  /** Week-on-week incident increase (%) that raises a critical risk-change alert. */
  riskIncreasePct: number;
  /** Behaviour Capacity Index at or above this raises a critical alert. */
  capacityIndexHigh: number;
  /** De-escalation rate (%) below this raises a warning. */
  deEscalationFloorPct: number;
  /** Teaching minutes lost per class in the selected period before alerting. */
  teachingTimeLostMins: number;
  /** Share (%) of a class's incidents in one antecedent/location/time window. */
  emergingPatternSharePct: number;
  /** Week-on-week drop (%) that raises an informational improvement alert. */
  improvementDropPct: number;
  /** Minimum incidents in scope before any pattern rule may fire. */
  minIncidents: number;
}

export const defaultAlertThresholds: AlertThresholds = {
  riskIncreasePct: 40,
  capacityIndexHigh: 65,
  deEscalationFloorPct: 55,
  teachingTimeLostMins: 600,
  emergingPatternSharePct: 45,
  improvementDropPct: 35,
  minIncidents: 8,
};

export const defaultEnabledRules: Record<AlertRuleKey, boolean> = {
  risk_trend: true,
  capacity_index: true,
  de_escalation: true,
  teaching_time_lost: true,
  emerging_pattern: true,
  improvement: false,
  bsp_overdue: true,
};

export interface AlertRuleConfig {
  thresholds: AlertThresholds;
  enabled: Record<AlertRuleKey, boolean>;
  /** When false, rules evaluate for testing but nothing is dispatched. */
  active: boolean;
}

export const defaultAlertRuleConfig: AlertRuleConfig = {
  thresholds: defaultAlertThresholds,
  enabled: defaultEnabledRules,
  active: false,
};

export const LEADERSHIP_ROLES = [
  "Principal",
  "Assistant Principal",
  "Learning Specialist",
  "Leading Teacher",
  "Wellbeing Leader",
  "Allied Health Lead",
  "Behaviour Specialist",
] as const;
export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];

export const SEVERITY_ORDER: Record<"critical" | "warning" | "info", number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function mergeConfig(partial: Partial<AlertRuleConfig> | null | undefined): AlertRuleConfig {
  return {
    thresholds: { ...defaultAlertThresholds, ...(partial?.thresholds ?? {}) },
    enabled: { ...defaultEnabledRules, ...(partial?.enabled ?? {}) },
    active: partial?.active ?? false,
  };
}
