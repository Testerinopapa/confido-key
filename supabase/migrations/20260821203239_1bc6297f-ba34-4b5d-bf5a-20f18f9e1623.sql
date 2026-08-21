GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_claim_codes TO authenticated;
GRANT ALL ON public.extension_claim_codes TO service_role;
ALTER TABLE public.extension_claim_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own claim codes" ON public.extension_claim_codes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);