/**
 * Built-in Sample 2x2 Grid Sheets & Stickers for Instant Testing
 * Generates sharp, delightful cartoon mascot graphics on different test backgrounds
 * (Magenta, White, and Green) to verify all 5 algorithm steps immediately.
 */

export interface SampleSheetPreset {
  id: string;
  titleTh: string;
  titleEn: string;
  bgType: 'magenta' | 'white' | 'green';
  bgColor: string;
  descriptionTh: string;
  dataUrl: string;
}

/**
 * Draw a cute character onto a quadrant
 */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  type: 'cat' | 'shiba' | 'boba' | 'rabbit' | 'bear' | 'star' | 'coffee' | 'heart',
  labelTh: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  if (type === 'cat') {
    // Cute Cat
    // Soft shadow below
    ctx.beginPath();
    ctx.ellipse(0, 75, 45, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 20, 52, 58, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA726'; // Orange fur
    ctx.fill();

    // White belly
    ctx.beginPath();
    ctx.ellipse(0, 30, 32, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -25, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA726';
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-36, -55);
    ctx.lineTo(-20, -85);
    ctx.lineTo(-5, -60);
    ctx.fillStyle = '#FB8C00';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-30, -55);
    ctx.lineTo(-20, -75);
    ctx.lineTo(-10, -60);
    ctx.fillStyle = '#FFCDD2';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(36, -55);
    ctx.lineTo(20, -85);
    ctx.lineTo(5, -60);
    ctx.fillStyle = '#FB8C00';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(30, -55);
    ctx.lineTo(20, -75);
    ctx.lineTo(10, -60);
    ctx.fillStyle = '#FFCDD2';
    ctx.fill();

    // Cheeks
    ctx.beginPath();
    ctx.arc(-26, -15, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8A80';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(26, -15, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8A80';
    ctx.fill();

    // Eyes (Big cute anime eyes with white sparkle)
    ctx.beginPath();
    ctx.ellipse(-16, -28, 8, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#263238';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-18, -32, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(16, -28, 8, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#263238';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -32, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Nose & mouth
    ctx.beginPath();
    ctx.arc(0, -18, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5252';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-5, -12, 5, 0, Math.PI);
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(5, -12, 5, 0, Math.PI);
    ctx.stroke();

    // Paws
    ctx.beginPath();
    ctx.ellipse(-24, 40, 14, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, 40, 14, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  } else if (type === 'shiba') {
    // Cute Shiba Inu
    ctx.beginPath();
    ctx.ellipse(0, 75, 45, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -15, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#E65100';
    ctx.fill();

    // White muzzle area
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF8E1';
    ctx.fill();

    // White eyebrows
    ctx.beginPath();
    ctx.arc(-22, -40, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF8E1';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, -40, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF8E1';
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-40, -45);
    ctx.lineTo(-30, -80);
    ctx.lineTo(-10, -55);
    ctx.fillStyle = '#BF360C';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, -45);
    ctx.lineTo(30, -80);
    ctx.lineTo(10, -55);
    ctx.fillStyle = '#BF360C';
    ctx.fill();

    // Red rosy cheeks
    ctx.beginPath();
    ctx.arc(-32, -8, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5252';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, -8, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5252';
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.ellipse(-18, -20, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-20, -23, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(18, -20, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, -23, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();

    // Tongue out
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4081';
    ctx.fill();

    // Scarf / Collar
    ctx.beginPath();
    ctx.ellipse(0, 42, 38, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#00C853';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 48, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD600';
    ctx.fill();
  } else if (type === 'boba') {
    // Kawaii Bubble Milk Tea
    ctx.beginPath();
    ctx.ellipse(0, 75, 42, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();

    // Cup
    ctx.beginPath();
    ctx.moveTo(-36, -30);
    ctx.lineTo(-28, 65);
    ctx.quadraticCurveTo(0, 75, 28, 65);
    ctx.lineTo(36, -30);
    ctx.closePath();
    ctx.fillStyle = '#FFE0B2';
    ctx.fill();

    // Tea level
    ctx.beginPath();
    ctx.moveTo(-34, -15);
    ctx.lineTo(-28, 65);
    ctx.quadraticCurveTo(0, 75, 28, 65);
    ctx.lineTo(34, -15);
    ctx.closePath();
    ctx.fillStyle = '#BCAAA4';
    ctx.fill();

    // Pearls (boba)
    const pearls = [
      [-15, 52], [0, 56], [15, 50],
      [-8, 42], [10, 40], [-20, 38], [18, 30]
    ];
    for (const [px, py] of pearls) {
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#3E2723';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#8D6E63';
      ctx.fill();
    }

    // Cup lid
    ctx.beginPath();
    ctx.arc(0, -30, 40, Math.PI, 0);
    ctx.fillStyle = '#80DEEA';
    ctx.fill();

    // Straw
    ctx.beginPath();
    ctx.rect(6, -75, 12, 50);
    ctx.fillStyle = '#FF4081';
    ctx.fill();

    // Cheerful face on cup
    ctx.beginPath();
    ctx.arc(-14, 8, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#37474F';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, 8, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#37474F';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 15, 6, 0, Math.PI);
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cheeks
    ctx.beginPath();
    ctx.arc(-22, 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8A80';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8A80';
    ctx.fill();
  } else if (type === 'rabbit') {
    // Kawaii Bunny
    ctx.beginPath();
    ctx.ellipse(0, 75, 42, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.ellipse(-20, -65, 14, 35, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-20, -65, 8, 24, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#F8BBD0';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(20, -65, 14, 35, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(20, -65, 8, 24, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#F8BBD0';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -10, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Cheeks
    ctx.beginPath();
    ctx.arc(-26, -5, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF80AB';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(26, -5, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF80AB';
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.arc(-16, -16, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, -16, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(4, -8);
    ctx.lineTo(0, -3);
    ctx.fillStyle = '#EC407A';
    ctx.fill();

    // Bow
    ctx.beginPath();
    ctx.arc(28, -42, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#E91E63';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(18, -42, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#F06292';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(38, -42, 8, 5, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#F06292';
    ctx.fill();
  }

  // Thai Caption bubble below character
  if (labelTh) {
    ctx.save();
    ctx.translate(0, 105);

    // Bubble background
    ctx.beginPath();
    ctx.roundRect(-75, -16, 150, 32, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Bubble pointer
    ctx.beginPath();
    ctx.moveTo(-8, -16);
    ctx.lineTo(0, -24);
    ctx.lineTo(8, -16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -16);
    ctx.lineTo(0, -24);
    ctx.lineTo(8, -16);
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Thai text
    ctx.font = 'bold 15px Prompt, Kanit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#D81B60';
    ctx.fillText(labelTh, 0, 1);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Generate 2x2 Grid Sheet Canvas
 * Size: 800 x 800 px (400x400 per quadrant)
 */
export function generateSample2x2Sheet(bgType: 'magenta' | 'white' | 'green'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  let bgColor = '#FF00FF'; // Magenta
  if (bgType === 'white') bgColor = '#FFFFFF';
  if (bgType === 'green') bgColor = '#00FF00';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 800, 800);

  // Quadrants coordinates
  // TL: 200, 180
  // TR: 600, 180
  // BL: 200, 580
  // BR: 600, 580
  if (bgType === 'magenta') {
    drawCharacter(ctx, 200, 170, 'cat', 'สวัสดีครับ!');
    drawCharacter(ctx, 600, 170, 'shiba', 'ขอบคุณมาก!');
    drawCharacter(ctx, 200, 570, 'boba', 'จัดไปเลยยย~');
    drawCharacter(ctx, 600, 570, 'rabbit', 'สู้ๆ นะ!');
  } else if (bgType === 'white') {
    drawCharacter(ctx, 200, 170, 'shiba', 'รับทราบครับ');
    drawCharacter(ctx, 600, 170, 'cat', 'ฝันดีนะ~');
    drawCharacter(ctx, 200, 570, 'rabbit', 'โอเคมากๆ');
    drawCharacter(ctx, 600, 570, 'boba', 'หิวน้ำจัง!');
  } else {
    // Green
    drawCharacter(ctx, 200, 170, 'rabbit', 'คิดถึงจัง');
    drawCharacter(ctx, 600, 170, 'cat', 'สุดยอดเลย!');
    drawCharacter(ctx, 200, 570, 'shiba', 'รอแป๊บนึง');
    drawCharacter(ctx, 600, 570, 'boba', 'ชื่นใจสุดๆ');
  }

  return canvas.toDataURL('image/png');
}

/**
 * Pre-cached sample sheets
 */
export function getSamplePresets(): SampleSheetPreset[] {
  return [
    {
      id: 'sample_magenta',
      titleTh: 'ชุดที่ 1: พื้นหลัง Magenta (#FF00FF)',
      titleEn: 'Set 1: Magenta Background (Spill & Choke Test)',
      bgType: 'magenta',
      bgColor: '#FF00FF',
      descriptionTh: 'ทดสอบการจับสี Magenta และ Defringe ลบขอบสีรั่วแดง/น้ำเงิน',
      dataUrl: generateSample2x2Sheet('magenta'),
    },
    {
      id: 'sample_white',
      titleTh: 'ชุดที่ 2: พื้นหลังสีขาวบริสุทธิ์ (#FFFFFF)',
      titleEn: 'Set 2: Pure White (Floodfill & Eye Protection Test)',
      bgType: 'white',
      bgColor: '#FFFFFF',
      descriptionTh: 'ทดสอบ Floodfill BFS ปกป้องตา/ฟัน/พุงขาวของตัวละครไม่ให้แหว่ง',
      dataUrl: generateSample2x2Sheet('white'),
    },
    {
      id: 'sample_green',
      titleTh: 'ชุดที่ 3: พื้นหลัง Green Screen (#00FF00)',
      titleEn: 'Set 3: Green Screen (Green Spill Suppression Test)',
      bgType: 'green',
      bgColor: '#00FF00',
      descriptionTh: 'ทดสอบการลด Green Spill (g = g - spill * 0.85) รอบขอบตัวละคร',
      dataUrl: generateSample2x2Sheet('green'),
    },
  ];
}
