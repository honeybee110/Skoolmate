// School Scope & Sequence — Semester 1 seed. Used by the IEP goal builder
// to draft SMART goals aligned to Victorian Curriculum 2.0 descriptors.

import type { IepDomain, LearningArea, VcLevel } from "./mock-data";

export interface ScopeItem {
  id: string;
  domain: IepDomain;
  learningArea: LearningArea;
  level: VcLevel;
  vcLink: string;
  intention: string;
  descriptors: { developing: string; workingTowards: string; achieved: string };
}

export const scopeSequence: ScopeItem[] = [
  {
    id: "ss1", domain: "Maths", learningArea: "Maths · Number", level: "F", vcLink: "VC2MFN01",
    intention: "Name, represent and order numbers 0–20 using materials and numerals.",
    descriptors: {
      developing: "Names numerals 0–10 with cues; represents with support",
      workingTowards: "Names 0–20 with occasional prompts; orders using a chart",
      achieved: "Names, represents and orders 0–20 independently",
    },
  },
  {
    id: "ss2", domain: "Maths", learningArea: "Maths · Measurement", level: "A", vcLink: "VC2MAM01",
    intention: "Compare length and capacity of two objects using direct comparison.",
    descriptors: {
      developing: "Explores objects; needs modelling to compare",
      workingTowards: "Compares two objects with prompts (longer/shorter)",
      achieved: "Independently compares two objects using correct language",
    },
  },
  {
    id: "ss3", domain: "English", learningArea: "English · Phonics", level: "F", vcLink: "VC2EFLY03",
    intention: "Identify and produce initial sounds in familiar spoken words.",
    descriptors: {
      developing: "Attends to sounds; imitates with model",
      workingTowards: "Identifies initial sounds in 3–5 familiar words",
      achieved: "Identifies and produces initial sounds across new words",
    },
  },
  {
    id: "ss4", domain: "English", learningArea: "English · Speaking & Listening", level: "D", vcLink: "VC2EFDLA02",
    intention: "Use phrases to communicate preferences, likes and dislikes.",
    descriptors: {
      developing: "Uses single words with prompts",
      workingTowards: "Uses 2-word phrase with model",
      achieved: "Uses 3-word phrase independently across the day",
    },
  },
  {
    id: "ss5", domain: "Personal & Social", learningArea: "Personal & Social", level: "C", vcLink: "VC2PSC01",
    intention: "Recognise and name basic emotions in self and others.",
    descriptors: {
      developing: "Points to emotion card with adult modelling",
      workingTowards: "Names 2–3 emotions from picture cards",
      achieved: "Names emotions and links to a cause in context",
    },
  },
  {
    id: "ss6", domain: "Science", learningArea: "Science", level: "B", vcLink: "VC2SB01",
    intention: "Observe living things and describe simple features.",
    descriptors: {
      developing: "Attends to living things with support",
      workingTowards: "Names 1–2 features with prompts",
      achieved: "Describes features and sorts living/non-living",
    },
  },
  {
    id: "ss7", domain: "History", learningArea: "Humanities · History", level: "F", vcLink: "VC2HFHK01",
    intention: "Sequence familiar events from personal history (now, then, later).",
    descriptors: {
      developing: "Identifies photos of past events with support",
      workingTowards: "Sequences 2 events with prompts",
      achieved: "Sequences 3+ events using now/then/later language",
    },
  },
  {
    id: "ss8", domain: "PE", learningArea: "PE", level: "A", vcLink: "VC2HPMV01",
    intention: "Perform fundamental movement skills — run, jump, balance.",
    descriptors: {
      developing: "Attempts skills with adult support",
      workingTowards: "Performs 2 of 3 skills with cues",
      achieved: "Independently performs all three across settings",
    },
  },
  {
    id: "ss9", domain: "Visual Arts", learningArea: "Visual Arts", level: "B", vcLink: "VC2AVA01",
    intention: "Explore colour and line to make a personal artwork.",
    descriptors: {
      developing: "Explores tools with hand-over-hand support",
      workingTowards: "Makes marks using 2 colours with prompts",
      achieved: "Independently combines colour and line in artwork",
    },
  },
  {
    id: "ss10", domain: "Music", learningArea: "Music", level: "A", vcLink: "VC2AMU01",
    intention: "Respond to steady beat using body percussion or instruments.",
    descriptors: {
      developing: "Attends to beat with modelling",
      workingTowards: "Keeps beat for short phrases with cues",
      achieved: "Keeps steady beat across full song independently",
    },
  },
  {
    id: "ss11", domain: "Drama", learningArea: "Drama", level: "B", vcLink: "VC2ADR01",
    intention: "Take on a simple role using voice and movement.",
    descriptors: {
      developing: "Watches and imitates with support",
      workingTowards: "Adopts role for short moments with cues",
      achieved: "Sustains a role across a short drama activity",
    },
  },
  {
    id: "ss12", domain: "Learn to Play", learningArea: "Learn to Play", level: "A", vcLink: "L2P-TT",
    intention: "Turn-take with an adult across 3 exchanges.",
    descriptors: {
      developing: "Tolerates shared object with prompts",
      workingTowards: "Turn-takes for 2 exchanges with cues",
      achieved: "Turn-takes 3+ exchanges independently",
    },
  },
];
