/**
 * 5-Step Background Removal & LINE Sticker Processing Engine
 * High-performance, client-side Canvas & Uint32/Uint8Array image processing.
 */

import {
  BgMode,
  DetectedBgInfo,
  ProcessingParams,
  STICKER_SPECS,
  StickerType,
} from '../types/sticker';

/**
 * Utility: Convert RGB to HSV
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  if (diff > 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / diff) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / diff + 2;
    } else {
      h = (rNorm - gNorm) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

/**
 * Utility: Convert RGB to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Helper to load an image source into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Step 1: Auto-detect Background Color
 * Sample 4 corners of the image (5x5 px each: Top-Left, Top-Right, Bottom-Left, Bottom-Right)
 * and calculate average RGB to determine the background color.
 */
export function detectBackgroundColor(ctx: CanvasRenderingContext2D, width: number, height: number): DetectedBgInfo {
  const sampleSize = 5;
  const corners = [
    { startX: 0, startY: 0 }, // Top-Left
    { startX: Math.max(0, width - sampleSize), startY: 0 }, // Top-Right
    { startX: 0, startY: Math.max(0, height - sampleSize) }, // Bottom-Left
    { startX: Math.max(0, width - sampleSize), startY: Math.max(0, height - sampleSize) }, // Bottom-Right
  ];

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalPixels = 0;
  const cornerAverages: { r: number; g: number; b: number }[] = [];

  for (const corner of corners) {
    const w = Math.min(sampleSize, width - corner.startX);
    const h = Math.min(sampleSize, height - corner.startY);
    if (w <= 0 || h <= 0) continue;

    const imgData = ctx.getImageData(corner.startX, corner.startY, w, h);
    const data = imgData.data;

    let cR = 0, cG = 0, cB = 0, cCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Ignore if corner pixel is already transparent
      if (data[i + 3] > 20) {
        cR += data[i];
        cG += data[i + 1];
        cB += data[i + 2];
        cCount++;
      }
    }

    if (cCount > 0) {
      cornerAverages.push({
        r: Math.round(cR / cCount),
        g: Math.round(cG / cCount),
        b: Math.round(cB / cCount),
      });
      totalR += cR;
      totalG += cG;
      totalB += cB;
      totalPixels += cCount;
    }
  }

  const avgR = totalPixels > 0 ? Math.round(totalR / totalPixels) : 255;
  const avgG = totalPixels > 0 ? Math.round(totalG / totalPixels) : 255;
  const avgB = totalPixels > 0 ? Math.round(totalB / totalPixels) : 255;

  const isWhite = avgR > 215 && avgG > 215 && avgB > 215;
  const isBlack = avgR < 35 && avgG < 35 && avgB < 35;
  const isMagenta = avgR > 180 && avgB > 180 && avgG < 80;
  const isGreen = avgG > 140 && avgG > avgR * 1.3 && avgG > avgB * 1.3;
  const isBlue = avgB > 140 && avgB > avgR * 1.3 && avgB > avgG * 1.3;

  // Rule: If white or black, strictly enforce floodfill mode!
  let recommendedMode: BgMode = 'global';
  if (isWhite || isBlack) {
    recommendedMode = 'floodfill';
  } else if (isMagenta || isGreen || isBlue) {
    recommendedMode = 'global';
  } else {
    recommendedMode = 'floodfill';
  }

  return {
    r: avgR,
    g: avgG,
    b: avgB,
    hex: rgbToHex(avgR, avgG, avgB),
    isWhite,
    isBlack,
    isMagenta,
    isGreen,
    isBlue,
    recommendedMode,
    samples: cornerAverages,
  };
}

/**
 * Step 2: Background Keying (Two Modes: 'global' and 'floodfill')
 * - Supports Euclidean color distance with adjustable tolerance.
 * - Auto-forces floodfill if white (R>215, G>215, B>215) or black (R<35, G<35, B<35).
 * - Hue-Chroma Keying for shadows (shadows with same hue as bg, sat >= 0.5, brightness >= 0.38).
 */
export function removeBackgroundKeying(
  imageData: ImageData,
  bgInfo: DetectedBgInfo,
  params: ProcessingParams
): ImageData {
  const { width, height, data } = imageData;
  const { tolerance, removeShadows } = params;

  const targetBgR = params.customBgColor ? params.customBgColor.r : bgInfo.r;
  const targetBgG = params.customBgColor ? params.customBgColor.g : bgInfo.g;
  const targetBgB = params.customBgColor ? params.customBgColor.b : bgInfo.b;

  const bgHsv = rgbToHsv(targetBgR, targetBgG, targetBgB);

  // Determine effective mode: enforce floodfill if white or black
  let effectiveMode: BgMode = params.bgMode;
  if (bgInfo.isWhite || bgInfo.isBlack) {
    effectiveMode = 'floodfill';
  }

  // Tolerance scaled: max Euclidean distance in RGB is sqrt(255^2*3) ~= 441.67
  // tolerance 0..100 maps to 0..200 distance threshold
  const maxDistance = (tolerance / 100) * 200;

  // Helper function to check if a pixel is considered background or shadow
  const isBgOrShadow = (r: number, g: number, b: number, a: number): boolean => {
    if (a === 0) return true;

    // Euclidean color distance in RGB space
    const dr = r - targetBgR;
    const dg = g - targetBgG;
    const db = b - targetBgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= maxDistance) {
      return true;
    }

    // Step 2 Hue-Chroma Keying for floor shadows:
    // Shadows with same hue as background, saturation >= 0.5, brightness >= 0.38
    if (removeShadows && !bgInfo.isWhite && !bgInfo.isBlack) {
      const pxHsv = rgbToHsv(r, g, b);
      let hueDiff = Math.abs(pxHsv.h - bgHsv.h);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;

      // Same hue within 25 degrees, high saturation and moderate brightness
      if (hueDiff <= 25 && pxHsv.s >= 0.45 && pxHsv.v >= 0.35) {
        return true;
      }
    }

    // For white backgrounds, also detect soft gray contact shadows (r,g,b similar and high)
    if (removeShadows && bgInfo.isWhite) {
      const isNeutralGray = Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && Math.abs(r - b) < 18;
      if (isNeutralGray && r > 180 && g > 180 && b > 180 && dist <= maxDistance * 1.5) {
        return true;
      }
    }

    return false;
  };

  if (effectiveMode === 'global') {
    // Global mode: removes every matching pixel across the canvas
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (isBgOrShadow(r, g, b, a)) {
        data[i + 3] = 0;
      }
    }
  } else {
    // Floodfill mode: BFS from all 4 borders inward.
    // Protects internal white/black elements (e.g. eyes, teeth, clothes) from being cut out!
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height * 2);
    let queueStart = 0;
    let queueEnd = 0;

    const pushQueue = (x: number, y: number) => {
      const idx = y * width + x;
      if (visited[idx] === 0) {
        visited[idx] = 1;
        queue[queueEnd++] = x;
        queue[queueEnd++] = y;
      }
    };

    // Seed from top & bottom edges
    for (let x = 0; x < width; x++) {
      const topIdx = (0 * width + x) * 4;
      if (isBgOrShadow(data[topIdx], data[topIdx + 1], data[topIdx + 2], data[topIdx + 3])) {
        pushQueue(x, 0);
      }
      const bottomIdx = ((height - 1) * width + x) * 4;
      if (isBgOrShadow(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2], data[bottomIdx + 3])) {
        pushQueue(x, height - 1);
      }
    }

    // Seed from left & right edges
    for (let y = 0; y < height; y++) {
      const leftIdx = (y * width + 0) * 4;
      if (isBgOrShadow(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2], data[leftIdx + 3])) {
        pushQueue(0, y);
      }
      const rightIdx = (y * width + (width - 1)) * 4;
      if (isBgOrShadow(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2], data[rightIdx + 3])) {
        pushQueue(width - 1, y);
      }
    }

    // 4-way BFS traversal
    while (queueStart < queueEnd) {
      const cx = queue[queueStart++];
      const cy = queue[queueStart++];
      const pIdx = (cy * width + cx) * 4;

      // Make background pixel transparent
      data[pIdx + 3] = 0;

      // Check 4 adjacent neighbors (left, right, up, down)
      const neighbors = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1],
      ];

      for (let n = 0; n < 4; n++) {
        const nx = neighbors[n][0];
        const ny = neighbors[n][1];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nVisitedIdx = ny * width + nx;
          if (visited[nVisitedIdx] === 0) {
            const nPixelIdx = nVisitedIdx * 4;
            if (isBgOrShadow(data[nPixelIdx], data[nPixelIdx + 1], data[nPixelIdx + 2], data[nPixelIdx + 3])) {
              visited[nVisitedIdx] = 1;
              queue[queueEnd++] = nx;
              queue[queueEnd++] = ny;
            }
          }
        }
      }
    }

    // If removeEnclosedGaps is enabled:
    // Any remaining unvisited pixels matching the background color or shadows
    // (such as enclosed holes between arms, body, and legs) are turned transparent!
    if (params.removeEnclosedGaps) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          if (isBgOrShadow(data[i], data[i + 1], data[i + 2], data[i + 3])) {
            data[i + 3] = 0;
          }
        }
      }
    }
  }

  return imageData;
}

/**
 * Step 3: Choke / Erosion (กัดขอบ)
 * Chokes alpha mask with radius based on choke value (default 1.2px)
 * Uses per-pixel distance transform / Euclidean distance: pixels within distance < choke from bg boundary will fade/erode.
 */
export function applyChokeErosion(imageData: ImageData, choke: number): ImageData {
  if (choke <= 0) return imageData;

  const { width, height, data } = imageData;
  const originalAlpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    originalAlpha[i] = data[i * 4 + 3];
  }

  const radius = Math.ceil(choke);
  const chokeSquared = choke * choke;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alpha = originalAlpha[idx];
      if (alpha === 0) continue;

      // Find min distance to any 0-alpha pixel within radius
      let minDistanceSq = 9999;
      let foundBg = false;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          foundBg = true;
          const dsq = dy * dy;
          if (dsq < minDistanceSq) minDistanceSq = dsq;
          continue;
        }

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            foundBg = true;
            const dsq = dx * dx + dy * dy;
            if (dsq < minDistanceSq) minDistanceSq = dsq;
            continue;
          }

          const nIdx = ny * width + nx;
          if (originalAlpha[nIdx] === 0) {
            foundBg = true;
            const dsq = dx * dx + dy * dy;
            if (dsq < minDistanceSq) {
              minDistanceSq = dsq;
            }
          }
        }
      }

      if (foundBg && minDistanceSq < chokeSquared) {
        const dist = Math.sqrt(minDistanceSq);
        // Fade out proportional to distance / choke
        const factor = Math.max(0, Math.min(1, dist / choke));
        // Soft erosion transition
        data[idx * 4 + 3] = Math.round(alpha * factor);
      }
    }
  }

  return imageData;
}

/**
 * Step 4: Defringe / Spill Suppression
 * - Magenta bg: Clean white edge, suppress Red+Blue spill on dark tones
 * - Green bg: g = g - spill * 0.85
 * - Blue bg: b = b - spill * 0.85
 */
export function applyDefringe(
  imageData: ImageData,
  bgInfo: DetectedBgInfo,
  params: ProcessingParams
): ImageData {
  if (!params.defringe) return imageData;

  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (bgInfo.isMagenta) {
      // Magenta spill suppression: reduce excess Red and Blue relative to Green
      const maxOther = Math.max(g, 40);
      if (r > maxOther && b > maxOther) {
        const spill = Math.min(r - maxOther, b - maxOther);
        if (spill > 0) {
          data[i] = Math.max(0, Math.round(r - spill * 0.8));
          data[i + 2] = Math.max(0, Math.round(b - spill * 0.8));
        }
      }
    } else if (bgInfo.isGreen) {
      // Green spill suppression: g = g - spill * 0.85
      const maxRB = Math.max(r, b);
      if (g > maxRB) {
        const spill = g - maxRB;
        data[i + 1] = Math.max(0, Math.round(g - spill * 0.85));
      }
    } else if (bgInfo.isBlue) {
      // Blue spill suppression: b = b - spill * 0.85
      const maxRG = Math.max(r, g);
      if (b > maxRG) {
        const spill = b - maxRG;
        data[i + 2] = Math.max(0, Math.round(b - spill * 0.85));
      }
    } else if (bgInfo.isWhite) {
      // White edge defringe: clean semi-transparent pixels at edge so they don't have grey/white halo
      if (a < 240) {
        // Boost contrast of edge alpha slightly for crisp sticker borders
        const boost = Math.min(1, a / 200);
        data[i] = Math.round(r * boost);
        data[i + 1] = Math.round(g * boost);
        data[i + 2] = Math.round(b * boost);
      }
    }
  }

  return imageData;
}

/**
 * Step 5: Auto-trim + Resize to LINE Specs
 * - Auto-trim outer transparent areas (bounding box of alpha > 12)
 * - Resize to fit sticker type while preserving aspect ratio:
 *   - Standard: max 370x320px (margin 10px -> max 350x300)
 *   - Big Sticker: max 396x660px (margin 10px -> max 376x640)
 *   - Emoji: max 180x180px (margin 2px -> max 176x176)
 * - Centered on fixed-size canvas per spec
 */
export function autoTrimAndResize(
  sourceCanvas: HTMLCanvasElement,
  stickerType: StickerType
): { canvas: HTMLCanvasElement; bounds: { x: number; y: number; width: number; height: number } } {
  const spec = STICKER_SPECS[stickerType];
  const srcCtx = sourceCanvas.getContext('2d')!;
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const srcImgData = srcCtx.getImageData(0, 0, srcW, srcH);
  const data = srcImgData.data;

  // Find bounding box where alpha > 12
  let minX = srcW;
  let minY = srcH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const a = data[(y * srcW + x) * 4 + 3];
      if (a > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Handle completely empty/transparent image fallback
  if (maxX === -1) {
    minX = 0;
    minY = 0;
    maxX = srcW - 1;
    maxY = srcH - 1;
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  // Target canvas dimensions
  const targetW = spec.width;
  const targetH = spec.height;
  const margin = spec.margin;

  // Max available space inside target canvas
  const availableW = targetW - margin * 2;
  const availableH = targetH - margin * 2;

  // Scale factor preserving aspect ratio
  const scale = Math.min(availableW / cropW, availableH / cropH, 1.0); // Don't upscale past original if small, or scale down
  const finalDrawW = Math.round(cropW * scale);
  const finalDrawH = Math.round(cropH * scale);

  // Center coordinates
  const destX = Math.round((targetW - finalDrawW) / 2);
  const destY = Math.round((targetH - finalDrawH) / 2);

  // Create final canvas matching spec
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  // Draw cropped and scaled content
  outCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    cropW,
    cropH,
    destX,
    destY,
    finalDrawW,
    finalDrawH
  );

  return {
    canvas: outCanvas,
    bounds: { x: minX, y: minY, width: cropW, height: cropH },
  };
}

/**
 * Optional White Stroke Generator (ตัดขอบขาวสติกเกอร์)
 * Generates a clean die-cut sticker white contour border around non-transparent pixels.
 */
export function applyWhiteStroke(
  sourceCanvas: HTMLCanvasElement,
  strokeWidth: number = 3,
  strokeColor: string = '#FFFFFF'
): HTMLCanvasElement {
  if (strokeWidth <= 0) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const strokeCanvas = document.createElement('canvas');
  strokeCanvas.width = width;
  strokeCanvas.height = height;
  const strokeCtx = strokeCanvas.getContext('2d')!;

  // Render solid color silhouette by drawing offset in 16 directions around circle
  const steps = Math.max(12, strokeWidth * 4);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d')!;

  // 1. Draw source onto temp canvas
  tempCtx.drawImage(sourceCanvas, 0, 0);

  // 2. Change source composite to fill shape with strokeColor
  tempCtx.globalCompositeOperation = 'source-in';
  tempCtx.fillStyle = strokeColor;
  tempCtx.fillRect(0, 0, width, height);

  // 3. Draw radial offsets of tempCanvas onto strokeCanvas
  for (let r = 1; r <= strokeWidth; r += 0.75) {
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const ox = Math.cos(angle) * r;
      const oy = Math.sin(angle) * r;
      strokeCtx.drawImage(tempCanvas, ox, oy);
    }
  }

  // 4. Draw original sharp character on top of the stroke
  strokeCtx.drawImage(sourceCanvas, 0, 0);

  return strokeCanvas;
}

/**
 * Master Pipeline: Execute all 5 Steps on an Image Source
 */
export async function processStickerImage(
  imageSource: string | HTMLCanvasElement,
  params: ProcessingParams = {
    tolerance: 20,
    choke: 1.2,
    removeShadows: true,
    defringe: true,
    whiteStroke: false,
    strokeWidth: 3,
    strokeColor: '#FFFFFF',
    bgMode: 'floodfill',
  },
  stickerType: StickerType = 'standard'
): Promise<{
  processedDataUrl: string;
  detectedBg: DetectedBgInfo;
  mainDataUrl: string;
  tabDataUrl: string;
  trimmedBounds: { x: number; y: number; width: number; height: number };
}> {
  let srcCanvas: HTMLCanvasElement;
  if (typeof imageSource === 'string') {
    const img = await loadImage(imageSource);
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.naturalWidth || img.width;
    srcCanvas.height = img.naturalHeight || img.height;
    const ctx = srcCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
  } else {
    srcCanvas = imageSource;
  }

  const width = srcCanvas.width;
  const height = srcCanvas.height;
  const ctx = srcCanvas.getContext('2d', { willReadFrequently: true })!;

  // Step 1: Auto-detect Background Color
  const detectedBg = detectBackgroundColor(ctx, width, height);

  // Read raw pixels
  let imgData = ctx.getImageData(0, 0, width, height);

  // Step 2: Background Keying (global / floodfill)
  imgData = removeBackgroundKeying(imgData, detectedBg, params);

  // Step 3: Choke / Erosion
  imgData = applyChokeErosion(imgData, params.choke);

  // Step 4: Defringe / Spill Suppression
  imgData = applyDefringe(imgData, detectedBg, params);

  // Put processed image data back into working canvas
  const step4Canvas = document.createElement('canvas');
  step4Canvas.width = width;
  step4Canvas.height = height;
  const step4Ctx = step4Canvas.getContext('2d')!;
  step4Ctx.putImageData(imgData, 0, 0);

  // Step 4.5: Optional White Stroke
  let styledCanvas = step4Canvas;
  if (params.whiteStroke && params.strokeWidth > 0) {
    styledCanvas = applyWhiteStroke(step4Canvas, params.strokeWidth, params.strokeColor || '#FFFFFF');
  }

  // Step 5: Auto-trim + Resize to LINE Specs
  const { canvas: finalStickerCanvas, bounds } = autoTrimAndResize(styledCanvas, stickerType);

  const processedDataUrl = finalStickerCanvas.toDataURL('image/png');

  // Generate main.png (240x240) and tab.png (96x74)
  const mainDataUrl = generateMainImage(finalStickerCanvas);
  const tabDataUrl = generateTabImage(finalStickerCanvas);

  return {
    processedDataUrl,
    detectedBg,
    mainDataUrl,
    tabDataUrl,
    trimmedBounds: bounds,
  };
}

/**
 * 2x2 Grid Slicer
 * Splits image into 4 slices: TL (top-left), TR (top-right), BL (bottom-left), BR (bottom-right)
 * Defaults to center (W/2, H/2) with support for custom split percentages.
 */
export async function slice2x2Grid(
  imageSource: string,
  splitXPercent: number = 0.5,
  splitYPercent: number = 0.5
): Promise<{
  TL: string;
  TR: string;
  BL: string;
  BR: string;
  dimensions: { width: number; height: number };
}> {
  const img = await loadImage(imageSource);
  const totalW = img.naturalWidth || img.width;
  const totalH = img.naturalHeight || img.height;

  const splitX = Math.round(totalW * splitXPercent);
  const splitY = Math.round(totalH * splitYPercent);

  const sliceDefs = {
    TL: { x: 0, y: 0, w: splitX, h: splitY },
    TR: { x: splitX, y: 0, w: totalW - splitX, h: splitY },
    BL: { x: 0, y: splitY, w: splitX, h: totalH - splitY },
    BR: { x: splitX, y: splitY, w: totalW - splitX, h: totalH - splitY },
  };

  const results: Record<string, string> = {};

  for (const [key, def] of Object.entries(sliceDefs)) {
    const canvas = document.createElement('canvas');
    canvas.width = def.w;
    canvas.height = def.h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, def.x, def.y, def.w, def.h, 0, 0, def.w, def.h);
    results[key] = canvas.toDataURL('image/png');
  }

  return {
    TL: results.TL,
    TR: results.TR,
    BL: results.BL,
    BR: results.BR,
    dimensions: { width: totalW, height: totalH },
  };
}

/**
 * Generate main.png (240x240 px)
 * Follows official LINE spec: 240x240, centered, transparent background, margin >= 10px.
 */
export function generateMainImage(sourceCanvasOrImg: HTMLCanvasElement | HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcW = sourceCanvasOrImg.width;
  const srcH = sourceCanvasOrImg.height;

  // Margin 10px -> max 220x220
  const maxDim = 220;
  const scale = Math.min(maxDim / srcW, maxDim / srcH);
  const destW = Math.round(srcW * scale);
  const destH = Math.round(srcH * scale);
  const destX = Math.round((240 - destW) / 2);
  const destY = Math.round((240 - destH) / 2);

  ctx.drawImage(sourceCanvasOrImg, destX, destY, destW, destH);
  return canvas.toDataURL('image/png');
}

/**
 * Generate tab.png (96x74 px)
 * Follows official LINE spec: 96x74, centered, transparent background, margin >= 6px.
 */
export function generateTabImage(sourceCanvasOrImg: HTMLCanvasElement | HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 74;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcW = sourceCanvasOrImg.width;
  const srcH = sourceCanvasOrImg.height;

  // Margin 6px -> max 84x62
  const maxW = 84;
  const maxH = 62;
  const scale = Math.min(maxW / srcW, maxH / srcH);
  const destW = Math.round(srcW * scale);
  const destH = Math.round(srcH * scale);
  const destX = Math.round((96 - destW) / 2);
  const destY = Math.round((74 - destH) / 2);

  ctx.drawImage(sourceCanvasOrImg, destX, destY, destW, destH);
  return canvas.toDataURL('image/png');
}

/**
 * Interactive Magic Wand / Tap-to-Erase:
 * Performs BFS Flood Fill from the exact user-clicked coordinate (x, y)
 * to erase enclosed cavities (e.g. gaps between arms, legs, or accessories).
 */
export async function floodFillEraseAtPoint(
  dataUrl: string,
  targetX: number,
  targetY: number,
  tolerance: number = 25
): Promise<{
  processedDataUrl: string;
  mainDataUrl: string;
  tabDataUrl: string;
}> {
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const clampX = Math.max(0, Math.min(width - 1, Math.round(targetX)));
  const clampY = Math.max(0, Math.min(height - 1, Math.round(targetY)));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIdx = (clampY * width + clampX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Already transparent
  if (targetA === 0) {
    return {
      processedDataUrl: dataUrl,
      mainDataUrl: generateMainImage(canvas),
      tabDataUrl: generateTabImage(canvas),
    };
  }

  const maxDist = (tolerance / 100) * 200;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qStart = 0;
  let qEnd = 0;

  const startCoordIdx = clampY * width + clampX;
  visited[startCoordIdx] = 1;
  queue[qEnd++] = clampX;
  queue[qEnd++] = clampY;

  const matchesTarget = (r: number, g: number, b: number, a: number) => {
    if (a === 0) return false;
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= maxDist;
  };

  while (qStart < qEnd) {
    const cx = queue[qStart++];
    const cy = queue[qStart++];
    const pIdx = (cy * width + cx) * 4;

    data[pIdx + 3] = 0; // erase

    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ];

    for (let n = 0; n < 4; n++) {
      const nx = neighbors[n][0];
      const ny = neighbors[n][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nVIdx = ny * width + nx;
        if (visited[nVIdx] === 0) {
          const nPIdx = nVIdx * 4;
          if (matchesTarget(data[nPIdx], data[nPIdx + 1], data[nPIdx + 2], data[nPIdx + 3])) {
            visited[nVIdx] = 1;
            queue[qEnd++] = nx;
            queue[qEnd++] = ny;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const processedDataUrl = canvas.toDataURL('image/png');
  const mainDataUrl = generateMainImage(canvas);
  const tabDataUrl = generateTabImage(canvas);

  return { processedDataUrl, mainDataUrl, tabDataUrl };
}

/**
 * Interactive Brush Eraser:
 * Erases a circular area around (x, y) with a given radius.
 */
export async function brushEraseAtPoint(
  dataUrl: string,
  x: number,
  y: number,
  radius: number = 12
): Promise<{
  processedDataUrl: string;
  mainDataUrl: string;
  tabDataUrl: string;
}> {
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // Use destination-out to erase
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();

  const processedDataUrl = canvas.toDataURL('image/png');
  const mainDataUrl = generateMainImage(canvas);
  const tabDataUrl = generateTabImage(canvas);

  return { processedDataUrl, mainDataUrl, tabDataUrl };
}

/**
 * Auto-Clear Enclosed Background Cavities:
 * Scans image for any pixels matching the detected background color (within tolerance)
 * and turns them transparent.
 */
export async function autoClearEnclosedGaps(
  dataUrl: string,
  detectedBg: DetectedBgInfo,
  tolerance: number = 25
): Promise<{
  processedDataUrl: string;
  mainDataUrl: string;
  tabDataUrl: string;
}> {
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const maxDist = (tolerance / 100) * 200;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const dr = data[i] - detectedBg.r;
      const dg = data[i + 1] - detectedBg.g;
      const db = data[i + 2] - detectedBg.b;
      if (Math.sqrt(dr * dr + dg * dg + db * db) <= maxDist) {
        data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const processedDataUrl = canvas.toDataURL('image/png');
  const mainDataUrl = generateMainImage(canvas);
  const tabDataUrl = generateTabImage(canvas);

  return { processedDataUrl, mainDataUrl, tabDataUrl };
}
