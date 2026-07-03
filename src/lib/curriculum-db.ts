// skoolmate — Master Curriculum Scope & Sequence database.
// Drives the IEP Builder dropdowns: selecting a Goal auto-fills Level,
// Entry Skills, Achievement Standard, Content Description and VC 2.0 code.
// This is the single source of truth teachers pick from — they never type
// these fields manually.

import type { VcLevel, Semester } from "./mock-data";

export type CurriculumSemester = "Semester 1" | "Semester 2" | "Both";

export interface CurriculumSubject {
  id: string;
  label: string;
  strands: string[];
  /** Optional semester lock (e.g. History S1 only, Geography S2 only). */
  semesterLock?: CurriculumSemester;
  color: string; // tailwind text color hint
}

export interface CurriculumRecord {
  id: string;
  subject: string;              // CurriculumSubject.label
  strand: string;
  semester: CurriculumSemester;
  goal: string;                 // short human name shown in dropdown
  level: VcLevel;
  entrySkills: string;
  achievementStandard: string;
  contentDescription: string;
  curriculumCode: string;
  yearLevel: string;            // e.g. "F–2"
}

export const CURRICULUM_SUBJECTS: CurriculumSubject[] = [
  { id: "english",  label: "English",       strands: ["Reading and Viewing", "Speaking and Listening", "Writing"], color: "text-blue-700" },
  { id: "maths",    label: "Mathematics",   strands: ["Number", "Measurement and Space", "Algebra", "Statistics"], color: "text-violet-700" },
  { id: "science",  label: "Science",       strands: ["Science Understanding"], color: "text-emerald-700" },
  { id: "history",  label: "History",       strands: ["Historical Knowledge"], semesterLock: "Semester 1", color: "text-amber-700" },
  { id: "geography",label: "Geography",     strands: ["Geographical Knowledge"], semesterLock: "Semester 2", color: "text-lime-700" },
  { id: "visualarts", label: "Visual Arts", strands: ["Making and Responding"], color: "text-pink-700" },
  { id: "music",    label: "Music",         strands: ["Making and Responding"], color: "text-rose-700" },
  { id: "drama",    label: "Drama",         strands: ["Making and Responding"], color: "text-fuchsia-700" },
  { id: "pe",       label: "Physical Education", strands: ["Movement and Physical Activity"], color: "text-orange-700" },
  { id: "personal", label: "Personal & Social Capability", strands: ["Self-Awareness", "Social Awareness and Management"], color: "text-teal-700" },
  { id: "selfcare", label: "Self-Care",     strands: ["Daily Living"], color: "text-cyan-700" },
  { id: "l2p",      label: "Learn to Play", strands: ["Play Skills"], color: "text-sky-700" },
];

const AS = (s: string) => s; // shortcut

// Curated Scope & Sequence — multiple levels per strand so the dropdown
// automatically resolves Level + Entry Skills when a teacher picks a Goal.
export const CURRICULUM_DB: CurriculumRecord[] = [
  // ---------- English · Reading and Viewing ----------
  { id: "en-rv-a", subject: "English", strand: "Reading and Viewing", semester: "Both", level: "A",
    goal: "Attend to and explore texts read aloud",
    entrySkills: "Turns to the source of a spoken word or story.",
    achievementStandard: AS("Students respond to familiar texts through movement, gaze or vocalisation."),
    contentDescription: "Explore a range of texts read aloud with adult support.",
    curriculumCode: "VC2ELA01", yearLevel: "F–2" },
  { id: "en-rv-b", subject: "English", strand: "Reading and Viewing", semester: "Both", level: "B",
    goal: "Recognise familiar words in shared texts",
    entrySkills: "Identifies own name and 1–2 high-frequency words in familiar contexts.",
    achievementStandard: AS("Students identify familiar words, characters and images in shared texts."),
    contentDescription: "Identify familiar people, objects and words within shared texts.",
    curriculumCode: "VC2ELB01", yearLevel: "F–2" },
  { id: "en-rv-c", subject: "English", strand: "Reading and Viewing", semester: "Both", level: "C",
    goal: "Identify beginning sounds in familiar words",
    entrySkills: "Attends to phonemes; imitates 3–5 initial sounds with a model.",
    achievementStandard: AS("Students identify and produce initial sounds in familiar spoken words."),
    contentDescription: "Segment initial sounds from spoken CVC words.",
    curriculumCode: "VC2EFLY03", yearLevel: "F" },
  { id: "en-rv-d", subject: "English", strand: "Reading and Viewing", semester: "Both", level: "D",
    goal: "Blend and read CVC words",
    entrySkills: "Blends onset + rime with prompts; reads 2–4 CVC words.",
    achievementStandard: AS("Students blend sounds to read simple one-syllable words."),
    contentDescription: "Blend and segment one-syllable words with support.",
    curriculumCode: "VC2EFDLY02", yearLevel: "F" },
  { id: "en-rv-b1", subject: "English", strand: "Reading and Viewing", semester: "Both", level: "B",
    goal: "Identify settings, characters and events in literary texts",
    entrySkills: "Identifies settings, characters and events in literary texts by Aboriginal and Torres Strait Islander authors and illustrators and a range of Australian and world authors.",
    achievementStandard: AS("Students discuss settings and characters in literary texts."),
    contentDescription: "Identify main ideas and characters in read-aloud texts.",
    curriculumCode: "VC2ELB07", yearLevel: "F–2" },

  // ---------- English · Speaking and Listening ----------
  { id: "en-sl-a", subject: "English", strand: "Speaking and Listening", semester: "Both", level: "A",
    goal: "Respond to own name and familiar voices",
    entrySkills: "Orients to name; smiles or vocalises when addressed.",
    achievementStandard: AS("Students respond to familiar voices and interactive routines."),
    contentDescription: "Attend to and respond to a familiar communication partner.",
    curriculumCode: "VC2ELA02", yearLevel: "F–2" },
  { id: "en-sl-c", subject: "English", strand: "Speaking and Listening", semester: "Both", level: "C",
    goal: "Request using phrases or AAC",
    entrySkills: "Uses single word or symbol to request preferred item with prompts.",
    achievementStandard: AS("Students request, reject and comment using words, signs or AAC."),
    contentDescription: "Use short phrases to request, accept or reject an object, action or event.",
    curriculumCode: "VC2EFCLA01", yearLevel: "F" },
  { id: "en-sl-d", subject: "English", strand: "Speaking and Listening", semester: "Both", level: "D",
    goal: "Communicate preferences using 3-word phrases",
    entrySkills: "Uses 2-word phrase with model; indicates preference with prompts.",
    achievementStandard: AS("Students combine 2–3 words to communicate ideas about likes and dislikes."),
    contentDescription: "Use phrases to communicate preferences, likes and dislikes.",
    curriculumCode: "VC2EFDLA02", yearLevel: "F" },

  // ---------- English · Writing ----------
  { id: "en-w-a", subject: "English", strand: "Writing", semester: "Both", level: "A",
    goal: "Explore mark-making tools",
    entrySkills: "Explores crayons and paper with hand-over-hand support.",
    achievementStandard: AS("Students engage with writing tools and make marks."),
    contentDescription: "Use tools to make marks on paper.",
    curriculumCode: "VC2ELA03", yearLevel: "F–2" },
  { id: "en-w-c", subject: "English", strand: "Writing", semester: "Both", level: "C",
    goal: "Trace letters of own name",
    entrySkills: "Traces 2–3 letters with hand-over-hand.",
    achievementStandard: AS("Students form recognisable letters with support."),
    contentDescription: "Trace and copy letters using correct formation.",
    curriculumCode: "VC2EFLY14", yearLevel: "F" },
  { id: "en-w-f", subject: "English", strand: "Writing", semester: "Both", level: "F",
    goal: "Form lower-case and upper-case letters",
    entrySkills: "Forms most letters using learnt letter formations.",
    achievementStandard: AS("Students form most letters legibly using consistent formations."),
    contentDescription: "Form most lower-case and upper-case letters using learnt letter formations.",
    curriculumCode: "VC2EFLY15", yearLevel: "F" },

  // ---------- Mathematics · Number ----------
  { id: "ma-n-b", subject: "Mathematics", strand: "Number", semester: "Both", level: "B",
    goal: "Match objects one-to-one",
    entrySkills: "Places 3 objects in 3 spaces with prompts.",
    achievementStandard: AS("Students match objects one-to-one to 5."),
    contentDescription: "Use one-to-one correspondence with a small collection.",
    curriculumCode: "VC2MFN00", yearLevel: "F" },
  { id: "ma-n-f", subject: "Mathematics", strand: "Number", semester: "Both", level: "F",
    goal: "Name, represent and order numbers 0–20",
    entrySkills: "Names 0–10 with cues; orders 0–5 independently.",
    achievementStandard: AS("Students name, represent and order numbers to 20."),
    contentDescription: "Name, represent and order numbers, including zero, to at least 20 using physical and virtual materials and numerals.",
    curriculumCode: "VC2MFN01", yearLevel: "F" },
  { id: "ma-n-1", subject: "Mathematics", strand: "Number", semester: "Both", level: "1",
    goal: "Count to 120 by ones",
    entrySkills: "Rote counts to 30; matches numeral to quantity to 20.",
    achievementStandard: AS("Students count and order numbers to at least 120."),
    contentDescription: "Recognise, represent and order numbers to at least 120.",
    curriculumCode: "VC2M1N01", yearLevel: "1" },

  // ---------- Mathematics · Algebra (Semester 2 only) ----------
  { id: "ma-a-c", subject: "Mathematics", strand: "Algebra", semester: "Semester 2", level: "C",
    goal: "Copy and continue simple patterns",
    entrySkills: "Copies AB pattern with 2 colours after modelling.",
    achievementStandard: AS("Students copy and continue simple repeating patterns."),
    contentDescription: "Follow and describe simple repeating patterns using objects.",
    curriculumCode: "VC2MFA01", yearLevel: "F" },
  { id: "ma-a-f", subject: "Mathematics", strand: "Algebra", semester: "Semester 2", level: "F",
    goal: "Sort objects by attribute",
    entrySkills: "Sorts by 1 attribute (colour or shape) with support.",
    achievementStandard: AS("Students sort and describe collections by attribute."),
    contentDescription: "Sort and classify familiar objects and explain the basis for these classifications.",
    curriculumCode: "VC2MFA02", yearLevel: "F" },

  // ---------- Mathematics · Statistics (Semester 2 only) ----------
  { id: "ma-st-f", subject: "Mathematics", strand: "Statistics", semester: "Semester 2", level: "F",
    goal: "Answer yes/no questions using pictures",
    entrySkills: "Points to picture in response to yes/no question with cue.",
    achievementStandard: AS("Students respond to yes/no questions using picture supports."),
    contentDescription: "Collect, sort and compare data represented by objects and pictures.",
    curriculumCode: "VC2MFST01", yearLevel: "F" },

  // ---------- Mathematics · Measurement and Space (Semester 1 only) ----------
  { id: "ma-ms-a", subject: "Mathematics", strand: "Measurement and Space", semester: "Semester 1", level: "A",
    goal: "Compare length of two objects",
    entrySkills: "Compares two objects with prompts (longer / shorter).",
    achievementStandard: AS("Students compare and describe the length of two objects."),
    contentDescription: "Compare directly and indirectly the length of two objects.",
    curriculumCode: "VC2MAM01", yearLevel: "F" },
  { id: "ma-ms-d", subject: "Mathematics", strand: "Measurement and Space", semester: "Semester 1", level: "D",
    goal: "Sequence familiar routines",
    entrySkills: "Orders 3 steps with visual supports and a prompt.",
    achievementStandard: AS("Students sequence familiar events using ordinal language."),
    contentDescription: "Sequence familiar routines and events using simple ordinal language.",
    curriculumCode: "VC2MFDM02", yearLevel: "F" },

  // ---------- Science ----------
  { id: "sc-b", subject: "Science", strand: "Science Understanding", semester: "Both", level: "B",
    goal: "Observe living things and describe simple features",
    entrySkills: "Names 1–2 features of a living thing with prompts.",
    achievementStandard: AS("Students describe features of living things they observe."),
    contentDescription: "Explore the needs and features of living things.",
    curriculumCode: "VC2SB01", yearLevel: "F–2" },
  { id: "sc-f", subject: "Science", strand: "Science Understanding", semester: "Both", level: "F",
    goal: "Sort living and non-living things",
    entrySkills: "Sorts 4 picture cards into living / non-living with cues.",
    achievementStandard: AS("Students sort objects as living or non-living and describe their needs."),
    contentDescription: "Explore the needs of living things and identify what is living and non-living.",
    curriculumCode: "VC2SFU01", yearLevel: "F" },

  // ---------- History (Semester 1 only) ----------
  { id: "hi-f", subject: "History", strand: "Historical Knowledge", semester: "Semester 1", level: "F",
    goal: "Sequence familiar events from personal history",
    entrySkills: "Sequences 2 personal events with prompts.",
    achievementStandard: AS("Students sequence events from their own history using now / then / later."),
    contentDescription: "Sequence familiar events from personal history using 'now, then, later'.",
    curriculumCode: "VC2HFHK01", yearLevel: "F" },
  { id: "hi-c", subject: "History", strand: "Historical Knowledge", semester: "Semester 1", level: "C",
    goal: "Recognise significant people in own past",
    entrySkills: "Points to photos of family members with cues.",
    achievementStandard: AS("Students recognise significant people and events in their own past."),
    contentDescription: "Recognise significant people and events in my own past.",
    curriculumCode: "VC2HHFK01", yearLevel: "F" },

  // ---------- Geography (Semester 2 only) ----------
  { id: "ge-f", subject: "Geography", strand: "Geographical Knowledge", semester: "Semester 2", level: "F",
    goal: "Identify places I belong to",
    entrySkills: "Matches 2 place photos to labels with prompts.",
    achievementStandard: AS("Students identify familiar places and how they belong to them."),
    contentDescription: "Identify the places I belong to — home, classroom, school.",
    curriculumCode: "VC2HGFK01", yearLevel: "F" },
  { id: "ge-c", subject: "Geography", strand: "Geographical Knowledge", semester: "Semester 2", level: "C",
    goal: "Describe features of familiar places using picture cues",
    entrySkills: "Points to features (door, window, tree) in a photo of the school with a cue.",
    achievementStandard: AS("Students describe features of places using pictures and simple labels."),
    contentDescription: "Describe features of familiar places using pictures.",
    curriculumCode: "VC2HGFK02", yearLevel: "F" },

  // ---------- Visual Arts ----------
  { id: "va-b", subject: "Visual Arts", strand: "Making and Responding", semester: "Both", level: "B",
    goal: "Explore colour and line in artwork",
    entrySkills: "Makes marks using 2 colours with prompts.",
    achievementStandard: AS("Students make artworks exploring colour and line."),
    contentDescription: "Explore colour and line to make a personal artwork.",
    curriculumCode: "VC2AVA01", yearLevel: "F–2" },

  // ---------- Music ----------
  { id: "mu-a", subject: "Music", strand: "Making and Responding", semester: "Both", level: "A",
    goal: "Respond to steady beat with body percussion",
    entrySkills: "Attends to beat with modelling.",
    achievementStandard: AS("Students respond to a steady beat using body percussion or instruments."),
    contentDescription: "Respond to steady beat using body percussion or instruments.",
    curriculumCode: "VC2AMU01", yearLevel: "F–2" },
  { id: "mu-c", subject: "Music", strand: "Making and Responding", semester: "Both", level: "C",
    goal: "Tap a steady beat on an instrument",
    entrySkills: "Taps 4 beats with cue on hand drum.",
    achievementStandard: AS("Students maintain a steady beat on an instrument for short phrases."),
    contentDescription: "Respond to music using voice, body and instruments.",
    curriculumCode: "VC2AMUFE01", yearLevel: "F" },

  // ---------- Drama ----------
  { id: "dr-b", subject: "Drama", strand: "Making and Responding", semester: "Both", level: "B",
    goal: "Take on a simple role using voice and movement",
    entrySkills: "Adopts role for short moments with cues.",
    achievementStandard: AS("Students take on a role for a short drama activity."),
    contentDescription: "Take on a simple role using voice and movement.",
    curriculumCode: "VC2ADR01", yearLevel: "F–2" },
  { id: "dr-c", subject: "Drama", strand: "Making and Responding", semester: "Both", level: "C",
    goal: "Use props to take on a role",
    entrySkills: "Holds prop for 30s and copies 1 action with model.",
    achievementStandard: AS("Students use voice, movement and props to take on a role."),
    contentDescription: "Take on a role using voice, movement and props.",
    curriculumCode: "VC2ADRFE01", yearLevel: "F" },

  // ---------- PE ----------
  { id: "pe-a", subject: "Physical Education", strand: "Movement and Physical Activity", semester: "Both", level: "A",
    goal: "Perform fundamental movement skills",
    entrySkills: "Attempts run / jump / balance with adult support.",
    achievementStandard: AS("Students perform 2 of 3 fundamental skills with cues."),
    contentDescription: "Perform fundamental movement skills — run, jump, balance.",
    curriculumCode: "VC2HPMV01", yearLevel: "F–2" },
  { id: "pe-d", subject: "Physical Education", strand: "Movement and Physical Activity", semester: "Both", level: "D",
    goal: "Catch a large soft ball from 1m",
    entrySkills: "Traps ball against chest occasionally.",
    achievementStandard: AS("Students catch a large ball with growing control."),
    contentDescription: "Perform fundamental movement skills with growing control.",
    curriculumCode: "VC2HPFM02", yearLevel: "F–2" },

  // ---------- Personal & Social Capability ----------
  { id: "ps-c", subject: "Personal & Social Capability", strand: "Self-Awareness", semester: "Both", level: "C",
    goal: "Name basic emotions in self and others",
    entrySkills: "Names 2–3 emotions from picture cards.",
    achievementStandard: AS("Students name basic emotions and link them to a cause."),
    contentDescription: "Recognise and name basic emotions in self and others.",
    curriculumCode: "VC2PSC01", yearLevel: "F–2" },
  { id: "ps-d", subject: "Personal & Social Capability", strand: "Social Awareness and Management", semester: "Both", level: "D",
    goal: "Use a regulation chart to label state",
    entrySkills: "Points to state on chart with cue.",
    achievementStandard: AS("Students use a chart to self-identify their emotional state."),
    contentDescription: "Use a sensory regulation chart to label current state.",
    curriculumCode: "VC2PSC04", yearLevel: "F–2" },

  // ---------- Self-Care ----------
  { id: "sc-c-a", subject: "Self-Care", strand: "Daily Living", semester: "Both", level: "A",
    goal: "Participate in dressing routines",
    entrySkills: "Assists with removing shoes with hand-over-hand.",
    achievementStandard: AS("Students participate in dressing routines with adult support."),
    contentDescription: "Participate in dressing tasks such as removing shoes and jacket.",
    curriculumCode: "SC-DL-A01", yearLevel: "F–2" },
  { id: "sc-c-d", subject: "Self-Care", strand: "Daily Living", semester: "Both", level: "D",
    goal: "Sequence 5-step handwashing routine",
    entrySkills: "Completes 2 of 5 steps with visual prompts.",
    achievementStandard: AS("Students complete handwashing routines with visual supports."),
    contentDescription: "Independently sequence the 5-step handwashing routine.",
    curriculumCode: "SC-DL-D01", yearLevel: "F–2" },

  // ---------- Learn to Play ----------
  { id: "l2p-a", subject: "Learn to Play", strand: "Play Skills", semester: "Both", level: "A",
    goal: "Turn-take with an adult across 3 exchanges",
    entrySkills: "Tolerates shared object with prompts.",
    achievementStandard: AS("Students turn-take 3+ exchanges with an adult."),
    contentDescription: "Turn-take with an adult across 3 exchanges.",
    curriculumCode: "L2P-TT-A01", yearLevel: "F–2" },
  { id: "l2p-d", subject: "Learn to Play", strand: "Play Skills", semester: "Both", level: "D",
    goal: "Follow a 3-step play routine",
    entrySkills: "Completes 1 step with hand-over-hand support.",
    achievementStandard: AS("Students follow a 3-step play sequence with a prompt."),
    contentDescription: "Follow a 3-step play routine (choose, engage, tidy) with support.",
    curriculumCode: "L2P-PS-D01", yearLevel: "F–2" },
];

export function recordsFor(subject: string, strand: string, semester: Semester) {
  const sem: CurriculumSemester = semester.startsWith("Semester 1") ? "Semester 1" : "Semester 2";
  return CURRICULUM_DB.filter(
    (r) => r.subject === subject && r.strand === strand && (r.semester === "Both" || r.semester === sem),
  );
}

export function findRecord(id: string) {
  return CURRICULUM_DB.find((r) => r.id === id);
}

/** Semester-aware subject list — hides History in S2, Geography in S1, Self-Care and Music from the IEP matrix. */
export function visibleSubjects(semester: Semester): CurriculumSubject[] {
  const sem: CurriculumSemester = semester.startsWith("Semester 1") ? "Semester 1" : "Semester 2";
  return CURRICULUM_SUBJECTS.filter(
    (s) => s.id !== "selfcare" && s.id !== "music" && (!s.semesterLock || s.semesterLock === sem),
  );
}

/** Per-subject strand rotation by semester. */
const STRAND_SEMESTER_LOCK: Record<string, Record<string, CurriculumSemester>> = {
  Mathematics: {
    "Number": "Both",
    "Measurement and Space": "Semester 1",
    "Algebra": "Semester 2",
    "Statistics": "Semester 2",
  },
};

/** Strands to show for a subject in the given semester (honours rotation locks). */
export function strandsForSemester(subject: CurriculumSubject, semester: Semester): string[] {
  const sem: CurriculumSemester = semester.startsWith("Semester 1") ? "Semester 1" : "Semester 2";
  const locks = STRAND_SEMESTER_LOCK[subject.label];
  if (!locks) return subject.strands;
  return subject.strands.filter((s) => {
    const lock = locks[s];
    return !lock || lock === "Both" || lock === sem;
  });
}

export const LEVEL_TONE: Record<VcLevel, string> = {
  A: "bg-rose-100 text-rose-700 border-rose-200",
  B: "bg-orange-100 text-orange-700 border-orange-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  D: "bg-yellow-100 text-yellow-800 border-yellow-200",
  F: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "1": "bg-sky-100 text-sky-700 border-sky-200",
  "2": "bg-indigo-100 text-indigo-700 border-indigo-200",
};
