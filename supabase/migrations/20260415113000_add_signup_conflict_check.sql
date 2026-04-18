CREATE OR REPLACE FUNCTION public.check_signup_conflicts(
  _email text DEFAULT '',
  _phone text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalized_email text := lower(trim(COALESCE(_email, '')));
  normalized_phone text := regexp_replace(COALESCE(_phone, ''), '\D', '', 'g');
  email_exists boolean := false;
  phone_exists boolean := false;
BEGIN
  IF normalized_email <> '' THEN
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE lower(email) = normalized_email
    )
    INTO email_exists;
  END IF;

  IF normalized_phone <> '' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = normalized_phone
    )
    INTO phone_exists;
  END IF;

  RETURN jsonb_build_object(
    'email_exists', email_exists,
    'phone_exists', phone_exists
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_signup_conflicts(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_signup_conflicts(text, text) TO authenticated;
