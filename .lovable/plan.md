# SchoolMate AU — Phase 3: Portal Split, IEP English, Document Centre

Delivered in four milestones. I'll pause after each for review.

---

## Milestone A — Separate Portals & VIC Terminology

**Auth split**
- New `/teacher/login` — teacher-branded, redirects to `/dashboard` on success.
- New `/admin/login` — admin-branded, redirects to `/admin` on success; blocks users without a leadership/allied-health/wellbeing/IT role with a clear "wrong portal" message and a link to `/teacher/login`.
- Existing `/auth` becomes a chooser page ("I'm a Teacher" / "I'm an Admin").
- Landing page "Login" CTA becomes two buttons.

**Route guards**
- Teachers hitting `/admin/*` → redirected to `/dashboard`.
- Admins hitting `/dashboard` → redirected to `/admin`.
- "Switch to Admin" shortcut removed from the teacher sidebar entirely — portals feel like separate apps.

**Teacher sidebar (final 15 items)**
Dashboard · Calendar · My Classes · Students · Lesson Planner · IEPs · **Handover Documents (new)** · Evidence Hub · Behaviour · Reports · Resource Bank · Scope & Sequence · Notifications · Time & Attendance · Settings

**Admin sidebar (final 19 items)**
Dashboard · Approval Centre · **Document Centre (new)** · Teachers · My Classes · My Students · Whole School Timetable · Resource Bank Management · Curriculum & Scope and Sequence · Reports · Evidence Hub · Behaviour Analytics · Wellbeing · Allied Health · **Leadership Templates (new)** · Notifications · Time & Attendance · User Management · Settings

**Terminology sweep**
Replace remaining US/international labels with Victorian DE conventions (e.g. "Grade" → "Year", "Class Roster" → "Class List", "Homeroom" → "Class", ensure "Semester 1/2" everywhere, "Learning Area", "Curriculum").

---

## Milestone B — IEP English Restructure

- Drop **Phonics** as an IEP learning area. English learning areas become **Reading & Viewing / Speaking & Listening / Writing** only.
- Update `LearningArea` type, mock data, Scope & Sequence descriptors, Cross-Check grid, IEP print view, admin approval filters.
- Phonics kept as a Resource Bank tag and a lesson-plan focus category (not a goal domain).
- Migration: rename/remove phonics rows in `iep_goals`; update DB triggers' allowed learning-area list.

---

## Milestone C — Admin Document Centre

**New module `/admin/documents`** — cloud-drive UX (breadcrumbs, folder grid + list toggle, search, filters, upload, rename, move, archive, download, permissions dialog).

**Backend**
- Tables: `document_folders` (id, parent_id, name, path, class_code, semester, is_pinned, is_system, created_by), `documents` (id, folder_id, name, storage_path, mime, size, uploaded_by, replaces_id, archived_at), `document_permissions` (folder_id, role/user, can_read/upload/manage).
- Storage bucket `documents` (private) with RLS matching table policies.
- Leadership roles can CRUD everything; teachers can read all + upload only into `Teacher Uploads` subfolders + folders they're granted; **Leadership Templates folders are undeletable** by teachers (RLS + `is_pinned` flag).

**Seeded folder tree**
19 top-level folders: IEPs, Weekly Lesson Plans, Handover Documents, Reports, Evidence Hub, Behaviour, Wellbeing, Student Assessments, Curriculum & Scope and Sequence, Resource Bank, School Policies, Professional Development, Timetables, Meeting Minutes, School Events, Student Permissions, Transition Reports, Templates, Start Right.

Under **IEPs**, **Weekly Lesson Plans**, **Handover Documents** — auto-generate:
```
<Folder>/
  Primary/
    P1..P15/
      Semester 1/
        Leadership Templates   (pinned, is_system)
        Teacher Uploads
      Semester 2/ ...
  Secondary/
    S1..S10/ (same pattern)
```
= 3 × (15+10) × 2 × 2 = **300 seeded subfolders**, plus the class/section folders themselves.

---

## Milestone D — Teacher Handover Documents

- New `/handover` route on the teacher portal.
- Auto-scoped to the signed-in teacher's class (P7 for Honey in the demo).
- Reuses Document Centre APIs; shows the two-semester structure with pinned Leadership Templates at the top and a Teacher Uploads drop zone.

---

## Technical Notes

- New tables ship with `GRANT` + RLS in the same migration; Leadership Templates protected via `is_pinned=true` + role check in DELETE policy.
- Storage bucket `documents` created via `storage_create_bucket` (private), with `storage.objects` policies mirroring `document_permissions`.
- File uploads capped at 20 MB (PDF/DOCX/PPTX/XLSX/PNG/JPG/MP4) with server-side mime validation.
- Route restructure: `admin.documents.tsx`, `admin.documents.$folderId.tsx`, `admin.templates.tsx` (Leadership Templates view), `admin.teachers.tsx`, `admin.classes.tsx`, `admin.students.tsx`, `admin.resources.tsx`, `admin.curriculum.tsx`, `admin.evidence.tsx`, `admin.behaviour.tsx`, `admin.reports.tsx`, `admin.notifications.tsx`, `admin.settings.tsx`, `handover.tsx`, `teacher.login.tsx`, `admin.login.tsx`.
- Existing `/auth` kept as a chooser to preserve any OAuth `redirect_uri` allowlist entries.
- All existing tests re-run after each milestone.

Reply **"go"** to start with **Milestone A**, or tell me to reorder (e.g. "Document Centre first").
