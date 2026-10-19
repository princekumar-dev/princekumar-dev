import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";
import { FONT_CSS } from "./font-data.mjs";
import { HEADER } from "./copy.mjs";
import { assertClean } from "./svg-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1200;
const H = 420;
const M = 76;

/* ------------------------------------------------------------------ *
 * Palette — Claude design language (design-md/claude/DESIGN.md),
 * in two themes so <picture> can hand GitHub's light and dark modes
 * the right banner: a warm-dark floor, and Claude's own cream canvas.
 * One chromatic accent: coral #cc785c. Amber is illustration-only.
 *
 * The iso tokens are the same ones crest.mjs uses for its two themes, so
 * the banner and the illustration below it never drift apart.
 * ------------------------------------------------------------------ */
const THEMES = {
  dark: {
    c: {
      page: "#181715",
      card: "#1F1D1A",
      hi: "#F4F1EA",
      ink: "#CFC9BE",
      mid: "#B9B2A6",
      muted: "#8E8B82",
      faint: "#332F2A",
      hair: "#3A352E",
      lit: "#CC785C",
      litHi: "#E5A183",
      litDeep: "#A9583E",
    },
    iso: `
.iso{
  --anatomy-page:#181715;--anatomy-card:#1F1D1A;--anatomy-paper:#23211D;
  --anatomy-face:#2E2A25;--anatomy-top:#3A352D;
  --anatomy-shade-0:#141312;--anatomy-shade-1:#191715;--anatomy-shade-2:#1E1C19;--anatomy-shade-3:#242220;
  --anatomy-lit-top:#E5A183;--anatomy-lit-shade:#8E5240;
  --anatomy-hi:#F4F1EA;--anatomy-mid:#B9B2A6;--anatomy-lo:#5E574D;--anatomy-faint:#332F2A;
  --anatomy-lit:#CC785C;--anatomy-dot:#E8E3D9;--anatomy-halo:#000000;--anatomy-halo-opacity:.85;
  --anatomy-red:#CC785C;--anatomy-green:#5DB872;--anatomy-amber:#E8A55A;
  --anatomy-weight:.55px;
  --anatomy-lift:none;
  --m-body:#EDE6D9;--m-limb:#C8BFAD;--m-ink:#8E8574;--m-skin:#E9C7A3;
  --m-hair:#2E2A25;--m-hair-hi:#3E382F;--m-ear:#C6BAA4;--m-accent:#E5A183;
}
.iso-scene path,.iso-scene circle{vector-effect:non-scaling-stroke}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
`,
    bg: ["#151412", "#1C1A17", "#141311"],
    ember: [".26", ".07"],
    emberWarm: ".07",
    glass: [["#FFFFFF", ".055"], ["#FFFFFF", ".015"]],
    stroke: ["#FFFFFF", ".09"],
    sweep: ".30",
    grain: ".028",
    border: ["#FFFFFF", ".085"],
    desc:
      "Warm, minimal banner on a deep clay-black field with a single terracotta accent, an editorial serif name, and a small isometric bar chart with a climber hopping up it",
  },
  light: {
    c: {
      page: "#FAF9F5",
      card: "#F5F0E8",
      hi: "#141413",
      ink: "#3D3D3A",
      mid: "#6C6A64",
      muted: "#6C6A64",
      faint: "#D8D0C2",
      hair: "#DCD2C0",
      lit: "#CC785C",
      litHi: "#E5A183",
      litDeep: "#A9583E",
    },
    iso: `
.iso{
  --anatomy-page:#FAF9F5;--anatomy-card:#F5F0E8;--anatomy-paper:#EFE9DE;
  --anatomy-face:#E8E0D2;--anatomy-top:#DCD2C0;
  --anatomy-shade-0:#F7F3EC;--anatomy-shade-1:#F2ECE2;--anatomy-shade-2:#EBE3D6;--anatomy-shade-3:#E3D9C9;
  --anatomy-lit-top:#CFC3AD;--anatomy-lit-shade:#D8CDB9;
  --anatomy-hi:#141413;--anatomy-mid:#6C6A64;--anatomy-lo:#A69F92;--anatomy-faint:#D8D0C2;
  --anatomy-lit:#CC785C;--anatomy-dot:#3D3D3A;--anatomy-halo:#8E8B82;--anatomy-halo-opacity:.30;
  --anatomy-red:#CC785C;--anatomy-green:#5DB872;--anatomy-amber:#E8A55A;
  --anatomy-weight:.55px;
  --anatomy-lift:none;
  --m-body:#F3EDE1;--m-limb:#D4C9B4;--m-ink:#8E8574;--m-skin:#EBD0B4;
  --m-hair:#3D362E;--m-hair-hi:#544A3C;--m-ear:#C6BAA4;--m-accent:#CC785C;
}
.iso-scene path,.iso-scene circle{vector-effect:non-scaling-stroke}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
`,
    bg: ["#F7F3EC", "#FAF9F5", "#F2EDE4"],
    ember: [".15", ".045"],
    emberWarm: ".05",
    glass: [["#FFFFFF", ".85"], ["#F5F0E8", ".85"]],
    stroke: ["#141413", ".10"],
    /* the light field is too bright for a white glint to read as light —
       a cream sweep keeps the motion without bleaching the letterforms */
    sweep: ".26",
    grain: ".035",
    border: ["#141413", ".10"],
    desc:
      "Warm, minimal banner on Claude's cream canvas with a single terracotta accent, an editorial serif name, and a small isometric bar chart with a climber hopping up it",
  },
};

const DISPLAY =
  "Newsreader, 'Source Serif 4', 'Iowan Old Style', Palatino, 'Palatino Linotype', Georgia, serif";
const BODY = "Inter, ui-sans-serif, system-ui, sans-serif";

/* The climber's own rules. Everything else in the scene is a solid built by
   iso-kit from the anatomy tokens; a figure needs fills and outlines of its
   own, so it gets a small palette of vars per theme and these classes.
   Strokes are in banner px (the scene is vector-effect:non-scaling-stroke),
   so they are set heavy — thin lines survive a downscale to 400px as mush. */
const MASCOT_CSS = `
.m-body{fill:var(--m-body);stroke:var(--m-ink);stroke-width:1.7;stroke-linejoin:round;stroke-linecap:round}
.m-limb{fill:var(--m-limb);stroke:var(--m-ink);stroke-width:1.7;stroke-linejoin:round;stroke-linecap:round}
.m-foot{fill:var(--m-ink);stroke:var(--m-ink);stroke-width:1;stroke-linejoin:round}
.m-skin{fill:var(--m-skin);stroke:var(--m-ink);stroke-width:1.4;stroke-linejoin:round}
.m-hair{fill:var(--m-hair);stroke:var(--m-ink);stroke-width:1.7;stroke-linejoin:round}
.m-hair-hi{fill:none;stroke:var(--m-hair-hi);stroke-width:2.2;stroke-linecap:round;opacity:.85}
.m-band{fill:none;stroke:var(--m-ear);stroke-width:2.2;stroke-linecap:round}
.m-star{fill:var(--m-accent);stroke:none}
`;

/* The figure reads FLAT — solid fills and outlines only, drawn once, exactly
   like the climb mascot. An earlier volume gradient (mg-cyl) was drawn as a
   second pass over the limbs and trunk and swept a bright band across the chest
   that still read as a stray "ribbon" at banner size; the climb svgs carry no
   such overlay, so neither does this. Only two gradients survive: `mg-ball`,
   a sphere's own hot-spot for the head and hands, and `mg-ground`, the contact
   shadow on the deck — both translucent black/white so one build serves both
   themes. */
const MASCOT_DEFS = () => `
<radialGradient id="mg-ball" cx=".34" cy=".3" r=".84">
  <stop offset="0"   stop-color="#fff" stop-opacity=".4"/>
  <stop offset=".44" stop-color="#fff" stop-opacity="0"/>
  <stop offset=".7"  stop-color="#000" stop-opacity="0"/>
  <stop offset="1"   stop-color="#000" stop-opacity=".3"/>
</radialGradient>
<radialGradient id="mg-ground" cx=".5" cy=".5" r=".5">
  <stop offset="0"   stop-color="#000" stop-opacity=".5"/>
  <stop offset=".55" stop-color="#000" stop-opacity=".2"/>
  <stop offset="1"   stop-color="#000" stop-opacity="0"/>
</radialGradient>`;

/* ------------------------------------------------------------------ *
 * Isometric accent — a small bar-chart artifact for an AI & DS student.
 * Theme-independent: every face is a CSS token, so one build serves both.
 * ------------------------------------------------------------------ */
const SW = 372;
const SH = 336;

const PLATE = { x: -54, y: -36, w: 108, d: 72, r: 9 };
const BARS = [
  { plan: { x: -42, y: -11, w: 22, d: 22, r: 3 }, h: 15 },
  { plan: { x: -12, y: -11, w: 22, d: 22, r: 3 }, h: 33 },
  { plan: { x: 18, y: -11, w: 22, d: 22, r: 3 }, h: 57, lit: true },
];

/* The climber stands on the tall bar, so the projection reserves its height
   before it fits anything. MASCOT_PX is the number that decides whether the
   mascot reads as a person or as a smudge once the banner is shown at README
   width: at 58px it collapsed into a hairline stick at 400px, so it is now
   deliberately generous. `pad` already leaves 30px above the scene, so the
   reserve only has to cover the figure minus that pad, plus the cheer hops. */
const MASCOT_PX = 72;
const LOOP_S = 9;

const fits = [
  ...k.boxCorners(PLATE, -12, 9),
  ...BARS.flatMap((b) => k.boxCorners(b.plan, 0, b.h)),
];
const P = k.fitProjection(fits, SW, SH, { pad: 30, headroom: MASCOT_PX - 8 });

const pt = (x, y, z) => k.iso([x, y, z], P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

const isoBody = [];
isoBody.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -14, 12, P)}" style="filter:blur(11px)" opacity=".6"/>`);
isoBody.push(S(k.slabOf(PLATE, -12, 9, P, 14, 1.2), { tone: "lo" }));
isoBody.push(L(k.planOutline(k.insetPlan(PLATE, 7), 0, P, 14), { tone: "faint" }));
/* a data grid engraved into the plate top */
isoBody.push(D(k.dotGrid(PLATE.x + 10, PLATE.y + 10, 9, 5, 9, 0.15, P), { size: 0.55, tone: "lo" }));
/* ticks along the near edge (topTicks hands back {minor, major} — not a string) */
const edgeTicks = k.topTicks(
  PLATE.x + 8,
  PLATE.x + PLATE.w - 8,
  6.6,
  4,
  PLATE.y + PLATE.d - 5,
  0.15,
  [3, 3],
  P,
  "x",
);
isoBody.push(L(edgeTicks.minor, { tone: "faint" }), L(edgeTicks.major, { tone: "lo" }));
isoBody.push(D(k.corners(k.insetPlan(PLATE, 12), 0).map(([x, y]) => pt(x, y, 0)), { size: 0.6, tone: "lo" }));
/* engraved plate label */
isoBody.push(
  k.faceTextSvg(
    k.topMatrix([PLATE.x + 10, PLATE.y + PLATE.d - 10], 0.35, P, "x"),
    HEADER.ENGRAVING,
    { size: 5.2, tone: "lo" },
  ),
);
BARS.forEach((b, i) => {
  const inner =
    S(k.slabOf(b.plan, 0, b.h, P, 6, 0.7), {
      tone: b.lit ? "lit" : "mid",
      lit: !!b.lit,
      crease: "none",
    }) +
    /* the live bar's top edge breathes, so "this one is the current one" reads as alive */
    (b.lit
      ? `<g><animate attributeName="opacity" values="1;.55;1" dur="3.8s" repeatCount="indefinite"/>` +
        `${L(k.planOutline(k.insetPlan(b.plan, 0.6), b.h, P, 6), { tone: "lit" })}</g>`
      : "");

  /* Bars rise out of the plate, left to right, so the live one lands last.
     The base transform stays the identity: if a renderer ever ignored SMIL,
     the bars would simply be there at full height rather than invisible. */
  const [bx, by] = pt(b.plan.x + b.plan.w / 2, b.plan.y + b.plan.d / 2, 0);
  isoBody.push(
    `<g transform="translate(${bx.toFixed(2)} ${by.toFixed(2)})">` +
      `<g>` +
      `<animateTransform attributeName="transform" type="scale" values="1 0.06;1 1" ` +
      `keyTimes="0;1" keySplines=".18 .92 .3 1" calcMode="spline" ` +
      `dur=".9s" begin="${(0.35 + i * 0.22).toFixed(2)}s" fill="both"/>` +
      `<g transform="translate(${(-bx).toFixed(2)} ${(-by).toFixed(2)})">${inner}</g>` +
      `</g>` +
      `</g>`,
  );
});

/* ------------------------------------------------------------------ *
 * The climber — the climb card's mascot, shrunk to banner scale.
 *
 * It waits on the plate while the bars rise, hops up them one at a time,
 * throws its hands up on the lit one, and hops back down: 8s, seamless,
 * the last frame equal to the first so the loop never snaps.
 *
 * Two rules the climb card taught us, both kept here:
 *   · the position animation REPLACES a base transform that is already
 *     the rest pose. A renderer that ignores SMIL (GitHub's mobile app,
 *     Windows' photo preview, most rasterisers) falls back to that bare
 *     attribute, and it has to be a place the figure can stand — at the
 *     origin it would be drawn outside the viewBox, i.e. not at all;
 *   · limb rotations SUM onto a base translate of their own, so a frozen
 *     figure is a neutral stand rather than a broken one.
 * The palette is the climb card's own, exposed as CSS vars so this one
 * geometry keeps serving both themes.
 * ------------------------------------------------------------------ */
const fine = (v) => Math.round(v * 100) / 100;
/* Built fat and big-headed on purpose: a figure that is elegant at 60px is
   an illegible squiggle at the 24px it occupies in a 400px-wide banner.
   FIG_H is the nominal height (feet to the top of the headband).
   Body mass is deliberately heavy — the first cut read as a stick figure
   with a helmet, so the torso now spans ~17 units against a 16-wide head,
   the hips are as wide as the shoulders, and every limb is a solid 6–8
   units so it survives being downscaled to a few banner px. */
const FIG_H = 56;
/* hips are wide so the two legs stand apart instead of touching */
const HIP_X = 4.9, HIP_Y = -18, THIGH = 9, SHIN = 9;
/* shoulders sit outside the head's radius on purpose: at ±6.2 a raised arm
   disappeared behind the face and the cheer read as a one-armed wave */
const SH_X = 7.4, SH_Y = -33, UPPER = 7.5, FORE = 7.5;
const NECK_Y = -36.5, HEAD_Y = -7, HEAD_R = 8.3;

/* The shoulder axis lies along the isometric −y, so the figure tilts with
   the scene while its own vertical stays truly vertical — which is how a
   standing figure projects at this camera. A rotation would tip the head
   over, so the frame is a shear-free matrix rather than a rotation. */
const [fx, fy] = (() => {
  const [vx, vy] = k.axisVector(P, [0, -1, 0]);
  const len = Math.hypot(vx, vy) || 1;
  return [vx / len, vy / len];
})();
const MS = MASCOT_PX / FIG_H;
const FRAME = `matrix(${fine(fx * MS)} ${fine(fy * MS)} 0 ${fine(MS)} 0 0)`;

/* Every limb is a capsule — rounded at both ends, so a rotated thigh or
   forearm never shows a cut-off flat joint. `w0` is the top radius, `w1`
   the bottom, so limbs still taper like real ones. */
const capsule = (len, w0, w1) =>
  `M${-w0} 0A${w0} ${w0} 0 0 1 ${w0} 0L${w1} ${fine(len)}` +
  `Q0 ${fine(len + w1 * 1.15)} ${-w1} ${fine(len)}Z`;
const taper = (len, w0, w1, cap = 1.8) =>
  `M${-w0} 0L${-w1} ${fine(len)}Q0 ${fine(len + cap)} ${w1} ${fine(len)}L${w0} 0Z`;
/* feet: a little wedge, wider than the shin so the leg reads as planted */
const FOOT = "M-3.6 0L3.6 0L3.6 1.5Q0 3.6-3.6 1.5Z";
/* The torso is a real trunk: 16.6 units across at the shoulders (about the
   same as the head) tapering to 14 at the hip, with a straighter waist so
   it reads as a body rather than a cone. Its shape, not a gradient, is what
   gives it mass. */
const TORSO =
  "M-7 -17Q-8.3 -25 -8.3 -32Q-8.3 -35.4 0 -35.4" +
  "Q8.3 -35.4 8.3 -32Q8.3 -25 7 -17Q0 -15.3-7 -17Z";
/* The hair is a bowl that wraps the crown and both sides down past the ear
   line, and its lower edge crosses low over the forehead — a hairline, not
   a bald scalp with a crescent of hair behind it. The fringe (the `Q` back
   through center) dips to y=-2.6, so the face window is the lower third. */
/* The cap rides the head's own circle clear over the crown: the endpoints are
   snapped to 8.18 (exactly on the r=8.3 circle at y=-5.6) and the arc takes
   the large-arc/sweep flags, so the hair reaches the top of the skull. With
   the short-arc form it stopped 3.4 units short and left a bare band of scalp
   between the hairline and the headphones. */
const HAIR_CAP =
  "M-8.18 -5.6A8.3 8.3 0 1 1 8.18 -5.6" +
  "Q6.6 -2.2 3.4 -2.6Q0 -2.6 -3.4 -2.6Q-6.6 -2.2 -8.18 -5.6Z";
const HOOD =
  "M-7.4 -33Q-6.2 -37.8 0 -37.8Q6.2 -37.8 7.4 -33" +
  "Q3.8 -35 0 -35Q-3.8 -35-7.4 -33Z";
const STAR = "M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z";

/* one clock for the whole routine. keyTimes are carried at four decimals:
   at two, keys 0.09s apart round onto the same value, the animation stops
   advancing there, and the browser silently holds the pose. */
const ktf = (v) => Math.round(v * 1e4) / 1e4;
const KT = (a) => a.map((s) => ktf(s.t / LOOP_S)).join(";");
const VS = (a, g) => a.map((s) => fine(g(s))).join(";");
const animT = (type, values, keyTimes, add = "sum") =>
  `<animateTransform attributeName="transform" type="${type}" additive="${add}" ` +
  `values="${values}" keyTimes="${keyTimes}" dur="${LOOP_S}s" ` +
  `repeatCount="indefinite" calcMode="linear"/>`;

const barTop = (b) => pt(b.plan.x + b.plan.w / 2, b.plan.y + b.plan.d / 2, b.h);
const DECK = pt(-46, 15, 0); /* on the plate, just in front of bar 0 */
const [S0, S1, S2] = BARS.map(barTop);

/* One 9s clock drives position, squash, limbs and sparks.
   The figure waits on the deck while the bars grow (they finish at 1.69s),
   then: up the bars, celebrate on the lit one, hop back down. Arc heights
   are a fraction of the figure's own height, so they survive a change of
   scale. Hops that run back to back (the way down) share a keyframe — the
   landing *is* the load for the next push. */
const HOPS = [
  /* [t0, dur, from, to, lift] */
  [1.70, 0.60, DECK, S0, 1.05],
  [3.10, 0.60, S0, S1, 0.95],
  [4.50, 0.60, S1, S2, 0.95],
  [5.85, 0.45, S2, S2, 0.5], // cheer
  [6.85, 0.45, S2, S2, 0.5], // cheer
  [7.70, 0.45, S2, S1, 0.75], // down
  [8.15, 0.40, S1, S0, 0.6],
  [8.55, 0.33, S0, DECK, 0.7],
];
const keys = [];
const at = (t, p) => keys.push({ t, x: p[0], y: p[1] });
const hop = ([t0, dur, from, to, lift]) => {
  for (let i = 1; i <= 4; i++) {
    const s = i / 4;
    keys.push({
      t: t0 + dur * s,
      x: from[0] + (to[0] - from[0]) * s,
      y: from[1] + (to[1] - from[1]) * s - lift * MASCOT_PX * 0.33 * Math.sin(Math.PI * s),
    });
  }
};
at(0, DECK);
at(1.7, DECK);
HOPS.forEach((h, i) => {
  hop(h);
  const next = HOPS[i + 1];
  /* stand still until the next hop — unless it is already leaving */
  if (next && next[0] > h[0] + h[1]) at(next[0], h[3]);
});
at(9, DECK);

/* Squash and stretch, anchored on the feet. The order is the whole point:
   load (down) → toe-off (up) → apex (near neutral) → reach → impact (the
   deepest squash) → rebound → settle. The earlier version had this
   backwards — stretched on takeoff, flattened at the apex — which is why
   the hops read as a slide rather than a jump. */
const SC = [
  [0, 1, 1],
  /* deck → bar 0 */
  [1.50, 0.88, 1.13], [1.70, 1.11, 0.91], [1.97, 1.03, 0.98],
  [2.15, 1.07, 0.95], [2.30, 0.84, 1.17], [2.52, 1.05, 0.96], [2.74, 1, 1],
  /* bar 0 → bar 1 */
  [2.90, 0.88, 1.13], [3.10, 1.11, 0.91], [3.37, 1.03, 0.98],
  [3.55, 1.07, 0.95], [3.70, 0.84, 1.17], [3.92, 1.05, 0.96], [4.14, 1, 1],
  /* bar 1 → the lit bar */
  [4.30, 0.88, 1.13], [4.50, 1.11, 0.91], [4.77, 1.03, 0.98],
  [4.95, 1.07, 0.95], [5.10, 0.84, 1.17], [5.32, 1.05, 0.96], [5.54, 1, 1],
  /* two cheer hops on the lit bar */
  [5.73, 0.91, 1.10], [5.85, 1.08, 0.94], [6.05, 1.02, 0.99],
  [6.23, 1.05, 0.97], [6.30, 0.88, 1.13], [6.48, 1.04, 0.97], [6.60, 1, 1],
  [6.73, 0.91, 1.10], [6.85, 1.08, 0.94], [7.05, 1.02, 0.99],
  [7.23, 1.05, 0.97], [7.30, 0.88, 1.13], [7.48, 1.04, 0.97], [7.60, 1, 1],
  /* down: every landing loads the next push, so it never stands up in between */
  [7.70, 1.03, 0.97], [7.93, 1, 1], [8.15, 0.87, 1.14],
  [8.29, 1.05, 0.96], [8.42, 1.02, 0.99],
  [8.55, 0.87, 1.14], [8.69, 1.05, 0.96], [8.78, 1.02, 0.99],
  [8.88, 0.87, 1.14], [9, 1, 1],
];

/* `up` is the shoulder; `fore` is the elbow measured inside the upper arm,
   so a straight arm reads 0 instead of a second absolute angle. The arms
   drive up at toe-off (that is where a jump's lift comes from), float at
   the apex, and swing down to absorb the landing. */
const ARM = [
  { t: 0, up: 13, fore: 9 },
  /* deck → bar 0 */
  { t: 1.50, up: 8, fore: 16 },     // back, while the weight loads
  { t: 1.70, up: 26, fore: 36 },    // drive
  { t: 1.97, up: 110, fore: -22 },  // thrown up with the body
  { t: 2.30, up: 126, fore: -16 },
  { t: 2.52, up: 70, fore: 8 },     // absorb
  { t: 2.74, up: 20, fore: 24 },
  { t: 2.90, up: 13, fore: 9 },
  /* bar 0 → bar 1 */
  { t: 3.10, up: 26, fore: 36 },
  { t: 3.37, up: 110, fore: -22 },
  { t: 3.70, up: 126, fore: -16 },
  { t: 3.92, up: 70, fore: 8 },
  { t: 4.14, up: 20, fore: 24 },
  { t: 4.30, up: 13, fore: 9 },
  /* bar 1 → the lit bar, landing straight into the cheer */
  { t: 4.50, up: 26, fore: 36 },
  { t: 4.77, up: 110, fore: -22 },
  { t: 5.10, up: 126, fore: -16 },
  { t: 5.32, up: 96, fore: -6 },
  { t: 5.54, up: 128, fore: -24 },  // hands stay up from here
  { t: 5.73, up: 120, fore: -12 },  // dip to load the cheer hop
  { t: 5.85, up: 138, fore: -30 },
  { t: 6.30, up: 130, fore: -18 },
  { t: 6.60, up: 134, fore: -24 },
  { t: 6.73, up: 122, fore: -14 },
  { t: 6.85, up: 140, fore: -30 },
  { t: 7.30, up: 132, fore: -20 },
  { t: 7.60, up: 136, fore: -24 },
  /* down: arms out for balance, lowering the whole way home */
  { t: 7.70, up: 118, fore: -14 },
  { t: 7.93, up: 104, fore: -6 },
  { t: 8.15, up: 92, fore: 2 },
  { t: 8.42, up: 78, fore: 6 },
  { t: 8.55, up: 68, fore: 10 },
  { t: 8.78, up: 46, fore: 16 },
  { t: 8.88, up: 30, fore: 20 },
  { t: 9, up: 13, fore: 9 },
];

/* A hop moves both legs together — this is a jump, not a walk.
   The rule that makes it read: whenever the figure is *on* a surface the
   legs stay near neutral, because rotating a leg swings its foot off the
   ledge (the load and the impact are carried by the squash instead, which
   compresses toward the feet and leaves them planted). Big angles are only
   used while the figure is in the air. hip > 0 swings the leg toward +x,
   which is the direction of travel on the way up. */
const LEG = [
  { t: 0, hip: 0, knee: 5 },
  /* deck → bar 0 */
  { t: 1.50, hip: 6, knee: 12 },     // load: feet stay on the plate
  { t: 1.70, hip: -14, knee: -20 },  // toe-off: legs extend back
  { t: 1.97, hip: 55, knee: -110 },  // tuck at the apex
  { t: 2.15, hip: 34, knee: -6 },    // reach forward for the ledge
  { t: 2.30, hip: 6, knee: 12 },     // absorb: feet on bar 0
  { t: 2.52, hip: 3, knee: 8 },
  { t: 2.74, hip: 0, knee: 5 },
  /* bar 0 → bar 1 */
  { t: 2.90, hip: 6, knee: 12 },
  { t: 3.10, hip: -14, knee: -20 },
  { t: 3.37, hip: 55, knee: -110 },
  { t: 3.55, hip: 34, knee: -6 },
  { t: 3.70, hip: 6, knee: 12 },
  { t: 3.92, hip: 3, knee: 8 },
  { t: 4.14, hip: 0, knee: 5 },
  /* bar 1 → the lit bar */
  { t: 4.30, hip: 6, knee: 12 },
  { t: 4.50, hip: -14, knee: -20 },
  { t: 4.77, hip: 55, knee: -110 },
  { t: 4.95, hip: 34, knee: -6 },
  { t: 5.10, hip: 6, knee: 12 },
  { t: 5.32, hip: 3, knee: 8 },
  { t: 5.54, hip: 0, knee: 5 },
  /* cheer hops: the same load-and-extend, half as deep */
  { t: 5.73, hip: 5, knee: 10 },
  { t: 5.85, hip: -10, knee: -16 },
  { t: 6.05, hip: 10, knee: -30 },   // light cheer hop — knees bend, feet stay on the bar
  { t: 6.23, hip: 6, knee: -6 },
  { t: 6.30, hip: 5, knee: 10 },
  { t: 6.48, hip: 3, knee: 7 },
  { t: 6.60, hip: 0, knee: 5 },
  { t: 6.73, hip: 5, knee: 10 },
  { t: 6.85, hip: -10, knee: -16 },
  { t: 7.05, hip: 10, knee: -30 },
  { t: 7.23, hip: 6, knee: -6 },
  { t: 7.30, hip: 5, knee: 10 },
  { t: 7.48, hip: 3, knee: 7 },
  { t: 7.60, hip: 0, knee: 5 },
  /* down: the figure always faces forward (+x), so the legs reach forward on
     the way down too — leading with the front foot, then settling */
  { t: 7.70, hip: 20, knee: -8 },    // front foot reaches off the ledge
  { t: 7.93, hip: 30, knee: -14 },   // reaching forward through the drop
  { t: 8.15, hip: 8, knee: 10 },     // absorb on bar 1, feet planted
  { t: 8.42, hip: 22, knee: -10 },   // reaches into the next step-off
  { t: 8.55, hip: 8, knee: 10 },
  { t: 8.78, hip: 22, knee: -10 },
  { t: 8.88, hip: 8, knee: 10 },
  { t: 8.96, hip: 3, knee: 8 },
  { t: 9, hip: 0, knee: 5 },
];

const TILT = [
  { t: 0, a: 0 }, { t: 4.5, a: 0 }, { t: 5.4, a: -7 },
  { t: 7.5, a: -7 }, { t: 8.1, a: 0 }, { t: 9, a: 0 },
];

const limb = (cls, d) => `<path class="${cls}" d="${d}"/>`;

const legAt = (s) =>
  `<g transform="translate(${fine(s * HIP_X)} ${HIP_Y})">` +
  animT("rotate", VS(LEG, (v) => -s * v.hip), KT(LEG)) +
  limb("m-limb", capsule(THIGH, 4.2, 3.4)) +
  `<g transform="translate(0 ${THIGH})">` +
  animT("rotate", VS(LEG, (v) => -s * v.knee), KT(LEG)) +
  limb("m-limb", capsule(SHIN, 3.4, 2.6)) +
  `<path class="m-foot" d="${FOOT}" transform="translate(0 ${SHIN})"/>` +
  `</g></g>`;

/* the local frame's +x points along the shoulder axis, so a positive
   rotation swings a limb across the body — negating puts the swing on the
   outside, arms up in a V rather than crossed over the head */
const armAt = (s) =>
  `<g transform="translate(${fine(s * SH_X)} ${SH_Y})">` +
  animT("rotate", VS(ARM, (v) => -s * v.up), KT(ARM)) +
  limb("m-body", capsule(UPPER, 3.3, 2.7)) +
  `<g transform="translate(0 ${UPPER})">` +
  animT("rotate", VS(ARM, (v) => -s * v.fore), KT(ARM)) +
  limb("m-body", capsule(FORE, 2.7, 2.2)) +
  `<circle class="m-skin" cx="0" cy="${FORE}" r="2.7"/>` +
  `<circle fill="url(#mg-ball)" stroke="none" cx="0" cy="${FORE}" r="2.7"/>` +
  `</g></g>`;

const headAt =
  `<g transform="translate(0 ${NECK_Y})">` +
  animT("rotate", VS(TILT, (v) => v.a), KT(TILT)) +
  `<rect class="m-skin" x="-3.4" y="-.5" width="6.8" height="4.5" rx="2" />` +
  /* the face is a lit sphere; the hair sits on it as a cap with a fringe,
     so at banner size the head reads as a character, not a dark blob */
  `<circle class="m-skin" cx="0" cy="${HEAD_Y}" r="${HEAD_R}"/>` +
  `<circle fill="url(#mg-ball)" stroke="none" cx="0" cy="${HEAD_Y}" r="${HEAD_R}"/>` +
  `<path class="m-hair" d="${HAIR_CAP}"/>` +
  `<path fill="url(#mg-ball)" stroke="none" d="${HAIR_CAP}"/>` +
  `<path class="m-hair-hi" d="M-5.8 ${fine(HEAD_Y - 5.4)}A7.2 7.2 0 0 1 1.4 ${fine(HEAD_Y - 7.2)}"/>` +
  /* The band runs earcup to earcup OVER the crown — the way the climb mascot
     wears its headphones. Lying flat across the skull it read as a stray
     ribbon at banner size, and its ends met nothing (they sat 5.4 units
     above the earcups). The control lifts the apex to just under the crown,
     so the arc hugs the head instead of floating across it. */
  `<path class="m-band" d="M-7.6 ${fine(HEAD_Y + 1)}Q0 ${fine(2 * HEAD_Y - 2 * HEAD_R + 7.6)} 7.6 ${fine(HEAD_Y + 1)}"/>` +
  `<circle class="m-skin" cx="-7.6" cy="${HEAD_Y + 1}" r="2.4"/>` +
  `<circle class="m-skin" cx="7.6" cy="${HEAD_Y + 1}" r="2.4"/>` +
  `</g>`;

/* Contact shadow: the figure is a solid standing on a surface, so it casts
   the same grounded read the bars get from their halos. It rides the hop
   clock — firm and tight underfoot on a ledge, wide and faint in the air. */
const SHADOW = [
  { t: 0, o: 0.4, s: 1 },
  /* up: lifts and fades the moment it leaves the deck */
  { t: 1.7, o: 0.4, s: 1 }, { t: 1.97, o: 0.14, s: 1.5 },
  { t: 2.3, o: 0.42, s: 0.96 },
  { t: 3.1, o: 0.4, s: 1 }, { t: 3.37, o: 0.14, s: 1.5 },
  { t: 3.7, o: 0.42, s: 0.96 },
  { t: 4.5, o: 0.4, s: 1 }, { t: 4.77, o: 0.14, s: 1.5 },
  { t: 5.1, o: 0.42, s: 0.96 },
  /* cheer hops on the lit bar */
  { t: 5.85, o: 0.4, s: 1 }, { t: 6.05, o: 0.18, s: 1.4 },
  { t: 6.3, o: 0.42, s: 0.96 },
  { t: 6.85, o: 0.4, s: 1 }, { t: 7.05, o: 0.18, s: 1.4 },
  { t: 7.3, o: 0.42, s: 0.96 },
  /* down: three quick steps, shadow snapping to each ledge */
  { t: 7.7, o: 0.4, s: 1 }, { t: 7.93, o: 0.16, s: 1.45 },
  { t: 8.15, o: 0.42, s: 0.96 }, { t: 8.42, o: 0.16, s: 1.45 },
  { t: 8.55, o: 0.42, s: 0.96 }, { t: 8.78, o: 0.16, s: 1.45 },
  { t: 8.88, o: 0.42, s: 0.96 }, { t: 9, o: 0.4, s: 1 },
];

const shadow =
  `<g>` +
  `<ellipse cx="0" cy="0" rx="9" ry="3" fill="url(#mg-ground)" opacity="${SHADOW[0].o}">` +
  `<animate attributeName="opacity" values="${SHADOW.map((s) => s.o).join(";")}" ` +
  `keyTimes="${SHADOW.map((s) => ktf(s.t / LOOP_S)).join(";")}" ` +
  `dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>` +
  `</ellipse>` +
  `<animateTransform attributeName="transform" type="scale" additive="sum" ` +
  `values="${SHADOW.map((s) => `${fine(s.s)} ${fine(s.s)}`).join(";")}" ` +
  `keyTimes="${SHADOW.map((s) => ktf(s.t / LOOP_S)).join(";")}" ` +
  `dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>` +
  `</g>`;

const figure =
  /* contact shadow on the surface, then legs behind, trunk, arms in front,
     head on top — a real body stack standing on a cast shadow */
  shadow +
  legAt(-1) + legAt(1) +
  `<path class="m-body" d="${TORSO}"/>` +
  limb("m-limb", HOOD) +
  armAt(-1) + armAt(1) +
  headAt;

/* a small spark on each landing on the lit bar — the terracotta accent,
   and the only confetti this banner gets */
const sparks = [{ t0: 5.12, x: -14, y: -48, s: 1 }, { t0: 6.32, x: 13, y: -52, s: 0.85 }]
  .map((s) => {
    const kk = `0;${ktf(s.t0 / LOOP_S)};${ktf((s.t0 + 0.3) / LOOP_S)};${ktf((s.t0 + 0.75) / LOOP_S)};1`;
    const fade =
      `<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="${kk}" ` +
      `dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>`;
    /* no additive here: the base is scale(0), and summing a scale onto a
       zero scale is still a zero scale — replace is what makes it pop */
    return (
      `<g transform="translate(${s.x} ${s.y}) scale(${s.s})">` +
      `<g transform="scale(0)" opacity="0">` +
      `<animateTransform attributeName="transform" type="scale" values="0;0;1;0;0" ` +
      `keyTimes="${kk}" dur="${LOOP_S}s" repeatCount="indefinite" calcMode="linear"/>` +
      fade + `<path class="m-star" d="${STAR}"/></g></g>`
    );
  })
  .join("");

isoBody.push(
  `<g transform="translate(${fine(DECK[0])} ${fine(DECK[1])})">` +
  animT("translate", keys.map((s) => `${fine(s.x)} ${fine(s.y)}`).join(";"), KT(keys), "replace") +
  `<g transform="scale(1 1)">` +
  animT("scale", SC.map((s) => `${fine(s[1])} ${fine(s[2])}`).join(";"),
    SC.map((s) => ktf(s[0] / LOOP_S)).join(";")) +
  `<g transform="${FRAME}">${figure}</g>` +
  `</g>` +
  `<g transform="${FRAME}">${sparks}</g>` +
  `</g>`,
);

/* ------------------------------------------------------------------ *
 * Copy
 * ------------------------------------------------------------------ */
/* the banner copy lives in copy.mjs so fonts.mjs subsets to it exactly */
const { EYEBROW, NAME, TAGLINE, CHIPS } = HEADER;

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
/* Display type: 97px is large enough that tracking must tighten with it —
   -3.4px ≈ -0.035em, the sweet spot in the -0.02…-0.05em band for this size. */
const nameAttrs =
  `class="h" x="${M}" y="212" font-size="97" font-weight="400" letter-spacing="-3.4"`;

/* chip geometry, measured rather than hand-typed */
const chipH = 32;
let chipX = M;
const chipBoxes = CHIPS.map((label) => {
  const w = Math.round(label.length * 7.6 + 34);
  const box = { x: chipX, w };
  chipX += w + 10;
  return box;
});

/* pill width measured from the plain-text length (the entity above is 5 chars):
   12px Inter 600 caps average ≈9.75px of advance incl. the 2.1px tracking */
const EYEBROW_TEXT = HEADER.EYEBROW_PLAIN;
const eyebrowW = 34 + EYEBROW_TEXT.length * 9.75 + 30;

function build(name) {
  const T = THEMES[name];
  const C = T.c;
  const [g0, g1, g2] = T.bg;
  const [e0, e1] = T.ember;
  const [st, sto] = T.stroke;
  const [bd, bdo] = T.border;
  const [gl0, gl1] = T.glass;
  const ISO = `${k.ISO_CSS}${T.iso}${MASCOT_CSS}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="ttl dsc">
  <title id="ttl">Prince R — B.Tech in Artificial Intelligence &amp; Data Science</title>
  <desc id="dsc">${T.desc}</desc>

  <defs>
    <style>
      /* faces inlined as base64: this file is XML, and a camo-hosted image
         never runs external CSS, so an import here would silently do nothing */
      ${FONT_CSS}
      .h{font-family:${DISPLAY};font-optical-sizing:auto;font-kerning:normal;text-rendering:optimizeLegibility}
      .b{font-family:${BODY};font-kerning:normal;text-rendering:optimizeLegibility}
${ISO}
    </style>

    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0"   stop-color="${g0}"/>
      <stop offset=".5"  stop-color="${g1}"/>
      <stop offset="1"   stop-color="${g2}"/>
    </linearGradient>

    <!-- the one chromatic accent: a single slow ember, not an atmosphere -->
    <radialGradient id="ember" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(948 208) scale(330 300)">
      <stop offset="0"   stop-color="${C.lit}" stop-opacity="${e0}"/>
      <stop offset=".46" stop-color="${C.lit}" stop-opacity="${e1}"/>
      <stop offset="1"   stop-color="${C.lit}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="emberWarm" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(300 380) scale(420 210)">
      <stop offset="0"   stop-color="#E8A55A" stop-opacity="${T.emberWarm}"/>
      <stop offset="1"   stop-color="#E8A55A" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="rule" x1="${M}" y1="0" x2="${W - M}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0"   stop-color="${C.hair}" stop-opacity="0"/>
      <stop offset=".2"  stop-color="${C.hair}" stop-opacity="1"/>
      <stop offset=".5"  stop-color="${C.lit}"  stop-opacity=".85"/>
      <stop offset=".8"  stop-color="${C.hair}" stop-opacity="1"/>
      <stop offset="1"   stop-color="${C.hair}" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${gl0[0]}" stop-opacity="${gl0[1]}"/>
      <stop offset="1" stop-color="${gl1[0]}" stop-opacity="${gl1[1]}"/>
    </linearGradient>

    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset=".5"  stop-color="#FFFFFF" stop-opacity="${T.sweep}"/>
      <stop offset="1"   stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>

    <clipPath id="frame"><rect x="0" y="0" width="${W}" height="${H}" rx="24"/></clipPath>

    ${MASCOT_DEFS()}

    <mask id="nameMask">
      <rect width="${W}" height="${H}" fill="#000"/>
      <text ${nameAttrs} fill="#fff">${NAME}</text>
    </mask>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- two slow, low-contrast glows. no grid, no particles, no rings. -->
    <g filter="url(#soft)">
      <rect width="${W}" height="${H}" fill="url(#ember)">
        <animate attributeName="opacity" values=".62;.95;.62" dur="13s" repeatCount="indefinite"/>
      </rect>
      <rect width="${W}" height="${H}" fill="url(#emberWarm)"/>
    </g>

    <!-- eyebrow -->
    <g>
      <rect x="${M}" y="84" width="${eyebrowW.toFixed(0)}" height="32" rx="16" fill="url(#glass)" stroke="${st}" stroke-opacity="${sto}"/>
      <circle cx="${M + 20}" cy="100" r="3.4" fill="${C.lit}">
        <animate attributeName="opacity" values="1;.4;1" dur="3.4s" repeatCount="indefinite"/>
      </circle>
      <text class="b" x="${M + 34}" y="104.5" font-size="12" font-weight="600" letter-spacing="2.1" fill="${C.muted}">${EYEBROW}</text>
    </g>

    <!-- name -->
    <!-- display type is set flat: no gradient, no shadow, no stroke on a headline.
         the light sweeping across it is motion, not fill. -->
    <text ${nameAttrs} fill="${C.hi}">${NAME}</text>
    <g mask="url(#nameMask)">
      <rect x="-400" y="118" width="360" height="120" fill="url(#sweep)">
        <animateTransform attributeName="transform" type="translate"
                          values="-380 0; 1120 0" dur="7.5s" repeatCount="indefinite"/>
      </rect>
    </g>

    <!-- punchline — optically flush with the P above it, not indented -->
    <text class="b" x="${M}" y="258" font-size="18.5" font-weight="400" fill="${C.muted}" letter-spacing=".15">
      ${TAGLINE}
    </text>

    <!-- stack chips — same 12px as the eyebrow: one label size, not two near-identical ones -->
    <g class="b" font-size="12" font-weight="500" letter-spacing=".5">
      ${chipBoxes.map((b) => `<rect x="${b.x}" y="284" width="${b.w}" height="${chipH}" rx="16" fill="url(#glass)" stroke="${st}" stroke-opacity="${sto}"/>`).join("\n      ")}
      ${CHIPS.map((label, i) => `<text x="${chipBoxes[i].x + chipBoxes[i].w / 2}" y="305" text-anchor="middle" fill="${C.ink}">${label}</text>`).join("\n      ")}
    </g>

    <!-- isometric artifact -->
    <g class="iso" transform="translate(${W - M - SW - 6} ${(H - SH) / 2 - 4})">
      <g class="iso-scene">
${isoBody.join("\n")}
      </g>
    </g>

    <!-- bottom rule -->
    <rect x="${M}" y="368" width="${W - M * 2}" height="1.2" fill="url(#rule)">
      <animate attributeName="opacity" values=".5;.85;.5" dur="9s" repeatCount="indefinite"/>
    </rect>

    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="${T.grain}"/>
  </g>

  <rect x="0.6" y="0.6" width="${W - 1.2}" height="${H - 1.2}" rx="23.4" fill="none" stroke="${bd}" stroke-opacity="${bdo}"/>
</svg>
`;
  return svg;
}

for (const name of ["dark", "light"]) {
  const svg = build(name);
  const file = name === "light" ? "header.light.svg" : "header.svg";
  writeFileSync(join(HERE, "..", "assets", file), assertClean(svg, file));
  console.log(`${file} bytes:`, svg.length, "| iso solids:", (svg.match(/iso-solid/g) || []).length);
}
