import { type BuiltMission, type MissionId } from "@/game/campaign";
import { buildAdventure, routeLabel } from "@/game/adventure";
import type { EnemyKind } from "@/game/level";

export type LevelDef = {
  n: number;
  theme: MissionId;
  zone: string;
  name: string;
  villain: string;
  blurb: string;
  difficulty: string;
  boss: boolean;
  squads: number;
  gens: number;
  ants: number;
  depot: boolean;
  extract: boolean;
  kind: EnemyKind;
};

function row(
  n: number,
  theme: MissionId,
  zone: string,
  name: string,
  villain: string,
  blurb: string,
  difficulty: string,
  boss: boolean,
  squads: number,
  gens: number,
  ants: number,
  depot: boolean,
  kind: EnemyKind,
): LevelDef {
  return {
    n,
    theme,
    zone,
    name,
    villain,
    blurb: `${routeLabel(n)}. ${villain} waits at the end. Kill the boss and the mission is won.`,
    difficulty,
    boss,
    squads,
    gens,
    ants,
    depot,
    extract: false,
    kind,
  };
}

export const LEVELS: LevelDef[] = [
  row(1, "city", "City", "City Entry", "Rook", "Street Reapers hold the first block. Learn the street, then reach extraction.", "Hard", false, 5, 0, 0, false, "soldier"),
  row(2, "city", "City", "Street Ambush", "Switch", "Dual-pistol runners try to flank you in the alleys.", "Hard", false, 6, 0, 0, false, "runner"),
  row(3, "city", "City", "Rooftop Assault", "Needle", "Snipers watch the roofs. Cross the gaps and clear the line.", "Hard", false, 7, 0, 0, false, "sniper"),
  row(4, "city", "City", "Underground Passage", "Ram", "A shielded heavy owns the lower street. Break the line and extract.", "Hard", false, 8, 0, 0, false, "heavy"),
  row(5, "city", "City", "Gang Stronghold", "Fuse", "Grenadiers and barrels. Clear the warehouse block.", "Hard", false, 9, 0, 0, false, "elite"),
  row(6, "city", "City", "City Commander", "Mister Vandal", "The crime boss waits past the squads. Drop him, then extract.", "Boss", true, 12, 0, 0, false, "elite"),
  row(7, "factory", "Factory", "Factory Entrance", "Weld", "Iron Syndicate gate. One generator, then the yard exit.", "Hard", false, 6, 1, 0, false, "soldier"),
  row(8, "factory", "Factory", "Conveyor Chaos", "Sparks", "Belts drag the floor. Shut a generator and ride clear.", "Hard", false, 7, 1, 0, false, "melee"),
  row(9, "factory", "Factory", "Steam Chamber", "Boilerback", "Steam vents and two generators. Do not stand in the blast.", "Hard", false, 8, 2, 0, false, "heavy"),
  row(10, "factory", "Factory", "Machine Yard", "Clatter", "Moving platforms and a heavier crew. Wreck two generators.", "Hard", false, 8, 2, 0, false, "melee"),
  row(11, "factory", "Factory", "Generator Room", "Overload", "All three generators are live. Kill the room, then leave.", "Hard", false, 9, 3, 0, false, "heavy"),
  row(12, "factory", "Factory", "Factory Commander", "Forge Chief", "Destroy the generators, then break the powered foreman.", "Boss", true, 10, 3, 0, false, "heavy"),
  row(13, "base", "Military Base", "Outer Checkpoint", "Ranger", "Black Shield rifles at the gate. Clear the checkpoint and exit.", "Hard", false, 6, 0, 0, false, "soldier"),
  row(14, "base", "Military Base", "Watchtower Assault", "Longshot", "A tower sniper and one antenna. Silence both.", "Hard", false, 7, 0, 1, false, "sniper"),
  row(15, "base", "Military Base", "Security Breach", "Bulwark", "Shield troops hold a gate. Drop the antenna and push through.", "Hard", false, 8, 0, 1, false, "elite"),
  row(16, "base", "Military Base", "Armored Barracks", "Sentry", "Turrets and two antennas inside the barracks.", "Severe", false, 8, 0, 2, false, "elite"),
  row(17, "base", "Military Base", "Radar Destruction", "Ghostline", "Fast elites guard the radar masts. Smash both antennas.", "Severe", false, 9, 0, 2, false, "elite"),
  row(18, "base", "Military Base", "Military Commander", "Major Ironclad", "Antennas down, then the warden. Extract past the gate.", "Boss", true, 10, 0, 2, false, "elite"),
  row(19, "desert", "Desert", "Desert Crossing", "Dust Jackal", "Sand Vipers on the first dune. Cross and extract.", "Severe", false, 6, 0, 0, false, "runner"),
  row(20, "desert", "Desert", "Canyon Ambush", "Mirage Twins", "Collapsing spans and a crossfire. Do not stop on the bridges.", "Severe", false, 7, 0, 0, false, "sniper"),
  row(21, "desert", "Desert", "Ruins Assault", "Burrow", "Ruins, a moving platform, and an ambush team.", "Severe", false, 8, 0, 0, false, "melee"),
  row(22, "desert", "Desert", "Sniper Outpost", "Deadeye", "Long sightlines. Clear the outpost rifles and leave.", "Severe", false, 8, 0, 0, false, "sniper"),
  row(23, "desert", "Desert", "Supply Depot", "Convoy Breaker", "Burn the supply depot, then extract under fire.", "Severe", false, 9, 0, 0, true, "heavy"),
  row(24, "desert", "Desert", "Desert Commander", "Warlord Sirocco", "Depot first. Then the rocket commander.", "Boss", true, 10, 0, 0, true, "sniper"),
  row(25, "zero", "Final Base", "Fortress Entrance", "Gatekeeper", "Zero Division holds the gate. Cut through and extract.", "Severe", false, 7, 0, 0, false, "elite"),
  row(26, "zero", "Final Base", "Security Complex", "Null", "Elite guards and tight platforms. Clear the complex.", "Severe", false, 8, 0, 0, false, "elite"),
  row(27, "zero", "Final Base", "Elite Guard Division", "Shade", "The fastest troops in the syndicate. Keep moving.", "Severe", false, 9, 0, 0, false, "elite"),
  row(28, "zero", "Final Base", "Heavy Weapons Base", "Siege", "Heavies and explosives. Break the battery and leave.", "Severe", false, 9, 0, 0, false, "heavy"),
  row(29, "zero", "Final Base", "Final Defense", "The Architect", "Last defense before the arena. Clear every guard.", "Severe", false, 10, 0, 0, false, "elite"),
  row(30, "zero", "Final Base", "Commander Zero", "Commander Zero", "Three phases. No purchase required. Finish the campaign.", "Boss", true, 6, 0, 0, false, "elite"),
];

export function levelDef(n: number) {
  return LEVELS[n - 1] ?? null;
}

export function buildLevel(n: number): BuiltMission {
  const spec = LEVELS[n - 1] ?? LEVELS[0]!;
  const adv = buildAdventure(spec.n);
  return {
    id: spec.theme,
    theme: spec.theme,
    title: spec.name,
    blurb: spec.blurb,
    difficulty: spec.difficulty,
    killGoal: Math.max(1, adv.spawns.length),
    bossName: spec.villain.toUpperCase(),
    bossHp: 160 + spec.n * 14,
    gensNeed: 0,
    antsNeed: 0,
    tiles: adv.tiles,
    spawns: adv.spawns,
    pickups: adv.pickups,
    belts: adv.belts,
    vents: adv.vents,
    bridges: adv.bridges,
    plats: adv.plats,
    statics: [],
    level: spec.n,
    wantsBoss: true,
    extract: false,
    extractCol: 114,
    depotNeed: false,
    bossAt: adv.bossAt,
    bossStyle: adv.bossStyle,
    startRow: adv.startRow,
    tease: adv.tease,
    decks: adv.decks,
  };
}
