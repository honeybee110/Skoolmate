// SchoolMate subject palette — single source of truth for colouring
// timetable blocks, lesson chips, calendar cells, and subject badges.
// Pair the solid `hex`/token with `bg` (soft 10–15% tint) and `border` (left accent).

export type SubjectKey =
  | "startofday"
  | "literacy"
  | "maths"
  | "science"
  | "history"
  | "geography"
  | "specialist"
  | "music"
  | "personalsocial"
  | "selfcare"
  | "assembly"
  | "therapy"
  | "break";

export interface SubjectTone {
  label: string;
  /** Soft tinted surface + left border + readable ink. */
  cell: string;
  /** Pill / chip classes. */
  chip: string;
  /** Dot / swatch background. */
  swatch: string;
}

const tone = (color: string, label: string): SubjectTone => ({
  label,
  cell: `bg-[color:var(--subj-${color})]/12 border-l-[color:var(--subj-${color})] text-foreground`,
  chip: `bg-[color:var(--subj-${color})]/15 text-foreground ring-1 ring-inset ring-[color:var(--subj-${color})]/30`,
  swatch: `bg-[color:var(--subj-${color})]`,
});

export const subjectTones: Record<SubjectKey, SubjectTone> = {
  startofday: tone("startofday", "Start of Day"),
  literacy: tone("literacy", "Literacy"),
  maths: tone("maths", "Maths"),
  science: tone("science", "Science"),
  history: tone("history", "History"),
  geography: tone("geography", "Geography"),
  specialist: tone("specialist", "Specialist"),
  music: tone("music", "Music"),
  personalsocial: tone("personalsocial", "Personal & Social"),
  selfcare: tone("selfcare", "Self-Care"),
  assembly: tone("assembly", "Assembly"),
  therapy: {
    label: "Therapy",
    cell: "bg-[color:var(--subj-selfcare)]/12 border-l-[color:var(--subj-selfcare)] text-foreground",
    chip: "bg-[color:var(--subj-selfcare)]/15 text-foreground ring-1 ring-inset ring-[color:var(--subj-selfcare)]/30",
    swatch: "bg-[color:var(--subj-selfcare)]",
  },
  break: {
    label: "Break",
    cell: "bg-muted/50 border-l-muted-foreground/30 text-muted-foreground",
    chip: "bg-muted text-muted-foreground",
    swatch: "bg-muted-foreground/40",
  },
};

/** Infer a subject tone from a session title or a coarse timetable "type" tag. */
export function subjectFromTitle(title: string, fallback?: string): SubjectTone {
  const t = title.toLowerCase();
  if (/(start of day|start the day|phonics|morning circle|greeting)/.test(t))
    return subjectTones.startofday;
  if (/(assembly)/.test(t)) return subjectTones.assembly;
  if (/(self-?care|toileting|hygiene|self help)/.test(t)) return subjectTones.selfcare;
  if (/(music)/.test(t)) return subjectTones.music;
  if (/(personal|social|wellbeing|rrr|respectful)/.test(t)) return subjectTones.personalsocial;
  if (/(pe|physical|sport|visual arts|drama|learn to play|art)/.test(t))
    return subjectTones.specialist;
  if (/(geography|geog)/.test(t)) return subjectTones.geography;
  if (/(history|hass)/.test(t)) return subjectTones.history;
  if (/(science)/.test(t)) return subjectTones.science;
  if (/(math|numeracy|number)/.test(t)) return subjectTones.maths;
  if (/(literacy|reading|writing|spelling|english)/.test(t)) return subjectTones.literacy;
  if (/(therapy|ot|slp|physio|speech)/.test(t)) return subjectTones.therapy;
  if (/(break|lunch|recess|morning tea|play)/.test(t)) return subjectTones.break;
  if (fallback && fallback in subjectTones) return subjectTones[fallback as SubjectKey];
  return subjectTones.literacy;
}
