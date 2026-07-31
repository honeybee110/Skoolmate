CREATE TABLE public.ask_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ask_threads TO authenticated;
GRANT ALL ON public.ask_threads TO service_role;

ALTER TABLE public.ask_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ask_threads_owner_select" ON public.ask_threads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ask_threads_owner_insert" ON public.ask_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ask_threads_owner_update" ON public.ask_threads FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ask_threads_owner_delete" ON public.ask_threads FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER ask_threads_set_updated_at
BEFORE UPDATE ON public.ask_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ask_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.ask_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ask_messages_thread_created_idx ON public.ask_messages (thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ask_messages TO authenticated;
GRANT ALL ON public.ask_messages TO service_role;

ALTER TABLE public.ask_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ask_messages_owner_select" ON public.ask_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ask_messages_owner_insert" ON public.ask_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.ask_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "ask_messages_owner_delete" ON public.ask_messages FOR DELETE TO authenticated USING (user_id = auth.uid());