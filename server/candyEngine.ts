import { CandyTileData, CandyItemType, CandySpecialType } from '../src/types/index.js';

export interface MatchResult {
  matchedCoords: Set<string>; // 'r,c'
  specialsToSpawn: Map<string, { type: number; special: CandySpecialType }>; // 'r,c' -> special candy
}

export interface CascadeStep {
  destroyed: { r: number; c: number; type: number; special?: CandySpecialType }[];
  blastType?: 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb' | 'combo_cross' | 'combo_giant' | 'combo_color_striped' | 'combo_wipe';
}

export interface SwapProcessResult {
  success: boolean;
  totalDamage: number;
  comboCount: number;
  harvestedItems: CandyItemType[];
  announcer?: 'sweet' | 'tasty' | 'delicious' | 'divine' | 'sugar_crush';
  comboType?: string;
}

export class CandyCrushEngine {
  private static readonly ITEM_TYPES: CandyItemType[] = ['heal', 'shield', 'fire', 'hammer'];

  public static createRandom8x8Board(): CandyTileData[][] {
    const board: CandyTileData[][] = [];
    for (let r = 0; r < 8; r++) {
      const row: CandyTileData[] = [];
      for (let c = 0; c < 8; c++) {
        let type: number;
        do {
          type = Math.floor(Math.random() * 6);
        } while (
          (c >= 2 && row[c - 1].type === type && row[c - 2].type === type) ||
          (r >= 2 && board[r - 1][c].type === type && board[r - 2][c].type === type)
        );
        const hasItem = Math.random() < 0.18;
        const itemType = hasItem ? this.ITEM_TYPES[Math.floor(Math.random() * this.ITEM_TYPES.length)] : undefined;
        row.push({
          id: `t-${r}-${c}-${Math.random().toString(36).substring(2, 6)}`,
          type,
          special: 'none',
          hasItem,
          itemType,
        });
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Find all matches (horizontal, vertical, L/T intersections)
   * Detects 4-in-a-row (Striped), 5-in-a-row (Color Bomb), and L/T shape (Wrapped)
   */
  public static findMatches(
    board: CandyTileData[][],
    focusCoord?: { r: number; c: number }
  ): MatchResult {
    const matchedCoords = new Set<string>();
    const specialsToSpawn = new Map<string, { type: number; special: CandySpecialType }>();

    // 1. Horizontal runs
    const hRuns: { r: number; cStart: number; len: number; type: number }[] = [];
    for (let r = 0; r < 8; r++) {
      let len = 1;
      for (let c = 1; c < 8; c++) {
        if (
          board[r][c].type !== -1 &&
          board[r][c].type !== -2 && // Color bomb not matched by color
          board[r][c].type === board[r][c - 1].type
        ) {
          len++;
        } else {
          if (len >= 3) {
            hRuns.push({ r, cStart: c - len, len, type: board[r][c - 1].type });
          }
          len = 1;
        }
      }
      if (len >= 3) {
        hRuns.push({ r, cStart: 8 - len, len, type: board[r][7].type });
      }
    }

    // 2. Vertical runs
    const vRuns: { c: number; rStart: number; len: number; type: number }[] = [];
    for (let c = 0; c < 8; c++) {
      let len = 1;
      for (let r = 1; r < 8; r++) {
        if (
          board[r][c].type !== -1 &&
          board[r][c].type !== -2 &&
          board[r][c].type === board[r - 1][c].type
        ) {
          len++;
        } else {
          if (len >= 3) {
            vRuns.push({ c, rStart: r - len, len, type: board[r - 1][c].type });
          }
          len = 1;
        }
      }
      if (len >= 3) {
        vRuns.push({ c, rStart: 8 - len, len, type: board[7][c].type });
      }
    }

    // Mark matched coords
    hRuns.forEach((run) => {
      for (let k = 0; k < run.len; k++) {
        matchedCoords.add(`${run.r},${run.cStart + k}`);
      }
    });
    vRuns.forEach((run) => {
      for (let k = 0; k < run.len; k++) {
        matchedCoords.add(`${run.rStart + k},${run.c}`);
      }
    });

    // Check for L or T intersections (Wrapped Candy = 5+ candies meeting at intersection)
    for (const h of hRuns) {
      for (const v of vRuns) {
        if (h.type === v.type) {
          // Check if they intersect
          if (v.c >= h.cStart && v.c < h.cStart + h.len && h.r >= v.rStart && h.r < v.rStart + v.len) {
            const intersectKey = `${h.r},${v.c}`;
            specialsToSpawn.set(intersectKey, {
              type: h.type,
              special: 'wrapped',
            });
          }
        }
      }
    }

    // Check 5 in a row -> Color Bomb
    hRuns.forEach((run) => {
      if (run.len >= 5) {
        const targetC = focusCoord && focusCoord.r === run.r && focusCoord.c >= run.cStart && focusCoord.c < run.cStart + run.len
          ? focusCoord.c
          : run.cStart + 2;
        specialsToSpawn.set(`${run.r},${targetC}`, {
          type: -2,
          special: 'color_bomb',
        });
      }
    });
    vRuns.forEach((run) => {
      if (run.len >= 5) {
        const targetR = focusCoord && focusCoord.c === run.c && focusCoord.r >= run.rStart && focusCoord.r < run.rStart + run.len
          ? focusCoord.r
          : run.rStart + 2;
        specialsToSpawn.set(`${targetR},${run.c}`, {
          type: -2,
          special: 'color_bomb',
        });
      }
    });

    // Check 4 in a row -> Striped Candy (if not already marked as wrapped or color bomb)
    hRuns.forEach((run) => {
      if (run.len === 4) {
        const targetC = focusCoord && focusCoord.r === run.r && focusCoord.c >= run.cStart && focusCoord.c < run.cStart + run.len
          ? focusCoord.c
          : run.cStart + 1;
        const key = `${run.r},${targetC}`;
        if (!specialsToSpawn.has(key)) {
          specialsToSpawn.set(key, {
            type: run.type,
            special: 'striped_v', // clears vertical line
          });
        }
      }
    });
    vRuns.forEach((run) => {
      if (run.len === 4) {
        const targetR = focusCoord && focusCoord.c === run.c && focusCoord.r >= run.rStart && focusCoord.r < run.rStart + run.len
          ? focusCoord.r
          : run.rStart + 1;
        const key = `${targetR},${run.c}`;
        if (!specialsToSpawn.has(key)) {
          specialsToSpawn.set(key, {
            type: run.type,
            special: 'striped_h', // clears horizontal line
          });
        }
      }
    });

    return { matchedCoords, specialsToSpawn };
  }

  /**
   * Process special candy detonation across the board
   */
  private static detonateSpecial(
    board: CandyTileData[][],
    r: number,
    c: number,
    special: CandySpecialType,
    toDestroy: Set<string>
  ) {
    if (special === 'striped_h') {
      for (let col = 0; col < 8; col++) toDestroy.add(`${r},${col}`);
    } else if (special === 'striped_v') {
      for (let row = 0; row < 8; row++) toDestroy.add(`${row},${c}`);
    } else if (special === 'wrapped') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            toDestroy.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  /**
   * Handle Special + Special combination swaps
   */
  public static handleSpecialCombo(
    board: CandyTileData[][],
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): SwapProcessResult | null {
    const tile1 = board[r1][c1];
    const tile2 = board[r2][c2];

    const isSp1 = tile1.special && tile1.special !== 'none';
    const isSp2 = tile2.special && tile2.special !== 'none';

    // Must be at least one color bomb OR two specials
    if (!isSp1 && !isSp2) return null;
    if (tile1.special !== 'color_bomb' && tile2.special !== 'color_bomb' && (!isSp1 || !isSp2)) return null;

    const destroyed = new Set<string>();
    const harvestedItems: CandyItemType[] = [];
    let comboType = '';
    let bonusDamage = 0;

    // 1. Color Bomb + Color Bomb: BOARD WIPE
    if (tile1.special === 'color_bomb' && tile2.special === 'color_bomb') {
      comboType = 'combo_wipe';
      bonusDamage = 45;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          destroyed.add(`${r},${c}`);
        }
      }
    }
    // 2. Color Bomb + Striped
    else if (
      (tile1.special === 'color_bomb' && (tile2.special === 'striped_h' || tile2.special === 'striped_v')) ||
      (tile2.special === 'color_bomb' && (tile1.special === 'striped_h' || tile1.special === 'striped_v'))
    ) {
      comboType = 'combo_color_striped';
      bonusDamage = 35;
      const stripedTile = tile1.special === 'color_bomb' ? tile2 : tile1;
      const targetColor = stripedTile.type;

      destroyed.add(`${r1},${c1}`);
      destroyed.add(`${r2},${c2}`);

      // Transform all candies of targetColor to striped and detonate!
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c].type === targetColor) {
            destroyed.add(`${r},${c}`);
            const sp: CandySpecialType = Math.random() < 0.5 ? 'striped_h' : 'striped_v';
            this.detonateSpecial(board, r, c, sp, destroyed);
          }
        }
      }
    }
    // 3. Color Bomb + Normal Color
    else if (tile1.special === 'color_bomb' || tile2.special === 'color_bomb') {
      comboType = 'color_bomb';
      bonusDamage = 25;
      const normalTile = tile1.special === 'color_bomb' ? tile2 : tile1;
      const targetColor = normalTile.type;

      destroyed.add(`${r1},${c1}`);
      destroyed.add(`${r2},${c2}`);

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c].type === targetColor) {
            destroyed.add(`${r},${c}`);
            if (board[r][c].special && board[r][c].special !== 'none') {
              this.detonateSpecial(board, r, c, board[r][c].special!, destroyed);
            }
          }
        }
      }
    }
    // 4. Striped + Wrapped (Giant Cross)
    else if (
      ((tile1.special === 'striped_h' || tile1.special === 'striped_v') && tile2.special === 'wrapped') ||
      ((tile2.special === 'striped_h' || tile2.special === 'striped_v') && tile1.special === 'wrapped')
    ) {
      comboType = 'combo_giant';
      bonusDamage = 30;
      // Clears 3 rows and 3 columns centered around target
      for (let dr = -1; dr <= 1; dr++) {
        const row = r2 + dr;
        if (row >= 0 && row < 8) {
          for (let c = 0; c < 8; c++) destroyed.add(`${row},${c}`);
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        const col = c2 + dc;
        if (col >= 0 && col < 8) {
          for (let r = 0; r < 8; r++) destroyed.add(`${r},${col}`);
        }
      }
    }
    // 5. Striped + Striped (Cross)
    else if (
      (tile1.special === 'striped_h' || tile1.special === 'striped_v') &&
      (tile2.special === 'striped_h' || tile2.special === 'striped_v')
    ) {
      comboType = 'combo_cross';
      bonusDamage = 20;
      for (let c = 0; c < 8; c++) destroyed.add(`${r2},${c}`);
      for (let r = 0; r < 8; r++) destroyed.add(`${r},${c2}`);
    }
    // 6. Wrapped + Wrapped (Huge 5x5 Bomb)
    else if (tile1.special === 'wrapped' && tile2.special === 'wrapped') {
      comboType = 'wrapped';
      bonusDamage = 25;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r2 + dr;
          const nc = c2 + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            destroyed.add(`${nr},${nc}`);
          }
        }
      }
    }

    if (destroyed.size === 0) return null;

    // Harvest items from destroyed tiles
    destroyed.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      if (board[r][c].hasItem && board[r][c].itemType) {
        harvestedItems.push(board[r][c].itemType!);
      }
      board[r][c] = { id: `del-${r}-${c}`, type: -1, special: 'none', hasItem: false };
    });

    // Cascade refill
    this.refillBoard(board, harvestedItems);

    // Follow-up cascade matches
    const cascadeFollowup = this.processAllCascades(board, harvestedItems);

    const totalDamage = bonusDamage + Math.round(destroyed.size * 1.5) + cascadeFollowup.cascadeDamage;
    const comboCount = 1 + cascadeFollowup.cascadeCombos;

    let announcer: 'sweet' | 'tasty' | 'delicious' | 'divine' | 'sugar_crush' = 'sweet';
    if (comboType === 'combo_wipe' || comboCount >= 6) announcer = 'sugar_crush';
    else if (comboCount >= 5) announcer = 'divine';
    else if (comboCount >= 4) announcer = 'delicious';
    else if (comboCount >= 3) announcer = 'tasty';

    return {
      success: true,
      totalDamage,
      comboCount,
      harvestedItems,
      announcer,
      comboType,
    };
  }

  /**
   * Refill columns from top with gravity
   */
  public static refillBoard(board: CandyTileData[][], harvestedItems: CandyItemType[]) {
    for (let c = 0; c < 8; c++) {
      const col: CandyTileData[] = [];
      for (let r = 0; r < 8; r++) {
        if (board[r][c].type !== -1) {
          col.push(board[r][c]);
        }
      }
      const missing = 8 - col.length;
      for (let i = 0; i < missing; i++) {
        const hasItem = Math.random() < 0.18;
        const itemType = hasItem ? this.ITEM_TYPES[Math.floor(Math.random() * this.ITEM_TYPES.length)] : undefined;
        col.unshift({
          id: `spawn-${c}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          type: Math.floor(Math.random() * 6),
          special: 'none',
          hasItem,
          itemType,
        });
      }
      for (let r = 0; r < 8; r++) {
        board[r][c] = col[r];
      }
    }
  }

  /**
   * Cascade loop after initial move until no more 3-matches exist
   */
  public static processAllCascades(
    board: CandyTileData[][],
    harvestedItems: CandyItemType[]
  ): { cascadeDamage: number; cascadeCombos: number } {
    let cascadeDamage = 0;
    let cascadeCombos = 0;

    while (true) {
      const { matchedCoords, specialsToSpawn } = this.findMatches(board);
      if (matchedCoords.size === 0) break;

      cascadeCombos++;
      const destroyed = new Set<string>(matchedCoords);

      // Check if any matched tile was special
      matchedCoords.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        const tile = board[r][c];
        if (tile.special && tile.special !== 'none') {
          this.detonateSpecial(board, r, c, tile.special, destroyed);
        }
      });

      cascadeDamage += Math.round(destroyed.size * 2 * (1 + cascadeCombos * 0.3));

      // Harvest items
      destroyed.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        if (board[r][c].hasItem && board[r][c].itemType) {
          harvestedItems.push(board[r][c].itemType!);
        }
        board[r][c] = { id: `del-${r}-${c}`, type: -1, special: 'none', hasItem: false };
      });

      // Place newly created specials into the board before refill
      specialsToSpawn.forEach((spec, coord) => {
        const [r, c] = coord.split(',').map(Number);
        board[r][c] = {
          id: `spec-${r}-${c}-${Date.now()}`,
          type: spec.type,
          special: spec.special,
          hasItem: false,
        };
      });

      this.refillBoard(board, harvestedItems);
    }

    return { cascadeDamage, cascadeCombos };
  }

  /**
   * Main player/bot swap execution
   */
  public static executeSwap(
    board: CandyTileData[][],
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): SwapProcessResult {
    // 1. Check for special combination
    const specialComboRes = this.handleSpecialCombo(board, r1, c1, r2, c2);
    if (specialComboRes) {
      return specialComboRes;
    }

    // 2. Perform regular swap
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;

    const initialMatches = this.findMatches(board, { r: r2, c: c2 });
    if (initialMatches.matchedCoords.size === 0) {
      // Revert swap
      board[r2][c2] = board[r1][c1];
      board[r1][c1] = temp;
      return { success: false, totalDamage: 0, comboCount: 0, harvestedItems: [] };
    }

    // Process initial match
    const harvestedItems: CandyItemType[] = [];
    const destroyed = new Set<string>(initialMatches.matchedCoords);

    // Detonate any special candies caught in the match
    initialMatches.matchedCoords.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = board[r][c];
      if (tile.special && tile.special !== 'none') {
        this.detonateSpecial(board, r, c, tile.special, destroyed);
      }
    });

    let totalDamage = Math.round(destroyed.size * 2.5);

    destroyed.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      if (board[r][c].hasItem && board[r][c].itemType) {
        harvestedItems.push(board[r][c].itemType!);
      }
      board[r][c] = { id: `del-${r}-${c}`, type: -1, special: 'none', hasItem: false };
    });

    // Spawn special candies from initial match
    initialMatches.specialsToSpawn.forEach((spec, coord) => {
      const [r, c] = coord.split(',').map(Number);
      board[r][c] = {
        id: `spec-${r}-${c}-${Date.now()}`,
        type: spec.type,
        special: spec.special,
        hasItem: false,
      };
    });

    this.refillBoard(board, harvestedItems);

    // Follow-up cascades
    const cascadeFollowup = this.processAllCascades(board, harvestedItems);
    totalDamage += cascadeFollowup.cascadeDamage;
    const comboCount = 1 + cascadeFollowup.cascadeCombos;

    let announcer: 'sweet' | 'tasty' | 'delicious' | 'divine' | 'sugar_crush' | undefined;
    if (comboCount >= 6) announcer = 'divine';
    else if (comboCount >= 5) announcer = 'delicious';
    else if (comboCount >= 4) announcer = 'tasty';
    else if (comboCount >= 3) announcer = 'sweet';

    return {
      success: true,
      totalDamage,
      comboCount,
      harvestedItems,
      announcer,
    };
  }

  /**
   * Smart Bot AI move finder
   * 1. Looks for Special + Special combos
   * 2. Looks for 5-in-a-row (Color Bomb) or T/L (Wrapped) or 4-in-a-row (Striped)
   * 3. Looks for normal 3-in-a-row
   */
  public static findSmartBotMove(board: CandyTileData[][]): { r1: number; c1: number; r2: number; c2: number } | null {
    const dirs = [
      [0, 1],
      [1, 0],
    ];

    let bestMove: { r1: number; c1: number; r2: number; c2: number; score: number } | null = null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 8 && nc < 8) {
            const t1 = board[r][c];
            const t2 = board[nr][nc];

            // 1. Priority: Special combos
            if (
              (t1.special === 'color_bomb' && t2.special === 'color_bomb') ||
              (t1.special === 'color_bomb' && t2.special && t2.special !== 'none') ||
              (t2.special === 'color_bomb' && t1.special && t1.special !== 'none')
            ) {
              return { r1: r, c1: c, r2: nr, c2: nc };
            }
            if (
              t1.special &&
              t1.special !== 'none' &&
              t2.special &&
              t2.special !== 'none'
            ) {
              return { r1: r, c1: c, r2: nr, c2: nc };
            }

            // 2. Test swap for special creation
            board[r][c] = t2;
            board[nr][nc] = t1;
            const matches = this.findMatches(board);
            // Revert
            board[nr][nc] = t2;
            board[r][c] = t1;

            if (matches.matchedCoords.size > 0) {
              let score = matches.matchedCoords.size;
              if (matches.specialsToSpawn.size > 0) {
                matches.specialsToSpawn.forEach((s) => {
                  if (s.special === 'color_bomb') score += 50;
                  else if (s.special === 'wrapped') score += 30;
                  else if (s.special === 'striped_h' || s.special === 'striped_v') score += 15;
                });
              }
              if (!bestMove || score > bestMove.score) {
                bestMove = { r1: r, c1: c, r2: nr, c2: nc, score };
              }
            }
          }
        }
      }
    }

    return bestMove ? { r1: bestMove.r1, c1: bestMove.c1, r2: bestMove.r2, c2: bestMove.c2 } : null;
  }
}
