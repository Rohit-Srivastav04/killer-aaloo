export type Look = {
  phase: number;
  land: number;
  turn: number;
  stop: number;
  start: number;
  recoil: number;
  recoilMax: number;
  kick: number;
  swap: number;
  aim: number;
  aimHold: boolean;
  air: number;
  prevGround: boolean;
  prevFacing: number;
  prevSpeed: number;
};

export type PlayerPose = {
  sheet: string;
  frame: number;
  overlay: boolean;
  overlayFrame: number;
  lean: number;
  sx: number;
  sy: number;
  bob: number;
  kick: number;
  flash: number;
  alpha: number;
  aim: number;
  muzzle: boolean;
  spin: number;
};

type Body = {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: number;
  alive: boolean;
  hurtT: number;
  deadT: number;
  meleeT: number;
  reloadT: number;
  reloadMax: number;
  shootT: number;
  iframes: number;
  flipT?: number;
  look: Look;
};

export function makeLook(): Look {
  return {
    phase: 0,
    land: 0,
    turn: 0,
    stop: 0,
    start: 0,
    recoil: 0,
    recoilMax: 0.08,
    kick: 0,
    swap: 0,
    aim: 0,
    aimHold: false,
    air: 0,
    prevGround: true,
    prevFacing: 1,
    prevSpeed: 0,
  };
}

export function resetLook(look: Look) {
  Object.assign(look, makeLook());
}

export function tickPlayerLook(look: Look, dt: number, body: Body, aim: number) {
  let landed = false;
  if (!body.alive) {
    look.recoil = Math.max(0, look.recoil - dt);
    return false;
  }
  const sp = Math.abs(body.vx);
  if (body.grounded) look.phase = (look.phase + (sp * dt) / 52) % 1;
  if (body.grounded && !look.prevGround && look.air > 0.05) {
    look.land = 0.16;
    landed = true;
  }
  look.air = body.grounded ? 0 : look.air + dt;
  if (body.facing !== look.prevFacing) look.turn = 0.09;
  if (body.grounded && sp < 12 && look.prevSpeed > 150) look.stop = 0.13;
  if (body.grounded && look.prevSpeed < 24 && sp > 50) look.start = 0.09;
  look.land = Math.max(0, look.land - dt);
  look.turn = Math.max(0, look.turn - dt);
  look.stop = Math.max(0, look.stop - dt);
  look.start = Math.max(0, look.start - dt);
  look.recoil = Math.max(0, look.recoil - dt);
  look.swap = Math.max(0, look.swap - dt);
  if (look.aimHold) look.aimHold = false;
  else {
    let d = aim - look.aim;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    look.aim += d * Math.min(1, dt * 16);
  }
  look.prevGround = body.grounded;
  look.prevFacing = body.facing;
  look.prevSpeed = sp;
  return landed;
}

export function noteRecoil(look: Look, weapon: number, aim: number) {
  look.recoilMax = weapon === 2 ? 0.1 : weapon === 1 ? 0.05 : 0.08;
  look.recoil = look.recoilMax;
  look.kick = weapon === 2 ? 5.4 : weapon === 1 ? 2.3 : 3.5;
  look.aim = aim;
  look.aimHold = true;
}

export function noteSwap(look: Look) {
  look.swap = 0.15;
}

export function playerPose(p: Body, time: number): PlayerPose {
  const look = p.look;
  const sp = Math.abs(p.vx);
  let sheet = "playerIdle";
  let frame = Math.floor(time * 1.6) % 4;
  if (!p.alive) {
    sheet = "playerDeath";
    frame = Math.min(3, Math.floor(p.deadT * 8));
  } else if (p.hurtT > 0.1) {
    sheet = "playerHurt";
    frame = Math.min(3, Math.floor((1 - p.hurtT / 0.28) * 4));
  } else if (p.meleeT > 0) {
    sheet = "playerMelee";
    frame = Math.min(3, Math.floor((1 - p.meleeT / 0.32) * 4));
  } else if (p.reloadT > 0) {
    sheet = "playerReload";
    const t = 1 - p.reloadT / Math.max(0.05, p.reloadMax);
    frame = Math.min(3, Math.floor(t * 4));
  } else if (!p.grounded) {
    sheet = "playerJump";
    if (look.air < 0.07) frame = 0;
    else if (p.vy < -80) frame = 1;
    else if (p.vy < 160) frame = 2;
    else frame = 3;
  } else if (look.land > 0.05 && sp < 90) {
    sheet = "playerJump";
    frame = 3;
  } else if (sp > 16) {
    sheet = "playerRun";
    frame = Math.floor(look.phase * 4) % 4;
  } else if (p.shootT > 0 || look.recoil > 0.02) {
    sheet = "playerShoot";
    const u = 1 - look.recoil / Math.max(0.02, look.recoilMax);
    frame = Math.min(3, Math.floor(u * 4));
  }

  const firing = p.alive && (p.shootT > 0 || look.recoil > 0.012);
  const flipping = (p.flipT ?? 0) > 0;
  const spin = p.alive && !p.grounded && flipping ? -Math.PI * 2 * (1 - (p.flipT ?? 0) / 0.7) : 0;
  const fullBody = sheet === "playerShoot" || sheet === "playerMelee" || sheet === "playerReload" || sheet === "playerHurt" || sheet === "playerDeath";
  const overlay = firing && !fullBody;
  const overlayFrame = Math.min(3, Math.floor((1 - look.recoil / Math.max(0.02, look.recoilMax)) * 4));

  let sy = 1;
  if (p.alive && p.grounded && sp < 16 && p.meleeT <= 0) sy += Math.sin(time * 2.3) * 0.014;
  if (p.alive && !p.grounded && p.vy < -40) sy += 0.07;
  if (p.alive && !p.grounded && p.vy > 220) sy += 0.045;
  if (look.land > 0) sy -= (look.land / 0.16) * 0.13;
  if (look.swap > 0) sy -= 0.045;
  sy = Math.max(0.82, sy);
  const sx = 1 / sy;

  let lean = 0;
  if (p.alive && p.grounded && sp > 28) lean = Math.min(1, sp / 292) * (sp > 240 ? 0.09 : 0.055);
  if (spin !== 0) lean = 0;
  if (look.stop > 0) lean -= 0.1 * (look.stop / 0.13);
  if (look.start > 0) lean += 0.07 * (look.start / 0.09);
  if (p.meleeT > 0) lean += 0.14 * (1 - p.meleeT / 0.32);
  if (look.turn > 0) lean *= 0.35;

  const bob =
    p.alive && p.grounded && sp > 36 ? Math.sin(look.phase * Math.PI * 2) * (sp > 240 ? 1.5 : 1) : 0;
  const kick = look.recoilMax > 0 ? (look.recoil / look.recoilMax) * look.kick : 0;
  const blink = p.alive && p.iframes > 0 && Math.floor(p.iframes * 16) % 2 === 0;

  return {
    sheet,
    frame,
    overlay,
    overlayFrame,
    lean,
    sx,
    sy,
    bob,
    kick,
    flash: Math.max(p.hurtT > 0.04 ? 0.42 : 0, blink ? 0.28 : 0),
    alpha: !p.alive ? Math.max(0.2, 1 - p.deadT) : blink ? 0.78 : 1,
    aim: look.aim,
    muzzle: firing && p.meleeT <= 0 && p.reloadT <= 0,
    spin,
  };
}
