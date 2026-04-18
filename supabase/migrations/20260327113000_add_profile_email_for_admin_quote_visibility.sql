ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text DEFAULT '';

UPDATE public.profiles p
SET email = COALESCE(u.email, '')
FROM auth.users u
WHERE u.id = p.user_id
  AND COALESCE(p.email, '') = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
