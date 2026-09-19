export interface PresetAvatar {
  id: string;
  name: string;
  svg: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'cyber-gamer',
    name: 'Cyber Gamer',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g1)"/><circle cx="50" cy="45" r="24" fill="%231e1b4b"/><rect x="30" y="42" width="40" height="14" rx="7" fill="%2306b6d4"/><circle cx="42" cy="49" r="4" fill="%23ffffff"/><circle cx="58" cy="49" r="4" fill="%23ffffff"/><path d="M22 46 C22 30 78 30 78 46" stroke="%23ec4899" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="18" y="42" width="8" height="14" rx="4" fill="%23ec4899"/><rect x="74" y="42" width="8" height="14" rx="4" fill="%23ec4899"/><path d="M28 86 C32 70 68 70 72 86" fill="%230f172a"/></svg>`,
  },
  {
    id: 'anime-star',
    name: 'Anime Star',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%23fb923c"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g2)"/><circle cx="50" cy="46" r="22" fill="%23fed7aa"/><path d="M28 42 C32 20 68 20 72 42 C65 35 55 35 50 40 C45 35 35 35 28 42 Z" fill="%23431407"/><circle cx="42" cy="46" r="3" fill="%23431407"/><circle cx="58" cy="46" r="3" fill="%23431407"/><circle cx="40" cy="44" r="1.2" fill="%23ffffff"/><circle cx="56" cy="44" r="1.2" fill="%23ffffff"/><path d="M46 54 Q50 58 54 54" stroke="%23e11d48" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="36" cy="51" r="3" fill="%23f43f5e" opacity="0.4"/><circle cx="64" cy="51" r="3" fill="%23f43f5e" opacity="0.4"/><path d="M26 88 C32 72 68 72 74 88" fill="%23ffffff"/></svg>`,
  },
  {
    id: 'dj-beats',
    name: 'DJ Beats',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g3)"/><circle cx="50" cy="46" r="22" fill="%230f172a"/><path d="M25 45 C25 25 75 25 75 45" stroke="%2338bdf8" stroke-width="5" fill="none"/><rect x="20" y="40" width="10" height="18" rx="5" fill="%23f59e0b"/><rect x="70" y="40" width="10" height="18" rx="5" fill="%23f59e0b"/><line x1="40" y1="47" x2="46" y2="47" stroke="%2310b981" stroke-width="3" stroke-linecap="round"/><line x1="54" y1="47" x2="60" y2="47" stroke="%2310b981" stroke-width="3" stroke-linecap="round"/><path d="M44 56 Q50 60 56 56" stroke="%2338bdf8" stroke-width="2.5" fill="none"/><path d="M28 88 C34 72 66 72 72 88" fill="%231e293b"/></svg>`,
  },
  {
    id: 'chill-panda',
    name: 'Chill Panda',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g4)"/><circle cx="34" cy="30" r="9" fill="%231e293b"/><circle cx="66" cy="30" r="9" fill="%231e293b"/><circle cx="50" cy="50" r="26" fill="%23f8fafc"/><ellipse cx="40" cy="46" rx="6" ry="8" fill="%231e293b" transform="rotate(-15 40 46)"/><ellipse cx="60" cy="46" rx="6" ry="8" fill="%231e293b" transform="rotate(15 60 46)"/><circle cx="41" cy="45" r="2" fill="%23ffffff"/><circle cx="59" cy="45" r="2" fill="%23ffffff"/><ellipse cx="50" cy="56" rx="4" ry="3" fill="%231e293b"/><path d="M46 62 Q50 65 54 62" stroke="%231e293b" stroke-width="2" fill="none"/><path d="M25 90 C32 75 68 75 75 90" fill="%231e293b"/></svg>`,
  },
  {
    id: 'retro-synth',
    name: 'Retro Synth',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%23fbbf24"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="%2309090b"/><circle cx="50" cy="45" r="25" fill="url(%23g5)"/><line x1="25" y1="42" x2="75" y2="42" stroke="%2309090b" stroke-width="2"/><line x1="28" y1="48" x2="72" y2="48" stroke="%2309090b" stroke-width="2.5"/><line x1="33" y1="54" x2="67" y2="54" stroke="%2309090b" stroke-width="3"/><polygon points="50,22 60,42 40,42" fill="%23ffffff" opacity="0.8"/><path d="M20 92 C30 76 70 76 80 92" fill="%2306b6d4"/></svg>`,
  },
  {
    id: 'neon-cat',
    name: 'Neon Mecha Cat',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g6)"/><polygon points="30,22 45,38 25,40" fill="%2338bdf8"/><polygon points="70,22 75,40 55,38" fill="%2338bdf8"/><circle cx="50" cy="52" r="25" fill="%230f172a"/><polygon points="36,46 44,48 38,52" fill="%2338bdf8"/><polygon points="64,46 62,52 56,48" fill="%2338bdf8"/><circle cx="40" cy="48" r="1.5" fill="%23ffffff"/><circle cx="60" cy="48" r="1.5" fill="%23ffffff"/><polygon points="50,56 47,59 53,59" fill="%23ec4899"/><line x1="32" y1="58" x2="22" y2="56" stroke="%23ec4899" stroke-width="1.5"/><line x1="32" y1="61" x2="23" y2="63" stroke="%23ec4899" stroke-width="1.5"/><line x1="68" y1="58" x2="78" y2="56" stroke="%23ec4899" stroke-width="1.5"/><line x1="68" y1="61" x2="77" y2="63" stroke="%23ec4899" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'astronaut',
    name: 'Astro Explorer',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230d9488"/></linearGradient><linearGradient id="visor" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g7)"/><circle cx="50" cy="46" r="24" fill="%23f1f5f9"/><rect x="34" y="38" width="32" height="18" rx="9" fill="url(%23visor)"/><path d="M38 41 Q44 43 48 41" stroke="%23ffffff" stroke-width="2" fill="none" opacity="0.8"/><circle cx="24" cy="46" r="4" fill="%2394a3b8"/><circle cx="76" cy="46" r="4" fill="%2394a3b8"/><path d="M26 88 C32 72 68 72 74 88" fill="%23e2e8f0"/></svg>`,
  },
  {
    id: 'pixel-hero',
    name: 'Pixel Hero',
    svg: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23e11d48"/><stop offset="100%" stop-color="%237c3aed"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g8)"/><rect x="30" y="24" width="40" height="20" fill="%231e293b"/><rect x="34" y="44" width="32" height="24" fill="%23fed7aa"/><rect x="38" y="48" width="6" height="6" fill="%230f172a"/><rect x="56" y="48" width="6" height="6" fill="%230f172a"/><rect x="46" y="58" width="8" height="4" fill="%23e11d48"/><rect x="24" y="70" width="52" height="20" fill="%233b82f6"/></svg>`,
  }
];

export const COLOR_PALETTE = [
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#a855f7', // Violet
];

export interface CuratedVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

export const SAMPLE_VIDEOS: CuratedVideo[] = [
  {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    channel: 'Lofi Girl',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 'LIVE',
  },
  {
    videoId: '5yx6BWlEVcY',
    title: 'Chillhop Radio - jazzy & lofi hip hop beats',
    channel: 'Chillhop Music',
    thumbnail: 'https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg',
    duration: 'LIVE',
  },
  {
    videoId: '4xDzrJKXOOY',
    title: 'synthwave radio - chill synth / retro beats',
    channel: 'Lofi Girl',
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    duration: 'LIVE',
  },
  {
    videoId: 'rUxyKA_-Ys4',
    title: 'Ghibli Music with Rain Sound 🌧️ Relaxing Piano',
    channel: 'Ghibli Music',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=320&auto=format&fit=crop&q=80',
    duration: '3:24:10',
  },
  {
    videoId: 'WNeLUngb-Xg',
    title: 'Linkin Park - In the End (Official HD Video)',
    channel: 'Linkin Park',
    thumbnail: 'https://i.ytimg.com/vi/WNeLUngb-Xg/hqdefault.jpg',
    duration: '3:39',
  },
  {
    videoId: 'kXYiU_JCYtU',
    title: 'Numb (Official Music Video) [4K Upgrade] - Linkin Park',
    channel: 'Linkin Park',
    thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    duration: '3:07',
  }
];

export interface RoomCategoryOption {
  id: import('../types/index.js').RoomCategory;
  label: string;
  icon: string;
  description: string;
}

export const ROOM_CATEGORIES: RoomCategoryOption[] = [
  { id: 'music', label: 'ฟังเพลง / ชิลล์', icon: '🎵', description: 'เปิดเพลงชิลล์ๆ Lofi, Acoustic, Pop, EDM' },
  { id: 'gaming', label: 'เล่นเกม / สตรีม', icon: '🎮', description: 'พูดคุย เล่นเกม Co-op หรือดูสตรีมเมอร์' },
  { id: 'anime_movie', label: 'ดูหนัง / อนิเมะ', icon: '🎬', description: 'ดูภาพยนตร์ แอนิเมชั่น ซีรีส์' },
  { id: 'talk', label: 'พูดคุย / พอดแคสต์', icon: '🎙️', description: 'ล้อมวงคุย สัมมนา ทอล์กโชว์' },
  { id: 'study_work', label: 'อ่านหนังสือ / ทำงาน', icon: '📚', description: 'Co-working space ฟังเพลงโฟกัสงาน' },
  { id: 'entertainment', label: 'บันเทิง / วาไรตี้', icon: '🎪', description: 'คลิปตลก รายการทีวี แข่งขัน' },
  { id: 'general', label: 'สัพเพเหระ / ทั่วไป', icon: '☕', description: 'ห้องอิสระ คุยได้ทุกเรื่อง' },
];

export interface PresetCover {
  id: string;
  name: string;
  url: string;
}

export const PRESET_ROOM_COVERS: PresetCover[] = [
  {
    id: 'lofi-room',
    name: 'Lofi Cozy Room',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'cafe-vibes',
    name: 'Cozy Cafe',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'night-city',
    name: 'Tokyo Night',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'cinema',
    name: 'Cinema Lounge',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'space-stars',
    name: 'Galaxy Stars',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'retro-synth',
    name: 'Retro Sunset',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'nature-chill',
    name: 'Nature Cabin',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  },
];
