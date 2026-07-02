// Document Centre — in-memory folder tree for the Admin cloud-drive workspace.
// Structure mirrors the school's file plan. IEPs, Weekly Lesson Plans and
// Handover Documents auto-expand P1–P15 + S1–S10, then Semester 1 & 2,
// each seeded with pinned Leadership Templates + Teacher Uploads.

export type DocKind = "folder" | "file";
export type DocIcon =
  | "iep"
  | "lesson"
  | "handover"
  | "report"
  | "policy"
  | "pd"
  | "form"
  | "medical"
  | "behaviour"
  | "wellbeing"
  | "curriculum"
  | "assessment"
  | "compliance"
  | "resource"
  | "staff"
  | "communication"
  | "governance"
  | "incident"
  | "archive"
  | "class"
  | "semester"
  | "pinned"
  | "uploads"
  | "doc"
  | "pdf"
  | "image"
  | "sheet"
  | "slides";

export interface DocNode {
  id: string;
  name: string;
  kind: DocKind;
  icon: DocIcon;
  pinned?: boolean; // Leadership Templates are pinned (teacher-undeletable)
  leadershipOnly?: boolean;
  description?: string;
  updatedAt?: string;
  sizeKb?: number;
  children?: DocNode[];
}

const PRIMARY_CLASSES = Array.from({ length: 15 }, (_, i) => `P${i + 1}`);
const SECONDARY_CLASSES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

const SEMESTERS = ["Semester 1 · 2026", "Semester 2 · 2026"];

function classFolder(parentId: string, cls: string, templateSeed: DocNode[]): DocNode {
  return {
    id: `${parentId}/${cls}`,
    name: `Class ${cls}`,
    kind: "folder",
    icon: "class",
    children: SEMESTERS.map((sem) => ({
      id: `${parentId}/${cls}/${sem}`,
      name: sem,
      kind: "folder",
      icon: "semester",
      children: [
        {
          id: `${parentId}/${cls}/${sem}/leadership`,
          name: "Leadership Templates",
          kind: "folder",
          icon: "pinned",
          pinned: true,
          leadershipOnly: true,
          description: "Read-only templates from Leadership. Teachers cannot delete or move.",
          children: templateSeed.map((t) => ({ ...t, id: `${parentId}/${cls}/${sem}/leadership/${t.id}` })),
        },
        {
          id: `${parentId}/${cls}/${sem}/uploads`,
          name: "Teacher Uploads",
          kind: "folder",
          icon: "uploads",
          description: "Teacher's own uploads for this class & semester.",
          children: [],
        },
      ],
    })),
  };
}

function buildClassTree(parentId: string, templates: DocNode[]): DocNode[] {
  return [
    {
      id: `${parentId}/primary`,
      name: "Primary (P1–P15)",
      kind: "folder",
      icon: "class",
      children: PRIMARY_CLASSES.map((c) => classFolder(`${parentId}/primary`, c, templates)),
    },
    {
      id: `${parentId}/secondary`,
      name: "Secondary (S1–S10)",
      kind: "folder",
      icon: "class",
      children: SECONDARY_CLASSES.map((c) => classFolder(`${parentId}/secondary`, c, templates)),
    },
  ];
}

const iepTemplates: DocNode[] = [
  { id: "tpl-iep", name: "IEP_Template_2026_v3.docx", kind: "file", icon: "doc", pinned: true, leadershipOnly: true, sizeKb: 148, updatedAt: "2026-01-14" },
  { id: "tpl-cross", name: "Cross_Check_Descriptors.pdf", kind: "file", icon: "pdf", pinned: true, leadershipOnly: true, sizeKb: 92, updatedAt: "2026-01-14" },
  { id: "tpl-signoff", name: "Parent_Sign_Off_Form.pdf", kind: "file", icon: "pdf", pinned: true, leadershipOnly: true, sizeKb: 58, updatedAt: "2026-01-14" },
];
const lessonTemplates: DocNode[] = [
  { id: "tpl-plan", name: "Weekly_Plan_Template.docx", kind: "file", icon: "doc", pinned: true, leadershipOnly: true, sizeKb: 74, updatedAt: "2026-01-20" },
  { id: "tpl-vc", name: "VC2.0_Alignment_Checklist.pdf", kind: "file", icon: "pdf", pinned: true, leadershipOnly: true, sizeKb: 112, updatedAt: "2026-01-20" },
];
const handoverTemplates: DocNode[] = [
  { id: "tpl-ho", name: "Handover_Template_v3.docx", kind: "file", icon: "doc", pinned: true, leadershipOnly: true, sizeKb: 96, updatedAt: "2026-02-01" },
  { id: "tpl-med", name: "Medical_Alert_Handover.pdf", kind: "file", icon: "pdf", pinned: true, leadershipOnly: true, sizeKb: 41, updatedAt: "2026-02-01" },
];

export const documentCentreTree: DocNode[] = [
  {
    id: "ieps", name: "IEPs", kind: "folder", icon: "iep",
    description: "Individual Education Plans by class and semester.",
    children: buildClassTree("ieps", iepTemplates),
  },
  {
    id: "lesson-plans", name: "Weekly Lesson Plans", kind: "folder", icon: "lesson",
    description: "Weekly plans by class and semester.",
    children: buildClassTree("lesson-plans", lessonTemplates),
  },
  {
    id: "handover", name: "Handover Documents", kind: "folder", icon: "handover",
    description: "End-of-semester handover for the incoming teaching team.",
    children: buildClassTree("handover", handoverTemplates),
  },
  {
    id: "reports", name: "Reports", kind: "folder", icon: "report",
    description: "Semester reports, progress summaries and data extracts.",
    children: [
      { id: "reports/semester", name: "Semester Reports", kind: "folder", icon: "semester", children: [] },
      { id: "reports/behaviour", name: "Behaviour Reports", kind: "folder", icon: "behaviour", children: [] },
      { id: "reports/nccd", name: "NCCD Evidence Packs", kind: "folder", icon: "compliance", children: [] },
    ],
  },
  {
    id: "policies", name: "Policies & Procedures", kind: "folder", icon: "policy",
    children: [
      { id: "policies/child-safe", name: "Child Safe Standards", kind: "folder", icon: "policy", children: [
        { id: "policies/child-safe/f1", name: "Victorian_Child_Safe_Standards.pdf", kind: "file", icon: "pdf", sizeKb: 220 },
      ]},
      { id: "policies/behaviour", name: "Behaviour Management", kind: "folder", icon: "behaviour", children: [] },
      { id: "policies/medical", name: "Medical & First Aid", kind: "folder", icon: "medical", children: [] },
      { id: "policies/emergency", name: "Emergency Management Plan", kind: "folder", icon: "compliance", children: [] },
    ],
  },
  {
    id: "pd", name: "Professional Development", kind: "folder", icon: "pd",
    children: [
      { id: "pd/vit", name: "VIT Registration & PD Logs", kind: "folder", icon: "pd", children: [] },
      { id: "pd/inhouse", name: "In-House PD Sessions", kind: "folder", icon: "pd", children: [] },
    ],
  },
  {
    id: "forms", name: "Forms & Templates", kind: "folder", icon: "form",
    children: [
      { id: "forms/consent", name: "Consent Forms", kind: "folder", icon: "form", children: [] },
      { id: "forms/excursion", name: "Excursion & Risk Assessments", kind: "folder", icon: "form", children: [] },
    ],
  },
  { id: "medical", name: "Medical Plans", kind: "folder", icon: "medical", children: [] },
  { id: "behaviour", name: "Behaviour Support Plans", kind: "folder", icon: "behaviour", children: [] },
  { id: "wellbeing", name: "Wellbeing & Safety", kind: "folder", icon: "wellbeing", children: [] },
  { id: "curriculum", name: "Curriculum & Scope and Sequence", kind: "folder", icon: "curriculum", children: [
    { id: "curriculum/vc2", name: "Victorian Curriculum 2.0", kind: "folder", icon: "curriculum", children: [] },
    { id: "curriculum/ss", name: "Scope & Sequence 2026", kind: "folder", icon: "curriculum", children: [] },
  ]},
  { id: "assessment", name: "Assessment Data", kind: "folder", icon: "assessment", children: [] },
  { id: "compliance", name: "Compliance & Audits", kind: "folder", icon: "compliance", children: [] },
  { id: "resources", name: "Teaching Resources", kind: "folder", icon: "resource", children: [] },
  { id: "staff", name: "Staff Documents", kind: "folder", icon: "staff", children: [] },
  { id: "communication", name: "Parent & Community Communication", kind: "folder", icon: "communication", children: [] },
  { id: "governance", name: "Governance & Council", kind: "folder", icon: "governance", children: [] },
  { id: "incidents", name: "Incident Reports", kind: "folder", icon: "incident", children: [] },
  { id: "leadership-templates", name: "Leadership Templates (Master)", kind: "folder", icon: "pinned", leadershipOnly: true, children: [
    ...iepTemplates, ...lessonTemplates, ...handoverTemplates,
  ]},
  { id: "archive", name: "Archive", kind: "folder", icon: "archive", children: [] },
];

export function findNode(id: string, nodes: DocNode[] = documentCentreTree): DocNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(id, n.children);
      if (found) return found;
    }
  }
  return null;
}

export function nodePath(id: string): DocNode[] {
  const path: DocNode[] = [];
  const walk = (nodes: DocNode[], trail: DocNode[]): boolean => {
    for (const n of nodes) {
      const t = [...trail, n];
      if (n.id === id) { path.push(...t); return true; }
      if (n.children && walk(n.children, t)) return true;
    }
    return false;
  };
  walk(documentCentreTree, []);
  return path;
}

export function searchNodes(query: string): DocNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: DocNode[] = [];
  const walk = (nodes: DocNode[]) => {
    for (const n of nodes) {
      if (n.name.toLowerCase().includes(q)) out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(documentCentreTree);
  return out.slice(0, 50);
}

export const documentCentreStats = {
  topFolders: documentCentreTree.length,
  classes: ALL_CLASSES.length,
  autoSeeded: 3 * ALL_CLASSES.length * SEMESTERS.length * 2, // 3 sections × 25 classes × 2 sem × 2 subfolders
};
