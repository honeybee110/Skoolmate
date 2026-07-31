/**
 * Behaviour Intelligence Centre — derived analytics layer.
 *
 * Incident records are demo data that mirror the ABC (Antecedent–Behaviour–
 * Consequence) recording format used in Victorian specialist schools. All
 * insight functions below are deterministic derivations of these records, so
 * every number shown in the UI can be traced back to incident IDs.
 */

export type Antecedent =
  | "Transition"
  | "Demand placed"
  | "Peer proximity"
  | "Sensory input"
  | "Change of routine"
  | "Waiting / delay"
  | "Preferred item removed";

export type BehaviourType =
  | "Vocal protest"
  | "Physical aggression"
  | "Property disruption"
  | "Elopement"
  | "Withdrawal"
  | "Self-injury"
  | "Non-compliance";

export type ConsequenceType =
  | "Redirection"
  | "Sensory break"
  | "Planned ignoring"
  | "Task modified"
  | "Removed from area"
  | "Adult co-regulation"
  | "Preferred item given";

export type BehaviourFunction = "Escape" | "Attention" | "Tangible" | "Sensory";

export type IncidentLocation =
  | "Classroom"
  | "Playground"
  | "Corridor"
  | "Sensory room"
  | "Hall"
  | "Bus bay";

export type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export const DAYS: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const TIME_BLOCKS = [
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
] as const;
export type TimeBlock = (typeof TIME_BLOCKS)[number];

export interface BehaviourIncident {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  day: DayName;
  time: TimeBlock;
  location: IncidentLocation;
  antecedent: Antecedent;
  behaviour: BehaviourType;
  consequence: ConsequenceType;
  intervention: string;
  /** Did the response de-escalate within 10 minutes? */
  deEscalated: boolean;
  durationMins: number;
  intensity: 1 | 2 | 3;
  recordedBy: string;
  note: string;
  /** Supporting documents referenced by the staff member who logged it. */
  sources: string[];
}

const ANTECEDENTS: Antecedent[] = [
  "Transition",
  "Demand placed",
  "Peer proximity",
  "Sensory input",
  "Change of routine",
  "Waiting / delay",
  "Preferred item removed",
];
const BEHAVIOURS: BehaviourType[] = [
  "Vocal protest",
  "Physical aggression",
  "Property disruption",
  "Elopement",
  "Withdrawal",
  "Self-injury",
  "Non-compliance",
];
const CONSEQUENCES: ConsequenceType[] = [
  "Redirection",
  "Sensory break",
  "Planned ignoring",
  "Task modified",
  "Removed from area",
  "Adult co-regulation",
  "Preferred item given",
];
const LOCATIONS: IncidentLocation[] = [
  "Classroom",
  "Playground",
  "Corridor",
  "Sensory room",
  "Hall",
  "Bus bay",
];

const INTERVENTIONS = [
  "Visual schedule pre-warning",
  "Scheduled sensory break",
  "AAC break request prompt",
  "Task chunking + first/then",
  "Peer distance seating",
  "Adult co-regulation script",
  "Movement break before task",
] as const;
export type InterventionName = (typeof INTERVENTIONS)[number];

const COHORT = [
  { id: "s4", name: "Noah Williams", className: "Rosella", weight: 3 },
  { id: "s2", name: "Jack O'Brien", className: "Rosella", weight: 2 },
  { id: "s8", name: "Hamish Carter", className: "Rosella", weight: 2 },
  { id: "s6", name: "Liam Schmidt", className: "Rosella", weight: 1 },
  { id: "s5", name: "Zara Patel", className: "Rosella", weight: 1 },
];

const DOC_LIBRARY: Record<string, string[]> = {
  s4: ["OT Report (15 Mar 2026)", "Behaviour Support Plan v3", "Observation Log 12 May"],
  s2: ["Behaviour Support Plan v2", "Speech Pathology Review (04 Apr 2026)"],
  s8: ["AAC Communication Profile", "Observation Log 28 Apr"],
  s6: ["Observation Log 06 May"],
  s5: ["OT Sensory Profile (21 Feb 2026)"],
};

/** Small deterministic PRNG so the demo data is stable across renders. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildIncidents(): BehaviourIncident[] {
  const rng = makeRng(20260731);
  const out: BehaviourIncident[] = [];
  const pool: typeof COHORT = [];
  for (const c of COHORT) for (let i = 0; i < c.weight; i++) pool.push(c);

  for (let i = 0; i < 84; i++) {
    const student = pick(rng, pool);
    const day = pick(rng, DAYS);
    // Post-recess 11:00 is deliberately over-represented — the signal the
    // trigger + heat-map modules should surface.
    const time =
      rng() < 0.34 ? "11:00" : pick(rng, TIME_BLOCKS);
    const antecedent =
      time === "11:00" && rng() < 0.6 ? "Transition" : pick(rng, ANTECEDENTS);
    const behaviour =
      antecedent === "Demand placed" && rng() < 0.5
        ? "Non-compliance"
        : pick(rng, BEHAVIOURS);
    const consequence = pick(rng, CONSEQUENCES);
    const intervention = pick(rng, INTERVENTIONS);
    // Effectiveness is intervention-dependent so rankings are meaningful.
    const base: Record<InterventionName, number> = {
      "Visual schedule pre-warning": 0.82,
      "Scheduled sensory break": 0.76,
      "AAC break request prompt": 0.71,
      "Task chunking + first/then": 0.68,
      "Peer distance seating": 0.55,
      "Adult co-regulation script": 0.62,
      "Movement break before task": 0.58,
    };
    const dayIndex = DAYS.indexOf(day);
    const week = Math.floor(i / 12);
    out.push({
      id: `inc-${(i + 1).toString().padStart(3, "0")}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      date: `Week ${week + 1} · ${day}`,
      day,
      time: time as TimeBlock,
      location:
        time === "11:00" && rng() < 0.4 ? "Playground" : pick(rng, LOCATIONS),
      antecedent,
      behaviour,
      consequence,
      intervention,
      deEscalated: rng() < base[intervention],
      durationMins: 3 + Math.floor(rng() * 18),
      intensity: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3,
      recordedBy: rng() < 0.6 ? "Honey" : "Sharifa",
      note: `${antecedent} preceded ${behaviour.toLowerCase()}; staff used ${consequence.toLowerCase()}.`,
      sources: DOC_LIBRARY[student.id] ?? [],
      // keep week ordering meaningful for the trend chart
      ...(dayIndex >= 0 ? {} : {}),
    });
  }
  return out;
}

export const behaviourIncidents: BehaviourIncident[] = buildIncidents();

export function weekOf(incident: BehaviourIncident): number {
  const m = /Week (\d+)/.exec(incident.date);
  return m ? Number(m[1]) : 1;
}

function countBy<T extends string>(items: T[]): { name: T; count: number }[] {
  const map = new Map<T, number>();
  for (const i of items) map.set(i, (map.get(i) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function abcBreakdown(incidents: BehaviourIncident[]) {
  return {
    antecedents: countBy(incidents.map((i) => i.antecedent)),
    behaviours: countBy(incidents.map((i) => i.behaviour)),
    consequences: countBy(incidents.map((i) => i.consequence)),
  };
}

export function weeklyTrend(incidents: BehaviourIncident[]) {
  const weeks = new Map<number, { incidents: number; deEscalated: number }>();
  for (const i of incidents) {
    const w = weekOf(i);
    const row = weeks.get(w) ?? { incidents: 0, deEscalated: 0 };
    row.incidents++;
    if (i.deEscalated) row.deEscalated++;
    weeks.set(w, row);
  }
  return [...weeks.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, r]) => ({
      week: `Wk ${week}`,
      incidents: r.incidents,
      deEscalated: r.deEscalated,
    }));
}

export function heatMap(
  incidents: BehaviourIncident[],
  axis: "time" | "location",
) {
  const rows = axis === "time" ? [...TIME_BLOCKS] : [...LOCATIONS];
  return rows.map((row) => ({
    row,
    cells: DAYS.map((day) => ({
      day,
      count: incidents.filter(
        (i) => i.day === day && (axis === "time" ? i.time === row : i.location === row),
      ).length,
    })),
  }));
}

export interface SequenceChain {
  id: string;
  antecedent: Antecedent;
  behaviour: BehaviourType;
  consequence: ConsequenceType;
  count: number;
  deEscalationRate: number;
  incidentIds: string[];
}

export function sequenceChains(incidents: BehaviourIncident[]): SequenceChain[] {
  const map = new Map<string, SequenceChain>();
  for (const i of incidents) {
    const key = `${i.antecedent}|${i.behaviour}|${i.consequence}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.incidentIds.push(i.id);
      if (i.deEscalated) existing.deEscalationRate++;
    } else {
      map.set(key, {
        id: key,
        antecedent: i.antecedent,
        behaviour: i.behaviour,
        consequence: i.consequence,
        count: 1,
        deEscalationRate: i.deEscalated ? 1 : 0,
        incidentIds: [i.id],
      });
    }
  }
  return [...map.values()]
    .map((c) => ({ ...c, deEscalationRate: Math.round((c.deEscalationRate / c.count) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export interface TriggerInsight {
  trigger: Antecedent;
  category: "Environmental" | "Instructional" | "Social";
  count: number;
  share: number;
  peakTime: TimeBlock;
  peakLocation: IncidentLocation;
  escalationRate: number;
  incidentIds: string[];
}

const TRIGGER_CATEGORY: Record<Antecedent, TriggerInsight["category"]> = {
  Transition: "Environmental",
  "Demand placed": "Instructional",
  "Peer proximity": "Social",
  "Sensory input": "Environmental",
  "Change of routine": "Environmental",
  "Waiting / delay": "Instructional",
  "Preferred item removed": "Social",
};

export function triggerInsights(incidents: BehaviourIncident[]): TriggerInsight[] {
  const total = incidents.length || 1;
  return countBy(incidents.map((i) => i.antecedent)).map(({ name, count }) => {
    const subset = incidents.filter((i) => i.antecedent === name);
    const peakTime = countBy(subset.map((i) => i.time))[0]?.name ?? "9:00";
    const peakLocation = countBy(subset.map((i) => i.location))[0]?.name ?? "Classroom";
    const escalated = subset.filter((i) => i.intensity === 3).length;
    return {
      trigger: name,
      category: TRIGGER_CATEGORY[name],
      count,
      share: Math.round((count / total) * 100),
      peakTime: peakTime as TimeBlock,
      peakLocation: peakLocation as IncidentLocation,
      escalationRate: Math.round((escalated / subset.length) * 100),
      incidentIds: subset.slice(0, 6).map((i) => i.id),
    };
  });
}

export interface InterventionRanking {
  intervention: InterventionName;
  used: number;
  successRate: number;
  avgDuration: number;
  bestFor: Antecedent;
  incidentIds: string[];
}

export function interventionRankings(
  incidents: BehaviourIncident[],
): InterventionRanking[] {
  const names = [...new Set(incidents.map((i) => i.intervention))];
  return names
    .map((intervention) => {
      const subset = incidents.filter((i) => i.intervention === intervention);
      const wins = subset.filter((i) => i.deEscalated);
      const bestFor = countBy(wins.map((i) => i.antecedent))[0]?.name ?? "Transition";
      return {
        intervention: intervention as InterventionName,
        used: subset.length,
        successRate: Math.round((wins.length / subset.length) * 100),
        avgDuration: Math.round(
          subset.reduce((s, i) => s + i.durationMins, 0) / subset.length,
        ),
        bestFor: bestFor as Antecedent,
        incidentIds: subset.slice(0, 6).map((i) => i.id),
      };
    })
    .sort((a, b) => b.successRate - a.successRate);
}

export interface FunctionHypothesis {
  fn: BehaviourFunction;
  score: number;
  confidence: "Low" | "Moderate" | "High";
  pattern: string;
  incidentIds: string[];
}

const FUNCTION_SIGNALS: Record<BehaviourFunction, { antecedents: Antecedent[]; consequences: ConsequenceType[] }> = {
  Escape: {
    antecedents: ["Demand placed", "Transition", "Change of routine"],
    consequences: ["Task modified", "Removed from area"],
  },
  Attention: {
    antecedents: ["Waiting / delay", "Peer proximity"],
    consequences: ["Adult co-regulation", "Redirection"],
  },
  Tangible: {
    antecedents: ["Preferred item removed", "Waiting / delay"],
    consequences: ["Preferred item given"],
  },
  Sensory: {
    antecedents: ["Sensory input", "Transition"],
    consequences: ["Sensory break", "Planned ignoring"],
  },
};

export function functionHypotheses(
  incidents: BehaviourIncident[],
): FunctionHypothesis[] {
  const total = incidents.length || 1;
  return (Object.keys(FUNCTION_SIGNALS) as BehaviourFunction[])
    .map((fn) => {
      const sig = FUNCTION_SIGNALS[fn];
      const matched = incidents.filter(
        (i) => sig.antecedents.includes(i.antecedent) && sig.consequences.includes(i.consequence),
      );
      const score = Math.round((matched.length / total) * 100);
      return {
        fn,
        score,
        confidence: (score >= 18 ? "High" : score >= 9 ? "Moderate" : "Low") as FunctionHypothesis["confidence"],
        pattern: `${sig.antecedents.join(" / ")} → ${sig.consequences.join(" or ")}`,
        incidentIds: matched.slice(0, 6).map((i) => i.id),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface EscalationForecast {
  studentId: string;
  studentName: string;
  likelihood: number;
  band: "Low" | "Elevated" | "High";
  confidence: "Low" | "Moderate" | "High";
  window: string;
  drivers: string[];
  incidentIds: string[];
}

export function escalationForecasts(
  incidents: BehaviourIncident[],
): EscalationForecast[] {
  const byStudent = new Map<string, BehaviourIncident[]>();
  for (const i of incidents) {
    byStudent.set(i.studentId, [...(byStudent.get(i.studentId) ?? []), i]);
  }
  const max = Math.max(...[...byStudent.values()].map((v) => v.length), 1);
  return [...byStudent.entries()]
    .map(([studentId, list]) => {
      const highIntensity = list.filter((i) => i.intensity === 3).length;
      const unresolved = list.filter((i) => !i.deEscalated).length;
      const frequency = list.length / max;
      const raw =
        frequency * 45 +
        (highIntensity / list.length) * 30 +
        (unresolved / list.length) * 25;
      const likelihood = Math.min(92, Math.round(raw));
      const peakTime = countBy(list.map((i) => i.time))[0]?.name ?? "11:00";
      const peakDay = countBy(list.map((i) => i.day))[0]?.name ?? "Mon";
      const topTrigger = countBy(list.map((i) => i.antecedent))[0]?.name ?? "Transition";
      return {
        studentId,
        studentName: list[0].studentName,
        likelihood,
        band: (likelihood >= 60 ? "High" : likelihood >= 35 ? "Elevated" : "Low") as EscalationForecast["band"],
        confidence: (list.length >= 15 ? "High" : list.length >= 8 ? "Moderate" : "Low") as EscalationForecast["confidence"],
        window: `${peakDay} around ${peakTime}`,
        drivers: [
          `${topTrigger} is the most frequent antecedent (${list.filter((i) => i.antecedent === topTrigger).length} of ${list.length})`,
          `${highIntensity} high-intensity incidents recorded`,
          `${unresolved} incidents did not de-escalate within 10 minutes`,
        ],
        incidentIds: list.slice(0, 6).map((i) => i.id),
      };
    })
    .sort((a, b) => b.likelihood - a.likelihood);
}

export interface ExecutiveSummary {
  trend: { direction: "up" | "down" | "flat"; changePct: number; label: string };
  riskLevel: "Low" | "Moderate" | "Elevated" | "High";
  dominantBehaviour: string;
  commonTrigger: string;
  peakWindow: string;
  bestIntervention: string;
  bestInterventionRate: number;
  totalIncidents: number;
  deEscalationRate: number;
  studentsInvolved: number;
}

export function executiveSummary(incidents: BehaviourIncident[]): ExecutiveSummary {
  const trend = weeklyTrend(incidents);
  const last = trend[trend.length - 1]?.incidents ?? 0;
  const prev = trend[trend.length - 2]?.incidents ?? last;
  const changePct = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100);
  const abc = abcBreakdown(incidents);
  const triggers = triggerInsights(incidents);
  const ranks = interventionRankings(incidents);
  const deEscalated = incidents.filter((i) => i.deEscalated).length;
  const deEscalationRate = Math.round((deEscalated / (incidents.length || 1)) * 100);
  const dayCounts = countBy(incidents.map((i) => `${i.day} ${i.time}`));
  const highIntensity = incidents.filter((i) => i.intensity === 3).length;
  const riskScore = (highIntensity / (incidents.length || 1)) * 100 + (100 - deEscalationRate) / 2;

  return {
    trend: {
      direction: changePct > 3 ? "up" : changePct < -3 ? "down" : "flat",
      changePct,
      label:
        changePct > 3
          ? "Increasing week-on-week"
          : changePct < -3
            ? "Decreasing week-on-week"
            : "Stable week-on-week",
    },
    riskLevel:
      riskScore >= 65 ? "High" : riskScore >= 50 ? "Elevated" : riskScore >= 35 ? "Moderate" : "Low",
    dominantBehaviour: abc.behaviours[0]?.name ?? "—",
    commonTrigger: triggers[0]?.trigger ?? "—",
    peakWindow: dayCounts[0]?.name ?? "—",
    bestIntervention: ranks[0]?.intervention ?? "—",
    bestInterventionRate: ranks[0]?.successRate ?? 0,
    totalIncidents: incidents.length,
    deEscalationRate,
    studentsInvolved: new Set(incidents.map((i) => i.studentId)).size,
  };
}

export const behaviourStudents = COHORT.map((c) => ({ id: c.id, name: c.name }));
