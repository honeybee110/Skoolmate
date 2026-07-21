// Shared constants + types for the SSG Minutes feature.

export const PRIMARY_CLASSES = Array.from({ length: 15 }, (_, i) => `P${i + 1}`);
export const SECONDARY_CLASSES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
export const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

export const SEMESTERS = ["Semester 1", "Semester 2"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const MEETING_TYPES = [
  "SSG",
  "DIP Profile Meeting",
  "NDIS Review",
  "Other",
] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export const ATTENDEE_ROLES = [
  "Parent / Carer",
  "Teacher",
  "Education Support (ES)",
  "DIP Coordinator",
  "Facilitator",
  "Speech Pathologist",
  "Occupational Therapist",
  "External / Support Coordinator",
  "Other",
] as const;
export type AttendeeRole = (typeof ATTENDEE_ROLES)[number];

export type Attendee = { name: string; role: AttendeeRole | "" };
export type ActionItem = { action: string; owner: string; due_date: string };
export type MinuteStatus = "Draft" | "Submitted";

export type SSGMinute = {
  id: string;
  student_name: string;
  class_level: string;
  semester: Semester;
  meeting_date: string;
  meeting_type: MeetingType;
  attendees: Attendee[];
  apologies: string | null;
  discussion_summary: string | null;
  action_items: ActionItem[];
  next_meeting_date: string | null;
  status: MinuteStatus;
  submitted_by: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isPrimary(classCode: string) {
  return PRIMARY_CLASSES.includes(classCode);
}
