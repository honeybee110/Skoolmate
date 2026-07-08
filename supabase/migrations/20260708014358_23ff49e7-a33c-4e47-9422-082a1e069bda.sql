
-- ==== action_queue ====
DROP POLICY IF EXISTS "Authenticated users can read action queue" ON public.action_queue;
DROP POLICY IF EXISTS "Signed-in users can delete action queue" ON public.action_queue;
DROP POLICY IF EXISTS "Signed-in users can insert action queue" ON public.action_queue;
DROP POLICY IF EXISTS "Signed-in users can update action queue" ON public.action_queue;

CREATE POLICY "staff read action queue" ON public.action_queue
  FOR SELECT TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );
CREATE POLICY "staff insert action queue" ON public.action_queue
  FOR INSERT TO authenticated WITH CHECK (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );
CREATE POLICY "staff update action queue" ON public.action_queue
  FOR UPDATE TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  ) WITH CHECK (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );
CREATE POLICY "leadership delete action queue" ON public.action_queue
  FOR DELETE TO authenticated USING (
    public.in_group(auth.uid(),'leadership')
  );

-- ==== admin_notifications ====
DROP POLICY IF EXISTS "auth read admin_notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "any auth update read state" ON public.admin_notifications;

CREATE POLICY "recipients read admin_notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (
    public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'it')
    OR (target_group IS NOT NULL AND public.in_group(auth.uid(), target_group::public.role_group))
  );
CREATE POLICY "recipients update read state" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (
    public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'it')
    OR (target_group IS NOT NULL AND public.in_group(auth.uid(), target_group::public.role_group))
  ) WITH CHECK (
    public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'it')
    OR (target_group IS NOT NULL AND public.in_group(auth.uid(), target_group::public.role_group))
  );

-- ==== iep_goals ====
DROP POLICY IF EXISTS "Authenticated users can read IEP goals" ON public.iep_goals;
DROP POLICY IF EXISTS "Signed-in users can delete IEP goals" ON public.iep_goals;
DROP POLICY IF EXISTS "Signed-in users can insert IEP goals" ON public.iep_goals;
DROP POLICY IF EXISTS "Signed-in users can update IEP goals" ON public.iep_goals;

CREATE POLICY "staff read iep_goals" ON public.iep_goals
  FOR SELECT TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );
CREATE POLICY "staff insert iep_goals" ON public.iep_goals
  FOR INSERT TO authenticated WITH CHECK (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
  );
CREATE POLICY "staff update iep_goals" ON public.iep_goals
  FOR UPDATE TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
  ) WITH CHECK (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
  );
CREATE POLICY "leadership delete iep_goals" ON public.iep_goals
  FOR DELETE TO authenticated USING (
    public.in_group(auth.uid(),'leadership')
  );

-- ==== specialist_notes ====
DROP POLICY IF EXISTS "Authenticated users can read specialist notes" ON public.specialist_notes;
DROP POLICY IF EXISTS "Signed-in users can delete specialist notes" ON public.specialist_notes;
DROP POLICY IF EXISTS "Signed-in users can insert specialist notes" ON public.specialist_notes;
DROP POLICY IF EXISTS "Signed-in users can update specialist notes" ON public.specialist_notes;

CREATE POLICY "care team read specialist_notes" ON public.specialist_notes
  FOR SELECT TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );
CREATE POLICY "specialists insert specialist_notes" ON public.specialist_notes
  FOR INSERT TO authenticated WITH CHECK (
    public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'leadership')
  );
CREATE POLICY "specialists update specialist_notes" ON public.specialist_notes
  FOR UPDATE TO authenticated USING (
    public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'leadership')
  ) WITH CHECK (
    public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'leadership')
  );
CREATE POLICY "leadership delete specialist_notes" ON public.specialist_notes
  FOR DELETE TO authenticated USING (
    public.in_group(auth.uid(),'leadership')
  );

-- ==== lesson_bank_uploads ====
DROP POLICY IF EXISTS "auth read all" ON public.lesson_bank_uploads;
CREATE POLICY "uploader or leadership read lesson_bank_uploads" ON public.lesson_bank_uploads
  FOR SELECT TO authenticated USING (
    uploaded_by = auth.uid()
    OR public.in_group(auth.uid(),'leadership')
  );

-- ==== profile_photos ====
DROP POLICY IF EXISTS "auth read profile_photos" ON public.profile_photos;
CREATE POLICY "staff read profile_photos" ON public.profile_photos
  FOR SELECT TO authenticated USING (
    public.in_group(auth.uid(),'teacher')
    OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'it')
    OR public.in_group(auth.uid(),'allied_health')
    OR public.in_group(auth.uid(),'wellbeing')
  );

-- ==== storage: lesson-uploads bucket ====
DROP POLICY IF EXISTS "auth read lesson uploads" ON storage.objects;
CREATE POLICY "uploader or leadership read lesson uploads" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'lesson-uploads'
    AND (
      owner = auth.uid()
      OR public.in_group(auth.uid(),'leadership')
      OR EXISTS (
        SELECT 1 FROM public.lesson_bank_uploads lbu
        WHERE lbu.storage_path = storage.objects.name
          AND lbu.uploaded_by = auth.uid()
      )
    )
  );

-- ==== storage: profile-photos bucket ====
DROP POLICY IF EXISTS "auth read profile-photos objects" ON storage.objects;
CREATE POLICY "staff read profile-photos objects" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'profile-photos'
    AND (
      public.in_group(auth.uid(),'teacher')
      OR public.in_group(auth.uid(),'leadership')
      OR public.in_group(auth.uid(),'it')
      OR public.in_group(auth.uid(),'allied_health')
      OR public.in_group(auth.uid(),'wellbeing')
    )
  );

-- ==== SECURITY DEFINER function EXECUTE hardening ====
-- Revoke public/anon execute across all sensitive functions; grant only what the app needs.
REVOKE EXECUTE ON FUNCTION public.claim_founder_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_cross_check_status(text,integer,text,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_specialist_note(uuid,text,text,text,text,public.semester,text,integer,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.in_group(uuid, public.role_group) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role / in_group are used inside RLS policies; keep authenticated execute.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.in_group(uuid, public.role_group) TO authenticated;
