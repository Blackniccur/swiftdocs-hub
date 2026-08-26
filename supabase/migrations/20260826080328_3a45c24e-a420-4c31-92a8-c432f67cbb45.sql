-- Revoke default PUBLIC grants on all SECURITY DEFINER / trigger functions
REVOKE ALL ON FUNCTION public.admin_credit_user(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_payment(uuid, boolean, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_balance_update() FROM PUBLIC, anon, authenticated;

-- Grant execute only where the app needs it (RLS policies + admin RPCs from signed-in clients)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_payment(uuid, boolean, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_credit_user(uuid, numeric, text, text) TO authenticated;