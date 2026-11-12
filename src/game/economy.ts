import { type MissionId } from "@/game/campaign";
import { levelDef } from "@/game/levels";
import {
  CHARACTERS,
  CHAR_ORDER,
  WEAPON_STATS,
  charUnlocked,
  playerPrice,
  weaponPrice,
  type CharId,
  type PlayerStat,
  type WeaponStat,
} from "@/game/roster";
import { syncCampaign, ZONE_BOSS_LEVEL, type SaveData } from "@/game/save";

export const ACHIEVEMENTS: { id: string; name: string; desc: string }[] = [
  { id: "first-blood", name: "First Takedown", desc: "Defeat your first enemy." },
  { id: "sharpshooter", name: "Sharpshooter", desc: "Defeat 50 enemies." },
  { id: "survivor", name: "Survivor", desc: "Clear a mission without dying." },
  { id: "boss-slayer", name: "Boss Slayer", desc: "Defeat Commander Zero." },
  { id: "weapon-master", name: "Weapon Master", desc: "Max every upgrade on one weapon." },
  { id: "campaign-hero", name: "Campaign Hero", desc: "Clear the thirty-level campaign." },
];

export function checkAchievements(save: SaveData) {
  const have = new Set(save.achievements);
  const fresh: string[] = [];
  const add = (id: string, ok: boolean) => {
    if (!ok || have.has(id)) return;
    have.add(id);
    fresh.push(id);
  };
  const zeroDown = save.campaign.records.zero.done || Boolean(save.campaign.levels[29]?.done);
  add("first-blood", save.totalKills >= 1);
  add("sharpshooter", save.totalKills >= 50);
  add("boss-slayer", zeroDown || (save.bosses > 0 && save.campaign.records.zero.bossPaid));
  add("campaign-hero", save.campaign.levels.every((row) => row.done));
  add(
    "weapon-master",
    save.weapons.some((w) => WEAPON_STATS.every((s) => w[s] >= 5)),
  );
  if (fresh.length) save.achievements = [...save.achievements, ...fresh];
  return fresh.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id);
}

export function noteSurvivor(save: SaveData, clean: boolean) {
  if (!clean || save.achievements.includes("survivor")) return [];
  save.achievements = [...save.achievements, "survivor"];
  return ["Survivor"];
}

export function buyWeapon(save: SaveData, index: number, stat: WeaponStat) {
  const row = save.weapons[index];
  if (!row) return { ok: false, price: 0 };
  const level = row[stat];
  if (level >= 5) return { ok: false, price: 0 };
  const price = weaponPrice(level);
  if (save.coins < price) return { ok: false, price };
  save.coins -= price;
  row[stat] = level + 1;
  return { ok: true, price };
}

export function buyPlayer(save: SaveData, stat: PlayerStat) {
  const level = save.player[stat];
  if (level >= 5) return { ok: false, price: 0 };
  const price = playerPrice(level);
  if (save.coins < price) return { ok: false, price };
  save.coins -= price;
  save.player[stat] = level + 1;
  return { ok: true, price };
}

export function buyCharacter(save: SaveData, id: CharId) {
  if (charUnlocked(id, save.campaign.unlocked, save.bought)) return { ok: false, price: 0, already: true };
  const price = CHARACTERS[id].price;
  if (save.coins < price) return { ok: false, price, already: false };
  save.coins -= price;
  save.bought = [...save.bought, id];
  return { ok: true, price, already: false };
}

export function selectCharacter(save: SaveData, id: CharId) {
  if (!charUnlocked(id, save.campaign.unlocked, save.bought)) return false;
  save.character = id;
  return true;
}

function payRecord(
  save: SaveData,
  rec: { done: boolean; best: number; stars: number; bossPaid: boolean; combatBest: number },
  run: { stars: number; kills: number; boss: boolean; score: number; pickups: string[]; clean: boolean },
) {
  let granted = 0;
  if (!rec.done) granted += 50;
  const starGain = Math.max(0, run.stars - rec.stars);
  granted += starGain * 20;
  if (run.boss && !rec.bossPaid) {
    granted += 30;
    rec.bossPaid = true;
    save.bosses += 1;
  }
  const extraKills = Math.max(0, run.kills - rec.combatBest);
  granted += extraKills;
  rec.combatBest = Math.max(rec.combatBest, run.kills);
  for (const pick of run.pickups) {
    if (save.found.includes(pick)) continue;
    save.found.push(pick);
    granted += 5;
  }
  rec.done = true;
  rec.best = Math.max(rec.best, run.score);
  rec.stars = Math.max(rec.stars, run.stars);
  return granted;
}

export function settleMission(
  save: SaveData,
  id: MissionId,
  run: { stars: number; kills: number; boss: boolean; score: number; pickups: string[]; clean: boolean },
) {
  const rec = save.campaign.records[id];
  const granted = payRecord(save, rec, run);
  const bossLv = ZONE_BOSS_LEVEL[id];
  const lv = save.campaign.levels[bossLv - 1];
  if (lv) {
    lv.done = true;
    lv.stars = Math.max(lv.stars, run.stars);
    lv.best = Math.max(lv.best, run.score);
    lv.bossPaid = lv.bossPaid || rec.bossPaid;
    lv.combatBest = Math.max(lv.combatBest, run.kills);
  }
  save.campaign.level = Math.max(save.campaign.level, id === "zero" ? 30 : Math.min(30, bossLv + 1));
  syncCampaign(save.campaign);
  save.coins += granted;
  const names = [...checkAchievements(save), ...noteSurvivor(save, run.clean)];
  const unlockedNow = CHAR_ORDER.filter((cid) => charUnlocked(cid, save.campaign.unlocked, save.bought));
  return { granted, achievements: names, roster: unlockedNow };
}

export function settleLevel(
  save: SaveData,
  n: number,
  run: { stars: number; kills: number; boss: boolean; score: number; pickups: string[]; clean: boolean },
) {
  const spec = levelDef(n);
  const rec = save.campaign.levels[n - 1];
  if (!spec || !rec) return { granted: 0, achievements: [] as string[], roster: [] as CharId[] };
  const granted = payRecord(save, rec, run);
  if (spec.boss) {
    const zone = save.campaign.records[spec.theme];
    zone.done = true;
    zone.stars = Math.max(zone.stars, rec.stars);
    zone.best = Math.max(zone.best, rec.best);
    zone.bossPaid = zone.bossPaid || rec.bossPaid;
    zone.combatBest = Math.max(zone.combatBest, rec.combatBest);
  }
  save.campaign.level = Math.max(save.campaign.level, n >= 30 ? 30 : n + 1);
  syncCampaign(save.campaign);
  save.coins += granted;
  const names = [...checkAchievements(save), ...noteSurvivor(save, run.clean)];
  const unlockedNow = CHAR_ORDER.filter((cid) => charUnlocked(cid, save.campaign.unlocked, save.bought));
  return { granted, achievements: names, roster: unlockedNow };
}
