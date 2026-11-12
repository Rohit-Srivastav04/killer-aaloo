import {
  COLS,
  FLOOR,
  ROWS,
  TILE,
  T_BARREL,
  T_CRATE,
  T_EMPTY,
  T_ONEWAY,
  T_SOLID,
  idx,
  type Band,
  type EnemyKind,
  type PickupDef,
  type SpawnDef,
} from "@/game/level";

export type MissionId = "city" | "factory" | "base" | "desert" | "zero";

export type Belt = { c0: number; c1: number; dir: 1 | -1; row?: number };
export type Vent = { col: number; row: number; phase: number; on: boolean };
export type Bridge = { c0: number; c1: number; row: number; t: number; gone: boolean };
export type Plat = { x: number; y: number; w: number; h: number; vx: number; minX: number; maxX: number };
export type StaticSpawn = { kind: EnemyKind; col: number; band: Band };

export type BuiltMission = {
  id: MissionId;
  theme: MissionId;
  title: string;
  blurb: string;
  difficulty: string;
  killGoal: number;
  bossName: string;
  bossHp: number;
  gensNeed: number;
  antsNeed: number;
  tiles: Uint8Array;
  spawns: SpawnDef[];
  pickups: PickupDef[];
  belts: Belt[];
  vents: Vent[];
  bridges: Bridge[];
  plats: Plat[];
  statics: StaticSpawn[];
  level: number;
  wantsBoss: boolean;
  extract: boolean;
  extractCol: number;
  depotNeed: boolean;
  bossAt?: { col: number; row: number };
  bossStyle?: string;
  startRow?: number;
  tease?: string;
  decks?: { row: number; c0: number; c1: number; note: string }[];
};

export const MISSION_ORDER: MissionId[] = ["city", "factory", "base", "desert", "zero"];

export const MISSION_META: { id: MissionId; name: string; blurb: string; difficulty: string }[] = [
  { id: "city", name: "City Chaos", blurb: "Clear the streets and rooftops, drop the block boss, reach extraction.", difficulty: "Moderate" },
  { id: "factory", name: "Factory Mayhem", blurb: "Ride the belts, vent the steam, wreck three generators, drop the foreman.", difficulty: "Hard" },
  { id: "base", name: "Military Base", blurb: "Silence the turrets, smash the antennas, beat the gate warden.", difficulty: "Hard" },
  { id: "desert", name: "Desert Strike", blurb: "Cross the collapsing spans, burn the supply depot, drop the desert commander.", difficulty: "Severe" },
  { id: "zero", name: "Commander Zero", blurb: "Final arena. Three phases. End the campaign.", difficulty: "Boss" },
];

function blank() {
  const tiles = new Uint8Array(COLS * ROWS);
  const put = (c: number, r: number, k = T_SOLID) => {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    tiles[idx(c, r)] = k;
  };
  const ground = (a: number, b: number) => {
    for (let c = a; c <= b; c++) for (let r = FLOOR; r < ROWS; r++) put(c, r, T_SOLID);
  };
  const seal = () => {
    for (let r = 8; r < ROWS; r++) put(119, r, T_SOLID);
    for (let r = 10; r <= FLOOR; r++) put(118, r, T_SOLID);
  };
  return { tiles, put, ground, seal };
}

export function buildCampaign(id: MissionId): BuiltMission {
  const draft = id === "city" ? city() : id === "factory" ? factory() : id === "base" ? base() : id === "desert" ? desert() : zero();
  return {
    level: 0,
    wantsBoss: true,
    extract: id === "city" || id === "base",
    extractCol: 114,
    depotNeed: id === "desert",
    ...draft,
  } as BuiltMission;
}

function city() {
  const { tiles, put, ground, seal } = blank();
  ground(0, 16);
  ground(20, 38);
  ground(42, 64);
  ground(68, 90);
  ground(94, 119);
  for (let c = 4; c <= 14; c++) put(c, 8, T_ONEWAY);
  for (let c = 24; c <= 34; c++) put(c, 9, T_ONEWAY);
  for (let c = 48; c <= 60; c++) put(c, 8, T_ONEWAY);
  for (let c = 74; c <= 86; c++) put(c, 9, T_ONEWAY);
  for (let c = 100; c <= 112; c++) put(c, 8, T_ONEWAY);
  for (const [c, r] of [
    [6, 12],
    [12, 12],
    [28, 12],
    [52, 12],
    [78, 12],
    [104, 12],
  ] as [number, number][])
    put(c, r, T_CRATE);
  for (const [c, r] of [
    [22, 12],
    [56, 12],
    [96, 12],
  ] as [number, number][])
    put(c, r, T_BARREL);
  seal();
  const spawns: SpawnDef[] = [
    { col: 8, kind: "soldier", band: "low" },
    { col: 11, kind: "runner", band: "high" },
    { col: 14, kind: "soldier", band: "low" },
    { col: 16, kind: "runner", band: "low" },
    { col: 26, kind: "runner", band: "low" },
    { col: 30, kind: "soldier", band: "high" },
    { col: 34, kind: "melee", band: "low" },
    { col: 38, kind: "soldier", band: "low" },
    { col: 46, kind: "soldier", band: "high" },
    { col: 50, kind: "runner", band: "low" },
    { col: 55, kind: "elite", band: "low" },
    { col: 60, kind: "soldier", band: "low" },
    { col: 64, kind: "runner", band: "high" },
    { col: 72, kind: "soldier", band: "low" },
    { col: 76, kind: "elite", band: "low" },
    { col: 82, kind: "soldier", band: "high" },
    { col: 88, kind: "runner", band: "low" },
    { col: 90, kind: "melee", band: "low" },
  ];
  return {
    id: "city",
    theme: "city",
    title: "City Chaos",
    blurb: MISSION_META[0]!.blurb,
    difficulty: "Moderate",
    killGoal: spawns.length,
    bossName: "STREET BOSS",
    bossHp: 480,
    gensNeed: 0,
    antsNeed: 0,
    tiles,
    spawns,
    pickups: [
      { col: 5, kind: "coin", band: "low" },
      { col: 9, kind: "rifle", band: "high" },
      { col: 18, kind: "health", band: "low" },
      { col: 32, kind: "pistolAmmo", band: "low" },
      { col: 49, kind: "rifleAmmo", band: "high" },
      { col: 70, kind: "health", band: "low" },
      { col: 84, kind: "grenade", band: "low" },
      { col: 102, kind: "health", band: "low" },
      { col: 108, kind: "rifleAmmo", band: "low" },
    ],
    belts: [],
    vents: [],
    bridges: [],
    plats: [],
    statics: [],
  };
}

function factory() {
  const { tiles, put, ground, seal } = blank();
  ground(0, 36);
  ground(46, 92);
  ground(98, 119);
  for (let c = 8; c <= 18; c++) put(c, 9, T_ONEWAY);
  for (let c = 50; c <= 62; c++) put(c, 9, T_ONEWAY);
  for (let c = 70; c <= 84; c++) put(c, 8, T_ONEWAY);
  for (let c = 102; c <= 114; c++) put(c, 9, T_ONEWAY);
  for (const [c, top] of [
    [20, 12],
    [21, 11],
    [22, 10],
  ] as [number, number][])
    for (let r = top; r <= FLOOR; r++) put(c, r, T_SOLID);
  for (const [c, r] of [
    [14, 12],
    [30, 12],
    [54, 12],
    [74, 12],
  ] as [number, number][])
    put(c, r, T_CRATE);
  for (const [c, r] of [
    [16, 12],
    [48, 12],
    [66, 12],
    [100, 12],
  ] as [number, number][])
    put(c, r, T_BARREL);
  seal();
  const spawns: SpawnDef[] = [
    { col: 10, kind: "soldier", band: "low" },
    { col: 15, kind: "melee", band: "low" },
    { col: 28, kind: "heavy", band: "low" },
    { col: 34, kind: "soldier", band: "high" },
    { col: 52, kind: "soldier", band: "low" },
    { col: 60, kind: "melee", band: "high" },
    { col: 72, kind: "heavy", band: "low" },
    { col: 86, kind: "soldier", band: "low" },
  ];
  const platY = 11 * TILE;
  return {
    id: "factory",
    theme: "factory",
    title: "Factory Mayhem",
    blurb: MISSION_META[1]!.blurb,
    difficulty: "Hard",
    killGoal: spawns.length,
    bossName: "FOREMAN",
    bossHp: 520,
    gensNeed: 3,
    antsNeed: 0,
    tiles,
    spawns,
    pickups: [
      { col: 4, kind: "rifle", band: "low" },
      { col: 12, kind: "health", band: "low" },
      { col: 24, kind: "coin", band: "high" },
      { col: 49, kind: "rifleAmmo", band: "low" },
      { col: 64, kind: "grenade", band: "low" },
      { col: 80, kind: "health", band: "low" },
      { col: 104, kind: "rifleAmmo", band: "low" },
    ],
    belts: [
      { c0: 24, c1: 34, dir: 1 },
      { c0: 56, c1: 68, dir: -1 },
    ],
    vents: [
      { col: 32, row: 12, phase: 0, on: false },
      { col: 76, row: 12, phase: 2.1, on: false },
    ],
    bridges: [],
    plats: [{ x: 38 * TILE, y: platY, w: TILE * 3, h: 14, vx: 70, minX: 37 * TILE, maxX: 44 * TILE }],
    statics: [
      { kind: "generator", col: 26, band: "low" },
      { kind: "generator", col: 58, band: "low" },
      { kind: "generator", col: 82, band: "low" },
    ],
  };
}

function base() {
  const { tiles, put, ground, seal } = blank();
  ground(0, 22);
  ground(26, 50);
  ground(54, 78);
  ground(82, 119);
  for (let c = 6; c <= 16; c++) put(c, 8, T_ONEWAY);
  for (let c = 30; c <= 44; c++) put(c, 8, T_ONEWAY);
  for (let c = 58; c <= 72; c++) put(c, 9, T_ONEWAY);
  for (let c = 88; c <= 104; c++) put(c, 8, T_ONEWAY);
  for (let c = 108; c <= 116; c++) put(c, 9, T_ONEWAY);
  for (const [c, r] of [
    [8, 12],
    [34, 12],
    [62, 12],
    [96, 12],
  ] as [number, number][])
    put(c, r, T_CRATE);
  for (const [c, r] of [
    [18, 12],
    [48, 12],
    [90, 12],
  ] as [number, number][])
    put(c, r, T_BARREL);
  seal();
  const spawns: SpawnDef[] = [
    { col: 10, kind: "soldier", band: "low" },
    { col: 14, kind: "elite", band: "high" },
    { col: 28, kind: "soldier", band: "low" },
    { col: 36, kind: "elite", band: "low" },
    { col: 42, kind: "melee", band: "high" },
    { col: 56, kind: "soldier", band: "low" },
    { col: 66, kind: "elite", band: "high" },
    { col: 74, kind: "heavy", band: "low" },
    { col: 92, kind: "soldier", band: "low" },
    { col: 100, kind: "elite", band: "low" },
  ];
  return {
    id: "base",
    theme: "base",
    title: "Military Base",
    blurb: MISSION_META[2]!.blurb,
    difficulty: "Hard",
    killGoal: spawns.length,
    bossName: "GATE WARDEN",
    bossHp: 500,
    gensNeed: 0,
    antsNeed: 2,
    tiles,
    spawns,
    pickups: [
      { col: 4, kind: "rifle", band: "low" },
      { col: 16, kind: "health", band: "low" },
      { col: 32, kind: "rifleAmmo", band: "high" },
      { col: 52, kind: "grenade", band: "low" },
      { col: 70, kind: "health", band: "low" },
      { col: 94, kind: "pistolAmmo", band: "low" },
      { col: 110, kind: "health", band: "low" },
    ],
    belts: [],
    vents: [],
    bridges: [],
    plats: [],
    statics: [
      { kind: "turret", col: 20, band: "low" },
      { kind: "turret", col: 64, band: "low" },
      { kind: "antenna", col: 40, band: "low" },
      { kind: "antenna", col: 86, band: "low" },
    ],
  };
}

function desert() {
  const { tiles, put, ground, seal } = blank();
  ground(0, 18);
  ground(28, 48);
  ground(58, 84);
  ground(94, 119);
  for (let c = 20; c <= 26; c++) put(c, 12, T_SOLID);
  for (let c = 50; c <= 56; c++) put(c, 12, T_SOLID);
  for (let c = 8; c <= 16; c++) put(c, 9, T_ONEWAY);
  for (let c = 32; c <= 44; c++) put(c, 8, T_ONEWAY);
  for (let c = 64; c <= 78; c++) put(c, 9, T_ONEWAY);
  for (let c = 100; c <= 114; c++) put(c, 8, T_ONEWAY);
  for (const [c, r] of [
    [10, 12],
    [36, 12],
    [70, 12],
    [102, 12],
  ] as [number, number][])
    put(c, r, T_CRATE);
  for (const [c, r] of [
    [14, 12],
    [40, 12],
    [88, 12],
  ] as [number, number][])
    put(c, r, T_BARREL);
  seal();
  const spawns: SpawnDef[] = [
    { col: 9, kind: "soldier", band: "low" },
    { col: 12, kind: "sniper", band: "high" },
    { col: 30, kind: "soldier", band: "low" },
    { col: 38, kind: "sniper", band: "high" },
    { col: 46, kind: "melee", band: "low" },
    { col: 62, kind: "soldier", band: "low" },
    { col: 72, kind: "sniper", band: "high" },
    { col: 80, kind: "elite", band: "low" },
    { col: 98, kind: "soldier", band: "low" },
  ];
  const platY = 11 * TILE;
  return {
    id: "desert",
    theme: "desert",
    title: "Desert Strike",
    blurb: MISSION_META[3]!.blurb,
    difficulty: "Severe",
    killGoal: spawns.length,
    bossName: "DUNE COMMANDER",
    bossHp: 540,
    gensNeed: 0,
    antsNeed: 0,
    tiles,
    spawns,
    pickups: [
      { col: 4, kind: "rifle", band: "low" },
      { col: 15, kind: "health", band: "low" },
      { col: 34, kind: "rifleAmmo", band: "high" },
      { col: 60, kind: "health", band: "low" },
      { col: 76, kind: "grenade", band: "low" },
      { col: 96, kind: "rifleAmmo", band: "low" },
      { col: 110, kind: "health", band: "low" },
    ],
    belts: [],
    vents: [],
    bridges: [
      { c0: 20, c1: 26, row: 12, t: 0, gone: false },
      { c0: 50, c1: 56, row: 12, t: 0, gone: false },
    ],
    plats: [{ x: 86 * TILE, y: platY, w: TILE * 3, h: 14, vx: 64, minX: 85 * TILE, maxX: 92 * TILE }],
    statics: [{ kind: "depot", col: 100, band: "low" }],
  };
}

function zero() {
  const { tiles, put, ground, seal } = blank();
  ground(0, 119);
  for (let c = 18; c <= 32; c++) put(c, 9, T_ONEWAY);
  for (let c = 48; c <= 64; c++) put(c, 8, T_ONEWAY);
  for (let c = 78; c <= 96; c++) put(c, 9, T_ONEWAY);
  for (const [c, r] of [
    [12, 12],
    [24, 12],
    [40, 12],
    [70, 12],
    [88, 12],
  ] as [number, number][])
    put(c, r, T_CRATE);
  for (const [c, r] of [
    [16, 12],
    [44, 12],
    [60, 12],
    [100, 12],
    [110, 12],
  ] as [number, number][])
    put(c, r, T_BARREL);
  seal();
  const spawns: SpawnDef[] = [
    { col: 14, kind: "soldier", band: "low" },
    { col: 22, kind: "elite", band: "high" },
    { col: 36, kind: "heavy", band: "low" },
    { col: 52, kind: "soldier", band: "low" },
  ];
  return {
    id: "zero",
    theme: "zero",
    title: "Commander Zero",
    blurb: MISSION_META[4]!.blurb,
    difficulty: "Boss",
    killGoal: spawns.length,
    bossName: "COMMANDER ZERO",
    bossHp: 900,
    gensNeed: 0,
    antsNeed: 0,
    tiles,
    spawns,
    pickups: [
      { col: 6, kind: "rifle", band: "low" },
      { col: 10, kind: "health", band: "low" },
      { col: 20, kind: "rifleAmmo", band: "high" },
      { col: 42, kind: "grenade", band: "low" },
      { col: 58, kind: "health", band: "low" },
      { col: 76, kind: "rifleAmmo", band: "low" },
      { col: 94, kind: "health", band: "low" },
      { col: 108, kind: "shells", band: "low" },
    ],
    belts: [],
    vents: [],
    bridges: [],
    plats: [],
    statics: [],
  };
}
