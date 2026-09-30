// Animated Chat Stickers & Emojis
// 1. Animated Emojis Pack (54 Emojis): https://iconscout.com/lottie-animation-pack/emojis-animation-pack_297954
// 2. Graffiti Art Stickers (45 Stickers): https://iconscout.com/lottie-animation-pack/graffiti-art-stickers-animation-pack_280558

export interface AnimatedSticker {
  id: string;
  name: string;
  englishName: string;
  pack: 'emoji' | 'graffiti';
  url: string;
  gifUrl: string;
  thumbUrl?: string;
}

export const ANIMATED_EMOJIS: AnimatedSticker[] = [
  {
    id: "airplane-emoji-animation-gif-download-10454301",
    name: "บินไปเที่ยว",
    englishName: "Airplane Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/airplane-emoji-animation-gif-download-10454301.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/airplane-emoji-animation-gif-download-10454301.gif"
  },
  {
    id: "angry-emoji-animation-gif-download-10454302",
    name: "โกรธจัด",
    englishName: "Angry Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/angry-emoji-animation-gif-download-10454302.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/angry-emoji-animation-gif-download-10454302.gif"
  },
  {
    id: "bath-emoji-animation-gif-download-10454303",
    name: "อาบน้ำสบายใจ",
    englishName: "Bath Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/bath-emoji-animation-gif-download-10454303.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/bath-emoji-animation-gif-download-10454303.gif"
  },
  {
    id: "cage-emoji-animation-gif-download-10454276",
    name: "ติดกรง",
    englishName: "Cage Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cage-emoji-animation-gif-download-10454276.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cage-emoji-animation-gif-download-10454276.gif"
  },
  {
    id: "calling-emoji-animation-gif-download-10454277",
    name: "โทรคุย",
    englishName: "Calling Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/calling-emoji-animation-gif-download-10454277.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/calling-emoji-animation-gif-download-10454277.gif"
  },
  {
    id: "car-driving-emoji-animation-gif-download-10454278",
    name: "ขับรถซิ่ง",
    englishName: "Car Driving Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/car-driving-emoji-animation-gif-download-10454278.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/car-driving-emoji-animation-gif-download-10454278.gif"
  },
  {
    id: "chill-emoji-animation-gif-download-10454279",
    name: "ชิลๆ สบายๆ",
    englishName: "Chill Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/chill-emoji-animation-gif-download-10454279.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/chill-emoji-animation-gif-download-10454279.gif"
  },
  {
    id: "clapping-emoji-animation-gif-download-10454280",
    name: "ปรบมือรัวๆ",
    englishName: "Clapping Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/clapping-emoji-animation-gif-download-10454280.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/clapping-emoji-animation-gif-download-10454280.gif"
  },
  {
    id: "crazy-emoji-animation-gif-download-10454281",
    name: "สติหลุด",
    englishName: "Crazy Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-emoji-animation-gif-download-10454281.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-emoji-animation-gif-download-10454281.gif"
  },
  {
    id: "cry-emoji-animation-gif-download-10454282",
    name: "ร้องไห้แงๆ",
    englishName: "Cry Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cry-emoji-animation-gif-download-10454282.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cry-emoji-animation-gif-download-10454282.gif"
  },
  {
    id: "crying-emoji-animation-gif-download-10454283",
    name: "น้ำตานองหน้า",
    englishName: "Crying Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/crying-emoji-animation-gif-download-10454283.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/crying-emoji-animation-gif-download-10454283.gif"
  },
  {
    id: "dance-emoji-animation-gif-download-10454284",
    name: "เต้นโยกย้าย",
    englishName: "Dance Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/dance-emoji-animation-gif-download-10454284.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/dance-emoji-animation-gif-download-10454284.gif"
  },
  {
    id: "devil-emoji-animation-gif-download-10454285",
    name: "ปีศาจเจ้าเล่ห์",
    englishName: "Devil Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/devil-emoji-animation-gif-download-10454285.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/devil-emoji-animation-gif-download-10454285.gif"
  },
  {
    id: "die-emoji-animation-gif-download-10454286",
    name: "สลบเหมือด น็อค",
    englishName: "Die Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/die-emoji-animation-gif-download-10454286.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/die-emoji-animation-gif-download-10454286.gif"
  },
  {
    id: "dizzy-emoji-animation-gif-download-10454287",
    name: "มึนหัวตึ้บ",
    englishName: "Dizzy Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/dizzy-emoji-animation-gif-download-10454287.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/dizzy-emoji-animation-gif-download-10454287.gif"
  },
  {
    id: "eating-emoji-animation-gif-download-10454288",
    name: "กินอร่อย",
    englishName: "Eating Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/eating-emoji-animation-gif-download-10454288.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/eating-emoji-animation-gif-download-10454288.gif"
  },
  {
    id: "fearful-emoji-animation-gif-download-10454289",
    name: "ตกใจกลัว",
    englishName: "Fearful Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/fearful-emoji-animation-gif-download-10454289.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/fearful-emoji-animation-gif-download-10454289.gif"
  },
  {
    id: "heart-emoji-animation-gif-download-10454290",
    name: "มอบหัวใจให้",
    englishName: "Heart Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/heart-emoji-animation-gif-download-10454290.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/heart-emoji-animation-gif-download-10454290.gif"
  },
  {
    id: "hehe-emoji-animation-gif-download-10454291",
    name: "ยิ้มแหะๆ",
    englishName: "Hehe Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/hehe-emoji-animation-gif-download-10454291.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/hehe-emoji-animation-gif-download-10454291.gif"
  },
  {
    id: "help-emoji-animation-gif-download-10454292",
    name: "ช่วยด้วยยย",
    englishName: "Help Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/help-emoji-animation-gif-download-10454292.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/help-emoji-animation-gif-download-10454292.gif"
  },
  {
    id: "hi-emoji-animation-gif-download-10454293",
    name: "ทักทาย บ๊ายบาย",
    englishName: "Hi Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/hi-emoji-animation-gif-download-10454293.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/hi-emoji-animation-gif-download-10454293.gif"
  },
  {
    id: "home-emoji-animation-gif-download-10454294",
    name: "อยู่บ้านพักผ่อน",
    englishName: "Home Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/home-emoji-animation-gif-download-10454294.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/home-emoji-animation-gif-download-10454294.gif"
  },
  {
    id: "hot-emoji-animation-gif-download-10454295",
    name: "ร้อนตับแตก",
    englishName: "Hot Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/hot-emoji-animation-gif-download-10454295.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/hot-emoji-animation-gif-download-10454295.gif"
  },
  {
    id: "joy-emoji-animation-gif-download-10454296",
    name: "ขำน้ำตาเล็ด",
    englishName: "Joy Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/joy-emoji-animation-gif-download-10454296.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/joy-emoji-animation-gif-download-10454296.gif"
  },
  {
    id: "kiss-emoji-animation-gif-download-10454297",
    name: "ส่งจูบวิ้งๆ",
    englishName: "Kiss Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/kiss-emoji-animation-gif-download-10454297.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/kiss-emoji-animation-gif-download-10454297.gif"
  },
  {
    id: "laughing-emoji-animation-gif-download-10454298",
    name: "หัวเราะก๊าก",
    englishName: "Laughing Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/laughing-emoji-animation-gif-download-10454298.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/laughing-emoji-animation-gif-download-10454298.gif"
  },
  {
    id: "middle-finger-emoji-animation-gif-download-10454299",
    name: "แจกนิ้วกลางกวนๆ",
    englishName: "Middle Finger Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/middle-finger-emoji-animation-gif-download-10454299.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/middle-finger-emoji-animation-gif-download-10454299.gif"
  },
  {
    id: "muscle-emoji-animation-gif-download-10454300",
    name: "เบ่งกล้ามสู้ๆ",
    englishName: "Muscle Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/muscle-emoji-animation-gif-download-10454300.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/muscle-emoji-animation-gif-download-10454300.gif"
  },
  {
    id: "music-emoji-animation-gif-download-10454250",
    name: "ฟังเพลงเพลิน",
    englishName: "Music Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/music-emoji-animation-gif-download-10454250.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/music-emoji-animation-gif-download-10454250.gif"
  },
  {
    id: "not-available-emoji-animation-gif-download-10454251",
    name: "ไม่ว่างจ้า",
    englishName: "Not Available Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/not-available-emoji-animation-gif-download-10454251.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/not-available-emoji-animation-gif-download-10454251.gif"
  },
  {
    id: "ok-emoji-animation-gif-download-10454252",
    name: "โอเคจัดไป",
    englishName: "Ok Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/ok-emoji-animation-gif-download-10454252.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/ok-emoji-animation-gif-download-10454252.gif"
  },
  {
    id: "party-emoji-animation-gif-download-10454253",
    name: "ปาร์ตี้เฮฮา",
    englishName: "Party Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/party-emoji-animation-gif-download-10454253.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/party-emoji-animation-gif-download-10454253.gif"
  },
  {
    id: "peace-sign-emoji-animation-gif-download-10454254",
    name: "สองนิ้วสู้ตาย",
    englishName: "Peace Sign Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/peace-sign-emoji-animation-gif-download-10454254.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/peace-sign-emoji-animation-gif-download-10454254.gif"
  },
  {
    id: "pray-emoji-animation-gif-download-10454255",
    name: "ไหว้ขอบคุณ / สาธุ",
    englishName: "Pray Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/pray-emoji-animation-gif-download-10454255.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/pray-emoji-animation-gif-download-10454255.gif"
  },
  {
    id: "rage-emoji-animation-gif-download-10454256",
    name: "เดือดควันออกหู",
    englishName: "Rage Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/rage-emoji-animation-gif-download-10454256.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/rage-emoji-animation-gif-download-10454256.gif"
  },
  {
    id: "relaxed-emoji-animation-gif-download-10454257",
    name: "ผ่อนคลายสบายใจ",
    englishName: "Relaxed Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/relaxed-emoji-animation-gif-download-10454257.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/relaxed-emoji-animation-gif-download-10454257.gif"
  },
  {
    id: "relieved-emoji-animation-gif-download-10454258",
    name: "โล่งอกรอดตัว",
    englishName: "Relieved Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/relieved-emoji-animation-gif-download-10454258.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/relieved-emoji-animation-gif-download-10454258.gif"
  },
  {
    id: "shopping-bags-emoji-animation-gif-download-10454259",
    name: "ช้อปปิ้งกระจาย",
    englishName: "Shopping Bags Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/shopping-bags-emoji-animation-gif-download-10454259.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/shopping-bags-emoji-animation-gif-download-10454259.gif"
  },
  {
    id: "shrugging-emoji-animation-gif-download-10454260",
    name: "ยักไหล่ ไม่รู้สิ",
    englishName: "Shrugging Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/shrugging-emoji-animation-gif-download-10454260.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/shrugging-emoji-animation-gif-download-10454260.gif"
  },
  {
    id: "shushing-face-emoji-animation-gif-download-10454261",
    name: "จุ๊ๆ เงียบไว้",
    englishName: "Shushing Face Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/shushing-face-emoji-animation-gif-download-10454261.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/shushing-face-emoji-animation-gif-download-10454261.gif"
  },
  {
    id: "sick-emoji-animation-gif-download-10454262",
    name: "ป่วยไม่สบาย",
    englishName: "Sick Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/sick-emoji-animation-gif-download-10454262.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/sick-emoji-animation-gif-download-10454262.gif"
  },
  {
    id: "sleeping-emoji-animation-gif-download-10454263",
    name: "ง่วงนอน zzz",
    englishName: "Sleeping Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/sleeping-emoji-animation-gif-download-10454263.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/sleeping-emoji-animation-gif-download-10454263.gif"
  },
  {
    id: "smile-emoji-animation-gif-download-10454264",
    name: "ยิ้มสดใส",
    englishName: "Smile Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/smile-emoji-animation-gif-download-10454264.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/smile-emoji-animation-gif-download-10454264.gif"
  },
  {
    id: "smiling-hearts-emoji-animation-gif-download-10454265",
    name: "ยิ้มหวานคลั่งรัก",
    englishName: "Smiling Hearts Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/smiling-hearts-emoji-animation-gif-download-10454265.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/smiling-hearts-emoji-animation-gif-download-10454265.gif"
  },
  {
    id: "smirk-emoji-animation-gif-download-10454266",
    name: "ยิ้มมุมปากเก๋าๆ",
    englishName: "Smirk Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/smirk-emoji-animation-gif-download-10454266.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/smirk-emoji-animation-gif-download-10454266.gif"
  },
  {
    id: "sport-emoji-animation-gif-download-10454267",
    name: "ฟิตเนส ออกกำลัง",
    englishName: "Sport Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/sport-emoji-animation-gif-download-10454267.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/sport-emoji-animation-gif-download-10454267.gif"
  },
  {
    id: "study-emoji-animation-gif-download-10454268",
    name: "ขยันอ่านหนังสือ",
    englishName: "Study Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/study-emoji-animation-gif-download-10454268.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/study-emoji-animation-gif-download-10454268.gif"
  },
  {
    id: "sunglasses-emoji-animation-gif-download-10454269",
    name: "เท่คูลแว่นดำ",
    englishName: "Sunglasses Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/sunglasses-emoji-animation-gif-download-10454269.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/sunglasses-emoji-animation-gif-download-10454269.gif"
  },
  {
    id: "thumb-down-emoji-animation-gif-download-10454270",
    name: "คว่ำมือ ไม่ผ่าน",
    englishName: "Thumb Down Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/thumb-down-emoji-animation-gif-download-10454270.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/thumb-down-emoji-animation-gif-download-10454270.gif"
  },
  {
    id: "thumb-up-emoji-animation-gif-download-10454271",
    name: "ยกนิ้วโป้ง กดไลก์",
    englishName: "Thumb Up Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/thumb-up-emoji-animation-gif-download-10454271.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/thumb-up-emoji-animation-gif-download-10454271.gif"
  },
  {
    id: "toilet-emoji-animation-gif-download-10454272",
    name: "เข้าห้องน้ำแป๊บ",
    englishName: "Toilet Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/toilet-emoji-animation-gif-download-10454272.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/toilet-emoji-animation-gif-download-10454272.gif"
  },
  {
    id: "using-laptop-emoji-animation-gif-download-10454273",
    name: "ปั่นงานหน้าคอม",
    englishName: "Using Laptop Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/using-laptop-emoji-animation-gif-download-10454273.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/using-laptop-emoji-animation-gif-download-10454273.gif"
  },
  {
    id: "v-sign-emoji-animation-gif-download-10454274",
    name: "ชูสองนิ้ว เย้",
    englishName: "V Sign Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/v-sign-emoji-animation-gif-download-10454274.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/v-sign-emoji-animation-gif-download-10454274.gif"
  },
  {
    id: "wink-emoji-animation-gif-download-10454275",
    name: "ขยิบตาปิ๊งๆ",
    englishName: "Wink Emoji",
    pack: 'emoji',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/wink-emoji-animation-gif-download-10454275.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/wink-emoji-animation-gif-download-10454275.gif"
  }
];

export const GRAFFITI_STICKERS: AnimatedSticker[] = [
  {
    id: "apple-juice-animation-gif-download-9861867",
    name: "น้ำแอปเปิ้ลซ่า",
    englishName: "Apple Juice",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/apple-juice-animation-gif-download-9861867.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/apple-juice-animation-gif-download-9861867.gif"
  },
  {
    id: "bomb-character-animation-gif-download-9861844",
    name: "ระเบิดจิ๋วสุดแสบ",
    englishName: "Bomb Character",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/bomb-character-animation-gif-download-9861844.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/bomb-character-animation-gif-download-9861844.gif"
  },
  {
    id: "burglar-emoji-animation-gif-download-9861866",
    name: "จอมโจรลอบส่งยิ้ม",
    englishName: "Burglar Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/burglar-emoji-animation-gif-download-9861866.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/burglar-emoji-animation-gif-download-9861866.gif"
  },
  {
    id: "cat-holding-board-animation-gif-download-9861865",
    name: "แมวยกป้าย",
    englishName: "Cat Holding Board",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cat-holding-board-animation-gif-download-9861865.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cat-holding-board-animation-gif-download-9861865.gif"
  },
  {
    id: "cool-character-animation-gif-download-9861861",
    name: "ตัวตึงสุดคูล",
    englishName: "Cool Character",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cool-character-animation-gif-download-9861861.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cool-character-animation-gif-download-9861861.gif"
  },
  {
    id: "crazy-emoji-animation-gif-download-9861840",
    name: "อิโมจิสุดบ้าบิ่น",
    englishName: "Crazy Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-emoji-animation-gif-download-9861840.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-emoji-animation-gif-download-9861840.gif"
  },
  {
    id: "crazy-smileys-animation-gif-download-9861873",
    name: "ยิ้มบ้าพลัง",
    englishName: "Crazy Smileys",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-smileys-animation-gif-download-9861873.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/crazy-smileys-animation-gif-download-9861873.gif"
  },
  {
    id: "cute-cactus-animation-gif-download-9861854",
    name: "กระบองเพชรจิ๋ว",
    englishName: "Cute Cactus",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-cactus-animation-gif-download-9861854.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-cactus-animation-gif-download-9861854.gif"
  },
  {
    id: "cute-pencil-animation-gif-download-9861846",
    name: "ดินสอตัวกวน",
    englishName: "Cute Pencil",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-pencil-animation-gif-download-9861846.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-pencil-animation-gif-download-9861846.gif"
  },
  {
    id: "cute-smiley-animation-gif-download-9861853",
    name: "ยิ้มตาสระอิ",
    englishName: "Cute Smiley",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-smiley-animation-gif-download-9861853.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-smiley-animation-gif-download-9861853.gif"
  },
  {
    id: "cute-smiley-animation-gif-download-9861869",
    name: "ยิ้มแป้นสดใส",
    englishName: "Cute Smiley",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-smiley-animation-gif-download-9861869.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/cute-smiley-animation-gif-download-9861869.gif"
  },
  {
    id: "dead-emoji-animation-gif-download-9861845",
    name: "หน้าตาย สลบเหมือด",
    englishName: "Dead Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/dead-emoji-animation-gif-download-9861845.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/dead-emoji-animation-gif-download-9861845.gif"
  },
  {
    id: "dead-skull-animation-gif-download-9861864",
    name: "กะโหลกซ่า",
    englishName: "Dead Skull",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/dead-skull-animation-gif-download-9861864.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/dead-skull-animation-gif-download-9861864.gif"
  },
  {
    id: "devil-trident-animation-gif-download-9861870",
    name: "ตรีศูลเดวิล",
    englishName: "Devil Trident",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/devil-trident-animation-gif-download-9861870.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/devil-trident-animation-gif-download-9861870.gif"
  },
  {
    id: "fiery-heart-animation-gif-download-9861843",
    name: "หัวใจไฟลุก",
    englishName: "Fiery Heart",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/fiery-heart-animation-gif-download-9861843.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/fiery-heart-animation-gif-download-9861843.gif"
  },
  {
    id: "fire-emoji-animation-gif-download-9861831",
    name: "ไฟลุกพวยพุ่ง",
    englishName: "Fire Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/fire-emoji-animation-gif-download-9861831.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/fire-emoji-animation-gif-download-9861831.gif"
  },
  {
    id: "flash-bolts-animation-gif-download-9861832",
    name: "สายฟ้าฟาดเปรี้ยง",
    englishName: "Flash Bolts",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/flash-bolts-animation-gif-download-9861832.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/flash-bolts-animation-gif-download-9861832.gif"
  },
  {
    id: "flying-ghost-animation-gif-download-9861851",
    name: "ผีน้อยล่องลอย",
    englishName: "Flying Ghost",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/flying-ghost-animation-gif-download-9861851.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/flying-ghost-animation-gif-download-9861851.gif"
  },
  {
    id: "friend-emojis-animation-gif-download-9861872",
    name: "ก๊วนเพื่อนซี้",
    englishName: "Friend Emojis",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/friend-emojis-animation-gif-download-9861872.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/friend-emojis-animation-gif-download-9861872.gif"
  },
  {
    id: "funny-character-animation-gif-download-9861835",
    name: "มอนสเตอร์ตัวฮา",
    englishName: "Funny Character",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-character-animation-gif-download-9861835.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-character-animation-gif-download-9861835.gif"
  },
  {
    id: "funny-emoji-animation-gif-download-9861871",
    name: "อิโมจิขำกลิ้ง",
    englishName: "Funny Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-emoji-animation-gif-download-9861871.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-emoji-animation-gif-download-9861871.gif"
  },
  {
    id: "funny-monster-animation-gif-download-9861841",
    name: "ปีศาจขี้เล่น",
    englishName: "Funny Monster",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-monster-animation-gif-download-9861841.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/funny-monster-animation-gif-download-9861841.gif"
  },
  {
    id: "halloween-eye-animation-gif-download-9861849",
    name: "ลูกตาดุ๊กดิ๊ก",
    englishName: "Halloween Eye",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/halloween-eye-animation-gif-download-9861849.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/halloween-eye-animation-gif-download-9861849.gif"
  },
  {
    id: "halloween-plant-animation-gif-download-9861847",
    name: "ต้นไม้กินคนฮาโลวีน",
    englishName: "Halloween Plant",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/halloween-plant-animation-gif-download-9861847.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/halloween-plant-animation-gif-download-9861847.gif"
  },
  {
    id: "heart-painting-animation-gif-download-9861859",
    name: "เพนต์หัวใจ",
    englishName: "Heart Painting",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/heart-painting-animation-gif-download-9861859.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/heart-painting-animation-gif-download-9861859.gif"
  },
  {
    id: "lightning-cloud-animation-gif-download-9861855",
    name: "เมฆสายฟ้าคำราม",
    englishName: "Lightning Cloud",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/lightning-cloud-animation-gif-download-9861855.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/lightning-cloud-animation-gif-download-9861855.gif"
  },
  {
    id: "magnet-attraction-animation-gif-download-9861842",
    name: "แม่เหล็กดูดใจ",
    englishName: "Magnet Attraction",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/magnet-attraction-animation-gif-download-9861842.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/magnet-attraction-animation-gif-download-9861842.gif"
  },
  {
    id: "melting-cheese-animation-gif-download-9861833",
    name: "ชีสยืดเยิ้ม",
    englishName: "Melting Cheese",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-cheese-animation-gif-download-9861833.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-cheese-animation-gif-download-9861833.gif"
  },
  {
    id: "melting-dice-animation-gif-download-9861848",
    name: "ลูกเต๋าละลาย",
    englishName: "Melting Dice",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-dice-animation-gif-download-9861848.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-dice-animation-gif-download-9861848.gif"
  },
  {
    id: "melting-heart-animation-gif-download-9861834",
    name: "หัวใจละลายเหลว",
    englishName: "Melting Heart",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-heart-animation-gif-download-9861834.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/melting-heart-animation-gif-download-9861834.gif"
  },
  {
    id: "morning-rainbow-animation-gif-download-9861868",
    name: "สายรุ้งอรุณสวัสดิ์",
    englishName: "Morning Rainbow",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/morning-rainbow-animation-gif-download-9861868.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/morning-rainbow-animation-gif-download-9861868.gif"
  },
  {
    id: "moustache-emoji-animation-gif-download-9861860",
    name: "หน้าหนวดสุดเก๋า",
    englishName: "Moustache Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/moustache-emoji-animation-gif-download-9861860.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/moustache-emoji-animation-gif-download-9861860.gif"
  },
  {
    id: "ok-emoji-animation-gif-download-9861858",
    name: "โอเคจัดไป",
    englishName: "OK Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/ok-emoji-animation-gif-download-9861858.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/ok-emoji-animation-gif-download-9861858.gif"
  },
  {
    id: "paint-spray-animation-gif-download-9861829",
    name: "สเปรย์กราฟฟิตี้",
    englishName: "Paint Spray",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/paint-spray-animation-gif-download-9861829.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/paint-spray-animation-gif-download-9861829.gif"
  },
  {
    id: "popping-eyes-animation-gif-download-9861837",
    name: "ตาถลนช็อก",
    englishName: "Popping Eyes",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/popping-eyes-animation-gif-download-9861837.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/popping-eyes-animation-gif-download-9861837.gif"
  },
  {
    id: "potted-cup-animation-gif-download-9861857",
    name: "ถ้วยกาแฟกระถาง",
    englishName: "Potted Cup",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/potted-cup-animation-gif-download-9861857.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/potted-cup-animation-gif-download-9861857.gif"
  },
  {
    id: "rock-emoji-animation-gif-download-9861863",
    name: "สัญลักษณ์ชาวร็อก",
    englishName: "Rock Emoji",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/rock-emoji-animation-gif-download-9861863.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/rock-emoji-animation-gif-download-9861863.gif"
  },
  {
    id: "scary-skull-animation-gif-download-9861839",
    name: "กะโหลกหลอน",
    englishName: "Scary Skull",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/scary-skull-animation-gif-download-9861839.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/scary-skull-animation-gif-download-9861839.gif"
  },
  {
    id: "silly-face-animation-gif-download-9861838",
    name: "หน้ากวนประสาท",
    englishName: "Silly Face",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/silly-face-animation-gif-download-9861838.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/silly-face-animation-gif-download-9861838.gif"
  },
  {
    id: "silly-monster-animation-gif-download-9861852",
    name: "มอนสเตอร์ฟันหลอ",
    englishName: "Silly Monster",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/silly-monster-animation-gif-download-9861852.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/silly-monster-animation-gif-download-9861852.gif"
  },
  {
    id: "smirk-face-animation-gif-download-9861856",
    name: "ยิ้มมุมปากเจ้าเล่ห์",
    englishName: "Smirk Face",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/smirk-face-animation-gif-download-9861856.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/smirk-face-animation-gif-download-9861856.gif"
  },
  {
    id: "smoking-mushroom-animation-gif-download-9861830",
    name: "เห็ดพ่นควัน",
    englishName: "Smoking Mushroom",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/smoking-mushroom-animation-gif-download-9861830.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/smoking-mushroom-animation-gif-download-9861830.gif"
  },
  {
    id: "spooky-night-animation-gif-download-9861836",
    name: "ค่ำคืนผีสิง",
    englishName: "Spooky Night",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/spooky-night-animation-gif-download-9861836.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/spooky-night-animation-gif-download-9861836.gif"
  },
  {
    id: "stabbed-heart-animation-gif-download-9861850",
    name: "มีดปักใจแทงทะลุ",
    englishName: "Stabbed Heart",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/stabbed-heart-animation-gif-download-9861850.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/stabbed-heart-animation-gif-download-9861850.gif"
  },
  {
    id: "wall-artwork-animation-gif-download-9861862",
    name: "อาร์ตเวิร์กกำแพง",
    englishName: "Wall Artwork",
    pack: 'graffiti',
    url: "https://cdnl.iconscout.com/lottie/premium/thumb/wall-artwork-animation-gif-download-9861862.gif?f=webp",
    gifUrl: "https://cdnl.iconscout.com/lottie/premium/thumb/wall-artwork-animation-gif-download-9861862.gif"
  }
];

// All stickers combined (99 total)
export const ALL_CHAT_STICKERS: AnimatedSticker[] = [
  ...ANIMATED_EMOJIS,
  ...GRAFFITI_STICKERS
];

// Alias for backwards compatibility
export const CUTE_ANIMATED_STICKERS = ALL_CHAT_STICKERS;

// Helper to check if a message text is a sticker token e.g. [sticker:clapping-emoji-animation-gif-download-10454280]
export function parseStickerMessage(text: string): AnimatedSticker | null {
  if (!text) return null;
  const match = text.trim().match(/^\[sticker:([a-zA-Z0-9_.-]+)\]$/i);
  if (!match) return null;
  const stickerId = match[1].toLowerCase();
  return ALL_CHAT_STICKERS.find((s) => s.id.toLowerCase() === stickerId) || null;
}

// Helper to get static lightweight preview thumbnail URL (~10-15KB WebP)
export function getStickerThumbUrl(stk: AnimatedSticker): string {
  if (stk.thumbUrl) return stk.thumbUrl;
  return `https://cdnl.iconscout.com/lottie/premium/thumb/${stk.id}.png?w=128&f=webp`;
}

