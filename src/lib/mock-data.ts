// Mock data for SchoolMate AU UI shell. Replace with real backend reads later.

export type BehaviourStatus = "calm" | "settled" | "alert" | "incident";
export type AttendanceStatus = "present" | "late" | "absent" | "partial";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  yearLevel: string;
  className: string;
  avatarColor: string;
  initials: string;
  attendance: AttendanceStatus;
  behaviour: BehaviourStatus;
  iepGoalsActive: number;
  iepGoalsAchieved: number;
  latestEvidence: string;
  medicalAlerts: string[];
  dob: string;
  aacUser: boolean;
  funding: string;
}

const palette = [
  "bg-[oklch(0.85_0.08_192)]",
  "bg-[oklch(0.88_0.07_60)]",
  "bg-[oklch(0.86_0.08_280)]",
  "bg-[oklch(0.85_0.09_155)]",
  "bg-[oklch(0.87_0.08_25)]",
  "bg-[oklch(0.86_0.07_220)]",
  "bg-[oklch(0.88_0.06_100)]",
  "bg-[oklch(0.85_0.08_330)]",
];

const studentSeed: Omit<Student, "avatarColor" | "initials">[] = [
  { id: "s1", firstName: "Mia", lastName: "Nguyen", yearLevel: "Year 3", className: "Rosella", attendance: "present", behaviour: "calm", iepGoalsActive: 6, iepGoalsAchieved: 2, latestEvidence: "Counting to 20 — work sample", medicalAlerts: ["Asthma"], dob: "12 Mar 2017", aacUser: false, funding: "NDIS Tier 2" },
  { id: "s2", firstName: "Jack", lastName: "O'Brien", yearLevel: "Year 3", className: "Rosella", attendance: "late", behaviour: "alert", iepGoalsActive: 5, iepGoalsAchieved: 1, latestEvidence: "Turn-taking video", medicalAlerts: ["Epilepsy", "PRN Midazolam"], dob: "04 Sep 2017", aacUser: true, funding: "NDIS Tier 3" },
  { id: "s3", firstName: "Aaliyah", lastName: "Tahir", yearLevel: "Year 3", className: "Rosella", attendance: "present", behaviour: "settled", iepGoalsActive: 7, iepGoalsAchieved: 3, latestEvidence: "Tracing first name", medicalAlerts: [], dob: "21 Jan 2017", aacUser: false, funding: "DSE" },
  { id: "s4", firstName: "Noah", lastName: "Williams", yearLevel: "Year 3", className: "Rosella", attendance: "present", behaviour: "incident", iepGoalsActive: 8, iepGoalsAchieved: 1, latestEvidence: "Sensory regulation chart", medicalAlerts: ["ADHD meds 11:00"], dob: "08 Jun 2017", aacUser: false, funding: "NDIS Tier 3" },
  { id: "s5", firstName: "Zara", lastName: "Patel", yearLevel: "Year 3", className: "Rosella", attendance: "partial", behaviour: "calm", iepGoalsActive: 5, iepGoalsAchieved: 4, latestEvidence: "Independent play 8 mins", medicalAlerts: [], dob: "14 Nov 2017", aacUser: true, funding: "NDIS Tier 2" },
  { id: "s6", firstName: "Liam", lastName: "Schmidt", yearLevel: "Year 3", className: "Rosella", attendance: "present", behaviour: "settled", iepGoalsActive: 6, iepGoalsAchieved: 2, latestEvidence: "Joint attention — photo", medicalAlerts: ["Coeliac"], dob: "30 Apr 2017", aacUser: false, funding: "DSE" },
  { id: "s7", firstName: "Charlotte", lastName: "Reid", yearLevel: "Year 3", className: "Rosella", attendance: "absent", behaviour: "calm", iepGoalsActive: 4, iepGoalsAchieved: 3, latestEvidence: "Sorting by colour", medicalAlerts: [], dob: "17 Feb 2017", aacUser: false, funding: "NDIS Tier 2" },
  { id: "s8", firstName: "Hamish", lastName: "Carter", yearLevel: "Year 3", className: "Rosella", attendance: "present", behaviour: "alert", iepGoalsActive: 6, iepGoalsAchieved: 2, latestEvidence: "Requesting break with AAC", medicalAlerts: [], dob: "02 Aug 2017", aacUser: true, funding: "NDIS Tier 3" },
];

export const students: Student[] = studentSeed.map((s, i) => ({
  ...s,
  avatarColor: palette[i % palette.length],
  initials: `${s.firstName[0]}${s.lastName[0]}`,
}));

export interface TimetableBlock {
  start: string;
  end: string;
  title: string;
  room: string;
  type: "literacy" | "numeracy" | "specialist" | "break" | "therapy";
}

// P7 — Term 3 SY 2026 (Semester 2) · Teacher: Honey · ES: Sharifa
export type Semester = "Semester 1 · 2026" | "Semester 2 · 2026";
export const availableSemesters: Semester[] = ["Semester 1 · 2026", "Semester 2 · 2026"];
export const currentSemester: Semester = "Semester 2 · 2026";
export const classInfo = {
  code: "P7",
  term: "Term 3 · 2026",
  semester: currentSemester,
  teacher: "Honey",
  educationSupport: "Sharifa",
  room: "P7",
  medicalAlerts: [{ student: "Kristian", plan: "Asthma Plan" }],
};


export const todayTimetable: TimetableBlock[] = [
  { start: "9:00", end: "10:00", title: "Start the Day / Phonics", room: "P7", type: "literacy" },
  { start: "10:00", end: "10:30", title: "Literacy — Writing", room: "P7", type: "literacy" },
  { start: "10:30", end: "11:00", title: "Morning Tea", room: "P7", type: "break" },
  { start: "11:00", end: "11:30", title: "Morning Play", room: "Yard", type: "break" },
  { start: "11:30", end: "12:30", title: "Maths — Numbers", room: "P7", type: "numeracy" },
  { start: "12:30", end: "1:00", title: "Learn to Play", room: "P7", type: "literacy" },
  { start: "1:00", end: "1:30", title: "Lunch", room: "P7", type: "break" },
  { start: "1:30", end: "2:00", title: "Lunch Play", room: "Yard", type: "break" },
  { start: "2:00", end: "3:00", title: "Social Games", room: "P7", type: "specialist" },
];

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export interface WeekSession {
  session: 1 | 2 | 3 | 4 | 5;
  title: string;
  type: TimetableBlock["type"];
}
export const weeklyTimetable: Record<WeekDay, WeekSession[]> = {
  Mon: [
    { session: 1, title: "Start the Day / Phonics", type: "literacy" },
    { session: 2, title: "Literacy — Writing", type: "literacy" },
    { session: 3, title: "Maths — Numbers", type: "numeracy" },
    { session: 4, title: "Learn to Play", type: "literacy" },
    { session: 5, title: "Social Games", type: "specialist" },
  ],
  Tue: [
    { session: 1, title: "Start the Day / Phonics", type: "literacy" },
    { session: 2, title: "Literacy — Reading", type: "literacy" },
    { session: 3, title: "Activity — Art", type: "specialist" },
    { session: 4, title: "Activity — PE", type: "specialist" },
    { session: 5, title: "Geography", type: "specialist" },
  ],
  Wed: [
    { session: 1, title: "Start the Day / Phonics", type: "literacy" },
    { session: 2, title: "Sensory Story", type: "therapy" },
    { session: 3, title: "Maths — Algebra", type: "numeracy" },
    { session: 4, title: "Science", type: "specialist" },
    { session: 5, title: "RRRR", type: "literacy" },
  ],
  Thu: [
    { session: 1, title: "Start the Day / Phonics", type: "literacy" },
    { session: 2, title: "Colourful Semantics", type: "literacy" },
    { session: 3, title: "Swimming", type: "specialist" },
    { session: 4, title: "Swimming", type: "specialist" },
    { session: 5, title: "Personal Care", type: "therapy" },
  ],
  Fri: [
    { session: 1, title: "Drama", type: "specialist" },
    { session: 2, title: "Assembly / SWPBS", type: "specialist" },
    { session: 3, title: "Cooking / Maths — Statistics", type: "numeracy" },
    { session: 4, title: "Biking", type: "specialist" },
    { session: 5, title: "Music / Games", type: "specialist" },
  ],
};

export const sessionTimes = [
  { session: 1 as const, start: "9:00", end: "10:00" },
  { session: 2 as const, start: "10:00", end: "11:00" },
  { session: 3 as const, start: "11:30", end: "12:30" },
  { session: 4 as const, start: "12:30", end: "1:30" },
  { session: 5 as const, start: "2:00", end: "3:00" },
];

export interface ActionItem {
  id: string;
  kind: "lesson" | "iep" | "behaviour" | "medication" | "report";
  title: string;
  due: string;
  semester: Semester;
  urgent?: boolean;
  studentId?: string;
}

export const actionQueue: ActionItem[] = [
  { id: "a1", kind: "medication", title: "Kristian — Asthma plan check before Swimming", due: "Thu 9:00", semester: currentSemester, urgent: true },
  { id: "a2", kind: "behaviour", title: "Jack O'Brien — ABC incident form", due: "Today", semester: currentSemester, urgent: true, studentId: "s2" },
  { id: "a3", kind: "lesson", title: "Submit Wed 'Maths — Algebra' lesson plan", due: "Today", semester: currentSemester },
  { id: "a4", kind: "iep", title: "Aaliyah Tahir — IEP review meeting prep", due: "Tomorrow", semester: currentSemester },
  { id: "a5", kind: "report", title: "Semester 2 IEP reports draft (8 students)", due: "Fri 4 Jul", semester: "Semester 2 · 2026" },
];

export type IepReportStatus = "draft" | "in-review" | "approved" | "published";
export interface IepReport {
  id: string;
  studentId: string;
  studentName: string;
  semester: Semester;
  status: IepReportStatus;
  goalsIncluded: number;
  evidenceCount: number;
  updatedAt: string;
  author: string;
  approver?: string;
}

export const iepReports: IepReport[] = [
  { id: "r1", studentId: "s1", studentName: "Mia Nguyen",    semester: currentSemester, status: "draft",     goalsIncluded: 6, evidenceCount: 11, updatedAt: "Today 09:55",     author: "Honey" },
  { id: "r2", studentId: "s2", studentName: "Jack O'Brien",  semester: currentSemester, status: "in-review", goalsIncluded: 5, evidenceCount: 8,  updatedAt: "Yesterday 16:20", author: "Honey", approver: "L. Specialist" },
  { id: "r3", studentId: "s3", studentName: "Aaliyah Tahir", semester: currentSemester, status: "approved",  goalsIncluded: 7, evidenceCount: 14, updatedAt: "2 days ago",      author: "Honey", approver: "L. Specialist" },
  { id: "r4", studentId: "s4", studentName: "Noah Williams", semester: currentSemester, status: "draft",     goalsIncluded: 8, evidenceCount: 9,  updatedAt: "Today 12:30",     author: "Sharifa" },
  { id: "r5", studentId: "s5", studentName: "Zara Patel",    semester: currentSemester, status: "in-review", goalsIncluded: 5, evidenceCount: 7,  updatedAt: "Yesterday 14:00", author: "Honey", approver: "L. Specialist" },
  { id: "r6", studentId: "s1", studentName: "Mia Nguyen",    semester: "Semester 1 · 2026", status: "published", goalsIncluded: 6, evidenceCount: 18, updatedAt: "12 Jun 2026",  author: "Honey", approver: "Leadership" },
  { id: "r7", studentId: "s2", studentName: "Jack O'Brien",  semester: "Semester 1 · 2026", status: "published", goalsIncluded: 5, evidenceCount: 13, updatedAt: "12 Jun 2026",  author: "Honey", approver: "Leadership" },
  { id: "r8", studentId: "s3", studentName: "Aaliyah Tahir", semester: "Semester 1 · 2026", status: "published", goalsIncluded: 6, evidenceCount: 16, updatedAt: "12 Jun 2026",  author: "Honey", approver: "Leadership" },
  { id: "r9", studentId: "s5", studentName: "Zara Patel",    semester: "Semester 1 · 2026", status: "published", goalsIncluded: 5, evidenceCount: 12, updatedAt: "12 Jun 2026",  author: "Honey", approver: "Leadership" },
];

export type BehaviourReportStatus = "open" | "monitoring" | "resolved";
export interface BehaviourReport {
  id: string;
  studentId: string;
  studentName: string;
  semester: Semester;
  status: BehaviourReportStatus;
  incidents: number;
  evidenceCount: number;
  linkedGoalIds: string[];
  summary: string;
  updatedAt: string;
  author: string;
}

export const behaviourReports: BehaviourReport[] = [
  { id: "b1", studentId: "s4", studentName: "Noah Williams",  semester: currentSemester, status: "open",       incidents: 6, evidenceCount: 4, linkedGoalIds: [], summary: "Cluster at 11:15 post-recess — sensory overload",         updatedAt: "Today 12:10",    author: "Honey" },
  { id: "b2", studentId: "s2", studentName: "Jack O'Brien",   semester: currentSemester, status: "monitoring", incidents: 3, evidenceCount: 2, linkedGoalIds: [], summary: "Turn-taking conflicts during group play",                  updatedAt: "Yesterday 15:40", author: "Honey" },
  { id: "b3", studentId: "s8", studentName: "Hamish Carter",  semester: currentSemester, status: "monitoring", incidents: 2, evidenceCount: 3, linkedGoalIds: [], summary: "AAC requesting break — strategy working",                  updatedAt: "2 days ago",     author: "Sharifa" },
  { id: "b4", studentId: "s4", studentName: "Noah Williams",  semester: "Semester 1 · 2026", status: "resolved", incidents: 11, evidenceCount: 9, linkedGoalIds: [], summary: "Visual schedule reduced transitions incidents by 60%",   updatedAt: "10 Jun 2026",    author: "Honey" },
];





export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Lesson approved", body: "Learning Specialist approved 'Measurement with non-standard units'", time: "12 min ago", unread: true },
  { id: "n2", title: "New therapy note", body: "Speech Therapist added a note for Jack O'Brien", time: "1 hr ago", unread: true },
  { id: "n3", title: "Evidence linked", body: "AI linked 3 new photos to Mia's IEP Goal 2", time: "Yesterday" },
];

export const aiSnapshot = {
  title: "Today, your class is mostly settled",
  body: "Noah may need extra sensory breaks after recess — last 3 days show 11:15 incidents. Aaliyah achieved her 'requesting help with AAC' goal twice yesterday — consider promoting to 'Working Towards' on her next check-in. Two lessons are still in draft.",
  highlights: [
    { label: "Goals achieved this week", value: "14" },
    { label: "Pieces of evidence", value: "47" },
    { label: "Behaviour incidents", value: "3", trend: "down" as const },
    { label: "Attendance", value: "92%" },
  ],
};

export const curriculumStrands = {
  Mathematics: ["Number", "Measurement", "Space"],
  English: ["Reading & Viewing", "Speaking & Listening", "Writing"],
  "Personal & Social": ["Self-awareness", "Self-management", "Social awareness", "Social management"],
  Science: ["Biological", "Physical", "Earth & Space", "Chemical"],
  PE: ["Movement", "Health", "Teamwork"],
  Arts: ["Drama", "Visual Arts"],
  "Learn to Play": ["Turn-taking", "Social interaction", "Independent play"],
};

export type IepStatus = "not-started" | "developing" | "working-towards" | "achieved";
export type IepApproval = "draft" | "pending" | "approved";
export type IepDomain =
  | "English"
  | "Maths"
  | "Personal & Social"
  | "Science"
  | "HASS"
  | "Health & PE"
  | "The Arts"
  | "Self-care";
export type VcLevel = "A" | "B" | "C" | "D" | "F" | "1" | "2";
export type LearningArea =
  | "English · Phonics"
  | "English · Reading & Viewing"
  | "English · Speaking & Listening"
  | "English · Writing"
  | "Maths · Number"
  | "Maths · Measurement"
  | "Maths · Space"
  | "Humanities · History"
  | "Humanities · Geography"
  | "Science"
  | "Personal & Social"
  | "Health & PE"
  | "The Arts · Music"
  | "The Arts · Drama"
  | "The Arts · Visual Arts"
  | "Cooking / Kitchen Garden";


export interface SuccessCriterion {
  step: string;
  developing: string;
  workingTowards: string;
  achieved: string;
  status: Exclude<IepStatus, "not-started">;
}

export interface IepGoal {
  id: string;
  studentId: string;
  studentName: string;
  domain: IepDomain;
  learningArea: LearningArea;
  level: VcLevel;
  learningIntention: string;
  smart: string;
  baseline: string;
  status: IepStatus;
  semester: Semester;
  approval?: IepApproval;
  approvedBy?: string;
  approvedAt?: string;
  evidenceCount: number;
  lastEvidence: string;
  reviewDue: string;
  vcLink: string;
  successCriteria: SuccessCriterion[];
}

// Goals scaffolded from the school's Scope & Sequence with Cross-Check descriptors.
// All goals belong to the current reporting semester unless otherwise specified.
const seedSemester: Semester = currentSemester;
export const iepGoals: IepGoal[] = ([

  {
    id: "g1", studentId: "s1", studentName: "Mia Nguyen", domain: "Maths",
    learningArea: "Maths · Number", level: "F", vcLink: "VC2MFN01",
    learningIntention: "Name, represent and order numbers, including zero to at least 20, using physical and virtual materials and numerals.",
    smart: "Mia will name, represent and order numbers 0–20 with 80% accuracy across 3 sessions by end of Semester 2.",
    baseline: "Names and orders 0–10 with prompts", status: "developing",
    evidenceCount: 8, lastEvidence: "2 days ago", reviewDue: "Wk 8",
    successCriteria: [
      { step: "Name numerals 0–20", workingTowards: "Names 0–10 inconsistently", developing: "Names 0–20 with cues", achieved: "Names numerals 0–20 independently", status: "developing" },
      { step: "Represent quantities to 20 with materials", workingTowards: "Represents to 10 with support", developing: "Represents to 20 with guidance", achieved: "Represents 0–20 with materials independently", status: "developing" },
      { step: "Order numbers 0–20 using materials or charts", workingTowards: "Orders inconsistently", developing: "Orders with guidance", achieved: "Orders numbers 0–20 using materials or charts", status: "working-towards" },
    ],
  },
  {
    id: "g2", studentId: "s1", studentName: "Mia Nguyen", domain: "English",
    learningArea: "English · Speaking & Listening", level: "D", vcLink: "VC2EFDLA02",
    learningIntention: "Use phrases to communicate preferences, likes and dislikes.",
    smart: "Mia will use 3-word phrases to indicate preferences independently in 4/5 opportunities daily.",
    baseline: "1–2 word requests with prompts", status: "working-towards",
    evidenceCount: 4, lastEvidence: "Yesterday", reviewDue: "Wk 9",
    successCriteria: [
      { step: "Choose between two options", workingTowards: "Chooses when heavily supported", developing: "Chooses between two options with prompts", achieved: "Indicates preference with no prompting", status: "developing" },
      { step: "Use 3-word phrase for likes/dislikes", workingTowards: "Uses single word", developing: "Uses 2-word phrase with model", achieved: "Uses 3-word phrase independently", status: "working-towards" },
      { step: "Generalise across activities", workingTowards: "Snack only", developing: "2 routines", achieved: "Across the school day", status: "working-towards" },
    ],
  },
  {
    id: "g3", studentId: "s2", studentName: "Jack O'Brien", domain: "Personal & Social",
    learningArea: "English · Speaking & Listening", level: "C", vcLink: "VC2EFCLA01",
    learningIntention: "Use short phrases to request, accept or reject an object, action or event.",
    smart: "Jack will request a break using his AAC device when escalated in 3/5 opportunities.",
    baseline: "Elopes when overwhelmed", status: "developing",
    evidenceCount: 12, lastEvidence: "Today", reviewDue: "Wk 7",
    successCriteria: [
      { step: "Activate AAC 'break' symbol with model", workingTowards: "Activates rarely", developing: "Activates with model", achieved: "Activates independently", status: "achieved" },
      { step: "Request break before escalation", workingTowards: "Requests after incident", developing: "Requests with prompts", achieved: "Requests before escalation", status: "developing" },
      { step: "Accept offered regulation strategy", workingTowards: "Refuses", developing: "Accepts with support", achieved: "Accepts and uses strategy", status: "developing" },
    ],
  },
  {
    id: "g4", studentId: "s2", studentName: "Jack O'Brien", domain: "English",
    learningArea: "English · Phonics", level: "D", vcLink: "VC2EFDLY02",
    learningIntention: "Blend and segment a small number of one-syllable words; read some CVC words.",
    smart: "Jack will read 6 CVC words by blending sounds with 80% accuracy across 3 sessions.",
    baseline: "Matches 2 CVC pictures to words", status: "working-towards",
    evidenceCount: 3, lastEvidence: "3 days ago", reviewDue: "Wk 8",
    successCriteria: [
      { step: "Identify initial sound in CVC word", workingTowards: "Identifies inconsistently", developing: "Identifies with cues", achieved: "Identifies independently", status: "developing" },
      { step: "Blend onset + rime", workingTowards: "Blends with hand-over-hand", developing: "Blends with prompts", achieved: "Blends independently", status: "working-towards" },
      { step: "Read 6 CVC words", workingTowards: "Reads 2", developing: "Reads 4 with cues", achieved: "Reads 6 independently", status: "working-towards" },
    ],
  },
  {
    id: "g5", studentId: "s3", studentName: "Aaliyah Tahir", domain: "English",
    learningArea: "English · Writing", level: "F", vcLink: "VC2EFLY15",
    learningIntention: "Form most lower-case and upper-case letters using learnt letter formations.",
    smart: "Aaliyah will form the letters of her first name with a model present, 4 of 5 attempts.",
    baseline: "Traces 3 letters with hand-over-hand", status: "achieved",
    evidenceCount: 14, lastEvidence: "Today", reviewDue: "Wk 6",
    successCriteria: [
      { step: "Hold pencil with functional grip", workingTowards: "Palmar grip", developing: "Transitional grip", achieved: "Tripod grip sustained", status: "achieved" },
      { step: "Trace letters with model", workingTowards: "Traces with HOH", developing: "Traces with verbal prompt", achieved: "Traces independently", status: "achieved" },
      { step: "Form letters from memory", workingTowards: "1–2 letters", developing: "3–4 letters with model", achieved: "All letters of first name", status: "achieved" },
    ],
  },
  {
    id: "g6", studentId: "s3", studentName: "Aaliyah Tahir", domain: "English",
    learningArea: "English · Speaking & Listening", level: "C", vcLink: "VC2EFCLA01",
    learningIntention: "Use short phrases to request, accept or reject an object, action or event.",
    smart: "Aaliyah will request help using her PECS card in 4/5 opportunities.",
    baseline: "Requests with adult prompt", status: "achieved",
    evidenceCount: 11, lastEvidence: "Yesterday", reviewDue: "Wk 6",
    successCriteria: [
      { step: "Discriminate 'help' card from others", workingTowards: "Selects with prompt", developing: "Selects with cue", achieved: "Discriminates independently", status: "achieved" },
      { step: "Exchange card with adult", workingTowards: "Hand-over-hand", developing: "Approximates exchange", achieved: "Exchanges independently", status: "achieved" },
      { step: "Use across activities", workingTowards: "1 activity", developing: "2–3 activities", achieved: "Across the school day", status: "developing" },
    ],
  },
  {
    id: "g7", studentId: "s4", studentName: "Noah Williams", domain: "Self-care",
    learningArea: "Maths · Measurement", level: "D", vcLink: "VC2MFDM02",
    learningIntention: "Sequence familiar routines and events using simple ordinal language.",
    smart: "Noah will independently sequence the 5-step handwashing routine after toileting.",
    baseline: "Completes 2/5 steps", status: "developing",
    evidenceCount: 6, lastEvidence: "Today", reviewDue: "Wk 8",
    successCriteria: [
      { step: "Identify each step on a visual sequence", workingTowards: "Points with support", developing: "Points with cues", achieved: "Identifies all 5 steps", status: "developing" },
      { step: "Order steps 1st–5th", workingTowards: "Orders 2 steps", developing: "Orders 3–4 steps", achieved: "Orders all 5 steps", status: "developing" },
      { step: "Perform routine independently", workingTowards: "2/5 steps", developing: "3–4/5 steps", achieved: "Independent 5/5 steps", status: "working-towards" },
    ],
  },
  {
    id: "g8", studentId: "s4", studentName: "Noah Williams", domain: "Personal & Social",
    learningArea: "English · Speaking & Listening", level: "D", vcLink: "VC2EFDLA02",
    learningIntention: "Use phrases to communicate preferences, likes and dislikes.",
    smart: "Noah will use a sensory regulation chart to label his state 3 times daily.",
    baseline: "Adult-led check-ins only", status: "working-towards",
    evidenceCount: 5, lastEvidence: "Yesterday", reviewDue: "Wk 9",
    successCriteria: [
      { step: "Point to current state on chart", workingTowards: "Points with model", developing: "Points with cue", achieved: "Points independently", status: "developing" },
      { step: "Label state with phrase", workingTowards: "Single colour word", developing: "2-word phrase with cue", achieved: "Phrase independently", status: "working-towards" },
      { step: "Initiate check-in 3× daily", workingTowards: "Adult-led only", developing: "1–2 self-initiated", achieved: "3 self-initiated", status: "working-towards" },
    ],
  },
  {
    id: "g9", studentId: "s5", studentName: "Zara Patel", domain: "English",
    learningArea: "English · Speaking & Listening", level: "B", vcLink: "VC2EFBLA01",
    learningIntention: "Use preferred communication modality to indicate a preference.",
    smart: "Zara will initiate AAC requests for 3 preferred items independently.",
    baseline: "Requests 1 item with model", status: "developing",
    evidenceCount: 9, lastEvidence: "2 days ago", reviewDue: "Wk 7",
    successCriteria: [
      { step: "Activate AAC for 1 preferred item", workingTowards: "With model", developing: "With cue", achieved: "Independently", status: "achieved" },
      { step: "Discriminate between 3 symbols", workingTowards: "Selects 1 symbol", developing: "Selects 2 with cues", achieved: "Selects 3 independently", status: "developing" },
      { step: "Initiate without prompt", workingTowards: "Responds only", developing: "Initiates with cue", achieved: "Initiates independently", status: "working-towards" },
    ],
  },
  {
    id: "g10", studentId: "s8", studentName: "Hamish Carter", domain: "Personal & Social",
    learningArea: "English · Speaking & Listening", level: "C", vcLink: "VC2EFCLA01",
    learningIntention: "Use short phrases to request, accept or reject an object, action or event.",
    smart: "Hamish will request a break with AAC in 4/5 escalation moments.",
    baseline: "Verbal protest only", status: "developing",
    evidenceCount: 7, lastEvidence: "Today", reviewDue: "Wk 8",
    successCriteria: [
      { step: "Recognise body signals of overwhelm", workingTowards: "Adult identifies", developing: "Identifies with cue", achieved: "Identifies independently", status: "developing" },
      { step: "Locate AAC 'break' symbol", workingTowards: "With model", developing: "With cue", achieved: "Independently", status: "achieved" },
      { step: "Request break before escalation", workingTowards: "After incident", developing: "Mid-escalation with prompt", achieved: "Before escalation", status: "working-towards" },
    ],
  },
  {
    id: "g11", studentId: "s3", studentName: "Aaliyah Tahir", domain: "Science",
    learningArea: "Science", level: "F", vcLink: "VC2SFU01",
    learningIntention: "Explore the needs of living things and identify what is living and non-living.",
    smart: "Aaliyah will sort 6 picture cards into living / non-living in 3/4 sessions.",
    baseline: "Sorts 2 with adult support", status: "developing",
    evidenceCount: 3, lastEvidence: "3 days ago", reviewDue: "Wk 9",
    successCriteria: [
      { step: "Name 3 living things in the classroom", workingTowards: "Names 1 with cue", developing: "Names 2 with cue", achieved: "Names 3 independently", status: "developing" },
      { step: "Sort 6 picture cards", workingTowards: "Sorts 2", developing: "Sorts 4 with cues", achieved: "Sorts 6 independently", status: "developing" },
      { step: "Explain one need (food / water / air)", workingTowards: "Points to picture", developing: "Single word", achieved: "Short phrase", status: "working-towards" },
    ],
  },
  {
    id: "g12", studentId: "s1", studentName: "Mia Nguyen", domain: "HASS",
    learningArea: "Humanities · Geography", level: "F", vcLink: "VC2HGFK01",
    learningIntention: "Identify the places I belong to — home, classroom, school.",
    smart: "Mia will match 4 place photos to labels (home, classroom, yard, hall) in 4/5 trials.",
    baseline: "Matches 2 places with model", status: "developing",
    evidenceCount: 2, lastEvidence: "Yesterday", reviewDue: "Wk 10",
    successCriteria: [
      { step: "Recognise own classroom photo", workingTowards: "With prompt", developing: "With cue", achieved: "Independently", status: "achieved" },
      { step: "Match 4 places to labels", workingTowards: "Matches 1", developing: "Matches 2–3", achieved: "Matches all 4", status: "developing" },
      { step: "Name place during walk", workingTowards: "Imitates word", developing: "Single word with cue", achieved: "Names independently", status: "working-towards" },
    ],
  },
  {
    id: "g13", studentId: "s4", studentName: "Noah Williams", domain: "Health & PE",
    learningArea: "Health & PE", level: "D", vcLink: "VC2HPFM02",
    learningIntention: "Perform fundamental movement skills with growing control.",
    smart: "Noah will catch a large soft ball from 1m in 4/5 attempts during PE.",
    baseline: "Traps ball against chest occasionally", status: "developing",
    evidenceCount: 4, lastEvidence: "Today", reviewDue: "Wk 9",
    successCriteria: [
      { step: "Track ball with eyes", workingTowards: "Inconsistent tracking", developing: "Tracks with cue", achieved: "Tracks independently", status: "developing" },
      { step: "Position hands to catch", workingTowards: "Closes after contact", developing: "Closes with cue", achieved: "Closes on contact", status: "developing" },
      { step: "Catch from 1m", workingTowards: "1/5", developing: "2–3/5", achieved: "4/5", status: "working-towards" },
    ],
  },
  {
    id: "g14", studentId: "s5", studentName: "Zara Patel", domain: "The Arts",
    learningArea: "The Arts · Music", level: "C", vcLink: "VC2AMUFE01",
    learningIntention: "Respond to music using voice, body and instruments.",
    smart: "Zara will tap a steady beat on a drum for 8 counts in 3/4 sessions.",
    baseline: "Taps inconsistently with model", status: "developing",
    evidenceCount: 2, lastEvidence: "2 days ago", reviewDue: "Wk 10",
    successCriteria: [
      { step: "Hold mallet correctly", workingTowards: "HOH", developing: "With cue", achieved: "Independently", status: "developing" },
      { step: "Tap 4 counts", workingTowards: "1–2 taps", developing: "3 taps", achieved: "4 taps in time", status: "working-towards" },
      { step: "Tap 8 counts", workingTowards: "Loses beat", developing: "Maintains 5–6", achieved: "Maintains 8", status: "developing" },
    ],
  },
  {
    id: "g15", studentId: "s8", studentName: "Hamish Carter", domain: "The Arts",
    learningArea: "The Arts · Drama", level: "C", vcLink: "VC2ADRFE01",
    learningIntention: "Take on a role using voice, movement and props.",
    smart: "Hamish will hold a prop and copy 3 actions in role during Drama.",
    baseline: "Watches peers, joins briefly", status: "developing",
    evidenceCount: 1, lastEvidence: "Last week", reviewDue: "Wk 10",
    successCriteria: [
      { step: "Hold prop for 30s", workingTowards: "Drops quickly", developing: "Holds with cue", achieved: "Holds independently", status: "developing" },
      { step: "Copy 1 action", workingTowards: "With HOH", developing: "With model", achieved: "Independently", status: "developing" },
      { step: "Copy 3 actions", workingTowards: "Copies 1", developing: "Copies 2", achieved: "Copies 3", status: "working-towards" },
    ],
  },
  {
    id: "g16", studentId: "s7", studentName: "Charlotte Reid", domain: "The Arts",
    learningArea: "Cooking / Kitchen Garden", level: "D", vcLink: "VC2DTFK01",
    learningIntention: "Follow a 3-step picture recipe with support.",
    smart: "Charlotte will follow a 3-step recipe sequence (spread, top, fold) in Cooking with 1 prompt.",
    baseline: "Completes 1 step", status: "developing",
    evidenceCount: 2, lastEvidence: "Friday", reviewDue: "Wk 9",
    successCriteria: [
      { step: "Identify each step on visual", workingTowards: "Points with cue", developing: "Points with model", achieved: "Identifies all 3", status: "developing" },
      { step: "Perform each step", workingTowards: "1 step with HOH", developing: "2 steps with cue", achieved: "3 steps with 1 prompt", status: "developing" },
      { step: "Sequence correctly", workingTowards: "Random", developing: "With visual prompt", achieved: "Independent sequence", status: "working-towards" },
    ],
  },
] as Omit<IepGoal, "semester">[]).map((g) => ({ ...g, semester: seedSemester }));

// Specialist teacher entries — comments and photo evidence attached to a student
// by visiting specialists (PE, Music, Drama, Cooking, OT, SLP) who edit IEPs.
export type SpecialistSubject =
  | "Health & PE"
  | "The Arts · Music"
  | "The Arts · Drama"
  | "The Arts · Visual Arts"
  | "Cooking / Kitchen Garden"
  | "Speech Therapy"
  | "Occupational Therapy";

export interface SpecialistEntry {
  id: string;
  specialistName: string;
  specialistRole: SpecialistSubject;
  studentId: string;
  goalId?: string;
  comment: string;
  photoHue?: number;
  addedAt: string;
  semester: Semester;
}

export const specialistEntries: SpecialistEntry[] = [
  { id: "sp1", specialistName: "Coach Tom",   specialistRole: "Health & PE",             studentId: "s4", goalId: "g13", comment: "Noah caught the ball 3/5 today — best result yet. Trying a yellow ball next week for higher contrast.", photoHue: 60,  addedAt: "Today 11:20",   semester: currentSemester },
  { id: "sp2", specialistName: "Ms Aria",     specialistRole: "The Arts · Music",        studentId: "s5", goalId: "g14", comment: "Zara held the mallet independently and tapped 6 even beats. Adding visual count cards for 8-beat target.", photoHue: 280, addedAt: "Yesterday 14:05", semester: currentSemester },
  { id: "sp3", specialistName: "Mr Davies",   specialistRole: "The Arts · Drama",        studentId: "s8", goalId: "g15", comment: "Hamish held the hat for full 30s and copied 1 action. Will pair him with Aaliyah for next role-play.", photoHue: 330, addedAt: "2 days ago",    semester: currentSemester },
  { id: "sp4", specialistName: "Chef Bea",    specialistRole: "Cooking / Kitchen Garden", studentId: "s7", goalId: "g16", comment: "Charlotte completed spread → top with one verbal prompt. Folding needs hand-over-hand still.",            photoHue: 25,  addedAt: "Friday 13:40",  semester: currentSemester },
  { id: "sp5", specialistName: "Lana (SLP)",  specialistRole: "Speech Therapy",          studentId: "s2", goalId: "g3",  comment: "Jack initiated 'break please' once unprompted. Visual scripts working — recommend continuing in class.",   photoHue: 220, addedAt: "Today 09:50",   semester: currentSemester },
  { id: "sp6", specialistName: "Priya (OT)",  specialistRole: "Occupational Therapy",    studentId: "s1",                comment: "Mia tolerated 8 minutes of seated table work today (up from 5). Suggest wobble cushion trial next week.",   photoHue: 192, addedAt: "Today 10:30",   semester: currentSemester },
];



export type EvidenceMedium = "photo" | "video" | "work-sample" | "anecdotal" | "audio";
export interface EvidenceItem {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  medium: EvidenceMedium;
  caption: string;
  goalIds: string[];
  vcStrand: string;
  capturedBy: string;
  capturedAt: string;
  aiTagged: boolean;
  aiSuggestedGoal?: string;
  thumbHue: number;
  semester: Semester;
}

const evidenceSeed: Omit<EvidenceItem, "semester">[] = [
  { id: "e1", studentId: "s3", studentName: "Aaliyah Tahir", studentInitials: "AT", medium: "work-sample", caption: "Traced 'Aaliyah' with model — first time independent on all 7 letters.", goalIds: ["g5"], vcStrand: "English · Writing", capturedBy: "Honey", capturedAt: "Today 10:42", aiTagged: true, thumbHue: 25 },
  { id: "e2", studentId: "s2", studentName: "Jack O'Brien", studentInitials: "JO", medium: "video", caption: "Used AAC to request 'break please' when class became loud.", goalIds: ["g3"], vcStrand: "Personal & Social", capturedBy: "Sharifa", capturedAt: "Today 11:15", aiTagged: true, thumbHue: 220 },
  { id: "e3", studentId: "s1", studentName: "Mia Nguyen", studentInitials: "MN", medium: "photo", caption: "Counted out 14 counters into 10-frame, self-corrected once.", goalIds: ["g1"], vcStrand: "Maths · Number", capturedBy: "Honey", capturedAt: "Today 09:55", aiTagged: true, thumbHue: 192 },
  { id: "e4", studentId: "s4", studentName: "Noah Williams", studentInitials: "NW", medium: "anecdotal", caption: "Pointed to 'yellow' on regulation chart unprompted before recess.", goalIds: ["g8"], vcStrand: "Personal & Social", capturedBy: "Honey", capturedAt: "Yesterday 14:10", aiTagged: true, thumbHue: 60 },
  { id: "e5", studentId: "s8", studentName: "Hamish Carter", studentInitials: "HC", medium: "video", caption: "Requested break with AAC during Maths — accepted sensory corner offer.", goalIds: ["g10"], vcStrand: "Personal & Social", capturedBy: "Sharifa", capturedAt: "Today 12:05", aiTagged: true, thumbHue: 330 },
  { id: "e6", studentId: "s5", studentName: "Zara Patel", studentInitials: "ZP", medium: "audio", caption: "Initiated 'more iPad please' using AAC without model.", goalIds: ["g9"], vcStrand: "English · Speaking", capturedBy: "Honey", capturedAt: "2 days ago", aiTagged: true, thumbHue: 280 },
  { id: "e7", studentId: "s1", studentName: "Mia Nguyen", studentInitials: "MN", medium: "photo", caption: "Three-word phrase 'I want red' during snack choice.", goalIds: [], vcStrand: "English · Speaking", capturedBy: "Sharifa", capturedAt: "Today 10:35", aiTagged: false, aiSuggestedGoal: "g2", thumbHue: 192 },
  { id: "e8", studentId: "s3", studentName: "Aaliyah Tahir", studentInitials: "AT", medium: "photo", caption: "Used PECS 'help' card during shoelace task.", goalIds: ["g6"], vcStrand: "English · Speaking", capturedBy: "Honey", capturedAt: "Yesterday 13:20", aiTagged: true, thumbHue: 25 },
  { id: "e9", studentId: "s4", studentName: "Noah Williams", studentInitials: "NW", medium: "work-sample", caption: "Followed 3/5 handwashing steps with visual sequence.", goalIds: ["g7"], vcStrand: "Health & PE", capturedBy: "Sharifa", capturedAt: "Today 12:30", aiTagged: true, thumbHue: 60 },
  { id: "e10", studentId: "s2", studentName: "Jack O'Brien", studentInitials: "JO", medium: "work-sample", caption: "Matched 4 CVC picture-to-word pairs (cat, dog, hat, pig).", goalIds: [], vcStrand: "English · Reading", capturedBy: "Honey", capturedAt: "3 days ago", aiTagged: false, aiSuggestedGoal: "g4", thumbHue: 220 },
];

// A couple of items captured during Semester 1 so global search can demonstrate semester scoping.
const sem1EvidenceIds = new Set(["e6", "e10"]);

export const evidenceItems: EvidenceItem[] = evidenceSeed.map((e) => ({
  ...e,
  semester: sem1EvidenceIds.has(e.id) ? "Semester 1 · 2026" : currentSemester,
}));

export const lessonExamples = [
  { subject: "Mathematics", strand: "Number", topic: "Counting to 20 with 10-frames", duration: "45 min" },
  { subject: "English", strand: "Writing", topic: "Tracing my first name", duration: "30 min" },
  { subject: "Personal & Social", strand: "Self-management", topic: "Using my zones of regulation chart", duration: "30 min" },
];

