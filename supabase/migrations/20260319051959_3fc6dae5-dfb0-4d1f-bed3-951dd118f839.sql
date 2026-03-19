-- Allow bot (sender_id = 00000000-0000-0000-0000-000000000000) to insert messages via service role
-- No schema change needed, but we need to update the RLS to allow the bot sender
-- The edge function uses service_role_key which bypasses RLS, so no policy changes needed.
-- We just need to drop the FK constraint if there is one on sender_id (there isn't based on schema).
-- This is a no-op migration to document the bot sender approach.
SELECT 1;
