export type Sheet = {
  img: HTMLImageElement;
  cols: number;
  rows: number;
};

const URLS: Record<string, { url: string; cols: number; rows: number }> = {
  playerIdle: { url: "/game/player-idle.png", cols: 2, rows: 2 },
  playerRun: { url: "/game/player-run.png", cols: 2, rows: 2 },
  playerJump: { url: "/game/player-jump.png", cols: 2, rows: 2 },
  playerShoot: { url: "/game/player-shoot.png", cols: 2, rows: 2 },
  playerMelee: { url: "/game/player-melee.png", cols: 2, rows: 2 },
  playerHurt: { url: "/game/player-hurt.png", cols: 2, rows: 2 },
  playerDeath: { url: "/game/player-death.png", cols: 2, rows: 2 },
  playerReload: { url: "/game/player-reload.png", cols: 2, rows: 2 },
  soldier: { url: "/game/soldier-run.png", cols: 2, rows: 2 },
  heavy: { url: "/game/heavy-run.png", cols: 2, rows: 2 },
  melee: { url: "/game/melee-run.png", cols: 2, rows: 2 },
  boss: { url: "/game/boss.png", cols: 2, rows: 2 },
  boom: { url: "/game/boom.png", cols: 2, rows: 2 },
  bullet: { url: "/game/bullet.png", cols: 2, rows: 2 },
  muzzle: { url: "/game/muzzle.png", cols: 2, rows: 2 },
  props: { url: "/game/props.png", cols: 2, rows: 2 },
  pickups: { url: "/game/pickups.png", cols: 2, rows: 2 },
  door: { url: "/game/door.png", cols: 1, rows: 1 },
  sky: { url: "/game/bg-sky.jpg", cols: 1, rows: 1 },
  far: { url: "/game/bg-far.jpg", cols: 1, rows: 1 },
  mid: { url: "/game/bg-mid.jpg", cols: 1, rows: 1 },
  near: { url: "/game/bg-near.jpg", cols: 1, rows: 1 },
};

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export class SpriteBook {
  private sheets = new Map<string, Sheet>();

  get(name: string) {
    return this.sheets.get(name) ?? null;
  }

  async load() {
    await Promise.all(
      Object.entries(URLS).map(async ([key, spec]) => {
        const img = await loadImage(spec.url);
        if (!img) return;
        this.sheets.set(key, { img, cols: spec.cols, rows: spec.rows });
      }),
    );
  }
}

export function drawSheet(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const fw = sheet.img.width / sheet.cols;
  const fh = sheet.img.height / sheet.rows;
  const f = ((frame % (sheet.cols * sheet.rows)) + sheet.cols * sheet.rows) % (sheet.cols * sheet.rows);
  const c = f % sheet.cols;
  const r = Math.floor(f / sheet.cols);
  ctx.drawImage(sheet.img, c * fw, r * fh, fw, fh, x, y, w, h);
}

export function drawAnchored(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  feetX: number,
  feetY: number,
  height: number,
  facing: number,
) {
  const fw = sheet.img.width / sheet.cols;
  const fh = sheet.img.height / sheet.rows;
  const dw = height * (fw / fh);
  ctx.save();
  ctx.translate(Math.round(feetX), Math.round(feetY));
  ctx.scale(facing < 0 ? -1 : 1, 1);
  drawSheet(ctx, sheet, frame, -dw / 2, -height, dw, height);
  ctx.restore();
}
