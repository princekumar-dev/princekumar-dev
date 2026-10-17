import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 660;
const H = 480;

/* ------------------------------------------------------------------ *
 * Palette — Linear design language (design-md/linear.app/DESIGN.md).
 * One chromatic accent only: lavender #5e6ad2 / #828fff.
 * ------------------------------------------------------------------ */
const LINEAR = `
.iso{
  --anatomy-page:#010102;
  --anatomy-card:#0f1011;
  --anatomy-paper:#17181a;
  --anatomy-face:#212225;
  --anatomy-top:#2b2d33;
  --anatomy-shade-0:#0e0f11;
  --anatomy-shade-1:#121316;
  --anatomy-shade-2:#17181b;
  --anatomy-shade-3:#1d1f23;
  --anatomy-lit-top:#383b44;
  --anatomy-lit-shade:#202226;
  --anatomy-hi:#f7f8f8;
  --anatomy-mid:#a7adb8;
  --anatomy-lo:#4a4d55;
  --anatomy-faint:#2a2c31;
  --anatomy-lit:#828fff;
  --anatomy-halo:#000000;
  --anatomy-halo-opacity:.75;
  --anatomy-dot:#d0d6e0;
  --anatomy-red:#5e6ad2;
  --anatomy-green:#5e6ad2;
  --anatomy-blue:#828fff;
  --anatomy-weight:.55px;
  --anatomy-lift:none;
}
.iso-svg{width:auto;height:auto}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
.iso-cup{fill:#2f323a;stroke:#6b7080;stroke-width:.7}
.iso-cup-in{fill:#15161a;stroke:#494d57;stroke-width:.5}
.iso-band{fill:none;stroke:#4a4e58;stroke-width:6;stroke-linecap:round}
.iso-band-hi{fill:none;stroke:#787d8c;stroke-width:1.8;stroke-linecap:round}
`;

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
const FLOOR = { x: -132, y: -90, w: 292, d: 186, r: 14 };
const FLOOR_T = 8;
const FLOOR_B = -FLOOR_T;

const DESK_TOP = { x: -105, y: -64, w: 200, d: 128, r: 8 };
const DESK_Z = 60;
const DESK_T = 6;
const DESK_TOP_Z = DESK_Z + DESK_T;

const CABINET = { x: -102, y: -60, w: 28, d: 120, r: 3 };
const CABINET_FACE = CABINET.x + CABINET.w;                 // +x face, near
const PANEL = { x: 62, y: -60, w: 24, d: 120, r: 3 };

const MON = { x: -80, y: -52, w: 8, d: 104, r: 4 };
const MON_Z = 82;
const MON_H = 70;
const MON_TOP = MON_Z + MON_H;
const MON_FACE = MON.x + MON.w;                             // +x face, near
const POST = [-60, -2];

const KB = { x: 8, y: -34, w: 68, d: 56, r: 4 };
const KB_Z = DESK_TOP_Z;
const KB_T = 5;
const KB_TOP = KB_Z + KB_T;

const MOUSE = { x: 80, y: -24, w: 14, d: 26, r: 7 };
const MUG = [-34, 46];
const POT = [-90, 48];

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
    [-32, 34, 9, "var(--anatomy-shade-3)"], [-11, 43, 10, "var(--anatomy-lo)"],
    [8, 41, 10, "var(--anatomy-shade-3)"], [30, 33, 9, "var(--anatomy-shade-2)"],
    [-21, 24, 7, "var(--anatomy-shade-2)"], [17, 23, 7, "var(--anatomy-lo)"],
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
  return out.join("");
}

function monitor() {
  const out = [];
  const [px, py] = POST;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: px - 25, y: py - 25, w: 50, d: 50, r: 25 }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(6px)" opacity=".5"/>`);
  out.push(S(k.cylinder(px, py, 25, DESK_TOP_Z, 5, P, 44, 0.8), { tone: "mid" }));
  out.push(L(k.ring(px, py, 21, DESK_TOP_Z + 5, P, 44), { tone: "faint" }));
  out.push(S(k.cylinder(px, py, 5, DESK_TOP_Z + 5, 36, P, 24), { tone: "mid" }));
  out.push(L(k.sideArc(px, py, 5, DESK_TOP_Z + 22, P, 12), { tone: "faint" }));
  out.push(S(k.slabOf({ x: MON.x, y: py - 9, w: MON.w + 18, d: 18, r: 3 }, DESK_TOP_Z + 40, 6, P, 3, 0.5), { tone: "mid" }));

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
  /* code */
  const rows = [
    { y: 21, segs: [[12, 13], [28, 8], [40, 17]], lit: false },
    { y: 27, segs: [[17, 22], [43, 11]], lit: false },
    { y: 33, segs: [[17, 9], [29, 24]], lit: false },
    { y: 39, segs: [[12, 18], [34, 6], [44, 14]], lit: true },
    { y: 45, segs: [[17, 12], [33, 20]], lit: false },
    { y: 51, segs: [[12, 7], [23, 15]], lit: false },
  ];
  for (const row of rows) {
    for (const [sx, sw] of row.segs) {
      lines.push(rect(sx, row.y, sw, 3, row.lit ? "var(--anatomy-lit)" : "var(--anatomy-mid)", 1,
        row.lit ? ' opacity=".92"' : ' opacity=".5"'));
    }
  }
  lines.push(
    `<rect x="12" y="57" width="2.6" height="4.4" rx=".6" fill="var(--anatomy-lit)">` +
      `<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1.2s" repeatCount="indefinite"/>` +
    `</rect>`,
  );
  out.push(`<g transform="${m}">${lines.join("")}</g>`);
  /* status LED on the bezel */
  out.push(`<circle cx="${pt(MON_FACE, py + 40, MON_Z + 4)[0].toFixed(2)}" cy="${pt(MON_FACE, py + 40, MON_Z + 4)[1].toFixed(2)}" r="1.1" fill="var(--anatomy-lit)" opacity=".8"/>`);
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
  far.push(tube(poly([pt(104, -24, 91), pt(80, -27, 77), pt(50, -13, 71)], false), 13, "#e2e5ea", "#bfc4ce", "#ffffff"));

  /* torso: one silhouette — wide shoulders tapering to a neck */
  const outline = [
    [104, 18, 48], [107, 22, 70], [103, 26, 92], [99, 22, 101], [99, 11, 106],
    [99, -11, 106], [99, -22, 101], [103, -26, 92], [107, -22, 70], [104, -18, 48],
  ].map(([x, y, z]) => pt(x, y, z));
  const bodyD = roundedPoly(outline, 11);
  far.push(
    `<defs><linearGradient id="hoodieGrad" x1="0" y1="0" x2="0.25" y2="1">` +
      `<stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#eceff3"/>` +
      `<stop offset="1" stop-color="#bfc4cf"/>` +
    `</linearGradient></defs>`,
    `<path d="${bodyD}" fill="url(#hoodieGrad)"/>`,
    `<path d="${bodyD}" fill="none" stroke="#a9aeb9" stroke-width=".55"/>`,
  );

  /* hood bunched at the nape, then the neck */
  const [nx, ny] = pt(110, 0, 97);
  far.push(`<ellipse cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" rx="30" ry="15" fill="#d5d9e1" stroke="#a9aeb9" stroke-width=".5"/>`);
  far.push(S(k.cylinder(hx, hy, 7.5, 96, 11, P, 18), { tone: "lo" }));

  /* far cup, its ring, then the head covers them — then the near cup and band */
  far.push(`<path d="${poly(circleY(-23, hx, headZ, 10.5, 30))}" class="iso-cup"/>`);
  far.push(`<path d="${poly(circleY(-23, hx, headZ, 5.5, 22))}" class="iso-cup-in"/>`);
  far.push(sphere(hx, hy, headZ, HEAD_R, { fill: "#24262d", lit: "#30333c", shade: "#15161a" }));
  far.push(`<path d="${poly(circleY(23, hx, headZ, 10.5, 30))}" class="iso-cup"/>`);
  far.push(`<path d="${poly(circleY(23, hx, headZ, 5.5, 22))}" class="iso-cup-in"/>`);
  const band = poly(circleX(hx, 0, headZ, 23.5, 30, 0, Math.PI), false);
  far.push(`<path class="iso-band" d="${band}"/>`);
  far.push(`<path class="iso-band-hi" d="${band}"/>`);

  /* near arm (+y side) — painted last, it crosses the keyboard */
  near.push(tube(poly([pt(104, 24, 91), pt(78, 27, 77), pt(48, 13, 71)], false), 14, "#e2e5ea", "#bfc4ce", "#ffffff"));

  return far.join("") + near.join("");
}

/* ------------------------------------------------------------------ *
 * Assemble — explicit painter's order (far → near)
 * ------------------------------------------------------------------ */
const body = [
  floor(),
  desk(),
  plant(),
  mug(),
  monitor(),
  keyboard(),
  mouse(),
  chairBase(),
  person(),
  chairBack(),
];

const label =
  "An isometric engineer's desk. A monitor on a post and arm shows an editor with one lavender line lit; a low-profile keyboard and mouse sit on the desk beside a mug and a small potted plant; a three-drawer cabinet and a cable trough carry the clutter. A person in a hooded top wears over-ear headphones and works at the keyboard, seen from behind on a five-star office chair.";

const raw = k.figureSvg({ width: W, height: H, label, body, standalone: true });
const svg = raw
  .replace("</style>", `${LINEAR}</style>`)
  .replace("<svg ", `<svg width="${W}" height="${H}" `);

writeFileSync(join(HERE, "..", "assets", "crest.svg"), svg);

const preview = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#010102;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .wrap{width:660px}
  .small{width:260px;margin-top:40px}
  img{width:100%;height:auto;display:block}
</style></head><body><div class="wrap"><img src="../assets/crest.svg"></div></body></html>`;
writeFileSync(join(HERE, "preview.html"), preview);
console.log("solids:", (svg.match(/iso-solid/g) || []).length, "paths:", (svg.match(/<path/g) || []).length, "bytes:", svg.length);
