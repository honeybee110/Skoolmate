/**
 * Behaviour Intelligence — Leadership (school-wide) analytics layer.
 *
 * Extends the class-level ABC model in `behaviour-intelligence.ts` to a whole-
 * school data set: multiple campuses, year levels, classes and terms. Every
 * figure surfaced in the admin dashboard is a deterministic derivation of the
 * incident records below, so leadership can always trace a number back to the
 * incident IDs that produced it.
 *
 * IMPORTANT: The Behaviour Capacity Index is a planning/resourcing signal for
 * classes. It is NOT a measure of teacher performance and must never be used
 * that way.
 */

import type {
  Antecedent,
  BehaviourType,
  ConsequenceType,
  DayName,
  IncidentLocation,
  TimeBlock,
} from "@/lib/behaviour-intelligence";
import { DAYS, TIME_BLOCKS } from "@/lib/behaviour-intelligence";

export type Term = "Term 1" | "Term 2" | "Term 3" | "Term 4";
export const TERMS: Term[] = ["Term 1", "Term 2", "Term 3", "Term 4"];

export type Campus = "Main Campus" | "Riverside Campus";
export const CAMPUSES: Campus[] = ["Main Campus", "Riverside Campus"];

export type BspStatus = "None" | "Draft" | "Active" | "Review due" | "Overdue";

export interface SchoolClass {
  id: string;
  name: string;
  campus: Campus;
  yearLevel: string;
  band: "Prep" | "Primary" | "Secondary";
  room: string;
  teacher: string;
  studentCount: number;
}

export interface SchoolStudent {
  id: string;
  name: string;
  classId: string;
  bsp: BspStatus;
  bspReviewDue: string | null;
  alliedHealth: string[];
}

export interface LeadershipIncident {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  campus: Campus;
  yearLevel: string;
  term: Term;
  week: number;
  /** ISO date so date-range filtering is exact. */
  date: string;
  day: DayName;
  time: TimeBlock;
  location: IncidentLocation;
  antecedent: Antecedent;
  behaviour: BehaviourType;
  consequence: ConsequenceType;
  intervention: string;
  deEscalated: boolean;
  durationMins: number;
  /** Estimated whole-class teaching minutes lost to the incident + recovery. */
  minutesLost: number;
  intensity: 1 | 2 | 3;
  recordedBy: string;
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
type InterventionName = (typeof INTERVENTIONS)[number];

const INTERVENTION_BASE: Record<InterventionName, number> = {
  "Visual schedule pre-warning": 0.82,
  "Scheduled sensory break": 0.76,
  "AAC break request prompt": 0.71,
  "Task chunking + first/then": 0.68,
  "Peer distance seating": 0.55,
  "Adult co-regulation script": 0.62,
  "Movement break before task": 0.58,
};

export const schoolClasses: SchoolClass[] = [
  { id: "c-rosella", name: "Rosella", campus: "Main Campus", yearLevel: "Year 3", band: "Primary", room: "B12", teacher: "Honey Alvarez", studentCount: 8 },
  { id: "c-wattle", name: "Wattle", campus: "Main Campus", yearLevel: "Year 3", band: "Primary", room: "B14", teacher: "Sharifa Haddad", studentCount: 8 },
  { id: "c-banksia", name: "Banksia", campus: "Main Campus", yearLevel: "Year 4", band: "Primary", room: "B16", teacher: "Tom Whitfield", studentCount: 9 },
  { id: "c-kurrajong", name: "Kurrajong", campus: "Main Campus", yearLevel: "Year 5", band: "Primary", room: "C03", teacher: "Priya Raman", studentCount: 9 },
  { id: "c-melaleuca", name: "Melaleuca", campus: "Main Campus", yearLevel: "Prep", band: "Prep", room: "A02", teacher: "Georgia Lim", studentCount: 6 },
  { id: "c-lomandra", name: "Lomandra", campus: "Main Campus", yearLevel: "Prep", band: "Prep", room: "A04", teacher: "Daniel Okafor", studentCount: 6 },
  { id: "c-jarrah", name: "Jarrah", campus: "Riverside Campus", yearLevel: "Year 7", band: "Secondary", room: "R11", teacher: "Emma Sutherland", studentCount: 10 },
  { id: "c-karri", name: "Karri", campus: "Riverside Campus", yearLevel: "Year 8", band: "Secondary", room: "R13", teacher: "Nadia Petrov", studentCount: 10 },
  { id: "c-marri", name: "Marri", campus: "Riverside Campus", yearLevel: "Year 9", band: "Secondary", room: "R15", teacher: "Ben Ngata", studentCount: 9 },
  { id: "c-tuart", name: "Tuart", campus: "Riverside Campus", yearLevel: "Year 10", band: "Secondary", room: "R17", teacher: "Alice Fenton", studentCount: 9 },
];

const FIRST = ["Noah", "Jack", "Hamish", "Liam", "Zara", "Mia", "Aaliyah", "Charlotte", "Kai", "Ruby", "Eli", "Sofia", "Archie", "Isla", "Mason", "Freya", "Cooper", "Anh", "Tyler", "Maya"];
const LAST = ["Williams", "O'Brien", "Carter", "Schmidt", "Patel", "Nguyen", "Tahir", "Reid", "Moretti", "Baker", "Rahman", "Costa", "Doyle", "Sokolov", "Hughes"];

const BSP_CYCLE: BspStatus[] = ["Active", "None", "Review due", "Active", "Draft", "Overdue", "None", "Active"];
const ALLIED = [["OT"], ["Speech"], ["OT", "Speech"], [], ["Psychology"], ["Physio"], []];

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

function buildStudents(): SchoolStudent[] {
  const rng = makeRng(4242);
  const out: SchoolStudent[] = [];
  let n = 0;
  for (const cls of schoolClasses) {
    for (let i = 0; i < cls.studentCount; i++) {
      const bsp = BSP_CYCLE[n % BSP_CYCLE.length];
      out.push({
        id: `stu-${n + 1}`,
        name: `${FIRST[n % FIRST.length]} ${LAST[(n * 3) % LAST.length]}`,
        classId: cls.id,
        bsp,
        bspReviewDue:
          bsp === "Review due" ? "14 Aug 2026" : bsp === "Overdue" ? "22 May 2026" : bsp === "Active" ? "03 Nov 2026" : null,
        alliedHealth: ALLIED[Math.floor(rng() * ALLIED.length)],
      });
      n++;
    }
  }
  return out;
}

export const schoolStudents: SchoolStudent[] = buildStudents();

const DOC_LIBRARY = [
  "Behaviour Support Plan v3",
  "OT Report (15 Mar 2026)",
  "Observation Log 12 May",
  "Speech Pathology Review (04 Apr 2026)",
  "AAC Communication Profile",
  "SSG Minutes (Term 2)",
];

/** Each term runs 10 demo weeks; week 1 of Term 1 starts 03 Feb 2026 (a Monday). */
const TERM_START: Record<Term, string> = {
  "Term 1": "2026-02-02",
  "Term 2": "2026-04-20",
  "Term 3": "2026-07-13",
  "Term 4": "2026-10-05",
};

function isoFor(term: Term, week: number, day: DayName): string {
  const base = new Date(`${TERM_START[term]}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + (week - 1) * 7 + DAYS.indexOf(day));
  return base.toISOString().slice(0, 10);
}

function buildIncidents(): LeadershipIncident[] {
  const rng = makeRng(20260731);
  const out: LeadershipIncident[] = [];
  // Class-level pressure weights keep some classes genuinely busier than others.
  const pressure: Record<string, number> = {
    "c-rosella": 1.5,
    "c-wattle": 0.8,
    "c-banksia": 1.1,
    "c-kurrajong": 0.6,
    "c-melaleuca": 1.0,
    "c-lomandra": 0.5,
    "c-jarrah": 1.4,
    "c-karri": 0.9,
    "c-marri": 1.2,
    "c-tuart": 0.7,
  };

  let counter = 0;
  for (const term of TERMS) {
    for (const cls of schoolClasses) {
      const roster = schoolStudents.filter((s) => s.classId === cls.id);
      const volume = Math.round(14 * pressure[cls.id] * (0.8 + rng() * 0.5));
      for (let i = 0; i < volume; i++) {
        const student = roster[Math.floor(rng() * roster.length)];
        const week = 1 + Math.floor(rng() * 10);
        const day = pick(rng, DAYS);
        const time = (rng() < 0.32 ? "11:00" : pick(rng, TIME_BLOCKS)) as TimeBlock;
        const antecedent = time === "11:00" && rng() < 0.55 ? "Transition" : pick(rng, ANTECEDENTS);
        const behaviour =
          antecedent === "Demand placed" && rng() < 0.5 ? "Non-compliance" : pick(rng, BEHAVIOURS);
        const intervention = pick(rng, INTERVENTIONS);
        const intensity = (1 + Math.floor(rng() * 3)) as 1 | 2 | 3;
        const durationMins = 3 + Math.floor(rng() * 18);
        counter++;
        out.push({
          id: `linc-${counter.toString().padStart(4, "0")}`,
          studentId: student.id,
          studentName: student.name,
          classId: cls.id,
          className: cls.name,
          campus: cls.campus,
          yearLevel: cls.yearLevel,
          term,
          week,
          date: isoFor(term, week, day),
          day,
          time,
          location: time === "11:00" && rng() < 0.4 ? "Playground" : pick(rng, LOCATIONS),
          antecedent,
          behaviour,
          consequence: pick(rng, CONSEQUENCES),
          intervention,
          deEscalated: rng() < INTERVENTION_BASE[intervention],
          durationMins,
          minutesLost: Math.round(durationMins * (0.7 + intensity * 0.45)),
          intensity,
          recordedBy: cls.teacher,
          sources: DOC_LIBRARY.filter(() => rng() < 0.35).slice(0, 3),
        });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const leadershipIncidents: LeadershipIncident[] = buildIncidents();

export interface LeadershipFilters {
  campus: string; // "all" | Campus
  yearLevel: string; // "all" | year level
  classId: string; // "all" | class id
  term: string; // "all" | Term
  from: string; // "" | ISO date
  to: string; // "" | ISO date
}

export const defaultFilters: LeadershipFilters = {
  campus: "all",
  yearLevel: "all",
  classId: "all",
  term: "all",
  from: "",
  to: "",
};

export function applyFilters(
  incidents: LeadershipIncident[],
  f: LeadershipFilters,
): LeadershipIncident[] {
  return incidents.filter((i) => {
    if (f.campus !== "all" && i.campus !== f.campus) return false;
    if (f.yearLevel !== "all" && i.yearLevel !== f.yearLevel) return false;
    if (f.classId !== "all" && i.classId !== f.classId) return false;
    if (f.term !== "all" && i.term !== f.term) return false;
    if (f.from && i.date < f.from) return false;
    if (f.to && i.date > f.to) return false;
    return true;
  });
}

export const yearLevels = [...new Set(schoolClasses.map((c) => c.yearLevel))];

function countBy<T extends string>(items: T[]): { name: T; count: number }[] {
  const map = new Map<T, number>();
  for (const i of items) map.set(i, (map.get(i) ?? 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

/* ---------------------------------------------------------------- Executive */

export interface ExecutiveKpis {
  totalIncidents: number;
  trendPct: number;
  trendDirection: "up" | "down" | "flat";
  studentsRequiringIntervention: number;
  highRiskStudents: number;
  bspActive: number;
  bspNeedingAttention: number;
  teachingMinutesLost: number;
  deEscalationRate: number;
  classesInScope: number;
}

export function executiveKpis(incidents: LeadershipIncident[]): ExecutiveKpis {
  const trend = weeklyVolume(incidents);
  const last = trend[trend.length - 1]?.incidents ?? 0;
  const prev = trend[trend.length - 2]?.incidents ?? last;
  const trendPct = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100);

  const byStudent = groupByStudent(incidents);
  const requiring = [...byStudent.values()].filter((list) => list.length >= 4).length;
  const highRisk = [...byStudent.values()].filter(
    (list) => list.length >= 6 && list.filter((i) => i.intensity === 3).length >= 2,
  ).length;

  const involvedIds = new Set(incidents.map((i) => i.studentId));
  const involved = schoolStudents.filter((s) => involvedIds.has(s.id));
  const deEscalated = incidents.filter((i) => i.deEscalated).length;

  return {
    totalIncidents: incidents.length,
    trendPct,
    trendDirection: trendPct > 3 ? "up" : trendPct < -3 ? "down" : "flat",
    studentsRequiringIntervention: requiring,
    highRiskStudents: highRisk,
    bspActive: involved.filter((s) => s.bsp === "Active").length,
    bspNeedingAttention: involved.filter((s) => s.bsp === "Review due" || s.bsp === "Overdue" || s.bsp === "Draft").length,
    teachingMinutesLost: incidents.reduce((s, i) => s + i.minutesLost, 0),
    deEscalationRate: Math.round((deEscalated / (incidents.length || 1)) * 100),
    classesInScope: new Set(incidents.map((i) => i.classId)).size,
  };
}

function groupByStudent(incidents: LeadershipIncident[]) {
  const map = new Map<string, LeadershipIncident[]>();
  for (const i of incidents) map.set(i.studentId, [...(map.get(i.studentId) ?? []), i]);
  return map;
}

export function weeklyVolume(incidents: LeadershipIncident[]) {
  const map = new Map<string, { incidents: number; minutesLost: number; deEscalated: number }>();
  for (const i of incidents) {
    const key = `${i.term.replace("Term ", "T")} W${i.week.toString().padStart(2, "0")}`;
    const row = map.get(key) ?? { incidents: 0, minutesLost: 0, deEscalated: 0 };
    row.incidents++;
    row.minutesLost += i.minutesLost;
    if (i.deEscalated) row.deEscalated++;
    map.set(key, row);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, r]) => ({ label, ...r }));
}

/* ----------------------------------------------------------- Class heat map */

export interface ClassHeatCell {
  classId: string;
  className: string;
  campus: Campus;
  yearLevel: string;
  teacher: string;
  room: string;
  incidents: number;
  /** Incidents per enrolled student — density, not raw volume. */
  density: number;
  highIntensity: number;
  deEscalationRate: number;
  minutesLost: number;
  capacityIndex: number;
  risk: "Low" | "Moderate" | "Elevated" | "High";
  trendPct: number;
}

/**
 * Behaviour Capacity Index (0–100). Higher = the class needs more support.
 * Configurable weights: frequency, severity, trend, intervention success.
 */
export interface CapacityWeights {
  frequency: number;
  severity: number;
  trend: number;
  interventionSuccess: number;
}
export const defaultCapacityWeights: CapacityWeights = {
  frequency: 40,
  severity: 25,
  trend: 15,
  interventionSuccess: 20,
};

export function classHeatCells(
  incidents: LeadershipIncident[],
  weights: CapacityWeights = defaultCapacityWeights,
): ClassHeatCell[] {
  const cells = schoolClasses.map((cls) => {
    const list = incidents.filter((i) => i.classId === cls.id);
    const highIntensity = list.filter((i) => i.intensity === 3).length;
    const deEsc = list.filter((i) => i.deEscalated).length;
    const trend = weeklyVolume(list);
    const last = trend[trend.length - 1]?.incidents ?? 0;
    const prev = trend[trend.length - 2]?.incidents ?? last;
    return {
      classId: cls.id,
      className: cls.name,
      campus: cls.campus,
      yearLevel: cls.yearLevel,
      teacher: cls.teacher,
      room: cls.room,
      incidents: list.length,
      density: Number((list.length / cls.studentCount).toFixed(2)),
      highIntensity,
      deEscalationRate: Math.round((deEsc / (list.length || 1)) * 100),
      minutesLost: list.reduce((s, i) => s + i.minutesLost, 0),
      trendPct: prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100),
      _severity: list.length ? highIntensity / list.length : 0,
    };
  });

  const maxDensity = Math.max(1, ...cells.map((c) => c.density));
  const total = weights.frequency + weights.severity + weights.trend + weights.interventionSuccess || 1;

  return cells.map((c) => {
    const frequencyScore = (c.density / maxDensity) * weights.frequency;
    const severityScore = c._severity * weights.severity;
    const trendScore = (Math.max(-50, Math.min(50, c.trendPct)) + 50) / 100 * weights.trend;
    const successScore = ((100 - c.deEscalationRate) / 100) * weights.interventionSuccess;
    const capacityIndex = c.incidents
      ? Math.round(((frequencyScore + severityScore + trendScore + successScore) / total) * 100)
      : 0;
    const { _severity, ...rest } = c;
    return {
      ...rest,
      capacityIndex,
      risk: (capacityIndex >= 65 ? "High" : capacityIndex >= 50 ? "Elevated" : capacityIndex >= 32 ? "Moderate" : "Low") as ClassHeatCell["risk"],
    };
  });
}

/* -------------------------------------------------- Class intelligence page */

export interface ClassIntelligence {
  cls: SchoolClass;
  incidents: LeadershipIncident[];
  trend: { label: string; incidents: number; minutesLost: number; deEscalated: number }[];
  behaviours: { name: string; count: number }[];
  antecedents: { name: string; count: number }[];
  locations: { name: string; count: number }[];
  peakTimes: { name: string; count: number }[];
  interventions: { intervention: string; used: number; successRate: number }[];
  bsp: { status: BspStatus; students: string[] }[];
  minutesLost: number;
  deEscalationRate: number;
  studentsInvolved: number;
}

export function classIntelligence(
  classId: string,
  incidents: LeadershipIncident[],
): ClassIntelligence | null {
  const cls = schoolClasses.find((c) => c.id === classId);
  if (!cls) return null;
  const list = incidents.filter((i) => i.classId === classId);
  const roster = schoolStudents.filter((s) => s.classId === classId);

  const interventions = [...new Set(list.map((i) => i.intervention))].map((intervention) => {
    const subset = list.filter((i) => i.intervention === intervention);
    return {
      intervention,
      used: subset.length,
      successRate: Math.round((subset.filter((i) => i.deEscalated).length / subset.length) * 100),
    };
  }).sort((a, b) => b.successRate - a.successRate);

  const bspMap = new Map<BspStatus, string[]>();
  for (const s of roster) bspMap.set(s.bsp, [...(bspMap.get(s.bsp) ?? []), s.name]);

  return {
    cls,
    incidents: list,
    trend: weeklyVolume(list),
    behaviours: countBy(list.map((i) => i.behaviour)),
    antecedents: countBy(list.map((i) => i.antecedent)),
    locations: countBy(list.map((i) => i.location)),
    peakTimes: countBy(list.map((i) => i.time)),
    interventions,
    bsp: [...bspMap.entries()].map(([status, students]) => ({ status, students })),
    minutesLost: list.reduce((s, i) => s + i.minutesLost, 0),
    deEscalationRate: Math.round((list.filter((i) => i.deEscalated).length / (list.length || 1)) * 100),
    studentsInvolved: new Set(list.map((i) => i.studentId)).size,
  };
}

/* ------------------------------------------------ Student intervention queue */

export type InterventionAction =
  | "Behaviour Support Plan review"
  | "Functional Behaviour Assessment"
  | "Allied health referral"
  | "Leadership review"
  | "Continued monitoring";

export interface QueueEntry {
  studentId: string;
  studentName: string;
  className: string;
  classId: string;
  campus: Campus;
  action: InterventionAction;
  priority: "Urgent" | "High" | "Standard";
  confidence: "Low" | "Moderate" | "High";
  rationale: string;
  evidence: string[];
  incidentIds: string[];
  incidents: number;
  bsp: BspStatus;
}

export function interventionQueue(incidents: LeadershipIncident[]): QueueEntry[] {
  const byStudent = groupByStudent(incidents);
  const entries: QueueEntry[] = [];

  for (const [studentId, list] of byStudent) {
    if (list.length < 3) continue;
    const student = schoolStudents.find((s) => s.id === studentId);
    if (!student) continue;
    const cls = schoolClasses.find((c) => c.id === student.classId)!;
    const high = list.filter((i) => i.intensity === 3).length;
    const unresolved = list.filter((i) => !i.deEscalated).length;
    const unresolvedRate = unresolved / list.length;
    const topTrigger = countBy(list.map((i) => i.antecedent))[0]?.name ?? "Transition";
    const topBehaviour = countBy(list.map((i) => i.behaviour))[0]?.name ?? "Vocal protest";

    let action: InterventionAction;
    let priority: QueueEntry["priority"] = "Standard";
    let rationale: string;

    if (student.bsp === "Overdue" || student.bsp === "Review due") {
      action = "Behaviour Support Plan review";
      priority = student.bsp === "Overdue" ? "Urgent" : "High";
      rationale = `Behaviour support plan is ${student.bsp.toLowerCase()} while ${list.length} incidents have been recorded in the selected period.`;
    } else if (high >= 3 && unresolvedRate > 0.4) {
      action = "Functional Behaviour Assessment";
      priority = "Urgent";
      rationale = `${high} high-intensity incidents and ${unresolved} that did not de-escalate within 10 minutes suggest the behaviour function is not yet understood.`;
    } else if (student.alliedHealth.length === 0 && list.length >= 6) {
      action = "Allied health referral";
      priority = "High";
      rationale = `${list.length} incidents recorded with no allied health involvement on file; ${topTrigger.toLowerCase()} is the dominant antecedent.`;
    } else if (list.length >= 8 || (high >= 2 && list.length >= 6)) {
      action = "Leadership review";
      priority = "High";
      rationale = `Sustained frequency (${list.length} incidents) across ${new Set(list.map((i) => i.week)).size} weeks warrants a leadership check-in with the class team.`;
    } else {
      action = "Continued monitoring";
      rationale = `Pattern is stable — ${list.length} incidents, ${Math.round((1 - unresolvedRate) * 100)}% de-escalated with current supports.`;
    }

    const confidence: QueueEntry["confidence"] =
      list.length >= 10 ? "High" : list.length >= 5 ? "Moderate" : "Low";

    entries.push({
      studentId,
      studentName: student.name,
      className: cls.name,
      classId: cls.id,
      campus: cls.campus,
      action,
      priority,
      confidence,
      rationale,
      evidence: [
        `${list.length} ABC incident records (${list.slice(0, 3).map((i) => i.id).join(", ")}…)`,
        `Dominant behaviour: ${topBehaviour}; dominant antecedent: ${topTrigger}`,
        student.bsp === "None" ? "No behaviour support plan on file" : `Behaviour Support Plan — ${student.bsp}`,
        student.alliedHealth.length
          ? `Allied health involvement: ${student.alliedHealth.join(", ")}`
          : "No allied health involvement recorded",
      ],
      incidentIds: list.slice(0, 8).map((i) => i.id),
      incidents: list.length,
      bsp: student.bsp,
    });
  }

  const order: Record<QueueEntry["priority"], number> = { Urgent: 0, High: 1, Standard: 2 };
  return entries.sort(
    (a, b) => order[a.priority] - order[b.priority] || b.incidents - a.incidents,
  );
}

/* -------------------------------------------------------- Leadership alerts */

export interface LeadershipAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  scope: string;
  classId?: string;
  evidence: string;
}

export function leadershipAlerts(
  incidents: LeadershipIncident[],
  weights: CapacityWeights = defaultCapacityWeights,
): LeadershipAlert[] {
  const alerts: LeadershipAlert[] = [];
  const cells = classHeatCells(incidents, weights).filter((c) => c.incidents > 0);

  for (const c of cells) {
    if (c.trendPct >= 40) {
      alerts.push({
        id: `alert-trend-${c.classId}`,
        severity: "critical",
        title: `${c.className} incidents up ${c.trendPct}% week-on-week`,
        detail: `Density is now ${c.density} incidents per student. Consider an additional ES allocation or a class-team debrief this week.`,
        scope: `${c.campus} · ${c.yearLevel}`,
        classId: c.classId,
        evidence: `${c.incidents} incident records in the selected period`,
      });
    }
    if (c.risk === "High") {
      alerts.push({
        id: `alert-capacity-${c.classId}`,
        severity: "critical",
        title: `${c.className} Behaviour Capacity Index at ${c.capacityIndex}`,
        detail: `High-intensity incidents: ${c.highIntensity}. De-escalation rate ${c.deEscalationRate}%. This is a resourcing signal for the class, not a measure of the teacher.`,
        scope: `${c.campus} · ${c.yearLevel}`,
        classId: c.classId,
        evidence: `${c.minutesLost} teaching minutes lost in period`,
      });
    } else if (c.deEscalationRate < 55 && c.incidents >= 8) {
      alerts.push({
        id: `alert-deesc-${c.classId}`,
        severity: "warning",
        title: `${c.className} de-escalation rate below 55%`,
        detail: `Current strategies resolved ${c.deEscalationRate}% of incidents within 10 minutes. A review of the class response scripts with allied health may help.`,
        scope: `${c.campus} · ${c.yearLevel}`,
        classId: c.classId,
        evidence: `${c.incidents} incident records`,
      });
    }
    if (c.trendPct <= -35 && c.incidents >= 6) {
      alerts.push({
        id: `alert-improve-${c.classId}`,
        severity: "info",
        title: `${c.className} incidents down ${Math.abs(c.trendPct)}%`,
        detail: "Worth capturing what changed — the approach may transfer to other classes.",
        scope: `${c.campus} · ${c.yearLevel}`,
        classId: c.classId,
        evidence: `${c.incidents} incident records`,
      });
    }
  }

  const overdue = schoolStudents.filter(
    (s) => s.bsp === "Overdue" && incidents.some((i) => i.studentId === s.id),
  );
  if (overdue.length) {
    alerts.push({
      id: "alert-bsp-overdue",
      severity: "critical",
      title: `${overdue.length} behaviour support plan${overdue.length > 1 ? "s" : ""} overdue for review`,
      detail: `Students: ${overdue.map((s) => s.name).join(", ")}. Schedule SSG reviews before the end of the term.`,
      scope: "Whole school",
      evidence: "Behaviour support plan register",
    });
  }

  const peak = countBy(incidents.map((i) => `${i.day} ${i.time}`))[0];
  if (peak && incidents.length) {
    alerts.push({
      id: "alert-peak-window",
      severity: "warning",
      title: `Peak incident window is ${peak.name}`,
      detail: `${peak.count} of ${incidents.length} incidents occur in this window. A whole-school transition routine may reduce load across classes.`,
      scope: "Whole school",
      evidence: `${incidents.length} incident records`,
    });
  }

  const order = { critical: 0, warning: 1, info: 2 } as const;
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 0) return `${rem} min`;
  return `${hours}h ${rem}m`;
}
