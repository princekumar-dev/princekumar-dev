import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 660;
const H = 480;

/* ------------------------------------------------------------------ *
 * Palette — Claude design language (design-md/claude/DESIGN.md).
 * Two themes so <picture> can serve the right one to GitHub's light and
 * dark modes: a warm-dark floor, and Claude's own cream canvas.
 * One chromatic accent only: coral #cc785c. Amber is illustration-only.
 * ------------------------------------------------------------------ */
const THEMES = {
  dark: {
    css: `
.iso{
  --anatomy-page:#181715;
  --anatomy-card:#1F1D1A;
  --anatomy-paper:#23211D;
  --anatomy-face:#2E2A25;
  --anatomy-top:#3A352D;
  --anatomy-shade-0:#141312;
  --anatomy-shade-1:#191715;
  --anatomy-shade-2:#1E1C19;
  --anatomy-shade-3:#242220;
  --anatomy-lit-top:#4A443A;
  --anatomy-lit-shade:#262320;
  --anatomy-hi:#F4F1EA;
  --anatomy-mid:#B9B2A6;
  --anatomy-lo:#5E574D;
  --anatomy-faint:#332F2A;
  --anatomy-lit:#CC785C;
  --anatomy-halo:#000000;
  --anatomy-halo-opacity:.85;
  --anatomy-dot:#E8E3D9;
  --anatomy-red:#CC785C;
  --anatomy-green:#5DB872;
  --anatomy-blue:#E8A55A;
  --anatomy-weight:.55px;
  --anatomy-lift:none;
}
.iso-svg{width:auto;height:auto}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
.iso-cup{fill:#38322B;stroke:#6E665A;stroke-width:.7}
.iso-cup-in{fill:#1C1A17;stroke:#544E44;stroke-width:.5}
.iso-band{fill:none;stroke:#575046;stroke-width:6;stroke-linecap:round}
.iso-band-hi{fill:none;stroke:#847B6C;stroke-width:1.8;stroke-linecap:round}
`,
    /* raw hexes the generator interpolates directly (var() is unsafe in
       presentation attributes, so gradients get real values) */
    hood: ["#FFFCF6", "#EDE6D9", "#C8BFAD", "#B3AA99", "#DCD3C2"],
    hair: ["#2E2A25", "#3E382F", "#1C1A17"],
    page: "#181715",
  },
  light: {
    css: `
.iso[data-theme="light"]{
  --anatomy-page:#FAF9F5;
  --anatomy-card:#F5F0E8;
  --anatomy-paper:#EFE9DE;
  --anatomy-face:#E8E0D2;
  --anatomy-top:#DCD2C0;
  --anatomy-shade-0:#F7F3EC;
  --anatomy-shade-1:#F2ECE2;
  --anatomy-shade-2:#EBE3D6;
  --anatomy-shade-3:#E3D9C9;
  --anatomy-lit-top:#CFC3AD;
  --anatomy-lit-shade:#D8CDB9;
  --anatomy-hi:#141413;
  --anatomy-mid:#6C6A64;
  --anatomy-lo:#A69F92;
  --anatomy-faint:#D8D0C2;
  --anatomy-lit:#CC785C;
  --anatomy-halo:#8E8B82;
  --anatomy-halo-opacity:.30;
  --anatomy-dot:#3D3D3A;
  --anatomy-red:#CC785C;
  --anatomy-green:#5DB872;
  --anatomy-blue:#E8A55A;
  --anatomy-weight:.55px;
  --anatomy-lift:none;
}
.iso-svg{width:auto;height:auto}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
.iso-cup{fill:#C6BAA4;stroke:#8E8574;stroke-width:.7}
.iso-cup-in{fill:#F2ECE2;stroke:#A69F92;stroke-width:.5}
.iso-band{fill:none;stroke:#9E9482;stroke-width:6;stroke-linecap:round}
.iso-band-hi{fill:none;stroke:#C6BAA4;stroke-width:1.8;stroke-linecap:round}
`,
    hood: ["#FFFDF8", "#F3EDE1", "#D4C9B4", "#B3AA99", "#E4DBC9"],
    hair: ["#3D362E", "#544A3C", "#241F1A"],
    page: "#FAF9F5",
  },
};

/* current theme — set by the emit loop below */
let T = THEMES.dark;

/* ------------------------------------------------------------------ *
 * Geometry helpers
 * ------------------------------------------------------------------ */
const pt = (x, y, z) => k.iso([x, y, z], P);
const poly = (pts, close = true) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + (close ? " Z" : "");
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

/* circle lying in a plane of constant x (spans y,z) — ear cups, mug handle */
const circleX = (x, cy, cz, r, n = 34, from = 0, span = Math.PI * 2) =>
  Array.from({ length: span >= Math.PI * 2 ? n : n + 1 }, (_, i) => {
    const t = from + (i / n) * span;
    return pt(x, cy + Math.cos(t) * r, cz + Math.sin(t) * r);
  });

/* circle lying in a plane of constant y (spans x,z) — headphone band */
const circleY = (y, cx, cz, r, n = 34, from = 0, span = Math.PI * 2) =>
  Array.from({ length: span >= Math.PI * 2 ? n : n + 1 }, (_, i) => {
    const t = from + (i / n) * span;
    return pt(cx + Math.cos(t) * r, y, cz + Math.sin(t) * r);
  });

/* screen-space tube: three nested round-capped strokes = four-tone volume */
const tube = (d, w, face = "var(--anatomy-top)", shade = "var(--anatomy-shade-1)", top = "var(--anatomy-lit-top)") =>
  [
    `<path class="iso-tube" d="${d}" fill="none" stroke="${face}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path class="iso-tube" d="${d}" fill="none" stroke="${shade}" stroke-width="${(w - 5).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 2.4)"/>`,
    `<path class="iso-tube" d="${d}" fill="none" stroke="${top}" stroke-width="${(w - 8).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"/>`,
  ].join("");

/* rounded polygon in screen space — organic silhouettes the kit can't extrude */
const roundedPoly = (pts, r) => {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const trim = (from, to) => {
      const dx = to[0] - from[0], dy = to[1] - from[1];
      const len = Math.hypot(dx, dy) || 1;
      const t = Math.min(r, len / 2) / len;
      return [from[0] + dx * t, from[1] + dy * t];
    };
    const a = trim(p, prev);
    const b = trim(p, next);
    const f = (q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
    d += `${i === 0 ? "M" : "L"}${f(a)}Q${f(p)} ${f(b)}`;
  }
  return `${d}Z`;
};

/* screen-space sphere: a ball projects to a circle, so shade it in 2D.
   This projection is conformal (M·Mᵀ = σ²·I), so the radius is σ·r — NOT P.scale·r.
   Computed lazily: P is declared further down. */
let sigmaCache = null;
const sigma = () => {
  if (sigmaCache === null) {
    const o = k.iso([0, 0, 0], P);
    const img = (x, y, z) => { const q = k.iso([x, y, z], P); return [q[0] - o[0], q[1] - o[1]]; };
    const basis = [img(1, 0, 0), img(0, 1, 0), img(0, 0, 1)];
    sigmaCache = Math.sqrt(basis.reduce((s, v) => s + v[0] * v[0] + v[1] * v[1], 0) / 2);
  }
  return sigmaCache;
};

let sphereId = 0;
const sphere = (x, y, z, r, { fill, lit, shade, outline = "var(--anatomy-lo)" }) => {
  const [cx, cy] = pt(x, y, z);
  const R = r * sigma();
  const id = `sp${sphereId++}`;
  return (
    `<clipPath id="${id}"><circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}"/></clipPath>` +
    `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}" fill="${fill}"/>` +
    `<g clip-path="url(#${id})">` +
    `<ellipse cx="${(cx - 2).toFixed(2)}" cy="${(cy - R * 0.44).toFixed(2)}" rx="${(R * 0.97).toFixed(2)}" ry="${(R * 0.72).toFixed(2)}" fill="${lit}"/>` +
    `<ellipse cx="${(cx + 1).toFixed(2)}" cy="${(cy + R * 0.88).toFixed(2)}" rx="${(R * 1.16).toFixed(2)}" ry="${(R * 0.6).toFixed(2)}" fill="${shade}"/>` +
    `</g>` +
    `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}" fill="none" stroke="${outline}" stroke-width=".5"/>`
  );
};

/* ------------------------------------------------------------------ *
 * Plans
 * ------------------------------------------------------------------ */
const FLOOR = { x: -122, y: -80, w: 266, d: 166, r: 14 };
const FLOOR_T = 8;
const FLOOR_B = -FLOOR_T;

const DESK_TOP = { x: -105, y: -64, w: 200, d: 128, r: 8 };
const DESK_Z = 60;
const DESK_T = 6;
const DESK_TOP_Z = DESK_Z + DESK_T;

const CABINET = { x: -102, y: -60, w: 28, d: 120, r: 3 };
const CABINET_FACE = CABINET.x + CABINET.w;                 // +x face, near
const PANEL = { x: 62, y: -60, w: 24, d: 120, r: 3 };

const MON = { x: -72, y: -46, w: 8, d: 92, r: 4 };
const MON_Z = 82;
const MON_H = 70;
const MON_TOP = MON_Z + MON_H;
const MON_FACE = MON.x + MON.w;                             // +x face, near
/* the post sits on the far (-x) side, so it reads as BEHIND the screen
   rather than drifting down-right of it */
const POST = [-84, 0];
const POST_R = 17;

const KB = { x: 8, y: -34, w: 68, d: 56, r: 4 };
const KB_Z = DESK_TOP_Z;
const KB_T = 5;
const KB_TOP = KB_Z + KB_T;

const MOUSE = { x: 80, y: -24, w: 14, d: 26, r: 7 };
const MUG = [-40, 46];
const POT = [-92, 44];
const BOOKS = { x: -34, y: -50, w: 30, d: 22, r: 3 };

/* desk lamp, back-right corner, arm reaching over the keyboard */
const LAMP = [66, -50];
const LAMP_ARM = [
  [LAMP[0], LAMP[1], DESK_TOP_Z + 4],
  [LAMP[0], LAMP[1], DESK_TOP_Z + 54],
  [LAMP[0] - 12, LAMP[1] + 6, DESK_TOP_Z + 74],
  [LAMP[0] - 34, LAMP[1] + 14, DESK_TOP_Z + 82],
];
const SHADE = [LAMP[0] - 42, LAMP[1] + 18, DESK_TOP_Z + 76];
const SHADE_R = 9.5;

const CHAIR = [114, 6];
const SEAT = { x: 90, y: -19, w: 46, d: 48, r: 8 };
const SEAT_Z = 43;
const BACK = { x: 128, y: -15, w: 7, d: 40, r: 3 };
const BACK_TOP = 66;

const HEAD = [100, 0];
const HEAD_Z = 106;
const HEAD_R = 22;
const HEAD_MID = HEAD_Z + 13;

const fits = [
  ...k.boxCorners(FLOOR, FLOOR_B - 5, 0),
  [MON.x, MON.y, MON_TOP + 4], [MON_FACE, MON.y + MON.d, MON_TOP + 4],
  [HEAD[0], HEAD[1] - HEAD_R, 138], [HEAD[0], HEAD[1] + HEAD_R, 138],
  [BACK.x + BACK.w, CHAIR[1] + 26, 4],
  [SHADE[0], SHADE[1], SHADE[2] + 18],
  ...k.boxCorners(BOOKS, DESK_TOP_Z, DESK_TOP_Z + 16),
];

const P = k.fitProjection(fits, W, H, { pad: 34, azimuth: 45, elevation: 30 });

/* ------------------------------------------------------------------ *
 * Parts
 * ------------------------------------------------------------------ */
function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FLOOR, FLOOR_B - 5, FLOOR_T, P)}"/>`];
  for (const [x, y] of k.corners(FLOOR, 26)) {
    out.push(S(k.cylinder(x, y, 10, FLOOR_B - 5, 2, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 8, FLOOR_B - 3, 3, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(FLOOR, FLOOR_B, FLOOR_T, P, 10, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(FLOOR, 6), 0, P, 10), { tone: "lo" }));
  const screws = k.corners(FLOOR, 14);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => pt(x, y, 0)), { size: 0.5, tone: "mid" }));

  /* engraved label plate on the near edge */
  const plate = { x: -46, y: FLOOR.y + FLOOR.d - 26, w: 96, d: 12, r: 2 };
  out.push(S(k.slabOf(plate, 0, 0.7, P, 3, 0.3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 3), 0.7, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([plate.x + 8, plate.y + 8.4], 0.8, P, "x"), "PRINCE R", { size: 4.4, tone: "lo" }));
  return out.join("");
}

function desk() {
  const out = [];
  /* left cabinet, three drawers on the near (+x) face */
  out.push(S(k.slabOf(CABINET, 0, DESK_Z, P, 4, 0.6), { tone: "mid" }));
  const drawers = [8, 26, 44].map((z) => ({ z, h: 14 }));
  for (const { z, h } of drawers) {
    out.push(L(k.segment([CABINET_FACE, CABINET.y + 6, z], [CABINET_FACE, CABINET.y + CABINET.d - 6, z], P), { tone: "lo" }));
    out.push(L(k.segment([CABINET_FACE, CABINET.y + 6, z + h], [CABINET_FACE, CABINET.y + CABINET.d - 6, z + h], P), { tone: "lo" }));
    out.push(S(k.cylinder(CABINET_FACE, CABINET.y + CABINET.d / 2, 3.4, z + h / 2 - 1.6, 3.2, P, 20), { tone: "hi", crease: "none" }));
  }

  /* right side panel with a cable grommet */
  out.push(S(k.slabOf(PANEL, 0, DESK_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 4), DESK_Z, P, 4), { tone: "faint" }));
  out.push(S(k.cylinder(PANEL.x + PANEL.w / 2, PANEL.y + PANEL.d / 2, 5, 0, 1.4, P, 20), { tone: "lo", crease: "none" }));

  /* desk top */
  out.push(`<path class="iso-halo" d="${k.haloOf(DESK_TOP, DESK_Z - 6, DESK_T + 6, P)}" style="filter:blur(7px)" opacity=".45"/>`);
  out.push(S(k.slabOf(DESK_TOP, DESK_Z, DESK_T, P, 8, 0.9), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(DESK_TOP, 5), DESK_TOP_Z, P, 8), { tone: "faint" }));
  /* cable trough along the far edge */
  const trough = { x: DESK_TOP.x + 12, y: DESK_TOP.y + 8, w: DESK_TOP.w - 24, d: 6, r: 2 };
  out.push(S(k.slabOf(trough, DESK_TOP_Z, 0.6, P, 3, 0.3), { tone: "lo", crease: "none" }));
  const tsk = k.corners(DESK_TOP, 10);
  out.push(D(tsk.map(([x, y]) => pt(x, y, DESK_TOP_Z)), { size: 0.45, tone: "lo" }));
  return out.join("");
}

function plant() {
  const [px, py] = POT;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: px - 14, y: py - 14, w: 28, d: 28, r: 14 }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".45"/>`];
  out.push(S(k.cylinder(px, py, 14, DESK_TOP_Z, 16, P, 28, 1.2), { tone: "mid" }));
  out.push(L(k.ring(px, py, 12, DESK_TOP_Z + 16, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(px, py, 11.5, DESK_TOP_Z + 13.6, 2.4, P, 28), { tone: "lo", crease: "none" }));
  /* leaf blades drawn in screen space */
  const [cx, cy] = pt(px, py, DESK_TOP_Z + 16.5);
  for (const [ang, len, wid, fill] of [
    [-38, 40, 10, "var(--anatomy-lo)"], [-14, 50, 11, "var(--anatomy-mid)"],
    [10, 48, 11, "var(--anatomy-lo)"], [34, 39, 10, "var(--anatomy-mid)"],
    [-24, 28, 8, "var(--anatomy-lo)"], [20, 27, 8, "var(--anatomy-shade-3)"],
  ]) {
    const a = (ang * Math.PI) / 180;
    const ex = cx + Math.sin(a) * (len / 2);
    const ey = cy - Math.cos(a) * (len / 2);
    out.push(`<ellipse cx="${ex.toFixed(2)}" cy="${ey.toFixed(2)}" rx="${(len / 2).toFixed(2)}" ry="${(wid / 2).toFixed(2)}" transform="rotate(${ang} ${ex.toFixed(2)} ${ey.toFixed(2)})" fill="${fill}" stroke="var(--anatomy-lo)" stroke-width=".45"/>`);
  }
  return out.join("");
}

function mug() {
  const out = [];
  const [x, y] = MUG;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 11, y: y - 11, w: 22, d: 22, r: 11 }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".5"/>`);
  out.push(S(k.cylinder(x, y, 11, DESK_TOP_Z, 21, P, 28, 1.4), { tone: "mid" }));
  out.push(L(k.ring(x, y, 9.4, DESK_TOP_Z + 21, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 9.4, DESK_TOP_Z + 18.4, 2.6, P, 28), { tone: "lo", crease: "none" }));
  out.push(L(poly(circleX(x, y + 10, DESK_TOP_Z + 11, 8.5, 22, -1.35, 2.7), false), { tone: "mid" }));

  /* steam — two slow wisps rising off the rim */
  const [rx, ry] = pt(x, y, DESK_TOP_Z + 22);
  for (const [dx, ph, sc] of [[-3.4, 0, 1], [3.2, 1.7, 0.8]]) {
    const d = `M${(rx + dx).toFixed(1)} ${ry.toFixed(1)} ` +
      `c-3 -6 3 -9 0 -14 c-3 -5 2 -8 0 -12`;
    out.push(
      `<g transform="translate(${(rx * (1 - sc)).toFixed(1)} ${(ry * (1 - sc)).toFixed(1)}) scale(${sc})">` +
        `<path d="${d}" fill="none" stroke="var(--anatomy-mid)" stroke-width="1.5" stroke-linecap="round" opacity="0">` +
          `<animate attributeName="opacity" values="0;.30;.17;0" keyTimes="0;.3;.7;1" dur="4.6s" begin="${ph}s" repeatCount="indefinite"/>` +
        `</path>` +
        `<path d="${d}" fill="none" stroke="var(--anatomy-mid)" stroke-width="1.5" stroke-linecap="round" opacity="0" transform="translate(0 -6)">` +
          `<animate attributeName="opacity" values="0;.20;.10;0" keyTimes="0;.45;.8;1" dur="4.6s" begin="${ph}s" repeatCount="indefinite"/>` +
          `<animateTransform attributeName="transform" type="translate" values="0 -6;0 -13" dur="4.6s" begin="${ph}s" repeatCount="indefinite"/>` +
        `</path>` +
      `</g>`,
    );
  }
  return out.join("");
}

function monitor() {
  const out = [];
  const [px, py] = POST;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: px - POST_R, y: py - POST_R, w: POST_R * 2, d: POST_R * 2, r: POST_R }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(6px)" opacity=".5"/>`);
  out.push(S(k.cylinder(px, py, POST_R, DESK_TOP_Z, 5, P, 44, 0.8), { tone: "mid" }));
  out.push(L(k.ring(px, py, POST_R - 4, DESK_TOP_Z + 5, P, 44), { tone: "faint" }));
  out.push(S(k.cylinder(px, py, 5, DESK_TOP_Z + 5, 36, P, 24), { tone: "mid" }));
  out.push(L(k.sideArc(px, py, 5, DESK_TOP_Z + 22, P, 12), { tone: "faint" }));
  /* mount arm runs from the post (-x side) to the back of the panel */
  out.push(S(k.slabOf({ x: px - 6, y: py - 9, w: 20, d: 18, r: 3 }, DESK_TOP_Z + 40, 6, P, 3, 0.5), { tone: "mid" }));

  out.push(S(k.slabOf(MON, MON_Z, MON_H, P, 5, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MON, 1.6), MON_TOP, P, 4), { tone: "faint" }));
  /* vent slots across the top edge */
  const vents = k.topTicks(MON.y + 7, MON.y + MON.d - 7, 6.5, 4, MON.x + 1.2, MON_TOP, [5.6, 5.6], P, "y");
  out.push(L(vents.minor, { tone: "faint" }));
  out.push(L(vents.major, { tone: "lo" }));

  /* ---- screen, drawn on the near (+x) face ---- */
  const m = k.sideMatrix([MON_FACE, MON.y + MON.d], MON_TOP, P, "right");
  const rect = (x, y, w, h, fill, rx = 1, extra = "") =>
    `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${rx}" fill="${fill}"${extra}/>`;
  const scr = { x: 6, y: 9, w: 92, h: 53 };
  const lines = [];
  lines.push(rect(scr.x, scr.y, scr.w, scr.h, "var(--anatomy-page)"));
  lines.push(`<g fill="none" stroke="var(--anatomy-faint)" stroke-width=".5"><rect x="${scr.x + .25}" y="${scr.y + .25}" width="${scr.w - .5}" height="${scr.h - .5}" rx="1.6"/></g>`);
  /* title bar */
  lines.push(rect(scr.x, scr.y, scr.w, 9, "var(--anatomy-shade-1)"));
  [12, 18, 24].forEach((cx) => lines.push(`<circle cx="${cx}" cy="${scr.y + 4.6}" r="1.5" fill="var(--anatomy-lo)"/>`));
  lines.push(rect(scr.x + 34, scr.y + 3.2, 30, 2.8, "var(--anatomy-shade-3)", 1.4));

  /* one 8s loop: type in → hold → clear */
  const LOOP = "8s";
  const rows = [
    { y: 21, segs: [[12, 13], [28, 8], [40, 17]], lit: false },
    { y: 27, segs: [[17, 22], [43, 11]], lit: false },
    { y: 33, segs: [[17, 9], [29, 24]], lit: false },
    { y: 39, segs: [[12, 18], [34, 6], [44, 14]], lit: true },
    { y: 45, segs: [[17, 12], [33, 20]], lit: false },
    { y: 51, segs: [[12, 7], [23, 15]], lit: false },
  ];
  const flat = [];
  rows.forEach((row, ri) => row.segs.forEach(([sx, sw]) => flat.push({ sx, sy: row.y, sw, lit: row.lit, ri })));
  const at = (i) => 0.05 + i * 0.028;
  const END = 0.86;
  const last = flat[flat.length - 1];

  /* the caret band steps down a row at a time as each line lands */
  const bandY = rows.map((r) => r.y - 1.2);
  const firstOfRow = rows.map((_, ri) => flat.findIndex((s) => s.ri === ri));
  const bv = [], bt = [];
  bt.push("0"); bv.push(String(bandY[0]));
  for (let i = 0; i < rows.length; i++) {
    const a = at(firstOfRow[i]);
    const b = i + 1 < rows.length ? at(firstOfRow[i + 1]) - 0.003 : END;
    bt.push(a.toFixed(4), b.toFixed(4));
    bv.push(String(bandY[i]), String(bandY[i]));
  }
  bt.push("1"); bv.push(String(bandY[bandY.length - 1]));
  lines.push(
    `<rect x="${scr.x}" y="${bandY[0]}" width="${scr.w}" height="5.2" fill="var(--anatomy-lit)" opacity=".07">` +
      `<animate attributeName="y" values="${bv.join(";")}" keyTimes="${bt.join(";")}" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  /* code segments appear one after another, then the buffer clears */
  flat.forEach((s, i) => {
    const a = at(i).toFixed(4);
    const op = s.lit ? 0.95 : 0.5;
    lines.push(
      `<rect x="${s.sx}" y="${s.sy}" width="${s.sw}" height="3" rx="1" fill="${s.lit ? "var(--anatomy-lit)" : "var(--anatomy-mid)"}" opacity="0">` +
        `<animate attributeName="opacity" values="0;0;${op};${op};0" keyTimes="0;${a};${(+a + 0.005).toFixed(4)};${END};1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `</rect>`,
    );
  });

  /* build progress, bottom-right */
  const barW = 46;
  lines.push(rect(48, 58.4, barW, 2.4, "var(--anatomy-shade-2)", 1.2));
  lines.push(
    `<rect x="48" y="58.4" width="${barW}" height="2.4" rx="1.2" fill="var(--anatomy-lit)" opacity=".8">` +
      `<animate attributeName="width" values="0;0;${barW};${barW};0" keyTimes="0;.05;${END};.93;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  /* the caret itself travels with the typing, then blinks on its own clock */
  const endX = (last.sx + last.sw + 2).toFixed(2);
  lines.push(
    `<rect x="12" y="55.8" width="2.6" height="4.6" rx=".6" fill="var(--anatomy-lit)">` +
      `<animate attributeName="x" values="12;12;${endX}" keyTimes="0;.05;${END}" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes="0;.42;.5;.55;.58;1" dur="1.15s" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  out.push(`<g transform="${m}">${lines.join("")}</g>`);
  /* status LED on the bezel */
  out.push(`<circle cx="${pt(MON_FACE, py + 40, MON_Z + 4)[0].toFixed(2)}" cy="${pt(MON_FACE, py + 40, MON_Z + 4)[1].toFixed(2)}" r="1.1" fill="var(--anatomy-lit)" opacity=".8"/>`);
  return out.join("");
}

/* horizontal circle → its leftmost and rightmost projected points */
const rimLR = (y, cx, cz, r) => {
  const pts = circleY(y, cx, cz, r, 40);
  let lo = pts[0], hi = pts[0];
  for (const p of pts) { if (p[0] < lo[0]) lo = p; if (p[0] > hi[0]) hi = p; }
  return [lo, hi];
};

function lamp() {
  const out = [];
  const [lx, ly] = LAMP;
  const z0 = DESK_TOP_Z;

  /* warm pool of light on the desk, under everything else on it */
  const poolC = [SHADE[0] - 8, SHADE[1] + 10];
  const pool = circleY(poolC[1], poolC[0], z0, 30, 44);
  out.push(`<defs>
    <radialGradient id="lampPool" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(${pt(poolC[0], poolC[1], z0).map((v) => v.toFixed(1)).join(" ")}) scale(34 20)">
      <stop offset="0" stop-color="#E8A55A" stop-opacity=".26"/>
      <stop offset=".55" stop-color="#E8A55A" stop-opacity=".10"/>
      <stop offset="1" stop-color="#E8A55A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lampBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8A55A" stop-opacity=".20"/>
      <stop offset="1" stop-color="#E8A55A" stop-opacity="0"/>
    </linearGradient>
  </defs>`);
  out.push(`<path d="${poly(pool)}" fill="url(#lampPool)"/>`);

  /* the beam: shade rim down to the pool silhouette */
  const [tL, tR] = rimLR(SHADE[1], SHADE[0], SHADE[2], SHADE_R);
  const [bL, bR] = rimLR(poolC[1], poolC[0], z0, 30);
  out.push(`<path d="${poly([tL, tR, bR, bL])}" fill="url(#lampBeam)"/>`);

  /* base + post */
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: lx - 13, y: ly - 13, w: 26, d: 26, r: 13 }, z0, 0.6, P)}" style="filter:blur(5px)" opacity=".5"/>`);
  out.push(S(k.cylinder(lx, ly, 12, z0, 3.5, P, 30, 0.7), { tone: "mid" }));
  out.push(L(k.ring(lx, ly, 9, z0 + 3.5, P, 30), { tone: "faint" }));
  out.push(S(k.cylinder(lx, ly, 3.6, z0 + 3.5, LAMP_ARM[1][2] - z0 - 3.5, P, 18), { tone: "mid" }));

  /* the arm, as one round-capped tube */
  out.push(tube(poly(LAMP_ARM.map(([x, y, z]) => pt(x, y, z)), false), 7,
    "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));
  /* elbow + shade neck */
  out.push(sphere(LAMP_ARM[1][0], LAMP_ARM[1][1], LAMP_ARM[1][2], 4.6, {
    fill: "var(--anatomy-face)", lit: "var(--anatomy-top)", shade: "var(--anatomy-shade-2)",
  }));

  /* shade: two rims joined by a side wall, open toward the desk */
  const [hL, hR] = rimLR(SHADE[1], SHADE[0], SHADE[2] + 11, 4.2);
  const shadeBody = poly([hL, hR, tR, tL]);
  out.push(`<path d="${shadeBody}" fill="var(--anatomy-top)"/>`);
  out.push(`<path d="${shadeBody}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5"/>`);
  out.push(`<path d="${poly(rimLR(SHADE[1], SHADE[0], SHADE[2] + 11, 4.2))}" fill="var(--anatomy-shade-2)"/>`);
  out.push(`<path d="${poly(rimLR(SHADE[1], SHADE[0], SHADE[2], SHADE_R))}" fill="var(--anatomy-lit)" opacity=".55"/>`);
  return out.join("");
}

function books() {
  const out = [];
  const z = DESK_TOP_Z;
  const hts = [5, 4.2, 6];
  let zz = z;
  [0, 1, 2].forEach((i) => {
    const inset = i * 1.6;
    const plan = { x: BOOKS.x + inset, y: BOOKS.y + inset, w: BOOKS.w - inset * 2, d: BOOKS.d - inset * 2, r: BOOKS.r };
    out.push(S(k.slabOf(plan, zz, hts[i], P, 4, 0.4), { tone: i === 1 ? "mid" : "lo", crease: "none" }));
    /* page block on the near edge */
    out.push(L(k.segment([plan.x + plan.w, plan.y + 4, zz + 1.2], [plan.x + plan.w, plan.y + plan.d - 4, zz + 1.2], P), { tone: "faint" }));
    zz += hts[i];
  });
  /* a pen lying across the top */
  out.push(tube(poly([
    pt(BOOKS.x + 4, BOOKS.y + BOOKS.d + 4, zz + 1),
    pt(BOOKS.x + BOOKS.w - 2, BOOKS.y + BOOKS.d + 9, zz + 1),
  ], false), 2.6, "var(--anatomy-mid)", "var(--anatomy-lo)", "var(--anatomy-hi)"));
  return out.join("");
}

function keyboard() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(KB, 2), KB_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".45"/>`);
  out.push(S(k.slabOf(KB, KB_Z, KB_T, P, 5, 0.6), { tone: "mid" }));
  const m = k.topMatrix([KB.x, KB.y], KB_TOP, P, "x");
  const keys = [];
  const cols = 11, rows = 5;
  const padX = 3.4, padY = 3.4;
  const stepX = (KB.w - padX * 2) / cols;
  const stepY = (KB.d - padY * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && c > 2 && c < 8) continue;       // space bar
      keys.push(`<rect x="${(padX + c * stepX + .7).toFixed(2)}" y="${(padY + r * stepY + .7).toFixed(2)}" width="${(stepX - 1.4).toFixed(2)}" height="${(stepY - 1.4).toFixed(2)}" rx="1.2" fill="var(--anatomy-shade-2)"/>`);
    }
  }
  keys.push(`<rect x="${(padX + 3 * stepX + .7).toFixed(2)}" y="${(padY + (rows - 1) * stepY + .7).toFixed(2)}" width="${(stepX * 5 - 1.4).toFixed(2)}" height="${(stepY - 1.4).toFixed(2)}" rx="1.2" fill="var(--anatomy-shade-2)"/>`);
  out.push(`<g transform="${m}">${keys.join("")}</g>`);
  return out.join("");
}

function mouse() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(MOUSE, 2), KB_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".4"/>`);
  out.push(S(k.slabOf(MOUSE, KB_Z, 4.5, P, 8, 1.6), { tone: "mid" }));
  const [mx, my] = [MOUSE.x + MOUSE.w / 2, MOUSE.y + MOUSE.d / 2];
  out.push(L(k.lineOnTop([mx, MOUSE.y + 4], [mx, my - 1], KB_TOP - 0.2, P), { tone: "faint" }));
  out.push(S(k.cylinder(mx, MOUSE.y + 7, 2.4, KB_TOP - 0.6, 2.2, P, 16), { tone: "hi", crease: "none" }));
  return out.join("");
}

function chairBase() {
  const out = [];
  const [cx, cy] = CHAIR;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: cx - 26, y: cy - 26, w: 52, d: 52, r: 26 }, -6, 5, P)}"/>`);
  out.push(S(k.cylinder(cx, cy, 26, -5, 6, P, 40, 1), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 21, 1, P, 40), { tone: "faint" }));
  out.push(D(k.corners({ x: cx - 26, y: cy - 26, w: 52, d: 52, r: 26 }, 12).map(([x, y]) => pt(x, y, 1)), { size: 0.6, tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, 5.5, 1, 38, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 7, 34, 5, P, 20), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf(SEAT, SEAT_Z, 7, P, 8, 1.4), { tone: "lo", crease: "faint" }));
  return out.join("");
}

/* the backrest sits nearer the camera than the sitter, so it paints after them */
function chairBack() {
  return S(k.slabOf(BACK, SEAT_Z + 7, BACK_TOP - SEAT_Z - 7, P, 4, 0.9), { tone: "lo", crease: "faint" });
}

function person() {
  const [hx, hy] = HEAD;
  const headZ = 120;
  const far = [], near = [];

  /* far arm (−y side) */
  far.push(tube(poly([pt(104, -24, 91), pt(80, -27, 77), pt(50, -13, 71)], false), 13, T.hood[1], T.hood[2], T.hood[0]));

  /* torso: one silhouette — wide shoulders tapering to a neck */
  const outline = [
    [104, 18, 48], [107, 22, 70], [103, 26, 92], [99, 22, 101], [99, 11, 106],
    [99, -11, 106], [99, -22, 101], [103, -26, 92], [107, -22, 70], [104, -18, 48],
  ].map(([x, y, z]) => pt(x, y, z));
  const bodyD = roundedPoly(outline, 11);
  far.push(
    `<defs><linearGradient id="hoodieGrad" x1="0" y1="0" x2="0.25" y2="1">` +
      `<stop offset="0" stop-color="${T.hood[0]}"/><stop offset=".42" stop-color="${T.hood[1]}"/>` +
      `<stop offset="1" stop-color="${T.hood[2]}"/>` +
    `</linearGradient></defs>`,
    `<path d="${bodyD}" fill="url(#hoodieGrad)"/>`,
    `<path d="${bodyD}" fill="none" stroke="${T.hood[3]}" stroke-width=".55"/>`,
  );

  /* hood bunched at the nape, then the neck */
  const [nx, ny] = pt(110, 0, 97);
  far.push(`<ellipse cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" rx="30" ry="15" fill="${T.hood[4]}" stroke="${T.hood[3]}" stroke-width=".5"/>`);
  far.push(S(k.cylinder(hx, hy, 7.5, 96, 11, P, 18), { tone: "lo" }));

  /* far cup, its ring, then the head covers them — then the near cup and band */
  far.push(`<path d="${poly(circleY(-23, hx, headZ, 10.5, 30))}" class="iso-cup"/>`);
  far.push(`<path d="${poly(circleY(-23, hx, headZ, 5.5, 22))}" class="iso-cup-in"/>`);
  far.push(sphere(hx, hy, headZ, HEAD_R, { fill: T.hair[0], lit: T.hair[1], shade: T.hair[2] }));
  far.push(`<path d="${poly(circleY(23, hx, headZ, 10.5, 30))}" class="iso-cup"/>`);
  far.push(`<path d="${poly(circleY(23, hx, headZ, 5.5, 22))}" class="iso-cup-in"/>`);
  const band = poly(circleX(hx, 0, headZ, 23.5, 30, 0, Math.PI), false);
  far.push(`<path class="iso-band" d="${band}"/>`);
  far.push(`<path class="iso-band-hi" d="${band}"/>`);

  /* near arm (+y side) — painted last, it crosses the keyboard */
  near.push(tube(poly([pt(104, 24, 91), pt(78, 27, 77), pt(48, 13, 71)], false), 14, T.hood[1], T.hood[2], T.hood[0]));

  return far.join("") + near.join("");
}

/* ------------------------------------------------------------------ *
 * Assemble — explicit painter's order (far → near)
 * ------------------------------------------------------------------ */
const label =
  "An isometric engineer's desk. A monitor on a post and arm shows an editor with one terracotta line lit and code typing itself in; an articulated desk lamp throws a warm pool of light across a low-profile keyboard and mouse. A stack of books and a mug with steam sit beside a small potted plant; a three-drawer cabinet and a cable trough carry the clutter. A person in a hooded top wears over-ear headphones and works at the keyboard, seen from behind on a five-star office chair.";

const buildBody = () => [
  floor(),
  desk(),
  monitor(),
  books(),
  plant(),
  mug(),
  lamp(),
  keyboard(),
  mouse(),
  chairBase(),
  person(),
  chairBack(),
];

for (const [name, theme] of Object.entries(THEMES)) {
  T = theme;
  const raw = k.figureSvg({ width: W, height: H, label, body: buildBody(), standalone: true });
  const svg = raw
    .replace("</style>", `${theme.css}</style>`)
    .replace("<svg ", `<svg width="${W}" height="${H}" `)
    .replace('data-theme="true"', name === "light" ? 'data-theme="light"' : "");
  writeFileSync(join(HERE, "..", "assets", name === "light" ? "crest.light.svg" : "crest.svg"), svg);
  console.log(`${name}: paths ${(svg.match(/<path/g) || []).length} bytes ${svg.length}`);
}

const preview = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#181715;padding:30px;display:flex;gap:30px;align-items:flex-start}
  .light{background:#FAF9F5}
  .wrap{width:560px}
  img{width:100%;height:auto;display:block}
</style></head><body>
  <div class="wrap"><img src="../assets/crest.svg"></div>
  <div class="wrap light"><img src="../assets/crest.light.svg"></div>
</body></html>`;
writeFileSync(join(HERE, "preview.html"), preview);
