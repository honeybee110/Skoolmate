-- Harden SECURITY DEFINER role helpers: callers may only query their own roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NOT NULL
     AND _user_id IS DISTINCT FROM caller
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = caller AND role = 'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION 'forbidden: cannot inspect roles of another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.in_group(_user_id uuid, _group role_group)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NOT NULL
     AND _user_id IS DISTINCT FROM caller
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = caller AND role = 'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION 'forbidden: cannot inspect roles of another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND CASE _group
        WHEN 'teacher' THEN ur.role IN ('teacher')
        WHEN 'leadership' THEN ur.role IN ('admin','principal','assistant_principal','learning_specialist','leading_teacher')
        WHEN 'allied_health' THEN ur.role IN ('ot','slp','physio','aha','psychologist','behaviour_specialist')
        WHEN 'wellbeing' THEN ur.role IN ('nurse','wellbeing_officer','attendance_officer')
        WHEN 'it' THEN ur.role IN ('it_admin','admin')
      END
  );
END;
$function$;

-- Least privilege on every SECURITY DEFINER function in the API schema.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.in_group(uuid, role_group) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_founder_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_cross_check_status(text, integer, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_specialist_note(uuid, text, text, text, text, semester, text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.in_group(uuid, role_group) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_founder_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_cross_check_status(text, integer, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_specialist_note(uuid, text, text, text, text, semester, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- This non-definer RPC should never be reachable anonymously.
REVOKE ALL ON FUNCTION public.update_cross_check_status(text, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_cross_check_status(text, integer, text, text) TO authenticated, service_role;