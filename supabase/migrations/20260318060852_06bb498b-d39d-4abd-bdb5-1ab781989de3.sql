
-- Chat messages table for live chat between admin and client
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view chat messages for their own applications
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid())
);

-- Users can send chat messages for their own applications
CREATE POLICY "Users can send chat messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can send chat messages
CREATE POLICY "Admins can send chat messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND public.has_role(auth.uid(), 'admin')
);

-- Admins can update chat messages (mark as read)
CREATE POLICY "Admins can update chat messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can update own received messages (mark as read)
CREATE POLICY "Users can mark messages as read"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
