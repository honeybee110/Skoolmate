
-- Enum for the semester values used across IEP goals and action-queue records
DO $$ BEGIN
  CREATE TYPE public.semester AS ENUM ('Semester 1 · 2026', 'Semester 2 · 2026');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- IEP goals
-- =========================================
CREATE TABLE public.iep_goals (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  learning_area TEXT NOT NULL,
  level TEXT NOT NULL,
  learning_intention TEXT NOT NULL,
  smart TEXT NOT NULL,
  baseline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'developing',
  approval TEXT NOT NULL DEFAULT 'draft',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  last_evidence TEXT,
  review_due TEXT,
  vc_link TEXT,
  success_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  semester public.semester NOT NULL DEFAULT 'Semester 2 · 2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iep_goals TO authenticated;
GRANT ALL ON public.iep_goals TO service_role;

ALTER TABLE public.iep_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read IEP goals"
  ON public.iep_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert IEP goals"
  ON public.iep_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update IEP goals"
  ON public.iep_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete IEP goals"
  ON public.iep_goals FOR DELETE TO authenticated USING (true);

CREATE TRIGGER iep_goals_set_updated_at
  BEFORE UPDATE ON public.iep_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX iep_goals_semester_idx ON public.iep_goals (semester);
CREATE INDEX iep_goals_student_idx ON public.iep_goals (student_id);

-- =========================================
-- Action queue
-- =========================================
CREATE TABLE public.action_queue (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  due TEXT NOT NULL,
  urgent BOOLEAN NOT NULL DEFAULT false,
  student_id TEXT,
  semester public.semester NOT NULL DEFAULT 'Semester 2 · 2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_queue TO authenticated;
GRANT ALL ON public.action_queue TO service_role;

ALTER TABLE public.action_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read action queue"
  ON public.action_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert action queue"
  ON public.action_queue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update action queue"
  ON public.action_queue FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete action queue"
  ON public.action_queue FOR DELETE TO authenticated USING (true);

CREATE TRIGGER action_queue_set_updated_at
  BEFORE UPDATE ON public.action_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX action_queue_semester_idx ON public.action_queue (semester);

-- =========================================
-- Backfill: ensure any pre-existing rows (none expected on first run, but
-- safe under re-runs) have a non-null semester aligned to the current
-- reporting cycle. The column default handles new inserts; this UPDATE
-- covers historical rows.
-- =========================================
UPDATE public.iep_goals
  SET semester = 'Semester 2 · 2026'
  WHERE semester IS NULL;

UPDATE public.action_queue
  SET semester = 'Semester 2 · 2026'
  WHERE semester IS NULL;

-- Report-kind actions belong to the upcoming reporting semester
UPDATE public.action_queue
  SET semester = 'Semester 2 · 2026'
  WHERE kind = 'report';
