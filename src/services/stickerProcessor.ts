import JSZip from 'jszip';

export interface StickerSlice {
  id: string;
  sourceImageIndex: number;
  sliceIndex: number; // 0: TL, 1: TR, 2: BL, 3: BR
  dataUrl: string; // raw sliced image data URL
  processedDataUrl: string; // background removed & resized to LINE spec
  width: number;
  height: number;
}

export interface RemoveBgOptions {
  targetColor: { r: number; g: number; b: number };
  tolerance: number; // 0 - 100
  feather: number; // 0 - 10px edge smoothing
  mode: 'floodfill' | 'global'; // floodfill: from outer edges inward, global: all matching pixels
  margin: number; // padding around sticker content, default 10px (LINE spec)
  fixedCanvasSize?: boolean; // if true, stickers are fixed 370x320 canvas
}

/**
 * Loads an image from a File or Data URL into an HTMLImageElement
 */
export function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(src);
    }
  });
}

/**
 * Slices a 2x2 grid image into 4 individual pieces:
 * 0: Top-Left (TL)
 * 1: Top-Right (TR)
 * 2: Bottom-Left (BL)
 * 3: Bottom-Right (BR)
 */
export async function slice2x2Grid(
  imageSource: HTMLImageElement | string | File,
  sourceIndex: number
): Promise<StickerSlice[]> {
  const img = imageSource instanceof HTMLImageElement ? imageSource : await loadImage(imageSource);
  const totalW = img.naturalWidth || img.width;
  const totalH = img.naturalHeight || img.height;

  const halfW = Math.floor(totalW / 2);
  const halfH = Math.floor(totalH / 2);

  const slicesDef = [
    { name: 'TL', x: 0, y: 0, w: halfW, h: halfH },
    { name: 'TR', x: halfW, y: 0, w: totalW - halfW, h: halfH },
    { name: 'BL', x: 0, y: halfH, w: halfW, h: totalH - halfH },
    { name: 'BR', x: halfW, y: halfH, w: totalW - halfW, h: totalH - halfH },
  ];

  const results: StickerSlice[] = [];

  for (let i = 0; i < slicesDef.length; i++) {
    const def = slicesDef[i];
    const canvas = document.createElement('canvas');
    canvas.width = def.w;
    canvas.height = def.h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) continue;

    ctx.drawImage(img, def.x, def.y, def.w, def.h, 0, 0, def.w, def.h);
    const dataUrl = canvas.toDataURL('image/png');

    results.push({
      id: `sticker-s${sourceIndex}-p${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceImageIndex: sourceIndex,
      sliceIndex: i,
      dataUrl,
      processedDataUrl: dataUrl,
      width: def.w,
      height: def.h,
    });
  }

  return results;
}

/**
 * Auto-detects dominant background color by sampling the 4 outer corner pixels of an image.
 */
export function detectBackgroundColor(img: HTMLImageElement | HTMLCanvasElement): { r: number; g: number; b: number; hex: string } {
  const canvas = document.createElement('canvas');
  const w = img.width || 100;
  const h = img.height || 100;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { r: 224, g: 0, b: 150, hex: '#e00096' }; // Default sample magenta

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h).data;

  // Sample corners: (2,2), (w-3, 2), (2, h-3), (w-3, h-3)
  const samplePoints = [
    { x: Math.min(4, w - 1), y: Math.min(4, h - 1) },
    { x: Math.max(0, w - 5), y: Math.min(4, h - 1) },
    { x: Math.min(4, w - 1), y: Math.max(0, h - 5) },
    { x: Math.max(0, w - 5), y: Math.max(0, h - 5) },
  ];

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  for (const pt of samplePoints) {
    const idx = (pt.y * w + pt.x) * 4;
    rSum += imgData[idx];
    gSum += imgData[idx + 1];
    bSum += imgData[idx + 2];
  }

  const r = Math.round(rSum / samplePoints.length);
  const g = Math.round(gSum / samplePoints.length);
  const b = Math.round(bSum / samplePoints.length);

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  return { r, g, b, hex };
}

/**
 * Calculates perceived color distance between two RGB colors (0 to ~441).
 * Uses human eye weighted Euclidean formula for superior accuracy.
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dR = r1 - r2;
  const dG = g1 - g2;
  const dB = b1 - b2;
  // Perceptual color distance formula (Redmean metric)
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * dR * dR +
      4 * dG * dG +
      (2 + (255 - rMean) / 256) * dB * dB
  );
}

/**
 * Removes background from an image slice and fits it into LINE sticker specs:
 * 1. Color keying / Flood-fill background removal with anti-aliasing.
 * 2. Tight bounding-box content trimming.
 * 3. Rescaling to fit max 370x320 with 10px margin, centered on transparent canvas.
 */
export async function processStickerImage(
  dataUrl: string,
  options: RemoveBgOptions
): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // 1. Draw raw slice onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  const { targetColor, tolerance, feather, mode } = options;
  // Map tolerance (0-100) to perceptual distance threshold (0-250)
  const maxThreshold = (tolerance / 100) * 255;
  const featherRange = Math.max(1, feather * 10);

  if (mode === 'floodfill') {
    // Flood-fill BFS starting from all 4 borders
    const isBg = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let queueStart = 0;
    let queueEnd = 0;

    const pushQueue = (x: number, y: number) => {
      const idx = y * w + x;
      if (isBg[idx]) return;
      const pIdx = idx * 4;
      const d = colorDistance(
        pixels[pIdx],
        pixels[pIdx + 1],
        pixels[pIdx + 2],
        targetColor.r,
        targetColor.g,
        targetColor.b
      );
      if (d <= maxThreshold + featherRange) {
        isBg[idx] = 1;
        queue[queueEnd++] = (y << 16) | x;
      }
    };

    // Seed outer borders
    for (let x = 0; x < w; x++) {
      pushQueue(x, 0);
      pushQueue(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      pushQueue(0, y);
      pushQueue(w - 1, y);
    }

    // BFS expansion
    while (queueStart < queueEnd) {
      const val = queue[queueStart++];
      const cx = val & 0xffff;
      const cy = val >> 16;

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (let n = 0; n < 4; n++) {
        const nx = neighbors[n][0];
        const ny = neighbors[n][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nIdx = ny * w + nx;
          if (!isBg[nIdx]) {
            const pIdx = nIdx * 4;
            const d = colorDistance(
              pixels[pIdx],
              pixels[pIdx + 1],
              pixels[pIdx + 2],
              targetColor.r,
              targetColor.g,
              targetColor.b
            );
            if (d <= maxThreshold + featherRange) {
              isBg[nIdx] = 1;
              queue[queueEnd++] = (ny << 16) | nx;
            }
          }
        }
      }
    }

    // Apply alpha transparency based on isBg and feathering
    for (let i = 0; i < w * h; i++) {
      if (isBg[i]) {
        const pIdx = i * 4;
        const d = colorDistance(
          pixels[pIdx],
          pixels[pIdx + 1],
          pixels[pIdx + 2],
          targetColor.r,
          targetColor.g,
          targetColor.b
        );
        if (d <= maxThreshold) {
          pixels[pIdx + 3] = 0; // Completely transparent
        } else {
          // Smooth feather edge
          const alphaRatio = (d - maxThreshold) / featherRange;
          pixels[pIdx + 3] = Math.round(pixels[pIdx + 3] * Math.min(1, Math.max(0, alphaRatio)));
        }
      }
    }
  } else {
    // Global color keying (removes all matching pixels everywhere)
    for (let i = 0; i < pixels.length; i += 4) {
      const d = colorDistance(
        pixels[i],
        pixels[i + 1],
        pixels[i + 2],
        targetColor.r,
        targetColor.g,
        targetColor.b
      );
      if (d <= maxThreshold) {
        pixels[i + 3] = 0;
      } else if (d < maxThreshold + featherRange) {
        const alphaRatio = (d - maxThreshold) / featherRange;
        pixels[i + 3] = Math.round(pixels[i + 3] * alphaRatio);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 2. Find bounding box of remaining content (Auto-trim)
  const trimmedCanvas = getTrimmedCanvas(canvas);

  // 3. Format into LINE Sticker specification
  // Max size: 370 x 320 with margin 10px (Content max: 350 x 300)
  return formatToLineSticker(trimmedCanvas, options.margin || 10, options.fixedCanvasSize ?? true);
}

/**
 * Auto-trims transparent borders from a canvas, keeping only non-empty pixels.
 */
function getTrimmedCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  const imgData = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = imgData[(y * w + x) * 4 + 3];
      if (alpha > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If entire canvas is transparent
  if (minX > maxX || minY > maxY) {
    return sourceCanvas;
  }

  // Add 1px safety padding
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(w - 1, maxX + 1);
  maxY = Math.min(h - 1, maxY + 1);

  const trimW = maxX - minX + 1;
  const trimH = maxY - minY + 1;

  const cropped = document.createElement('canvas');
  cropped.width = trimW;
  cropped.height = trimH;
  const cropCtx = cropped.getContext('2d');
  if (cropCtx) {
    cropCtx.drawImage(sourceCanvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
  }
  return cropped;
}

/**
 * Resizes and centers content onto LINE Sticker canvas:
 * - Content fits within 350x300 (preserving aspect ratio)
 * - Canvas size is 370x320 (or scaled even size with 10px margin)
 * - Canvas dimensions are guaranteed to be even numbers
 */
function formatToLineSticker(
  contentCanvas: HTMLCanvasElement,
  margin: number,
  fixedCanvasSize = true
): string {
  const LINE_MAX_W = 370;
  const LINE_MAX_H = 320;
  const maxContentW = LINE_MAX_W - margin * 2; // 350
  const maxContentH = LINE_MAX_H - margin * 2; // 300

  const contentW = contentCanvas.width;
  const contentH = contentCanvas.height;

  // Scale to fit content area while preserving aspect ratio
  const scale = Math.min(maxContentW / contentW, maxContentH / contentH, 1.0);
  const drawW = Math.round(contentW * scale);
  const drawH = Math.round(contentH * scale);

  let canvasW: number;
  let canvasH: number;

  if (fixedCanvasSize) {
    canvasW = LINE_MAX_W;
    canvasH = LINE_MAX_H;
  } else {
    // Dynamic bounding size with margin, ensuring even numbers
    canvasW = drawW + margin * 2;
    canvasH = drawH + margin * 2;
    if (canvasW % 2 !== 0) canvasW += 1;
    if (canvasH % 2 !== 0) canvasH += 1;
    if (canvasW > LINE_MAX_W) canvasW = LINE_MAX_W;
    if (canvasH > LINE_MAX_H) canvasH = LINE_MAX_H;
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvasW;
  finalCanvas.height = canvasH;
  const ctx = finalCanvas.getContext('2d');
  if (!ctx) return contentCanvas.toDataURL('image/png');

  // Center sticker content
  const offsetX = Math.round((canvasW - drawW) / 2);
  const offsetY = Math.round((canvasH - drawH) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(contentCanvas, 0, 0, contentW, contentH, offsetX, offsetY, drawW, drawH);

  return finalCanvas.toDataURL('image/png');
}

/**
 * Creates main.png:
 * Exact 240 x 240 px, transparent background, centered with 10px margin (content max 220x220).
 */
export async function createMainImage(sourceDataUrl: string): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const trimmed = getTrimmedCanvas(imageToCanvas(img));

  const targetW = 240;
  const targetH = 240;
  const margin = 10;
  const maxContent = targetW - margin * 2; // 220

  const scale = Math.min(maxContent / trimmed.width, maxContent / trimmed.height);
  const drawW = Math.round(trimmed.width * scale);
  const drawH = Math.round(trimmed.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceDataUrl;

  const offsetX = Math.round((targetW - drawW) / 2);
  const offsetY = Math.round((targetH - drawH) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(trimmed, 0, 0, trimmed.width, trimmed.height, offsetX, offsetY, drawW, drawH);

  return canvas.toDataURL('image/png');
}

/**
 * Creates tab.png:
 * Exact 96 x 74 px, transparent background, centered with margin (content max 88x66).
 */
export async function createTabImage(sourceDataUrl: string): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const trimmed = getTrimmedCanvas(imageToCanvas(img));

  const targetW = 96;
  const targetH = 74;
  const maxContentW = 88;
  const maxContentH = 66;

  const scale = Math.min(maxContentW / trimmed.width, maxContentH / trimmed.height);
  const drawW = Math.round(trimmed.width * scale);
  const drawH = Math.round(trimmed.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceDataUrl;

  const offsetX = Math.round((targetW - drawW) / 2);
  const offsetY = Math.round((targetH - drawH) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(trimmed, 0, 0, trimmed.width, trimmed.height, offsetX, offsetY, drawW, drawH);

  return canvas.toDataURL('image/png');
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Generates full LINE Creators Market ZIP package containing:
 * - 01.png, 02.png, ..., 40.png
 * - main.png (240x240)
 * - tab.png (96x74)
 */
export async function createLineStickerZip(
  stickers: string[], // Array of processed sticker data URLs (e.g. 40 items)
  mainDataUrl: string,
  tabDataUrl: string,
  zipFilename = 'line_stickers_package.zip'
): Promise<Blob> {
  const zip = new JSZip();

  // Helper to convert dataUrl to Uint8Array for JSZip
  const addDataUrlToZip = (filename: string, dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    zip.file(filename, base64, { base64: true });
  };

  // 1. Add all stickers (01.png to XX.png)
  for (let i = 0; i < stickers.length; i++) {
    const num = (i + 1).toString().padStart(2, '0');
    addDataUrlToZip(`${num}.png`, stickers[i]);
  }

  // 2. Add main.png
  addDataUrlToZip('main.png', mainDataUrl);

  // 3. Add tab.png
  addDataUrlToZip('tab.png', tabDataUrl);

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}

/**
 * Triggers browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
