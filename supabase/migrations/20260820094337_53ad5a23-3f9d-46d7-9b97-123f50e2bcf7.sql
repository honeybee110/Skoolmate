
DROP POLICY IF EXISTS "staff read document files" ON storage.objects;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.can_read_document_path(text) FROM authenticated;
REVOKE ALL ON FUNCTION public.admin_upsert_specialist_note(uuid, text, text, text, text, public.semester, text, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_specialist_note(uuid, text, text, text, text, public.semester, text, integer, text) TO service_role;

CREATE POLICY "permitted read documents objects v2"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND EXISTS (
  SELECT 1 FROM public.documents d
  WHERE d.storage_path = storage.objects.name AND public.can_read_document(d.id)
));
DROP POLICY IF EXISTS "permitted read documents objects" ON storage.objects;
