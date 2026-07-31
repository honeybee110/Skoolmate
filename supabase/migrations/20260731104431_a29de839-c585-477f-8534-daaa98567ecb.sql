create extension if not exists vector;

CREATE TABLE public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  mime_type text,
  size_bytes integer,
  category text not null default 'General',
  student_name text,
  author_name text,
  uploaded_by uuid not null default auth.uid(),
  uploader_name text,
  index_status text not null default 'pending',
  index_error text,
  chunk_count integer not null default 0,
  text_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  section_label text,
  embedding vector(3072),
  created_at timestamptz not null default now()
);

CREATE INDEX document_chunks_document_id_idx ON public.document_chunks(document_id);
CREATE INDEX document_chunks_embedding_idx
  ON public.document_chunks using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read documents" ON public.documents FOR SELECT TO authenticated
USING (
  public.in_group(auth.uid(),'teacher') OR public.in_group(auth.uid(),'leadership')
  OR public.in_group(auth.uid(),'allied_health') OR public.in_group(auth.uid(),'wellbeing')
);

CREATE POLICY "staff insert own documents" ON public.documents FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND (
    public.in_group(auth.uid(),'teacher') OR public.in_group(auth.uid(),'leadership')
    OR public.in_group(auth.uid(),'allied_health') OR public.in_group(auth.uid(),'wellbeing')
  )
);

CREATE POLICY "owner or leadership update documents" ON public.documents FOR UPDATE TO authenticated
USING (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'))
WITH CHECK (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'));

CREATE POLICY "owner or leadership delete documents" ON public.documents FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'));

CREATE POLICY "staff read document chunks" ON public.document_chunks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id));

CREATE POLICY "owner insert document chunks" ON public.document_chunks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (d.uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'))));

CREATE POLICY "owner delete document chunks" ON public.document_chunks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (d.uploaded_by = auth.uid() OR public.in_group(auth.uid(),'leadership'))));

CREATE TRIGGER documents_set_updated_at BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(3072),
  match_count int default 12
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  section_label text,
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  select c.id, c.document_id, c.chunk_index, c.content, c.section_label,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.document_chunks c
  where c.embedding is not null
  order by c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

REVOKE ALL ON FUNCTION public.match_document_chunks(vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, int) TO authenticated, service_role;