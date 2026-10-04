import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase credentials for Novel Platform (isolated from music/watchparty DB)
const novelSupabaseUrl = (import.meta as any).env?.VITE_NOVEL_SUPABASE_URL || 'https://placeholder-novel.supabase.co';
const novelSupabaseAnonKey = (import.meta as any).env?.VITE_NOVEL_SUPABASE_ANON_KEY || 'placeholder-novel-anon-key';

export const novelSupabase = createClient(novelSupabaseUrl, novelSupabaseAnonKey);
