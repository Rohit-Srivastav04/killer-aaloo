import {
  COLS,
  ROWS,
  T_BARREL,
  T_SOLID,
  idx,
  type EnemyKind,
  type PickupDef,
  type SpawnDef,
} from "@/game/level";

export type BossStyle = "shock" | "fire" | "plasma" | "rocket" | "burst" | "storm";

const STYLES: BossStyle[] = [
  "shock", "burst", "plasma", "rocket", "fire", "storm",
  "plasma", "shock", "fire", "burst", "plasma", "fire",
  "burst", "plasma", "rocket", "shock", "plasma", "rocket",
  "fire", "burst", "shock", "plasma", "rocket", "fire",
  "burst", "shock", "plasma", "rocket", "storm", "storm",
];

export type Deck = { row: number; c0: number; c1: number };

const LEFT = 2;
const RIGHT = 116;
const GAP = 2;

type Dir = 1 | -1;

type Beat = {
  k: "up" | "down" | "span";
  dir: Dir;
  w: number;
  rise?: 3 | 4;
  foes?: EnemyKind[];
  barrel?: boolean;
  belt?: Dir;
  vent?: boolean;
  turret?: boolean;
  lock?: boolean;
  optional?: boolean;
  note: string;
};

const up = (dir: Dir, rise: 3 | 4, w: number, note: string, extra: Partial<Beat> = {}): Beat => ({
  k: "up", dir, rise, w, note, ...extra,
});
const down = (dir: Dir, w: number, note: string, extra: Partial<Beat> = {}): Beat => ({
  k: "down", dir, w, note, ...extra,
});
const span = (dir: Dir, note: string, extra: Partial<Beat> = {}): Beat => ({
  k: "span", dir, w: 7, note, ...extra,
});

const sol = ["soldier"] as EnemyKind[];
const duo = ["soldier", "soldier"] as EnemyKind[];
const run = ["runner", "runner"] as EnemyKind[];
const sni = ["sniper"] as EnemyKind[];
const sn2 = ["sniper", "soldier"] as EnemyKind[];
const hev = ["heavy"] as EnemyKind[];
const mel = ["melee", "melee"] as EnemyKind[];
const elt = ["elite"] as EnemyKind[];
const el2 = ["elite", "elite"] as EnemyKind[];

// Each list is a different situation. Not a recycled staircase.
// up 3 = one tap (straight jump). up 4 = fast double tap (flip, long jump). down = commit off the lip.
// span = a bridge that falls if you wait. Columns may cross again only with 6+ rows of air.
type Hook = {
  w: number;
  row?: number;
  note: string;
  belt?: Dir;
  vent?: boolean;
  barrel?: boolean;
  foes?: EnemyKind[];
  turret?: boolean;
};

const HOOK: Hook[] = [
  { w: 16, row: 40, note: "TWO GUNS ON YOUR STREET. SHOOT THE BARREL OR SHOOT THEM", barrel: true, foes: duo },
  { w: 6, row: 40, note: "A LADDER. ONE JUMP, THEN A FAST DOUBLE TAP" },
  { w: 14, row: 30, note: "A LONG ROOF. THE NEXT FLOORS ARE SPANS", foes: sni },
  { w: 8, row: 12, note: "YOU START HIGH. THE WELL GOES DOWN" },
  { w: 8, row: 36, note: "CLIMB THE PEAK. THE FAR SIDE IS ALL DROPS", barrel: true, foes: sol },
  { w: 6, row: 28, note: "THREE SPANS. DON'T STAND ON THEM" },
  { w: 16, row: 40, note: "HUGE FLOORS. EVERY DOOR IS A DOUBLE TAP", foes: duo },
  { w: 12, row: 32, note: "THE FLOOR DRAGS, THEN IT DUMPS YOU", belt: -1, foes: ["melee"] },
  { w: 6, row: 40, note: "THE SHAFT TURNS BACK OVER YOUR HEAD", vent: true },
  { w: 6, row: 40, note: "SPAN, TALL JUMP, DROP. THEN AGAIN" },
  { w: 16, row: 40, note: "WIDE BASE. EVERY FLOOR ABOVE IS SMALLER" },
  { w: 8, row: 26, note: "A SPAN ONTO THE WIDE FLOOR" },
  { w: 12, row: 38, note: "CROSS THE SPAN. THEN THE TOWER IS ALL DOUBLE TAPS", foes: duo },
  { w: 5, row: 38, note: "NARROW TOWER. THE TOP TURNS BACK" },
  { w: 8, row: 18, note: "YOU ARE ABOVE THEM. DROP IN, THEN CLIMB OUT" },
  { w: 16, row: 34, note: "WIDE GALLERY. A TURRET WAITS AT THE FAR END", foes: sol, turret: true },
  { w: 6, row: 36, note: "STEPPING STONES. TOO SMALL TO CAMP" },
  { w: 8, row: 36, note: "CLIMB. THE TOP IS A SPAN. THEN THE HILL FALLS AWAY" },
  { w: 8, row: 24, note: "THE FLOOR RISES, THEN FALLS, THEN RISES" },
  { w: 6, row: 20, note: "NOTHING BUT SPANS. DON'T STOP" },
  { w: 6, row: 40, note: "NO TWO FLOORS ARE THE SAME WIDTH" },
  { w: 18, row: 28, note: "ONE LONG ROOF. THEY SEE THE WHOLE FLOOR", foes: ["sniper", "sniper"] },
  { w: 14, row: 30, note: "BARRELS ON A BELT. THEN THE FLOOR DROPS", barrel: true, belt: -1, foes: hev },
  { w: 8, row: 10, note: "YOU START IN THE SKY. THE WAY IS DOWN" },
  { w: 7, row: 38, note: "A FLOOR, A DROP, ANOTHER FLOOR" },
  { w: 8, row: 36, note: "WIDE ROOM. THE DOOR OUT IS A DOUBLE TAP", foes: ["elite", "soldier"] },
  { w: 6, row: 32, note: "DOUBLE TAP, THEN A DYING SPAN" },
  { w: 16, row: 28, note: "WIDE FLOOR. THEN IT DROPS UNDER YOU", barrel: true, foes: hev },
  { w: 16, row: 8, note: "YOU START AT THE CEILING. EVERY STEP IS DOWN", vent: true, foes: elt },
  { w: 10, row: 40, note: "FOUR TALL DOORS. THE TOP TURNS BACK OVER YOU", foes: elt },
];

const SCRIPTS: Beat[][] = [
  [
    span(1, "RUN IT. THE SPAN DIES IF YOU STAND", { lock: true }),
    up(1, 4, 7, "DOUBLE TAP. THE RIFLE IS ALREADY AIMING", { foes: sni, lock: true }),
    up(1, 3, 11, "ONE JUMP. TWO GUNS ON THIS ROOF", { foes: duo, lock: true }),
    down(1, 14, "DROP IN. RUNNERS OWN THE PIT", { foes: run, lock: true }),
    up(1, 4, 7, "DOUBLE TAP OUT. ONE JUMP LEAVES YOU IN THE PIT", { foes: elt, lock: true }),
    up(1, 3, 9, "ONE JUMP. THE ROOF KEEPS SHOOTING", { foes: duo, lock: true }),
    up(-1, 4, 8, "FOLD BACK. DOUBLE TAP. HE SEES THE PIT", { foes: sni, lock: true }),
    span(-1, "THIS SPAN HANGS OVER THE STREET. DON'T WAIT", { lock: true }),
  ],
[
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    up(1, 3, 6, "ONE JUMP", { lock: true, foes: run }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 8, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 8, lock: true }),
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: sn2 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 8, lock: true }),
    up(1, 3, 12, "ONE JUMP", { lock: true, foes: sn2 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 8, lock: true }),
    up(1, 3, 10, "ONE JUMP", { lock: true, foes: sn2 }),
  ],
  [
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: hev }),
  ],
  [
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: sol }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 7, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
  ],
  [
    up(1, 4, 16, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 14, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: sol }),
    up(1, 4, 12, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, belt: -1 }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, belt: -1 }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, belt: -1 }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, belt: -1 }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(-1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(-1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
    up(-1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, vent: true }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: sol }),
  ],
  [
    up(1, 4, 14, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 10, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: el2 }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 12, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: sn2 }),
  ],
  [
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    up(-1, 3, 14, "ONE JUMP. THE PATH TURNS BACK", { lock: true, foes: sn2 }),
    span(-1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
  ],
  [
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: el2 }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: el2 }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: el2 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: el2 }),
  ],
  [
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol, turret: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: sol, turret: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 16, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
  ],
  [
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 3, 5, "ONE JUMP", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
  ],
  [
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 12, lock: true }),
    down(1, 9, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 9, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: sni }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 3, 8, "ONE JUMP", { lock: true, foes: sni }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
  ],
  [
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
  ],
  [
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 10, "ONE JUMP", { lock: true, foes: sol }),
    up(1, 4, 14, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 6, "ONE JUMP", { lock: true, foes: sol }),
    up(1, 4, 12, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
  ],
  [
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sn2 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 16, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: sn2 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
    down(1, 12, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: sn2 }),
  ],
  [
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: sol, barrel: true, belt: -1 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 12, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run, barrel: true, belt: -1 }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run, barrel: true, belt: -1 }),
    up(1, 4, 12, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt, barrel: true, belt: -1 }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run, belt: -1 }),
  ],
  [
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: sni }),
  ],
  [
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    down(1, 8, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: sol }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: el2 }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: el2 }),
    up(1, 4, 5, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: el2 }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
  ],
  [
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    up(1, 4, 7, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: run }),
  ],
  [
    up(1, 3, 16, "ONE JUMP", { lock: true, foes: hev, barrel: true }),
    down(1, 14, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    up(1, 3, 14, "ONE JUMP", { lock: true, foes: hev, barrel: true }),
    down(1, 12, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    up(1, 3, 12, "ONE JUMP", { lock: true, foes: hev, barrel: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: hev }),
    up(1, 4, 6, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: hev }),
  ],
  [
    down(1, 14, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 12, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 14, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
    span(1, "DON'T WAIT. THE SPAN DIES", { w: 7, lock: true }),
    down(1, 10, "DROP. THE NEXT FLOOR IS LOWER", { lock: true, foes: run }),
  ],
  [
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(1, 4, 8, "DOUBLE TAP. FLIP. ONE JUMP STOPS SHORT", { lock: true, foes: elt }),
    up(-1, 3, 14, "ONE JUMP. THE PATH TURNS BACK", { lock: true, foes: el2 }),
    span(-1, "DON'T WAIT. THE SPAN DIES", { w: 8, lock: true }),
  ],

];

const TEASE = [
  "THEY SHOOT FIRST",
  "THE LADDER",
  "FLAT ROOFS",
  "THE WELL",
  "THE PEAK",
  "SPAN SHELF",
  "GIANT STEPS",
  "SAWTOOTH",
  "THE SHAFT TURNS",
  "SPIKES",
  "THE PYRAMID",
  "WIDE PLANT",
  "STREET, THEN A TOWER",
  "THE TOWER TURNS",
  "DROP, THEN CLIMB",
  "WIDE GALLERIES",
  "STEPPING STONES",
  "THE CROWN FALLS",
  "RISE AND FALL",
  "ONLY SPANS",
  "JAGGED WIDTHS",
  "TWO LONG ROOFS",
  "THE CRATER",
  "OUT OF THE SKY",
  "TWO PLATEAUS",
  "ROOM, THEN A DOOR",
  "STEEP GAPS",
  "WIDE TEETH",
  "FROM THE CEILING",
  "THE CROWN",
];

const BLURB = [
  "The first street is already shooting. One tap clears a normal roof. A fast double tap flips onto the tall ones. Don't stand on a span.",
  "A straight ladder. One jump, then a fast double tap, all the way up.",
  "Long roofs joined by dying spans. Almost flat. The rifles own the length.",
  "You start high and the well only goes down. Heavies on the way to the bottom.",
  "Climb a sharp peak. The far side is a staircase of drops.",
  "A shelf of spans, one tall step in the middle, then more spans.",
  "Four huge floors. Every door between them is a double tap.",
  "The floor drags you up, then dumps you, over and over.",
  "A shaft that turns back on itself. Double tap, then the path folds overhead.",
  "Span, tall jump, drop. The spikes repeat along the bottom.",
  "A pyramid. The bottom floor is wide. Every floor above it is smaller.",
  "Spans between the widest floors in the plant, then a drop off the end.",
  "One span off the street, then a tower of double taps.",
  "A narrow tower. At the top the path turns back over the shaft.",
  "You start above them. Drop in, then climb out higher than you began.",
  "Wide galleries with a turret at the end, then the floor steps down.",
  "Stepping stones too small to camp, with a dying span between each one.",
  "Climb to a span at the crown. Then the hill falls away to the right.",
  "The ground rises and falls like dunes. Don't commit to the wrong lip.",
  "Three rows of nothing but spans. Stop and the bridge is gone.",
  "Every floor is a different width. Wide, tiny, wide, tiny.",
  "One long roof, a span, a drop onto another long roof.",
  "A belt and barrels, then the floor drops into a crater.",
  "You spawn in the sky. The whole level is a staircase down.",
  "A short climb onto a wide floor, a drop, then another wide floor.",
  "A wide room, a tiny second-jump door, another wide room.",
  "A double tap and a dying span, repeating up a steep line.",
  "Wide floors that drop out from under you, one after another.",
  "You spawn on the ceiling. Every step is down, across a span.",
  "Four tall doors, then the top floor turns back over the tower.",
];

export function teaseFor(n: number) {
  return TEASE[n - 1] ?? TEASE[0]!;
}

type BuiltPad = Deck & {
  dir: Dir;
  foes: EnemyKind[];
  barrel: boolean;
  belt: Dir | null;
  vent: boolean;
  turret: boolean;
  note: string;
};

export function bossStyleFor(n: number) {
  return STYLES[n - 1] ?? "burst";
}

export function routeLabel(n: number) {
  return BLURB[n - 1] ?? BLURB[0]!;
}

export function buildAdventure(n: number) {
  const tiles = new Uint8Array(COLS * ROWS);
  const put = (c: number, r: number, k = T_SOLID) => {
    if (c < 1 || r < 1 || c >= COLS - 1 || r >= ROWS) return;
    tiles[idx(c, r)] = k;
  };
  const bridges: { c0: number; c1: number; row: number; t: number; gone: boolean }[] = [];
  const belts: { c0: number; c1: number; dir: Dir; row: number }[] = [];
  const vents: { col: number; row: number; phase: number; on: boolean }[] = [];
  const script = [...(SCRIPTS[n - 1] ?? SCRIPTS[0]!)];
  const pads: BuiltPad[] = [];
  const hook = HOOK[n - 1] ?? HOOK[0]!;
  const startW = hook.w;
  pads.push({
    row: hook.row ?? 40,
    c0: LEFT,
    c1: LEFT + startW - 1,
    dir: 1,
    foes: hook.foes ?? [],
    barrel: Boolean(hook.barrel),
    belt: hook.belt ?? null,
    vent: Boolean(hook.vent),
    turret: Boolean(hook.turret),
    note: hook.note,
  });
  let shape = `S${startW}`;
  let flips = 0;

  for (const beat of script) {
    const prev = pads[pads.length - 1]!;
    const placed = placeBeat(prev, beat, pads);
    if (!placed) {
      if (beat.optional) continue;
      break;
    }
    if (placed.dir !== beat.dir) flips += 1;
    pads.push(placed.pad);
    if (placed.bridge) bridges.push(placed.bridge);
    shape += placed.tag;
  }

  const last = pads[pads.length - 1]!;
  last.note = "BOSS ON THIS FLOOR. KILL HIM.";
  last.barrel = false;
  last.belt = null;
  last.vent = false;
  last.turret = false;
  last.foes = [];
  widen(last, pads.slice(0, -1), n % 6 === 0 ? 14 : 11);
  pads.forEach((pad, i) => {
    if (i === 0 || i === pads.length - 1) return;
    const width = pad.c1 - pad.c0 + 1;
    if (pad.foes.length === 0) pad.foes = [n >= 20 ? "elite" : n >= 8 ? "soldier" : "runner"];
    if (width >= 10 && pad.foes.length < 2) pad.foes = [...pad.foes, n >= 16 ? "heavy" : "soldier"];
    if (width >= 14 && n >= 10 && pad.foes.length < 3) pad.foes = [...pad.foes, "sniper"];
  });

  for (const pad of pads) {
    for (let c = pad.c0; c <= pad.c1; c++) put(c, pad.row);
    if (pad.barrel && pad.c1 - pad.c0 >= 8) {
      const col = pad.c0 + Math.floor((pad.c1 - pad.c0) / 2);
      put(col, pad.row - 1, T_BARREL);
    }
    if (pad.belt && pad.c1 - pad.c0 >= 6) {
      belts.push({ c0: pad.c0 + 1, c1: Math.max(pad.c0 + 1, pad.c1 - 3), dir: pad.belt, row: pad.row });
    }
    if (pad.vent) vents.push({ col: pad.c0 + Math.floor((pad.c1 - pad.c0) / 2), row: pad.row, phase: pads.indexOf(pad), on: false });
  }
  for (const br of bridges) {
    for (let c = br.c0; c <= br.c1; c++) put(c, br.row, T_SOLID);
  }
  // Back wall. The start deck begins on column 2, and the hero spawns on it.
  // A step left used to drop straight into the void and burn a life.
  const home = pads[0]!;
  put(1, home.row);
  for (let r = home.row - 4; r < home.row; r++) put(1, r);

  const top = pads[pads.length - 1]!;
  const bossCol = clampCol(Math.floor((top.c0 + top.c1) / 2), top);
  const spawns: SpawnDef[] = [];
  pads.forEach((pad, i) => {
    if (i === pads.length - 1) return;
    const mid = pad.c0 + Math.floor((pad.c1 - pad.c0) / 2);
    pad.foes.forEach((kind, k) => {
      let col = i === 0 ? clampCol(pad.c0 + 5 + k, pad) : foeCol(pad, k);
      if (pad.barrel && col === mid) col = clampCol(col + 2, pad);
      spawns.push({ col, kind, band: "low", row: pad.row });
    });
    if (pad.turret) {
      const col = i === 0 ? clampCol(pad.c0 + 8, pad) : foeCol(pad, 2);
      spawns.push({ col, kind: "turret", band: "low", row: pad.row });
    }
  });

  const pickups: PickupDef[] = [];
  const hpPad = pads[Math.max(1, Math.min(pads.length - 2, Math.floor(pads.length * 0.62)))] ?? pads[1]!;
  pickups.push({ col: clampCol(hpPad.dir > 0 ? hpPad.c0 + 2 : hpPad.c1 - 2, hpPad), kind: "health", band: "low", row: hpPad.row });
  if (n > 12) {
    const mid = pads[Math.max(1, Math.min(pads.length - 2, Math.floor(pads.length * 0.38)))]!;
    pickups.push({ col: clampCol(mid.dir > 0 ? mid.c1 - 2 : mid.c0 + 2, mid), kind: "grenade", band: "low", row: mid.row });
  }

  return {
    tiles,
    spawns,
    pickups,
    bossAt: { col: bossCol, row: top.row },
    bossStyle: bossStyleFor(n),
    startRow: pads[0]!.row,
    bridges,
    plats: [] as { x: number; y: number; w: number; h: number; vx: number; minX: number; maxX: number }[],
    belts,
    vents,
    pads: pads.map(({ row, c0, c1 }) => ({ row, c0, c1 })),
    decks: pads.map(({ row, c0, c1, note }) => ({ row, c0, c1, note })),
    tease: TEASE[n - 1] ?? TEASE[0]!,
    shape,
    flips,
  };
}

function foeCol(pad: BuiltPad, k: number) {
  if (pad.dir > 0) return clampCol(pad.c1 - 1 - (k % 2), pad);
  return clampCol(pad.c0 + 1 + (k % 2), pad);
}

function placeBeat(prev: BuiltPad, beat: Beat, pads: BuiltPad[]) {
  const alts: Dir[] = beat.lock ? [beat.dir] : [beat.dir, beat.dir === 1 ? -1 : 1];
  const rises: Array<3 | 4> = beat.k === "up" ? (beat.lock ? [beat.rise ?? 3] : beat.rise === 4 ? [4, 3] : [3]) : [3];
  const widths = beat.lock
    ? [beat.w, Math.max(5, beat.w - 2)]
    : [beat.w, Math.max(beat.k === "span" ? 6 : 5, beat.w - 2), Math.max(5, beat.w - 4)];
  for (const rise of rises) {
    for (const w of widths) {
      for (const dir of alts) {
        const made = make(prev, beat.k, dir, w, rise, pads);
        if (!made) continue;
        const pad: BuiltPad = {
          ...made.pad,
          dir,
          foes: beat.foes ?? [],
          barrel: Boolean(beat.barrel),
          belt: beat.belt ?? null,
          vent: Boolean(beat.vent),
          turret: Boolean(beat.turret),
          note: beat.note,
        };
        const tag = `${dir > 0 ? "R" : "L"}${beat.k === "span" ? "b" : beat.k === "down" ? "d" : rise}`;
        return { pad, dir, bridge: made.bridge, tag };
      }
    }
  }
  return null;
}

function make(prev: Deck, k: Beat["k"], dir: Dir, w: number, rise: 3 | 4, pads: Deck[]) {
  if (k === "span") {
    const pad = at(prev, dir, w, 0, 5, pads);
    if (!pad) return null;
    const b0 = dir > 0 ? prev.c1 + 1 : pad.c1 + 1;
    const b1 = dir > 0 ? pad.c0 - 1 : prev.c0 - 1;
    return { pad, bridge: { c0: Math.min(b0, b1), c1: Math.max(b0, b1), row: prev.row, t: 0, gone: false } };
  }
  if (k === "down") {
    const pad = at(prev, dir, w, 2, GAP, pads);
    return pad ? { pad, bridge: null } : null;
  }
  const pad = at(prev, dir, w, -rise, GAP, pads);
  return pad ? { pad, bridge: null } : null;
}

function at(prev: Deck, dir: Dir, w: number, rowDelta: number, hole: number, pads: Deck[]): Deck | null {
  const row = prev.row + rowDelta;
  if (row < 6 || row > 42) return null;
  const c0 = dir > 0 ? prev.c1 + 1 + hole : prev.c0 - hole - w;
  if (c0 < LEFT || c0 + w - 1 > RIGHT) return null;
  const pad: Deck = { row, c0, c1: c0 + w - 1 };
  if (blocked(pads, prev, pad)) return null;
  return pad;
}

function blocked(pads: Deck[], prev: Deck, pad: Deck) {
  const goingRight = pad.c0 >= prev.c1;
  const arcLo = goingRight ? prev.c1 - 1 : pad.c0;
  const arcHi = goingRight ? pad.c1 : prev.c0 + 1;
  const top = Math.min(prev.row, pad.row);
  for (const o of pads) {
    if (o === prev) continue;
    const shares = pad.c1 >= o.c0 && pad.c0 <= o.c1;
    const gap = pad.c0 > o.c1 ? pad.c0 - o.c1 - 1 : o.c0 - pad.c1 - 1;
    const delta = Math.abs(pad.row - o.row);
    if (shares && delta < 6) return true;
    if (delta === 0 && gap < 5) return true;
    if (gap < 2 && delta < 6) return true;
    if (o.c1 < arcLo || o.c0 > arcHi) continue;
    const above = top - o.row;
    if (above > 0 && above < 5) return true;
  }
  return false;
}

function widen(pad: BuiltPad, pads: Deck[], minW: number) {
  while (pad.c1 - pad.c0 + 1 < minW && pad.c1 < RIGHT) {
    const trial = { row: pad.row, c0: pad.c0, c1: pad.c1 + 1 };
    if (blocked(pads, pad, trial)) break;
    pad.c1 += 1;
  }
  while (pad.c1 - pad.c0 + 1 < minW && pad.c0 > LEFT) {
    const trial = { row: pad.row, c0: pad.c0 - 1, c1: pad.c1 };
    if (blocked(pads, pad, trial)) break;
    pad.c0 -= 1;
  }
}

function clampCol(c: number, pad: Deck) {
  return Math.max(pad.c0 + 1, Math.min(pad.c1 - 1, c));
}
