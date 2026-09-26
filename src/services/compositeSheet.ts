/**
 * Composite Preview Sheet Generator
 * Generates an official 4x10 Grid composite image showing all stickers (up to 40)
 * with customizable background: Transparent / White / Black / LINE Blue.
 */

import { STICKER_SPECS, StickerItem, StickerType } from '../types/sticker';
import { loadImage } from './stickerProcessor';

export type CompositeBgColor = 'transparent' | 'white' | 'black' | 'lineblue';

export interface CompositeSheetOptions {
  stickers: StickerItem[];
  stickerType: StickerType;
  bgColor: CompositeBgColor;
  title?: string;
  columns?: number; // default 4
  maxRows?: number; // default 10 (4x10 = 40 stickers)
}

export async function generateCompositeSheet({
  stickers,
  stickerType,
  bgColor,
  title = 'LINE STICKER PREVIEW SHEET',
  columns = 4,
  maxRows = 10,
}: CompositeSheetOptions): Promise<string> {
  const spec = STICKER_SPECS[stickerType];

  // Each cell dimensions
  const cellW = 370;
  const cellH = 320;
  const gap = 30;
  const paddingX = 40;
  const headerH = 120;
  const footerH = 60;

  // Determine row count: standard is 10 rows (for 40 stickers) or at least 2 rows
  const actualCount = stickers.length;
  const rows = Math.max(2, Math.min(maxRows, Math.ceil(Math.max(actualCount, 8) / columns)));

  const totalW = paddingX * 2 + columns * cellW + (columns - 1) * gap;
  const totalH = headerH + rows * cellH + (rows - 1) * gap + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw Background
  if (bgColor === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (bgColor === 'black') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (bgColor === 'lineblue') {
    ctx.fillStyle = '#849EBF';
    ctx.fillRect(0, 0, totalW, totalH);
  } else {
    // Transparent background: clearRect is enough for PNG alpha export
    ctx.clearRect(0, 0, totalW, totalH);
  }

  // 2. Draw Header
  const isLightBg = bgColor === 'white';
  const textColor = isLightBg ? '#0F172A' : '#FFFFFF';
  const subtextColor = isLightBg ? '#64748B' : '#94A3B8';
  const cellBorderColor = isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  ctx.fillStyle = textColor;
  ctx.font = 'bold 36px Prompt, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, paddingX, 60);

  ctx.font = '500 20px Prompt, sans-serif';
  ctx.fillStyle = isLightBg ? '#059669' : '#34D399';
  ctx.fillText(`${spec.nameTh} • 4×10 Grid (${actualCount} สติกเกอร์)`, paddingX, 95);

  ctx.textAlign = 'right';
  ctx.font = '500 18px monospace';
  ctx.fillStyle = subtextColor;
  ctx.fillText(`370×320 px (Margin ${spec.margin}px)`, totalW - paddingX, 75);

  // 3. Render 4x10 Grid Cells
  const totalSlots = columns * rows;

  for (let i = 0; i < totalSlots; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const x = paddingX + col * (cellW + gap);
    const y = headerH + row * (cellH + gap);

    // Draw subtle cell frame
    ctx.fillStyle = isLightBg ? '#F8FAFC' : 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, 16);
    ctx.fill();

    ctx.strokeStyle = cellBorderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const stickerNum = (i + 1).toString().padStart(2, '0');

    if (i < stickers.length) {
      const sticker = stickers[i];
      try {
        const img = await loadImage(sticker.processedDataUrl);
        // Draw centered inside cell
        const drawScale = Math.min((cellW - 20) / sticker.width, (cellH - 20) / sticker.height, 1);
        const dw = sticker.width * drawScale;
        const dh = sticker.height * drawScale;
        const dx = x + (cellW - dw) / 2;
        const dy = y + (cellH - dh) / 2;

        ctx.drawImage(img, dx, dy, dw, dh);
      } catch (e) {
        console.error('Failed to draw sticker on sheet:', e);
      }

      // Draw number badge
      ctx.fillStyle = isLightBg ? '#0F172A' : '#34D399';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${stickerNum}.png`, x + 16, y + 28);

      // If Main or Tab
      if (sticker.isMain) {
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 14px Prompt, sans-serif';
        ctx.fillText('★ MAIN', x + cellW - 75, y + 28);
      } else if (sticker.isTab) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 14px Prompt, sans-serif';
        ctx.fillText('● TAB', x + cellW - 65, y + 28);
      }
    } else {
      // Empty slot placeholder
      ctx.fillStyle = isLightBg ? '#CBD5E1' : '#475569';
      ctx.font = '600 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+ ${stickerNum}.png (ว่าง)`, x + cellW / 2, y + cellH / 2);
    }
  }

  // 4. Draw Footer
  ctx.textAlign = 'center';
  ctx.font = '400 16px Prompt, sans-serif';
  ctx.fillStyle = subtextColor;
  ctx.fillText(
    'สร้างโดย LINE Sticker Studio • ไฟล์ภาพรวมสำหรับตรวจสอบก่อนส่งขาย LINE Creators Market',
    totalW / 2,
    totalH - 25
  );

  return canvas.toDataURL('image/png');
}
