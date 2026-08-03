ALTER TABLE public.iep_matrix_drafts
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;