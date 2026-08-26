-- 1. Deliverables storage: ownership check
DROP POLICY IF EXISTS "Users can view own deliverables files" ON storage.objects;
CREATE POLICY "Users can view own deliverables files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deliverables' AND EXISTS (
    SELECT 1 FROM public.deliverables d
    WHERE d.file_path = name AND d.user_id = auth.uid()
  )
);

-- 2. user_roles: restrict writes to admins only
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. profiles: prevent non-admins from modifying balance
CREATE OR REPLACE FUNCTION public.prevent_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.balance IS DISTINCT FROM OLD.balance
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Balance can only be modified by administrators';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_balance_update_trigger ON public.profiles;
CREATE TRIGGER prevent_balance_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_balance_update();

-- 4. transactions: explicit admin-only write policies
CREATE POLICY "Admins can insert transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Revoke EXECUTE on SECURITY DEFINER functions from anon; tighten authenticated
REVOKE EXECUTE ON FUNCTION public.admin_credit_user(uuid, numeric, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_payment(uuid, boolean, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_balance_update() FROM anon, authenticated;