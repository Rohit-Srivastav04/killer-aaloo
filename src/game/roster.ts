export type CharId = "commando" | "speedster" | "tank" | "gunner" | "shadow";
export type WeaponStat = "damage" | "fire" | "mag" | "reload" | "accuracy";
export type PlayerStat = "health" | "armor" | "speed" | "jump" | "dodge" | "special" | "ammo";
export type Difficulty = "easy" | "normal" | "hard";

export const CHAR_ORDER: CharId[] = ["commando", "speedster", "tank", "gunner", "shadow"];
export const WEAPON_STATS: WeaponStat[] = ["damage", "fire", "mag", "reload", "accuracy"];
export const PLAYER_STATS: PlayerStat[] = ["health", "armor", "speed", "jump", "dodge", "special", "ammo"];

export type WeaponLevels = Record<WeaponStat, number>;
export type PlayerLevels = Record<PlayerStat, number>;

export type GunMods = { dmg: number; delay: number; mag: number; reload: number; spread: number };

export type Loadout = {
  maxHp: number;
  runMul: number;
  jumpMul: number;
  armor: number;
  aim: boolean;
  foeHp: number;
  foeDmg: number;
  plyDmg: number;
  dodgeCd: number;
  shadow: boolean;
  shadowCd: number;
  reserveMul: number;
  weapons: GunMods[];
  filter: string;
  accent: string;
  name: string;
};

type CharDef = {
  id: CharId;
  name: string;
  blurb: string;
  ability: string;
  hp: number;
  speed: number;
  fire: number;
  mag: number;
  reload: number;
  armor: number;
  run: number;
  jump: number;
  dodge: number;
  shadow: boolean;
  price: number;
  needUnlock: number;
  filter: string;
  accent: string;
};

export const CHARACTERS: Record<CharId, CharDef> = {
  commando: {
    id: "commando",
    name: "Commando",
    blurb: "Balanced bean rifleman. The squad default.",
    ability: "Steady aim and a full kit. No extreme tradeoff.",
    hp: 100,
    speed: 70,
    fire: 1,
    mag: 0,
    reload: 1,
    armor: 0,
    run: 1,
    jump: 1,
    dodge: 6.2,
    shadow: false,
    price: 0,
    needUnlock: 1,
    filter: "none",
    accent: "#e7c27a",
  },
  speedster: {
    id: "speedster",
    name: "Speedster",
    blurb: "Lighter armor, quicker feet.",
    ability: "Moves faster. Less health.",
    hp: 84,
    speed: 92,
    fire: 1,
    mag: 0,
    reload: 0.84,
    armor: 0,
    run: 1.16,
    jump: 1.05,
    dodge: 4.8,
    shadow: false,
    price: 80,
    needUnlock: 2,
    filter: "hue-rotate(195deg) saturate(1.25)",
    accent: "#7ec8ff",
  },
  tank: {
    id: "tank",
    name: "Tank",
    blurb: "Heavy plates. Slower, much harder to drop.",
    ability: "More health and damage resistance. Slower run.",
    hp: 136,
    speed: 52,
    fire: 1.04,
    mag: 0,
    reload: 1.08,
    armor: 0.16,
    run: 0.86,
    jump: 0.94,
    dodge: 7.4,
    shadow: false,
    price: 140,
    needUnlock: 3,
    filter: "saturate(0.55) brightness(0.92) contrast(1.05)",
    accent: "#9aa4b0",
  },
  gunner: {
    id: "gunner",
    name: "Gunner",
    blurb: "Lives in the trigger. Faster fire, deeper mags.",
    ability: "Better fire rate and magazine size.",
    hp: 100,
    speed: 64,
    fire: 0.86,
    mag: 4,
    reload: 0.94,
    armor: 0,
    run: 0.96,
    jump: 1,
    dodge: 6.2,
    shadow: false,
    price: 200,
    needUnlock: 4,
    filter: "hue-rotate(28deg) saturate(1.35)",
    accent: "#f0a202",
  },
  shadow: {
    id: "shadow",
    name: "Shadow",
    blurb: "Closes distance and slips the next hit.",
    ability: "Melee grants a short phase. Faster dodge.",
    hp: 96,
    speed: 76,
    fire: 1,
    mag: 0,
    reload: 1,
    armor: 0.04,
    run: 1.05,
    jump: 1.04,
    dodge: 3.8,
    shadow: true,
    price: 260,
    needUnlock: 5,
    filter: "hue-rotate(265deg) saturate(0.8) brightness(1.08)",
    accent: "#c9b6ff",
  },
};

const GUN_BASE = [
  { dmg: 16, delay: 0.28, mag: 12, reload: 0.9, spread: 0.03 },
  { dmg: 9, delay: 0.09, mag: 30, reload: 1.2, spread: 0.045 },
  { dmg: 7, delay: 0.72, mag: 6, reload: 1.4, spread: 0.2 },
];

export function emptyWeaponLevels(): WeaponLevels {
  return { damage: 0, fire: 0, mag: 0, reload: 0, accuracy: 0 };
}

export function emptyWeapons(): [WeaponLevels, WeaponLevels, WeaponLevels] {
  return [emptyWeaponLevels(), emptyWeaponLevels(), emptyWeaponLevels()];
}

export function emptyPlayerLevels(): PlayerLevels {
  return { health: 0, armor: 0, speed: 0, jump: 0, dodge: 0, special: 0, ammo: 0 };
}

export function weaponPrice(level: number) {
  return 12 * (level + 1);
}

export function playerPrice(level: number) {
  return 16 * (level + 1);
}

export function charUnlocked(id: CharId, campaignUnlocked: number, bought: CharId[]) {
  if (id === "commando") return true;
  if (bought.includes(id)) return true;
  return campaignUnlocked >= CHARACTERS[id].needUnlock;
}

export function buildLoadout(
  id: CharId,
  weapons: [WeaponLevels, WeaponLevels, WeaponLevels],
  player: PlayerLevels,
  difficulty: Difficulty,
  aim: boolean,
): Loadout {
  const c = CHARACTERS[id];
  const foeHp = difficulty === "easy" ? 0.85 : difficulty === "hard" ? 1.22 : 1;
  const foeDmg = difficulty === "easy" ? 0.75 : difficulty === "hard" ? 1.28 : 1;
  const plyDmg = difficulty === "easy" ? 1.1 : difficulty === "hard" ? 0.9 : 1;
  const mods = GUN_BASE.map((b, i) => {
    const u = weapons[i] ?? emptyWeaponLevels();
    return {
      dmg: Math.max(1, Math.round(b.dmg * (1 + 0.08 * u.damage))),
      delay: Math.max(0.045, b.delay * (1 - 0.055 * u.fire) * c.fire),
      mag: Math.max(1, Math.round(b.mag * (1 + 0.12 * u.mag) + c.mag + player.ammo)),
      reload: Math.max(0.32, b.reload * (1 - 0.07 * u.reload) * c.reload),
      spread: Math.max(0.012, b.spread * (1 - 0.09 * u.accuracy)),
    };
  });
  return {
    maxHp: Math.round(c.hp + player.health * 8),
    runMul: c.run * (1 + player.speed * 0.03),
    jumpMul: c.jump * (1 + player.jump * 0.02),
    armor: Math.min(0.42, c.armor + player.armor * 0.04),
    aim,
    foeHp,
    foeDmg,
    plyDmg,
    dodgeCd: Math.max(2.2, c.dodge - player.dodge * 0.35),
    shadow: c.shadow,
    shadowCd: Math.max(0.28, (c.shadow ? 0.36 : 0.46) - player.special * 0.02),
    reserveMul: 1 + player.ammo * 0.12,
    weapons: mods,
    filter: c.filter,
    accent: c.accent,
    name: c.name,
  };
}

export function defaultLoadout(): Loadout {
  return buildLoadout("commando", emptyWeapons(), emptyPlayerLevels(), "normal", true);
}
