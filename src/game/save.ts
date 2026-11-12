import { MISSION_ORDER, type MissionId } from "@/game/campaign";
import {
  CHAR_ORDER,
  emptyPlayerLevels,
  emptyWeapons,
  type CharId,
  type PlayerLevels,
  type WeaponLevels,
  type WeaponStat,
  type Difficulty,
} from "@/game/roster";
import type { Lang } from "@/game/i18n";

export type Graphics = "low" | "medium" | "high";
export type Hand = "right" | "left";
export type Fps = 30 | 60;

export type Settings = {
  graphics: Graphics;
  master: number;
  sfx: number;
  music: number;
  ui: number;
  ambience: number;
  vibration: boolean;
  shake: boolean;
  difficulty: Difficulty;
  aimAssist: boolean;
  padScale: number;
  padOpacity: number;
  hand: Hand;
  fps: Fps;
  lang: Lang;
};

export type MissionRecord = {
  done: boolean;
  best: number;
  stars: number;
  bossPaid: boolean;
  combatBest: number;
};

export type CampaignSave = {
  unlocked: number;
  level: number;
  records: Record<MissionId, MissionRecord>;
  levels: MissionRecord[];
};

export type SaveData = {
  version: 5;
  bestKills: number;
  bestScore: number;
  coins: number;
  settings: Settings;
  campaign: CampaignSave;
  character: CharId;
  bought: CharId[];
  weapons: [WeaponLevels, WeaponLevels, WeaponLevels];
  player: PlayerLevels;
  achievements: string[];
  found: string[];
  totalKills: number;
  deaths: number;
  playSeconds: number;
  bosses: number;
  warehouseKillsBest: number;
};

export const DEFAULT_SETTINGS: Settings = {
  graphics: "medium",
  master: 1,
  sfx: 0.8,
  music: 0.45,
  ui: 0.75,
  ambience: 0.4,
  vibration: true,
  shake: true,
  difficulty: "normal",
  aimAssist: true,
  padScale: 1,
  padOpacity: 0.9,
  hand: "right",
  fps: 60,
  lang: "en",
};

const KEY = "beanops-shadow-strike-v2";
const BAK = "beanops-shadow-strike-v2-bak";
const STATS: WeaponStat[] = ["damage", "fire", "mag", "reload", "accuracy"];

function emptyRecord(): MissionRecord {
  return { done: false, best: 0, stars: 0, bossPaid: false, combatBest: 0 };
}

export function emptyLevels(): MissionRecord[] {
  return Array.from({ length: 30 }, () => emptyRecord());
}

const ZONE_START = [1, 7, 13, 19, 25];
export const ZONE_BOSS_LEVEL: Record<MissionId, number> = {
  city: 6,
  factory: 12,
  base: 18,
  desert: 24,
  zero: 30,
};

export function syncCampaign(c: CampaignSave) {
  const lv = c.level;
  c.unlocked = lv >= 25 ? 5 : lv >= 19 ? 4 : lv >= 13 ? 3 : lv >= 7 ? 2 : 1;
}

export function emptyCampaign(): CampaignSave {
  return {
    unlocked: 1,
    level: 1,
    records: {
      city: emptyRecord(),
      factory: emptyRecord(),
      base: emptyRecord(),
      desert: emptyRecord(),
      zero: emptyRecord(),
    },
    levels: emptyLevels(),
  };
}

function clampNum(n: unknown, min: number, max: number, fallback: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function levels(raw: Partial<WeaponLevels> | undefined): WeaponLevels {
  const out = emptyWeapons()[0];
  for (const s of STATS) out[s] = clampNum(raw?.[s], 0, 5, 0);
  return out;
}

export function defaultSave(): SaveData {
  return {
    version: 5,
    bestKills: 0,
    bestScore: 0,
    coins: 0,
    settings: { ...DEFAULT_SETTINGS },
    campaign: emptyCampaign(),
    character: "commando",
    bought: [],
    weapons: emptyWeapons(),
    player: emptyPlayerLevels(),
    achievements: [],
    found: [],
    totalKills: 0,
    deaths: 0,
    playSeconds: 0,
    bosses: 0,
    warehouseKillsBest: 0,
  };
}

function normalize(parsed: Partial<SaveData> & { campaign?: Partial<CampaignSave> }): SaveData {
  const base = defaultSave();
  const records = emptyCampaign().records;
  const incoming = (parsed.campaign?.records ?? {}) as Partial<Record<MissionId, Partial<MissionRecord>>>;
  for (const id of MISSION_ORDER) {
    const row = incoming[id];
    if (!row) continue;
    records[id] = {
      done: Boolean(row.done),
      best: Math.max(0, Number(row.best) || 0),
      stars: clampNum(row.stars, 0, 3, 0),
      bossPaid: Boolean(row.bossPaid),
      combatBest: Math.max(0, Number(row.combatBest) || 0),
    };
  }
  const levelRows = emptyLevels();
  const rawLevels = Array.isArray(parsed.campaign?.levels) ? parsed.campaign?.levels : [];
  for (let i = 0; i < 30; i++) {
    const row = rawLevels[i] as Partial<MissionRecord> | undefined;
    if (!row) continue;
    levelRows[i] = {
      done: Boolean(row.done),
      best: Math.max(0, Number(row.best) || 0),
      stars: clampNum(row.stars, 0, 3, 0),
      bossPaid: Boolean(row.bossPaid),
      combatBest: Math.max(0, Number(row.combatBest) || 0),
    };
  }
  let level = clampNum(parsed.campaign?.level, 1, 30, 0);
  if (!level) {
    const zone = clampNum(parsed.campaign?.unlocked, 1, 5, 1);
    level = ZONE_START[zone - 1] ?? 1;
  }
  for (const id of MISSION_ORDER) {
    const rec = records[id];
    const idx = ZONE_BOSS_LEVEL[id] - 1;
    if (!rec.done || !levelRows[idx] || levelRows[idx].done) continue;
    levelRows[idx] = {
      done: true,
      best: rec.best,
      stars: rec.stars,
      bossPaid: rec.bossPaid,
      combatBest: rec.combatBest,
    };
    level = Math.max(level, id === "zero" ? 30 : Math.min(30, ZONE_BOSS_LEVEL[id] + 1));
  }
  if (records.zero.done) level = 30;
  const campaign: CampaignSave = { unlocked: 1, level, records, levels: levelRows };
  syncCampaign(campaign);
  const bought = Array.isArray(parsed.bought) ? parsed.bought.filter((id): id is CharId => CHAR_ORDER.includes(id as CharId)) : [];
  const character = CHAR_ORDER.includes(parsed.character as CharId) ? (parsed.character as CharId) : "commando";
  const weaponsRaw = Array.isArray(parsed.weapons) ? parsed.weapons : [];
  const playerRaw = (parsed.player ?? {}) as Partial<PlayerLevels>;
  const player = emptyPlayerLevels();
  (Object.keys(player) as (keyof PlayerLevels)[]).forEach((k) => {
    player[k] = clampNum(playerRaw[k], 0, 5, 0);
  });
  const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) };
  settings.master = clampNum(settings.master, 0, 1, 1);
  settings.sfx = clampNum(settings.sfx, 0, 1, 0.8);
  settings.music = clampNum(settings.music, 0, 1, 0.45);
  settings.ui = clampNum(settings.ui, 0, 1, 0.75);
  settings.ambience = clampNum(settings.ambience, 0, 1, 0.4);
  settings.padScale = clampNum(settings.padScale, 0.8, 1.25, 1);
  settings.padOpacity = clampNum(settings.padOpacity, 0.4, 1, 0.9);
  if (settings.difficulty !== "easy" && settings.difficulty !== "hard") settings.difficulty = "normal";
  if (settings.hand !== "left") settings.hand = "right";
  if (settings.fps !== 30) settings.fps = 60;
  if (settings.lang !== "es") settings.lang = "en";
  if (!["low", "medium", "high"].includes(settings.graphics)) settings.graphics = "medium";
  settings.aimAssist = settings.aimAssist !== false;
  settings.vibration = settings.vibration !== false;
  settings.shake = settings.shake !== false;
  return {
    version: 5,
    bestKills: Math.max(0, Number(parsed.bestKills) || 0),
    bestScore: Math.max(0, Number(parsed.bestScore) || 0),
    coins: Math.max(0, Number(parsed.coins) || 0),
    settings,
    campaign,
    character,
    bought,
    weapons: [levels(weaponsRaw[0]), levels(weaponsRaw[1]), levels(weaponsRaw[2])],
    player,
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter((a) => typeof a === "string").slice(0, 24) : [],
    found: Array.isArray(parsed.found) ? parsed.found.filter((a) => typeof a === "string").slice(0, 400) : [],
    totalKills: Math.max(0, Number(parsed.totalKills) || 0),
    deaths: Math.max(0, Number(parsed.deaths) || 0),
    playSeconds: Math.max(0, Number(parsed.playSeconds) || 0),
    bosses: Math.max(0, Number(parsed.bosses) || 0),
    warehouseKillsBest: Math.max(0, Number(parsed.warehouseKillsBest) || 0),
  };
}

function readRaw(raw: string | null): SaveData | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<SaveData>;
  return normalize(parsed);
}

export function readSave(): SaveData {
  try {
    const main = readRaw(localStorage.getItem(KEY));
    if (main) return main;
  } catch {
    /* try backup */
  }
  try {
    const bak = readRaw(localStorage.getItem(BAK));
    if (bak) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...bak, version: 5 }));
      } catch {
        /* keep the backup if the heal write fails */
      }
      return bak;
    }
  } catch {
    /* defaults */
  }
  return defaultSave();
}

export function writeSave(data: SaveData) {
  try {
    const next = JSON.stringify({ ...data, version: 5 });
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BAK, prev);
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode or quota */
  }
}

export function exportSave(data: SaveData) {
  return JSON.stringify({ ...data, version: 5 });
}

export function importSave(raw: string): SaveData | null {
  try {
    return normalize(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return null;
  }
}
