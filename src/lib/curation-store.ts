// Leadership curation store — resource submissions/curation + Leadership Templates library.
// Client-side, persisted to localStorage, reactive via useSyncExternalStore.

import { useSyncExternalStore } from "react";

export type ResourceKind = "worksheet" | "video" | "visual" | "song" | "lesson" | "aac";
export type ResourceStatus = "pending" | "approved" | "returned" | "retired";

export interface CuratedResource {
  id: string;
  title: string;
  source: string;
  kind: ResourceKind;
  subject: string;
  levels: string[];
  descriptor?: string; // Victorian Curriculum descriptor
  tags: string[];
  submittedBy: string;
  submittedAt: string;
  status: ResourceStatus;
  reviewedBy?: string;
  reviewNote?: string;
  featured?: boolean;
}

export type TemplateCategory = "IEP" | "Lesson Plan" | "Handover" | "Meeting" | "Compliance";
export type TemplateStatus = "published" | "draft" | "archived";

export interface TemplateVersion {
  version: number;
  note: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LeadershipTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  fileType: "docx" | "xlsx" | "pdf" | "pptx";
  description: string;
  status: TemplateStatus;
  pinned: boolean; // pinned into every class folder
  scope: "All classes" | "Primary (P1–P15)" | "Secondary (S1–S10)";
  owner: string;
  downloads: number;
  versions: TemplateVersion[];
}

export interface CurationState {
  resources: CuratedResource[];
  templates: LeadershipTemplate[];
}

const STORAGE_KEY = "skoolmate.curation.v1";

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

function seed(): CurationState {
  return {
    resources: [
      { id: "cr1", title: "Numbers 0–20 tracing pack", source: "Twinkl", kind: "worksheet", subject: "Maths", levels: ["A", "B"], descriptor: "VC2M1N01", tags: ["numeracy", "fine-motor"], submittedBy: "Aisha Rahman", submittedAt: iso(2), status: "pending" },
      { id: "cr2", title: "Colourful Semantics visuals — Who/Has/What", source: "Boardmaker", kind: "visual", subject: "English", levels: ["C", "D"], descriptor: "VC2E1LY05", tags: ["AAC", "semantics"], submittedBy: "Tom Nguyen", submittedAt: iso(3), status: "pending" },
      { id: "cr3", title: "Steady beat body percussion", source: "YouTube · MusicKids", kind: "video", subject: "Music", levels: ["A", "B"], tags: ["music", "regulation"], submittedBy: "Grace Ellis", submittedAt: iso(5), status: "pending" },
      { id: "cr4", title: "AAC — snack requesting board", source: "PODD", kind: "aac", subject: "English", levels: ["C", "D"], descriptor: "VC2E1LA01", tags: ["AAC", "communication"], submittedBy: "Speech Team", submittedAt: iso(12), status: "approved", reviewedBy: "Leadership", featured: true },
      { id: "cr5", title: "Living / Non-living sort", source: "Topmarks", kind: "lesson", subject: "Science", levels: ["B", "D"], descriptor: "VC2S1U01", tags: ["biology", "sorting"], submittedBy: "Jack Wilson", submittedAt: iso(18), status: "approved", reviewedBy: "Leadership" },
      { id: "cr6", title: "Feelings check-in board", source: "Canva", kind: "visual", subject: "Personal & Social", levels: ["C"], tags: ["SEL", "check-in"], submittedBy: "Wellbeing Team", submittedAt: iso(22), status: "approved", reviewedBy: "Leadership", featured: true },
      { id: "cr7", title: "PE circuit cards (2019 set)", source: "In-house", kind: "worksheet", subject: "PE", levels: ["A", "B"], tags: ["gross-motor"], submittedBy: "Sam Patel", submittedAt: iso(400), status: "retired", reviewedBy: "Leadership", reviewNote: "Superseded by 2026 circuit deck." },
      { id: "cr8", title: "Phonics blending slides", source: "Starfall", kind: "lesson", subject: "English", levels: ["B"], tags: ["phonics"], submittedBy: "Mel Carter", submittedAt: iso(9), status: "returned", reviewedBy: "Leadership", reviewNote: "Please add level-B differentiation and a visual support page." },
    ],
    templates: [
      { id: "tp1", name: "IEP Goal Planner 2026", category: "IEP", fileType: "docx", description: "SMART goal template with success criteria and cross-check mapping.", status: "published", pinned: true, scope: "All classes", owner: "Learning Specialist", downloads: 412, versions: [ { version: 3, note: "Added cross-check criteria table", updatedAt: iso(6), updatedBy: "R. Adeyemi" }, { version: 2, note: "Semester routing note", updatedAt: iso(60), updatedBy: "R. Adeyemi" }, { version: 1, note: "Initial release", updatedAt: iso(200), updatedBy: "Leadership" } ] },
      { id: "tp2", name: "Weekly Lesson Plan (Hook / I DO / WE DO / YOU DO)", category: "Lesson Plan", fileType: "docx", description: "Standard weekly planner aligned to the whole-school timetable.", status: "published", pinned: true, scope: "All classes", owner: "Leading Teacher", downloads: 906, versions: [ { version: 4, note: "Colourful Semantics colour key added", updatedAt: iso(11), updatedBy: "T. Nguyen" }, { version: 3, note: "Timetable sync fields", updatedAt: iso(75), updatedBy: "Leadership" } ] },
      { id: "tp3", name: "Semester Handover Document", category: "Handover", fileType: "docx", description: "End-of-semester handover: goals, medical, behaviour, comms.", status: "published", pinned: true, scope: "All classes", owner: "Assistant Principal", downloads: 288, versions: [ { version: 2, note: "Added NDIS/DIP status section", updatedAt: iso(30), updatedBy: "Leadership" } ] },
      { id: "tp4", name: "SSG Minutes Template", category: "Meeting", fileType: "docx", description: "Student Support Group agenda, attendees and action items.", status: "published", pinned: false, scope: "All classes", owner: "Principal", downloads: 157, versions: [ { version: 1, note: "Initial release", updatedAt: iso(45), updatedBy: "Leadership" } ] },
      { id: "tp5", name: "Excursion Risk Assessment", category: "Compliance", fileType: "xlsx", description: "DE-aligned risk assessment with staffing ratios.", status: "draft", pinned: false, scope: "Secondary (S1–S10)", owner: "Assistant Principal", downloads: 12, versions: [ { version: 1, note: "Draft for leadership review", updatedAt: iso(4), updatedBy: "Leadership" } ] },
      { id: "tp6", name: "Handover Document (2024)", category: "Handover", fileType: "docx", description: "Legacy handover format.", status: "archived", pinned: false, scope: "All classes", owner: "Leadership", downloads: 63, versions: [ { version: 1, note: "Archived", updatedAt: iso(500), updatedBy: "Leadership" } ] },
    ],
  };
}

function load(): CurationState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CurationState;
  } catch { /* ignore */ }
  return seed();
}

let state: CurationState = load();
const listeners = new Set<() => void>();

function set(next: CurationState) {
  state = next;
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;
const serverSnapshot = seed();
const getServerSnapshot = () => serverSnapshot;

export function useCuration(): CurationState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const curationActions = {
  reset() { set(seed()); },

  setResourceStatus(id: string, status: ResourceStatus, note?: string) {
    set({
      ...state,
      resources: state.resources.map((r) =>
        r.id === id ? { ...r, status, reviewNote: note ?? r.reviewNote, reviewedBy: "Leadership" } : r,
      ),
    });
  },

  bulkSetStatus(ids: string[], status: ResourceStatus) {
    const idSet = new Set(ids);
    set({
      ...state,
      resources: state.resources.map((r) => (idSet.has(r.id) ? { ...r, status, reviewedBy: "Leadership" } : r)),
    });
  },

  toggleFeatured(id: string) {
    set({ ...state, resources: state.resources.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)) });
  },

  updateResource(id: string, patch: Partial<CuratedResource>) {
    set({ ...state, resources: state.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  },

  importResources(rows: Array<Pick<CuratedResource, "title" | "source" | "kind" | "subject"> & Partial<CuratedResource>>) {
    const added: CuratedResource[] = rows.map((row, i) => ({
      id: `cr-${Date.now().toString(36)}-${i}`,
      title: row.title,
      source: row.source,
      kind: row.kind,
      subject: row.subject,
      levels: row.levels ?? [],
      descriptor: row.descriptor,
      tags: row.tags ?? [],
      submittedBy: row.submittedBy ?? "Bulk import",
      submittedAt: new Date().toISOString(),
      status: "pending",
    }));
    set({ ...state, resources: [...added, ...state.resources] });
    return added.length;
  },

  // Templates
  addTemplate(input: Omit<LeadershipTemplate, "id" | "downloads" | "versions"> & { note?: string }) {
    const t: LeadershipTemplate = {
      id: `tp-${Date.now().toString(36)}`,
      name: input.name,
      category: input.category,
      fileType: input.fileType,
      description: input.description,
      status: input.status,
      pinned: input.pinned,
      scope: input.scope,
      owner: input.owner,
      downloads: 0,
      versions: [{ version: 1, note: input.note || "Initial release", updatedAt: new Date().toISOString(), updatedBy: "Leadership" }],
    };
    set({ ...state, templates: [t, ...state.templates] });
  },

  publishVersion(id: string, note: string) {
    set({
      ...state,
      templates: state.templates.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "published",
              versions: [
                { version: (t.versions[0]?.version ?? 0) + 1, note: note || "Updated", updatedAt: new Date().toISOString(), updatedBy: "Leadership" },
                ...t.versions,
              ],
            }
          : t,
      ),
    });
  },

  setTemplateStatus(id: string, status: TemplateStatus) {
    set({ ...state, templates: state.templates.map((t) => (t.id === id ? { ...t, status } : t)) });
  },

  togglePinned(id: string) {
    set({ ...state, templates: state.templates.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)) });
  },

  registerDownload(id: string) {
    set({ ...state, templates: state.templates.map((t) => (t.id === id ? { ...t, downloads: t.downloads + 1 } : t)) });
  },
};
