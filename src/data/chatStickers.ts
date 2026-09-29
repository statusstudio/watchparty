import React from 'react';

export interface AnimatedSticker {
  id: string;
  name: string;
  category: string;
  svg: string; // inline SVG string
  animationClass: string;
}

// 10 Cute Animated Character Stickers (ดุ๊กดิ๊ก ดุ๊กดิ๊ก)
export const CUTE_ANIMATED_STICKERS: AnimatedSticker[] = [
  {
    id: 'sticker-cat-heart',
    name: 'น้องแมวส่งหัวใจ',
    category: 'รัก',
    animationClass: 'animate-sticker-bounce',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="catPink" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#FFF0F5" />
          <stop offset="100%" stop-color="#FFD1DC" />
        </radialGradient>
      </defs>
      <!-- Ears -->
      <polygon points="26,38 18,12 42,26" fill="#FFAEC9" stroke="#5C3A21" stroke-width="3" stroke-linejoin="round" />
      <polygon points="27,33 22,17 38,26" fill="#FF8DA1" />
      <polygon points="74,38 82,12 58,26" fill="#FFAEC9" stroke="#5C3A21" stroke-width="3" stroke-linejoin="round" />
      <polygon points="73,33 78,17 62,26" fill="#FF8DA1" />
      <!-- Head Body -->
      <ellipse cx="50" cy="54" rx="36" ry="32" fill="url(#catPink)" stroke="#5C3A21" stroke-width="3.5" />
      <!-- Cute Eyes (Happy squint) -->
      <path d="M32 48 Q38 42 44 48" stroke="#5C3A21" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <path d="M56 48 Q62 42 68 48" stroke="#5C3A21" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Cheeks Blush -->
      <circle cx="28" cy="56" r="6" fill="#FF708A" opacity="0.65" />
      <circle cx="72" cy="56" r="6" fill="#FF708A" opacity="0.65" />
      <!-- Nose & Mouth -->
      <polygon points="50,54 47,51 53,51" fill="#FF708A" />
      <path d="M47 54 Q44 59 40 57" stroke="#5C3A21" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M53 54 Q56 59 60 57" stroke="#5C3A21" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <!-- Whiskers -->
      <line x1="16" y1="52" x2="26" y2="53" stroke="#5C3A21" stroke-width="2" stroke-linecap="round" />
      <line x1="15" y1="58" x2="25" y2="57" stroke="#5C3A21" stroke-width="2" stroke-linecap="round" />
      <line x1="84" y1="52" x2="74" y2="53" stroke="#5C3A21" stroke-width="2" stroke-linecap="round" />
      <line x1="85" y1="58" x2="75" y2="57" stroke="#5C3A21" stroke-width="2" stroke-linecap="round" />
      <!-- Big Beating Heart Paws -->
      <g class="sticker-heart-beat">
        <path d="M50 72 C50 63 36 60 36 71 C36 78 50 87 50 87 C50 87 64 78 64 71 C64 60 50 63 50 72 Z" fill="#FF2E63" stroke="#5C3A21" stroke-width="2" />
        <ellipse cx="44" cy="68" rx="2" ry="4" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 44 68)" />
      </g>
      <!-- Tiny Sparkle -->
      <path d="M78 28 Q82 30 84 34 Q86 30 90 28 Q86 26 84 22 Q82 26 78 28 Z" fill="#FFD700" />
    </svg>`,
  },
  {
    id: 'sticker-rabbit-party',
    name: 'กระต่ายเต้นดุ๊กดิ๊ก',
    category: 'เต้น/มันส์',
    animationClass: 'animate-sticker-wiggle',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Long Ears with Wiggle -->
      <ellipse cx="34" cy="22" rx="9" ry="22" fill="#FFFFFF" stroke="#4A3425" stroke-width="3" transform="rotate(-12 34 22)" />
      <ellipse cx="34" cy="22" rx="5" ry="15" fill="#FFB7C5" transform="rotate(-12 34 22)" />
      <ellipse cx="66" cy="22" rx="9" ry="22" fill="#FFFFFF" stroke="#4A3425" stroke-width="3" transform="rotate(12 66 22)" />
      <ellipse cx="66" cy="22" rx="5" ry="15" fill="#FFB7C5" transform="rotate(12 66 22)" />
      <!-- Head Body -->
      <circle cx="50" cy="58" r="32" fill="#FFFFFF" stroke="#4A3425" stroke-width="3.5" />
      <!-- Music Notes -->
      <path d="M14 36 Q16 28 22 28 L22 34" stroke="#8A2BE2" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <circle cx="14" cy="36" r="3" fill="#8A2BE2" />
      <path d="M84 32 Q86 24 92 24 L92 30" stroke="#FF1493" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <circle cx="84" cy="32" r="3" fill="#FF1493" />
      <!-- Sparkling Big Eyes -->
      <ellipse cx="38" cy="55" rx="5.5" ry="7" fill="#4A3425" />
      <circle cx="36" cy="52" r="2.5" fill="#FFFFFF" />
      <circle cx="40" cy="57" r="1.2" fill="#FFFFFF" />
      <ellipse cx="62" cy="55" rx="5.5" ry="7" fill="#4A3425" />
      <circle cx="60" cy="52" r="2.5" fill="#FFFFFF" />
      <circle cx="64" cy="57" r="1.2" fill="#FFFFFF" />
      <!-- Rosy Cheeks -->
      <ellipse cx="28" cy="64" rx="5" ry="3.5" fill="#FF6B8B" opacity="0.6" />
      <ellipse cx="72" cy="64" rx="5" ry="3.5" fill="#FF6B8B" opacity="0.6" />
      <!-- Tiny nose & Happy open mouth -->
      <ellipse cx="50" cy="61" rx="2" ry="1.5" fill="#FF6B8B" />
      <path d="M46 65 Q50 74 54 65 Z" fill="#FF4757" stroke="#4A3425" stroke-width="2" />
      <!-- Little Paws up -->
      <ellipse cx="24" cy="74" rx="6" ry="8" fill="#FFFFFF" stroke="#4A3425" stroke-width="2.5" transform="rotate(-30 24 74)" />
      <ellipse cx="76" cy="74" rx="6" ry="8" fill="#FFFFFF" stroke="#4A3425" stroke-width="2.5" transform="rotate(30 76 74)" />
    </svg>`,
  },
  {
    id: 'sticker-bear-headphones',
    name: 'หมีน้อยโยกตามเพลง',
    category: 'ฟังเพลง',
    animationClass: 'animate-sticker-headbang',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Bear Ears -->
      <circle cx="25" cy="32" r="12" fill="#C68B59" stroke="#45260A" stroke-width="3" />
      <circle cx="25" cy="32" r="6" fill="#E8B88A" />
      <circle cx="75" cy="32" r="12" fill="#C68B59" stroke="#45260A" stroke-width="3" />
      <circle cx="75" cy="32" r="6" fill="#E8B88A" />
      <!-- Head Body -->
      <circle cx="50" cy="55" r="32" fill="#C68B59" stroke="#45260A" stroke-width="3.5" />
      <!-- Snout -->
      <ellipse cx="50" cy="63" rx="14" ry="11" fill="#FDF3E7" stroke="#45260A" stroke-width="2" />
      <ellipse cx="50" cy="59" rx="4.5" ry="3" fill="#45260A" />
      <path d="M47 64 Q50 67 53 64" stroke="#45260A" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Vibing Closed Eyes -->
      <path d="M34 50 Q40 45 44 50" stroke="#45260A" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M56 50 Q60 45 66 50" stroke="#45260A" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Cheeks -->
      <circle cx="30" cy="59" r="4.5" fill="#FF8C94" opacity="0.7" />
      <circle cx="70" cy="59" r="4.5" fill="#FF8C94" opacity="0.7" />
      <!-- DJ Headphones -->
      <path d="M18 52 C18 24 82 24 82 52" stroke="#3742FA" stroke-width="5" stroke-linecap="round" fill="none" />
      <rect x="12" y="44" width="12" height="20" rx="6" fill="#2ED573" stroke="#45260A" stroke-width="2.5" />
      <rect x="76" y="44" width="12" height="20" rx="6" fill="#2ED573" stroke="#45260A" stroke-width="2.5" />
      <!-- Sound waves -->
      <path d="M6 50 Q3 54 6 58" stroke="#3742FA" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M94 50 Q97 54 94 58" stroke="#3742FA" stroke-width="2" stroke-linecap="round" fill="none" />
    </svg>`,
  },
  {
    id: 'sticker-shiba-cheer',
    name: 'ชิบะปรบมือรัวๆ',
    category: 'ยินดี',
    animationClass: 'animate-sticker-bounce',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Shiba Ears -->
      <polygon points="26,38 20,16 46,26" fill="#E67E22" stroke="#5D3A1A" stroke-width="3" stroke-linejoin="round" />
      <polygon points="28,34 24,22 42,27" fill="#FDF3E7" />
      <polygon points="74,38 80,16 54,26" fill="#E67E22" stroke="#5D3A1A" stroke-width="3" stroke-linejoin="round" />
      <polygon points="72,34 76,22 58,27" fill="#FDF3E7" />
      <!-- Head Base -->
      <circle cx="50" cy="54" r="32" fill="#E67E22" stroke="#5D3A1A" stroke-width="3.5" />
      <!-- White Cheeks/Mask -->
      <path d="M22 62 C22 46 36 40 50 48 C64 40 78 46 78 62 C78 78 66 84 50 84 C34 84 22 78 22 62 Z" fill="#FFFFFF" />
      <!-- Brow dots -->
      <circle cx="36" cy="40" r="3" fill="#FFFFFF" />
      <circle cx="64" cy="40" r="3" fill="#FFFFFF" />
      <!-- Wink & Eye -->
      <circle cx="38" cy="50" r="4.5" fill="#5D3A1A" />
      <circle cx="36.5" cy="48.5" r="1.5" fill="#FFFFFF" />
      <path d="M58 50 Q63 46 68 50" stroke="#5D3A1A" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Nose & Happy Open Smile -->
      <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill="#5D3A1A" />
      <path d="M44 62 Q50 73 56 62 Z" fill="#FF5252" stroke="#5D3A1A" stroke-width="2" />
      <ellipse cx="50" cy="67" rx="3" ry="2" fill="#FF7979" />
      <!-- Cheeks -->
      <circle cx="28" cy="60" r="4.5" fill="#FFA502" opacity="0.6" />
      <circle cx="72" cy="60" r="4.5" fill="#FFA502" opacity="0.6" />
      <!-- Clapping Paws -->
      <ellipse cx="40" cy="80" rx="7" ry="6" fill="#FFFFFF" stroke="#5D3A1A" stroke-width="2" />
      <ellipse cx="60" cy="80" rx="7" ry="6" fill="#FFFFFF" stroke="#5D3A1A" stroke-width="2" />
      <!-- Star Sparkles -->
      <path d="M84 26 L86 32 L92 34 L86 36 L84 42 L82 36 L76 34 L82 32 Z" fill="#FFD700" />
    </svg>`,
  },
  {
    id: 'sticker-ghost-chill',
    name: 'ผีน้อย The Ghost',
    category: 'ฟังเรื่องผี',
    animationClass: 'animate-sticker-float',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Glow -->
      <circle cx="50" cy="50" r="42" fill="#A8FF78" opacity="0.2" filter="blur(4px)" />
      <!-- Ghost Body -->
      <path d="M26 52 C26 26 74 26 74 52 C74 72 78 84 70 82 C64 80 60 86 54 83 C48 80 44 86 38 83 C32 80 28 85 24 82 C20 78 26 68 26 52 Z" fill="#F8FAFC" stroke="#334155" stroke-width="3" />
      <!-- Ghost Eyes -->
      <ellipse cx="40" cy="46" rx="4.5" ry="6.5" fill="#1E293B" />
      <circle cx="38" cy="43.5" r="2" fill="#FFFFFF" />
      <ellipse cx="60" cy="46" rx="4.5" ry="6.5" fill="#1E293B" />
      <circle cx="58" cy="43.5" r="2" fill="#FFFFFF" />
      <!-- Cute Spooky O-Mouth -->
      <ellipse cx="50" cy="57" rx="3.5" ry="5.5" fill="#1E293B" />
      <!-- Cheeks Blush -->
      <circle cx="32" cy="54" r="4" fill="#6EE7B7" opacity="0.6" />
      <circle cx="68" cy="54" r="4" fill="#6EE7B7" opacity="0.6" />
      <!-- Little floating hands -->
      <ellipse cx="20" cy="58" rx="5" ry="4" fill="#F8FAFC" stroke="#334155" stroke-width="2" />
      <ellipse cx="80" cy="58" rx="5" ry="4" fill="#F8FAFC" stroke="#334155" stroke-width="2" />
      <!-- Candle or Will-o-wisp -->
      <circle cx="82" cy="30" r="4" fill="#38BDF8" />
      <path d="M82 24 C84 27 86 28 82 32 C78 28 80 27 82 24 Z" fill="#67E8F9" />
    </svg>`,
  },
  {
    id: 'sticker-duck-sing',
    name: 'เป็ดน้อยร้องคาราโอเกะ',
    category: 'ร้องเพลง',
    animationClass: 'animate-sticker-jiggle',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Duck Head Body -->
      <circle cx="50" cy="54" r="33" fill="#FFEB3B" stroke="#6D4C41" stroke-width="3.5" />
      <!-- Little Tuft of Hair -->
      <path d="M50 21 Q52 11 58 15 Q54 19 53 22" fill="#FFEB3B" stroke="#6D4C41" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Big Cute Eyes (Singing with eyes shut happy) -->
      <path d="M32 46 Q38 40 44 46" stroke="#6D4C41" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <path d="M56 46 Q62 40 68 46" stroke="#6D4C41" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Cheeks -->
      <circle cx="26" cy="55" r="5" fill="#FF7043" opacity="0.6" />
      <circle cx="74" cy="55" r="5" fill="#FF7043" opacity="0.6" />
      <!-- Duck Beak Open Singing -->
      <ellipse cx="50" cy="59" rx="14" ry="9" fill="#FF9800" stroke="#6D4C41" stroke-width="2.5" />
      <ellipse cx="50" cy="61" rx="8" ry="5" fill="#D84315" />
      <!-- Shiny Microphone in Hand -->
      <g transform="translate(18, 62) rotate(-25)">
        <rect x="0" y="8" width="6" height="16" rx="2" fill="#78909C" stroke="#37474F" stroke-width="1.5" />
        <circle cx="3" cy="5" r="6" fill="#B0BEC5" stroke="#37474F" stroke-width="1.5" />
        <line x1="0" y1="5" x2="6" y2="5" stroke="#37474F" stroke-width="1" />
      </g>
      <!-- Musical Notes Floating -->
      <text x="76" y="32" font-size="16" fill="#E91E63">♪</text>
      <text x="84" y="48" font-size="12" fill="#9C27B0">♫</text>
    </svg>`,
  },
  {
    id: 'sticker-hamster-snack',
    name: 'แฮมสเตอร์เคี้ยวแก้มตุ่ย',
    category: 'กินขนม',
    animationClass: 'animate-sticker-pulse',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Ears -->
      <circle cx="26" cy="30" r="10" fill="#E0A96D" stroke="#4A3425" stroke-width="2.5" />
      <circle cx="26" cy="30" r="5" fill="#F8B195" />
      <circle cx="74" cy="30" r="10" fill="#E0A96D" stroke="#4A3425" stroke-width="2.5" />
      <circle cx="74" cy="30" r="5" fill="#F8B195" />
      <!-- Chubby Body with huge cheeks -->
      <ellipse cx="50" cy="58" rx="36" ry="30" fill="#E0A96D" stroke="#4A3425" stroke-width="3.5" />
      <!-- White Tummy & Cheeks -->
      <ellipse cx="50" cy="65" rx="24" ry="20" fill="#FFF9E6" />
      <!-- Big Round Curious Eyes -->
      <circle cx="36" cy="48" r="5" fill="#4A3425" />
      <circle cx="34.5" cy="46" r="2" fill="#FFFFFF" />
      <circle cx="64" cy="48" r="5" fill="#4A3425" />
      <circle cx="62.5" cy="46" r="2" fill="#FFFFFF" />
      <!-- Giant Puffy Pink Cheeks -->
      <ellipse cx="23" cy="58" rx="8" ry="6" fill="#FF8A80" opacity="0.75" />
      <ellipse cx="77" cy="58" rx="8" ry="6" fill="#FF8A80" opacity="0.75" />
      <!-- Nose & Mouth -->
      <polygon points="50,54 48,51 52,51" fill="#FF8A80" />
      <path d="M47 55 Q50 58 53 55" stroke="#4A3425" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- Sunflower Seed in paws -->
      <g transform="translate(50, 70)">
        <ellipse cx="0" cy="0" rx="6" ry="10" fill="#3E2723" stroke="#D7CCC8" stroke-width="1.5" transform="rotate(15)" />
        <line x1="-1" y1="-8" x2="1" y2="8" stroke="#D7CCC8" stroke-width="1" />
      </g>
      <!-- Tiny hands holding seed -->
      <circle cx="43" cy="70" r="3.5" fill="#FFF9E6" stroke="#4A3425" stroke-width="1.5" />
      <circle cx="57" cy="70" r="3.5" fill="#FFF9E6" stroke="#4A3425" stroke-width="1.5" />
    </svg>`,
  },
  {
    id: 'sticker-dino-fire',
    name: 'ไดโนเสาร์พ่นไฟไฟลุก',
    category: 'ไฮป์/มันส์',
    animationClass: 'animate-sticker-shake',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Dino Spikes on Back -->
      <polygon points="30,26 24,14 38,22" fill="#FF5722" stroke="#2E7D32" stroke-width="2" />
      <polygon points="20,40 12,32 26,38" fill="#FF5722" stroke="#2E7D32" stroke-width="2" />
      <polygon points="16,58 6,52 18,58" fill="#FF5722" stroke="#2E7D32" stroke-width="2" />
      <!-- Dino Body -->
      <ellipse cx="48" cy="56" rx="32" ry="28" fill="#4CAF50" stroke="#1B5E20" stroke-width="3.5" />
      <!-- Cute Belly -->
      <ellipse cx="56" cy="62" rx="18" ry="16" fill="#C8E6C9" />
      <!-- Fierce but Cute Eyes -->
      <circle cx="44" cy="46" r="6" fill="#1B5E20" />
      <circle cx="42" cy="44" r="2.5" fill="#FFFFFF" />
      <circle cx="66" cy="46" r="6" fill="#1B5E20" />
      <circle cx="64" cy="44" r="2.5" fill="#FFFFFF" />
      <!-- Tiny Eyebrows angry cute -->
      <line x1="39" y1="38" x2="48" y2="41" stroke="#1B5E20" stroke-width="2.5" stroke-linecap="round" />
      <line x1="71" y1="38" x2="62" y2="41" stroke="#1B5E20" stroke-width="2.5" stroke-linecap="round" />
      <!-- Blushing -->
      <circle cx="36" cy="54" r="4" fill="#FF8A80" opacity="0.6" />
      <!-- Fire Breath Blast -->
      <g transform="translate(68, 54)">
        <path d="M0 0 Q10 -8 18 -2 Q24 2 18 8 Q12 14 0 6 Z" fill="#FF9800" />
        <path d="M0 1 Q8 -4 14 0 Q18 4 13 6 Q8 8 0 4 Z" fill="#FFEB3B" />
        <circle cx="22" cy="1" r="2" fill="#FF5722" />
      </g>
      <!-- Tiny Roar Teeth -->
      <polygon points="62,56 65,60 68,56" fill="#FFFFFF" />
      <polygon points="68,56 71,60 74,56" fill="#FFFFFF" />
    </svg>`,
  },
  {
    id: 'sticker-panda-cry',
    name: 'แพนด้าน้ำตาไหลซาบซึ้ง',
    category: 'เศร้า/ซึ้ง',
    animationClass: 'animate-sticker-tear',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Panda Ears -->
      <circle cx="24" cy="28" r="11" fill="#1E293B" stroke="#0F172A" stroke-width="2" />
      <circle cx="76" cy="28" r="11" fill="#1E293B" stroke="#0F172A" stroke-width="2" />
      <!-- Head Body -->
      <circle cx="50" cy="56" r="32" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5" />
      <!-- Black Eye Patches -->
      <ellipse cx="36" cy="50" rx="9" ry="11" fill="#1E293B" transform="rotate(-15 36 50)" />
      <ellipse cx="64" cy="50" rx="9" ry="11" fill="#1E293B" transform="rotate(15 64 50)" />
      <!-- Crying Glistening Eyes -->
      <circle cx="36" cy="50" r="5" fill="#FFFFFF" />
      <circle cx="35" cy="49" r="2.5" fill="#38BDF8" />
      <circle cx="64" cy="50" r="5" fill="#FFFFFF" />
      <circle cx="63" cy="49" r="2.5" fill="#38BDF8" />
      <!-- Flowing Waterfall Tears -->
      <path d="M33 54 C31 64 28 76 27 86" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.85" />
      <path d="M67 54 C69 64 72 76 73 86" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.85" />
      <circle cx="26" cy="88" r="2" fill="#38BDF8" />
      <circle cx="74" cy="88" r="2" fill="#38BDF8" />
      <!-- Nose & Quivering Mouth -->
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#0F172A" />
      <path d="M44 65 Q50 61 56 65" stroke="#0F172A" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Blush -->
      <circle cx="28" cy="62" r="4.5" fill="#FDA4AF" opacity="0.7" />
      <circle cx="72" cy="62" r="4.5" fill="#FDA4AF" opacity="0.7" />
    </svg>`,
  },
  {
    id: 'sticker-chick-dj',
    name: 'ลูกเจี๊ยบมิกซ์เพลง DJ',
    category: 'DJ/เพลง',
    animationClass: 'animate-sticker-spin-slow',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Vinyl Turntable Base -->
      <ellipse cx="50" cy="74" rx="36" ry="14" fill="#1E293B" stroke="#0F172A" stroke-width="2" />
      <ellipse cx="50" cy="74" rx="26" ry="10" fill="#334155" />
      <ellipse cx="50" cy="74" rx="10" ry="4" fill="#F43F5E" />
      <circle cx="50" cy="74" r="2" fill="#FFFFFF" />
      <!-- Chick Body -->
      <circle cx="50" cy="46" r="24" fill="#FEF08A" stroke="#713F12" stroke-width="3" />
      <!-- Cool Sunglasses -->
      <rect x="33" y="40" width="14" height="10" rx="3" fill="#0F172A" />
      <rect x="53" y="40" width="14" height="10" rx="3" fill="#0F172A" />
      <line x1="47" y1="44" x2="53" y2="44" stroke="#0F172A" stroke-width="2.5" />
      <line x1="35" y1="42" x2="42" y2="42" stroke="#38BDF8" stroke-width="1.5" />
      <line x1="55" y1="42" x2="62" y2="42" stroke="#38BDF8" stroke-width="1.5" />
      <!-- Beak -->
      <polygon points="50,52 46,55 54,55" fill="#F97316" />
      <!-- DJ Cap backwards -->
      <path d="M30 36 C30 24 70 24 70 36 Z" fill="#8B5CF6" stroke="#4C1D95" stroke-width="2" />
      <rect x="22" y="34" width="14" height="4" rx="2" fill="#A78BFA" transform="rotate(-15 22 34)" />
      <!-- Wing scratching record -->
      <ellipse cx="64" cy="56" rx="6" ry="10" fill="#FEF08A" stroke="#713F12" stroke-width="2" transform="rotate(35 64 56)" />
      <!-- Sound FX Lines -->
      <path d="M14 68 Q18 64 16 60" stroke="#F43F5E" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M86 68 Q82 64 84 60" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" fill="none" />
    </svg>`,
  },
];

// Helper to check if a message text is a sticker token e.g. [sticker:sticker-cat-heart]
export function parseStickerMessage(text: string): AnimatedSticker | null {
  if (!text) return null;
  const match = text.trim().match(/^\[sticker:([a-zA-Z0-9_-]+)\]$/);
  if (!match) return null;
  const stickerId = match[1];
  return CUTE_ANIMATED_STICKERS.find((s) => s.id === stickerId) || null;
}
