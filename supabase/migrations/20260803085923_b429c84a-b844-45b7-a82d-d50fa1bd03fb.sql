CREATE TABLE public.iep_matrix_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  cells jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iep_matrix_drafts TO authenticated;
GRANT ALL ON public.iep_matrix_drafts TO service_role;

ALTER TABLE public.iep_matrix_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iep_matrix_drafts_select_own" ON public.iep_matrix_drafts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "iep_matrix_drafts_insert_own" ON public.iep_matrix_drafts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "iep_matrix_drafts_update_own" ON public.iep_matrix_drafts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "iep_matrix_drafts_delete_own" ON public.iep_matrix_drafts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER iep_matrix_drafts_set_updated_at
  BEFORE UPDATE ON public.iep_matrix_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX iep_matrix_drafts_user_idx ON public.iep_matrix_drafts (user_id, updated_at DESC);