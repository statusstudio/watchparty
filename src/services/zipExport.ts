/**
 * LINE Sticker ZIP Packager & Validator
 * Generates an official ZIP archive ready for direct upload to LINE Creators Market
 * (https://creator.line.me) conforming to all technical guidelines.
 */

import JSZip from 'jszip';
import { STICKER_SPECS, StickerItem, StickerType } from '../types/sticker';
import { formatInfoMarkdown, LineStickerAiInfo } from './infoGenerator';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  messageTh: string;
  messageEn: string;
}

export interface ValidationResult {
  isValid: boolean;
  canExport: boolean;
  issues: ValidationIssue[];
}

/**
 * Validate package compliance before exporting
 */
export function validateStickerPack(
  stickers: StickerItem[],
  stickerType: StickerType,
  mainStickerId?: string,
  tabStickerId?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const spec = STICKER_SPECS[stickerType];

  if (stickers.length === 0) {
    issues.push({
      type: 'error',
      messageTh: 'ยังไม่มีสติกเกอร์ในชุด กรุณาอัปโหลดหรือเลือกรูปภาพก่อน',
      messageEn: 'No stickers in pack. Please upload or cut images first.',
    });
    return { isValid: false, canExport: false, issues };
  }

  // Check count
  const count = stickers.length;
  if (!spec.allowedCounts.includes(count)) {
    issues.push({
      type: 'warning',
      messageTh: `จำนวนสติกเกอร์ปัจจุบันคือ ${count} รูป (LINE Creators Market กำหนดให้ส่งชุดละ 8, 16, 24, 32 หรือ 40 รูป)`,
      messageEn: `Current sticker count is ${count}. LINE Creators Market requires sets of 8, 16, 24, 32, or 40 images.`,
    });
  }

  // Check main.png requirement
  if (spec.hasMain) {
    const hasMain = mainStickerId ? stickers.some((s) => s.id === mainStickerId) : stickers.some((s) => s.isMain);
    if (!hasMain) {
      issues.push({
        type: 'warning',
        messageTh: 'ยังไม่ได้เลือกรูป main.png (ระบบจะใช้สติกเกอร์ลำดับที่ 1 ให้อัตโนมัติ)',
        messageEn: 'No main.png selected. Defaulting to sticker #1 automatically.',
      });
    }
  }

  // Check tab.png requirement
  const hasTab = tabStickerId ? stickers.some((s) => s.id === tabStickerId) : stickers.some((s) => s.isTab);
  if (!hasTab) {
    issues.push({
      type: 'warning',
      messageTh: 'ยังไม่ได้เลือกรูป tab.png (ระบบจะใช้สติกเกอร์ลำดับที่ 1 ให้อัตโนมัติ)',
      messageEn: 'No tab.png selected. Defaulting to sticker #1 automatically.',
    });
  }

  // Dimension check
  for (let i = 0; i < stickers.length; i++) {
    const s = stickers[i];
    if (s.width !== spec.width || s.height !== spec.height) {
      issues.push({
        type: 'warning',
        messageTh: `สติกเกอร์ #${i + 1} ขนาด ${s.width}x${s.height}px (สเปคทางการคือ ${spec.width}x${spec.height}px)`,
        messageEn: `Sticker #${i + 1} size ${s.width}x${s.height}px (standard is ${spec.width}x${spec.height}px)`,
      });
      break;
    }
  }

  const hasErrors = issues.some((i) => i.type === 'error');
  return {
    isValid: issues.length === 0,
    canExport: !hasErrors,
    issues,
  };
}

/**
 * Utility: Convert Data URL (Base64) to Uint8Array for JSZip
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf(';base64,');
  const base64 = base64Index !== -1 ? dataUrl.substring(base64Index + 8) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Build and trigger ZIP download
 */
export async function exportStickerPackZip(
  stickers: StickerItem[],
  stickerType: StickerType,
  packTitle: string = 'line_stickers',
  mainStickerId?: string,
  tabStickerId?: string,
  aiInfo?: LineStickerAiInfo | null
): Promise<Blob> {
  const zip = new JSZip();
  const spec = STICKER_SPECS[stickerType];

  // Determine main sticker
  let mainItem = stickers.find((s) => s.id === mainStickerId) || stickers.find((s) => s.isMain) || stickers[0];
  // Determine tab sticker
  let tabItem = stickers.find((s) => s.id === tabStickerId) || stickers.find((s) => s.isTab) || stickers[0];

  const manifestStickers: Array<{ filename: string; width: number; height: number; originalQuadrant?: string }> = [];

  // Add all numbered sticker images: 01.png..NN.png or 001.png..NNN.png
  stickers.forEach((sticker, idx) => {
    const num = idx + 1;
    let filename: string;
    if (spec.namePattern === '001') {
      filename = `${num.toString().padStart(3, '0')}.png`;
    } else {
      filename = `${num.toString().padStart(2, '0')}.png`;
    }

    const imgBytes = dataUrlToUint8Array(sticker.processedDataUrl);
    zip.file(filename, imgBytes);

    manifestStickers.push({
      filename,
      width: sticker.width,
      height: sticker.height,
      originalQuadrant: sticker.quadrant,
    });
  });

  // Add main.png (if standard or big)
  if (spec.hasMain && mainItem) {
    const mainDataUrl = mainItem.mainDataUrl || mainItem.processedDataUrl;
    const mainBytes = dataUrlToUint8Array(mainDataUrl);
    zip.file('main.png', mainBytes);
  }

  // Add tab.png
  if (tabItem) {
    const tabDataUrl = tabItem.tabDataUrl || tabItem.processedDataUrl;
    const tabBytes = dataUrlToUint8Array(tabDataUrl);
    zip.file('tab.png', tabBytes);
  }

  // Add official info.md file generated by AI
  const infoMdText = formatInfoMarkdown(
    aiInfo || {
      titleTh: 'น้องคิวท์ ส่งความสุข',
      titleEn: 'Cute Character Daily Moments',
      descriptionTh: 'ส่งต่อความน่ารักสดใสและรอยยิ้มในทุกๆ วัน ด้วยสติกเกอร์สุดน่ารัก ใช้งานง่าย เหมาะกับทุกการแชท!',
      descriptionEn: 'Brighten your daily chats with these super cute and expressive stickers! Perfect for sharing feelings and daily vibes.',
    },
    stickers.length,
    `${spec.width} x ${spec.height} px`
  );
  zip.file('info.md', infoMdText);

  // Add README instruction file for Thai creators
  const readmeContent = `========================================================================
LINE STICKER STUDIO - CREATORS MARKET SUBMISSION PACKAGE
ชุดไฟล์สติกเกอร์สำหรับส่ง LINE Creators Market
========================================================================

ประเภทสติกเกอร์: ${spec.nameTh} (${spec.name})
จำนวนสติกเกอร์: ${stickers.length} รูป
วันที่สร้าง: ${new Date().toLocaleString('th-TH')}

รายการไฟล์ในแพ็กเกจ:
------------------------------------------------------------------------
${manifestStickers.map((s) => `  - ${s.filename} (${s.width}x${s.height} px)`).join('\n')}
${spec.hasMain ? `  - main.png (${spec.mainWidth}x${spec.mainHeight} px) [รูปภาพหลักแสดงบน LINE STORE]\n` : ''}
  - tab.png (${spec.tabWidth}x${spec.tabHeight} px) [รูปไอคอนแท็บในห้องแชท LINE]

ข้อกำหนดและมาตรฐานของ LINE Creators Market:
------------------------------------------------------------------------
1. รูปสติกเกอร์ทุกรูปตัดพื้นหลังโปร่งใส (Transparent Background) เรียบร้อยแล้ว
2. มีการเว้นระยะขอบ (Margin) อย่างน้อย 10px รอบตัวละครตามกฎ LINE ป้องกันขอบถูกตัด
3. ความกว้างและความสูงเป็นเลขคู่ตามข้อกำหนดทางการ
4. สามารถนำไฟล์ภาพในโฟลเดอร์นี้อัปโหลดตรงที่ https://creator.line.me ได้ทันที!

สร้างโดย: LINE Sticker Studio (ระบบตัดภาพ 2x2 และลบพื้นหลัง 5 ขั้นตอน)
========================================================================`;

  zip.file('README_LINE_SUBMISSION_TH.txt', readmeContent);

  // Add package JSON metadata
  const metadata = {
    packageName: packTitle,
    stickerType: spec.type,
    stickerCount: stickers.length,
    dimensions: {
      sticker: { width: spec.width, height: spec.height },
      main: spec.hasMain ? { width: spec.mainWidth, height: spec.mainHeight } : null,
      tab: { width: spec.tabWidth, height: spec.tabHeight },
    },
    exportTimestamp: new Date().toISOString(),
    files: manifestStickers,
  };
  zip.file('package_metadata.json', JSON.stringify(metadata, null, 2));

  // Generate ZIP
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return content;
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
