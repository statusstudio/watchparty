export interface CandyLevelConfig {
  id: number;
  title: string;
  subtitle: string;
  type: 'score' | 'jelly' | 'order';
  moves: number;
  starScores: [number, number, number]; // 1 Star, 2 Stars, 3 Stars
  targetScore: number;
  targetJellyCount?: number;
  initialJellyMap?: boolean[][]; // 8x8 true where jelly exists
  targetOrders?: {
    type: number; // 0..5
    count: number;
  }[];
  hint: string;
}

// Generate default central jelly maps
function createCentralJelly(rows: number[], cols: number[]): boolean[][] {
  const map: boolean[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 8; c++) {
      row.push(rows.includes(r) && cols.includes(c));
    }
    map.push(row);
  }
  return map;
}

export const CANDY_LEVELS: CandyLevelConfig[] = [
  {
    id: 1,
    title: 'ด่าน 1: จุดเริ่มต้นแสนหวาน',
    subtitle: 'Sweet Beginning',
    type: 'score',
    moves: 15,
    targetScore: 1000,
    starScores: [1000, 2500, 4000],
    hint: 'จับคู่ลูกอมสีเดียวกัน 3 ลูกเพื่อสะสมคะแนน!',
  },
  {
    id: 2,
    title: 'ด่าน 2: มหัศจรรย์ลูกอมลายริ้ว',
    subtitle: 'Striped Sensation',
    type: 'score',
    moves: 18,
    targetScore: 2500,
    starScores: [2500, 4500, 7000],
    hint: 'เรียงลูกอมสีเดียวกัน 4 ลูกแนวตรง เพื่อสร้างลูกอมลายริ้วกวาดล้างทั้งแถว!',
  },
  {
    id: 3,
    title: 'ด่าน 3: สลายเจลลี่หวานฉ่ำ',
    subtitle: 'Jelly Jam',
    type: 'jelly',
    moves: 20,
    targetScore: 3000,
    starScores: [3000, 6000, 9000],
    targetJellyCount: 16,
    initialJellyMap: createCentralJelly([2, 3, 4, 5], [2, 3, 4, 5]),
    hint: 'ระเบิดลูกอมบนช่องที่มีเจลลี่น้ำแข็ง เพื่อทำลายเจลลี่ให้หมดทั้งกระดาน!',
  },
  {
    id: 4,
    title: 'ด่าน 4: ลูกอมห่อฟอยล์ระเบิดคู่',
    subtitle: 'Wrapped Wonder',
    type: 'jelly',
    moves: 22,
    targetScore: 4000,
    starScores: [4000, 7500, 11000],
    targetJellyCount: 24,
    initialJellyMap: createCentralJelly([1, 2, 3, 4, 5, 6], [2, 3, 4, 5]),
    hint: 'เรียงลูกอมเป็นรูปตัว T หรือ L เพื่อสร้างลูกอมห่อฟอยล์ระเบิด 3x3 สองระลอก!',
  },
  {
    id: 5,
    title: 'ด่าน 5: มนต์เสน่ห์คัลเลอร์บอมบ์',
    subtitle: 'Color Bomb Craze',
    type: 'score',
    moves: 20,
    targetScore: 8000,
    starScores: [8000, 14000, 22000],
    hint: 'เรียงลูกอม 5 ลูกแนวตรง เพื่อสร้าง Color Bomb ช็อกโกแลตโรยเกล็ดสายรุ้ง!',
  },
  {
    id: 6,
    title: 'ด่าน 6: ออเดอร์สีแดงและฟ้า',
    subtitle: 'Red & Blue Treat',
    type: 'order',
    moves: 22,
    targetScore: 5000,
    starScores: [5000, 9000, 15000],
    targetOrders: [
      { type: 0, count: 20 }, // Red
      { type: 5, count: 20 }, // Blue
    ],
    hint: 'จับคู่เพื่อเก็บลูกอมสีแดง 20 ลูก และลูกอมสีฟ้า 20 ลูกตามคำสั่งซื้อ!',
  },
  {
    id: 7,
    title: 'ด่าน 7: เขาวงกตเจลลี่กระจก',
    subtitle: 'Mirror Maze',
    type: 'jelly',
    moves: 24,
    targetScore: 6000,
    starScores: [6000, 11000, 18000],
    targetJellyCount: 28,
    initialJellyMap: createCentralJelly([1, 2, 3, 4, 5, 6], [1, 2, 5, 6]),
    hint: 'ใช้ลูกอมลายริ้วและลูกอมห่อฟอยล์ ผสมกันเพื่อล้างเจลลี่เป็นวงกว้าง!',
  },
  {
    id: 8,
    title: 'ด่าน 8: อภิมหาคอมโบช็อกโกแลต',
    subtitle: 'Choco Fiesta',
    type: 'score',
    moves: 22,
    targetScore: 12000,
    starScores: [12000, 20000, 30000],
    hint: 'สลับ Color Bomb กับลูกอมลายริ้วเพื่อเปลี่ยนลูกอมทั้งกระดานเป็นลายริ้ว!',
  },
  {
    id: 9,
    title: 'ด่าน 9: ออเดอร์ 3 สีพาเพลิน',
    subtitle: 'Rainbow Collector',
    type: 'order',
    moves: 25,
    targetScore: 10000,
    starScores: [10000, 18000, 28000],
    targetOrders: [
      { type: 1, count: 25 }, // Purple
      { type: 2, count: 25 }, // Yellow
      { type: 3, count: 25 }, // Green
    ],
    hint: 'บริหารจำนวนตาเดินเพื่อเก็บลูกอมครบทั้ง 3 สีให้ทันเวลา!',
  },
  {
    id: 10,
    title: 'ด่าน 10: ราชันย์แห่งอาณาจักรลูกกวาด',
    subtitle: 'Sugar Kingdom Master',
    type: 'jelly',
    moves: 26,
    targetScore: 15000,
    starScores: [15000, 26000, 40000],
    targetJellyCount: 36,
    initialJellyMap: createCentralJelly([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]),
    hint: 'ด่านสุดท้ายของเกาะแรก! ล้างเจลลี่ 36 ช่องให้หมดเพื่อคว้าถ้วยแชมป์ 3 ดาว!',
  },
];
