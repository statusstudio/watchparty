import { UserProfile, AuthProvider } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';

const STORAGE_KEY = 'watchparty_auth_user';

export function getStoredUser(): UserProfile {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) return parsed;
    } catch (e) {
      // ignore
    }
  }

  // Generate a friendly default guest
  const randomNum = Math.floor(100 + Math.random() * 900);
  const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].svg;
  const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

  const defaultUser: UserProfile = {
    id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    name: `Guest #${randomNum}`,
    username: `guest_${randomNum}`,
    avatar: randomAvatar,
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    color: randomColor,
    provider: 'guest',
    bio: 'ผู้ฟังทั่วไปบน pleng.online',
    favoriteGenres: ['Lofi', 'Pop'],
    followersCount: 0,
    followingCount: 0,
  };

  saveUser(defaultUser);
  return defaultUser;
}

export function saveUser(user: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Creates or logs in a Google user profile (fallback/demo mode)
 */
export function createGoogleUser(name: string, email: string, avatarUrl?: string): UserProfile {
  const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(100 + Math.random() * 900);
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

  const user: UserProfile = {
    id: 'g-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substr(0, 12),
    name: name.trim(),
    username: cleanUsername,
    email: email.trim().toLowerCase(),
    avatar: avatarUrl || defaultAvatar,
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    color: randomColor,
    provider: 'google',
    bio: 'เพลิดเพลินกับเสียงดนตรีบน pleng.online 🎧',
    favoriteGenres: ['Lofi', 'Pop', 'Indie'],
    followersCount: 0,
    followingCount: 0,
  };

  saveUser(user);
  return user;
}

/**
 * Creates or logs in a Facebook user profile (fallback/demo mode)
 */
export function createFacebookUser(name: string, email?: string, avatarUrl?: string): UserProfile {
  const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  const safeSeed = email || name || 'facebook_user';
  const cleanUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(100 + Math.random() * 900);
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeSeed)}`;

  const user: UserProfile = {
    id: 'fb-' + btoa(safeSeed).replace(/[^a-zA-Z0-9]/g, '').substr(0, 12),
    name: name.trim(),
    username: cleanUsername,
    email: email ? email.trim().toLowerCase() : undefined,
    avatar: avatarUrl || defaultAvatar,
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    color: randomColor,
    provider: 'facebook',
    bio: 'รักการฟังเพลงร่วมกับเพื่อนๆ บน pleng.online 🎶',
    favoriteGenres: ['R&B', 'Pop', 'Acoustic'],
    followersCount: 0,
    followingCount: 0,
  };

  saveUser(user);
  return user;
}
