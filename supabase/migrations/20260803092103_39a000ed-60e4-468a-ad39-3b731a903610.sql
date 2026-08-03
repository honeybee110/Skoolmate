
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- Read-only, append-controlled tables
GRANT SELECT ON public.audit_events TO authenticated;
GRANT SELECT ON public.iep_override_audit TO authenticated;
GRANT SELECT, INSERT ON public.leadership_alert_deliveries TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.ask_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leadership_alert_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;

-- Full CRUD (still constrained by RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ask_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iep_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iep_matrix_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_alert_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_bank_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialist_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ssg_minutes TO authenticated;

-- Sequences used by identity columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
