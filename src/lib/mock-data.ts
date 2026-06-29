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

export const todayTimetable: TimetableBlock[] = [
  { start: "9:00", end: "9:30", title: "Morning Circle", room: "Rosella", type: "literacy" },
  { start: "9:30", end: "10:30", title: "Literacy — Reading & Viewing", room: "Rosella", type: "literacy" },
  { start: "10:30", end: "11:00", title: "Recess", room: "Yard A", type: "break" },
  { start: "11:00", end: "12:00", title: "Numeracy — Measurement", room: "Rosella", type: "numeracy" },
  { start: "12:00", end: "12:30", title: "Speech Therapy (Mia, Jack)", room: "OT Room 2", type: "therapy" },
  { start: "12:30", end: "1:15", title: "Lunch", room: "Yard A", type: "break" },
  { start: "1:15", end: "2:15", title: "Visual Arts", room: "Art Studio", type: "specialist" },
  { start: "2:15", end: "3:15", title: "Learn to Play", room: "Rosella", type: "literacy" },
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
  { id: "a1", kind: "medication", title: "Noah Williams — ADHD meds at 11:00", due: "in 35 min", urgent: true },
  { id: "a2", kind: "behaviour", title: "Jack O'Brien — ABC incident form", due: "Today", urgent: true, studentId: "s2" },
  { id: "a3", kind: "lesson", title: "Submit Friday Numeracy lesson plan", due: "Today", studentId: undefined },
  { id: "a4", kind: "iep", title: "Aaliyah Tahir — IEP review meeting prep", due: "Tomorrow" },
  { id: "a5", kind: "report", title: "Term 2 IEP reports draft (8 students)", due: "Fri 4 Jul" },
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
