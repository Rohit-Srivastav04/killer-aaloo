import { useState } from "react";
import { CHAR_ORDER, CHARACTERS, PLAYER_STATS, charUnlocked, playerPrice, weaponPrice, type CharId, type PlayerStat, type WeaponStat } from "@/game/roster";
import { ACHIEVEMENTS } from "@/game/economy";
import { type MissionId } from "@/game/campaign";
import { t, type Lang } from "@/game/i18n";
import type { SaveData, Settings } from "@/game/save";
import type { ShadowStrike } from "@/game/engine";

const GUNS = ["Pistol", "Rifle", "Shotgun"];
const BRIEFS: Record<MissionId | "warehouse", { title: string; no: string; text: string; goal: string; tip: string }> = {
  warehouse: {
    title: "Warehouse Raid",
    no: "Quick strike",
    text: "A short raid on the docks warehouse. Forty hostiles, then the blast door.",
    goal: "Clear the warehouse and drop the defender.",
    tip: "Tap fire as fast as you want. Ammo does not run out.",
  },
  city: {
    title: "City Chaos",
    no: "Mission 01",
    text: "Dusk streets and rooftops. Squads will reinforce once you push the avenue.",
    goal: "Clear the squads, drop the Street Boss, reach extraction.",
    tip: "Use the grates to shoot down onto the street.",
  },
  factory: {
    title: "Factory Mayhem",
    no: "Mission 02",
    text: "Belts drag you, steam vents pulse, and a platform bridges the gap.",
    goal: "Destroy three generators, then the Foreman.",
    tip: "Step off a vent when the plume rises.",
  },
  base: {
    title: "Military Base",
    no: "Mission 03",
    text: "Turrets watch the lanes. Smash the antennas and the alarm brings elites.",
    goal: "Silence both antennas, drop the Gate Warden, reach the exit.",
    tip: "Turrets do not chase. Flank them.",
  },
  desert: {
    title: "Desert Strike",
    no: "Mission 04",
    text: "The spans collapse if you stand on them. Snipers hold the high grates.",
    goal: "Burn the supply depot and drop the Dune Commander.",
    tip: "Cross a bridge. Do not wait on it.",
  },
  zero: {
    title: "Commander Zero",
    no: "Mission 05",
    text: "The arena has three phases. Floor marks mean an area blast.",
    goal: "Defeat Commander Zero.",
    tip: "Phase 3 grenades are telegraphed. Move.",
  },
};

export function Briefing({
  id,
  lang,
  onStart,
  onBack,
}: {
  id: MissionId | "warehouse";
  lang: Lang;
  onStart: () => void;
  onBack: () => void;
}) {
  const brief = BRIEFS[id];
  return (
    <section className="card brief-card">
      <p className="eyebrow">{brief.no}</p>
      <h2>{brief.title}</h2>
      <div className={`swatch wide ${id === "warehouse" ? "city" : id}`} />
      <p className="blurb">{brief.text}</p>
      <p className="meta">Objective: {brief.goal}</p>
      <p className="meta">Tip: {brief.tip}</p>
      <button type="button" className="go" onClick={onStart}>
        {t(lang, "start")}
      </button>
      <button type="button" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

export function Roster({
  save,
  lang,
  onBack,
  game,
}: {
  save: SaveData;
  lang: Lang;
  onBack: () => void;
  game: ShadowStrike | null;
}) {
  const [id, setId] = useState<CharId>(save.character);
  const [msg, setMsg] = useState("");
  const [ask, setAsk] = useState(false);
  const def = CHARACTERS[id];
  const open = charUnlocked(id, save.campaign.unlocked, save.bought);
  const selected = save.character === id;
  return (
    <section className="card">
      <p className="eyebrow">{t(lang, "roster")}</p>
      <h2>{def.name}</h2>
      <div className="roster-row">
        {CHAR_ORDER.map((cid) => (
          <button
            key={cid}
            type="button"
            className={`chip ${cid === id ? "selected" : ""} ${charUnlocked(cid, save.campaign.unlocked, save.bought) ? "" : "locked"}`}
            onClick={() => {
              setId(cid);
              setMsg("");
              setAsk(false);
              game?.showPoster(cid);
            }}
          >
            {CHARACTERS[cid].name}
          </button>
        ))}
      </div>
      <p className="blurb">{def.blurb}</p>
      <p className="meta">{def.ability}</p>
      <Stat label="Health" value={def.hp} max={140} />
      <Stat label="Speed" value={def.speed} max={100} />
      <Stat label="Fire" value={Math.round((1 / def.fire) * 70)} max={100} />
      <p className="meta">
        {open ? (selected ? t(lang, "selected") : "Unlocked") : `${t(lang, "locked")} · ${def.price} ${t(lang, "coins").toLowerCase()} or mission progress`}
      </p>
      {msg && <p className="meta">{msg}</p>}
      {open ? (
        <button
          type="button"
          className="go"
          disabled={selected}
          onClick={() => {
            const ok = game?.chooseCharacter(id);
            setMsg(ok ? "Loadout saved." : "Still locked.");
          }}
        >
          {selected ? t(lang, "selected") : t(lang, "select")}
        </button>
      ) : ask ? (
        <div className="row">
          <button
            type="button"
            className="go"
            onClick={() => {
              const result = game?.purchaseCharacter(id);
              setAsk(false);
              setMsg(result?.ok ? "Unlocked." : "Not enough coins.");
            }}
          >
            {t(lang, "confirm")} {def.price}
          </button>
          <button type="button" onClick={() => setAsk(false)}>
            {t(lang, "cancel")}
          </button>
        </div>
      ) : (
        <button type="button" className="go" onClick={() => setAsk(true)}>
          {t(lang, "unlock")} · {def.price}
        </button>
      )}
      <button type="button" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

function Stat({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <label className="stat">
      {label}
      <span className="meter">
        <i style={{ width: `${Math.max(6, Math.min(100, (value / max) * 100))}%` }} />
      </span>
    </label>
  );
}

export function WeaponShop({ save, lang, onBack, game }: { save: SaveData; lang: Lang; onBack: () => void; game: ShadowStrike | null }) {
  const [gun, setGun] = useState(0);
  const [msg, setMsg] = useState("");
  const row = save.weapons[gun]!;
  return (
    <section className="card">
      <p className="eyebrow">{t(lang, "shop")}</p>
      <h2>{GUNS[gun]}</h2>
      <div className="roster-row">
        {GUNS.map((name, i) => (
          <button key={name} type="button" className={`chip ${i === gun ? "selected" : ""}`} onClick={() => setGun(i)}>
            {name}
          </button>
        ))}
      </div>
      <p className="meta">Bank {save.coins}</p>
      {(["damage", "accuracy"] as const).map((stat) => (
        <UpgradeRow
          key={stat}
          label={stat}
          level={row[stat]}
          price={weaponPrice(row[stat])}
          note={weaponNote(stat)}
          onBuy={() => {
            const result = game?.purchaseWeapon(gun, stat as WeaponStat);
            setMsg(result?.ok ? "Upgrade fitted." : row[stat] >= 5 ? "Already maxed." : "Not enough coins.");
          }}
        />
      ))}
      {msg && <p className="meta">{msg}</p>}
      <button type="button" className="go" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

function weaponNote(stat: WeaponStat) {
  if (stat === "damage") return "+8% damage per level";
  if (stat === "fire") return "Shorter delay between shots";
  if (stat === "mag") return "Extra grenades at the start of a level";
  if (stat === "reload") return "Faster follow-up shots while you hold fire";
  return "Tighter spread";
}

export function PlayerShop({ save, lang, onBack, game }: { save: SaveData; lang: Lang; onBack: () => void; game: ShadowStrike | null }) {
  const [msg, setMsg] = useState("");
  return (
    <section className="card">
      <p className="eyebrow">{t(lang, "upgrades")}</p>
      <h2>{CHARACTERS[save.character].name}</h2>
      <p className="meta">Bank {save.coins}. Caps at level 5. Armor never exceeds 42%.</p>
      {PLAYER_STATS.map((stat) => (
        <UpgradeRow
          key={stat}
          label={playerLabel(stat)}
          level={save.player[stat]}
          price={playerPrice(save.player[stat])}
          note={playerNote(stat)}
          onBuy={() => {
            const result = game?.purchasePlayer(stat as PlayerStat);
            setMsg(result?.ok ? "Upgrade fitted." : "Cannot buy that.");
          }}
        />
      ))}
      {msg && <p className="meta">{msg}</p>}
      <button type="button" className="go" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

function playerLabel(stat: PlayerStat) {
  if (stat === "health") return "Max health";
  if (stat === "armor") return "Armor";
  if (stat === "speed") return "Movement";
  if (stat === "jump") return "Jump";
  if (stat === "dodge") return "Dodge cooldown";
  if (stat === "special") return "Ability recharge";
  return "Grenade pouch";
}

function playerNote(stat: PlayerStat) {
  if (stat === "health") return "+8 health per level";
  if (stat === "armor") return "Less damage taken";
  if (stat === "speed") return "+3% run speed";
  if (stat === "jump") return "Slightly higher jump";
  if (stat === "dodge") return "Gold dash, Shift, or a double-tap";
  if (stat === "special") return "Shorter melee recovery. Shadow phases on hit.";
  return "Start a level with extra grenades";
}

function UpgradeRow({
  label,
  level,
  price,
  note,
  onBuy,
}: {
  label: string;
  level: number;
  price: number;
  note: string;
  onBuy: () => void;
}) {
  const [ask, setAsk] = useState(false);
  const maxed = level >= 5;
  const pricey = price >= 48;
  return (
    <div className="up-row">
      <div>
        <strong>{label}</strong>
        <small>
          Lv {level}/5 {maxed ? "" : `→ ${level + 1}`} · {note}
        </small>
      </div>
      {ask ? (
        <div className="row">
          <button
            type="button"
            onClick={() => {
              setAsk(false);
              onBuy();
            }}
          >
            Confirm {price}
          </button>
          <button type="button" onClick={() => setAsk(false)}>
            No
          </button>
        </div>
      ) : (
        <button type="button" disabled={maxed} onClick={() => (pricey ? setAsk(true) : onBuy())}>
          {maxed ? "Max" : price}
        </button>
      )}
    </div>
  );
}

export function Profile({
  save,
  lang,
  onBack,
  onResetSettings,
  onResetProgress,
  onImport,
}: {
  save: SaveData;
  lang: Lang;
  onBack: () => void;
  onResetSettings: () => void;
  onResetProgress: () => void;
  onImport: (raw: string) => void;
}) {
  const done = save.campaign.levels.filter((row) => row.done).length;
  const mins = Math.floor(save.playSeconds / 60);
  return (
    <section className="card">
      <p className="eyebrow">{t(lang, "profile")}</p>
      <h2>{CHARACTERS[save.character].name}</h2>
      <ul className="help">
        <li>Coins {save.coins}</li>
        <li>Kills {save.totalKills}</li>
        <li>Deaths {save.deaths}</li>
        <li>Levels cleared {done}/30</li>
        <li>Best score {save.bestScore}</li>
        <li>Boss bonuses {save.bosses}</li>
        <li>Operatives {1 + save.bought.length}/5</li>
        <li>Playtime {mins} min</li>
      </ul>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(save)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "bean-ops-save.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {t(lang, "export")}
        </button>
        <label className="file-btn">
          {t(lang, "import")}
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onImport(String(reader.result ?? ""));
            }}
          />
        </label>
      </div>
      <button type="button" onClick={onResetSettings}>
        {t(lang, "resetSettings")}
      </button>
      <button type="button" onClick={onResetProgress}>
        {t(lang, "resetProgress")}
      </button>
      <button type="button" className="go" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

export function AchievementBoard({ save, lang, onBack }: { save: SaveData; lang: Lang; onBack: () => void }) {
  return (
    <section className="card">
      <p className="eyebrow">{t(lang, "achievements")}</p>
      <h2>Service record</h2>
      <ul className="help">
        {ACHIEVEMENTS.map((a) => (
          <li key={a.id} className={save.achievements.includes(a.id) ? "got" : "miss"}>
            <strong>{a.name}</strong> — {a.desc} {save.achievements.includes(a.id) ? "Unlocked." : "Locked."}
          </li>
        ))}
      </ul>
      <button type="button" className="go" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

export function SettingsPanel({
  settings,
  onChange,
  onBack,
  onPrivacy,
  onAbout,
  onProfile,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onBack: () => void;
  onPrivacy: () => void;
  onAbout: () => void;
  onProfile: () => void;
}) {
  const lang = settings.lang;
  return (
    <section className="card">
      <h2>{t(lang, "settings")}</h2>
      <label>
        Master
        <input type="range" min={0} max={1} step={0.05} value={settings.master} onChange={(e) => onChange({ master: Number(e.target.value) })} />
      </label>
      <label>
        Music
        <input type="range" min={0} max={1} step={0.05} value={settings.music} onChange={(e) => onChange({ music: Number(e.target.value) })} />
      </label>
      <label>
        Effects
        <input type="range" min={0} max={1} step={0.05} value={settings.sfx} onChange={(e) => onChange({ sfx: Number(e.target.value) })} />
      </label>
      <label>
        Interface
        <input type="range" min={0} max={1} step={0.05} value={settings.ui} onChange={(e) => onChange({ ui: Number(e.target.value) })} />
      </label>
      <label>
        Ambience
        <input type="range" min={0} max={1} step={0.05} value={settings.ambience} onChange={(e) => onChange({ ambience: Number(e.target.value) })} />
      </label>
      <label>
        Difficulty
        <select value={settings.difficulty} onChange={(e) => onChange({ difficulty: e.target.value as Settings["difficulty"] })}>
          <option value="easy">{t(lang, "easy")}</option>
          <option value="normal">{t(lang, "normal")}</option>
          <option value="hard">{t(lang, "hard")}</option>
        </select>
      </label>
      <label>
        Graphics
        <select value={settings.graphics} onChange={(e) => onChange({ graphics: e.target.value as Settings["graphics"] })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label>
        Display rate
        <select value={String(settings.fps)} onChange={(e) => onChange({ fps: Number(e.target.value) === 30 ? 30 : 60 })}>
          <option value="60">60 FPS</option>
          <option value="30">30 FPS</option>
        </select>
      </label>
      <label>
        Language
        <select value={settings.lang} onChange={(e) => onChange({ lang: e.target.value === "es" ? "es" : "en" })}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
      <label>
        Pad size
        <input type="range" min={0.8} max={1.25} step={0.05} value={settings.padScale} onChange={(e) => onChange({ padScale: Number(e.target.value) })} />
      </label>
      <label>
        Pad opacity
        <input type="range" min={0.4} max={1} step={0.05} value={settings.padOpacity} onChange={(e) => onChange({ padOpacity: Number(e.target.value) })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.hand === "left"} onChange={(e) => onChange({ hand: e.target.checked ? "left" : "right" })} />
        Left-handed layout
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.aimAssist} onChange={(e) => onChange({ aimAssist: e.target.checked })} />
        Aim assist
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.shake} onChange={(e) => onChange({ shake: e.target.checked })} />
        Screen shake
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.vibration} onChange={(e) => onChange({ vibration: e.target.checked })} />
        Vibration
      </label>
      <button type="button" onClick={onProfile}>
        Profile / erase save
      </button>
      <button type="button" onClick={onPrivacy}>
        Legal & privacy
      </button>
      <button type="button" onClick={onAbout}>
        About / credits
      </button>
      <button type="button" className="go" onClick={onBack}>
        {t(lang, "back")}
      </button>
    </section>
  );
}

export function PrivacyNote({ onBack }: { lang: Lang; onBack: () => void }) {
  return (
    <section className="card policy">
      <p className="eyebrow">LEGAL & PRIVACY</p>
      <h2>Privacy policy</h2>
      <p className="blurb">Killer Aaloo. This is the in-game copy. A store listing also needs the same text on a public web page.</p>
      <h3>Who it is for</h3>
      <p>A single-player cartoon run-and-gun. No account, no chat, and no children-directed mode. The person who publishes the game adds their name and a working support address on the store page before release. This build has no publisher mailbox.</p>
      <h3>What stays on this device</h3>
      <p>Progress, unlocked levels, coins, the selected character, weapon upgrades, settings, achievements, kills, and play time are saved only in this browser. Nothing is sent to a server.</p>
      <h3>What this build does not collect</h3>
      <p>No name, email, phone, contacts, photos, microphone, location, advertising ID, or analytics. There is no ad SDK, no crash-report SDK, and no sign-in SDK in this version. If those are added later, this policy and the store Data safety form have to be updated first.</p>
      <h3>How long it is kept</h3>
      <p>Until you erase it. Profile, then reset progress, clears the campaign, coins, characters, and upgrades. Reset settings does not delete the campaign. Clearing the browser data also removes the save. An exported file is a copy you control.</p>
      <h3>Ads and permissions</h3>
      <p>This build shows no ads, so declining an ad never blocks play, and no button sits under a banner. It does not ask for camera, microphone, contacts, SMS, calls, or location.</p>
      <h3>Safety</h3>
      <p>The save never leaves the browser unless you export it. Do not put personal details into an exported file.</p>
      <button type="button" className="go" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

export function AboutNote({ onBack }: { onBack: () => void }) {
  return (
    <section className="card policy">
      <p className="eyebrow">ABOUT</p>
      <h2>Killer Aaloo</h2>
      <p className="blurb">Killer Aaloo is an original cartoon operative in an olive vest. Side-scrolling run-and-gun across thirty levels. The character, name, guns, and levels are its own.</p>
      <h3>What you will see</h3>
      <p>Fictional cartoon combat. Enemies fall over. There is no blood, no gore, and no graphic injury. Weapons are game props, not instructions for real-world harm.</p>
      <h3>Credits</h3>
      <p>Game, levels, and interface: Killer Aaloo. Character and effects are drawn in the game. Music and gun sounds are generated in the game, not a copied soundtrack. Type: Russo One and Outfit.</p>
      <h3>This version</h3>
      <p>Browser build. No account to delete, no purchases, and no ads. A store package, age questionnaire, and public privacy link are filled in by the publisher from the real game, not guessed here.</p>
      <button type="button" className="go" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

export function ConfirmBox({
  title,
  body,
  lang,
  onYes,
  onNo,
}: {
  title: string;
  body: string;
  lang: Lang;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="blurb">{body}</p>
      <button type="button" className="go" onClick={onYes}>
        {t(lang, "confirm")}
      </button>
      <button type="button" onClick={onNo}>
        {t(lang, "cancel")}
      </button>
    </section>
  );
}
