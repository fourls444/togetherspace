-- อัปเดต trigger handle_new_user ให้รองรับ username จาก metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  raw_username text;
  clean_username text;
BEGIN
  raw_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  -- ถ้ามี username จาก metadata ให้ sanitize ก่อนใช้ ไม่อย่างนั้นใช้ตัวที่สร้างจาก email
  IF raw_username IS NOT NULL THEN
    clean_username := lower(regexp_replace(raw_username, '[^a-z0-9_]', '', 'gi'));
    -- ต้องมีอย่างน้อย 3 ตัวอักษร ไม่อย่างนั้น fallback
    IF length(clean_username) < 3 THEN
      clean_username := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    coalesce(clean_username, public.profile_username(new.email, new.id)),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'TogetherSpace user'
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- ถ้า username จาก metadata ชนกับของคนอื่น ให้ลองต่อท้ายด้วย suffix
  -- (อ่านผ่าน CONFLICT handler อีกครั้งด้วย suffix)
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
      new.id,
      public.profile_username(new.email, new.id),
      coalesce(
        nullif(new.raw_user_meta_data ->> 'display_name', ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'TogetherSpace user'
      ),
      nullif(new.raw_user_meta_data ->> 'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- RPC สำหรับอัปเดตโปรไฟล์ตัวเอง (display_name, avatar_url, username)
CREATE OR REPLACE FUNCTION public.update_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_username text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  clean_username text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_username IS NOT NULL THEN
    clean_username := lower(regexp_replace(trim(p_username), '[^a-z0-9_]', '', 'g'));
    IF length(clean_username) < 3 OR length(clean_username) > 30 THEN
      RAISE EXCEPTION 'username must be between 3 and 30 characters (a-z, 0-9, _)' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.profiles
  SET
    display_name = CASE WHEN p_display_name IS NOT NULL THEN trim(p_display_name) ELSE display_name END,
    avatar_url   = CASE WHEN p_avatar_url IS NOT NULL THEN nullif(trim(p_avatar_url), '') ELSE avatar_url END,
    username     = CASE WHEN p_username IS NOT NULL THEN clean_username ELSE username END
  WHERE id = current_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile(text, text, text) TO authenticated;
