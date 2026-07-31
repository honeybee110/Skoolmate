CREATE TABLE public.leadership_alert_settings (
  id text PRIMARY KEY DEFAULT 'default',
  thresholds jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.leadership_alert_settings TO authenticated;
GRANT ALL ON public.leadership_alert_settings TO service_role;
ALTER TABLE public.leadership_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leadership_alert_settings_select"
  ON public.leadership_alert_settings FOR SELECT TO authenticated
  USING (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "leadership_alert_settings_insert"
  ON public.leadership_alert_settings FOR INSERT TO authenticated
  WITH CHECK (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "leadership_alert_settings_update"
  ON public.leadership_alert_settings FOR UPDATE TO authenticated
  USING (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.leadership_alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  email text,
  campus text NOT NULL DEFAULT 'all',
  leadership_role text NOT NULL DEFAULT 'Principal',
  min_severity text NOT NULL DEFAULT 'warning',
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  rules text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, campus, leadership_role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_alert_subscriptions TO authenticated;
GRANT ALL ON public.leadership_alert_subscriptions TO service_role;
ALTER TABLE public.leadership_alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leadership_alert_subs_select"
  ON public.leadership_alert_subscriptions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.in_group(auth.uid(), 'leadership')
    OR public.in_group(auth.uid(), 'it')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leadership_alert_subs_insert"
  ON public.leadership_alert_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leadership_alert_subs_update"
  ON public.leadership_alert_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leadership_alert_subs_delete"
  ON public.leadership_alert_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_leadership_alert_subs_campus ON public.leadership_alert_subscriptions (campus) WHERE active;

CREATE TABLE public.leadership_alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key text NOT NULL,
  dedupe_key text,
  severity text NOT NULL,
  campus text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  detail text,
  channel text NOT NULL,
  recipient_user_id uuid,
  recipient_email text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leadership_alert_deliveries TO authenticated;
GRANT ALL ON public.leadership_alert_deliveries TO service_role;
ALTER TABLE public.leadership_alert_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leadership_alert_deliveries_select"
  ON public.leadership_alert_deliveries FOR SELECT TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR public.in_group(auth.uid(), 'leadership')
    OR public.in_group(auth.uid(), 'it')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE UNIQUE INDEX idx_leadership_alert_dedupe
  ON public.leadership_alert_deliveries (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX idx_leadership_alert_deliveries_created
  ON public.leadership_alert_deliveries (created_at DESC);

CREATE TRIGGER trg_leadership_alert_settings_updated
  BEFORE UPDATE ON public.leadership_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leadership_alert_subs_updated
  BEFORE UPDATE ON public.leadership_alert_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();