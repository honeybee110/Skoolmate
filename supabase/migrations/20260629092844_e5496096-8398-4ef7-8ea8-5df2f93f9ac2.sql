
-- IEP goals — replace permissive write policies with auth.uid() checks
DROP POLICY IF EXISTS "Authenticated users can insert IEP goals" ON public.iep_goals;
DROP POLICY IF EXISTS "Authenticated users can update IEP goals" ON public.iep_goals;
DROP POLICY IF EXISTS "Authenticated users can delete IEP goals" ON public.iep_goals;

CREATE POLICY "Signed-in users can insert IEP goals"
  ON public.iep_goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can update IEP goals"
  ON public.iep_goals FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can delete IEP goals"
  ON public.iep_goals FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Action queue — same tightening
DROP POLICY IF EXISTS "Authenticated users can insert action queue" ON public.action_queue;
DROP POLICY IF EXISTS "Authenticated users can update action queue" ON public.action_queue;
DROP POLICY IF EXISTS "Authenticated users can delete action queue" ON public.action_queue;

CREATE POLICY "Signed-in users can insert action queue"
  ON public.action_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can update action queue"
  ON public.action_queue FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can delete action queue"
  ON public.action_queue FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
