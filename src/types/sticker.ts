/**
 * Types & Constants for LINE Sticker Studio
 */

export type StickerType = 'standard' | 'big' | 'emoji';

export type BgMode = 'floodfill' | 'global';

export type GridQuadrant = 'TL' | 'TR' | 'BL' | 'BR';

export type PreviewBgColor = 'checker' | 'white' | 'black' | 'darkgray' | 'lineblue' | 'green' | 'custom';

export interface StickerSpec {
  type: StickerType;
  name: string;
  nameTh: string;
  width: number;
  height: number;
  margin: number;
  mainWidth: number;
  mainHeight: number;
  tabWidth: number;
  tabHeight: number;
  hasMain: boolean;
  namePattern: '01' | '001';
  allowedCounts: number[];
}

export const STICKER_SPECS: Record<StickerType, StickerSpec> = {
  standard: {
    type: 'standard',
    name: 'Standard Sticker',
    nameTh: 'สติกเกอร์มาตรฐาน (Standard)',
    width: 370,
    height: 320,
    margin: 10,
    mainWidth: 240,
    mainHeight: 240,
    tabWidth: 96,
    tabHeight: 74,
    hasMain: true,
    namePattern: '01',
    allowedCounts: [8, 16, 24, 32, 40],
  },
  big: {
    type: 'big',
    name: 'Big Sticker',
    nameTh: 'สติกเกอร์ขนาดใหญ่ (Big Sticker)',
    width: 396,
    height: 660,
    margin: 10,
    mainWidth: 240,
    mainHeight: 240,
    tabWidth: 96,
    tabHeight: 74,
    hasMain: true,
    namePattern: '01',
    allowedCounts: [8, 16, 24, 32, 40],
  },
  emoji: {
    type: 'emoji',
    name: 'LINE Emoji',
    nameTh: 'ไลน์อิโมจิ (Emoji)',
    width: 180,
    height: 180,
    margin: 2,
    mainWidth: 0,
    mainHeight: 0,
    tabWidth: 96,
    tabHeight: 74,
    hasMain: false,
    namePattern: '001',
    allowedCounts: [8, 16, 24, 32, 40],
  },
};

export interface ProcessingParams {
  tolerance: number;       // 0 - 100, default 20
  choke: number;           // 0 - 3 px, default 1.2
  removeShadows: boolean;  // default true
  defringe: boolean;       // default true
  whiteStroke: boolean;    // default false
  strokeWidth: number;     // 1 - 5 px, default 3
  strokeColor?: string;    // default '#FFFFFF'
  bgMode: BgMode;          // 'floodfill' | 'global'
  removeEnclosedGaps?: boolean; // default false / true: removes trapped background in arm/leg cavities
  customBgColor?: { r: number; g: number; b: number };
}

export const DEFAULT_PARAMS: ProcessingParams = {
  tolerance: 20,
  choke: 1.2,
  removeShadows: true,
  defringe: true,
  whiteStroke: false,
  strokeWidth: 3,
  strokeColor: '#FFFFFF',
  bgMode: 'floodfill',
  removeEnclosedGaps: false,
};

export interface DetectedBgInfo {
  r: number;
  g: number;
  b: number;
  hex: string;
  isWhite: boolean;
  isBlack: boolean;
  isMagenta: boolean;
  isGreen: boolean;
  isBlue: boolean;
  recommendedMode: BgMode;
  samples: { r: number; g: number; b: number }[];
}

export interface StickerItem {
  id: string;
  index: number; // 1-based index (1..40)
  originalDataUrl: string; // raw sliced or uploaded image
  processedDataUrl: string; // result after 5 steps
  mainDataUrl?: string; // resized for main.png (240x240)
  tabDataUrl?: string; // resized for tab.png (96x74)
  quadrant?: GridQuadrant; // TL, TR, BL, BR if sliced from 2x2
  sourceImageId?: string;
  sourceImageName?: string;
  width: number;
  height: number;
  detectedBg?: DetectedBgInfo;
  params: ProcessingParams;
  isMain: boolean;
  isTab: boolean;
  title?: string;
  originalDimensions?: { width: number; height: number };
  trimmedBounds?: { x: number; y: number; width: number; height: number };
  createdAt: number;
}

export interface UploadedSheet {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  is2x2Grid: boolean;
  splitCenter?: { xPercent: number; yPercent: number }; // default 50%, 50%
  slices?: {
    TL: string;
    TR: string;
    BL: string;
    BR: string;
  };
}
