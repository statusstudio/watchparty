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

export type LinePackageType = 'standard' | 'big' | 'emoji';

export interface LinePackageSpec {
  id: LinePackageType;
  name: string;
  shortName: string;
  stickerWidth: number;
  stickerHeight: number;
  defaultMargin: number;
  hasMain: boolean;
  mainWidth: number;
  mainHeight: number;
  hasTab: boolean;
  tabWidth: number;
  tabHeight: number;
  filenamePad: number; // 2 for '01.png', 3 for '001.png'
  description: string;
  badge: string;
}

export const LINE_PACKAGE_SPECS: Record<LinePackageType, LinePackageSpec> = {
  standard: {
    id: 'standard',
    name: 'สติกเกอร์มาตรฐาน (Standard)',
    shortName: 'Standard',
    stickerWidth: 370,
    stickerHeight: 320,
    defaultMargin: 10,
    hasMain: true,
    mainWidth: 240,
    mainHeight: 240,
    hasTab: true,
    tabWidth: 96,
    tabHeight: 74,
    filenamePad: 2,
    description: 'ขนาดสูงสุด 370 x 320 px (ขอบ 10px) พร้อม main.png และ tab.png',
    badge: '370 x 320 px',
  },
  big: {
    id: 'big',
    name: 'บิ๊กสติกเกอร์ (Big Sticker)',
    shortName: 'Big Sticker',
    stickerWidth: 396,
    stickerHeight: 660,
    defaultMargin: 10,
    hasMain: true,
    mainWidth: 240,
    mainHeight: 240,
    hasTab: true,
    tabWidth: 96,
    tabHeight: 74,
    filenamePad: 2,
    description: 'ขนาดใหญ่พิเศษสูงสุด 396 x 660 px (แนวตั้ง ขอบ 10px) พร้อม main.png และ tab.png',
    badge: '396 x 660 px',
  },
  emoji: {
    id: 'emoji',
    name: 'LINE อิโมจิ (Emoji)',
    shortName: 'Emoji',
    stickerWidth: 180,
    stickerHeight: 180,
    defaultMargin: 2,
    hasMain: false,
    mainWidth: 240,
    mainHeight: 240,
    hasTab: true,
    tabWidth: 96,
    tabHeight: 74,
    filenamePad: 3,
    description: 'ขนาดพอดี 180 x 180 px (ไร้ขอบ เพื่อความชัดในแชท) พร้อม tab.png และชื่อไฟล์ 001.png-040.png',
    badge: '180 x 180 px',
  },
};

export interface RemoveBgOptions {
  targetColor?: { r: number; g: number; b: number };
  autoSampleCorners?: boolean; // automatically sample slice corners for 100% accurate background color
  packageType?: LinePackageType; // 'standard' (370x320), 'big' (396x660), or 'emoji' (180x180)
  tolerance: number; // 0 - 100
  hueTolerance?: number; // 0 - 60 degrees (default: 28)
  removeShadows?: boolean; // Smart floor shadow removal (default: true)
  choke?: number; // 0 - 3px mask choke/erosion to eliminate fringe (default: 1.2)
  defringe?: boolean; // Color decontamination / spill suppression (default: true)
  addWhiteStroke?: boolean; // Optional clean white die-cut outline (default: false)
  strokeWidth?: number; // 1 - 5px outline width (default: 3)
  feather?: number; // 0 - 10px edge smoothing
  mode: 'floodfill' | 'global'; // default 'global'
  margin: number; // padding around sticker content, default 10px (LINE spec)
  fixedCanvasSize?: boolean; // if true, stickers are fixed canvas per package spec
}

/**
 * Converts RGB (0-255) to HSV [H (0-360), S (0-1), V (0-1)]
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, v];
}

/**
 * Calculates cyclical distance between two hue angles (0 to 180 degrees)
 */
export function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
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
 * 1. Smart Hue-Chroma Keying & Flood-fill / Global removal.
 * 2. Intelligent Floor Shadow Removal (matching hue with high saturation).
 * 3. Alpha Matte Choke/Erosion (cleans 0.5 - 2px transition fringe).
 * 4. Universal Spill Suppression / Defringe (neutralizes color halos on white outlines and character edges).
 * 5. Tight bounding-box content trimming.
 * 6. Rescaling to fit max 370x320 with 10px margin, centered on transparent canvas.
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

  const {
    targetColor,
    autoSampleCorners = true,
    tolerance = 20,
    hueTolerance = 28,
    removeShadows = true,
    choke = 1.2,
    defringe = true,
    addWhiteStroke = false,
    strokeWidth = 3,
    mode = 'global',
  } = options;

  // Auto-sample 4 corner regions (5x5 pixels each) from the slice itself for guaranteed accuracy
  let bgR = targetColor?.r ?? 224;
  let bgG = targetColor?.g ?? 0;
  let bgB = targetColor?.b ?? 150;

  if (autoSampleCorners && w >= 10 && h >= 10) {
    let sR = 0, sG = 0, sB = 0, sCount = 0;
    const sampleBoxes = [
      { x0: 0, y0: 0 },
      { x0: w - 5, y0: 0 },
      { x0: 0, y0: h - 5 },
      { x0: w - 5, y0: h - 5 },
    ];
    for (const box of sampleBoxes) {
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const idx = ((box.y0 + dy) * w + (box.x0 + dx)) * 4;
          sR += pixels[idx];
          sG += pixels[idx + 1];
          sB += pixels[idx + 2];
          sCount++;
        }
      }
    }
    if (sCount > 0) {
      bgR = Math.round(sR / sCount);
      bgG = Math.round(sG / sCount);
      bgB = Math.round(sB / sCount);
    }
  }

  const isWhiteBg = bgR > 215 && bgG > 215 && bgB > 215;
  const isDarkBg = bgR < 35 && bgG < 35 && bgB < 35;
  const isTargetMagenta = bgR > 120 && bgB > 120 && bgG < Math.min(bgR, bgB);

  // For white or black background, global mode will hollow out white/black elements inside the artwork
  // (e.g. white text fill, striped shirts, hair highlights, eyes, teeth).
  // Automatically enforce floodfill when background is white or dark to protect internal artwork.
  const effectiveMode = (isWhiteBg || isDarkBg) ? 'floodfill' : mode;

  const maxRgbDist = isWhiteBg
    ? (tolerance / 100) * 110 + 6
    : isDarkBg
    ? (tolerance / 100) * 110 + 6
    : (tolerance / 100) * 180 + (isTargetMagenta ? 20 : 5);

  const [tH] = rgbToHsv(bgR, bgG, bgB);

  const isColorBackground = (r: number, g: number, b: number): boolean => {
    // 1. Direct RGB closeness to slice background
    const dR = r - bgR;
    const dG = g - bgG;
    const dB = b - bgB;
    const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);
    if (dist <= maxRgbDist) return true;

    // 2. Smart Hue-Chroma Keying (removes floor shadows, lighting gradients of same hue)
    // Only applies to saturated colored backgrounds (e.g. magenta, green), not monochrome white/black
    if (removeShadows && !isWhiteBg && !isDarkBg) {
      const [hVal, sVal, vVal] = rgbToHsv(r, g, b);
      const dH = hueDistance(hVal, tH);
      // Floor shadows & backdrop gradients: matching hue within 28°, high saturation (s >= 0.50), mid-to-high brightness (v >= 0.38)
      if (dH <= hueTolerance && sVal >= 0.50 && vVal >= 0.38) {
        return true;
      }
    }

    return false;
  };

  const isBg = new Uint8Array(w * h);

  if (effectiveMode === 'global') {
    for (let i = 0; i < w * h; i++) {
      const pIdx = i * 4;
      if (isColorBackground(pixels[pIdx], pixels[pIdx + 1], pixels[pIdx + 2])) {
        isBg[i] = 1;
      }
    }
  } else {
    // Flood-fill BFS starting from 4 borders
    const queue = new Int32Array(w * h);
    let queueStart = 0;
    let queueEnd = 0;

    const pushQueue = (x: number, y: number) => {
      const idx = y * w + x;
      if (isBg[idx]) return;
      const pIdx = idx * 4;
      if (isColorBackground(pixels[pIdx], pixels[pIdx + 1], pixels[pIdx + 2])) {
        isBg[idx] = 1;
        queue[queueEnd++] = (y << 16) | x;
      }
    };

    for (let x = 0; x < w; x++) {
      pushQueue(x, 0);
      pushQueue(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      pushQueue(0, y);
      pushQueue(w - 1, y);
    }

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
            if (isColorBackground(pixels[pIdx], pixels[pIdx + 1], pixels[pIdx + 2])) {
              isBg[nIdx] = 1;
              queue[queueEnd++] = (ny << 16) | nx;
            }
          }
        }
      }
    }
  }

  // Alpha mask
  const alphaMask = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alphaMask[i] = isBg[i] ? 0 : 255;
  }

  // Choke / Erode alpha mask (eliminates dirty edge pixels)
  let erodedMask = alphaMask;
  if (choke > 0) {
    erodedMask = new Float32Array(w * h);
    const radius = Math.ceil(choke);
    const chokeFactor = choke;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (alphaMask[idx] === 0) {
          erodedMask[idx] = 0;
          continue;
        }

        let minDist = 999;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (alphaMask[ny * w + nx] === 0) {
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < minDist) minDist = d;
            }
          }
        }

        if (minDist <= chokeFactor) {
          const ratio = minDist / chokeFactor;
          erodedMask[idx] = Math.max(0, Math.min(255, ratio * 255));
        } else {
          erodedMask[idx] = 255;
        }
      }
    }
  }

  // Universal Spill Suppression / Defringing
  const isTargetGreen = bgG > Math.max(bgR, bgB) + 30;
  const isTargetBlue = bgB > Math.max(bgR, bgG) + 30;

  for (let i = 0; i < w * h; i++) {
    const pIdx = i * 4;
    let r = pixels[pIdx];
    let g = pixels[pIdx + 1];
    let b = pixels[pIdx + 2];
    const a = Math.round(erodedMask[i]);

    if (a > 0 && defringe) {
      const [hVal, sVal] = rgbToHsv(r, g, b);
      const dH = hueDistance(hVal, tH);

      if (isTargetMagenta) {
        if (dH < 45 || (r > g + 15 && b > g + 15)) {
          const brightness = (r + g + b) / 3;

          if (brightness > 165) {
            // White outline pixel: clean to pure crisp white
            const maxVal = Math.max(r, g, b);
            r = maxVal;
            g = maxVal;
            b = maxVal;
          } else if (hVal > 5 && hVal < 35 && sVal < 0.6) {
            // Peach skin tone: clamp excess Blue from magenta bounce
            if (b > g * 0.8) {
              b = Math.round(g * 0.8);
            }
          } else {
            // Dark/Neutral tones (hat, hair, kimono): clamp excess Red & Blue to eliminate fringe
            const excess = Math.max(0, Math.min(r, b) - g);
            if (excess > 3) {
              r = Math.max(0, r - Math.round(excess * 0.95));
              b = Math.max(0, b - Math.round(excess * 0.95));
            }
          }
        }
      } else if (isTargetGreen) {
        const spill = Math.max(0, g - Math.max(r, b));
        if (spill > 5) {
          const brightness = (r + g + b) / 3;
          if (brightness > 165) {
            r = Math.min(255, Math.round(r + spill * 0.95));
            b = Math.min(255, Math.round(b + spill * 0.95));
          } else {
            g = Math.max(0, g - Math.round(spill * 0.85));
          }
        }
      } else if (isTargetBlue) {
        const spill = Math.max(0, b - Math.max(r, g));
        if (spill > 5) {
          const brightness = (r + g + b) / 3;
          if (brightness > 165) {
            r = Math.min(255, Math.round(r + spill * 0.95));
            g = Math.min(255, Math.round(g + spill * 0.95));
          } else {
            b = Math.max(0, b - Math.round(spill * 0.85));
          }
        }
      }
    }

    pixels[pIdx] = r;
    pixels[pIdx + 1] = g;
    pixels[pIdx + 2] = b;
    pixels[pIdx + 3] = a;
  }

  // Optional: Add clean white sticker die-cut stroke
  if (addWhiteStroke && strokeWidth > 0) {
    const strokeRad = Math.ceil(strokeWidth);
    const strokeData = new Uint8Array(pixels);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const origA = pixels[idx + 3];

        if (origA > 200) {
          // Inside original content
          strokeData[idx] = pixels[idx];
          strokeData[idx + 1] = pixels[idx + 1];
          strokeData[idx + 2] = pixels[idx + 2];
          strokeData[idx + 3] = origA;
        } else {
          // Check distance to foreground
          let minDist = 999;
          for (let dy = -strokeRad; dy <= strokeRad; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -strokeRad; dx <= strokeRad; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              const nA = pixels[(ny * w + nx) * 4 + 3];
              if (nA > 150) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist) minDist = d;
              }
            }
          }

          if (minDist <= strokeWidth) {
            const alpha = Math.min(255, Math.max(0, Math.round((1 - (minDist - (strokeWidth - 1))) * 255)));
            strokeData[idx] = 255;
            strokeData[idx + 1] = 255;
            strokeData[idx + 2] = 255;
            strokeData[idx + 3] = minDist < strokeWidth - 0.5 ? 255 : alpha;
          } else {
            strokeData[idx + 3] = 0;
          }
        }
      }
    }

    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = strokeData[i];
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 2. Find bounding box of remaining content (Auto-trim)
  const trimmedCanvas = getTrimmedCanvas(canvas);

  // 3. Format into LINE Sticker specification per package type
  const pkgType = options.packageType || 'standard';
  const defaultMarg = options.margin !== undefined ? options.margin : (pkgType === 'emoji' ? 2 : 10);
  return formatToLineSticker(trimmedCanvas, defaultMarg, options.fixedCanvasSize ?? true, pkgType);
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
 * Resizes and centers content onto LINE Sticker canvas according to LINE specifications:
 * - Standard: 370 x 320 px (Margin 10px)
 * - Big Sticker: 396 x 660 px (Margin 10px)
 * - Emoji: 180 x 180 px (Margin 0-2px)
 * - Canvas dimensions are guaranteed to be even numbers
 */
function formatToLineSticker(
  contentCanvas: HTMLCanvasElement,
  margin: number,
  fixedCanvasSize = true,
  packageType: LinePackageType = 'standard'
): string {
  const spec = LINE_PACKAGE_SPECS[packageType] || LINE_PACKAGE_SPECS.standard;
  const targetW = spec.stickerWidth;
  const targetH = spec.stickerHeight;
  const maxContentW = Math.max(10, targetW - margin * 2);
  const maxContentH = Math.max(10, targetH - margin * 2);

  const contentW = contentCanvas.width;
  const contentH = contentCanvas.height;

  // Scale to fit content area while preserving aspect ratio
  const scale = Math.min(maxContentW / contentW, maxContentH / contentH, 1.0);
  const drawW = Math.round(contentW * scale);
  const drawH = Math.round(contentH * scale);

  let canvasW: number;
  let canvasH: number;

  if (fixedCanvasSize) {
    canvasW = targetW;
    canvasH = targetH;
  } else {
    // Dynamic bounding size with margin, ensuring even numbers
    canvasW = drawW + margin * 2;
    canvasH = drawH + margin * 2;
    if (canvasW % 2 !== 0) canvasW += 1;
    if (canvasH % 2 !== 0) canvasH += 1;
    if (canvasW > targetW) canvasW = targetW;
    if (canvasH > targetH) canvasH = targetH;
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
 * - Standard / Big Sticker: 01.png-40.png, main.png (240x240), tab.png (96x74)
 * - Emoji: 001.png-040.png (3 digits), tab.png (96x74) (no main.png required)
 */
export async function createLineStickerZip(
  stickers: string[], // Array of processed sticker data URLs (e.g. 40 items)
  mainDataUrl: string,
  tabDataUrl: string,
  zipFilename = 'line_stickers_package.zip',
  packageType: LinePackageType = 'standard'
): Promise<Blob> {
  const zip = new JSZip();
  const spec = LINE_PACKAGE_SPECS[packageType] || LINE_PACKAGE_SPECS.standard;

  // Helper to convert dataUrl to Uint8Array for JSZip
  const addDataUrlToZip = (filename: string, dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    zip.file(filename, base64, { base64: true });
  };

  // 1. Add all stickers (01.png or 001.png for emoji)
  for (let i = 0; i < stickers.length; i++) {
    const num = (i + 1).toString().padStart(spec.filenamePad, '0');
    addDataUrlToZip(`${num}.png`, stickers[i]);
  }

  // 2. Add main.png (only for standard and big stickers, not emoji)
  if (spec.hasMain && mainDataUrl) {
    addDataUrlToZip('main.png', mainDataUrl);
  }

  // 3. Add tab.png
  if (tabDataUrl) {
    addDataUrlToZip('tab.png', tabDataUrl);
  }

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

export interface CompositeSheetOptions {
  columns?: number; // default 4
  packageType?: LinePackageType; // 'standard', 'big', or 'emoji'
  backgroundColor?: string; // 'transparent', '#ffffff', '#000000', etc.
  padding?: number; // outer padding around whole sheet
  gapX?: number; // gap between columns
  gapY?: number; // gap between rows
  scale?: number; // resolution scale, default 1.0
}

/**
 * Creates a combined 4x10 grid overview sheet containing all 40 stickers in one high-res image
 */
export async function createCompositeSheet(
  stickers: string[],
  options?: CompositeSheetOptions
): Promise<string> {
  const columns = options?.columns ?? 4;
  const count = stickers.length;
  const rows = Math.ceil(count / columns) || 10;
  const bgColor = options?.backgroundColor ?? 'transparent';
  const scale = options?.scale ?? 1.0;
  const pkgType = options?.packageType || 'standard';
  const spec = LINE_PACKAGE_SPECS[pkgType] || LINE_PACKAGE_SPECS.standard;

  const baseCellW = spec.stickerWidth;
  const baseCellH = spec.stickerHeight;
  const cellW = Math.round(baseCellW * scale);
  const cellH = Math.round(baseCellH * scale);
  const pad = Math.round((options?.padding ?? 40) * scale);
  const gapX = Math.round((options?.gapX ?? 24) * scale);
  const gapY = Math.round((options?.gapY ?? 32) * scale);

  const totalW = pad * 2 + columns * cellW + (columns - 1) * gapX;
  const totalH = pad * 2 + rows * cellH + (rows - 1) * gapY;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const cellX = pad + col * (cellW + gapX);
    const cellY = pad + row * (cellH + gapY);

    try {
      const img = await loadImage(stickers[i]);
      const imgScale = Math.min(cellW / img.width, cellH / img.height);
      const drawW = Math.round(img.width * imgScale);
      const drawH = Math.round(img.height * imgScale);
      const drawX = cellX + Math.round((cellW - drawW) / 2);
      const drawY = cellY + Math.round((cellH - drawH) / 2);

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch (err) {
      console.error(`Failed to draw sticker ${i} on composite sheet:`, err);
    }
  }

  return canvas.toDataURL('image/png');
}

