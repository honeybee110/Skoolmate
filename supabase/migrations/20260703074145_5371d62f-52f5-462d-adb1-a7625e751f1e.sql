
CREATE TABLE public.lesson_bank_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL CHECK (term IN ('Term 1','Term 2','Term 3','Term 4')),
  week text NOT NULL CHECK (week IN ('Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8','Week 9','Week 10')),
  title text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  size_bytes integer,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  uploader_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  leadership_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_bank_uploads TO authenticated;
GRANT ALL ON public.lesson_bank_uploads TO service_role;
ALTER TABLE public.lesson_bank_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read all" ON public.lesson_bank_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "own insert" ON public.lesson_bank_uploads FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "own update or leadership" ON public.lesson_bank_uploads FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'))
  WITH CHECK (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'));
CREATE POLICY "own delete or leadership" ON public.lesson_bank_uploads FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lesson_bank_uploads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "auth read lesson uploads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-uploads');
CREATE POLICY "auth upload lesson uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson-uploads' AND owner = auth.uid());
CREATE POLICY "own delete lesson uploads" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lesson-uploads' AND (owner = auth.uid() OR public.in_group(auth.uid(),'leadership')));
