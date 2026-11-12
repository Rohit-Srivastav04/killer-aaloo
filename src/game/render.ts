import {
  COLS,
  EXIT_COL,
  FLOOR,
  ROWS,
  TILE,
  T_BARREL,
  T_CRATE,
  T_EMPTY,
  T_ONEWAY,
  T_SOLID,
  WORLD_H,
  WORLD_W,
  tileAt,
} from "@/game/level";
import type { Sim } from "@/game/sim";
import { playerPose } from "@/game/anim";
import { drawAnchored, drawSheet, type Sheet, type SpriteBook } from "@/game/sprites";

const BRICK = ["#6d5344", "#7a5d4b", "#624a3d", "#856553"];

let lobbyWide: HTMLImageElement | null = null;
let lobbyTall: HTMLImageElement | null = null;

function lobbyImage(tall: boolean) {
  if (typeof Image === "undefined") return null;
  if (tall) {
    if (!lobbyTall) {
      lobbyTall = new Image();
      lobbyTall.src = "/lobby-bay-tall.jpg";
    }
    return lobbyTall;
  }
  if (!lobbyWide) {
    lobbyWide = new Image();
    lobbyWide.src = "/lobby-bay.jpg";
  }
  return lobbyWide;
}

function drawLobbyBay(ctx: CanvasRenderingContext2D, sim: Sim) {
  const w = sim.viewW;
  const h = sim.viewH;
  ctx.fillStyle = "#120c09";
  ctx.fillRect(0, 0, w, h);
  const tall = w / Math.max(1, h) < 0.92;
  const img = lobbyImage(tall);
  if (img && img.complete && img.naturalWidth > 0) {
    const ir = img.naturalWidth / img.naturalHeight;
    const vr = w / Math.max(1, h);
    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;
    if (ir > vr) {
      dh = h;
      dw = h * ir;
      dx = (w - dw) * (tall ? 0.5 : 0.18);
      dy = 0;
    } else {
      dw = w;
      dh = w / ir;
      dx = 0;
      dy = (h - dh) * (tall ? 0.38 : 0.62);
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.2);
  top.addColorStop(0, "rgba(8,5,3,0.62)");
  top.addColorStop(1, "rgba(8,5,3,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.2);
  const bot = ctx.createLinearGradient(0, h * 0.78, 0, h);
  bot.addColorStop(0, "rgba(8,5,3,0)");
  bot.addColorStop(1, "rgba(8,5,3,0.5)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
}

function hash(c: number, r: number) {
  return (c * 17 + r * 31) & 3;
}

export function render(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  sprites: SpriteBook,
  cssW: number,
  cssH: number,
  dpr: number,
) {
  const { viewW, viewH } = sim;
  const shake = sim.shake;
  const ox = shake ? Math.sin(sim.time * 48) * shake : 0;
  const oy = shake ? Math.cos(sim.time * 41) * shake * 0.6 : 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.imageSmoothingEnabled = true;
  const sx = cssW / viewW;
  const sy = cssH / viewH;
  ctx.scale(sx, sy);

  if (sim.lobby) {
    drawLobbyBay(ctx, sim);
    return;
  }

  drawSky(ctx, sim, sprites, viewW, viewH);
  ctx.save();
  ctx.translate(-Math.round(sim.camX) + ox, -Math.round(sim.camY) + oy);
  drawPits(ctx, sim);
  drawTiles(ctx, sim, sprites);
  drawDressing(ctx, sim);
  drawHazards(ctx, sim);
  drawDoor(ctx, sim, sprites);
  drawDrops(ctx, sim, sprites);
  drawActors(ctx, sim, sprites);
  drawShots(ctx, sim, sprites);
  drawFx(ctx, sim, sprites);
  ctx.restore();
  if (sim.showPoster) drawPoster(ctx, sim, sprites);
}

function pane(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  camX: number,
  factor: number,
  viewW: number,
  viewH: number,
  cover: number,
  yBias: number,
) {
  if (!img) return;
  const dh = viewH * cover;
  const dw = dh * (img.width / img.height);
  const shift = -((camX * factor) % dw);
  for (let x = shift - dw; x < viewW + dw; x += dw) {
    ctx.drawImage(img, x, viewH - dh + yBias, dw, dh);
  }
}

function drawSky(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook, viewW: number, viewH: number) {
  if (sim.theme !== "warehouse") {
    drawThemeSky(ctx, sim, viewW, viewH);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, "#f0b06a");
  g.addColorStop(0.45, "#e4876a");
  g.addColorStop(1, "#6f8ea4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);
  pane(ctx, sprites.get("sky")?.img ?? null, sim.camX, 0.05, viewW, viewH, 1.05, 0);
  pane(ctx, sprites.get("far")?.img ?? null, sim.camX, 0.16, viewW, viewH, 0.78, viewH * 0.08);
  pane(ctx, sprites.get("mid")?.img ?? null, sim.camX, 0.32, viewW, viewH, 0.92, viewH * 0.06);
  pane(ctx, sprites.get("near")?.img ?? null, sim.camX, 0.48, viewW, viewH, 0.55, -viewH * 0.02);
  if (!sprites.get("far")) {
    ctx.fillStyle = "rgba(70, 48, 42, 0.45)";
    for (let i = 0; i < 8; i++) {
      const x = ((i * 220 - sim.camX * 0.2) % (viewW + 240)) - 80;
      ctx.fillRect(x, viewH * 0.42, 90 + (i % 3) * 30, viewH * 0.38);
      ctx.fillStyle = "rgba(255, 196, 120, 0.35)";
      ctx.fillRect(x + 16, viewH * 0.5, 14, 18);
      ctx.fillStyle = "rgba(70, 48, 42, 0.45)";
    }
  }
}

function drawTiles(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const c0 = Math.max(0, Math.floor(sim.camX / TILE) - 1);
  const c1 = Math.min(COLS - 1, Math.floor((sim.camX + sim.viewW) / TILE) + 1);
  const r0 = Math.max(0, Math.floor(sim.camY / TILE) - 1);
  const r1 = Math.min(ROWS - 1, Math.floor((sim.camY + sim.viewH) / TILE) + 2);
  const props = sprites.get("props");
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const k = tileAt(sim.tiles, c, r);
      if (k === T_EMPTY) continue;
      const x = c * TILE;
      const y = r * TILE;
      if (k === T_SOLID) {
        if (isBridge(sim, c, r)) drawPlank(ctx, x, y, hash(c, r), sim);
        else if (sim.theme === "warehouse") drawBrick(ctx, x, y, surfaceRow(sim, c, r), hash(c, r));
        else drawThemeBrick(ctx, x, y, surfaceRow(sim, c, r), hash(c, r), sim.theme, sim.levelNum > 0 ? false : stepRun(sim, c, r), sim.levelNum);
      } else if (k === T_ONEWAY) drawGrate(ctx, x, y, sim.theme);
      else if (k === T_CRATE) {
        if (props) drawSheet(ctx, props, 0, x - 2, y - 10, TILE + 4, TILE + 8);
        else drawCrate(ctx, x, y);
      } else if (k === T_BARREL) {
        if (props) drawSheet(ctx, props, 1, x + 4, y - 6, TILE - 8, TILE + 4);
        else drawBarrel(ctx, x, y);
      }
    }
  }
  if (sim.camY + sim.viewH > WORLD_H) {
    ctx.fillStyle = sim.theme === "warehouse" ? "#241812" : pitColor(sim.theme);
    ctx.fillRect(0, WORLD_H, WORLD_W, 400);
  }
  drawRooftops(ctx, sim);
}

function surfaceRow(sim: Sim, c: number, r: number) {
  return r === 0 || tileAt(sim.tiles, c, r - 1) === T_EMPTY;
}

function stepRun(sim: Sim, c: number, r: number) {
  if (!surfaceRow(sim, c, r) || tileAt(sim.tiles, c, r) !== T_SOLID) return false;
  let n = 0;
  for (let i = c; i >= c - 3 && i >= 0; i--) {
    if (tileAt(sim.tiles, i, r) === T_SOLID && surfaceRow(sim, i, r)) n++;
    else break;
  }
  for (let i = c + 1; i <= c + 3 && i < COLS; i++) {
    if (tileAt(sim.tiles, i, r) === T_SOLID && surfaceRow(sim, i, r)) n++;
    else break;
  }
  return n > 0 && n < 4;
}

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, cap: boolean, n: number) {
  ctx.fillStyle = BRICK[n] ?? "#6d5344";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(30,16,10,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  ctx.beginPath();
  ctx.moveTo(x, y + TILE / 2);
  ctx.lineTo(x + TILE, y + TILE / 2);
  ctx.moveTo(x + (n % 2 === 0 ? 16 : 32), y);
  ctx.lineTo(x + (n % 2 === 0 ? 16 : 32), y + TILE / 2);
  ctx.stroke();
  if (cap) {
    ctx.fillStyle = "#c4a07a";
    ctx.fillRect(x, y, TILE, 7);
    ctx.fillStyle = "#8d6b52";
    ctx.fillRect(x, y + 7, TILE, 3);
  }
}

function drawGrate(ctx: CanvasRenderingContext2D, x: number, y: number, theme = "warehouse") {
  if (theme === "city" || theme === "base" || theme === "zero" || theme === "desert") {
    ctx.fillStyle = theme === "desert" ? "#e4c48a" : theme === "zero" ? "#4a3838" : theme === "base" ? "#9aa184" : "#d7c4a8";
    ctx.fillRect(x, y, TILE, 14);
    ctx.fillStyle = theme === "city" ? "#8a4638" : theme === "desert" ? "#a87848" : "#5c564c";
    ctx.fillRect(x, y + 12, TILE, 8);
    return;
  }
  const metal = theme === "factory" ? "#8a8070" : "#5c6770";
  ctx.fillStyle = metal;
  ctx.fillRect(x, y, TILE, 12);
  ctx.fillStyle = "#aeb8c2";
  ctx.fillRect(x, y, TILE, 4);
  ctx.fillStyle = "#3c444c";
  for (let i = 6; i < TILE; i += 8) ctx.fillRect(x + i, y + 4, 2, 8);
  ctx.fillStyle = "#6a7580";
  ctx.fillRect(x + 6, y + 12, 4, 16);
  ctx.fillRect(x + TILE - 10, y + 12, 4, 16);
}

function drawRooftops(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (sim.theme === "warehouse") return;
  const c0 = Math.max(0, Math.floor(sim.camX / TILE) - 1);
  const c1 = Math.min(COLS - 1, Math.floor((sim.camX + sim.viewW) / TILE) + 1);
  const r0 = Math.max(0, Math.floor(sim.camY / TILE) - 1);
  const r1 = Math.min(ROWS - 1, Math.floor((sim.camY + sim.viewH) / TILE) + 2);
  for (let c = c0; c <= c1; c++) {
    for (let r = r0; r <= r1; r++) {
      if (tileAt(sim.tiles, c, r) !== T_ONEWAY) continue;
      if (r > 0 && tileAt(sim.tiles, c, r - 1) === T_ONEWAY) continue;
      const top = r * TILE + 16;
      let bottom = top;
      const limit = Math.min(ROWS, r + 6);
      for (let rr = r + 1; rr < limit; rr++) {
        const k = tileAt(sim.tiles, c, rr);
        if (k !== T_EMPTY) break;
        bottom = (rr + 1) * TILE;
      }
      if (bottom - top < 28) continue;
      drawBuildingColumn(ctx, c * TILE, top, bottom - top, c, r, sim.theme);
    }
  }
}

function drawBuildingColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  c: number,
  r: number,
  theme: string,
) {
  const city = theme === "city" || theme === "zero";
  const pal = city
    ? ["#8d4a3a", "#a85c42", "#7a4034", "#b46848"]
    : theme === "desert"
      ? ["#d2a86a", "#c49858", "#e0bc78", "#b88a4c"]
      : theme === "factory"
        ? ["#6a7078", "#5c6268", "#7a8086", "#545a60"]
        : ["#6e735c", "#7d8268", "#626856", "#8a9074"];
  ctx.fillStyle = pal[(c + r) % pal.length] ?? pal[0]!;
  ctx.fillRect(x, y, TILE, h);
  ctx.strokeStyle = city ? "rgba(40,16,12,0.45)" : "rgba(30,24,16,0.35)";
  ctx.lineWidth = 1;
  const rows = Math.floor(h / (TILE / 2));
  for (let i = 1; i < rows; i++) {
    const yy = y + (i * TILE) / 2;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + TILE, yy);
    ctx.stroke();
  }
  const stories = Math.floor(h / TILE);
  for (let s = 0; s < stories; s++) {
    if ((c + s) % 2 === 0) continue;
    const wy = y + 10 + s * TILE;
    if (wy + 22 > y + h) break;
    ctx.fillStyle = theme === "desert" ? "#3a2414" : "#14181e";
    ctx.fillRect(x + 10, wy, TILE - 20, 22);
    ctx.strokeStyle = theme === "desert" ? "#f0d7a4" : "#cbb59a";
    ctx.strokeRect(x + 10.5, wy + 0.5, TILE - 21, 21);
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2, wy);
    ctx.lineTo(x + TILE / 2, wy + 22);
    ctx.moveTo(x + 10, wy + 11);
    ctx.lineTo(x + TILE - 10, wy + 11);
    ctx.stroke();
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#b8884e";
  ctx.fillRect(x + 4, y + 6, TILE - 8, TILE - 8);
  ctx.strokeStyle = "#6b4a28";
  ctx.strokeRect(x + 4.5, y + 6.5, TILE - 9, TILE - 9);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 6);
  ctx.lineTo(x + TILE - 4, y + TILE - 2);
  ctx.moveTo(x + TILE - 4, y + 6);
  ctx.lineTo(x + 4, y + TILE - 2);
  ctx.stroke();
}

function drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#8e2e2e";
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, y + TILE / 2, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d7d2c8";
  ctx.fillRect(x + 12, y + 16, TILE - 24, 5);
  ctx.fillRect(x + 12, y + 28, TILE - 24, 5);
}

function drawDoor(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  if (sim.levelNum > 0) return;
  const x = EXIT_COL * TILE - 6;
  const y = FLOOR * TILE;
  const door = sprites.get("door");
  if (door) drawAnchored(ctx, door, 0, x + 28, y, 168, 1);
  else {
    ctx.fillStyle = sim.exitOpen ? "#3f6b45" : "#5a4038";
    ctx.fillRect(x, y - 150, 54, 150);
    ctx.fillStyle = "#d8a13a";
    ctx.fillRect(x, y - 150, 54, 10);
  }
  ctx.fillStyle = sim.exitOpen ? "#7dff9a" : "#ff5a4a";
  ctx.beginPath();
  ctx.arc(x + 40, y - 78, 5, 0, Math.PI * 2);
  ctx.fill();
  if (!sim.exitOpen) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 12px 'Russo One', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(!sim.missionId && sim.kills >= sim.killGoal ? "ZERO" : "LOCKED", x + 28, y - 160);
  }
}

function drawDrops(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const props = sprites.get("props");
  const picks = sprites.get("pickups");
  for (const d of sim.drops) {
    if (!d.alive) continue;
    if (d.x < sim.camX - 40 || d.x > sim.camX + sim.viewW + 40) continue;
    const bob = d.y;
    if (d.kind === "coin" && picks) drawAnchored(ctx, picks, 0, d.x, bob, 28, 1);
    else if (d.kind === "grenade" && picks) drawAnchored(ctx, picks, 1, d.x, bob, 30, 1);
    else if ((d.kind === "rifle" || d.kind === "rifleAmmo") && picks) drawAnchored(ctx, picks, 3, d.x, bob, d.kind === "rifle" ? 40 : 32, 1);
    else if ((d.kind === "pistolAmmo" || d.kind === "shells") && props) drawAnchored(ctx, props, 3, d.x, bob, 30, 1);
    else if (d.kind === "health" && props) drawAnchored(ctx, props, 2, d.x, bob, 32, 1);
    else if (d.kind === "shotgun") drawShotgunIcon(ctx, d.x, bob);
    else {
      ctx.fillStyle = "#ffd56a";
      ctx.fillRect(d.x - 8, bob - 16, 16, 16);
    }
  }
  for (const n of sim.nades) {
    if (!n.alive) continue;
    if (picks) drawAnchored(ctx, picks, 1, n.x, n.y, 22, n.vx < 0 ? -1 : 1);
    else {
      ctx.fillStyle = "#6a7a3a";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawShotgunIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a32";
  ctx.fillRect(-16, -18, 28, 6);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(-6, -16, 22, 4);
  ctx.fillStyle = "#d7b15a";
  ctx.fillRect(-18, -14, 6, 8);
  ctx.restore();
}

function drawActors(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  if (!sim.lobby) {
    for (const f of sim.foes) drawFoe(ctx, sim, sprites, f);
  }
  drawPlayer(ctx, sim, sprites);
}

function drawPoster(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const sheet = sprites.get("playerIdle");
  if (!sheet) return;
  ctx.save();
  if (sim.posterFilter !== "none") ctx.filter = sim.posterFilter;
  drawRig(ctx, sheet, Math.floor(sim.time * 3) % 4, sim.viewW * 0.22, sim.viewH * 0.78, 250, 1, {
    lean: 0,
    sx: 1,
    sy: 1,
    bob: Math.sin(sim.time * 2) * 1.2,
    kick: 0,
    flash: 0,
    alpha: 1,
    spin: 0,
    overlay: null,
    overlayFrame: 0,
    gun: null,
  });
  ctx.restore();
  ctx.fillStyle = sim.posterAccent;
  ctx.fillRect(sim.viewW * 0.22 - 28, sim.viewH * 0.78 - 168, 56, 6);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = "rgba(20,12,8,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y, w, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const p = sim.player;
  if (!p.alive && p.deadT > 0.95) return;
  const pose = playerPose(p, sim.time);
  const gy = shadowFloor(sim, p.x + p.w / 2, p.y + p.h);
  const drop = Math.max(0, gy - (p.y + p.h));
  ctx.save();
  ctx.globalAlpha = Math.max(0.12, 0.32 - drop / 520);
  shadow(ctx, p.x + p.w / 2, gy, Math.max(8, 18 - drop * 0.02));
  ctx.restore();
  const sheet = sprites.get(pose.sheet);
  const upper = pose.overlay ? sprites.get("playerShoot") : null;
  const gun = pose.muzzle ? sprites.get("muzzle") : null;
  const height = 98;
  const rig = {
    lean: pose.lean,
    sx: pose.sx,
    sy: pose.sy,
    bob: pose.bob,
    kick: pose.kick,
    flash: pose.flash,
    alpha: pose.alpha,
    spin: pose.spin,
    overlay: upper,
    overlayFrame: pose.overlayFrame,
    gun: null as Sheet | null,
  };
  ctx.save();
  if (sim.loadout.filter !== "none") ctx.filter = sim.loadout.filter;
  if (sheet && pose.spin < -0.45 && pose.spin > -5.9) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    drawRig(ctx, sheet, pose.frame, p.x + p.w / 2, p.y + p.h + 2, height, p.facing, { ...rig, spin: pose.spin * 0.62, overlay: null });
    ctx.restore();
  }
  if (sheet) {
    drawRig(ctx, sheet, pose.frame, p.x + p.w / 2, p.y + p.h + 2, height, p.facing, {
      ...rig,
      gun,
    });
  } else bean(ctx, "player", p.x + p.w / 2, p.y + p.h, 56, p.facing, pose.frame, pose.sheet);
  ctx.restore();
  if (pose.muzzle) {
    const mz = gun;
    const ang = pose.aim;
    const mx = p.x + p.w / 2 + Math.cos(ang) * (p.w * 0.55 + 6);
    const my = p.y + p.h * 0.4 + Math.sin(ang) * 10;
    if (mz) {
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      drawSheet(ctx, mz, Math.floor(sim.time * 24) % 4, 0, -14, 34, 28);
      ctx.restore();
    }
  }
}

function shadowFloor(sim: Sim, x: number, feet: number) {
  const c = Math.max(0, Math.min(COLS - 1, Math.floor(x / TILE)));
  let r = Math.max(0, Math.floor(feet / TILE));
  if (feet > 0 && Math.abs(feet / TILE - r) < 0.04) r += 1;
  for (let i = r; i < ROWS; i++) {
    const k = tileAt(sim.tiles, c, i);
    if (k === T_SOLID || k === T_ONEWAY || k === T_CRATE || k === T_BARREL) return i * TILE;
  }
  return feet;
}

function drawFoe(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  sprites: SpriteBook,
  f: Sim["foes"][number],
) {
  if (f.kind === "generator" || f.kind === "antenna" || f.kind === "depot" || f.kind === "turret") {
    if (f.alive) shadow(ctx, f.x + f.w / 2, f.y + f.h, f.w * 0.55);
    drawMachine(ctx, f, sim.time);
  } else {
  const key = f.kind === "boss" ? "boss" : f.kind === "heavy" ? "heavy" : f.kind === "melee" ? "melee" : "soldier";
  const sheet = sprites.get(key);
  const h = Math.round(f.h * (192 / 156));
  const moving = f.alive && f.grounded && Math.abs(f.vx) > 14;
  let frame = 0;
  if (!f.alive) frame = Math.min(3, Math.floor(f.deadT * 8));
  else if (!f.grounded) frame = 1;
  else if (f.flash > 0) frame = 2;
  else if (moving) frame = Math.floor(f.gait * 4) % 4;
  else frame = Math.floor(sim.time * (f.kind === "heavy" || f.kind === "boss" ? 2.2 : 3.2)) % 4;
  const lean = !f.alive ? 0 : moving ? (f.kind === "melee" || f.kind === "runner" ? 0.11 : f.kind === "heavy" ? 0.035 : f.kind === "boss" ? 0.03 : 0.06) : 0;
  const bob = moving ? Math.sin(f.gait * Math.PI * 2) * (f.kind === "heavy" || f.kind === "boss" ? 0.7 : 1.35) : Math.sin(sim.time * 2.1) * 0.45;
  const sy = 1 - (f.hurtT > 0 ? 0.05 : 0) + (!f.grounded && f.alive ? 0.04 : 0);
  const tint =
    f.style === "shock" ? "hue-rotate(175deg) saturate(1.4)" : f.style === "fire" ? "hue-rotate(-18deg) saturate(1.6)" : f.style === "plasma" ? "hue-rotate(80deg) saturate(1.4)" : f.style === "rocket" ? "hue-rotate(20deg) saturate(1.35)" : f.style === "storm" ? "hue-rotate(200deg) saturate(1.3)" : f.kind === "runner" ? "hue-rotate(195deg) saturate(1.25)" : f.kind === "elite" ? "hue-rotate(28deg) saturate(1.4) brightness(1.08)" : f.kind === "sniper" ? "hue-rotate(78deg) saturate(0.75)" : "none";
  if (f.alive) shadow(ctx, f.x + f.w / 2, f.y + f.h, f.w * 0.55);
  ctx.save();
  ctx.filter = tint;
  if (!f.alive) {
    ctx.globalAlpha = Math.max(0, 1 - f.deadT * 1.4);
    ctx.translate(f.x + f.w / 2, f.y + f.h);
    ctx.rotate(f.deadT * f.facing * 1.15);
    ctx.translate(-(f.x + f.w / 2), -(f.y + f.h));
  }
  if (sheet) {
    drawRig(ctx, sheet, frame, f.x + f.w / 2, f.y + f.h + 2, h, f.facing, {
      lean,
      sx: 1 / sy,
      sy,
      bob,
      kick: f.flash > 0 ? (f.kind === "boss" ? 5 : f.kind === "heavy" ? 2.2 : 3.2) : f.hurtT > 0 ? 2 : 0,
      flash: f.hurtT > 0 ? 0.62 : 0,
      alpha: 1,
      spin: 0,
      overlay: null,
      overlayFrame: 0,
      gun: null,
    });
  } else bean(ctx, f.kind, f.x + f.w / 2, f.y + f.h, f.h, f.facing, frame, "run");
  ctx.restore();
  }
  if (f.alive && f.hp < f.maxHp) {
    const machine = f.kind === "turret" || f.kind === "generator" || f.kind === "antenna" || f.kind === "depot";
    const drawH = machine ? f.h : Math.round(f.h * (192 / 156));
    const head = machine ? f.y : f.y + f.h + 2 - drawH * (174 / 192);
    const bw = f.kind === "boss" ? 70 : 28;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(f.x + f.w / 2 - bw / 2, head - 8, bw, 4);
    ctx.fillStyle = f.kind === "boss" ? "#ff5a4a" : "#ffd56a";
    ctx.fillRect(f.x + f.w / 2 - bw / 2, head - 8, bw * Math.max(0, f.hp / f.maxHp), 4);
  }
  if (f.flash > 0) {
    const mz = sprites.get("muzzle");
    const gx = f.x + f.w / 2 + f.facing * (f.kind === "boss" ? 48 : 30);
    const gy = f.y + (f.kind === "boss" ? 36 : 20);
    if (mz) {
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(f.facing > 0 ? 0 : Math.PI);
      drawSheet(ctx, mz, 1, 0, -12, f.kind === "boss" ? 40 : 24, f.kind === "boss" ? 32 : 20);
      ctx.restore();
    }
  }
}

const RIG = 320;
let rigCanvas: HTMLCanvasElement | null = null;

function rigContext() {
  if (!rigCanvas) {
    rigCanvas = document.createElement("canvas");
    rigCanvas.width = RIG;
    rigCanvas.height = RIG;
  }
  const g = rigCanvas.getContext("2d");
  if (!g) return null;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, RIG, RIG);
  return g;
}

function drawRig(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  feetX: number,
  feetY: number,
  height: number,
  facing: number,
  rig: {
    lean: number;
    sx: number;
    sy: number;
    bob: number;
    kick: number;
    flash: number;
    alpha: number;
    spin: number;
    overlay: Sheet | null;
    overlayFrame: number;
    gun: Sheet | null;
  },
) {
  const g = rigContext();
  if (!g || !rigCanvas) {
    drawAnchored(ctx, sheet, frame, feetX, feetY, height, facing);
    return;
  }
  const fw = sheet.img.width / sheet.cols;
  const fh = sheet.img.height / sheet.rows;
  const dw = height * (fw / fh);
  const top = -height * (174 / 192);
  const ox = RIG / 2;
  const oy = RIG - 12;
  g.save();
  g.translate(ox, oy);
  g.scale(facing < 0 ? -1 : 1, 1);
  g.rotate(rig.lean);
  g.translate(-rig.kick, rig.bob);
  if (rig.spin) {
    const pivot = top + height * 0.42;
    g.translate(0, pivot);
    g.rotate(rig.spin);
    g.translate(0, -pivot);
  }
  g.scale(rig.sx, rig.sy);
  drawSheet(g, sheet, frame, -dw / 2, top, dw, height);
  if (rig.gun) {
    const mx = dw * 0.42;
    const my = top + height * 0.4;
    g.save();
    g.translate(mx, my);
    drawSheet(g, rig.gun, 1, -8, -height * 0.12, height * 0.34, height * 0.26);
    g.restore();
  }
  if (rig.overlay) {
    g.save();
    g.beginPath();
    g.rect(-dw * 0.72, top - 4, dw * 1.5, height * 0.58);
    g.clip();
    drawSheet(g, rig.overlay, rig.overlayFrame, -dw / 2, top, dw, height);
    g.restore();
  }
  if (rig.flash > 0.02) {
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = `rgba(255, 236, 214, ${Math.min(0.75, rig.flash)})`;
    g.fillRect(-RIG / 2, -RIG, RIG, RIG);
  }
  g.restore();
  ctx.save();
  ctx.globalAlpha *= rig.alpha;
  ctx.drawImage(rigCanvas, Math.round(feetX) - ox, Math.round(feetY) - oy);
  ctx.restore();
}

function bean(
  ctx: CanvasRenderingContext2D,
  kind: string,
  feetX: number,
  feetY: number,
  h: number,
  facing: number,
  frame: number,
  state: string,
) {
  const pal =
    kind === "boss"
      ? ["#1b1b1b", "#e2b340", "#f4f4f4"]
      : kind === "heavy"
        ? ["#8d93a0", "#2c3138", "#f4f4f4"]
        : kind === "melee"
          ? ["#e0c56e", "#222", "#f4f4f4"]
          : kind === "soldier"
            ? ["#c46a52", "#7a2430", "#f4f4f4"]
            : ["#e0b883", "#3e4f2a", "#f7f7f2"];
  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  const bob = state === "playerRun" || state === "run" ? Math.sin(frame) * 2 : 0;
  ctx.fillStyle = "#1b1b1b";
  ctx.fillRect(-8, -8 + bob, 10, 8);
  ctx.fillRect(2, -8 - bob, 10, 8);
  ctx.fillStyle = pal[0]!;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.48, h * 0.32, h * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal[1]!;
  ctx.beginPath();
  ctx.ellipse(2, -h * 0.72, h * 0.26, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal[2]!;
  ctx.beginPath();
  ctx.arc(h * 0.08, -h * 0.55, h * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#161616";
  ctx.beginPath();
  ctx.arc(h * 0.11, -h * 0.55, h * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(h * 0.12, -h * 0.42, h * 0.28, h * 0.08);
  ctx.restore();
}

function drawShots(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const sheet = sprites.get("bullet");
  for (const s of sim.shots) {
    if (!s.alive) continue;
    const ang = Math.atan2(s.vy, s.vx);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ang);
    if (s.style === "shock") {
      ctx.strokeStyle = "#d7f6ff";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#39c6ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(0, 5);
      ctx.lineTo(8, -6);
      ctx.lineTo(18, 0);
      ctx.stroke();
    } else if (s.style === "fire") {
      ctx.fillStyle = "#ff4a12";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.arc(-2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.style === "plasma") {
      ctx.fillStyle = "#7dff6a";
      ctx.shadowColor = "#39ff6a";
      ctx.shadowBlur = 10;
      ctx.fillRect(-16, -3, 28, 6);
    } else if (s.style === "rocket") {
      ctx.fillStyle = "#6a6e74";
      ctx.fillRect(-12, -4, 18, 8);
      ctx.fillStyle = "#ffb03a";
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-12, 5);
      ctx.fill();
    } else if (sheet && s.team === "player") drawSheet(ctx, sheet, Math.floor(sim.time * 18) % 4, -4, s.heavy ? -8 : -6, s.heavy ? 22 : 16, s.heavy ? 14 : 10);
    else {
      const foeShot = s.team !== "player";
      ctx.fillStyle = foeShot ? "#ff3a28" : "#ffe9a8";
      ctx.shadowColor = foeShot ? "#ff5a32" : "#ffe08a";
      ctx.shadowBlur = foeShot ? 10 : 4;
      ctx.fillRect(0, foeShot ? -4 : -2, foeShot ? 20 : s.heavy ? 14 : 12, foeShot ? 8 : 4);
    }
    ctx.restore();
  }
}

function drawFx(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteBook) {
  const boom = sprites.get("boom");
  for (const b of sim.booms) {
    if (!b.alive) continue;
    const frame = Math.min(3, Math.floor((1 - b.life / b.max) * 4));
    if (boom) drawAnchored(ctx, boom, frame, b.x, b.y + b.s * 0.3, b.s * 1.4, 1);
    else {
      ctx.fillStyle = `rgba(255,170,60,${b.life / b.max})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.s * (1 - b.life / b.max), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const bit of sim.bits) {
    if (!bit.alive) continue;
    ctx.globalAlpha = Math.max(0, bit.life / bit.max);
    ctx.fillStyle = bit.color;
    ctx.fillRect(bit.x, bit.y, bit.size, bit.size);
    ctx.globalAlpha = 1;
  }
  ctx.font = "700 22px 'Russo One', Impact, sans-serif";
  ctx.textAlign = "center";
  for (const f of sim.floaters) {
    if (!f.alive) continue;
    ctx.globalAlpha = Math.max(0, f.life / 0.7);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
}

function pitColor(theme: string) {
  if (theme === "city") return "#121820";
  if (theme === "factory") return "#1a140c";
  if (theme === "base") return "#12160f";
  if (theme === "desert") return "#6a4224";
  if (theme === "zero") return "#14080c";
  return "#241812";
}

function drawThemeSky(ctx: CanvasRenderingContext2D, sim: Sim, viewW: number, viewH: number) {
  const sky = sim.levelNum > 0 ? moodSky(sim.levelNum) : themeSky(sim.theme);
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.45, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);
  const cam = sim.camX;
  const level = sim.levelNum;
  ctx.save();
  ctx.globalAlpha = level > 0 ? 0.42 : 0.28;
  for (let i = 0; i < 9; i++) {
    const w = 50 + ((i * 3 + level) % 5) * 28;
    const h = viewH * (0.16 + ((i + level) % 6) * 0.055);
    const x = ((i * 190 - cam * sky[3] + level * 40) % (viewW + 280)) - 90;
    const base = viewH * 0.98;
    ctx.fillStyle = sky[4];
    if (level >= 19 && level <= 24) {
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + w * 0.5, base - h, x + w, base);
      ctx.fill();
    } else if (level >= 7 && level <= 12) {
      ctx.fillRect(x, base - h * 0.45, w * 0.35, h * 0.45);
      ctx.fillRect(x + w * 0.45, base - h, w * 0.22, h);
    } else {
      ctx.fillRect(x, base - h, w, h);
    }
  }
  ctx.restore();
  if (level === 0 && sim.theme === "desert") {
    ctx.fillStyle = "rgba(214, 176, 110, 0.18)";
    for (let i = 0; i < 5; i++) {
      const x = ((sim.time * 80 + i * 180) % (viewW + 200)) - 100;
      ctx.fillRect(x, viewH * 0.62 + i * 22, viewW * 0.35, 12);
    }
  }
}

function isBridge(sim: Sim, c: number, r: number) {
  return sim.bridges.some((b) => !b.gone && r === b.row && c >= b.c0 && c <= b.c1);
}

function drawPlank(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, sim: Sim) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x + 8, y + 18, TILE - 16, TILE);
  const warn = Math.floor(sim.time * 5) % 2 === 0;
  ctx.fillStyle = warn ? "#f2c14b" : "#16120c";
  ctx.fillRect(x + 2, y, TILE - 4, 7);
  ctx.fillStyle = warn ? "#16120c" : "#f2c14b";
  ctx.fillRect(x + 2, y + 7, TILE - 4, 6);
  ctx.fillStyle = n % 2 ? "#8d5a30" : "#c4894e";
  ctx.fillRect(x + 6, y + 16, TILE - 12, 7);
  ctx.fillStyle = "#3a2618";
  ctx.fillRect(x + 12, y + 24, 4, 16);
  ctx.fillRect(x + TILE - 16, y + 24, 4, 16);
}

function drawPits(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (sim.levelNum <= 0 || sim.decks.length < 2) return;
  ctx.fillStyle = moodSky(sim.levelNum)[4];
  for (let i = 0; i < sim.decks.length; i++) {
    for (let j = i + 1; j < sim.decks.length; j++) {
      const a = sim.decks[i]!;
      const b = sim.decks[j]!;
      if (Math.abs(a.row - b.row) > 10) continue;
      let gapL = -1;
      let gapR = -1;
      if (a.c1 + 1 < b.c0) {
        gapL = a.c1 + 1;
        gapR = b.c0 - 1;
      } else if (b.c1 + 1 < a.c0) {
        gapL = b.c1 + 1;
        gapR = a.c0 - 1;
      }
      if (gapL < 0 || gapR - gapL > 8) continue;
      const top = Math.min(a.row, b.row) * TILE;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(gapL * TILE, top + 8, (gapR - gapL + 1) * TILE, TILE * 7);
      ctx.globalAlpha = 1;
    }
  }
}

type Mood = { sky: [string, string, string, number, string]; floor: string; lite: string; dark: string };

const MOOD: Mood[] = [
  { sky: ["#070b18", "#243056", "#10151f", 0.2, "rgba(6,10,18,0.92)"], floor: "#6e5344", lite: "#e7c7a4", dark: "#2a1c16" },
  { sky: ["#1a1206", "#c46a18", "#3a2814", 0.16, "rgba(40,22,8,0.9)"], floor: "#5c4638", lite: "#f0b060", dark: "#24180f" },
  { sky: ["#140818", "#6a3068", "#241428", 0.14, "rgba(28,10,32,0.9)"], floor: "#7a3a48", lite: "#f0a0b0", dark: "#2a1218" },
  { sky: ["#06140c", "#1e6a3a", "#0c2416", 0.12, "rgba(4,20,10,0.92)"], floor: "#3e5a40", lite: "#b7e0a0", dark: "#142016" },
  { sky: ["#24080c", "#c42828", "#3a1014", 0.18, "rgba(36,6,8,0.9)"], floor: "#6a3030", lite: "#ffb0a0", dark: "#240c0c" },
  { sky: ["#100c04", "#e0b040", "#2a220c", 0.1, "rgba(16,12,4,0.92)"], floor: "#8a7040", lite: "#ffe08a", dark: "#2a2010" },
  { sky: ["#1a0c06", "#e06020", "#2a140c", 0.16, "rgba(24,10,4,0.9)"], floor: "#8a4a28", lite: "#ffc090", dark: "#2a140c" },
  { sky: ["#141208", "#e6c24a", "#2a2610", 0.14, "rgba(20,16,6,0.88)"], floor: "#6a6858", lite: "#ffe06a", dark: "#222018" },
  { sky: ["#14181c", "#d8e0e6", "#2a3036", 0.1, "rgba(16,20,24,0.75)"], floor: "#8a9096", lite: "#f4f7fa", dark: "#2c3238" },
  { sky: ["#041418", "#1aa0a8", "#082428", 0.14, "rgba(4,16,20,0.9)"], floor: "#2a5458", lite: "#9ae0e4", dark: "#0c2428" },
  { sky: ["#061408", "#39e070", "#0c2414", 0.12, "rgba(4,16,8,0.9)"], floor: "#243828", lite: "#b0ffc8", dark: "#0c1810" },
  { sky: ["#1c140c", "#fff2d0", "#3a2c20", 0.08, "rgba(20,14,8,0.8)"], floor: "#a09080", lite: "#fff6e4", dark: "#3a3028" },
  { sky: ["#12180c", "#6a7a38", "#1c2414", 0.14, "rgba(12,16,8,0.9)"], floor: "#5a6238", lite: "#d5e090", dark: "#1c2010" },
  { sky: ["#061018", "#3a78c8", "#0c1828", 0.16, "rgba(4,10,20,0.9)"], floor: "#4a5560", lite: "#c5d8f0", dark: "#141820" },
  { sky: ["#101418", "#8a98a4", "#1c242c", 0.12, "rgba(10,14,18,0.88)"], floor: "#5c6860", lite: "#d0ddd4", dark: "#1a201c" },
  { sky: ["#18080c", "#ff3040", "#2a1014", 0.18, "rgba(20,4,8,0.9)"], floor: "#4a3034", lite: "#ffb0b4", dark: "#180c10" },
  { sky: ["#101808", "#88a050", "#1c2810", 0.12, "rgba(10,16,6,0.88)"], floor: "#6a6840", lite: "#e4d8a0", dark: "#222010" },
  { sky: ["#0c140c", "#e8f0d8", "#182018", 0.1, "rgba(8,14,8,0.85)"], floor: "#6e7a58", lite: "#f4f8e8", dark: "#1c2418" },
  { sky: ["#2a1c08", "#f0c060", "#4a3014", 0.1, "rgba(40,24,8,0.72)"], floor: "#c49858", lite: "#ffe4b0", dark: "#5a3a18" },
  { sky: ["#2a1008", "#c44828", "#3a1c10", 0.12, "rgba(32,10,6,0.88)"], floor: "#8a4030", lite: "#f0b090", dark: "#2a120c" },
  { sky: ["#1c140c", "#a87848", "#2c2014", 0.12, "rgba(20,12,6,0.88)"], floor: "#a08058", lite: "#f0d8b0", dark: "#3a2c18" },
  { sky: ["#c8b48a", "#f4e6c4", "#a89068", 0.08, "rgba(80,60,30,0.35)"], floor: "#e6d2a8", lite: "#fff8e8", dark: "#8a7048" },
  { sky: ["#1a0c06", "#ff6a20", "#3a180c", 0.16, "rgba(20,8,4,0.9)"], floor: "#6a4030", lite: "#ffc090", dark: "#24140c" },
  { sky: ["#240810", "#a82838", "#3a1018", 0.14, "rgba(20,4,8,0.9)"], floor: "#5a3038", lite: "#f0a0a8", dark: "#1c0c10" },
  { sky: ["#04060e", "#1a2a55", "#080c18", 0.18, "rgba(2,4,10,0.94)"], floor: "#2a3144", lite: "#9ab0d8", dark: "#0c1018" },
  { sky: ["#100818", "#6840a0", "#1c1028", 0.14, "rgba(10,4,16,0.92)"], floor: "#3a3448", lite: "#d0b8f0", dark: "#141018" },
  { sky: ["#18040a", "#c01830", "#2a0810", 0.16, "rgba(16,2,6,0.92)"], floor: "#4a2830", lite: "#ffb0b8", dark: "#18080c" },
  { sky: ["#140c08", "#e07030", "#24140c", 0.14, "rgba(12,6,4,0.9)"], floor: "#5a4034", lite: "#ffd0a8", dark: "#1c120c" },
  { sky: ["#0a0610", "#402060", "#140c1c", 0.12, "rgba(6,2,10,0.94)"], floor: "#322838", lite: "#c8b0e0", dark: "#100c14" },
  { sky: ["#080204", "#ff2030", "#18060a", 0.2, "rgba(8,0,2,0.94)"], floor: "#3a3032", lite: "#ffd0c8", dark: "#14080a" },
];

function moodSky(level: number): [string, string, string, number, string] {
  return (MOOD[level - 1] ?? MOOD[0]!).sky;
}

function moodMat(level: number) {
  const m = MOOD[level - 1] ?? MOOD[0]!;
  return {
    wall: m.floor,
    wallShade: "rgba(0,0,0,0.22)",
    trim: m.lite,
    pier: m.floor,
    glass: m.lite,
    glassLite: "rgba(255,255,255,0.45)",
    floor: m.floor,
    floorLite: m.lite,
    floorDark: m.dark,
    mortar: m.dark,
    brick: [m.floor, m.dark, m.lite, m.floor],
  };
}

function themeSky(theme: string): [string, string, string, number, string] {
  if (theme === "city") return ["#12182c", "#6a403c", "#3a4454", 0.18, "rgba(18, 24, 36, 0.9)"];
  if (theme === "factory") return ["#16130f", "#6a3a18", "#2a261f", 0.16, "rgba(28, 24, 18, 0.9)"];
  if (theme === "base") return ["#1a261c", "#4e6238", "#243028", 0.14, "rgba(22, 32, 20, 0.88)"];
  if (theme === "desert") return ["#3a2414", "#a85a30", "#6a3a22", 0.12, "rgba(90, 58, 28, 0.55)"];
  return ["#140810", "#5a1824", "#1c1016", 0.1, "rgba(28, 12, 18, 0.9)"];
}

function drawThemeBrick(ctx: CanvasRenderingContext2D, x: number, y: number, cap: boolean, n: number, theme: string, step = false, level = 0) {
  const pal = level > 0 ? moodMat(level) : themeMat(theme);
  if (!cap) {
    drawMasonry(ctx, x, y, pal, n);
    return;
  }
  ctx.fillStyle = step ? pal.floorLite : pal.floor;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = step ? "#f3e2b0" : pal.floorLite;
  ctx.fillRect(x, y, TILE, step ? 10 : 5);
  if (step) {
    ctx.fillStyle = "#e2b84a";
    ctx.fillRect(x + 5, y + 4, TILE - 10, 3);
  }
  ctx.fillStyle = pal.floorDark;
  ctx.fillRect(x, y + TILE - 7, TILE, 7);
  ctx.fillStyle = pal.mortar;
  for (let i = 1; i <= 3; i++) ctx.fillRect(x, y + 8 + i * 9, TILE, 1);
  if (n % 2 === 0) ctx.fillRect(x + 22, y + 6, 1, TILE - 12);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, TILE, 2);
  ctx.fillStyle = pal.trim;
  ctx.fillRect(x + 4, y + 3, 3, 14);
  ctx.fillRect(x + TILE - 7, y + 3, 3, 14);
  ctx.fillRect(x + 4, y + 3, TILE - 8, 3);
}

function drawMasonry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pal: { brick: string[]; mortar: string },
  n: number,
) {
  ctx.fillStyle = pal.mortar;
  ctx.fillRect(x, y, TILE, TILE);
  const h = 10;
  for (let row = 0; row < 4; row++) {
    const yy = y + row * 12 + 1;
    const shift = row % 2 === 0 ? 0 : 16;
    for (let col = -1; col < 3; col++) {
      const xx = x + col * 24 + shift + 1;
      const left = Math.max(x + 1, xx);
      const right = Math.min(x + TILE - 1, xx + 22);
      if (right <= left) continue;
      ctx.fillStyle = pal.brick[(n + row + col) & 3] ?? pal.brick[0]!;
      ctx.fillRect(left, yy, right - left, h);
    }
  }
}

function themeMat(theme: string) {
  if (theme === "factory") {
    return {
      wall: "#8a8680",
      wallShade: "rgba(40,36,30,0.18)",
      trim: "#5c584e",
      pier: "#6a655c",
      glass: "#c9d4c4",
      glassLite: "rgba(255,244,220,0.55)",
      floor: "#6e6a62",
      floorLite: "#b7a48a",
      floorDark: "#3e3a34",
      mortar: "#5a554c",
      brick: ["#7a756c", "#6a655c", "#848078", "#5e5a52"],
    };
  }
  if (theme === "base") {
    return {
      wall: "#d5d8c4",
      wallShade: "rgba(40,48,28,0.12)",
      trim: "#6d7348",
      pier: "#8a9164",
      glass: "#b7c8a4",
      glassLite: "rgba(230,240,210,0.55)",
      floor: "#6d7348",
      floorLite: "#c5cba0",
      floorDark: "#3e4428",
      mortar: "#6a6848",
      brick: ["#7d8458", "#6a7248", "#8a9264", "#5e663c"],
    };
  }
  if (theme === "desert") {
    return {
      wall: "#f0d7a8",
      wallShade: "rgba(120,70,30,0.12)",
      trim: "#a87848",
      pier: "#c49858",
      glass: "#f2e2b4",
      glassLite: "rgba(255,248,220,0.6)",
      floor: "#c4956a",
      floorLite: "#f0d7a2",
      floorDark: "#7a5430",
      mortar: "#b89068",
      brick: ["#e0bc84", "#d2aa70", "#c89860", "#e8c898"],
    };
  }
  if (theme === "zero") {
    return {
      wall: "#4a4452",
      wallShade: "rgba(0,0,0,0.28)",
      trim: "#8a3038",
      pier: "#3a343f",
      glass: "#6a3040",
      glassLite: "rgba(255,80,80,0.35)",
      floor: "#3a3642",
      floorLite: "#a84858",
      floorDark: "#1c1820",
      mortar: "#2e2a34",
      brick: ["#4a4450", "#3c3844", "#564e5c", "#322e38"],
    };
  }
  return {
    wall: "#e4d5c4",
    wallShade: "rgba(60,36,24,0.12)",
    trim: "#8d5a45",
    pier: "#c4a48c",
    glass: "#b9d4de",
    glassLite: "rgba(255,250,240,0.55)",
    floor: "#8d5a45",
    floorLite: "#e7d3bf",
    floorDark: "#4e3024",
    mortar: "#c3b2a2",
    brick: ["#c48b72", "#b47d66", "#d09a80", "#a36e58"],
  };
}

function drawRooms(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  c0: number,
  c1: number,
  r0: number,
  r1: number,
) {
  const pal = themeMat(sim.theme);
  for (let c = c0; c <= c1; c++) {
    if (c < 2 || c > COLS - 3) continue;
    for (let r = Math.max(1, r0); r <= r1; r++) {
      const k = tileAt(sim.tiles, c, r);
      if (k !== T_SOLID && k !== T_CRATE && k !== T_BARREL) continue;
      if (r > 0 && tileAt(sim.tiles, c, r - 1) !== T_EMPTY) continue;
      if (k === T_SOLID && stepRun(sim, c, r)) continue;
      let top = r;
      const limit = Math.max(1, r - 7);
      for (let rr = r - 1; rr >= limit; rr--) {
        const above = tileAt(sim.tiles, c, rr);
        if (above !== T_EMPTY) break;
        top = rr;
      }
      if (top === r) continue;
      const x = c * TILE;
      const y = top * TILE;
      const h = (r - top) * TILE;
      ctx.fillStyle = pal.wall;
      ctx.fillRect(x, y, TILE, h);
      ctx.fillStyle = pal.wallShade;
      ctx.fillRect(x, y, 7, h);
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(x, y, TILE, 12);
      ctx.fillStyle = pal.trim;
      ctx.fillRect(x, r * TILE - 8, TILE, 8);
      if (c % 8 === 0) {
        ctx.fillStyle = pal.pier;
        ctx.fillRect(x + 18, y, 12, h);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x + 18, y, 2, h);
      }
      if (c % 6 === 3 && h >= TILE * 3) {
        const wy = y + Math.max(18, h * 0.22);
        const wh = Math.min(TILE * 1.2, h * 0.46);
        ctx.fillStyle = pal.trim;
        ctx.fillRect(x + 8, wy - 3, TILE - 16, wh + 8);
        const glass = ctx.createLinearGradient(x, wy, x + TILE, wy + wh);
        glass.addColorStop(0, pal.glassLite);
        glass.addColorStop(1, pal.glass);
        ctx.fillStyle = glass;
        ctx.fillRect(x + 11, wy, TILE - 22, wh);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + TILE / 2, wy);
        ctx.lineTo(x + TILE / 2, wy + wh);
        ctx.moveTo(x + 11, wy + wh / 2);
        ctx.lineTo(x + TILE - 11, wy + wh / 2);
        ctx.stroke();
      }
      if (sim.theme === "factory" && c % 9 === 4) {
        ctx.fillStyle = "#8a5a32";
        ctx.fillRect(x, y + 16, TILE, 6);
        ctx.fillStyle = "#e0a04a";
        ctx.fillRect(x + 8, y + 18, 10, 2);
      }
    }
  }
}

function drawDressing(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (sim.theme === "warehouse" || sim.levelNum > 0) return;
  const c0 = Math.max(0, Math.floor(sim.camX / TILE) - 1);
  const c1 = Math.min(COLS - 1, Math.floor((sim.camX + sim.viewW) / TILE) + 1);
  for (let c = c0; c <= c1; c++) {
    if (tileAt(sim.tiles, c, FLOOR) === T_EMPTY && tileAt(sim.tiles, c, FLOOR - 1) === T_EMPTY) continue;
    const ground = tileAt(sim.tiles, c, FLOOR) !== T_EMPTY ? FLOOR : FLOOR - 1;
    const x = c * TILE;
    const y = ground * TILE;
    const n = (c * 13) % 11;
    if (sim.theme === "city" && n === 0) {
      ctx.fillStyle = "#2a3344";
      ctx.fillRect(x + 4, y - 22, 36, 16);
      ctx.fillStyle = "#c23a3a";
      ctx.fillRect(x + 6, y - 18, 10, 8);
      ctx.fillStyle = "#d8d2c8";
      ctx.fillRect(x + 20, y - 16, 14, 6);
    } else if (sim.theme === "city" && n === 3) {
      ctx.fillStyle = "#8a3030";
      ctx.fillRect(x, y - 18, TILE, 10);
      ctx.fillStyle = "#f2efe6";
      ctx.fillRect(x + 8, y - 34, 18, 16);
    } else if (sim.theme === "factory" && n % 4 === 0) {
      ctx.strokeStyle = "#6a5840";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y - 70);
      ctx.lineTo(x + 20, y - 70);
      ctx.lineTo(x + 20, y - 20);
      ctx.stroke();
      ctx.fillStyle = n % 8 === 0 ? "#e07020" : "#888";
      ctx.beginPath();
      ctx.arc(x + 20, y - 70, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (sim.theme === "base" && n === 2) {
      ctx.fillStyle = "#2a3324";
      ctx.fillRect(x + 16, y - 54, 8, 54);
      ctx.fillStyle = "#9aaa78";
      ctx.fillRect(x + 8, y - 62, 24, 8);
    } else if (sim.theme === "desert" && n % 5 === 0) {
      ctx.fillStyle = "#2f6a32";
      ctx.fillRect(x + 20, y - 28, 4, 28);
      ctx.beginPath();
      ctx.ellipse(x + 16, y - 30, 8, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 28, y - 26, 7, 11, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (sim.theme === "zero" && n % 6 === 0) {
      const blink = Math.sin(sim.time * 6 + c) > 0;
      ctx.fillStyle = blink ? "#ff3030" : "#401418";
      ctx.fillRect(x + 8, y - 16, 10, 10);
    }
  }
}

function drawHazards(ctx: CanvasRenderingContext2D, sim: Sim) {
  for (const b of sim.belts) {
    const row = b.row ?? FLOOR;
    for (let c = b.c0; c <= b.c1; c++) {
      const x = c * TILE;
      const y = row * TILE;
      ctx.fillStyle = "rgba(20,16,10,0.55)";
      ctx.fillRect(x, y, TILE, 12);
      const slide = ((sim.time * 90 * b.dir) % 16 + 16) % 16;
      ctx.fillStyle = "#ffbf3a";
      ctx.beginPath();
      ctx.moveTo(x + slide + 2, y + 6);
      ctx.lineTo(x + slide + 12, y + 2);
      ctx.lineTo(x + slide + 12, y + 10);
      ctx.fill();
    }
  }
  for (const v of sim.vents) {
    const x = v.col * TILE + TILE / 2;
    const y = v.row * TILE;
    ctx.fillStyle = "#5a5044";
    ctx.fillRect(x - 10, y, 20, 10);
    if (!v.on) continue;
    const h = 70 + Math.sin(sim.time * 18) * 10;
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, "rgba(220,230,240,0)");
    g.addColorStop(1, "rgba(230,236,244,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, y - h, 28, h);
  }
  for (const br of sim.bridges) {
    if (br.gone || br.t <= 0) continue;
    ctx.strokeStyle = `rgba(90,40,20,${Math.min(1, br.t * 2)})`;
    ctx.beginPath();
    ctx.moveTo(br.c0 * TILE, br.row * TILE + 8);
    ctx.lineTo((br.c0 + br.c1) * 0.5 * TILE, br.row * TILE + 20);
    ctx.lineTo((br.c1 + 1) * TILE, br.row * TILE + 6);
    ctx.stroke();
  }
  for (const p of sim.plats) {
    ctx.fillStyle = "#c9842a";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = "#2a2418";
    for (let i = 10; i < p.w - 8; i += 18) ctx.fillRect(p.x + i, p.y + 6, 8, 6);
  }
  for (const w of sim.warnings) {
    const k = Math.max(0, w.life / w.max);
    ctx.strokeStyle = `rgba(255,60,40,${0.35 + (1 - k) * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r * (0.7 + (1 - k) * 0.3), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,40,20,${0.12 + (1 - k) * 0.2})`;
    ctx.fill();
  }
}

function drawMachine(ctx: CanvasRenderingContext2D, f: Sim["foes"][number], time: number) {
  const x = f.x;
  const y = f.y + f.h;
  ctx.save();
  if (!f.alive) ctx.globalAlpha = Math.max(0, 1 - f.deadT * 1.5);
  if (f.kind === "turret") {
    ctx.fillStyle = "#2c3328";
    ctx.fillRect(x, y - 16, f.w, 16);
    ctx.save();
    ctx.translate(x + f.w / 2, y - 18);
    ctx.rotate(f.facing > 0 ? 0 : Math.PI);
    ctx.fillStyle = "#1a1e16";
    ctx.fillRect(0, -4, 22, 8);
    ctx.fillStyle = f.flash > 0 ? "#ffb15a" : "#9aaa78";
    ctx.fillRect(16, -2, 8, 4);
    ctx.restore();
    ctx.fillStyle = "#44503a";
    ctx.beginPath();
    ctx.arc(x + f.w / 2, y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.kind === "generator") {
    ctx.fillStyle = "#3a4038";
    ctx.fillRect(x, y - f.h, f.w, f.h);
    ctx.fillStyle = Math.sin(time * 8) > 0 ? "#7dff9a" : "#1d6a32";
    ctx.fillRect(x + 6, y - f.h + 8, 8, 8);
    ctx.fillStyle = "#e0a040";
    ctx.fillRect(x + 8, y - 14, f.w - 16, 6);
    ctx.strokeStyle = "#222";
    ctx.strokeRect(x + 0.5, y - f.h + 0.5, f.w - 1, f.h - 1);
  } else if (f.kind === "antenna") {
    ctx.fillStyle = "#2a3324";
    ctx.fillRect(x + f.w / 2 - 3, y - f.h, 6, f.h);
    ctx.strokeStyle = "#d7e2bc";
    ctx.beginPath();
    ctx.arc(x + f.w / 2, y - f.h, 16, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = Math.sin(time * 5) > 0 ? "#ff5a4a" : "#402018";
    ctx.beginPath();
    ctx.arc(x + f.w / 2, y - f.h, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#8a6234";
    ctx.fillRect(x, y - 28, f.w, 28);
    ctx.fillStyle = "#c4a36a";
    ctx.fillRect(x + 4, y - 44, f.w - 18, 18);
    ctx.fillStyle = "#6a3a28";
    ctx.fillRect(x + f.w - 16, y - 36, 12, 12);
    ctx.fillStyle = "#222";
    ctx.fillRect(x + 6, y - 10, f.w - 12, 4);
  }
  if (f.hurtT > 0) {
    ctx.fillStyle = "rgba(255,220,180,0.35)";
    ctx.fillRect(x, y - f.h, f.w, f.h);
  }
  ctx.restore();
}

