/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, FavoriteSong } from '../types/index.js';

// Environment variables from Vite (.env or Render.com)
const env = (import.meta as any).env || {};
const SUPABASE_URL = (env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY.length > 20
  );
};

// Supabase client instance (or null if unconfigured)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ============================================================
// Authentication Functions
// ============================================================

/**
 * Sign in with Google Account via Supabase OAuth
 */
export async function signInWithGoogle() {
  if (!supabase) {
    console.warn('Supabase not configured. Using local guest mode.');
    return { error: new Error('Supabase ยังไม่ได้เชื่อมต่อ Environment Variables') };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

/**
 * Sign in with Facebook Account via Supabase OAuth
 */
export async function signInWithFacebook() {
  if (!supabase) {
    console.warn('Supabase not configured. Using local guest mode.');
    return { error: new Error('Supabase ยังไม่ได้เชื่อมต่อ Environment Variables') };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: window.location.origin,
    },
  });
}

/**
 * Sign out from Supabase session
 */
export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('watchparty_auth_user');
}

// ============================================================
// Profile Management
// ============================================================

/**
 * Fetch member profile by user ID or username
 */
export async function fetchProfile(userId: string, currentUserId?: string): Promise<UserProfile | null> {
  // 1. Try backend server API first (centralized real-time storage, always accurate across all devices)
  try {
    const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : '';
    const res = await fetch(`/api/users/profile/${encodeURIComponent(userId)}${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return {
          ...data,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          isFollowing: Boolean(data.isFollowing),
        };
      }
    }
  } catch (e) {
    // server unreachable, fall through to Supabase / Local
  }

  // 2. Try Supabase if configured
  if (supabase) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        const [followersRes, followingRes, isFollowingRes] = await Promise.all([
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
          currentUserId && currentUserId !== userId
            ? supabase
                .from('follows')
                .select('id')
                .eq('follower_id', currentUserId)
                .eq('following_id', userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        return {
          id: profile.id,
          name: profile.display_name || 'Music Lover',
          username: profile.username || `user_${profile.id.slice(0, 5)}`,
          avatar: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`,
          bannerUrl: profile.banner_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          color: '#ec4899',
          bio: profile.bio || 'เพลิดเพลินกับเสียงดนตรีบน pleng.online 🎧',
          favoriteGenres: profile.favorite_genres || ['Lofi', 'Pop', 'Acoustic'],
          socialLinks: profile.social_links || {},
          followersCount: followersRes.count || 0,
          followingCount: followingRes.count || 0,
          isFollowing: Boolean(isFollowingRes?.data),
          createdAt: new Date(profile.created_at).getTime(),
        };
      }
    } catch (err) {
      console.error('Supabase fetchProfile error:', err);
    }
  }

  // 3. Fallback from localStorage
  const local = localStorage.getItem(`profile_${userId}`);
  const isFollowed = currentUserId ? localStorage.getItem(`follow_${currentUserId}_${userId}`) === '1' : false;
  if (local) {
    try {
      const parsed = JSON.parse(local);
      return {
        ...parsed,
        isFollowing: isFollowed,
        followersCount: isFollowed ? (parsed.followersCount || 0) + 1 : (parsed.followersCount || 0),
      };
    } catch (e) {}
  }

  return {
    id: userId,
    name: 'Music Lover',
    username: `user_${userId.slice(0, 5)}`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
    color: '#ec4899',
    followersCount: isFollowed ? 1 : 0,
    followingCount: 0,
    isFollowing: isFollowed,
  };
}

/**
 * Update member profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: any }> {
  if (!supabase) {
    // Local fallback
    const key = `profile_${userId}`;
    const existing = localStorage.getItem(key);
    const prev = existing ? JSON.parse(existing) : {};
    const updated = { ...prev, ...updates };
    localStorage.setItem(key, JSON.stringify(updated));
    return { success: true };
  }

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.display_name = updates.name;
    if (updates.username !== undefined) {
      // sanitize username (lowercase alphanumeric and underscore only)
      payload.username = updates.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
    if (updates.bannerUrl !== undefined) payload.banner_url = updates.bannerUrl;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.favoriteGenres !== undefined) payload.favorite_genres = updates.favoriteGenres;
    if (updates.socialLinks !== undefined) payload.social_links = updates.socialLinks;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('updateProfile error:', err);
    return { success: false, error: err.message || 'บันทึกข้อมูลไม่สำเร็จ' };
  }
}

// ============================================================
// Follow System
// ============================================================

/**
 * Toggle follow/unfollow a user
 */
export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return false;

  const key = `follow_${currentUserId}_${targetUserId}`;
  const wasFollowed = localStorage.getItem(key) === '1';
  const optimisticStatus = !wasFollowed;

  if (optimisticStatus) {
    localStorage.setItem(key, '1');
  } else {
    localStorage.removeItem(key);
  }

  // 1. Sync with backend server API (persisted across all users & devices)
  try {
    const res = await fetch('/api/users/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUserId, followingId: targetUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.isFollowing === 'boolean') {
        if (data.isFollowing) {
          localStorage.setItem(key, '1');
        } else {
          localStorage.removeItem(key);
        }
        return data.isFollowing;
      }
    }
  } catch (err) {
    console.warn('Backend follow sync error:', err);
  }

  // 2. Sync with Supabase if configured
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (existing) {
        await supabase.from('follows').delete().eq('id', existing.id);
        localStorage.removeItem(key);
        return false;
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });
        localStorage.setItem(key, '1');
        return true;
      }
    } catch (err) {
      console.error('Supabase toggleFollow error:', err);
    }
  }

  return optimisticStatus;
}

// ============================================================
// Favorites / Saved Songs
// ============================================================

/**
 * Fetch favorite songs for a user
 */
export async function fetchFavorites(userId: string): Promise<FavoriteSong[]> {
  if (!supabase) {
    const raw = localStorage.getItem(`favorites_${userId}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      videoId: item.video_id,
      title: item.title,
      channel: item.channel || '',
      thumbnail: item.thumbnail || '',
      duration: item.duration || '',
      createdAt: new Date(item.created_at).getTime(),
    }));
  } catch (err) {
    console.error('fetchFavorites error:', err);
    return [];
  }
}

/**
 * Add song to favorites
 */
export async function addFavorite(
  userId: string,
  song: { videoId: string; title: string; channel?: string; thumbnail?: string; duration?: string }
): Promise<FavoriteSong | null> {
  if (!supabase) {
    const key = `favorites_${userId}`;
    const raw = localStorage.getItem(key);
    const list: FavoriteSong[] = raw ? JSON.parse(raw) : [];
    if (list.some((s) => s.videoId === song.videoId)) {
      return null; // already added
    }
    const newFav: FavoriteSong = {
      id: 'fav-' + Date.now(),
      userId,
      videoId: song.videoId,
      title: song.title,
      channel: song.channel || '',
      thumbnail: song.thumbnail || '',
      duration: song.duration || '',
      createdAt: Date.now(),
    };
    list.unshift(newFav);
    localStorage.setItem(key, JSON.stringify(list));
    return newFav;
  }

  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        video_id: song.videoId,
        title: song.title,
        channel: song.channel || '',
        thumbnail: song.thumbnail || '',
        duration: song.duration || '',
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      videoId: data.video_id,
      title: data.title,
      channel: data.channel || '',
      thumbnail: data.thumbnail || '',
      duration: data.duration || '',
      createdAt: new Date(data.created_at).getTime(),
    };
  } catch (err) {
    console.error('addFavorite error:', err);
    return null;
  }
}

/**
 * Remove song from favorites
 */
export async function removeFavorite(userId: string, videoId: string): Promise<boolean> {
  if (!supabase) {
    const key = `favorites_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return true;
    const list: FavoriteSong[] = JSON.parse(raw);
    const filtered = list.filter((s) => s.videoId !== videoId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  }

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);
    return !error;
  } catch (err) {
    console.error('removeFavorite error:', err);
    return false;
  }
}

/**
 * Check if a song is favorited
 */
export async function checkIsFavorite(userId: string, videoId: string): Promise<boolean> {
  if (!supabase) {
    const raw = localStorage.getItem(`favorites_${userId}`);
    if (!raw) return false;
    const list: FavoriteSong[] = JSON.parse(raw);
    return list.some((s) => s.videoId === videoId);
  }

  try {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();

    return Boolean(data);
  } catch (err) {
    return false;
  }
}
