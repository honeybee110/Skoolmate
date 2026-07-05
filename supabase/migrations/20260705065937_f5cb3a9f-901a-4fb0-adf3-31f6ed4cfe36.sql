
-- 1. Add class_name to lesson_bank_uploads (approve per class, not per subject)
ALTER TABLE public.lesson_bank_uploads ADD COLUMN IF NOT EXISTS class_name text;

-- 2. Profile photos table (students & staff)
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('student','staff')),
  subject_id text NOT NULL,
  display_name text,
  role_or_year text,
  storage_path text NOT NULL,
  content_type text,
  size_bytes integer,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;
GRANT ALL ON public.profile_photos TO service_role;

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- All authenticated staff may view photos (roster/class views).
CREATE POLICY "auth read profile_photos"
  ON public.profile_photos FOR SELECT
  TO authenticated
  USING (true);

-- Only IT / leadership may manage photos.
CREATE POLICY "it or leadership manage profile_photos"
  ON public.profile_photos FOR ALL
  TO authenticated
  USING (public.in_group(auth.uid(), 'it') OR public.in_group(auth.uid(), 'leadership'))
  WITH CHECK (public.in_group(auth.uid(), 'it') OR public.in_group(auth.uid(), 'leadership'));

-- 3. Storage policies for profile-photos bucket
CREATE POLICY "auth read profile-photos objects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "it/leadership write profile-photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (public.in_group(auth.uid(), 'it') OR public.in_group(auth.uid(), 'leadership'))
  );

CREATE POLICY "it/leadership update profile-photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (public.in_group(auth.uid(), 'it') OR public.in_group(auth.uid(), 'leadership'))
  );

CREATE POLICY "it/leadership delete profile-photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (public.in_group(auth.uid(), 'it') OR public.in_group(auth.uid(), 'leadership'))
  );

-- 4. Admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  body text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  target_group text,
  link_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_by uuid[] NOT NULL DEFAULT '{}'::uuid[]
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read admin_notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leadership/it write admin_notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it'));

CREATE POLICY "any auth update read state"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "leadership/it delete admin_notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it'));
