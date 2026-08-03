CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  actor_id uuid,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash text,
  hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON public.audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON public.audit_events (actor_id);

GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leadership can read audit events" ON public.audit_events;
CREATE POLICY "Leadership can read audit events"
ON public.audit_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.in_group(auth.uid(), 'leadership')
);

-- No INSERT/UPDATE/DELETE policies: writes only via the security-definer function below.

-- Block mutation/deletion even for privileged paths.
CREATE OR REPLACE FUNCTION public.audit_events_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_no_update ON public.audit_events;
CREATE TRIGGER audit_events_no_update
BEFORE UPDATE OR DELETE ON public.audit_events
FOR EACH ROW EXECUTE FUNCTION public.audit_events_block_mutation();

-- Append-only writer: computes the hash chain server-side.
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_prev text;
  v_hash text;
  v_name text;
  v_role text;
  v_ts timestamptz := now();
  v_id uuid;
  v_seq bigint;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_action IS NULL OR length(btrim(p_action)) = 0 THEN
    RAISE EXCEPTION 'action_required' USING ERRCODE = 'check_violation';
  END IF;
  IF p_entity_type IS NULL OR length(btrim(p_entity_type)) = 0 THEN
    RAISE EXCEPTION 'entity_type_required' USING ERRCODE = 'check_violation';
  END IF;

  SELECT display_name INTO v_name FROM public.profiles WHERE id = uid;
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = uid ORDER BY created_at LIMIT 1;

  SELECT hash INTO v_prev FROM public.audit_events ORDER BY seq DESC LIMIT 1;

  v_hash := encode(
    digest(
      coalesce(v_prev, '') || '|' || uid::text || '|' || p_action || '|' || p_entity_type || '|' ||
      coalesce(p_entity_id, '') || '|' || coalesce(p_summary, '') || '|' ||
      coalesce(p_metadata, '{}'::jsonb)::text || '|' || v_ts::text,
      'sha256'
    ),
    'hex'
  );

  INSERT INTO public.audit_events(
    actor_id, actor_name, actor_role, action, entity_type, entity_id,
    summary, metadata, prev_hash, hash, created_at
  ) VALUES (
    uid, v_name, v_role, btrim(p_action), btrim(p_entity_type), p_entity_id,
    p_summary, coalesce(p_metadata, '{}'::jsonb), v_prev, v_hash, v_ts
  ) RETURNING id, seq INTO v_id, v_seq;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'seq', v_seq, 'hash', v_hash);
END;
$$;

REVOKE ALL ON FUNCTION public.record_audit_event(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_audit_event(text, text, text, text, jsonb) TO authenticated, service_role;

-- Chain verification for leadership.
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_prev text := NULL;
  v_expected text;
  v_count bigint := 0;
  v_bad bigint := 0;
  v_first_bad bigint := NULL;
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.has_role(auth.uid(), 'admin') OR public.in_group(auth.uid(), 'leadership')) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  FOR r IN SELECT * FROM public.audit_events ORDER BY seq ASC LOOP
    v_count := v_count + 1;
    v_expected := encode(
      digest(
        coalesce(v_prev, '') || '|' || r.actor_id::text || '|' || r.action || '|' || r.entity_type || '|' ||
        coalesce(r.entity_id, '') || '|' || coalesce(r.summary, '') || '|' ||
        coalesce(r.metadata, '{}'::jsonb)::text || '|' || r.created_at::text,
        'sha256'
      ),
      'hex'
    );
    IF v_expected IS DISTINCT FROM r.hash OR r.prev_hash IS DISTINCT FROM v_prev THEN
      v_bad := v_bad + 1;
      IF v_first_bad IS NULL THEN v_first_bad := r.seq; END IF;
    END IF;
    v_prev := r.hash;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', v_bad = 0,
    'total', v_count,
    'invalid', v_bad,
    'first_invalid_seq', v_first_bad,
    'checked_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_audit_chain() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain() TO authenticated, service_role;