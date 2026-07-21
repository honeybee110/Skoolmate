
CREATE TABLE public.ssg_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  class_level text NOT NULL,
  semester text NOT NULL CHECK (semester IN ('Semester 1','Semester 2')),
  meeting_date date NOT NULL,
  meeting_type text NOT NULL CHECK (meeting_type IN ('SSG','DIP Profile Meeting','NDIS Review','Other')),
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  apologies text,
  discussion_summary text,
  action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_meeting_date date,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted')),
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ssg_minutes TO authenticated;
GRANT ALL ON public.ssg_minutes TO service_role;

ALTER TABLE public.ssg_minutes ENABLE ROW LEVEL SECURITY;

-- Teachers: view their own minutes
CREATE POLICY "Teachers view own minutes"
  ON public.ssg_minutes FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Admins: view all minutes
CREATE POLICY "Admins view all minutes"
  ON public.ssg_minutes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Teachers: create their own minutes
CREATE POLICY "Teachers insert own minutes"
  ON public.ssg_minutes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Teachers: update their own minutes only while Draft; result must remain owned by them
CREATE POLICY "Teachers update own draft minutes"
  ON public.ssg_minutes FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by AND status = 'Draft')
  WITH CHECK (auth.uid() = submitted_by);

-- Teachers: delete their own drafts
CREATE POLICY "Teachers delete own draft minutes"
  ON public.ssg_minutes FOR DELETE TO authenticated
  USING (auth.uid() = submitted_by AND status = 'Draft');

-- updated_at trigger reuses existing set_updated_at()
CREATE TRIGGER trg_ssg_minutes_updated_at
  BEFORE UPDATE ON public.ssg_minutes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ssg_minutes_submitted_by ON public.ssg_minutes(submitted_by);
CREATE INDEX idx_ssg_minutes_semester ON public.ssg_minutes(semester);
CREATE INDEX idx_ssg_minutes_class_level ON public.ssg_minutes(class_level);
