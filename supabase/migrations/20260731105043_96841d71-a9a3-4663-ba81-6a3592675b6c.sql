ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'all_staff';

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_access_level_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_access_level_check
  CHECK (access_level IN ('all_staff','leadership','allied_health','wellbeing','private'));

CREATE OR REPLACE FUNCTION public.can_read_document(_doc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _doc_id
      AND auth.uid() IS NOT NULL
      AND (
        d.uploaded_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur
                   WHERE ur.user_id = auth.uid()
                     AND ur.role IN ('admin','principal','assistant_principal','learning_specialist','leading_teacher'))
        OR d.access_level = 'all_staff'
        OR (d.access_level = 'allied_health' AND EXISTS (
              SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
                AND ur.role IN ('ot','slp','physio','aha','psychologist','behaviour_specialist')))
        OR (d.access_level = 'wellbeing' AND EXISTS (
              SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
                AND ur.role IN ('nurse','wellbeing_officer','attendance_officer')))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_document(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_document(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_read_document_path(_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = _path AND public.can_read_document(d.id)
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_document_path(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_document_path(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "staff read documents" ON public.documents;
CREATE POLICY "staff read permitted documents"
  ON public.documents FOR SELECT TO authenticated
  USING (
    (in_group(auth.uid(), 'teacher') OR in_group(auth.uid(), 'leadership')
      OR in_group(auth.uid(), 'allied_health') OR in_group(auth.uid(), 'wellbeing'))
    AND public.can_read_document(id)
  );

DROP POLICY IF EXISTS "staff read document chunks" ON public.document_chunks;
CREATE POLICY "staff read permitted document chunks"
  ON public.document_chunks FOR SELECT TO authenticated
  USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "staff read documents objects" ON storage.objects;
DROP POLICY IF EXISTS "permitted read documents objects" ON storage.objects;
CREATE POLICY "permitted read documents objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.can_read_document_path(name));