-- 1. Balance on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0;

-- 2. Payments can be standalone top-ups
ALTER TABLE public.payments ALTER COLUMN application_id DROP NOT NULL;

-- 3. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'credit',
  description text NOT NULL DEFAULT '',
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin review function (credits balance atomically)
CREATE OR REPLACE FUNCTION public.review_payment(_payment_id uuid, _approve boolean, _amount numeric DEFAULT NULL, _note text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pay public.payments%ROWTYPE;
  _credit numeric;
  _new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO _pay FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _pay.status <> 'pending' THEN RAISE EXCEPTION 'Payment already reviewed'; END IF;

  IF _approve THEN
    _credit := COALESCE(_amount, _pay.amount, 0);
    IF _credit <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

    UPDATE public.payments SET status = 'verified', amount = _credit, updated_at = now() WHERE id = _payment_id;

    UPDATE public.profiles SET balance = balance + _credit, updated_at = now()
    WHERE user_id = _pay.user_id
    RETURNING balance INTO _new_balance;

    INSERT INTO public.transactions (user_id, amount, type, description, payment_id, balance_after)
    VALUES (_pay.user_id, _credit, 'credit', COALESCE(NULLIF(_note, ''), 'Payment approved — account topped up'), _payment_id, COALESCE(_new_balance, _credit));

    INSERT INTO public.notifications (user_id, title, message)
    VALUES (_pay.user_id, 'Payment approved', 'Your payment of ' || _credit::text || ' has been verified and added to your account balance.');
  ELSE
    UPDATE public.payments SET status = 'rejected', updated_at = now() WHERE id = _payment_id;
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (_pay.user_id, 'Payment rejected', COALESCE(NULLIF(_note, ''), 'Your payment proof could not be verified. Please submit a valid receipt.'));
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_payment(uuid, boolean, numeric, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;