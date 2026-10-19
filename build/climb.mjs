/* build/climb.mjs — the climbing mascot, shipped as its own README card.
 *
 * It is deliberately NOT part of the crest: the crest is the brand mark and
 * reads at a glance, while this is a gag that needs room. It gets its own
 * world and its own projection so the bars can be chunky enough for the figure
 * to be legible on top of them, rather than a speck under the desk.
 *
 * The bars run along +x, which with azimuth 45 puts the topmost bar at the
 * upper right — the reading direction of "up and to the right".
 *
 * No <style>, no scripts, no external refs: every fill is a literal so GitHub
 * camo cannot strip the colour out of it.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, "..", "assets");
mkdirSync(OUT, { recursive: true });

const W = 520;
const H = 420;
const LOOP_S = 8;

/* Palette mirrors the crest's so the two assets read as one family. */
const THEMES = {
  dark: {
    card: "#1F1D1A",
    hood: ["#FFFCF6", "#EDE6D9", "#C8BFAD", "#B3AA99", "#DCD3C2"],
    hair: ["#2E2A25", "#3E382F", "#1C1A17"],
    skin: ["#E9C7A3", "#F5DCC0", "#B78F69"],
    acc: "#E5A183",
    ink: "#8C857A",
  },
  light: {
    card: "#F5F0E8",
    hood: ["#FFFDF8", "#F3EDE1", "#D4C9B4", "#B3AA99", "#E4DBC9"],
    hair: ["#3D362E", "#544A3C", "#241F1A"],
    skin: ["#EBD0B4", "#F7E6D4", "#B58F6E"],
    acc: "#CC785C",
    ink: "#9A9385",
  },
};

/* ------------------------------------------------------------------ *
 * Projection. Fit the whole rig — platform through the raised hands —
 * into the frame in one pass so nothing can drift out of shot.
 * ------------------------------------------------------------------ */
/* Sized so the figure reads on top of the bars rather than as a speck beside
   them: the goal bar is a little taller than the mascot, not three times it,
   and the platform is only just wide enough to hold the set. */
const PLAT = { x: -4, y: 0, w: 112, d: 74, r: 12 };
const PLAT_T = 7;

const BY = 0;          // bar centre line
const BW = 24;         // bar footprint, x and y
const BARS = [
  { x: -40, h: 20 },
  { x: -10, h: 42 },
  { x: 20, h: 64, goal: true },
];

const MASCOT_H = 61;

const fits = [
  ...k.boxCorners(PLAT, -PLAT_T - 3, 0),
  [BARS[0].x, BY, BARS[0].h], [BARS[2].x, BY, BARS[2].h],
  [BARS[0].x, BY, BARS[0].h + MASCOT_H + 8],
  [BARS[2].x, BY, BARS[2].h + MASCOT_H + 10],
];
const P = k.fitProjection(fits, W, H, { pad: 34, azimuth: 45, elevation: 30 });
const pt = (x, y, z) => k.iso([x, y, z], P);

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */
/* 4 decimals: at 2 the keys 0.05s apart round onto each other (6.70/8 and
   6.75/8 both → .84) and the animation silently holds between them */
const q = (v) => Math.round(v * 10000) / 10000;
const pts = (a) => a.map((p) => `${q(p[0])},${q(p[1])}`).join(" ");
const KT = (a, L) => a.map((s) => q(s.t / L)).join(";");
const VS = (a, g) => a.map((s) => q(g(s))).join(";");

/* A rounded plan, and the sub-path of its boundary that faces the camera.
   At azimuth 45 the +x and +y walls are both lit and the other two are
   hidden, so the visible side band runs from the leftmost silhouette point,
   round the -x+y corner, along the +y wall, round the +x+y corner, down the
   +x wall, and stops where that wall turns edge-on at -45 degrees. */
const arcSeg = (cx, cy, r, t0, t1, n = 5) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / n;
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
  });

const frontWall = (b) => {
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2;
  const y0 = b.y - b.d / 2, y1 = b.y + b.d / 2;
  const r = b.r;
  return [
    ...arcSeg(x0 + r, y1 - r, r, Math.PI * 0.75, Math.PI * 0.5),
    [x1 - r, y1],
    ...arcSeg(x1 - r, y1 - r, r, Math.PI * 0.5, 0),
    [x1, y0 + r],
    ...arcSeg(x1 - r, y0 + r, r, 0, -Math.PI * 0.25),
  ];
};

/* ------------------------------------------------------------------ *
 * The platform
 * ------------------------------------------------------------------ */
function platform(T) {
  const b = PLAT;
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2;
  const y0 = b.y - b.d / 2, y1 = b.y + b.d / 2;
  const plan = [
    ...arcSeg(x1 - b.r, y1 - b.r, b.r, 0, Math.PI * 0.5),
    ...arcSeg(x0 + b.r, y1 - b.r, b.r, Math.PI * 0.5, Math.PI),
    ...arcSeg(x0 + b.r, y0 + b.r, b.r, Math.PI, Math.PI * 1.5),
    ...arcSeg(x1 - b.r, y0 + b.r, b.r, Math.PI * 1.5, Math.PI * 2),
  ];

  const wall = frontWall(b);
  const side = [
    ...wall.map((p) => pt(p[0], p[1], 0)),
    ...wall.slice().reverse().map((p) => pt(p[0], p[1], -PLAT_T)),
  ];

  /* the wall is two coplanar faces split at the +x+y corner; drawing it as one
     band keeps the seam from showing as a hairline */
  return (
    `<polygon points="${pts(side)}" fill="${T.hood[2]}" stroke="${T.hood[3]}" stroke-width=".8" stroke-linejoin="round"/>` +
    `<polygon points="${pts(plan.map((p) => pt(p[0], p[1], 0)))}" fill="${T.hood[1]}" stroke="${T.hood[3]}" stroke-width=".8" stroke-linejoin="round"/>`
  );
}

/* ------------------------------------------------------------------ *
 * Bars. Three faces, all on the camera's side, so they tile the
 * silhouette exactly and the draw order cannot produce a seam.
 * ------------------------------------------------------------------ */
function bar(b, T) {
  const x0 = b.x - BW / 2, x1 = b.x + BW / 2;
  const y0 = BY - BW / 2, y1 = BY + BW / 2;
  const edge = b.goal ? T.acc : T.hood[3];
  const sw = b.goal ? "" : ` stroke-width=".9"`;
  const face = (p, fill) =>
    `<polygon points="${pts(p)}" fill="${fill}" stroke="${edge}" stroke-linejoin="round"${sw}/>`;

  const left = [pt(x0, y1, b.h), pt(x1, y1, b.h), pt(x1, y1, 0), pt(x0, y1, 0)];
  const right = [pt(x1, y0, b.h), pt(x1, y1, b.h), pt(x1, y1, 0), pt(x1, y0, 0)];
  const top = [pt(x0, y0, b.h), pt(x1, y0, b.h), pt(x1, y1, b.h), pt(x0, y1, b.h)];

  /* the goal bar's outline breathes once per loop, on the group so a single
     animation drives all three edges — the faces declare no stroke-width of
     their own precisely so they inherit the animated value */
  if (!b.goal) return face(left, T.hood[2]) + face(right, T.hood[3]) + face(top, T.hood[1]);
  const pulse =
    `<animate attributeName="stroke-width" values="1.4;1.4;3;1.8;3;1.4;1.4" ` +
    `keyTimes="0;.29;.34;.39;.44;.48;1" dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>`;
  return (
    `<g stroke-width="1.4" stroke-linejoin="round">` +
    face(left, T.hood[2]) + face(right, T.hood[3]) + face(top, T.hood[1]) +
    pulse + `</g>`
  );
}

/* ------------------------------------------------------------------ *
 * The mascot, drawn about its feet with up as -y.
 *
 * The figure is projected through a local frame whose horizontal axis is the
 * isometric y-axis — so the shoulders tilt with the scene — while its vertical
 * stays truly vertical, which is exactly how a standing figure projects at
 * azimuth 45. That is why the frame is a shear-free matrix rather than a
 * rotation: a rotation would tip the head over.
 * ------------------------------------------------------------------ */
/* The figure is drawn at a nominal ~54 units and then projected through a
   scaled frame, so its size can be dialled without touching every joint. */
const SCALE = 1.12;
const FRAME = `matrix(${q(0.894 * SCALE)} ${q(-0.447 * SCALE)} 0 ${q(SCALE)} 0 0)`;
const HIP_X = 3.6, HIP_Y = -18, THIGH = 9, SHIN = 9;
const SH_X = 5.5, SH_Y = -33, UPPER = 7.5, FORE = 7.5;
const NECK_Y = -36.5, HEAD_Y = -7, HEAD_R = 7.5;

const taper = (len, w0, w1, cap = 1.7) =>
  `M${-w0} 0L${-w1} ${q(len)}Q0 ${q(len + cap)} ${w1} ${q(len)}L${w0} 0Z`;
const FOOT = "M-2.4 0L2.4 0L2.4 1.2Q0 2.9-2.4 1.2Z";

const TORSO =
  "M-5.3 -17Q-6.2 -26 -5.8 -33Q-3.2 -35.3 0 -35.3" +
  "Q3.2 -35.3 5.8 -33Q6.2 -26 5.3 -17Q0 -15.3-5.3 -17Z";
const HOOD =
  "M-5.5 -33Q-4.7 -37.3 0 -37.3Q4.7 -37.3 5.5 -33" +
  "Q2.9 -34.7 0 -34.7Q-2.9 -34.7-5.5 -33Z";

function mascot(T, K) {
  /* `add` is "sum" for everything that layers a rotation or a scale onto a
     group that already has a transform of its own, and "replace" for the one
     animation that carries the whole figure across the scene — see build(). */
  const anim = (type, values, keyTimes, add = "sum") =>
    `<animateTransform attributeName="transform" type="${type}" additive="${add}" ` +
    `values="${values}" keyTimes="${keyTimes}" dur="${LOOP_S}s" ` +
    `repeatCount="indefinite" calcMode="linear"/>`;

  /* Outline weight is set for a 1:1 render: the figure is only ~75px tall, and
     the raised arms sit against the card rather than the bars, so a hairline
     stroke in a tone that matches the card would make them disappear. */
  const LIMB_SW = "1.1";
  const FINE_SW = "1";

  /* Same negation as the arms. The legs are mirrored rather than counter-phased
     on purpose: this is a hop, not a walk, and a hopping figure tucks and
     extends both legs together. Without the sign they would swing inward and
     merge into one limb at the centre. */
  const leg = (s) =>
    `<g transform="translate(${q(s * HIP_X)} ${HIP_Y})">` +
    anim("rotate", VS(K.leg, (v) => -s * v.hip), K.legK) +
    `<path d="${taper(THIGH, 2.7, 2.2)}" fill="${T.hood[2]}" stroke="${T.hood[3]}" stroke-width="${LIMB_SW}"/>` +
    `<g transform="translate(0 ${THIGH})">` +
    anim("rotate", VS(K.leg, (v) => -s * v.knee), K.legK) +
    `<path d="${taper(SHIN, 2.2, 1.7)}" fill="${T.hood[2]}" stroke="${T.hood[3]}" stroke-width="${LIMB_SW}"/>` +
    `<path d="${FOOT}" fill="${T.hood[3]}" stroke="${T.hood[3]}" stroke-width="${FINE_SW}" transform="translate(0 ${SHIN})"/>` +
    `</g></g>`;

  const arm = (s) =>
    /* The local frame's +x points along the shoulder axis, so a positive
       rotation swings a limb across the body. Negating puts the swing on the
       outside — arms up in a V rather than crossed over the head. */
    `<g transform="translate(${q(s * SH_X)} ${SH_Y})">` +
    anim("rotate", VS(K.arm, (v) => -s * v.up), K.armK) +
    `<path d="${taper(UPPER, 2.1, 1.7)}" fill="${T.hood[1]}" stroke="${T.hood[3]}" stroke-width="${LIMB_SW}"/>` +
    `<g transform="translate(0 ${UPPER})">` +
    anim("rotate", VS(K.arm, (v) => -s * v.fore), K.armK) +
    `<path d="${taper(FORE, 1.7, 1.4)}" fill="${T.hood[1]}" stroke="${T.hood[3]}" stroke-width="${LIMB_SW}"/>` +
    `<circle cx="0" cy="${FORE}" r="1.9" fill="${T.skin[0]}" stroke="${T.skin[2]}" stroke-width="${FINE_SW}"/>` +
    `</g></g>`;

  const head =
    `<g transform="translate(0 ${NECK_Y})">` +
    anim("rotate", VS(K.head, (v) => v.a), K.headK) +
    `<rect x="-2.5" y="-.5" width="5" height="4" rx="1.6" fill="${T.skin[0]}" stroke="${T.skin[2]}" stroke-width="${FINE_SW}"/>` +
    `<circle cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${T.hair[0]}" stroke="#8E8574" stroke-width="1.1"/>` +
    `<path d="M-5.4 ${q(HEAD_Y - 1.3)}A6.1 6.1 0 0 1 4.2 ${q(HEAD_Y - 3.2)}" fill="none" stroke="${T.hair[1]}" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>` +
    `<circle cx="-6.5" cy="${HEAD_Y}" r="2.6" fill="#C6BAA4" stroke="#8E8574" stroke-width="1.1"/>` +
    `<circle cx="6.5" cy="${HEAD_Y}" r="2.6" fill="#C6BAA4" stroke="#8E8574" stroke-width="1.1"/>` +
    `<path d="M-6.5 ${q(HEAD_Y - 1.6)}Q0 ${q(HEAD_Y - HEAD_R - 3.4)} 6.5 ${q(HEAD_Y - 1.6)}" fill="none" stroke="#C6BAA4" stroke-width="1.8" stroke-linecap="round"/>` +
    `</g>`;

  const figure =
    leg(-1) + leg(1) + arm(-1) + arm(1) +
    `<path d="${TORSO}" fill="${T.hood[1]}" stroke="${T.hood[3]}" stroke-width=".6"/>` +
    `<path d="${HOOD}" fill="${T.hood[2]}" stroke="${T.hood[3]}" stroke-width=".55"/>` +
    head;

  const STAR = "M0 -4.4L1.2 -1.2L4.4 0L1.2 1.2L0 4.4L-1.2 1.2L-4.4 0L-1.2 -1.2Z";
  const sparks = K.sparks.map((s) => {
    const a = q(s.t0 / LOOP_S), b = q((s.t0 + 0.22) / LOOP_S), c = q((s.t0 + 0.55) / LOOP_S);
    const kk = `0;${a};${b};${c};1`;
    const fade = `<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="${kk}" dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>`;
    return (
      `<g transform="translate(${s.x} ${s.y}) scale(${s.s})">` +
      `<path d="${STAR}" fill="${T.acc}" opacity="0">${fade}</path>` +
      `<g transform="scale(0)" opacity="0">` +
      `<animateTransform attributeName="transform" type="scale" additive="sum" values="0;0;1;0;0" keyTimes="${kk}" dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>` +
      fade + `<path d="${STAR}" fill="${T.acc}"/></g>` +
      `</g>`);
  }).join("");

  return { figure, sparks, anim };
}

/* ------------------------------------------------------------------ *
 * One clock for the whole routine: idle, two hops up, celebrate, down.
 * ------------------------------------------------------------------ */
function keyframes(stand) {
  const [A, B, C] = stand;
  const keys = [];
  const at = (t, p) => keys.push({ t, x: p[0], y: p[1] });
  const seg = (t0, dur, f, to, peak) => {
    for (let i = 1; i <= 4; i++) {
      const s = i / 4;
      keys.push({
        t: t0 + dur * s,
        x: f[0] + (to[0] - f[0]) * s,
        y: f[1] + (to[1] - f[1]) * s - peak * Math.sin(Math.PI * s),
      });
    }
  };

  at(0, A); at(0.45, A);
  seg(0.45, 0.65, A, B, 20);
  at(1.55, B);
  seg(1.55, 0.65, B, C, 22);
  at(2.95, C);
  seg(2.95, 0.45, C, C, 8);
  at(4.15, C);
  seg(4.15, 0.45, C, C, 8);
  at(5.35, C);
  seg(5.35, 0.45, C, C, 8);
  at(6.0, C);
  seg(6.0, 0.45, C, B, 13);
  at(6.75, B);
  seg(6.75, 0.45, B, A, 11);
  at(8, A);

  /* squash and stretch, anchored on the feet */
  const SC = [[0, 1, 1], [0.35, 1, 1], [0.45, 1.05, 0.95],
    [1.1, 0.9, 1.12], [1.3, 1.03, 0.98], [1.45, 1, 1], [1.55, 1.05, 0.95],
    [2.2, 0.9, 1.12], [2.4, 1.03, 0.98], [2.55, 1, 1], [2.95, 1.04, 0.96],
    [3.4, 0.92, 1.1], [3.6, 1.02, 0.98], [3.8, 1, 1], [4.15, 1.04, 0.96],
    [4.6, 0.92, 1.1], [4.8, 1.02, 0.98], [5.0, 1, 1], [5.35, 1.04, 0.96],
    [5.8, 0.92, 1.1], [5.95, 1, 1], [6.0, 1.05, 0.95],
    [6.45, 0.93, 1.09], [6.6, 1.02, 0.98], [6.7, 1, 1], [6.75, 1.05, 0.95],
    [7.2, 0.93, 1.09], [7.4, 1.02, 0.98], [7.55, 1, 1], [8, 1, 1]];

  /* `up` is the shoulder; `fore` is the elbow measured inside the upper arm,
     so a straight arm reads 0 instead of a second absolute angle */
  const arm = [
    { t: 0, up: 13, fore: 9 }, { t: 0.45, up: 13, fore: 9 },
    { t: 0.61, up: 95, fore: -18 }, { t: 0.78, up: 122, fore: -14 },
    { t: 0.94, up: 78, fore: -4 }, { t: 1.1, up: 44, fore: 42 },
    { t: 1.3, up: 22, fore: 24 }, { t: 1.55, up: 13, fore: 9 },
    { t: 1.71, up: 95, fore: -18 }, { t: 1.88, up: 122, fore: -14 },
    { t: 2.04, up: 78, fore: -4 }, { t: 2.2, up: 44, fore: 42 },
    { t: 2.45, up: 20, fore: 24 }, { t: 2.75, up: 140, fore: -24 }];
  for (let i = 1; i <= 9; i++) {
    const t = 2.75 + i * 0.35;
    const w = Math.sin(((t - 2.75) / 1.4) * Math.PI * 2);
    arm.push({ t, up: 140 + 7 * w, fore: -24 + 5 * w });
  }
  arm.push(
    { t: 6.0, up: 95, fore: -18 }, { t: 6.12, up: 118, fore: -14 },
    { t: 6.24, up: 110, fore: -12 }, { t: 6.36, up: 74, fore: 0 },
    { t: 6.45, up: 44, fore: 42 }, { t: 6.6, up: 22, fore: 24 },
    { t: 6.75, up: 13, fore: 9 }, { t: 6.87, up: 95, fore: -18 },
    { t: 6.99, up: 115, fore: -14 }, { t: 7.1, up: 70, fore: 0 },
    { t: 7.2, up: 44, fore: 42 }, { t: 7.45, up: 22, fore: 24 },
    { t: 8, up: 13, fore: 9 });

  const leg = [
    { t: 0, hip: 0, knee: 5 }, { t: 0.45, hip: 0, knee: 5 },
    { t: 0.61, hip: 24, knee: -26 }, { t: 0.775, hip: -20, knee: 34 },
    { t: 0.94, hip: 24, knee: -26 }, { t: 1.1, hip: 7, knee: 22 },
    { t: 1.35, hip: 2, knee: 7 }, { t: 1.55, hip: 0, knee: 5 },
    { t: 1.71, hip: 24, knee: -26 }, { t: 1.875, hip: -20, knee: 34 },
    { t: 2.04, hip: 24, knee: -26 }, { t: 2.2, hip: 7, knee: 22 },
    { t: 2.45, hip: 2, knee: 7 }, { t: 2.75, hip: 0, knee: 3 },
    { t: 3.4, hip: 0, knee: 18 }, { t: 3.7, hip: 0, knee: 4 },
    { t: 4.15, hip: 0, knee: 3 }, { t: 4.6, hip: 0, knee: 18 },
    { t: 4.9, hip: 0, knee: 4 }, { t: 5.35, hip: 0, knee: 3 },
    { t: 5.8, hip: 0, knee: 18 }, { t: 6.0, hip: 0, knee: 5 },
    { t: 6.11, hip: 16, knee: -20 }, { t: 6.225, hip: 8, knee: -8 },
    { t: 6.34, hip: -6, knee: 16 }, { t: 6.45, hip: 7, knee: 22 },
    { t: 6.6, hip: 2, knee: 7 }, { t: 6.75, hip: 0, knee: 5 },
    { t: 6.87, hip: 24, knee: -26 }, { t: 6.975, hip: -20, knee: 34 },
    { t: 7.09, hip: 24, knee: -26 }, { t: 7.2, hip: 7, knee: 22 },
    { t: 7.45, hip: 2, knee: 7 }, { t: 8, hip: 0, knee: 5 }];

  const head = [
    { t: 0, a: 0 }, { t: 2.2, a: 0 }, { t: 2.75, a: -6 },
    { t: 5.9, a: -5 }, { t: 6.4, a: 0 }, { t: 8, a: 0 }];

  return {
    keys, SC,
    arm, armK: KT(arm, LOOP_S),
    leg, legK: KT(leg, LOOP_S),
    head, headK: KT(head, LOOP_S),
    sparks: [
      { t0: 2.9, x: -15, y: -58, s: 1 },
      { t0: 3.7, x: 15, y: -61, s: 0.85 },
      { t0: 4.5, x: -8, y: -70, s: 0.95 },
      { t0: 5.3, x: 16, y: -52, s: 0.8 },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */
function build(T) {
  const stand = BARS.map((b) => pt(b.x, BY, b.h));
  const K = keyframes(stand);
  const { figure, sparks, anim } = mascot(T, K);

  /* The group's own transform is the rest pose — the figure's feet on bar 0 —
     not the origin, and the translate animation REPLACES it instead of
     summing with it.
     A renderer that ignores SMIL (GitHub's mobile app, Windows' photo
     preview, resvg, most SVG rasterisers) falls back to that bare attribute
     for every animation in the file, and at translate(0 0) the figure is
     drawn with its feet on the canvas corner and its body outside the
     viewBox — the bars show, the mascot does not. Summing against this base
     would add the offsets twice, so replace is what keeps the animated path
     byte-identical while the static one lands on the bar. */
  const home = stand[0];
  const posK = KT(K.keys, LOOP_S);
  const posV = K.keys.map((s) => `${q(s.x)} ${q(s.y)}`).join(";");
  const scK = K.SC.map((s) => q(s[0] / LOOP_S)).join(";");
  const scV = K.SC.map((s) => `${q(s[1])} ${q(s[2])}`).join(";");

  return (
    `<rect width="${W}" height="${H}" fill="${T.card}"/>` +
    platform(T) +
    BARS.map((b) => bar(b, T)).join("") +
    `<g transform="translate(${q(home[0])} ${q(home[1])})">` +
    anim("translate", posV, posK, "replace") +
    `<g transform="scale(1 1)">` +
    anim("scale", scV, scK) +
    `<g transform="${FRAME}">${figure}</g>` +
    `</g>` +
    `<g transform="${FRAME}">${sparks}</g>` +
    `</g>`
  );
}

for (const [name, theme] of Object.entries(THEMES)) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `width="${W}" height="${H}" role="img" ` +
    `aria-label="A figure climbing three ascending bars and celebrating at the top">` +
    build(theme) + `</svg>`;
  const file = join(OUT, `climb${name === "light" ? ".light" : ""}.svg`);
  writeFileSync(file, svg);
  const paths = (svg.match(/<path/g) || []).length;
  console.log(`${name.padEnd(5)}: paths ${paths} bytes ${svg.length}`);
}
