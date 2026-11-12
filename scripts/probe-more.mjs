import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { Sim } = await server.ssrLoadModule("/src/game/sim.ts");
const { buildAdventure } = await server.ssrLoadModule("/src/game/adventure.ts");
const audio = { unlock(){},resume(){},suspend(){},update(){},cue(){},stopMusic(){},setMix(){},jump(){},land(){},step(){},dash(){},gun(){},impact(){},hurt(){},die(){},foeDie(){},foeStep(){},alert(){},pickup(){},boom(){},melee(){},swap(){},reload(){},ui(){},upgrade(){},achieve(){},currentCue(){return"menu";} };
const none = { left:false,right:false,jump:false,shoot:false,melee:false,grenade:false,dash:false };
const noEdge = { jump:false,shoot:false,reload:false,swap:false,dash:false,grenade:false };

const notes = [];
for (let n = 1; n <= 30; n++) {
  const adv = buildAdventure(n);
  const sim = new Sim(audio);
  sim.viewW = 900; sim.viewH = 380; sim.load(null, n);
  const boss = sim.foes.find(f => f.kind === "boss");
  const d = Math.hypot(boss.x - sim.player.x, boss.y - sim.player.y);
  const last = adv.pads[adv.pads.length - 1];
  const badBelt = adv.belts.filter(b => b.row === last.row && b.c1 >= last.c0 && b.c0 <= last.c1);
  const badVent = adv.vents.filter(v => v.row === last.row && v.col >= last.c0 && v.col <= last.c1);
  if (d < 900 || badBelt.length || badVent.length) notes.push(`L${n} bossDist ${Math.round(d)} beltsOnBoss ${badBelt.length} ventsOnBoss ${badVent.length} pads ${adv.pads.length}`);
}
// L29 belt
{
  const adv = buildAdventure(29);
  const sim = new Sim(audio);
  sim.viewW = 900; sim.viewH = 380; sim.load(null, 29);
  const b = adv.belts[0];
  notes.push("L29 belts " + JSON.stringify(adv.belts));
  if (b) {
    sim.player.x = ((b.c0 + b.c1) / 2) * 48;
    sim.player.y = b.row * 48 - sim.player.h;
    sim.player.vx = 0; sim.player.vy = 0; sim.player.grounded = true;
    for (let i = 0; i < 8; i++) sim.step(1/60, none, noEdge);
    const c = Math.floor((sim.player.x + sim.player.w / 2) / 48);
    const row = Math.round((sim.player.y + sim.player.h) / 48);
    notes.push(`L29 after vx=${Math.round(sim.player.vx)} g=${sim.player.grounded} c=${c} row=${row} y=${Math.round(sim.player.y)} tile=${sim.tiles[c + b.row * 120]}`);
  }
}
// spawn overlap after 1.5s
for (const n of [1, 3, 5, 8, 16, 22, 23, 28, 29, 30]) {
  const sim = new Sim(audio);
  sim.viewW = 900; sim.viewH = 380; sim.load(null, n);
  for (let i = 0; i < 90; i++) sim.step(1/60, none, noEdge);
  const p = sim.player;
  const hits = sim.foes.filter(f => f.alive && f.kind !== "boss" && f.x < p.x + p.w && f.x + f.w > p.x && f.y < p.y + p.h && f.y + f.h > p.y);
  if (hits.length) notes.push(`L${n} foe overlap at spawn ${hits.map(f=>f.kind).join(",")}`);
  const close = sim.foes.filter(f => f.alive && f.kind !== "boss").map(f => Math.round(Math.hypot(f.x-p.x, f.y-p.y)));
  notes.push(`L${n} foeDist ${close.join(",") || "none"} hp ${Math.round(p.hp)}`);
}
// real boss kill
{
  const sim = new Sim(audio);
  sim.viewW = 900; sim.viewH = 380; sim.load(null, 1);
  for (let i = 0; i < 40; i++) sim.step(1/60, none, noEdge);
  const boss = sim.foes.find(f => f.kind === "boss");
  boss.arm = 0;
  const ok = sim.strike("boss", 99999);
  let win = false;
  for (let i = 0; i < 50; i++) {
    sim.step(1/60, none, noEdge);
    if (sim.events.some(e => e.t === "win")) win = true;
  }
  notes.push(`strike ${ok} bossAlive ${boss.alive} deadT ${boss.deadT?.toFixed?.(2)} win ${win} bossDead ${sim.bossDead} stillInList ${sim.foes.includes(boss)}`);
}
// pit clean
{
  const sim = new Sim(audio);
  sim.viewW = 900; sim.viewH = 380; sim.load(null, 1);
  sim.events.length = 0;
  const seq = [];
  for (let life = 0; life < 3; life++) {
    sim.player.alive = true;
    sim.player.hp = 100;
    sim.player.y = 2300;
    sim.player.vy = 200;
    sim.deadSent = false;
    sim.events.length = 0;
    for (let i = 0; i < 90; i++) sim.step(1/60, none, noEdge);
    seq.push(sim.events.map(e => e.t + (e.lives ?? "")).join("+") || `stuck alive=${sim.player.alive} hp=${sim.player.hp} deadT=${sim.player.deadT.toFixed(2)}`);
  }
  notes.push("pit " + seq.join(" | "));
}
console.log(notes.join("\n"));
await server.close();
