
CREATE OR REPLACE FUNCTION public.update_cross_check_status(
  p_goal_id text,
  p_criterion_index integer,
  p_status text,
  p_active_semester text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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
