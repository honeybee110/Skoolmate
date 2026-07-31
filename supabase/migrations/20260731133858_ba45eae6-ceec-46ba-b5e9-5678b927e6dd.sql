CREATE POLICY "leadership_alert_deliveries_insert" ON public.leadership_alert_deliveries
FOR INSERT TO authenticated
WITH CHECK (public.in_group(auth.uid(), 'leadership') OR public.in_group(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));