import { useState } from "react";
import { Lock, MapPin, Star } from "lucide-react";
import { LEVELS } from "@/game/levels";
import type { SaveData } from "@/game/save";

const NODES: { n: number; x: number; y: number }[] = [
  { n: 1, x: 6, y: 64 },
  { n: 2, x: 3.6, y: 46 },
  { n: 3, x: 11, y: 32 },
  { n: 4, x: 18, y: 48 },
  { n: 5, x: 13, y: 66 },
  { n: 6, x: 23, y: 56 },
  { n: 7, x: 28, y: 40 },
  { n: 8, x: 34, y: 28 },
  { n: 9, x: 39, y: 48 },
  { n: 10, x: 30, y: 58 },
  { n: 11, x: 43, y: 36 },
  { n: 12, x: 36, y: 68 },
  { n: 13, x: 48, y: 52 },
  { n: 14, x: 54, y: 34 },
  { n: 15, x: 60, y: 24 },
  { n: 16, x: 66, y: 42 },
  { n: 17, x: 52, y: 66 },
  { n: 18, x: 70, y: 58 },
  { n: 19, x: 76, y: 44 },
  { n: 20, x: 82, y: 30 },
  { n: 21, x: 88, y: 22 },
  { n: 22, x: 74, y: 62 },
  { n: 23, x: 84, y: 50 },
  { n: 24, x: 90, y: 40 },
  { n: 25, x: 94, y: 30 },
  { n: 26, x: 97.5, y: 18 },
  { n: 27, x: 98, y: 46 },
  { n: 28, x: 92, y: 56 },
  { n: 29, x: 84, y: 70 },
  { n: 30, x: 91, y: 12 },
];

const BANNERS = [
  { id: "city", name: "CITY", range: "1–6", x: "8%" },
  { id: "factory", name: "FACTORY", range: "7–12", x: "28%" },
  { id: "base", name: "MILITARY BASE", range: "13–18", x: "49%" },
  { id: "desert", name: "DESERT", range: "19–24", x: "70%" },
  { id: "zero", name: "BOSS / FINAL BASE", range: "25–30", x: "86%" },
];

function frontier(save: SaveData) {
  const open = save.campaign.levels.findIndex((row, i) => i + 1 <= save.campaign.level && !row.done);
  if (open >= 0) return open + 1;
  return save.campaign.levels[29]?.done ? 30 : save.campaign.level;
}

export function MissionMap({
  save,
  onBack,
  onPlay,
}: {
  save: SaveData;
  onBack: () => void;
  onPlay: (n: number) => void;
}) {
  const current = frontier(save);
  const [pick, setPick] = useState(current);
  const spec = LEVELS[pick - 1]!;
  const rec = save.campaign.levels[pick - 1]!;
  const unlocked = pick <= save.campaign.level;
  const cleared = save.campaign.levels.filter((row) => row.done).length;
  const stars = save.campaign.levels.reduce((sum, row) => sum + row.stars, 0);
  const campaignDone = Boolean(save.campaign.levels[29]?.done);
  const points = NODES.map((node) => `${node.x},${node.y}`).join(" ");

  return (
    <div className="mmap">
      <header className="mmap-top">
        <button type="button" className="mmap-back" onClick={onBack} aria-label="Back to main menu">
          ‹
        </button>
        <div className="mmap-title">
          <MapPin aria-hidden />
          <span>
            MISSION <b>MAP</b>
          </span>
        </div>
        <div className="mmap-count">
          <Star aria-hidden />
          <span>30 LEVELS</span>
        </div>
      </header>

      <div className="mmap-fit">
        <div className="mmap-frame">
          <img src="/game/mission-map.jpg" alt="" />
          <div className="mmap-haze" />
          <i className="mmap-cloud c1" />
          <i className="mmap-cloud c2" />
          <i className="mmap-smoke s1" />
          <i className="mmap-smoke s2" />
          <i className="mmap-light l1" />
          <i className="mmap-light l2" />
          <i className="mmap-light l3" />
          {BANNERS.map((banner) => (
            <div key={banner.id} className={`mmap-banner ${banner.id}`} style={{ left: banner.x }}>
              <strong>{banner.name}</strong>
              <small>{banner.range}</small>
            </div>
          ))}
          <svg className="mmap-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={points} />
            {NODES.slice(1).map((node, i) => {
              const prev = NODES[i]!;
              const walked = save.campaign.levels[i]?.done;
              if (!walked) return null;
              return <line key={node.n} x1={prev.x} y1={prev.y} x2={node.x} y2={node.y} className="walked" />;
            })}
          </svg>
          {NODES.map((node) => {
            const row = save.campaign.levels[node.n - 1]!;
            const open = node.n <= save.campaign.level;
            const state = row.done ? "done" : open && node.n === current ? "current" : open ? "open" : "locked";
            const def = LEVELS[node.n - 1]!;
            return (
              <button
                key={node.n}
                type="button"
                className={`mmap-node ${state} ${pick === node.n ? "selected" : ""}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                aria-label={`Level ${node.n} ${def.name}, ${state}`}
                aria-pressed={pick === node.n}
                onClick={() => setPick(node.n)}
              >
                <span>{node.n}</span>
                {state === "locked" && <Lock aria-hidden />}
                {node.n === 30 && <em className="crown">♛</em>}
                {row.done && (
                  <small className="stars" aria-hidden>
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star key={i} className={i < row.stars ? "on" : ""} />
                    ))}
                  </small>
                )}
              </button>
            );
          })}
          {campaignDone && <div className="mmap-clear">CAMPAIGN COMPLETE · {stars}/90</div>}
        </div>
      </div>

      <footer className="mmap-foot">
        <div className="mmap-legend">
          <span><i className="done" /> Completed</span>
          <span><i className="current" /> Current</span>
          <span><i className="locked" /> Locked</span>
          <span className="tally">{cleared}/30 · {stars}★</span>
        </div>
        <div className="mmap-info">
          <p>
            <b>LEVEL {spec.n}</b> · {spec.zone}
          </p>
          <h2>{spec.name}</h2>
          <p>{spec.blurb}</p>
          <p className="meta-line">
            {spec.villain} · {spec.difficulty} · Best {rec.best} · Stars {rec.stars}/3 · {rec.done ? "Completed" : unlocked ? "Available" : `Clear level ${pick - 1} to unlock`}
          </p>
        </div>
        <button type="button" className="mmap-play" disabled={!unlocked} onClick={() => unlocked && onPlay(pick)}>
          {unlocked ? "PLAY LEVEL" : "LOCKED"} <span aria-hidden>››</span>
        </button>
      </footer>
    </div>
  );
}
