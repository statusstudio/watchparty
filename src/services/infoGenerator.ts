/**
 * Generates info.md content exactly in the format requested by the user:
 * === ข้อมูลสำหรับลงทะเบียน LINE Creators Market ===
 * ชื่อชุดสติกเกอร์ (ไทย): ...
 * ชื่อชุดสติกเกอร์ (อังกฤษ): ...
 * 
 * คำอธิบายสติกเกอร์ (ไทย):
 * ...
 * 
 * คำอธิบายสติกเกอร์ (อังกฤษ):
 * ...
 * 
 * === รายการไฟล์ในแพ็กเกจ ZIP ===
 * 1. main.png (240 x 240 px) - รูปหน้าปกสติกเกอร์
 * 2. tab.png (96 x 74 px) - รูปไอคอนแท็บคีย์บอร์ด LINE
 * 3. 01.png ถึง 40.png (370 x 320 px) - รูปสติกเกอร์พร้อมพื้นหลังโปร่งใส (Transparent)
 * 4.info.md รายละเอียดชื่อสติกเกอร์
 */

export interface LineStickerAiInfo {
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
}

export function formatInfoMarkdown(
  info: LineStickerAiInfo,
  stickerCount: number = 40,
  stickerDimensions: string = '370 x 320 px'
): string {
  const maxNumStr = stickerCount > 0 ? stickerCount.toString().padStart(2, '0') : '40';

  return `=== ข้อมูลสำหรับลงทะเบียน LINE Creators Market ===
ชื่อชุดสติกเกอร์ (ไทย): ${info.titleTh || 'น้องคิวท์ ส่งความสุข'}
ชื่อชุดสติกเกอร์ (อังกฤษ): ${info.titleEn || 'Cute Character Daily Moments'}

คำอธิบายสติกเกอร์ (ไทย):
${info.descriptionTh || 'ส่งต่อความน่ารักสดใสและรอยยิ้มในทุกๆ วัน ด้วยสติกเกอร์สุดน่ารัก ใช้งานง่าย เหมาะกับทุกการแชท!'}

คำอธิบายสติกเกอร์ (อังกฤษ):
${info.descriptionEn || 'Brighten your daily chats with these super cute and expressive stickers! Perfect for sharing feelings and daily vibes.'}

=== รายการไฟล์ในแพ็กเกจ ZIP ===
1. main.png (240 x 240 px) - รูปหน้าปกสติกเกอร์
2. tab.png (96 x 74 px) - รูปไอคอนแท็บคีย์บอร์ด LINE
3. 01.png ถึง ${maxNumStr}.png (${stickerDimensions}) - รูปสติกเกอร์พร้อมพื้นหลังโปร่งใส (Transparent)
4.info.md รายละเอียดชื่อสติกเกอร์`;
}

/**
 * Fetch AI-generated metadata from server endpoint /api/generate-sticker-info
 */
export async function generateStickerInfoFromAi(
  stickerCount: number,
  packTitle: string,
  sampleImagesBase64?: string[]
): Promise<LineStickerAiInfo> {
  try {
    const res = await fetch('/api/generate-sticker-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stickerCount,
        packTitle,
        sampleImagesBase64: sampleImagesBase64 && sampleImagesBase64.length > 0 ? sampleImagesBase64 : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.info) {
        return data.info;
      }
    }
  } catch (err) {
    console.warn('Failed to call /api/generate-sticker-info, using fallback template:', err);
  }

  // Graceful fallback (Static, no "ดุ๊กดิ๊ก" or "ผองเพื่อน")
  return {
    titleTh: 'น้องคิวท์ ส่งความสุข',
    titleEn: 'Cute Character Daily Moments',
    descriptionTh: 'ส่งต่อความน่ารักสดใสและรอยยิ้มในทุกๆ วัน ด้วยสติกเกอร์สุดน่ารัก ใช้งานง่าย เหมาะกับทุกการแชท!',
    descriptionEn: 'Brighten your daily chats with these super cute and expressive stickers! Perfect for sharing feelings and daily vibes.',
  };
}
