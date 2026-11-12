export type MusicCue =
  | "menu"
  | "roster"
  | "warehouse"
  | "city"
  | "factory"
  | "base"
  | "desert"
  | "boss"
  | "victory"
  | "defeat";

export type Surface = "concrete" | "metal" | "sand" | "wood" | "flesh" | "ricochet";

const MUSIC: Record<MusicCue, string> = {
  menu: "menu",
  roster: "roster",
  warehouse: "warehouse",
  city: "city",
  factory: "factory",
  base: "base",
  desert: "desert",
  boss: "boss",
  victory: "victory",
  defeat: "defeat",
};

const ZONE: Record<string, string> = {
  warehouse: "warehouse",
  city: "city",
  factory: "factory",
  base: "base",
  desert: "desert",
  zero: "base",
};

const FILES: [string, string][] = [
  ["music/menu", "/audio/music/menu.ogg?v=2"],
  ["music/roster", "/audio/music/roster.ogg?v=2"],
  ["music/warehouse", "/audio/music/warehouse.ogg?v=2"],
  ["music/city", "/audio/music/city.ogg?v=2"],
  ["music/factory", "/audio/music/factory.ogg?v=2"],
  ["music/base", "/audio/music/base.ogg?v=2"],
  ["music/desert", "/audio/music/desert.ogg?v=2"],
  ["music/boss", "/audio/music/boss.ogg?v=2"],
  ["music/boss-low", "/audio/music/boss-low.ogg?v=2"],
  ["music/victory", "/audio/music/victory.ogg?v=2"],
  ["music/defeat", "/audio/music/defeat.ogg?v=2"],
  ["music/deploy", "/audio/music/deploy.ogg?v=2"],
  ["music/boss-intro", "/audio/music/boss-intro.ogg?v=2"],
  ["amb/city", "/audio/amb/city.ogg?v=2"],
  ["amb/factory", "/audio/amb/factory.ogg?v=2"],
  ["amb/base", "/audio/amb/base.ogg?v=2"],
  ["amb/desert", "/audio/amb/desert.ogg?v=2"],
  ["amb/warehouse", "/audio/amb/warehouse.ogg?v=2"],
  ...["pistol", "rifle", "shotgun"].flatMap((w) => [1, 2, 3].map((i) => [`sfx/${w}-${i}`, `/audio/sfx/${w}-${i}.ogg?v=2`] as [string, string])),
  ["sfx/foe-1", "/audio/sfx/foe-1.ogg?v=2"],
  ["sfx/foe-2", "/audio/sfx/foe-2.ogg?v=2"],
  ["sfx/reload", "/audio/sfx/reload.ogg?v=2"],
  ["sfx/swap", "/audio/sfx/swap.ogg?v=2"],
  ["sfx/empty", "/audio/sfx/empty.ogg?v=2"],
  ["sfx/shell", "/audio/sfx/shell.ogg?v=2"],
  ["sfx/whiz", "/audio/sfx/whiz.ogg?v=2"],
  ["sfx/boom", "/audio/sfx/boom.ogg?v=2"],
  ...["metal", "concrete", "wood", "flesh", "ricochet"].flatMap((k) => [
    [`sfx/${k}`, `/audio/sfx/${k}.ogg?v=2`] as [string, string],
    [`sfx/${k}-b`, `/audio/sfx/${k}-b.ogg?v=2`] as [string, string],
  ]),
  ...["concrete", "metal", "sand"].flatMap((s) => [
    [`sfx/step-${s}`, `/audio/sfx/step-${s}.ogg?v=2`] as [string, string],
    [`sfx/run-${s}`, `/audio/sfx/run-${s}.ogg?v=2`] as [string, string],
  ]),
  ["sfx/jump", "/audio/sfx/jump.ogg?v=2"],
  ["sfx/land", "/audio/sfx/land.ogg?v=2"],
  ["sfx/hurt", "/audio/sfx/hurt.ogg?v=2"],
  ["sfx/die", "/audio/sfx/die.ogg?v=2"],
  ["sfx/dash", "/audio/sfx/dash.ogg?v=2"],
  ["sfx/melee", "/audio/sfx/melee.ogg?v=2"],
  ["sfx/low", "/audio/sfx/low.ogg?v=2"],
  ["sfx/alert", "/audio/sfx/alert.ogg?v=2"],
  ["sfx/foe-step", "/audio/sfx/foe-step.ogg?v=2"],
  ["sfx/foe-die", "/audio/sfx/foe-die.ogg?v=2"],
  ["sfx/boss-hit", "/audio/sfx/boss-hit.ogg?v=2"],
  ["sfx/boss-phase", "/audio/sfx/boss-phase.ogg?v=2"],
  ["sfx/boss-down", "/audio/sfx/boss-down.ogg?v=2"],
  ["sfx/click", "/audio/sfx/click.ogg?v=2"],
  ["sfx/back", "/audio/sfx/back.ogg?v=2"],
  ["sfx/deny", "/audio/sfx/deny.ogg?v=2"],
  ["sfx/coin", "/audio/sfx/coin.ogg?v=2"],
  ["sfx/reward", "/audio/sfx/reward.ogg?v=2"],
  ["sfx/achieve", "/audio/sfx/achieve.ogg?v=2"],
  ["sfx/unlock", "/audio/sfx/unlock.ogg?v=2"],
];

type Stem = { src: AudioBufferSourceNode; gain: GainNode };

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private music: Stem | null = null;
  private amb: Stem | null = null;
  private musicOn = false;
  private cueName: MusicCue = "menu";
  private zone = "";
  private pending: MusicCue | null = null;
  private bossTimer = 0;
  private sfxVol = 0.8;
  private musicVol = 0.45;
  private uiVol = 0.75;
  private ambVol = 0.4;
  private masterVol = 1;
  private voices = 0;
  private last: Record<string, number> = {};

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      const ctx = new AC({ latencyHint: "interactive" });
      this.ctx = ctx;
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      const ui = ctx.createGain();
      const amb = ctx.createGain();
      const duckGain = ctx.createGain();
      duckGain.gain.value = 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 10;
      comp.ratio.value = 3;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;
      duckGain.connect(music);
      music.connect(master);
      sfx.connect(master);
      ui.connect(master);
      amb.connect(master);
      master.connect(comp);
      comp.connect(ctx.destination);
      this.master = master;
      this.musicBus = music;
      this.sfxBus = sfx;
      this.uiBus = ui;
      this.ambBus = amb;
      this.duckGain = duckGain;
      this.applyGains();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (!this.loading) this.loading = this.loadAll();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  suspend() {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }

  setVolumes(music: number, sfx: number) {
    this.setMix(this.masterVol, music, sfx, this.uiVol, this.ambVol);
  }

  setMix(master: number, music: number, sfx: number, ui = this.uiVol, amb = this.ambVol) {
    this.masterVol = master;
    this.musicVol = music;
    this.sfxVol = sfx;
    this.uiVol = ui;
    this.ambVol = amb;
    this.applyGains();
  }

  private curve(channel: number) {
    const v = channel * this.masterVol;
    return v * v;
  }

  private applyGains() {
    const now = this.ctx?.currentTime ?? 0;
    this.musicBus?.gain.setTargetAtTime(this.curve(this.musicVol), now, 0.03);
    this.sfxBus?.gain.setTargetAtTime(this.curve(this.sfxVol), now, 0.03);
    this.uiBus?.gain.setTargetAtTime(this.curve(this.uiVol), now, 0.03);
    this.ambBus?.gain.setTargetAtTime(this.curve(this.ambVol) * 0.55, now, 0.03);
  }

  currentCue() {
    return this.cueName;
  }

  debug() {
    return { cue: this.cueName, loaded: this.buffers.size, music: this.musicOn, zone: this.zone };
  }

  cue(name: MusicCue) {
    this.unlock();
    if (this.musicOn && this.cueName === name && (this.music || this.pending === name)) return;
    this.cueName = name;
    this.musicOn = true;
    if (name === "victory" || name === "defeat") this.setZone(null);
    if (!this.buffers.has(`music/${MUSIC[name]}`)) {
      this.pending = name;
      return;
    }
    this.pending = null;
    this.startCue(name);
  }

  startMusic() {
    this.cue(this.cueName === "defeat" || this.cueName === "victory" ? "warehouse" : this.cueName);
  }

  stopMusic() {
    this.musicOn = false;
    this.pending = null;
    window.clearTimeout(this.bossTimer);
    this.stopStem(this.music);
    this.music = null;
  }

  hold() {
    this.stopMusic();
    this.stopStem(this.amb);
    this.amb = null;
  }

  resumeZone() {
    if (this.zone) this.playAmb(this.zone);
  }

  setZone(zone: string | null) {
    const id = zone ? ZONE[zone] ?? "" : "";
    if (id === this.zone && (id === "" || this.amb)) return;
    this.zone = id;
    this.stopStem(this.amb);
    this.amb = null;
    if (id) this.playAmb(id);
  }

  update() {
    /* sample playback is scheduled on the audio clock */
  }

  gun(kind: number, from: "player" | "foe" = "player") {
    const key = from === "foe" ? "foe" : kind === 2 ? "shotgun" : kind === 1 ? "rifle" : "pistol";
    if (!this.allow(from + key, from === "foe" ? 0.09 : kind === 1 ? 0.03 : 0.036)) return;
    const ids = from === "foe" ? ["foe-1", "foe-2"] : [`${key}-1`, `${key}-2`, `${key}-3`];
    this.sfx(ids[Math.floor(Math.random() * ids.length)]!, from === "foe" ? 0.42 : kind === 2 ? 0.9 : 0.72, 0.96 + Math.random() * 0.08, 0, true);
    if (from === "player") {
      this.sfx("shell", 0.22, 0.9 + Math.random() * 0.2, 0.045);
      this.duck();
    }
  }

  empty() {
    this.sfx("empty", 0.4);
  }

  reload() {
    this.sfx("reload", 0.55);
  }

  swap() {
    this.sfx("swap", 0.5);
  }

  impact(surface: Surface = "concrete") {
    if (!this.allow(surface, surface === "flesh" ? 0.04 : 0.03)) return;
    const alt = Math.random() < 0.5 ? "" : "-b";
    this.sfx(surface + alt, surface === "flesh" ? 0.55 : 0.4, 0.92 + Math.random() * 0.16);
  }

  whiz() {
    if (!this.allow("whiz", 0.08)) return;
    this.sfx("whiz", 0.28, 0.9 + Math.random() * 0.25);
  }

  jump() {
    this.sfx("jump", 0.4, 0.96 + Math.random() * 0.08);
  }

  land() {
    if (!this.allow("land", 0.08)) return;
    this.sfx("land", 0.45);
  }

  step(run = false, theme = "city") {
    if (!this.allow("step", run ? 0.16 : 0.22)) return;
    const surface = theme === "desert" ? "sand" : theme === "factory" || theme === "warehouse" ? "metal" : "concrete";
    this.sfx(`${run ? "run" : "step"}-${surface}`, run ? 0.38 : 0.3, 0.92 + Math.random() * 0.12);
  }

  foeStep() {
    if (!this.allow("foestep", 0.2)) return;
    this.sfx("foe-step", 0.28, 0.9 + Math.random() * 0.15);
  }

  hurt() {
    this.sfx("hurt", 0.55, 0.96 + Math.random() * 0.06, 0, true);
  }

  low() {
    if (!this.allow("low", 1.2)) return;
    this.uiPlay("low", 0.45);
  }

  die() {
    this.sfx("die", 0.7, 1, 0, true);
  }

  foeDie() {
    if (!this.allow("foedie", 0.06)) return;
    this.sfx("foe-die", 0.5);
  }

  bossHit() {
    if (!this.allow("bosshit", 0.08)) return;
    this.sfx("boss-hit", 0.6, 1, 0, true);
  }

  bossPhase() {
    window.clearTimeout(this.bossTimer);
    this.sfx("boss-phase", 0.75, 1, 0, true);
    if (this.cueName === "boss") this.playLoop("boss-low", true);
  }

  warnPhase() {
    this.sfx("boss-phase", 0.55, 1.04, 0, true);
  }

  bossDown() {
    this.sfx("boss-down", 0.8, 1, 0, true);
  }

  boom() {
    if (!this.allow("boom", 0.08)) return;
    this.sfx("boom", 0.72, 0.94 + Math.random() * 0.08, 0, true);
    this.duck();
  }

  alert() {
    if (!this.allow("alert", 0.5)) return;
    this.sfx("alert", 0.4);
  }

  dash() {
    this.sfx("dash", 0.45);
  }

  pickup(kind: "coin" | "item" = "item") {
    this.uiPlay(kind === "coin" ? "coin" : "reward", kind === "coin" ? 0.45 : 0.4);
  }

  melee() {
    this.sfx("melee", 0.55);
  }

  ui() {
    if (!this.allow("ui", 0.04)) return;
    this.uiPlay("click", 0.4);
  }

  back() {
    this.uiPlay("back", 0.4);
  }

  deny() {
    this.uiPlay("deny", 0.45);
  }

  upgrade() {
    this.uiPlay("unlock", 0.55);
  }

  achieve() {
    this.uiPlay("achieve", 0.6);
  }

  private async loadAll() {
    const first = FILES.slice(0, 16);
    const rest = FILES.slice(16);
    await Promise.all(first.map(([id, url]) => this.loadOne(id, url)));
    if (this.pending && this.musicOn && !this.music) this.startCue(this.pending);
    if (this.zone && !this.amb) this.playAmb(this.zone);
    await Promise.all(rest.map(([id, url]) => this.loadOne(id, url)));
    if (this.pending && this.musicOn && !this.music) this.startCue(this.pending);
  }

  private async loadOne(id: string, url: string) {
    if (!this.ctx || this.buffers.has(id)) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const raw = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(raw.slice(0));
      this.buffers.set(id, buf);
    } catch {
      /* keep the game playable if one asset fails */
    }
  }

  private startCue(name: MusicCue) {
    this.pending = null;
    window.clearTimeout(this.bossTimer);
    const loop = name !== "victory" && name !== "defeat";
    if (name === "boss") {
      this.playLoop("boss-intro", false, 0.9);
      const wait = Math.max(0.4, (this.buffers.get("music/boss-intro")?.duration ?? 1) - 0.05);
      this.bossTimer = window.setTimeout(() => {
        if (this.musicOn && this.cueName === "boss") this.playLoop("boss", true);
      }, wait * 1000);
      return;
    }
    if (loop && name !== "menu" && name !== "roster") this.playOne("music/deploy", this.duckGain, 0.35);
    this.playLoop(MUSIC[name], loop, name === "victory" || name === "defeat" ? 0.85 : 1);
  }

  private playLoop(id: string, loop: boolean, gain = 1) {
    this.playStem("music/" + id, loop, gain, true);
  }

  private playAmb(id: string) {
    if (this.amb) return;
    const stem = this.spawn("amb/" + id, this.ambBus, 1, 1, 0, true);
    this.amb = stem;
  }

  private playStem(id: string, loop: boolean, gain: number, replace: boolean) {
    if (replace) {
      this.stopStem(this.music);
      this.music = null;
    }
    const stem = this.spawn(id, this.duckGain, gain, 1, 0, loop);
    if (stem) this.music = stem;
  }

  private playOne(id: string, bus: GainNode | null, gain: number) {
    this.spawn(id, bus, gain, 1, 0, false);
  }

  private sfx(id: string, gain: number, rate = 1, delay = 0, priority = false) {
    if (this.voices > 20 && !priority) return;
    this.spawn("sfx/" + id, this.sfxBus, gain, rate, delay, false);
  }

  private uiPlay(id: string, gain: number) {
    this.spawn("sfx/" + id, this.uiBus, gain, 1, 0, false);
  }

  private spawn(id: string, bus: GainNode | null, gain: number, rate: number, delay: number, loop: boolean): Stem | null {
    const ctx = this.ctx;
    const buf = this.buffers.get(id);
    if (!ctx || !bus || !buf) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    const t = ctx.currentTime + Math.max(0, delay);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t + 0.015);
    src.connect(g);
    g.connect(bus);
    src.start(t);
    if (!loop) {
      this.voices++;
      src.onended = () => {
        this.voices = Math.max(0, this.voices - 1);
        src.disconnect();
        g.disconnect();
      };
    }
    return { src, gain: g };
  }

  private stopStem(stem: Stem | null) {
    if (!stem || !this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      stem.gain.gain.cancelScheduledValues(t);
      stem.gain.gain.setValueAtTime(Math.max(0.0001, stem.gain.gain.value), t);
      stem.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      stem.src.stop(t + 0.07);
    } catch {
      /* already stopped */
    }
  }

  private duck() {
    if (!this.duckGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setValueAtTime(Math.max(0.45, this.duckGain.gain.value), t);
    this.duckGain.gain.linearRampToValueAtTime(0.62, t + 0.02);
    this.duckGain.gain.linearRampToValueAtTime(1, t + 0.22);
  }

  private allow(name: string, gap: number) {
    const now = this.ctx?.currentTime ?? 0;
    if (now - (this.last[name] ?? -10) < gap) return false;
    this.last[name] = now;
    return true;
  }
}
