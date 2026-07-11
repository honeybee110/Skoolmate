# Admin Portal Production Build — Plan

Scope is large; I'll ship it as one coordinated milestone using shared building blocks so modules stay in sync. Existing data, auth, RLS, and unrelated pages will not be touched.

## Foundations (build first, reuse everywhere)

- **Directory store** (`src/lib/directory-store.ts`) — one client-side source of truth for teachers, classes, students, timetable, school years. Persisted to `localStorage`, seeded from existing `mock-data.ts`. Cross-module events so edits in one screen refresh others.
- **Reusable UI**: `DirectoryToolbar` (search + filter chips), `DataTable`, `PersonCard` (avatar + role chips), `AssignmentDropzone` (drag-and-drop), `StatusPill`, `YearSelector`.
- **Types**: `Teacher`, `EducationSupport`, `ClassRoom`, `StudentRecord`, `TimetableSession`, `SchoolYear`, `TimetableStatus` (`draft | submitted | in_review | approved | published | returned`).

## 1. Teacher Directory — `/admin/teachers`

Replaces current stub. Full CRUD with:
- Grid + list toggle, search, filter by role/status/class.
- Profile drawer: photo (reuses `profile-photos` bucket), employee ID, role, classes, email, phone, employment status, clock in/out history (reads existing `timeclock` mock).
- Actions: Add, Edit, Archive, Assign to class (opens class picker).

## 2. School-Wide Class List — `/admin/classes`

Replaces stub. Class builder for upcoming year:
- Grid of class cards (Prep 1–5, Primary 6–15, Secondary 1–10) grouped by band.
- Class editor drawer: name, year level, room, classroom teacher, multiple ES staff, students, timetable link.
- Drag-and-drop assignment (react-dnd-lite via HTML5 native DnD) for teachers, ES, students from side panel to class.
- Writes propagate to directory store → student directory, timetable, teacher directory refresh live.

## 3. Whole-School Student Directory — `/admin/students`

Replaces stub. Powerful filter bar (class, year, teacher, semester, behaviour band, attendance band, IEP completion). Student card shows photo, name, class, teacher, ES, year, attendance %, behaviour flag, IEP status, CrossCheck progress, medical alerts, wellbeing note pill. Row click → existing `/students/$studentId` route.

## 4. Whole-School Timetable — `/admin/timetable`

Rebuilds existing stub. Two views:
- **Review queue** — teachers' submitted timetables with Return / Request revision / Approve / Publish actions and comment thread.
- **Master timetable** — grouped by Prep / Primary / Secondary, per class grid (Mon–Fri × periods), showing teacher, ES, students count, room, subject. Approved = read-only lock icon; republish clones a new version.

Status machine: Draft → Submitted → In Review → Approved → Published, with Returned branch.

## 5. Leadership Planning — `/admin/year-setup`

New route. Wizard:
1. Create/activate school year.
2. Duplicate previous year's classes (checkbox list).
3. Bulk assign teachers, ES, students (drag from unassigned pool).
4. Move students / teachers between classes.
5. Archive previous year, activate new year.
Sidebar entry under Admin → "Year Setup".

## 6. CrossCheck Builder rename

Global rename "Extended CrossCheck Builder" → "CrossCheck Builder" across routes, sidebar, headings, meta titles, and any strings. File `admin.crosscheck-builder.tsx` already named correctly; just update copy.

## 7. Integration hooks

- Directory store exposes selectors used by Lesson Planner, IEPs, Reports, Evidence Hub, Behaviour, Attendance, Analytics (they already read `mock-data`; add a compatibility shim so their existing imports return live directory data).
- No DB migration this pass — everything persists client-side to keep the existing Supabase schema untouched. Server-side persistence can follow once the UI is validated.

## Technical notes

- All new routes use `AppShell variant="admin"` + `RoleGate` (leadership/it).
- Drag-and-drop: native HTML5 DnD to avoid new dependencies.
- Reusable `EntityDrawer` component built on existing `Dialog`.
- Existing brand tokens (`--primary`, `--accent`, `--navy`) used throughout.
- Typecheck (`bunx tsgo --noEmit`) must pass at the end.

## Out of scope (explicit)

- No changes to auth, RLS, Supabase schema, or unrelated pages.
- No new database tables in this pass (state is local + reactive). If you want durable persistence, I'll add migrations in a follow-up milestone.

Reply "go" to build, or tell me which module to tackle first if you'd rather stage it.
