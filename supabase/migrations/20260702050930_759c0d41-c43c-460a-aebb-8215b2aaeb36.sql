
CREATE OR REPLACE FUNCTION public.claim_founder_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_exists boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role)
    INTO admin_exists;

  IF admin_exists AND NOT public.has_role(uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'founder_already_claimed' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
    VALUES (uid, 'admin'::public.app_role),
           (uid, 'principal'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles SET primary_group = 'leadership' WHERE id = uid;

  RETURN jsonb_build_object('ok', true, 'user_id', uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_founder_admin() TO authenticated;
