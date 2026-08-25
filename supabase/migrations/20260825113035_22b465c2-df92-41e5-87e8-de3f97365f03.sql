CREATE OR REPLACE FUNCTION public.admin_credit_user(_user_id uuid, _amount numeric, _description text DEFAULT '', _type text DEFAULT 'credit')
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance numeric;
  _signed numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;
  IF _type NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;

  _signed := CASE WHEN _type = 'credit' THEN _amount ELSE -_amount END;

  UPDATE public.profiles SET balance = balance + _signed, updated_at = now()
  WHERE user_id = _user_id
  RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN RAISE EXCEPTION 'User profile not found'; END IF;

  INSERT INTO public.transactions (user_id, amount, type, description, balance_after)
  VALUES (_user_id, _amount, _type,
    COALESCE(NULLIF(_description, ''), CASE WHEN _type = 'credit' THEN 'Balance credited by admin' ELSE 'Balance debited by admin' END),
    _new_balance);

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (_user_id,
    CASE WHEN _type = 'credit' THEN 'Balance credited' ELSE 'Balance adjusted' END,
    CASE WHEN _type = 'credit' THEN 'Your account balance was credited with $' ELSE 'Your account balance was reduced by $' END
      || _amount::text || '. New balance: $' || _new_balance::text || '.');

  RETURN _new_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_credit_user(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_user(uuid, numeric, text, text) TO authenticated;