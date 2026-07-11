Two-phase repair. Each phase is scoped to keep the change reviewable and reversible.

## Phase 1 — Lesson Planner module

Bring back a real `/lessons/planner` surface so teachers can compose, save and submit weekly plans (currently `/lessons` just forwards to the Bank).

### Pages / routes
- `src/routes/lessons.planner.tsx` — new page (list + editor).
- `src/routes/lessons.index.tsx` — flip the fallback to `/lessons/planner` (Planner becomes the module landing).
- Sidebar: expose "Lesson Planner" and "Lesson Bank" as sibling teacher links.

### Planner UI (preserves existing branding, cards, buttons, Tailwind tokens)
- Left rail: teacher's saved lessons grouped by Term / Week, with status chips (Draft / Pending / Returned / Approved) and a "Duplicate to draft" action.
- Right pane: 6-part editor (Learning Intention, Success Criteria, Hook, I do, We do, You do) + subject/strand/topic/duration/ability/VC code + Term & Week selector.
- Curriculum alignment: subject + strand pickers pull from `curriculum-db` / `useCurriculumStore`, so alignment stays in sync with the Scope & Sequence admin edits.
- "Generate with Mate" button — calls the existing `generateLessonPlan` server fn and pre-fills the 6 sections (kept behind a button, not auto-run).
- Actions: Save draft, Submit for approval, Export .docx (client-side via the same download path Bank uses), Delete.
- Version history: each save appends a snapshot to `SavedLesson.history[]`; a "History" popover lets teachers restore a prior version into the editor.

### Approval → Bank wiring
- `Submit for approval` sets `status: "pending"` on the lesson AND registers a `lesson_bank_uploads` row (via existing `registerWeeklyUpload`) so it appears in the Admin Approval Centre and the Bank's pending folder.
- When admin approves in Approval Centre, the existing `reviewWeeklyUpload` flow already flips status; Planner mirrors that back onto the local `SavedLesson` on next load by matching on `id`.
- Rejections carry the reviewer comment back into the Planner card as a "Returned with comments" banner.

### State
- Extend `lesson-store.ts`: add `history: LessonSnapshot[]`, `reviewerComment?: string`, `submittedAt?: string`. Keep existing localStorage key + seed so nothing breaks.
- No DB migration required — the `lesson_bank_uploads` table already covers the server side.

### Removed / not rebuilt
- The old "Ask AI / lesson brief / draft in seconds" marketing surface stays gone (per your earlier direction).

## Phase 2 — IEP ↔ Scope & Sequence relational rewiring

Fix the two modules so goals reference curriculum records by id instead of free-text, and Scope & Sequence edits propagate live to IEP cells.

### Data model (client store, no DB migration)
- Every `IepCellState` already has `curriculumId`. Enforce it: goal picker writes only ids; free-text override moves to a dedicated `entrySkillsOverride` field (already present).
- Add a derived selector `useCurriculumLinkedGoals(studentId)` that joins `cells` → `records` at read time, so renaming a Scope & Sequence goal auto-updates every IEP that points at it.
- Deleting a curriculum record marks linked cells as `orphaned` (banner + "Reassign goal" CTA) instead of silently breaking them.

### UI
- IEP goal cell: replace free-text entry with a searchable picker sourced from `useCurriculumStore().records`, filtered by subject/strand/semester.
- Scope & Sequence admin: show a "Used by N IEPs" badge per row; clicking it opens a drill-down list.
- Print / report views read the joined title, so admin edits are visible everywhere.

### Guardrails
- Keep the existing semester-lock trigger and RLS untouched.
- Audit log entries already exist (`OverrideEvent`) — extend to record `goal-relink` events when a cell's `curriculumId` changes.

## Out of scope for this pass
- Pagination on the Bank (can follow separately).
- Any redesign of sidebar / colours / cards / tables / branding.
- Supabase schema changes.

## Verification
- Build passes, no TS errors.
- Playwright: `/lessons/planner` loads, create → save draft → submit shows a matching pending row in `/admin/approvals` and `/lessons/bank`.
- `/ieps` and `/scope-sequence` still load; editing a Scope & Sequence goal title updates the IEP cell that references it.
