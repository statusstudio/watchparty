-- ==========================================================
-- pleng.online - Supabase Schema for Profiles, Follows, and Favorites
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==========================================================

-- 1. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  bio TEXT DEFAULT 'เพลิดเพลินกับเสียงดนตรีบน pleng.online 🎧',
  favorite_genres TEXT[] DEFAULT ARRAY['Lofi', 'Pop', 'Acoustic'],
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create FOLLOWS table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- 3. Create FAVORITES table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_favorite UNIQUE (user_id, video_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Anyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Follows Policies:
-- Anyone can see follow counts and relationships
CREATE POLICY "Public follows are viewable by everyone."
  ON public.follows FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others."
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow."
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Favorites Policies:
-- Public can view user favorites (for public profile display)
CREATE POLICY "Favorites are viewable by everyone."
  ON public.favorites FOR SELECT
  USING (true);

-- Authenticated users can add their own favorites
CREATE POLICY "Users can add favorites."
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their favorites."
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Auto Profile Creation Trigger upon Google / Facebook signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_name TEXT;
  raw_avatar TEXT;
  clean_username TEXT;
  user_num INT;
BEGIN
  -- Extract display name from metadata or email
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Music Lover'
  );

  -- Extract avatar from metadata
  raw_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || md5(NEW.id::text)
  );

  -- Generate friendly username from email or name
  user_num := floor(random() * 8999 + 1000)::int;
  clean_username := lower(regexp_replace(COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
  IF length(clean_username) < 3 THEN
    clean_username := 'user' || user_num::text;
  ELSE
    clean_username := clean_username || user_num::text;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (NEW.id, clean_username, raw_name, raw_avatar)
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for blazing fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
