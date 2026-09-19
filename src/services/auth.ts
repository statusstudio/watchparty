import { UserProfile, AuthProvider } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';

const STORAGE_KEY = 'watchparty_auth_user';

export function getStoredUser(): UserProfile {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
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
    avatar: randomAvatar,
    color: randomColor,
    provider: 'guest',
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
 * Creates or logs in a Google user profile
 */
export function createGoogleUser(name: string, email: string, avatarUrl?: string): UserProfile {
  const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

  const user: UserProfile = {
    id: 'g-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substr(0, 12),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatar: avatarUrl || defaultAvatar,
    color: randomColor,
    provider: 'google',
  };

  saveUser(user);
  return user;
}

/**
 * Parse standard Google JWT credential if available
 */
export function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
