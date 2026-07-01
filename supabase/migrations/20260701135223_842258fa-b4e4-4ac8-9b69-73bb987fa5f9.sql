
-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.iep_override_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  goal_id text,
  student_id text,
  goal_semester public.semester,
  active_semester text,
  note_semester public.semester,
  reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.iep_override_audit TO authenticated;
GRANT ALL ON public.iep_override_audit TO service_role;

ALTER TABLE public.iep_override_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.iep_override_audit;
CREATE POLICY "Admins can view audit log" ON public.iep_override_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Writes happen only through SECURITY DEFINER functions below; no INSERT policy.

-- 3. Admin cross-check override
CREATE OR REPLACE FUNCTION public.admin_update_cross_check_status(
  p_goal_id text,
  p_criterion_index integer,
  p_status text,
  p_active_semester text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  g_sem       public.semester;
  g_student   text;
  crit        jsonb;
  crit_count  integer;
  updated     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required: an override reason of at least 5 characters is required'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_status NOT IN ('developing','working-towards','achieved') THEN
    RAISE EXCEPTION 'invalid_status: %', p_status USING ERRCODE = 'check_violation';
  END IF;

  IF p_criterion_index IS NULL OR p_criterion_index < 0 THEN
    RAISE EXCEPTION 'invalid_index: %', p_criterion_index USING ERRCODE = 'check_violation';
  END IF;

  SELECT semester, student_id, success_criteria
    INTO g_sem, g_student, crit
    FROM public.iep_goals WHERE id = p_goal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'goal_not_found: %', p_goal_id USING ERRCODE = 'no_data_found';
  END IF;

  crit_count := jsonb_array_length(COALESCE(crit, '[]'::jsonb));
  IF p_criterion_index >= crit_count THEN
    RAISE EXCEPTION 'invalid_index: % out of range (count=%)', p_criterion_index, crit_count
      USING ERRCODE = 'check_violation';
  END IF;

  updated := jsonb_set(crit, ARRAY[p_criterion_index::text, 'status'], to_jsonb(p_status), false);

  UPDATE public.iep_goals
     SET success_criteria = updated, updated_at = now()
   WHERE id = p_goal_id;

  INSERT INTO public.iep_override_audit(
    actor_id, action, goal_id, student_id, goal_semester, active_semester, reason, payload
  ) VALUES (
    auth.uid(), 'cross_check_status_override', p_goal_id, g_student, g_sem, p_active_semester, p_reason,
    jsonb_build_object(
      'criterion_index', p_criterion_index,
      'status', p_status,
      'semester_mismatch', (p_active_semester <> 'all' AND p_active_semester <> g_sem::text)
    )
  );

  RETURN jsonb_build_object(
    'ok', true, 'goal_id', p_goal_id, 'criterion_index', p_criterion_index,
    'status', p_status, 'semester', g_sem, 'override', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_cross_check_status(text,integer,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_cross_check_status(text,integer,text,text,text) TO authenticated;

-- 4. Admin specialist note override (bypasses trigger)
CREATE OR REPLACE FUNCTION public.admin_upsert_specialist_note(
  p_note_id uuid,
  p_goal_id text,
  p_student_id text,
  p_specialist_role text,
  p_specialist_name text,
  p_semester public.semester,
  p_comment text,
  p_photo_hue integer,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  g_student text;
  g_area    text;
  g_sem     public.semester;
  new_id    uuid;
  mismatch  boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = 'check_violation';
  END IF;

  SELECT student_id, learning_area, semester INTO g_student, g_area, g_sem
    FROM public.iep_goals WHERE id = p_goal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'goal_not_found: %', p_goal_id USING ERRCODE = 'no_data_found';
  END IF;

  mismatch := (p_student_id <> g_student)
           OR (p_specialist_role <> g_area)
           OR (p_semester <> g_sem);

  -- Bypass the enforcement trigger for this admin-authored write.
  ALTER TABLE public.specialist_notes DISABLE TRIGGER enforce_specialist_note_matches_goal_trg;
  BEGIN
    IF p_note_id IS NULL THEN
      INSERT INTO public.specialist_notes(
        student_id, goal_id, specialist_role, specialist_name, semester, comment, photo_hue
      ) VALUES (
        p_student_id, p_goal_id, p_specialist_role, p_specialist_name, p_semester, p_comment, p_photo_hue
      ) RETURNING id INTO new_id;
    ELSE
      UPDATE public.specialist_notes SET
        student_id = p_student_id,
        goal_id = p_goal_id,
        specialist_role = p_specialist_role,
        specialist_name = p_specialist_name,
        semester = p_semester,
        comment = p_comment,
        photo_hue = p_photo_hue,
        updated_at = now()
      WHERE id = p_note_id
      RETURNING id INTO new_id;
      IF new_id IS NULL THEN
        RAISE EXCEPTION 'note_not_found: %', p_note_id USING ERRCODE = 'no_data_found';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    ALTER TABLE public.specialist_notes ENABLE TRIGGER enforce_specialist_note_matches_goal_trg;
    RAISE;
  END;
  ALTER TABLE public.specialist_notes ENABLE TRIGGER enforce_specialist_note_matches_goal_trg;

  INSERT INTO public.iep_override_audit(
    actor_id, action, goal_id, student_id, goal_semester, note_semester, reason, payload
  ) VALUES (
    auth.uid(), CASE WHEN p_note_id IS NULL THEN 'specialist_note_insert_override' ELSE 'specialist_note_update_override' END,
    p_goal_id, p_student_id, g_sem, p_semester, p_reason,
    jsonb_build_object(
      'note_id', new_id,
      'specialist_role', p_specialist_role,
      'specialist_name', p_specialist_name,
      'goal_student_id', g_student,
      'goal_learning_area', g_area,
      'student_mismatch', p_student_id <> g_student,
      'domain_mismatch', p_specialist_role <> g_area,
      'semester_mismatch', p_semester <> g_sem,
      'any_mismatch', mismatch
    )
  );

  RETURN jsonb_build_object('ok', true, 'note_id', new_id, 'override', true, 'mismatch', mismatch);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_specialist_note(uuid,text,text,text,text,public.semester,text,integer,text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_upsert_specialist_note(uuid,text,text,text,text,public.semester,text,integer,text) TO authenticated;

-- Ensure the enforcement trigger has a stable name we can toggle.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_specialist_note_matches_goal_trg'
      AND tgrelid = 'public.specialist_notes'::regclass
  ) THEN
    -- Rename existing trigger if it exists under the old name.
    IF EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'enforce_specialist_note_matches_goal'
        AND tgrelid = 'public.specialist_notes'::regclass
    ) THEN
      ALTER TRIGGER enforce_specialist_note_matches_goal ON public.specialist_notes
        RENAME TO enforce_specialist_note_matches_goal_trg;
    ELSE
      CREATE TRIGGER enforce_specialist_note_matches_goal_trg
        BEFORE INSERT OR UPDATE ON public.specialist_notes
        FOR EACH ROW EXECUTE FUNCTION public.enforce_specialist_note_matches_goal();
    END IF;
  END IF;
END $$;
