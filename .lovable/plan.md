
# SchoolMate AU — Phase 2 Plan

This is a very large scope (19 sections). To ship safely without breaking Phase 1, I'll deliver it in **4 staged milestones**, each independently reviewable. I'll confirm each milestone before starting the next.

Existing UI, colours, sidebar, spacing and typography stay untouched — new features slot into the current shell.

---

## Milestone 1 — Auth, Roles & Routing Foundation (sections 1, 2, 19)

**Backend (single migration)**
- Enable Lovable Cloud auth (email/password + Google).
- Extend `app_role` enum with all Phase 2 roles: `teacher`, `principal`, `assistant_principal`, `learning_specialist`, `leading_teacher`, `ot`, `slp`, `physio`, `aha`, `psychologist`, `behaviour_specialist`, `nurse`, `wellbeing_officer`, `attendance_officer`, `it_admin`.
- Add `role_group` enum (`teacher`, `leadership`, `allied_health`, `wellbeing`, `it`) + `profiles` table (display_name, primary_group, avatar_hue).
- `has_role` already exists; add `in_group(uuid, role_group)` helper.
- Seed demo accounts documentation (users create their own via `/auth`).

**Frontend**
- `/auth` route (sign in / sign up, Google button).
- Integration-managed `_authenticated/route.tsx` gate (already scaffolded).
- Post-login router: teachers → `/dashboard`, any leadership/allied/wellbeing/it role → `/admin`.
- Split sidebar: `TeacherSidebar` (existing items minus Admin) and `AdminSidebar` (Admin modules only). Same visual style.
- `useRole()` hook + `<RoleGate roles={...}>` component wrapping admin-only routes.

---

## Milestone 2 — Admin Portal Core (sections 3, 4, 6, 7, 16)

- `/admin` dashboard: live stat cards (pending plans, IEPs, reports due, incidents, attendance, meetings, absences, clock-ins) + Quick Actions.
- `/admin/approvals` Approval Centre with Lesson Plans + IEPs tabs, Approve / Reject / Request Changes actions → writes to `approval_events` and triggers notification.
- `/admin/timetable` Whole School Timetable (Prep–Year 12), filter/search, export to PDF (react-to-print) and Excel (xlsx via SheetJS-lite in a server fn).
- `/admin/reminders` one-click reminder templates → creates `notifications` row + (optional) Resend email if connector present.
- `notifications` table + realtime subscription; header bell for both portals.

---

## Milestone 3 — Teacher Modules & Data Wiring (sections 5, 9, 10, 11, 12, 13, 14, 18)

- Notifications bell on teacher header.
- **Clock In / Out** button on both dashboards → `time_clock` table with today's hours, history, admin export.
- **Lesson Planner**: Term 1–4 tabs, status pipeline (Draft / Submitted / Pending / Approved / Returned), full filter bar. Submit → creates approval row.
- **IEP redesign**:
  - Student list → "View IEP" → Semester 1 / Semester 2 tabs → subject accordions with goals.
  - Wire up every "Add IEP Goal" button: opens **Scope & Sequence goal picker** dialog (search + curriculum/semester/year level/AS/CD filters) pulling from the existing scope data in `mock-data.ts`, promoted to a real `scope_sequence_goals` table.
  - Remove Phonics as an English IEP domain — keep only Reading & Viewing / Speaking & Listening / Writing. Phonics stays as a lesson focus tag.
- **Interactive Cross-Check tracker**: click/drag/percentage input, status = Working Towards / Nearly There / Achieved / Exceeded, autosaves with editor + timestamp, updates dashboards.
- Cross-module links table (`entity_links`) so Lesson↔IEP↔Evidence↔Behaviour stay in sync without duplication.

---

## Milestone 4 — Allied Health, Resource Bank, Analytics (sections 8, 15, 17)

- **Allied Health workspace** at `/admin/allied-health`: observations, therapy notes, referrals, intervention tracking. Every note auto-appears on Student Profile, Behaviour, Wellbeing, Evidence Hub, Timeline via a shared `student_events` view.
- **Wellbeing workspace** at `/admin/wellbeing`: attendance notes, medical alerts, incident reports, welfare records.
- **Resource Bank** `/resources`: 11 categories, upload (Supabase Storage), tag, approve, favourite, share; teacher search/filter/download; AI recommendations via Lovable AI Gateway based on active lesson + student goals/sensory/behaviour profile.
- **Analytics** `/admin/analytics`: dashboards for the 10 listed metrics using Recharts, driven by SQL views.

---

## Technical Notes (non-user-facing)

- Every new table gets `GRANT` + RLS scoped to `has_role`/`in_group`.
- All server logic via `createServerFn` — no edge functions.
- Realtime enabled on `notifications`, `approval_events`, `time_clock`, `iep_goals`, `student_events`.
- No changes to existing files' visual design; only additive routes and new sidebar entries under the Admin group.

---

**Proposal:** approve this plan and I'll start with **Milestone 1** (auth + roles + split portals). I'll pause after each milestone for review before continuing. Reply "go" or tell me which milestone to prioritise / reorder.
