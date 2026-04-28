
-- Fix function search_path warnings
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_application_number() SET search_path = public;
ALTER FUNCTION public.sync_available_seats() SET search_path = public;

-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Make photos bucket private (was public, allowed listing)
UPDATE storage.buckets SET public = false WHERE id = 'eju-photos';
