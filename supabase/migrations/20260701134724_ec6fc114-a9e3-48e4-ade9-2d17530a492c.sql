
-- 1. specialist_notes table
CREATE TABLE public.specialist_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  goal_id text NOT NULL REFERENCES public.iep_goals(id) ON DELETE CASCADE,
  specialist_role text NOT NULL,
  specialist_name text NOT NULL,
  comment text NOT NULL,
  photo_hue integer,
  semester public.semester NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT specialist_notes_role_check CHECK (
    specialist_role IN ('PE','Music','Drama','Visual Arts','Learn to Play')
  )
);

CREATE INDEX specialist_notes_goal_id_idx ON public.specialist_notes(goal_id);
CREATE INDEX specialist_notes_student_id_idx ON public.specialist_notes(student_id);
CREATE INDEX specialist_notes_semester_idx ON public.specialist_notes(semester);

-- 2. GRANTs (all policies scope to signed-in users)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialist_notes TO authenticated;
GRANT ALL ON public.specialist_notes TO service_role;

-- 3. RLS
ALTER TABLE public.specialist_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read specialist notes"
  ON public.specialist_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Signed-in users can insert specialist notes"
  ON public.specialist_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can update specialist notes"
  ON public.specialist_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can delete specialist notes"
  ON public.specialist_notes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 4. updated_at trigger reuses existing helper
CREATE TRIGGER set_specialist_notes_updated_at
  BEFORE UPDATE ON public.specialist_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Enforce student / domain / semester match against the linked goal.
CREATE OR REPLACE FUNCTION public.enforce_specialist_note_matches_goal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  g_student text;
  g_area    text;
  g_sem     public.semester;
BEGIN
  SELECT student_id, learning_area, semester
    INTO g_student, g_area, g_sem
    FROM public.iep_goals
   WHERE id = NEW.goal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'IEP goal % does not exist', NEW.goal_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.student_id <> g_student THEN
    RAISE EXCEPTION 'student_mismatch: note student % does not match goal student %',
      NEW.student_id, g_student
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.specialist_role <> g_area THEN
    RAISE EXCEPTION 'domain_mismatch: specialist role % does not match goal learning area %',
      NEW.specialist_role, g_area
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.semester <> g_sem THEN
    RAISE EXCEPTION 'semester_mismatch: note semester % does not match goal semester %',
      NEW.semester, g_sem
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_specialist_note_matches_goal
  BEFORE INSERT OR UPDATE ON public.specialist_notes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_specialist_note_matches_goal();

-- 6. iep_goals: block semester change once success criteria exist.
--    Prevents a goal from being "moved" into another semester after
--    cross-check statuses have already been recorded against it.
CREATE OR REPLACE FUNCTION public.enforce_iep_goal_semester_stable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.semester IS DISTINCT FROM OLD.semester
     AND OLD.success_criteria IS NOT NULL
     AND jsonb_array_length(OLD.success_criteria) > 0 THEN
    RAISE EXCEPTION 'semester_locked: cannot change semester on a goal that already has cross-check criteria; create a new goal in %', NEW.semester
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_iep_goal_semester_stable
  BEFORE UPDATE ON public.iep_goals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_iep_goal_semester_stable();

-- 7. Cross-check RPC: the only supported way to mutate success_criteria.
--    Rejects mismatched active_semester at the DB layer.
CREATE OR REPLACE FUNCTION public.update_cross_check_status(
  p_goal_id text,
  p_criterion_index integer,
  p_status text,
  p_active_semester text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g_sem       public.semester;
  crit        jsonb;
  crit_count  integer;
  updated     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status NOT IN ('developing','working-towards','achieved') THEN
    RAISE EXCEPTION 'invalid_status: %', p_status USING ERRCODE = 'check_violation';
  END IF;

  IF p_criterion_index IS NULL OR p_criterion_index < 0 THEN
    RAISE EXCEPTION 'invalid_index: %', p_criterion_index USING ERRCODE = 'check_violation';
  END IF;

  SELECT semester, success_criteria
    INTO g_sem, crit
    FROM public.iep_goals
   WHERE id = p_goal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'goal_not_found: %', p_goal_id USING ERRCODE = 'no_data_found';
  END IF;

  IF p_active_semester <> 'all' AND p_active_semester <> g_sem::text THEN
    RAISE EXCEPTION 'semester_mismatch: goal % is in %, active semester is %',
      p_goal_id, g_sem, p_active_semester
      USING ERRCODE = 'check_violation';
  END IF;

  crit_count := jsonb_array_length(COALESCE(crit, '[]'::jsonb));
  IF p_criterion_index >= crit_count THEN
    RAISE EXCEPTION 'invalid_index: % out of range (count=%)', p_criterion_index, crit_count
      USING ERRCODE = 'check_violation';
  END IF;

  updated := jsonb_set(
    crit,
    ARRAY[p_criterion_index::text, 'status'],
    to_jsonb(p_status),
    false
  );

  UPDATE public.iep_goals
     SET success_criteria = updated,
         updated_at = now()
   WHERE id = p_goal_id;

  RETURN jsonb_build_object(
    'ok', true,
    'goal_id', p_goal_id,
    'criterion_index', p_criterion_index,
    'status', p_status,
    'semester', g_sem
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_cross_check_status(text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_cross_check_status(text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cross_check_status(text, integer, text, text) TO service_role;
