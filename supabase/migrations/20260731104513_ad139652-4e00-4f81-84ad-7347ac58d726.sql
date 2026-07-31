CREATE POLICY "staff read document files" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.in_group(auth.uid(),'teacher') OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health') OR public.in_group(auth.uid(),'wellbeing')
  )
);

CREATE POLICY "staff upload document files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "owner or leadership update document files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.in_group(auth.uid(),'leadership')))
WITH CHECK (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.in_group(auth.uid(),'leadership')));

CREATE POLICY "owner or leadership delete document files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.in_group(auth.uid(),'leadership')));