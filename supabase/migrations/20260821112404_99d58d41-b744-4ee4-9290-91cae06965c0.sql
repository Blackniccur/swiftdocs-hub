REVOKE EXECUTE ON FUNCTION public.review_payment(uuid, boolean, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_payment(uuid, boolean, numeric, text) TO authenticated;