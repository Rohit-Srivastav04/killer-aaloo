export const TILE = 48;
export const COLS = 120;
export const ROWS = 44;
export const FLOOR = 13;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export const T_EMPTY = 0;
export const T_SOLID = 1;
export const T_ONEWAY = 2;
export const T_CRATE = 3;
export const T_BARREL = 4;

export type EnemyKind =
  | "soldier"
  | "heavy"
  | "melee"
  | "runner"
  | "elite"
  | "sniper"
  | "turret"
  | "generator"
  | "antenna"
  | "depot";
export type Band = "low" | "high";

export type SpawnDef = { col: number; kind: EnemyKind; band: Band; row?: number };

export type PickupKind =
  | "health"
  | "pistolAmmo"
  | "rifleAmmo"
  | "shells"
  | "grenade"
  | "coin"
  | "rifle"
  | "shotgun";

export type PickupDef = { col: number; kind: PickupKind; band: Band; row?: number };

export const KILL_GOAL = 40;
export const EXIT_COL = 117;

const SPAWNS: SpawnDef[] = [
  { col: 8, kind: "soldier", band: "low" },
  { col: 11, kind: "soldier", band: "low" },
  { col: 12, kind: "soldier", band: "high" },
  { col: 15, kind: "soldier", band: "low" },
  { col: 18, kind: "melee", band: "low" },
  { col: 26, kind: "soldier", band: "low" },
  { col: 29, kind: "soldier", band: "low" },
  { col: 31, kind: "soldier", band: "low" },
  { col: 33, kind: "melee", band: "low" },
  { col: 37, kind: "soldier", band: "low" },
  { col: 43, kind: "heavy", band: "low" },
  { col: 42, kind: "soldier", band: "high" },
  { col: 46, kind: "soldier", band: "high" },
  { col: 49, kind: "soldier", band: "high" },
  { col: 53, kind: "soldier", band: "low" },
  { col: 56, kind: "soldier", band: "low" },
  { col: 59, kind: "melee", band: "low" },
  { col: 62, kind: "soldier", band: "low" },
  { col: 66, kind: "heavy", band: "low" },
  { col: 69, kind: "soldier", band: "low" },
  { col: 71, kind: "melee", band: "low" },
  { col: 57, kind: "soldier", band: "high" },
  { col: 63, kind: "soldier", band: "high" },
  { col: 68, kind: "heavy", band: "high" },
  { col: 78, kind: "soldier", band: "low" },
  { col: 81, kind: "soldier", band: "low" },
  { col: 84, kind: "melee", band: "low" },
  { col: 87, kind: "soldier", band: "low" },
  { col: 90, kind: "heavy", band: "low" },
  { col: 93, kind: "soldier", band: "low" },
  { col: 95, kind: "melee", band: "low" },
  { col: 84, kind: "soldier", band: "high" },
  { col: 88, kind: "soldier", band: "high" },
  { col: 102, kind: "soldier", band: "low" },
  { col: 105, kind: "soldier", band: "low" },
  { col: 107, kind: "soldier", band: "high" },
  { col: 108, kind: "melee", band: "low" },
  { col: 111, kind: "soldier", band: "low" },
  { col: 114, kind: "heavy", band: "low" },
  { col: 116, kind: "soldier", band: "low" },
];

const PICKUPS: PickupDef[] = [
  { col: 4, kind: "coin", band: "low" },
  { col: 10, kind: "coin", band: "high" },
  { col: 13, kind: "pistolAmmo", band: "low" },
  { col: 16, kind: "coin", band: "low" },
  { col: 19, kind: "health", band: "low" },
  { col: 24, kind: "grenade", band: "low" },
  { col: 30, kind: "pistolAmmo", band: "low" },
  { col: 32, kind: "coin", band: "low" },
  { col: 39, kind: "rifle", band: "high" },
  { col: 40, kind: "coin", band: "low" },
  { col: 44, kind: "health", band: "low" },
  { col: 47, kind: "rifleAmmo", band: "high" },
  { col: 51, kind: "coin", band: "high" },
  { col: 55, kind: "pistolAmmo", band: "low" },
  { col: 58, kind: "coin", band: "high" },
  { col: 65, kind: "rifleAmmo", band: "low" },
  { col: 67, kind: "grenade", band: "low" },
  { col: 70, kind: "coin", band: "low" },
  { col: 72, kind: "health", band: "low" },
  { col: 77, kind: "shotgun", band: "low" },
  { col: 79, kind: "shells", band: "low" },
  { col: 83, kind: "pistolAmmo", band: "low" },
  { col: 86, kind: "coin", band: "high" },
  { col: 89, kind: "rifleAmmo", band: "low" },
  { col: 94, kind: "shells", band: "low" },
  { col: 96, kind: "health", band: "low" },
  { col: 101, kind: "grenade", band: "low" },
  { col: 104, kind: "pistolAmmo", band: "low" },
  { col: 106, kind: "coin", band: "high" },
  { col: 109, kind: "health", band: "low" },
  { col: 112, kind: "rifleAmmo", band: "low" },
  { col: 115, kind: "shells", band: "low" },
  { col: 110, kind: "coin", band: "low" },
];

export function idx(c: number, r: number) {
  return r * COLS + c;
}

export function buildTiles(): Uint8Array {
  const t = new Uint8Array(COLS * ROWS);
  const put = (c: number, r: number, k = T_SOLID) => {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    t[idx(c, r)] = k;
  };
  const ground = (a: number, b: number) => {
    for (let c = a; c <= b; c++) for (let r = FLOOR; r < ROWS; r++) put(c, r);
  };
  ground(0, 19);
  ground(23, 44);
  ground(48, 72);
  ground(76, 96);
  ground(100, 119);

  for (let c = 7; c <= 15; c++) put(c, 8, T_ONEWAY);
  for (let c = 41; c <= 52; c++) put(c, 9, T_ONEWAY);
  for (let c = 54; c <= 70; c++) put(c, 10, T_ONEWAY);
  for (let c = 80; c <= 92; c++) put(c, 9, T_ONEWAY);
  for (let c = 104; c <= 116; c++) put(c, 8, T_ONEWAY);

  const steps: [number, number][] = [
    [36, 12],
    [37, 11],
    [38, 10],
    [39, 9],
  ];
  for (const [c, top] of steps) for (let r = top; r <= FLOOR; r++) put(c, r);

  const crates: [number, number][] = [
    [5, 12],
    [6, 12],
    [6, 11],
    [14, 12],
    [27, 12],
    [28, 12],
    [60, 12],
    [61, 12],
    [61, 11],
    [82, 12],
    [91, 12],
    [103, 12],
  ];
  for (const [c, r] of crates) put(c, r, T_CRATE);

  const barrels: [number, number][] = [
    [9, 12],
    [34, 12],
    [64, 12],
    [85, 12],
    [113, 12],
  ];
  for (const [c, r] of barrels) put(c, r, T_BARREL);

  for (let r = 8; r < ROWS; r++) put(119, r, T_SOLID);
  for (let r = 10; r <= FLOOR; r++) put(118, r, T_SOLID);
  return t;
}

export function tileAt(tiles: Uint8Array, c: number, r: number) {
  if (c < 0 || c >= COLS || r < 0) return T_SOLID;
  if (r >= ROWS) return T_EMPTY;
  return tiles[idx(c, r)] ?? T_EMPTY;
}

export function surfacesAt(tiles: Uint8Array, col: number): number[] {
  const rows: number[] = [];
  if (col < 0 || col >= COLS) return rows;
  for (let r = 0; r < ROWS; r++) {
    const k = tiles[idx(col, r)] ?? T_EMPTY;
    if (k === T_EMPTY) continue;
    const above = r === 0 ? T_EMPTY : (tiles[idx(col, r - 1)] ?? T_EMPTY);
    if (above === T_EMPTY) rows.push(r);
  }
  return rows;
}

export function standRow(tiles: Uint8Array, col: number, band: Band): number | null {
  const rows = surfacesAt(tiles, col);
  if (!rows.length) return null;
  return band === "high" ? rows[0]! : rows[rows.length - 1]!;
}

export function spawnDefs() {
  if (SPAWNS.length !== KILL_GOAL) {
    throw new Error(`Expected ${KILL_GOAL} spawns, got ${SPAWNS.length}`);
  }
  return SPAWNS;
}

export function pickupDefs() {
  return PICKUPS;
}

export function fullSolid(k: number) {
  return k === T_SOLID || k === T_CRATE || k === T_BARREL;
}
