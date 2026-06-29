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

// P7 — Term 3 SY 2026 · Teacher: Honey · ES: Sharifa
export const classInfo = {
  code: "P7",
  term: "Term 3 · 2026",
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
  urgent?: boolean;
  studentId?: string;
}

export const actionQueue: ActionItem[] = [
  { id: "a1", kind: "medication", title: "Kristian — Asthma plan check before Swimming", due: "Thu 9:00", urgent: true },
  { id: "a2", kind: "behaviour", title: "Jack O'Brien — ABC incident form", due: "Today", urgent: true, studentId: "s2" },
  { id: "a3", kind: "lesson", title: "Submit Wed 'Maths — Algebra' lesson plan", due: "Today" },
  { id: "a4", kind: "iep", title: "Aaliyah Tahir — IEP review meeting prep", due: "Tomorrow" },
  { id: "a5", kind: "report", title: "Term 3 IEP reports draft (8 students)", due: "Fri 4 Jul" },
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

export type IepStatus = "not-started" | "emerging" | "working-towards" | "achieved";
export type IepDomain = "Communication" | "Literacy" | "Numeracy" | "Social-Emotional" | "Self-care" | "Motor";

export interface IepGoal {
  id: string;
  studentId: string;
  studentName: string;
  domain: IepDomain;
  smart: string;
  baseline: string;
  status: IepStatus;
  evidenceCount: number;
  lastEvidence: string;
  reviewDue: string;
  vcLink: string;
}

export const iepGoals: IepGoal[] = [
  { id: "g1", studentId: "s1", studentName: "Mia Nguyen", domain: "Numeracy", smart: "Mia will rote count 1–20 with 80% accuracy across 3 sessions by end of Term 3.", baseline: "Counts 1–10 with prompts", status: "working-towards", evidenceCount: 8, lastEvidence: "2 days ago", reviewDue: "Wk 8", vcLink: "VC2M1N01" },
  { id: "g2", studentId: "s1", studentName: "Mia Nguyen", domain: "Communication", smart: "Mia will use 3-word requests independently in 4/5 opportunities daily.", baseline: "1–2 word requests with prompts", status: "emerging", evidenceCount: 4, lastEvidence: "Yesterday", reviewDue: "Wk 9", vcLink: "VC2EAS-A" },
  { id: "g3", studentId: "s2", studentName: "Jack O'Brien", domain: "Social-Emotional", smart: "Jack will request a break using his AAC device when escalated in 3/5 opportunities.", baseline: "Currently elopes when overwhelmed", status: "working-towards", evidenceCount: 12, lastEvidence: "Today", reviewDue: "Wk 7", vcLink: "VC2PSM-B" },
  { id: "g4", studentId: "s2", studentName: "Jack O'Brien", domain: "Literacy", smart: "Jack will match 6 CVC pictures to words with 80% accuracy.", baseline: "Matches 2 CVC pictures", status: "emerging", evidenceCount: 3, lastEvidence: "3 days ago", reviewDue: "Wk 8", vcLink: "VC2E1LY09" },
  { id: "g5", studentId: "s3", studentName: "Aaliyah Tahir", domain: "Literacy", smart: "Aaliyah will trace her first name with a model present, 4 of 5 attempts.", baseline: "Traces 3 letters with hand-over-hand", status: "achieved", evidenceCount: 14, lastEvidence: "Today", reviewDue: "Wk 6", vcLink: "VC2EFLY10" },
  { id: "g6", studentId: "s3", studentName: "Aaliyah Tahir", domain: "Communication", smart: "Aaliyah will request help using her PECS card in 4/5 opportunities.", baseline: "Requests with adult prompt", status: "achieved", evidenceCount: 11, lastEvidence: "Yesterday", reviewDue: "Wk 6", vcLink: "VC2EAS-A" },
  { id: "g7", studentId: "s4", studentName: "Noah Williams", domain: "Self-care", smart: "Noah will independently wash hands following 5-step visual sequence after toileting.", baseline: "Completes 2/5 steps", status: "working-towards", evidenceCount: 6, lastEvidence: "Today", reviewDue: "Wk 8", vcLink: "VC2HPEP-B" },
  { id: "g8", studentId: "s4", studentName: "Noah Williams", domain: "Social-Emotional", smart: "Noah will use a sensory regulation chart to identify his state 3 times daily.", baseline: "Adult-led check-ins only", status: "emerging", evidenceCount: 5, lastEvidence: "Yesterday", reviewDue: "Wk 9", vcLink: "VC2PSM-A" },
  { id: "g9", studentId: "s5", studentName: "Zara Patel", domain: "Communication", smart: "Zara will initiate AAC requests for 3 preferred items independently.", baseline: "Requests 1 item with model", status: "working-towards", evidenceCount: 9, lastEvidence: "2 days ago", reviewDue: "Wk 7", vcLink: "VC2EAS-A" },
  { id: "g10", studentId: "s8", studentName: "Hamish Carter", domain: "Social-Emotional", smart: "Hamish will request a break with AAC in 4/5 escalation moments.", baseline: "Verbal protest only", status: "working-towards", evidenceCount: 7, lastEvidence: "Today", reviewDue: "Wk 8", vcLink: "VC2PSM-B" },
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
}

export const evidenceItems: EvidenceItem[] = [
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

export const lessonExamples = [
  { subject: "Mathematics", strand: "Number", topic: "Counting to 20 with 10-frames", duration: "45 min" },
  { subject: "English", strand: "Writing", topic: "Tracing my first name", duration: "30 min" },
  { subject: "Personal & Social", strand: "Self-management", topic: "Using my zones of regulation chart", duration: "30 min" },
];

