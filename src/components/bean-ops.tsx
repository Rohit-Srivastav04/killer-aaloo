import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowUp,
  Award,
  Bomb,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flag,
  House,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  User,
  Volume2,
  VolumeX,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Mode, RunStats, ShadowStrike } from "@/game/engine";
import { MissionMap } from "@/components/mission-map";
import { DEFAULT_SETTINGS, importSave, readSave, type SaveData, type Settings } from "@/game/save";
import { t } from "@/game/i18n";
import {
  AchievementBoard,
  AboutNote,
  ConfirmBox,
  PlayerShop,
  PrivacyNote,
  Profile,
  Roster,
  SettingsPanel,
  WeaponShop,
} from "@/components/ops-panels";

type Overlay = Mode | "howto" | "settings" | "campaign" | "briefing" | "roster" | "shop" | "upgrades" | "profile" | "achievements" | "privacy" | "about" | "confirm";
type Stats = RunStats;

export function BeanOps() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ShadowStrike | null>(null);
  const hp = useRef<HTMLDivElement>(null);
  const hpText = useRef<HTMLSpanElement>(null);
  const kills = useRef<HTMLDivElement>(null);
  const ammo = useRef<HTMLDivElement>(null);
  const weapon = useRef<HTMLDivElement>(null);
  const grenades = useRef<HTMLSpanElement>(null);
  const coins = useRef<HTMLSpanElement>(null);
  const lives = useRef<HTMLSpanElement>(null);
  const boss = useRef<HTMLDivElement>(null);
  const bossName = useRef<HTMLSpanElement>(null);
  const bossFill = useRef<HTMLDivElement>(null);
  const objective = useRef<HTMLDivElement>(null);
  const vignette = useRef<HTMLDivElement>(null);
  const backRef = useRef<Overlay>("menu");

  const [overlay, setOverlay] = useState<Overlay>("menu");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [save, setSave] = useState<SaveData | null>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; sub: string } | null>(null);
  const [wide, setWide] = useState(false);
  const [result, setResult] = useState<Stats | null>(null);
  const [ready, setReady] = useState(false);
  const [confirm, setConfirm] = useState<"progress" | "settings" | null>(null);
  const wantPlay = useRef(false);
  const volMem = useRef({ sfx: 0.8, music: 0.45 });
  const sheetFrom = useRef<"menu" | "settings">("menu");
  const fingers = useRef<Map<number, "left" | "right" | "jump" | "shoot" | "melee" | "grenade" | "dash">>(new Map());
  const wideRef = useRef(false);
  wideRef.current = wide;
  const playingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stored = readSave();
    setSave(stored);
    setSettings(stored.settings);
    let dead = false;
    let game: ShadowStrike | null = null;
    void import("@/game/engine").then(({ ShadowStrike: Game }) => {
      if (dead) return;
      game = new Game(canvas, stored.settings, {
        onScreen: (mode) => {
          setOverlay(mode);
          if (mode === "dead" || mode === "win") setResult(gameRef.current?.getRunStats() ?? null);
        },
        onAnnounce: (title, sub) => setBanner({ id: Date.now(), title, sub }),
        onSave: (next) => setSave(next),
        onReady: () => setReady(true),
      });
      gameRef.current = game;
      game.bindHud({ hp: hp.current, hpText: hpText.current, kills: kills.current, ammo: ammo.current, weapon: weapon.current, grenades: grenades.current, coins: coins.current, lives: lives.current, boss: boss.current, bossName: bossName.current, bossFill: bossFill.current, objective: objective.current, vignette: vignette.current });
    });
    return () => {
      dead = true;
      game?.dispose();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !wantPlay.current) return;
    wantPlay.current = false;
    gameRef.current?.playFrontier();
  }, [ready]);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 2400);
    return () => window.clearTimeout(id);
  }, [banner]);

  useEffect(() => {
    gameRef.current?.bindHud({
      hp: hp.current,
      hpText: hpText.current,
      kills: kills.current,
      ammo: ammo.current,
      weapon: weapon.current,
      grenades: grenades.current,
      coins: coins.current,
      lives: lives.current,
      boss: boss.current,
      bossName: bossName.current,
      bossFill: bossFill.current,
      objective: objective.current,
      vignette: vignette.current,
    });
  });

  useEffect(() => {
    const lock = () => {
      const orient = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
      orient?.lock?.("landscape").catch(() => {});
    };
    lock();
    window.addEventListener("pointerdown", lock);
    return () => window.removeEventListener("pointerdown", lock);
  }, []);

  function startPlay() {
    const game = gameRef.current;
    if (!game) {
      wantPlay.current = true;
      return;
    }
    game.playFrontier();
  }

  function patch(partial: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      gameRef.current?.applySettings(next);
      return next;
    });
  }

  function toggleChannel(key: "sfx" | "music") {
    setSettings((prev) => {
      const cur = prev[key];
      let nextVal = 0;
      if (cur > 0.001) volMem.current[key] = cur;
      else nextVal = volMem.current[key] > 0.001 ? volMem.current[key] : key === "sfx" ? 0.8 : 0.45;
      const next = { ...prev, [key]: nextVal };
      gameRef.current?.applySettings(next);
      return next;
    });
  }

  const lang = settings.lang;
  const holds = ["left", "right", "jump", "shoot", "melee", "grenade", "dash"] as const;

  function syncPads() {
    const down = new Set(fingers.current.values());
    const game = gameRef.current;
    if (!game) return;
    let move: "left" | "right" | null = null;
    for (const action of fingers.current.values()) {
      if (action === "left" || action === "right") move = action;
    }
    for (const action of holds) {
      if (action === "left" || action === "right") game.setHeld(action, move === action);
      else game.setHeld(action, down.has(action));
    }
  }

  function padAction(target: EventTarget | null) {
    const el = (target as HTMLElement | null)?.closest?.("[data-act]");
    return el?.getAttribute("data-act") ?? "";
  }

  function onPadDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    gameRef.current?.unlock();
    const button = (e.target as HTMLElement | null)?.closest?.("button");
    if (button && !button.getAttribute("data-act")) gameRef.current?.clickUi();
    const act = padAction(e.target);
    if (!act) return;
    e.preventDefault();
    if (act === "pause") {
      fingers.current.clear();
      gameRef.current?.dropPads();
      gameRef.current?.pause();
      return;
    }
    if (act === "zoom") {
      const next = !wideRef.current;
      setWide(next);
      gameRef.current?.setWide(next);
      return;
    }
    if (act === "swap") {
      gameRef.current?.tap("swap");
      return;
    }
    if (act !== "left" && act !== "right" && act !== "jump" && act !== "shoot" && act !== "melee" && act !== "grenade" && act !== "dash") return;
    fingers.current.set(e.pointerId, act);
    syncPads();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  }

  function onPadUp(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    if (!fingers.current.has(e.pointerId)) return;
    fingers.current.delete(e.pointerId);
    syncPads();
  }

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const holds = new Set(["left", "right", "jump", "shoot", "melee", "grenade", "dash"]);
    const actAt = (x: number, y: number) => {
      for (const node of document.elementsFromPoint(x, y)) {
        const hit = node.closest?.("[data-act]");
        if (hit) return hit.getAttribute("data-act") ?? "";
      }
      return "";
    };
    const onStart = (e: TouchEvent) => {
      gameRef.current?.unlock();
      let eat = false;
      for (const t of Array.from(e.changedTouches)) {
        const act = actAt(t.clientX, t.clientY);
        if (!act) continue;
        eat = true;
        if (act === "pause") {
          fingers.current.clear();
          gameRef.current?.dropPads();
          gameRef.current?.pause();
          continue;
        }
        if (act === "zoom") {
          const next = !wideRef.current;
          setWide(next);
          gameRef.current?.setWide(next);
          continue;
        }
        if (act === "swap") {
          gameRef.current?.tap("swap");
          continue;
        }
        if (!holds.has(act)) continue;
        fingers.current.set(t.identifier, act as "left" | "right" | "jump" | "shoot" | "melee" | "grenade" | "dash");
      }
      if (eat) e.preventDefault();
      syncPads();
    };
    const onEnd = (e: TouchEvent) => {
      let changed = false;
      for (const t of Array.from(e.changedTouches)) {
        if (fingers.current.delete(t.identifier)) changed = true;
      }
      if (!changed) return;
      e.preventDefault();
      syncPads();
    };
    const onMove = (e: TouchEvent) => {
      if (!playingRef.current) return;
      e.preventDefault();
    };
    root.addEventListener("touchstart", onStart, { passive: false });
    root.addEventListener("touchend", onEnd, { passive: false });
    root.addEventListener("touchcancel", onEnd, { passive: false });
    root.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
      root.removeEventListener("touchmove", onMove);
    };
  }, []);

  useEffect(() => {
    if (overlay === "play") return;
    fingers.current.clear();
    gameRef.current?.dropPads();
  }, [overlay]);

  const showHud = overlay === "play" || overlay === "pause";
  const playing = overlay === "play";
  playingRef.current = playing;

  return (
    <div
      ref={rootRef}
      className="game-root"
      style={{ ["--pad-scale" as string]: String(settings.padScale), ["--pad-opacity" as string]: String(settings.padOpacity) }}
      onPointerDown={onPadDown}
      onPointerUp={onPadUp}
      onPointerCancel={onPadUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="world" />
      <div ref={vignette} className="vignette" />

      {showHud && (
        <>
          <header className="topbar">
            <div className="vitals">
              <div className="weapon-chip">
                <strong ref={weapon}>PISTOL</strong>
                <span ref={kills}>KILLS 0</span>
              </div>
            </div>
            <div className="kb-center">
              <b ref={ammo} className="mag">∞</b>
              <span className="heart" aria-hidden>♥</span>
              <b ref={hpText} className="hp-num">100</b>
            </div>
            <div className="obj">
              <div ref={objective} className="obj-sub">KILL THE BOSS</div>
              <div className="pouch">
                <span>★ <b ref={coins}>0</b></span>
                <span>LIFE <b ref={lives}>3</b></span>
                <span>NADE <b ref={grenades}>2</b></span>
              </div>
            </div>
          </header>
          <div ref={boss} className="bossbar" style={{ display: "none" }}>
            <span ref={bossName}>COMMANDER ZERO</span>
            <div className="boss-track">
              <i ref={bossFill} />
            </div>
          </div>
        </>
      )}

      {banner && playing && (
        <div className="banner" key={banner.id}>
          <strong>{banner.title}</strong>
          <span>{banner.sub}</span>
        </div>
      )}

      {playing && (
        <div className={`controls ${settings.hand === "left" ? "left-hand" : ""}`}>
          <div className="cluster left">
            <div role="button" className="pad move west" data-act="left" aria-label="Move left">
              <ChevronLeft />
            </div>
            <div role="button" className="pad move east" data-act="right" aria-label="Move right">
              <ChevronRight />
            </div>
          </div>
          <div role="button" className="pad pause" data-act="pause" aria-label="Pause">
            <Pause />
          </div>
          <div className="cluster right fight">
            <div role="button" className="pad mini" data-act="grenade" aria-label="Grenade">
              <Bomb />
            </div>
            <div role="button" className={`pad zoom${wide ? " on" : ""}`} data-act="zoom" aria-label={wide ? "Zoom in" : "Zoom out"}>
              {wide ? <ZoomIn /> : <ZoomOut />}
            </div>
            <div role="button" className="pad big jump" data-act="jump" aria-label="Jump">
              <ArrowUp />
            </div>
            <div role="button" className="pad big fire" data-act="shoot" aria-label="Shoot">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                  d="M4.5 9.2h9.4C15.6 6.6 17.4 5.6 19.2 5.6c1.5 0 2.3 1 2.3 2.2v8.4c0 1.2-.8 2.2-2.3 2.2-1.8 0-3.6-1-5.3-3.6H4.5a1.8 1.8 0 0 1-1.8-1.8v-1.8a1.8 1.8 0 0 1 1.8-1.8z"
                />
                <path fill="currentColor" opacity="0.35" d="M5.2 10.6h7.2v2.8H5.2z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {overlay !== "play" && (
        <div className={`overlay ${overlay}`}>
          {overlay === "menu" && (
            <section className="lobby">
              <h1 className="brand-name">Killer Aaloo</h1>
              <header className="lobby-top">
                <div className="lobby-brand">
                  <img src="/killer-aaloo-icon.jpg" alt="" />
                  <div>
                    <strong>KILLER AALOO</strong>
                    <p>FACTORY RAID · {save?.campaign.levels.filter((row) => row.done).length ?? 0}/30</p>
                  </div>
                </div>
                <div className="lobby-side">
                  <div className="lobby-pills">
                    <span><small>COINS</small><b>{save?.coins ?? 0}</b></span>
                    <span><small>SCORE</small><b>{save?.bestScore ?? 0}</b></span>
                    <span><small>KILLS</small><b>{save?.bestKills ?? 0}</b></span>
                  </div>
                  <button type="button" className="lobby-gear" aria-label="Settings" onClick={() => { backRef.current = "menu"; setOverlay("settings"); }}>
                    <SettingsIcon />
                  </button>
                </div>
              </header>
              <footer className="lobby-bottom">
                <nav className="lobby-nav" aria-label="Lobby">
                  <button type="button" onClick={() => { gameRef.current?.showPoster(save?.character ?? "commando"); setOverlay("roster"); }}>
                    <User /> Character
                  </button>
                  <button type="button" onClick={() => setOverlay("shop")}>
                    <Crosshair /> Weapons
                  </button>
                  <button type="button" onClick={() => setOverlay("upgrades")}>
                    <Zap /> Upgrades
                  </button>
                  <button type="button" onClick={() => { backRef.current = "menu"; setOverlay("campaign"); }}>
                    <Flag /> Levels
                  </button>
                  <button type="button" onClick={() => setOverlay("achievements")}>
                    <Award /> Records
                  </button>
                  <button type="button" onClick={() => { backRef.current = "menu"; setOverlay("howto"); }}>
                    <BookOpen /> Controls
                  </button>
                </nav>
                <div className="lobby-start">
                  <button type="button" className="lobby-mode" onClick={() => { backRef.current = "menu"; setOverlay("campaign"); }}>
                    <em>RAID</em>
                    <strong>LEVEL {save?.campaign.level ?? 1}</strong>
                  </button>
                  <button type="button" className="lobby-play" aria-busy={!ready} onClick={startPlay}>
                    <Play /> {(save?.campaign.level ?? 1) > 1 || save?.campaign.levels.some((row) => row.done) ? "CONTINUE" : "PLAY"}
                  </button>
                </div>
              </footer>
            </section>
          )}

          {overlay === "howto" && (
            <section className="card">
              <h2>How to play</h2>
              <ul className="help">
                <li>One tap is a straight jump. A fast double tap flips and carries you onto the tall roofs. A single tap will not reach those.</li>
                <li>Dash (gold button, Shift, or F) bursts forward on the ground or in the air. Double-tap a direction also dodges.</li>
                <li>Tap fire for one shot, or hold it for a steady stream. Ammo does not run out and there is no reload.</li>
                <li>Jump and fire work together. The swap button changes weapon while you move.</li>
                <li>Three lives. A death sends you back to the first step of that same level. There is no ad revive and no checkpoint.</li>
                <li>Play jumps into the next unfinished level. Level select replays any level you already unlocked. Kill that level's boss to win.</li>
              </ul>
              <button type="button" className="go" onClick={() => setOverlay(backRef.current)}>
                Back
              </button>
            </section>
          )}

          {overlay === "settings" && save && (
            <SettingsPanel
              settings={settings}
              onChange={patch}
              onBack={() => setOverlay(backRef.current === "pause" ? "pause" : "menu")}
              onPrivacy={() => { sheetFrom.current = "settings"; setOverlay("privacy"); }}
              onAbout={() => { sheetFrom.current = "settings"; setOverlay("about"); }}
              onProfile={() => setOverlay("profile")}
            />
          )}

          {overlay === "roster" && save && (
            <Roster save={save} lang={lang} game={gameRef.current} onBack={() => { gameRef.current?.showPoster(null); setOverlay("menu"); }} />
          )}

          {overlay === "shop" && save && <WeaponShop save={save} lang={lang} game={gameRef.current} onBack={() => setOverlay(backRef.current === "pause" ? "pause" : "menu")} />}

          {overlay === "upgrades" && save && <PlayerShop save={save} lang={lang} game={gameRef.current} onBack={() => setOverlay("menu")} />}

          {overlay === "profile" && save && (
            <Profile
              save={save}
              lang={lang}
              onBack={() => setOverlay("settings")}
              onResetSettings={() => {
                setConfirm("settings");
                setOverlay("confirm");
              }}
              onResetProgress={() => {
                setConfirm("progress");
                setOverlay("confirm");
              }}
              onImport={(raw) => {
                const next = importSave(raw);
                if (!next) return;
                gameRef.current?.adoptSave(next);
                setSettings(next.settings);
              }}
            />
          )}

          {overlay === "achievements" && save && <AchievementBoard save={save} lang={lang} onBack={() => setOverlay("menu")} />}

          {overlay === "privacy" && <PrivacyNote lang={lang} onBack={() => setOverlay(sheetFrom.current)} />}

          {overlay === "about" && <AboutNote onBack={() => setOverlay(sheetFrom.current)} />}

          {overlay === "confirm" && (
            <ConfirmBox
              lang={lang}
              title={confirm === "progress" ? "Erase the campaign?" : "Reset settings?"}
              body={confirm === "progress" ? "Coins, missions, characters, upgrades, and achievements go back to the start. This cannot be undone." : "Volumes, difficulty, and controls return to defaults. Progress stays."}
              onYes={() => {
                if (confirm === "progress") gameRef.current?.resetProgress();
                else {
                  gameRef.current?.resetSettings();
                  setSettings({ ...DEFAULT_SETTINGS });
                }
                setOverlay("menu");
              }}
              onNo={() => setOverlay("profile")}
            />
          )}

          {overlay === "campaign" && save && (
            <MissionMap
              save={save}
              onBack={() => {
                const back = backRef.current;
                setOverlay(back === "pause" || back === "win" || back === "dead" ? back : "menu");
              }}
              onPlay={(n) => gameRef.current?.playLevel(n)}
            />
          )}

          {overlay === "pause" && (
            <section className="card">
              <h2>Paused</h2>
              <button type="button" className="go" onClick={() => gameRef.current?.resume()}>
                <Play /> Resume
              </button>
              <button type="button" className="go alt" onClick={() => gameRef.current?.restart()}>
                <RotateCcw /> Restart level
              </button>
              <div className="row">
                <button type="button" onClick={() => toggleChannel("sfx")}>
                  {settings.sfx > 0.001 ? <Volume2 /> : <VolumeX />} Sound {settings.sfx > 0.001 ? "on" : "off"}
                </button>
                <button type="button" onClick={() => toggleChannel("music")}>
                  {settings.music > 0.001 ? <Volume2 /> : <VolumeX />} Music {settings.music > 0.001 ? "on" : "off"}
                </button>
              </div>
              <div className="row">
                <button type="button" onClick={() => { backRef.current = "pause"; setOverlay("howto"); }}>
                  <BookOpen /> Controls
                </button>
                <button type="button" onClick={() => { backRef.current = "pause"; setOverlay("settings"); }}>
                  <SettingsIcon /> Settings
                </button>
              </div>
              <button type="button" onClick={() => gameRef.current?.menu()}>
                <House /> Main menu
              </button>
            </section>
          )}

          {(overlay === "dead" || overlay === "win") && (
            <section className="card">
              <p className="eyebrow">
                {overlay === "win" ? "MISSION COMPLETED" : "MISSION FAILED"}
              </p>
              <h2>{overlay === "win" ? result?.missionName ?? "Killer Aaloo" : "You were defeated"}</h2>
              <p className="blurb">
                Kills {result?.kills ?? 0}
                {result?.bossDown ? ` · ${result.bossName} down` : ""}
                {overlay === "win" ? ` · Stars ${result?.stars ?? 0}/3 · +${result?.reward ?? 0} coins` : ""}
              </p>
              {overlay === "win" && result?.level && !result.campaignClear && (
                <p className="blurb">
                  Saved. Level {Math.min(30, result.level + 1)} is open.
                  {result.nextTease ? ` Next: ${result.nextTease}.` : ""} Replay any earlier level whenever you want.
                </p>
              )}
              {overlay === "win" && result?.campaignClear && (
                <p className="blurb">Killer Aaloo is over. Coins banked {save?.coins ?? 0}. Every level stays open.</p>
              )}
              {overlay === "dead" && (
                <>
                  <p className="blurb">
                    {result?.level
                      ? `Three lives, all gone. Level ${result.level} starts again from the first step. No extra life in this build.`
                      : "Three lives, all gone. This run starts again from the beginning."}
                  </p>
                  <button type="button" className="go" onClick={() => gameRef.current?.restart()}>
                    <RotateCcw /> Retry
                  </button>
                </>
              )}
              {overlay === "win" && result?.level && result.level < 30 && !result.campaignClear && (
                <button type="button" className="go" onClick={() => gameRef.current?.nextMission()}>
                  <Flag /> Next level
                </button>
              )}
              <button type="button" className="go alt" onClick={() => { backRef.current = overlay; setOverlay("campaign"); }}>
                <Flag /> Level select
              </button>
              {overlay === "win" && (
                <button type="button" className="go alt" onClick={() => gameRef.current?.restart()}>
                  <RotateCcw /> Replay
                </button>
              )}
              <button type="button" onClick={() => gameRef.current?.menu()}>
                <House /> Home
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
