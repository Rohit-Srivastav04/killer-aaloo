import { GameAudio, type MusicCue } from "@/game/audio";
import { MISSION_META, MISSION_ORDER, type MissionId } from "@/game/campaign";
import { buyCharacter, buyPlayer, buyWeapon, checkAchievements, selectCharacter, settleLevel, settleMission } from "@/game/economy";
import { levelDef } from "@/game/levels";
import { teaseFor } from "@/game/adventure";
import { render } from "@/game/render";
import { CHARACTERS, buildLoadout, charUnlocked, type CharId, type PlayerStat, type WeaponStat } from "@/game/roster";
import { DEFAULT_SETTINGS, defaultSave, readSave, syncCampaign, writeSave, type SaveData, type Settings } from "@/game/save";
import { SpriteBook } from "@/game/sprites";
import { Sim, type Edges, type Held } from "@/game/sim";
import { WORLD_H, WORLD_W } from "@/game/level";

export type Mode = "menu" | "play" | "pause" | "dead" | "win";

export type RunStats = {
  kills: number;
  coins: number;
  score: number;
  hp: number;
  bossDown: boolean;
  mission: MissionId | null;
  level: number | null;
  missionName: string;
  stars: number;
  reward: number;
  campaignClear: boolean;
  goal: number;
  bossName: string;
  nextTease: string;
};

const STEP = 1 / 60;
const EMPTY_EDGES: Edges = { jump: false, flip: false, shoot: false, reload: false, swap: false, dash: false, grenade: false };

type Hooks = {
  onScreen: (mode: Mode) => void;
  onAnnounce: (title: string, sub: string) => void;
  onSave: (data: SaveData) => void;
  onReady: () => void;
};

export class ShadowStrike {
  private audio = new GameAudio();
  private sim: Sim;
  private sprites = new SpriteBook();
  private raf = 0;
  private last = 0;
  private acc = 0;
  private mode: Mode = "menu";
  private mission: MissionId | null = null;
  private level: number | null = null;
  private lastStars = 0;
  private lastReward = 0;
  private settings: Settings;
  private save: SaveData;
  private realKeys = new Set<string>();
  private qaKeys = new Set<string>();
  private moveBias: "left" | "right" = "right";
  private touch: Held = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
  private latch: Held = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
  private prev: Held = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
  private taps = { reload: false, swap: false };
  private jumpDowns = 0;
  private hud: {
    hp?: HTMLElement | null;
    hpText?: HTMLElement | null;
    kills?: HTMLElement | null;
    ammo?: HTMLElement | null;
    weapon?: HTMLElement | null;
    grenades?: HTMLElement | null;
    coins?: HTMLElement | null;
    boss?: HTMLElement | null;
    bossName?: HTMLElement | null;
    bossFill?: HTMLElement | null;
    objective?: HTMLElement | null;
    vignette?: HTMLElement | null;
    lives?: HTMLElement | null;
  } = {};
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur: () => void;
  private onVis: () => void;
  private onResize: () => void;
  disposed = false;
  private deathsThisRun = 0;
  private seenFalls = 0;
  private playAcc = 0;
  private music: MusicCue = "menu";
  private drawGate = 0;
  private wide = false;

  constructor(
    private canvas: HTMLCanvasElement,
    settings: Settings,
    private hooks: Hooks,
  ) {
    this.settings = settings;
    this.save = readSave();
    this.sim = new Sim(this.audio);
    this.sim.lobby = true;
    this.onKeyDown = (e) => {
      const block = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyA", "KeyD", "KeyW"];
      if (block.includes(e.code)) e.preventDefault();
      this.realKeys.add(e.code);
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.moveBias = "left";
      if (e.code === "ArrowRight" || e.code === "KeyD") this.moveBias = "right";
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") this.jumpDowns++;
      if (e.code === "Escape") {
        if (this.mode === "play") this.pause();
        else if (this.mode === "pause") this.resume();
      }
      if (e.code === "KeyR") this.taps.reload = true;
      if (e.code === "KeyE") this.taps.swap = true;
    };
    this.onKeyUp = (e) => this.realKeys.delete(e.code);
    this.onBlur = () => {
      this.releaseInput();
    };
    this.onVis = () => {
      if (document.hidden) this.releaseInput();
      else this.audio.resume();
    if (document.hidden) {
      this.audio.suspend();
      this.save.playSeconds = Math.floor(this.save.playSeconds);
      writeSave(this.save);
    }
    };
    this.onResize = () => this.resize();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVis);
    window.addEventListener("resize", this.onResize);
    this.resize();
    this.tune(false);
    void this.sprites.load().then(() => this.draw());
    this.installProbe();
    this.hooks.onReady();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  bindHud(hud: typeof this.hud) {
    this.hud = hud;
  }

  clickUi() {
    this.audio.ui();
  }

  unlock() {
    this.audio.unlock();
    this.audio.setMix(this.settings.master, this.settings.music, this.settings.sfx, this.settings.ui, this.settings.ambience);
    if (this.mode === "menu") this.playCue("menu");
  }

  applySettings(settings: Settings) {
    this.settings = settings;
    this.save.settings = settings;
    this.audio.setMix(settings.master, settings.music, settings.sfx, settings.ui, settings.ambience);
    this.sim.particleCap = settings.graphics === "low" ? 40 : settings.graphics === "high" ? 140 : 90;
    this.tune(false);
    this.resize();
    writeSave(this.save);
    this.hooks.onSave(this.save);
  }

  private tune(refill: boolean) {
    const s = this.save;
    this.sim.applyLoadout(buildLoadout(s.character, s.weapons, s.player, s.settings.difficulty, s.settings.aimAssist), refill);
  }

  private beginRun(id: MissionId | null, level = 0) {
    this.sim.seen = new Set(this.save.found);
    this.tune(false);
    this.sim.load(id, level);
    this.tune(true);
    this.deathsThisRun = 0;
    this.seenFalls = 0;
    this.sim.particleCap = this.settings.graphics === "low" ? 40 : this.settings.graphics === "high" ? 140 : 90;
  }

  private playCue(name: MusicCue) {
    this.music = name;
    this.audio.cue(name);
  }

  play() {
    this.resize();
    this.unlock();
    this.mission = null;
    this.level = null;
    this.lastStars = 0;
    this.lastReward = 0;
    this.beginRun(null);
    this.mode = "play";
    this.sim.lobby = false;
    this.audio.setZone("warehouse");
    this.playCue("warehouse");
    this.hooks.onScreen("play");
    this.hooks.onAnnounce("KILLER AALOO", "Eliminate 40 hostiles");
  }

  playMission(id: MissionId) {
    const idx = MISSION_ORDER.indexOf(id);
    if (idx < 0 || idx + 1 > this.save.campaign.unlocked) return;
    this.resize();
    this.unlock();
    this.mission = id;
    this.level = null;
    this.lastStars = 0;
    this.lastReward = 0;
    this.beginRun(id);
    this.mode = "play";
    this.sim.lobby = false;
    this.audio.setZone(id);
    this.playCue(id === "zero" ? "boss" : id);
    this.hooks.onScreen("play");
    const meta = MISSION_META[idx]!;
    this.hooks.onAnnounce(meta.name.toUpperCase(), meta.blurb);
  }

  playLevel(n: number) {
    const spec = levelDef(n);
    if (!spec || n > this.save.campaign.level) return;
    this.resize();
    this.unlock();
    this.mission = spec.theme;
    this.level = n;
    this.lastStars = 0;
    this.lastReward = 0;
    this.beginRun(spec.theme, n);
    this.mode = "play";
    this.sim.lobby = false;
    this.audio.setZone(spec.theme);
    const cueName = spec.theme === "zero" ? "base" : spec.theme;
    this.playCue(cueName);
    this.hooks.onScreen("play");
    this.hooks.onAnnounce(spec.name.toUpperCase(), this.sim.tease || spec.blurb);
  }

  playFrontier() {
    const rows = this.save.campaign.levels;
    const open = rows.findIndex((row, i) => i + 1 <= this.save.campaign.level && !row.done);
    const n = open >= 0 ? open + 1 : rows[29]?.done ? 1 : this.save.campaign.level;
    this.playLevel(Math.max(1, Math.min(30, n)));
  }

  pause() {
    if (this.mode !== "play") return;
    this.releaseInput();
    this.mode = "pause";
    this.audio.hold();
    this.audio.ui();
    this.hooks.onScreen("pause");
  }

  resume() {
    if (this.mode !== "pause") return;
    this.mode = "play";
    this.sim.lobby = false;
    this.unlock();
    this.playCue(this.music);
    this.audio.resumeZone();
    this.hooks.onScreen("play");
  }

  restart() {
    if (this.level) this.playLevel(this.level);
    else if (this.mission) this.playMission(this.mission);
    else this.play();
  }

  private retryLevel(lives: number) {
    if (!this.level) return;
    const spec = levelDef(this.level);
    if (!spec) return;
    const deaths = this.deathsThisRun + 1;
    this.beginRun(spec.theme, this.level);
    this.deathsThisRun = deaths;
    this.seenFalls = 0;
    this.sim.lives = Math.max(1, Math.min(2, lives));
    this.sim.controlLock = 0.55;
    this.mode = "play";
    this.sim.lobby = false;
    this.hooks.onScreen("play");
    this.hooks.onAnnounce("FROM THE START", `${this.sim.lives} ${this.sim.lives === 1 ? "life" : "lives"} left`);
  }

  continueRun() {
    if (this.mode !== "dead") return;
    this.sim.revive();
    this.mode = "play";
    this.sim.lobby = false;
    this.unlock();
    this.playCue(this.level === 30 || this.mission === "zero" ? "boss" : this.mission ?? "warehouse");
    this.hooks.onScreen("play");
    this.hooks.onAnnounce("CHECKPOINT", "Back in the fight");
  }

  nextMission() {
    if (this.level) {
      if (this.level >= 30) return;
      const next = this.level + 1;
      if (this.save.campaign.levels[this.level - 1]?.done) {
        this.save.campaign.level = Math.max(this.save.campaign.level, next);
        syncCampaign(this.save.campaign);
        writeSave(this.save);
        this.hooks.onSave(this.save);
      }
      this.playLevel(next);
      return;
    }
    if (!this.mission) return;
    const idx = MISSION_ORDER.indexOf(this.mission);
    const next = MISSION_ORDER[idx + 1];
    if (!next) return;
    this.playMission(next);
  }

  menu() {
    this.releaseInput();
    this.mission = null;
    this.level = null;
    this.mode = "menu";
    this.sim.lobby = true;
    this.audio.stopMusic();
    this.audio.setZone(null);
    this.sim.load(null);
    this.sim.setPoster(null);
    this.playCue("menu");
    this.hooks.onScreen("menu");
  }

  showPoster(id: CharId | null) {
    if (this.mode === "play") return;
    if (!id) {
      this.sim.setPoster(null);
      if (this.mode === "menu") this.playCue("menu");
      return;
    }
    const look = CHARACTERS[id];
    this.sim.setPoster(look.filter, look.accent);
    this.playCue("roster");
  }

  purchaseWeapon(index: number, stat: WeaponStat) {
    const result = buyWeapon(this.save, index, stat);
    if (!result.ok) return result;
    this.commitShop();
    this.audio.upgrade();
    return result;
  }

  purchasePlayer(stat: PlayerStat) {
    const result = buyPlayer(this.save, stat);
    if (!result.ok) return result;
    this.commitShop();
    this.audio.upgrade();
    return result;
  }

  purchaseCharacter(id: CharId) {
    const result = buyCharacter(this.save, id);
    if (!result.ok) return result;
    this.commitShop();
    this.audio.achieve();
    this.hooks.onAnnounce("OPERATIVE UNLOCKED", CHARACTERS[id].name);
    return result;
  }

  chooseCharacter(id: CharId) {
    if (!selectCharacter(this.save, id)) return false;
    this.commitShop();
    this.audio.ui();
    return true;
  }

  resetSettings() {
    this.applySettings({ ...DEFAULT_SETTINGS });
  }

  resetProgress() {
    const settings = this.save.settings;
    this.save = defaultSave();
    this.save.settings = settings;
    this.settings = settings;
    this.commitShop();
  }

  grant(n: number) {
    this.save.coins = Math.max(0, this.save.coins + Math.floor(n));
    writeSave(this.save);
    this.hooks.onSave(this.save);
  }

  adoptSave(next: SaveData) {
    this.save = next;
    this.settings = next.settings;
    this.audio.setMix(next.settings.master, next.settings.music, next.settings.sfx, next.settings.ui, next.settings.ambience);
    this.tune(false);
    writeSave(this.save);
    this.hooks.onSave(this.save);
  }

  private commitShop() {
    this.tune(false);
    const names = checkAchievements(this.save);
    writeSave(this.save);
    this.hooks.onSave(this.save);
    for (const name of names) {
      this.audio.achieve();
      this.hooks.onAnnounce("ACHIEVEMENT", name);
    }
  }

  dropPads() {
    this.touch = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
    this.latch = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
    this.jumpDowns = 0;
  }

  private releaseInput() {
    this.realKeys.clear();
    this.dropPads();
  }

  setHeld(action: keyof Held, down: boolean) {
    if (down) {
      if (action === "left" || action === "right") this.moveBias = action;
      if (!this.touch[action]) {
        this.latch[action] = true;
        if (action === "jump") this.jumpDowns++;
      }
      this.touch[action] = true;
    } else {
      this.touch[action] = false;
    }
  }

  setWide(on: boolean) {
    this.wide = on;
    this.resize();
    this.sim.snapFollow();
    this.audio.ui();
  }

  tap(action: "reload" | "swap") {
    this.taps[action] = true;
    this.audio.ui();
  }

  getRunStats(): RunStats {
    const kills = this.sim.kills;
    const coins = this.sim.runCoins;
    const score = kills * 100 + coins * 25 + (this.sim.bossDead ? 2000 : 0);
    const spec = this.level ? levelDef(this.level) : null;
    const meta = this.mission ? MISSION_META[MISSION_ORDER.indexOf(this.mission)] : null;
    return {
      kills,
      coins,
      score,
      hp: this.sim.player.hp,
      bossDown: this.sim.bossDead,
      mission: this.mission,
      level: this.level,
      missionName: spec?.name ?? meta?.name ?? "Killer Aaloo",
      stars: this.lastStars,
      reward: this.lastReward,
      campaignClear: Boolean((this.level === 30 || (!this.level && this.mission === "zero")) && this.sim.bossDead),
      goal: this.sim.killGoal,
      bossName: this.sim.bossLabel,
      nextTease: this.level && this.level < 30 ? teaseFor(this.level + 1) : "",
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVis);
    window.removeEventListener("resize", this.onResize);
    this.audio.stopMusic();
  }

  private resize() {
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    const cap = this.settings.graphics === "low" ? 1 : this.settings.graphics === "high" ? 2 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.canvas.width = Math.max(1, Math.floor(cssW * dpr));
    this.canvas.height = Math.max(1, Math.floor(cssH * dpr));
    const aspect = cssW / Math.max(1, cssH);
    const zoom = this.wide ? 1.8 : 1;
    let viewH = 380 * zoom;
    let viewW = viewH * aspect;
    const minW = 520 * zoom;
    if (viewW < minW) {
      viewW = minW;
      viewH = viewW / aspect;
    }
    if (viewW > WORLD_W) {
      viewW = WORLD_W;
      viewH = viewW / aspect;
    }
    if (viewH > WORLD_H) {
      viewH = WORLD_H;
      viewW = Math.min(WORLD_W, viewH * aspect);
    }
    this.sim.viewW = viewW;
    this.sim.viewH = viewH;
  }

  private sample(): { held: Held; edges: Edges } {
    const codes = new Set(this.realKeys);
    for (const c of this.qaKeys) codes.add(c);
    const held: Held = {
      left: this.touch.left || this.latch.left || codes.has("ArrowLeft") || codes.has("KeyA"),
      right: this.touch.right || this.latch.right || codes.has("ArrowRight") || codes.has("KeyD"),
      jump: this.touch.jump || this.latch.jump || codes.has("Space") || codes.has("ArrowUp") || codes.has("KeyW"),
      shoot: this.touch.shoot || this.latch.shoot || codes.has("KeyJ") || codes.has("KeyX") || codes.has("KeyK"),
      melee: this.touch.melee || this.latch.melee || codes.has("KeyQ"),
      grenade: this.touch.grenade || this.latch.grenade || codes.has("KeyG"),
      dash: this.touch.dash || this.latch.dash || codes.has("ShiftLeft") || codes.has("ShiftRight") || codes.has("KeyF"),
    };
    if (held.left && held.right) {
      if (this.moveBias === "left") held.right = false;
      else held.left = false;
    }
    const downs = this.jumpDowns;
    this.jumpDowns = 0;
    const edges: Edges = {
      jump: (held.jump && !this.prev.jump) || this.latch.jump || downs > 0,
      flip: downs >= 2,
      shoot: (held.shoot && !this.prev.shoot) || this.latch.shoot,
      reload: this.taps.reload,
      swap: this.taps.swap,
      dash: (held.dash && !this.prev.dash) || this.latch.dash,
      grenade: (held.grenade && !this.prev.grenade) || this.latch.grenade,
    };
    this.taps.reload = false;
    this.taps.swap = false;
    this.latch = { left: false, right: false, jump: false, shoot: false, melee: false, grenade: false, dash: false };
    this.prev = held;
    return { held, edges };
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0);
    this.last = now;
    this.audio.update();
    if (this.mode === "play") {
      this.sim.lobby = false;
      if (this.sim.slow > 0) this.sim.slow = Math.max(0, this.sim.slow - dt);
      const scale = this.sim.slow > 0 ? 0.4 : 1;
      if (this.sim.hitstop > 0) this.sim.hitstop = Math.max(0, this.sim.hitstop - dt);
      else {
        this.acc += dt * scale;
        let guard = 0;
        let { held, edges } = this.sample();
        while (this.acc >= STEP && guard++ < 5) {
          this.sim.step(STEP, held, edges);
          edges = EMPTY_EDGES;
          this.acc -= STEP;
        }
        this.consumeEvents();
      }
    } else {
      this.sample();
      this.sim.time += dt;
      if (this.mode === "menu") this.sim.lobby = true;
      else this.sim.lobby = false;
    }
    if (this.mode === "play") {
      if (this.sim.falls > this.seenFalls) {
        const lost = this.sim.falls - this.seenFalls;
        this.seenFalls = this.sim.falls;
        this.save.deaths += lost;
        this.deathsThisRun += lost;
      }
      this.save.playSeconds += dt;
      this.playAcc += dt;
      if (this.playAcc > 8) {
        this.playAcc = 0;
        writeSave(this.save);
      }
    }
    if (!this.settings.shake) this.sim.shake = 0;
    this.syncHud();
    this.drawGate++;
    if (this.settings.fps === 60 || this.drawGate % 2 === 0) this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private consumeEvents() {
    const events = this.sim.events.splice(0);
    for (const e of events) {
      if (e.t === "announce") this.hooks.onAnnounce(e.title, e.sub);
      if (e.t === "boss") this.playCue("boss");
      if (e.t === "dead") this.finish("dead");
      if (e.t === "life") this.retryLevel(e.lives);
      if (e.t === "win") this.finish("win");
    }
  }

  private finish(mode: "dead" | "win") {
    this.releaseInput();
    this.mode = mode;
    const stats = this.getRunStats();
    this.save.totalKills += this.sim.noteKillsBanked();
    if (mode === "dead") {
      this.save.deaths += 1;
      this.deathsThisRun += 1;
    }
    if (stats.kills > this.save.bestKills) this.save.bestKills = stats.kills;
    if (stats.score > this.save.bestScore) this.save.bestScore = stats.score;
    this.lastStars = 0;
    this.lastReward = 0;
    const unlockedBefore = (id: CharId) => charUnlocked(id, this.save.campaign.unlocked, this.save.bought);
    const had = new Set(CHARACTERS ? (["commando", "speedster", "tank", "gunner", "shadow"] as CharId[]).filter(unlockedBefore) : []);
    if (mode === "win" && this.level) {
      const stars = stats.hp >= 60 ? 3 : stats.hp >= 30 ? 2 : 1;
      const settled = settleLevel(this.save, this.level, {
        stars,
        kills: stats.kills,
        boss: this.sim.bossDead,
        score: stats.score,
        pickups: this.sim.freshCoins.slice(),
        clean: this.deathsThisRun === 0,
      });
      this.lastStars = stars;
      this.lastReward = settled.granted;
      for (const name of settled.achievements) this.hooks.onAnnounce("ACHIEVEMENT", name);
      for (const id of (["speedster", "tank", "gunner", "shadow"] as CharId[])) {
        if (!had.has(id) && charUnlocked(id, this.save.campaign.unlocked, this.save.bought)) {
          this.hooks.onAnnounce("OPERATIVE UNLOCKED", CHARACTERS[id].name);
        }
      }
    } else if (mode === "win" && this.mission) {
      const stars = stats.hp >= 60 ? 3 : stats.hp >= 30 ? 2 : 1;
      const settled = settleMission(this.save, this.mission, {
        stars,
        kills: stats.kills,
        boss: this.sim.bossDead,
        score: stats.score,
        pickups: this.sim.freshCoins.slice(),
        clean: this.deathsThisRun === 0,
      });
      this.lastStars = stars;
      this.lastReward = settled.granted;
      for (const name of settled.achievements) this.hooks.onAnnounce("ACHIEVEMENT", name);
      for (const id of (["speedster", "tank", "gunner", "shadow"] as CharId[])) {
        if (!had.has(id) && charUnlocked(id, this.save.campaign.unlocked, this.save.bought)) {
          this.hooks.onAnnounce("OPERATIVE UNLOCKED", CHARACTERS[id].name);
        }
      }
    } else if (mode === "win") {
      let grant = 0;
      for (const id of this.sim.freshCoins) {
        if (this.save.found.includes(id)) continue;
        this.save.found.push(id);
        grant += 5;
      }
      const extra = Math.max(0, stats.kills - this.save.warehouseKillsBest);
      grant += extra;
      this.save.warehouseKillsBest = Math.max(this.save.warehouseKillsBest, stats.kills);
      this.save.coins += grant;
      this.lastReward = grant;
    }
    for (const name of checkAchievements(this.save)) this.hooks.onAnnounce("ACHIEVEMENT", name);
    writeSave(this.save);
    this.hooks.onSave(this.save);
    this.playCue(mode === "win" ? "victory" : "defeat");
    this.hooks.onScreen(mode);
    if (this.settings.vibration && mode === "dead" && typeof navigator.vibrate === "function") navigator.vibrate(40);
  }

  private syncHud() {
    const p = this.sim.player;
    const hp = this.hud.hp;
    if (hp) hp.style.width = `${(p.hp / p.maxHp) * 100}%`;
    if (this.hud.hpText) this.hud.hpText.textContent = String(Math.ceil(p.hp));
    if (this.hud.kills) this.hud.kills.textContent = this.level ? `KILLS ${this.sim.kills}` : `KILLS ${this.sim.kills}/${this.sim.killGoal}`;
    if (this.hud.objective) this.hud.objective.textContent = this.sim.objective();
    if (this.hud.weapon) this.hud.weapon.textContent = this.sim.weaponName();
    if (this.hud.ammo) this.hud.ammo.textContent = "\u221e";
    if (this.hud.grenades) this.hud.grenades.textContent = String(p.grenades);
    if (this.hud.lives) this.hud.lives.textContent = String(this.sim.lives);
    if (this.hud.coins) {
      const pending = this.sim.runCoins;
      this.hud.coins.textContent = pending > 0 ? `${this.save.coins}+${pending}` : String(this.save.coins);
    }
    const boss = this.sim.boss();
    const showBoss = Boolean(boss) && (this.sim.levelNum === 0 || this.sim.bossCued);
    if (this.hud.boss) this.hud.boss.style.display = showBoss ? "block" : "none";
    if (this.hud.bossName) this.hud.bossName.textContent = this.sim.bossLabel;
    if (this.hud.bossFill && boss) this.hud.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    if (this.hud.vignette) {
      const a = !p.alive ? 0.55 : p.iframes > 0 ? 0.4 : p.hp < 35 ? 0.32 : 0;
      this.hud.vignette.style.opacity = String(a);
    }
  }

  private draw() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    const dpr = this.canvas.width / Math.max(1, cssW);
    render(ctx, this.sim, this.sprites, cssW, cssH, dpr);
  }

  private installProbe() {
    window.__controlsTest = {
      getYaw: () => this.sim.player.facing,
      getSpeed: () => this.sim.player.vx,
      getX: () => this.sim.player.x,
      setKeys: (codes: string[]) => {
        this.qaKeys = new Set(codes);
      },
      setSteer: () => {},
    };
    window.__bean = {
      kills: () => this.sim.kills,
      mode: () => this.mode,
      hp: () => this.sim.player.hp,
      y: () => this.sim.player.y,
      foes: () => this.sim.foes.filter((f) => f.alive).length,
      spots: () =>
        this.sim.foes
          .filter((f) => f.alive)
          .map((f) => ({ k: f.kind, x: Math.round(f.x), y: Math.round(f.y), hp: Math.round(f.hp) })),
      warp: (col: number) => this.sim.warp(col),
      fill: () => this.sim.fillKills(),
      guard: () => {
        const p = this.sim.player;
        p.alive = true;
        p.hp = 100;
        p.deadT = 0;
        p.iframes = 6;
        this.sim.deadSent = false;
        this.mode = "play";
      },
      playMission: (id: string) => this.playMission(id as MissionId),
      playLevel: (n: number) => this.playLevel(n),
      level: () => this.level,
      mapLevel: () => this.save.campaign.level,
      setMap: (n: number) => {
        this.save.campaign.level = Math.max(1, Math.min(30, Math.floor(n)));
        syncCampaign(this.save.campaign);
        writeSave(this.save);
        this.hooks.onSave(this.save);
      },
      levelDone: (n: number) => Boolean(this.save.campaign.levels[n - 1]?.done),
      levelStars: (n: number) => this.save.campaign.levels[n - 1]?.stars ?? 0,
      extract: () => this.sim.extractCol,
      theme: () => this.sim.theme,
      objective: () => this.sim.objective(),
      gens: () => this.sim.gens,
      ants: () => this.sim.ants,
      depot: () => this.sim.depotDown,
      bossLabel: () => this.sim.bossLabel,
      strike: (kind: string, dmg?: number) => this.sim.strike(kind, dmg),
      solid: (c: number, r: number) => this.sim.tiles[c + r * 120] ?? 0,
      vx: () => this.sim.player.vx,
      steam: () => this.sim.vents.some((v) => v.on),
      belts: () => this.sim.belts.length,
      grounded: () => this.sim.player.grounded,
      plat: () => Math.round(this.sim.plats[0]?.x ?? -1),
      unlock: () => this.save.campaign.unlocked,
      continue: () => this.continueRun(),
      mission: () => this.mission,
      drop: () => {
        const p = this.sim.player;
        p.hp = 0;
        p.alive = false;
        p.deadT = 0;
      },
      coins: () => this.save.coins,
      grant: (n: number) => this.grant(n),
      buyChar: (id: string) => this.purchaseCharacter(id as CharId).ok,
      pick: (id: string) => this.chooseCharacter(id as CharId),
      buyGun: (stat: string) => this.purchaseWeapon(0, stat as WeaponStat).ok,
      maxHp: () => this.sim.player.maxHp,
      gunDmg: () => this.sim.loadout.weapons[0]?.dmg ?? 0,
      charId: () => this.save.character,
      ach: () => this.save.achievements.slice(),
      cue: () => this.audio.currentCue(),
      audio: () => this.audio.debug(),
      runMul: () => this.sim.loadout.runMul,
      foeHp: () => this.sim.loadout.foeHp,
      armor: () => this.sim.loadout.armor,
      vy: () => this.sim.player.vy,
      hold: (action: string, down: boolean) => {
        if (action === "left" || action === "right" || action === "jump" || action === "shoot" || action === "melee" || action === "grenade" || action === "dash") {
          this.setHeld(action, down);
        }
      },
      next: () => this.nextMission(),
      lives: () => this.sim.lives,
      slow: () => this.sim.slow,
      fired: () => this.sim.shotsFired,
      bridges: () => this.sim.bridges.length,
      playFrontier: () => this.playFrontier(),
    };
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __bean?: {
      kills: () => number;
      mode: () => string;
      hp: () => number;
      y: () => number;
      foes: () => number;
      spots: () => { k: string; x: number; y: number; hp: number }[];
      warp: (col: number) => void;
      fill: () => void;
      guard: () => void;
      playMission?: (id: string) => void;
      playLevel?: (n: number) => void;
      level?: () => number | null;
      mapLevel?: () => number;
      setMap?: (n: number) => void;
      levelDone?: (n: number) => boolean;
      levelStars?: (n: number) => number;
      extract?: () => number;
      theme?: () => string;
      objective?: () => string;
      gens?: () => number;
      ants?: () => number;
      depot?: () => boolean;
      bossLabel?: () => string;
      strike?: (kind: string, dmg?: number) => boolean;
      solid?: (c: number, r: number) => number;
      vx?: () => number;
      steam?: () => boolean;
      belts?: () => number;
      grounded?: () => boolean;
      plat?: () => number;
      unlock?: () => number;
      continue?: () => void;
      mission?: () => string | null;
      drop?: () => void;
      coins?: () => number;
      grant?: (n: number) => void;
      buyChar?: (id: string) => boolean;
      pick?: (id: string) => boolean;
      buyGun?: (stat: string) => boolean;
      maxHp?: () => number;
      gunDmg?: () => number;
      charId?: () => string;
      ach?: () => string[];
      cue?: () => string;
      audio?: () => { cue: string; loaded: number; music: boolean; zone: string };
      runMul?: () => number;
      foeHp?: () => number;
      armor?: () => number;
      vy?: () => number;
      hold?: (action: string, down: boolean) => void;
      next?: () => void;
      lives?: () => number;
      slow?: () => number;
      fired?: () => number;
      bridges?: () => number;
      playFrontier?: () => void;
    };
  }
}
