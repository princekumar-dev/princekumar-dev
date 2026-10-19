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
  /* the brew: warm milk-coffee brown, lit enough to separate from the
     charcoal mug wall it sits inside */
  --anatomy-coffee:#7E5138;
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
.iso-band{fill:none;stroke:#575046;stroke-width:5;stroke-linecap:round}
.iso-band-hi{fill:none;stroke:#847B6C;stroke-width:1.5;stroke-linecap:round}
`,
    /* raw hexes the generator interpolates directly (var() is unsafe in
       presentation attributes, so gradients get real values) */
    hood: ["#FFFCF6", "#EDE6D9", "#C8BFAD", "#B3AA99", "#DCD3C2"],
    hair: ["#2E2A25", "#3E382F", "#1C1A17"],
    /* base, lit, shade — the only bare skin on the figure */
    skin: ["#E9C7A3", "#F5DCC0", "#B78F69"],
    /* base, lit, shade — trousers and shoes. Same cream family as the hood:
       the figure wears one sweatsuit, so the legs must not pop out as a
       grey-brown foreign object against the white top. */
    trouser: ["#FFFCF6", "#EDE6D9", "#C8BFAD"],
    /* pool opacities — amber on the warm-dark desk keeps; on cream it would
       vanish, so the light theme burns hotter */
    lamp: { hot: ".40", warm: ".15" },
    /* rounded-rod shading: darker below, lit above. The utility tones invert
       between themes (hi is cream here, black in light), so a coloured rod —
       pen, pencils — needs its pair chosen per theme, not globally. */
    rod: { shade: "var(--anatomy-lo)", lit: "var(--anatomy-hi)" },
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
  /* deep roast — a pale ceramic lip needs a dark surface to read against */
  --anatomy-coffee:#6B4832;
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
.iso-band{fill:none;stroke:#9E9482;stroke-width:5;stroke-linecap:round}
.iso-band-hi{fill:none;stroke:#C6BAA4;stroke-width:1.5;stroke-linecap:round}
`,
    hood: ["#FFFDF8", "#F3EDE1", "#D4C9B4", "#B3AA99", "#E4DBC9"],
    hair: ["#3D362E", "#544A3C", "#241F1A"],
    skin: ["#EBD0B4", "#F7E6D4", "#B58F6E"],
    trouser: ["#FFFDF8", "#F3EDE1", "#D4C9B4"],
    /* amber over cream needs real weight or the pool disappears entirely */
    lamp: { hot: ".60", warm: ".26" },
    rod: { shade: "var(--anatomy-hi)", lit: "var(--anatomy-lo)" },
    page: "#FAF9F5",
  },
};

/* current theme — set by the emit loop below */
let T = THEMES.dark;

/* ------------------------------------------------------------------ *
 * Geometry helpers
 * ------------------------------------------------------------------ */
/* Named twice so that a function can shadow `pt` and still reach the real one.
   person() uses that to slide the figure toward the monitor in a single place
   rather than across forty-odd coordinate literals. */
const isoPt = (x, y, z) => k.iso([x, y, z], P);
const pt = isoPt;
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

/* screen-space tube: three nested round-capped strokes = four-tone volume.
   Thin tubes (w < 6) get proportional widths AND proportional offsets —
   w-5/w-8 goes negative there (an invalid stroke-width is silently dropped,
   which is what made the pen and the pencils render as scratchy 1px sticks),
   and the fixed ±2.4/-3 offsets clear a 2px stroke entirely, leaving its
   shade and light bands floating as detached parallel lines. */
const tube = (d, w, face = "var(--anatomy-top)", shade = "var(--anatomy-shade-1)", top = "var(--anatomy-lit-top)") => {
  const thin = w < 6;
  const sw = thin ? w * 0.5 : w - 5;
  const tw = thin ? w * 0.32 : Math.max(w - 8, 0.6);
  const so = thin ? (w * 0.30).toFixed(2) : "2.4";
  const to = thin ? (-w * 0.32).toFixed(2) : "-3";
  return [
    `<path class="iso-tube" d="${d}" fill="none" stroke="${face}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path class="iso-tube" d="${d}" fill="none" stroke="${shade}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${so})"/>`,
    `<path class="iso-tube" d="${d}" fill="none" stroke="${top}" stroke-width="${tw.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${to})"/>`,
  ].join("");
};

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

/* Workstation at the desk's near edge (x = -15, y = 64). The character sits
   just OUTSIDE the desk footprint so their back clears the desktop slab — at
   y < 64 the surface (nearer, z = 66) projected over the torso and, being
   painted last, the figure bled across the desk. Chair and peripherals share
   one +36 y-shift so every reach stays proportioned. The character and chair
   face -y (into the desk, toward the monitor). */
const CX = -15;
const CY = 64;

const CHAIR = [CX, CY];
const SEAT = { x: CX - 20, y: CY - 19, w: 40, d: 38, r: 7 };
const SEAT_Z = 27;
const BACK = { x: CX - 19, y: CY + 3, w: 38, d: 6, r: 3 };
const BACK_TOP = 48;
const BASE_R = 21;

const HEAD = [CX, CY - 10];
const HEAD_Z = 94;
const HEAD_R = 15;

/* Monitor pushed to the back of the desk, keyboard and mouse in front of the
   sitter with clear desk between the two — that gap is what stops the hand
   reading as if it were up at the face. */
/* v4: slightly larger desktop monitor (w: 76, h: 46) — balanced modern widescreen */
const MON = { x: CX - 38, y: -18, w: 76, d: 4.5, r: 3 };
const MON_Z = 73;
const MON_H = 46;
const MON_TOP = MON_Z + MON_H;
const MON_FACE = MON.y + MON.d;                             // +y face, near
const POST = [CX, -25];
const POST_R = 11;

/* Desktop CPU tower placed on floor on the inside / left of the desk panel leg */
const CPU = { x: -68, y: 16, w: 17, d: 34, r: 2.5 };
const CPU_Z = 0;
const CPU_H = 36;

const KB = { x: CX - 18, y: 26, w: 56, d: 20, r: 4 };
const KB_Z = DESK_TOP_Z;
const KB_T = 5;
const KB_TOP = KB_Z + KB_T;

const MOUSE_PAD = { x: CX - 54.2, y: 26.0, w: 17, d: 22, r: 3.5 };
const MOUSE = { x: CX - 49.5, y: 30.5, w: 7.6, d: 13.0, r: 3.2 };

/* Desk clutter, placed where a person actually keeps it. Screen runs
   right = +y and -x, so the character's right hand (the mouse side) is the
   -x end of the desk and the far back corner reads upper-right.
   - Lamp in the rear-right corner, its head reaching toward the work area
   - Plant in the far rear-left corner, over the side panel
   - One pad of paper lying in the lamp's pool with a pen on it, a cup of
     pencils beside them — a second stack of books here read as a duplicate
     of the pad, so the stack went; a book stack returned later, but in
     front of the plant where paper never sits
   - Books squared up in front of the plant: boards overhanging their page
     blocks, the bottom one carrying the coral accent
   - Mug on the character's LEFT of the keyboard — a right-handed setup keeps
     the drink clear of the mouse hand */
/* v3: authentic modern architect / Anglepoise study table lamp:
   - Compact weighted base in desk rear-right
   - Twin-strut articulated lower arm leaning forward at dynamic angle
   - Articulated elbow joint with adjustment disc
   - Upper cantilever arm reaching over toward work area
   - Swivel knuckle and iconic tapered bell study shade
   - Gentle, cozy warm reading pool on desk surface */
const LAMP = [-82, 12];
const LAMP_ELBOW = [-46, 14, DESK_TOP_Z + 60];
const LAMP_HEAD = [-14, 20, DESK_TOP_Z + 48];
const SHADE = [LAMP_HEAD[0] + 6, LAMP_HEAD[1] + 16, DESK_TOP_Z + 36];
const POOL_R = 38;
const POOL_A = 1.697 * POOL_R;
const POOL_B = 0.849 * POOL_R;
const POOL_C = [-8, 36];

/* Paper and pencils where the lamp light actually falls: the pad sits in the
   pool between the lamp base and the keyboard, the cup just beyond its edge.
   Clear of the post (x ≤ 2, y ≤ -9), the keyboard (y ≥ 26), the mouse
   (y ≥ 29) and the base disc (x ≤ -76) — nothing tucked behind the screen,
   nothing overlapping its neighbour. */
/* Real-desk placement, verified against the projected image boxes: the pad
   goes on the writer's left — in front of the keyboard on the non-mouse
   side, five units in from the desk edge — where a right-handed sitter
   actually reaches for it. It used to sit at the desk's back-right, which
   projects to exactly the same pixels as the sitter's head and was drawn
   straight into it: invisible. The pencil cup moves to the back pocket
   beside the monitor and the plant — back-corner storage, out of the
   working zone, clear of the keyboard, mouse, books and cable trough, and
   out of the sitter's face where it used to float. */
const NOTEPAD = { x: 56, y: 30, w: 34, d: 26, r: 2 };
const PENCIL = [38, -34];
/* The drink sits on the character's left of the keyboard — a right-handed
   setup keeps it clear of the mouse hand. */
const MUG = [38, 44];
/* Slimmer and taller than the old 7.5 x 16 stock — the tumbler proportion
   reads modern where the stubby one read diner. v2: a touch taller for a
   premium travel-mug silhouette. */
const MUG_R = 6.5;
const MUG_H = 19;
/* Rear-left corner — the spot the lamp vacated when it moved across. */
const POT = [68, -46];

/* One clock for the whole scene. The editor types itself in over this period,
   and the hand that is doing the typing is keyed to the same window — two
   independent loops would drift and the figure would appear to be typing at
   nothing. Anything animated that is causally tied to the screen must read
   this, not its own literal. */
const LOOP_S = 8;

const fits = [
  ...k.boxCorners(FLOOR, FLOOR_B - 5, 0),
  [MON.x, MON.y, MON_TOP + 4], [MON.x + MON.w, MON_FACE, MON_TOP + 4],
  [HEAD[0] - HEAD_R, HEAD[1], HEAD_Z + HEAD_R + 8], [HEAD[0] + HEAD_R, HEAD[1], HEAD_Z + HEAD_R + 8],
  [BACK.x + BACK.w, CHAIR[1] + 26, 4],
  [SHADE[0], SHADE[1], SHADE[2] + 22],
  [POT[0] - 14, POT[1] - 14, DESK_TOP_Z + 40],
  [POT[0] + 14, POT[1] + 14, DESK_TOP_Z + 40],
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

/* A half turn about the desk's centre. A box maps onto a box of the same
   footprint under a 180-degree rotation, so only the origin moves — which is
   why this can be done to the descriptors alone. The desk top is its own image
   under the turn, so it does not move; the cabinet and the side panel swap
   ends. Nothing that sits ON the desk is touched. */
const TURN_X = DESK_TOP.x + DESK_TOP.w / 2;
const TURN_Y = DESK_TOP.y + DESK_TOP.d / 2;
const turn = (b) => ({ ...b, x: 2 * TURN_X - b.x - b.w, y: 2 * TURN_Y - b.y - b.d });

function desk() {
  const out = [];
  /* cabinet, three drawers. A rigid turn would swing the drawer fronts round to
     face the wall, where the camera never sees them and the cabinet reads as a
     blank box, so the detail is drawn on whichever long face points at the
     camera. The cabinet still lands wherever the turn puts it. */
  const CB = turn(CABINET);
  const CB_FACE = CB.x + CB.w;
  out.push(S(k.slabOf(CB, 0, DESK_Z, P, 4, 0.6), { tone: "mid" }));
  /* Three drawers. Each front stands proud of the carcass and carries a card
     holder and a bail pull — two posts and a bar you could get fingers under.
     A round knob reads as a kitchen cupboard and gives the cabinet no scale;
     the pull and the label are what make it office furniture. The holder sits
     at the top of the face and the pull clears it below, so the two never
     overprint. `hi` is the ink tone — near-black in light mode — so it is
     never used to fill a solid, only to draw. */
  const fy0 = CB.y + 7, fy1 = CB.y + CB.d - 7, fc = (fy0 + fy1) / 2;
  const drawers = [8, 26, 44].map((z) => ({ z, h: 14 }));
  for (const { z, h } of drawers) {
    const dz = z + 1.6, dh = h - 3.2;
    out.push(S(k.slabOf({ x: CB_FACE, y: fy0, w: 1.8, d: fy1 - fy0, r: 1 }, dz, dh, P, 4, 0.4), { tone: "mid" }));
    /* label holder: raised frame, inset card, two rivets, a written line */
    const hz = dz + dh - 5;
    out.push(S(k.slabOf({ x: CB_FACE + 1.8, y: fc - 7.4, w: 1, d: 14.8, r: 1 }, hz, 4, P, 4, 0.3), { tone: "lo", crease: "none" }));
    out.push(S(k.slabOf({ x: CB_FACE + 2.8, y: fc - 6, w: 0.6, d: 12, r: 0.8 }, hz + 0.7, 2.6, P, 4, 0.2), { tone: "faint", crease: "none" }));
    out.push(D([pt(CB_FACE + 3.4, fc - 4.6, hz + 2), pt(CB_FACE + 3.4, fc + 4.6, hz + 2)], { size: 0.4, tone: "lo" }));
    out.push(L(k.segment([CB_FACE + 3.4, fc - 3.6, hz + 1.1], [CB_FACE + 3.4, fc + 3.6, hz + 1.1], P), { tone: "lo" }));
    /* bail pull: two posts out of the face, a bar bowed across them */
    const pz = dz + 2.8;
    for (const s of [-1, 1]) {
      out.push(tube(k.segment([CB_FACE + 1.8, fc + s * 5.6, pz], [CB_FACE + 4.4, fc + s * 5.6, pz], P), 2.2,
        "var(--anatomy-face)", "var(--anatomy-shade-2)", "var(--anatomy-lit-top)"));
    }
    out.push(tube(poly([pt(CB_FACE + 4.4, fc - 5.6, pz), pt(CB_FACE + 5.2, fc, pz + 0.7), pt(CB_FACE + 4.4, fc + 5.6, pz)], false), 2.4,
      "var(--anatomy-lit-top)", "var(--anatomy-lo)", "var(--anatomy-face)"));
  }

  /* side panel with a cable grommet */
  const PN = turn(PANEL);
  out.push(S(k.slabOf(PN, 0, DESK_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PN, 4), DESK_Z, P, 4), { tone: "faint" }));
  out.push(S(k.cylinder(PN.x + PN.w / 2, PN.y + PN.d / 2, 5, 0, 1.4, P, 20), { tone: "lo", crease: "none" }));

  /* desk top — v2: deeper halo for premium floating feel */
  out.push(`<path class="iso-halo" d="${k.haloOf(DESK_TOP, DESK_Z - 8, DESK_T + 8, P)}" style="filter:blur(9px)" opacity=".55"/>`);
  out.push(S(k.slabOf(DESK_TOP, DESK_Z, DESK_T, P, 8, 0.9), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(DESK_TOP, 5), DESK_TOP_Z, P, 8), { tone: "faint" }));
  /* cable trough, along the back edge where the monitor and lamp leads run */
  const trough = { x: DESK_TOP.x + 12, y: DESK_TOP.y + 8, w: DESK_TOP.w - 24, d: 6, r: 2 };
  out.push(S(k.slabOf(trough, DESK_TOP_Z, 0.6, P, 3, 0.3), { tone: "lo", crease: "none" }));
  const tsk = k.corners(DESK_TOP, 10);
  out.push(D(tsk.map(([x, y]) => pt(x, y, DESK_TOP_Z)), { size: 0.45, tone: "lo" }));
  return out.join("");
}

/* A lanceolate blade: two quadratics meeting at a point, so both ends come
   to a tip instead of the ellipse's round blob. Widest a little above the
   base, with a midrib — the two cues that make a shape read as a leaf.
   ang is measured from vertical, in screen degrees. bend curls the tip
   sideways so the outer blades arch away from the centre rather than
   standing like spokes. */
function leaf(bx, by, ang, len, wid, fill, bend) {
  const a = (ang * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const nx = -uy;
  const ny = ux;
  const tx = bx + ux * len + nx * (bend ?? 0);
  const ty = by + uy * len + ny * (bend ?? 0);
  const mx = bx + ux * len * 0.4;
  const my = by + uy * len * 0.4;
  const f = (v) => v.toFixed(2);
  const blade =
    `M${f(bx)} ${f(by)}` +
    `Q${f(mx + nx * wid)} ${f(my + ny * wid)} ${f(tx)} ${f(ty)}` +
    `Q${f(mx - nx * wid)} ${f(my - ny * wid)} ${f(bx)} ${f(by)}Z`;
  return (
    `<path d="${blade}" fill="${fill}" stroke="var(--anatomy-lo)" stroke-width=".45"/>` +
    `<path d="M${f(bx)} ${f(by)}L${f(tx)} ${f(ty)}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".35" opacity=".45"/>`
  );
}

function plant() {
  const [px, py] = POT;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: px - 14, y: py - 14, w: 28, d: 28, r: 14 }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".45"/>`];

  const [cx, cy] = pt(px, py, DESK_TOP_Z + 16.5);

  /* Blades sway on separate clocks. Synchronised periods are what makes motion
     read as a mechanism, so amplitude, duration and phase all vary per blade
     and the keyframes are deliberately uneven — an even four-point sine
     announces its loop, an uneven one does not. */
  const SWAY = [
    [1.7, 4.9, 0],
    [1.2, 6.3, 1.1],
    [2.1, 5.4, 2.4],
    [1.4, 7.1, 0.7],
    [1.9, 4.4, 3.2],
    [1.1, 6.8, 1.9],
    [2.3, 5.1, 2.9],
    [1.5, 5.9, 0.4],
    [1.8, 6.6, 1.5],
  ];
  let swayN = 0;

  const blade = (ang, len, wid, fill, drop, curl = 0.28) => {
    const bx = cx;
    const by = cy + drop;
    const body = leaf(bx, by, ang, len, wid, fill, Math.sign(ang) * len * curl);
    const [amp, dur, phase] = SWAY[swayN++ % SWAY.length];
    const dir = ang < 0 ? -1 : 1;
    const ox = bx.toFixed(1);
    const oy = by.toFixed(1);
    const a = (amp * dir).toFixed(2);
    const b = (-amp * 0.62 * dir).toFixed(2);
    const c = (amp * 0.34 * dir).toFixed(2);
    return (
      `<g><animateTransform attributeName="transform" type="rotate" ` +
      `values="0 ${ox} ${oy};${a} ${ox} ${oy};${b} ${ox} ${oy};${c} ${ox} ${oy};0 ${ox} ${oy}" ` +
      `keyTimes="0;.31;.58;.83;1" dur="${dur}s" begin="${phase}s" calcMode="spline" ` +
      `keySplines=".45 .05 .55 .95;.45 .05 .55 .95;.45 .05 .55 .95;.45 .05 .55 .95" ` +
      `repeatCount="indefinite"/>${body}</g>`
    );
  };

  /* Back blades go in before the pot, and their bases sit below the rim, so
     the foliage rises out of the soil instead of resting on top of it. They
     stay in the low tone to hold the depth. */
  out.push(
    blade(-52, 24, 8.0, "var(--anatomy-lo)", 9),
    blade(48, 22, 7.6, "var(--anatomy-lo)", 9),
    blade(-28, 28, 8.6, "var(--anatomy-lo)", 11),
    blade(24, 26, 8.2, "var(--anatomy-lo)", 11),
  );

  out.push(S(k.cylinder(px, py, 14, DESK_TOP_Z, 16, P, 28, 1.2), { tone: "mid" }));
  out.push(L(k.ring(px, py, 12, DESK_TOP_Z + 16, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(px, py, 11.5, DESK_TOP_Z + 13.6, 2.4, P, 28), { tone: "lo", crease: "none" }));

  /* Front blades. Deliberately uneven left and right — a matched pair reads
     as a logo, an off-by-a-degree pair reads as a plant. */
  out.push(
    blade(-38, 30, 9.5, "var(--anatomy-lo)", 3),
    blade(36, 28, 9.0, "var(--anatomy-lo)", 3),
    blade(-19, 38, 11.0, "var(--anatomy-mid)", 0),
    blade(0, 33, 10.0, "var(--anatomy-mid)", 2),
    blade(17, 36, 10.5, "var(--anatomy-mid)", 1),
  );
  return out.join("");
}

/* A stack of books in front of the plant, pushed forward onto the open desk —
   twenty-odd units of clear surface between the stack and the pot is what
   stops the two reading as one clump. A pad you write on and books you don't
   are different objects: these sit square to the grid, their boards overhang
   the page blocks, and no pen lies across them. The kit fills every solid
   with paper regardless of tone (tone only colours the edge line), so each
   cover is laid over fill, sides and top in its own colour — bottom book
   carries the scene's coral accent, answering the terracotta line on screen. */
function books() {
  const out = [];
  const z = DESK_TOP_Z;
  const B = { x: 56, y: -4, w: 27, d: 21, r: 1.5 };
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(B, 2), z, 0.6, P)}" style="filter:blur(4px)" opacity=".4"/>`);
  const stack = [
    { dx: 0, dy: 0, w: 27, d: 21, h: 6.5, cover: "lit", page: "mid" },
    { dx: 2, dy: -1, w: 24, d: 18, h: 5.5, cover: "hi", page: "faint" },
    { dx: 4, dy: 1, w: 21, d: 15, h: 4.5, cover: "mid", page: "faint" },
  ];
  let zz = z;
  for (const b of stack) {
    const plan = { x: B.x + b.dx, y: B.y + b.dy, w: b.w, d: b.d, r: 1.5 };
    const board = (bp, bz, bh) => {
      const sp = k.slabOf(bp, bz, bh, P, 3, 0.3);
      out.push(S(sp, {
        tone: b.cover,
        crease: "none",
        inner:
          `<path d="${sp.fill}" fill="var(--anatomy-${b.cover})"/>` +
          sp.shades.filter(Boolean).map((d) => `<path d="${d}" fill="var(--anatomy-${b.cover})"/>`).join("") +
          `<path d="${sp.top}" fill="var(--anatomy-${b.cover})"/>` +
          /* the bevel rim is painted over by the flat cover, so redraw it in
             the scene's neutral line — without it the board has no top edge */
          (sp.bevel ? `<path d="${sp.bevel}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5" opacity=".7"/>` : ""),
      }));
    };
    board(plan, zz, 1.6);
    out.push(S(k.slabOf(k.insetPlan(plan, 1.4), zz + 1.6, b.h - 3.2, P, 3, 0.3), { tone: b.page, crease: "none" }));
    board(plan, zz + b.h - 1.6, 1.6);
    zz += b.h;
  }
  return out.join("");
}

function mug() {
  const out = [];
  const [x, y] = MUG;
  const z = DESK_TOP_Z;
  const rim = MUG_R * 0.85;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - MUG_R, y: y - MUG_R, w: MUG_R * 2, d: MUG_R * 2, r: MUG_R }, z, 0.6, P)}" style="filter:blur(4px)" opacity=".5"/>`);
  /* Handle first: a round ear on the -x wall — the side turned toward the
     typing hand, so the grip faces the fingers that would reach for it —
     painted BEFORE the body so its roots vanish behind the wall and only
     the loop reads. Three constraints fight each other — a point at x-d
     projects to u = .707d while the cylinder's widest point sits at u ≈ R,
     so nothing within R√2 shows at all; yet the roots must stay ON the
     wall (x = -R) or the loop floats free, and within the mug's height
     (z ± 8) or the lower tip slides below the base line onto the desk. One
     circle solved for all three: centre just proud of the wall, reach short
     enough that the roots land at cz ± 5.8, bulge far enough to break the
     silhouette. */
  const HC = MUG_R * 1.11, HR = 5.86;
  const hEnd = Math.acos((MUG_R - HC) / HR);
  out.push(tube(poly(circleY(y, x - HC, z + MUG_H * 0.5, HR, 24, Math.PI - hEnd, hEnd * 2), false),
    3.8, "var(--anatomy-paper)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));
  out.push(S(k.cylinder(x, y, MUG_R, z, MUG_H, P, 28, 1.4), { tone: "mid" }));
  /* One clean mouth: the bevelled top edge is the lip and the drink sits
     flush inside it as a single inset disc — the old extra ring drew a
     second line over the liquid's edge and thickened the mouth into a jar. */
  out.push(S(k.cylinder(x, y, rim, z + MUG_H - 2.6, 2.6, P, 28), { tone: "lo", crease: "none" }));
  /* The brew: a coffee-brown surface laid flush over the liquid slab so the
     mouth reads as a cup WITH a drink instead of a pale empty well — the
     slab's own edge survives around it as the ceramic lip. One wet
     catch-light and the surface reads as liquid rather than as a decal. */
  out.push(`<path d="${k.ring(x, y, rim, z + MUG_H, P, 28)}" fill="var(--anatomy-coffee)"/>`);
  out.push(`<path d="${k.ring(x - 1.6, y + 1.4, rim * 0.34, z + MUG_H, P, 18)}" fill="#FFF6E8" opacity=".17"/>`);

  /* steam — two slow wisps rising off the rim */
  const [rx, ry] = pt(x, y, z + MUG_H + 1);
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
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: px - POST_R, y: py - POST_R, w: POST_R * 2, d: POST_R * 2, r: POST_R }, DESK_TOP_Z, 0.6, P)}" style="filter:blur(5px)" opacity=".45"/>`);
  out.push(S(k.cylinder(px, py, POST_R, DESK_TOP_Z, 2.5, P, 32, 0.6), { tone: "mid" }));
  out.push(L(k.ring(px, py, POST_R - 2.5, DESK_TOP_Z + 2.5, P, 32), { tone: "faint" }));
  /* Upright column */
  out.push(S(k.cylinder(px, py, 3.5, DESK_TOP_Z + 2.5, 25, P, 20), { tone: "mid" }));
  out.push(L(k.sideArc(px, py, 3.5, DESK_TOP_Z + 16, P, 10), { tone: "faint" }));
  /* mount arm runs from post to back of panel (-y side of monitor) */
  out.push(S(k.slabOf({ x: px - 7, y: py, w: 14, d: MON.y - py + 1.2, r: 2 }, DESK_TOP_Z + 19, 5, P, 3, 0.4), { tone: "mid" }));

  /* Monitor body slab (width along x, thickness along y) */
  out.push(S(k.slabOf(MON, MON_Z, MON_H, P, 4, 0.9), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MON, 1.2), MON_TOP, P, 3), { tone: "faint" }));

  /* ---- screen, drawn on the near (+y) face using sideMatrix left ---- */
  const m = k.sideMatrix([MON.x, MON_FACE], MON_TOP, P, "left");
  const rect = (x, y, w, h, fill, rx = 1, extra = "") =>
    `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${rx}" fill="${fill}"${extra}/>`;
  /* Widescreen proportions with sleek slim bezels */
  const scr = { x: 2.2, y: 2.2, w: 71.6, h: 41.6 };
  const lines = [];
  lines.push(rect(scr.x, scr.y, scr.w, scr.h, "var(--anatomy-page)", 1.5));
  lines.push(`<g fill="none" stroke="var(--anatomy-faint)" stroke-width=".4"><rect x="${(scr.x + .2).toFixed(2)}" y="${(scr.y + .2).toFixed(2)}" width="${(scr.w - .4).toFixed(2)}" height="${(scr.h - .4).toFixed(2)}" rx="1.5"/></g>`);
  /* title bar */
  lines.push(rect(scr.x, scr.y, scr.w, 4.6, "var(--anatomy-shade-1)", 1.2));
  [scr.x + 3.6, scr.x + 7.0, scr.x + 10.4].forEach((cx) => lines.push(`<circle cx="${cx.toFixed(2)}" cy="${(scr.y + 2.3).toFixed(2)}" r="0.9" fill="var(--anatomy-lo)"/>`));
  lines.push(rect(scr.x + 16, scr.y + 1.2, 24, 2.2, "var(--anatomy-shade-3)", 1));

  /* one 8s loop: type in → hold → clear */
  const LOOP = `${LOOP_S}s`;
  const rows = [
    { y: 10.2, segs: [[scr.x + 3.5, 13], [scr.x + 19, 9], [scr.x + 30, 16]], lit: false },
    { y: 15.0, segs: [[scr.x + 7, 20], [scr.x + 29, 13]], lit: false },
    { y: 19.8, segs: [[scr.x + 7, 8], [scr.x + 17, 24]], lit: true },
    { y: 24.6, segs: [[scr.x + 3.5, 15], [scr.x + 21, 8], [scr.x + 31, 14]], lit: false },
    { y: 29.4, segs: [[scr.x + 7, 18], [scr.x + 27, 20]], lit: false },
    { y: 34.2, segs: [[scr.x + 3.5, 12], [scr.x + 18, 14], [scr.x + 34, 10]], lit: false },
  ];
  const flat = [];
  rows.forEach((row, ri) => row.segs.forEach(([sx, sw]) => flat.push({ sx, sy: row.y, sw, lit: row.lit, ri })));
  const at = (i) => 0.05 + i * 0.038;
  const END = 0.86;
  const last = flat[flat.length - 1];

  /* caret band */
  const bandY = rows.map((r) => r.y - 0.8);
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
    `<rect x="${scr.x}" y="${bandY[0]}" width="${scr.w}" height="4.0" fill="var(--anatomy-lit)" opacity=".07">` +
      `<animate attributeName="y" values="${bv.join(";")}" keyTimes="${bt.join(";")}" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  /* code segments */
  flat.forEach((s, i) => {
    const a = at(i).toFixed(4);
    const op = s.lit ? 0.95 : 0.5;
    lines.push(
      `<rect x="${s.sx.toFixed(2)}" y="${s.sy.toFixed(2)}" width="${s.sw.toFixed(2)}" height="2.2" rx="0.8" fill="${s.lit ? "var(--anatomy-lit)" : "var(--anatomy-mid)"}" opacity="0">` +
        `<animate attributeName="opacity" values="0;0;${op};${op};0" keyTimes="0;${a};${(+a + 0.005).toFixed(4)};${END};1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `</rect>`,
    );
  });

  /* build progress */
  const barW = 32;
  lines.push(rect(scr.x + 36, 38.2, barW, 2.0, "var(--anatomy-shade-2)", 1.0));
  lines.push(
    `<rect x="${(scr.x + 36).toFixed(2)}" y="38.2" width="${barW}" height="2.0" rx="1.0" fill="var(--anatomy-lit)" opacity=".8">` +
      `<animate attributeName="width" values="0;0;${barW};${barW};0" keyTimes="0;.05;${END};.93;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  /* caret */
  const endX = (last.sx + last.sw + 1.5).toFixed(2);
  lines.push(
    `<rect x="${(scr.x + 3.5).toFixed(2)}" y="33.6" width="2.0" height="3.4" rx=".4" fill="var(--anatomy-lit)">` +
      `<animate attributeName="x" values="${(scr.x + 3.5).toFixed(2)};${(scr.x + 3.5).toFixed(2)};${endX};${endX}" keyTimes="0;.05;${END};1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes="0;.42;.5;.55;.58;1" dur="1.15s" repeatCount="indefinite"/>` +
    `</rect>`,
  );

  // UNMIRRORED SCREEN:
  out.push(`<g transform="${m} translate(${MON.w} 0) scale(-1 1)">${lines.join("")}</g>`);

  /* status LED on the bezel — blinks active while screen runs, turns RED when screen clears! */
  const ledPt = pt(MON.x + MON.w - 2.8, MON_FACE, MON_Z + 2.2);
  out.push(
    `<circle cx="${ledPt[0].toFixed(2)}" cy="${ledPt[1].toFixed(2)}" r="1.1">` +
      `<animate attributeName="fill" values="#00E5FF;#00E5FF;#FF3B30;#FF3B30;#00E5FF" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="1;.2;1;.3;1;.1;.9;.2;1;.3;.8;.1;1;.2;.9;.1;1;1;1;1;1" ` +
        `keyTimes="0;.05;.11;.17;.23;.29;.35;.41;.47;.53;.59;.65;.71;.77;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</circle>`
  );
  return out.join("");
}

function cpu() {
  const out = [];
  const z0 = CPU_Z;
  const LOOP = `${LOOP_S}s`;

  /* Floor shadow under tower */
  out.push(`<path class="iso-halo" d="${k.haloOf(CPU, z0, 0.6, P)}" style="filter:blur(5px)" opacity=".45"/>`);

  /* 4 feet */
  for (const [x, y] of k.corners(CPU, 4)) {
    out.push(S(k.cylinder(x, y, 1.4, z0, 1.2, P, 16), { tone: "lo", crease: "none" }));
  }

  /* Main chassis tower */
  const chassisZ = z0 + 1.2;
  const chassisH = CPU_H - 1.2;
  out.push(S(k.slabOf(CPU, chassisZ, chassisH, P, 3, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CPU, 1.2), CPU_H, P, 3), { tone: "faint" }));

  /* Side panel window / grille on +x face (facing chair / kneehole) */
  const sidePlan = { x: CPU.x + CPU.w, y: CPU.y + 4, w: 0.6, d: CPU.d - 8, r: 1 };
  out.push(S(k.slabOf(sidePlan, chassisZ + 4, chassisH - 8, P, 2, 0.3), { tone: "lo", crease: "none" }));
  /* Internal hardware activity ambient glow through side window */
  const [sgx, sgy] = pt(CPU.x + CPU.w + 0.6, CPU.y + CPU.d / 2, chassisZ + chassisH / 2);
  out.push(
    `<ellipse cx="${sgx.toFixed(2)}" cy="${sgy.toFixed(2)}" rx="4.5" ry="8.5" style="filter:blur(3px)">` +
      `<animate attributeName="fill" values="#00E5FF;#00E5FF;#FF3B30;#FF3B30;#00E5FF" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values=".6;.2;.5;.15;.6;.1;.5;.2;.6;.2;.5;.15;.6;.2;.5;.1;.85;.85;.85;.85;.6" ` +
        `keyTimes="0;.05;.11;.17;.23;.29;.35;.41;.47;.53;.59;.65;.71;.77;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</ellipse>`
  );

  /* Ambient LED reflection on the floor in front of CPU */
  const CPU_FACE = CPU.y + CPU.d;
  const [fgx, fgy] = pt(CPU.x + CPU.w / 2, CPU_FACE + 3, z0);
  out.push(
    `<ellipse cx="${fgx.toFixed(2)}" cy="${fgy.toFixed(2)}" rx="7.5" ry="3.8" style="filter:blur(3.5px)">` +
      `<animate attributeName="fill" values="#00E5FF;#00E5FF;#FF3B30;#FF3B30;#00E5FF" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values=".4;.15;.35;.1;.4;.15;.35;.1;.4;.1;.35;.1;.4;.1;.35;.1;.65;.65;.65;.65;.4" ` +
        `keyTimes="0;.05;.11;.17;.23;.29;.35;.41;.47;.53;.59;.65;.71;.77;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</ellipse>`
  );

  /* Front panel on near face (+y face, CPU_FACE) */
  const m = k.sideMatrix([CPU.x, CPU_FACE], CPU_H, P, "left");
  const rect = (x, y, w, h, fill, rx = 0.5, extra = "") =>
    `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${rx}" fill="${fill}"${extra}/>`;

  const front = [];
  /* Front face bezel */
  front.push(rect(1, 1, CPU.w - 2, CPU_H - 2, "var(--anatomy-shade-1)", 1.5));
  front.push(`<g fill="none" stroke="var(--anatomy-faint)" stroke-width=".3"><rect x="1.2" y="1.2" width="${CPU.w - 2.4}" height="${CPU_H - 2.4}" rx="1.3"/></g>`);

  /* Power button at center-top */
  const bx = CPU.w / 2, by = 5;
  front.push(`<circle cx="${bx}" cy="${by}" r="2.2" fill="var(--anatomy-lo)"/>`);
  front.push(`<circle cx="${bx}" cy="${by}" r="1.4" fill="var(--anatomy-shade-3)"/>`);

  /* Soft halo behind power LED */
  front.push(
    `<circle cx="${bx}" cy="${by}" r="2.8" style="filter:blur(1px)">` +
      `<animate attributeName="fill" values="#00E5FF;#00E5FF;#FF3B30;#FF3B30;#00E5FF" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values=".5;.1;.4;.15;.5;.1;.4;.15;.5;.1;.4;.1;.5;.1;.4;.1;.8;.8;.8;.8;.5" ` +
        `keyTimes="0;.05;.11;.17;.23;.29;.35;.41;.47;.53;.59;.65;.71;.77;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</circle>`
  );

  /* Blinking CPU status LED — blinks while screen runs, turns RED when screen turns off / clears */
  front.push(
    `<circle cx="${bx}" cy="${by}" r="1.1">` +
      `<animate attributeName="fill" values="#00E5FF;#00E5FF;#FF3B30;#FF3B30;#00E5FF" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="1;.2;1;.3;1;.1;.9;.2;1;.3;.8;.1;1;.2;.9;.1;1;1;1;1;1" ` +
        `keyTimes="0;.05;.11;.17;.23;.29;.35;.41;.47;.53;.59;.65;.71;.77;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</circle>`
  );

  /* Secondary drive activity indicator slit */
  front.push(
    `<rect x="${bx - 1.4}" y="8.2" width="2.8" height="0.9" rx="0.45">` +
      `<animate attributeName="fill" values="#00E676;#00E676;#FF3B30;#FF3B30;#00E676" keyTimes="0;.855;.86;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values=".9;.1;.8;.2;1;.1;.7;.1;.9;.2;.8;.1;1;.1;.8;.1;1;1;1;1;.9" ` +
        `keyTimes="0;.06;.12;.18;.24;.30;.36;.42;.48;.54;.60;.66;.72;.78;.82;.855;.86;.90;.95;.995;1" dur="${LOOP}" repeatCount="indefinite"/>` +
    `</rect>`
  );

  /* Front I/O: 2 vertical USB ports */
  front.push(rect(bx - 3.2, 10.8, 1.3, 2.4, "var(--anatomy-lo)", 0.4));
  front.push(rect(bx + 1.9, 10.8, 1.3, 2.4, "var(--anatomy-lo)", 0.4));

  /* Ventilation intake grille slats */
  for (let gy = 15.5; gy <= 29; gy += 2.2) {
    front.push(rect(3.5, gy, CPU.w - 7, 0.9, "var(--anatomy-lo)", 0.4));
  }

  // UNMIRRORED: using scale(-1 1) inside flipped scene
  out.push(`<g transform="${m} translate(${CPU.w} 0) scale(-1 1)">${front.join("")}</g>`);

  /* Cable at back running up toward desk cable trough */
  const cab1 = pt(CPU.x + CPU.w / 2, CPU.y + 1, chassisZ + chassisH - 4);
  const cab2 = pt(CPU.x + CPU.w / 2, CPU.y - 8, DESK_Z - 6);
  out.push(tube(k.segment(cab1, cab2, P), 2.0, "var(--anatomy-lo)", "var(--anatomy-lo)", "var(--anatomy-lo)"));

  return out.join("");
}

/* Ergonomic angled rocker footrest under the desk in the kneehole */
function footrest() {
  const out = [];
  const fx0 = CX - 20, fx1 = CX + 20;
  const fy0 = 17, fy1 = 43;
  const fz_far = 6.4, fz_near = 2.4;

  // Soft contact shadow on the floor beneath the footrest
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: fx0 - 2, y: fy0 - 2, w: fx1 - fx0 + 4, d: fy1 - fy0 + 4, r: 6 }, 0, 0.6, P)}" style="filter:blur(3.5px)" opacity=".35"/>`);

  // Side rocker runners at fx0 and fx1: sleek low-profile curved tubular sled rails
  for (const x of [fx0, fx1]) {
    const ym = (fy0 + fy1) / 2;
    // Smooth parabolic rocker curve: flush with platform at ends, gently kissing floor at center
    const arcPts = [];
    const N = 8;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const y = (fy0 + 1.2) * (1 - u) + (fy1 - 1.2) * u;
      const arch = 4 * (u - 0.5) * (u - 0.5); // 1 at ends, 0 at center
      const pz = fz_far * (1 - u) + fz_near * u;
      const z = 0.8 + (pz - 0.8) * arch;
      arcPts.push(pt(x, y, z));
    }
    out.push(tube(poly(arcPts, false), 2.4, "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));

    // Sleek central pivot bracket joining rocker runner to the platform
    const pz_mid = (fz_far + fz_near) / 2 + 1.2;
    out.push(tube(poly([pt(x, ym, 1.0), pt(x, ym, pz_mid)], false), 2.0,
      "var(--anatomy-shade-1)", "var(--anatomy-shade-2)", "var(--anatomy-top)"));
    out.push(D([pt(x, ym, pz_mid)], { size: 0.85, tone: "lo" }));
  }

  // Crossbar connecting the runners at bottom
  out.push(tube(poly([pt(fx0, (fy0 + fy1) / 2, 1.4), pt(fx1, (fy0 + fy1) / 2, 1.4)], false), 2.0,
    "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));

  // Main angled platform slab (elevated at back, angled to front)
  const p_top = [
    pt(fx0 + 2.2, fy0, fz_far + 1.6),
    pt(fx1 - 2.2, fy0, fz_far + 1.6),
    pt(fx1 - 2.2, fy1, fz_near + 1.6),
    pt(fx0 + 2.2, fy1, fz_near + 1.6),
  ];
  const p_bot = [
    pt(fx0 + 2.2, fy0, fz_far),
    pt(fx1 - 2.2, fy0, fz_far),
    pt(fx1 - 2.2, fy1, fz_near),
    pt(fx0 + 2.2, fy1, fz_near),
  ];

  // Shaded faces of platform
  out.push(`<path d="${poly([p_bot[0], p_bot[1], p_top[1], p_top[0]])}" fill="var(--anatomy-shade-3)" stroke="var(--anatomy-lo)" stroke-width=".4"/>`); // far face
  out.push(`<path d="${poly([p_bot[2], p_bot[3], p_top[3], p_top[2]])}" fill="var(--anatomy-face)" stroke="var(--anatomy-lo)" stroke-width=".4"/>`); // near face
  out.push(`<path d="${poly([p_bot[3], p_bot[0], p_top[0], p_top[3]])}" fill="var(--anatomy-shade-2)" stroke="var(--anatomy-lo)" stroke-width=".4"/>`); // left face
  out.push(`<path d="${poly([p_bot[1], p_bot[2], p_top[2], p_top[1]])}" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-lo)" stroke-width=".4"/>`); // right face
  out.push(`<path d="${poly(p_top)}" fill="var(--anatomy-top)" stroke="var(--anatomy-lo)" stroke-width=".5"/>`); // top face

  // Anti-slip ribbed rubber tread bars across the platform surface
  for (let t = 0.18; t <= 0.88; t += 0.14) {
    const y = fy0 * (1 - t) + fy1 * t;
    const z = (fz_far + 1.8) * (1 - t) + (fz_near + 1.8) * t;
    const rib = poly([pt(fx0 + 4.0, y, z), pt(fx1 - 4.0, y, z)], false);
    out.push(`<path d="${rib}" fill="none" stroke="var(--anatomy-shade-2)" stroke-width="1.8" stroke-linecap="round"/>`);
    out.push(`<path d="${rib}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5" stroke-linecap="round"/>`);
  }

  return out.join("");
}

/* Front-left floor items: Commuter Tech Backpack & Designer Fluted Wastepaper Bin */
function floorItems() {
  const out = [];

  /* --- 1. Designer Fluted Wastepaper Bin with Crumpled Sketch Drafts (Enlarged, at Green Mark) --- */
  // Positioned on the floor beside the left end of the desk along the side panel
  const wx = 94, wy = -65;
  const BIN_H = 23, BIN_R = 10.5;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: wx - BIN_R - 2, y: wy - BIN_R - 2, w: (BIN_R + 2) * 2, d: (BIN_R + 2) * 2, r: BIN_R + 2 }, 0, 0.6, P)}" style="filter:blur(5px)" opacity=".38"/>`);

  // Bin cylinder body
  out.push(S(k.cylinder(wx, wy, BIN_R, 0, BIN_H, P, 32, 0.9), { tone: "mid" }));
  // Top rolled rim
  out.push(L(k.ring(wx, wy, BIN_R - 0.4, BIN_H, P, 32), { tone: "lo" }));
  // Interior shadow cavity
  out.push(S(k.cylinder(wx, wy, BIN_R - 1.0, BIN_H - 4.5, 4.5, P, 32), { tone: "shade-3", crease: "none" }));

  // Vertical fluted texture ribs on visible exterior
  for (let a = -100; a <= 120; a += 25) {
    const rad = (a * Math.PI) / 180;
    const rx = wx + Math.cos(rad) * BIN_R;
    const ry = wy + Math.sin(rad) * BIN_R;
    out.push(L(k.segment([rx, ry, 2.0], [rx, ry, BIN_H - 2.0], P), { tone: "lo" }));
  }

  // Crumpled paper idea drafts peeking out of the bin (scaled up)
  const p1_pts = [
    pt(wx - 3.5, wy - 1.5, BIN_H - 2.0),
    pt(wx - 6.5, wy + 2.0, BIN_H + 3.2),
    pt(wx - 3.0, wy + 5.0, BIN_H + 6.0),
    pt(wx + 1.8, wy + 3.0, BIN_H + 5.2),
    pt(wx + 0.8, wy - 2.0, BIN_H + 0.8),
  ];
  out.push(`<polygon points="${p1_pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}" fill="var(--anatomy-page)" stroke="var(--anatomy-lo)" stroke-width=".5"/>`);
  out.push(`<path d="M${p1_pts[0].map(v=>v.toFixed(2)).join(' ')}L${p1_pts[2].map(v=>v.toFixed(2)).join(' ')}" stroke="var(--anatomy-faint)" stroke-width=".45"/>`);

  const p2_pts = [
    pt(wx - 1.0, wy - 4.5, BIN_H - 1.0),
    pt(wx + 5.0, wy - 2.2, BIN_H + 4.5),
    pt(wx + 6.5, wy + 2.2, BIN_H + 3.0),
    pt(wx + 2.2, wy + 1.5, BIN_H - 1.5),
  ];
  out.push(`<polygon points="${p2_pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}" fill="var(--anatomy-shade-0)" stroke="var(--anatomy-lo)" stroke-width=".5"/>`);
  out.push(`<path d="M${p2_pts[1].map(v=>v.toFixed(2)).join(' ')}L${p2_pts[3].map(v=>v.toFixed(2)).join(' ')}" stroke="var(--anatomy-faint)" stroke-width=".45"/>`);

  /* --- 2. Commuter Tech Backpack (Substantially Enlarged, Standing Along Drawer Front) --- */
  const bx = 104, by = -10;
  const bagPlan = { x: bx, y: by, w: 14.0, d: 24.0, r: 5.0 };
  const BAG_H = 32.0;
  out.push(`<path class="iso-halo" d="${k.haloOf(bagPlan, 0, 0.6, P)}" style="filter:blur(5px)" opacity=".45"/>`);

  // Main backpack body with generous bevel
  out.push(S(k.slabOf(bagPlan, 0, BAG_H, P, 8, 1.2), { tone: "mid" }));

  // Front accessory pocket facing +x (towards the camera / viewer)
  const pocketPlan = { x: bx + bagPlan.w, y: by + 2.2, w: 4.2, d: 19.6, r: 2.8 };
  out.push(S(k.slabOf(pocketPlan, 3.0, 19.0, P, 5, 0.6), { tone: "lo", crease: "none" }));
  // Horizontal zipper seam across front pocket (+x face)
  out.push(L(k.segment([pocketPlan.x + pocketPlan.w, pocketPlan.y + 1.8, 17.5], [pocketPlan.x + pocketPlan.w, pocketPlan.y + pocketPlan.d - 1.8, 17.5], P), { tone: "hi" }));
  // Zipper pull tag (coral accent)
  out.push(D([pt(pocketPlan.x + pocketPlan.w + 0.5, pocketPlan.y + 5.0, 17.5)], { size: 0.8, tone: "lit" }));

  // Top grab handle: curved strap arching over top along y
  out.push(tube(poly([
    pt(bx + 7.0, by + 7.0, BAG_H - 0.4),
    pt(bx + 7.0, by + 9.0, BAG_H + 4.2),
    pt(bx + 7.0, by + 15.0, BAG_H + 4.2),
    pt(bx + 7.0, by + 17.0, BAG_H - 0.4)
  ], false), 2.4, "var(--anatomy-lo)", "var(--anatomy-shade-3)", "var(--anatomy-mid)"));

  // Side water bottle mesh pocket on near end (+y)
  const meshPlan = { x: bx + 2.2, y: by + bagPlan.d, w: 9.6, d: 3.6, r: 1.5 };
  out.push(S(k.slabOf(meshPlan, 2.0, 15.0, P, 4, 0.5), { tone: "shade-2", crease: "none" }));
  // Insulated travel water bottle inside the mesh pocket
  out.push(S(k.cylinder(bx + 7.0, by + bagPlan.d + 1.8, 3.0, 2.0, 21.0, P, 20), { tone: "lit-top", crease: "none" }));
  out.push(S(k.cylinder(bx + 7.0, by + bagPlan.d + 1.8, 2.2, 23.0, 3.5, P, 16), { tone: "lo", crease: "none" })); // cap

  return out.join("");
}

/* projected point-set → its leftmost and rightmost members */
const lrOf = (pts) => {
  let lo = pts[0], hi = pts[0];
  for (const p of pts) { if (p[0] < lo[0]) lo = p; if (p[0] > hi[0]) hi = p; }
  return [lo, hi];
};

/* A circle lying in ANY plane — n is the plane's unit normal. Sampling the
   true 3D circle and letting the affine projection do the work yields the
   exact ellipse of a tilted disc, which the axis-aligned circleX/circleY
   cannot express; this is what lets the lamp head aim at the work. */
const circle3 = (c, n, r, steps = 40) => {
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const any = Math.abs(n[2]) < 0.92 ? [0, 0, 1] : [1, 0, 0];
  const u = nm(cr(n, any)), w = nm(cr(n, u));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * Math.PI * 2, a = Math.cos(t), b = Math.sin(t);
    return pt(c[0] + r * (u[0] * a + w[0] * b),
              c[1] + r * (u[1] * a + w[1] * b),
              c[2] + r * (u[2] * a + w[2] * b));
  });
};

/* Convex hull (monotone chain). A lamp shade is a convex frustum, so its
   outline against the desk is exactly the hull of the two rims' points. */
const hull = (pts) => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (seq) => {
    const out = [];
    for (const q of seq) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return half(p).concat(half(p.slice().reverse()));
};

function lamp() {
  const out = [];
  const [lx, ly] = LAMP;
  const z0 = DESK_TOP_Z;

  /* Authentic modern architect / Anglepoise study table lamp:
     1. Base pivot socket at [lx, ly, z0 + 4.2]
     2. Lower arm (twin parallel struts) reaching forward/up to ELBOW
     3. Elbow knuckle joint with pivot disc and adjustment knob
     4. Upper cantilever arm reaching forward/down to HEAD_PIVOT
     5. Swivel knuckle with iconic architect bell study shade
     6. Warm, cozy task light pool focused naturally onto the work surface */
  const P_BASE = [lx, ly, z0 + 4.2];
  const ELBOW = LAMP_ELBOW;
  const HEAD_PIVOT = LAMP_HEAD;

  /* Shade geometry: pointing directly down-forward onto the keyboard */
  const poolC = POOL_C;
  const target = [poolC[0], poolC[1], z0];
  const ax = [target[0] - HEAD_PIVOT[0], target[1] - HEAD_PIVOT[1], target[2] - HEAD_PIVOT[2]];
  const al = Math.hypot(ax[0], ax[1], ax[2]) || 1;
  const nHat = ax.map((v) => v / al);
  const NECK_R = 3.6, MOUTH_R = 9.6, SHADE_L = 12.6;
  const neckC = [0, 1, 2].map((i) => HEAD_PIVOT[i] + nHat[i] * 2.8);
  const mouthC = [0, 1, 2].map((i) => HEAD_PIVOT[i] + nHat[i] * SHADE_L);
  const mouth = circle3(mouthC, nHat, MOUTH_R);
  const neck = circle3(neckC, nHat, NECK_R);

  /* Light pool on the desk & keyboard */
  const [psx, psy] = pt(poolC[0], poolC[1], z0);
  const HOT_R = 18;
  const pool = Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2;
    return pt(poolC[0] + Math.cos(t) * POOL_R, poolC[1] + Math.sin(t) * POOL_R, z0);
  });

  const [mlo, mhi] = lrOf(mouth);
  const [plo, phi] = lrOf(pool);
  const beam = poly([mlo, mhi, phi, plo]);
  const xs = mouth.map((p) => p[0]), ys = mouth.map((p) => p[1]);
  const mcx = (Math.min(...xs) + Math.max(...xs)) / 2, mcy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const mrx = ((Math.max(...xs) - Math.min(...xs)) / 2) * 1.35, mry = ((Math.max(...ys) - Math.min(...ys)) / 2) * 1.35;
  const hot = parseFloat(T.lamp.hot);

  out.push(`<defs>
    <radialGradient id="lampPool" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(${psx.toFixed(1)} ${psy.toFixed(1)}) scale(${POOL_A.toFixed(1)} ${POOL_B.toFixed(1)})">
      <stop offset="0" stop-color="#E8A55A" stop-opacity="${(hot * 0.70).toFixed(2)}"/>
      <stop offset=".55" stop-color="#E8A55A" stop-opacity="${(hot * 0.30).toFixed(2)}"/>
      <stop offset="1" stop-color="#E8A55A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lampHot" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(${psx.toFixed(1)} ${psy.toFixed(1)}) scale(${(1.697 * HOT_R).toFixed(1)} ${(0.849 * HOT_R).toFixed(1)})">
      <stop offset="0" stop-color="#FFE9C0" stop-opacity="${(hot * 1.1).toFixed(2)}"/>
      <stop offset=".6" stop-color="#F0B871" stop-opacity="${(hot * 0.35).toFixed(2)}"/>
      <stop offset="1" stop-color="#E8A55A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lampBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD79B" stop-opacity="${(hot * 0.40).toFixed(2)}"/>
      <stop offset=".6" stop-color="#F2BC77" stop-opacity="${(hot * 0.15).toFixed(2)}"/>
      <stop offset="1" stop-color="#E8A55A" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lampMouth">
      <stop offset="0" stop-color="#FFF7E6"/>
      <stop offset=".45" stop-color="#F6D9A6"/>
      <stop offset="1" stop-color="#DFA45E"/>
    </radialGradient>
  </defs>`);

  const FLICK_DUR = "14s";
  const FLICK_V = "1;1;.87;1;1;.93;1;1;.8;1;1;.91;1;1";
  const FLICK_T = "0;.14;.163;.19;.42;.445;.47;.68;.703;.73;.86;.884;.9;1";
  const flick = `<animate attributeName="opacity" values="${FLICK_V}" keyTimes="${FLICK_T}" dur="${FLICK_DUR}" repeatCount="indefinite"/>`;

  out.push(`<g>`, flick);
  out.push(`<path d="${poly(pool)}" fill="url(#lampPool)"/>`);
  out.push(`<ellipse cx="${psx.toFixed(1)}" cy="${psy.toFixed(1)}" rx="${(1.697 * HOT_R).toFixed(1)}" ry="${(0.849 * HOT_R).toFixed(1)}" fill="url(#lampHot)"/>`);
  out.push(`<path d="${beam}" fill="url(#lampBeam)" style="filter:blur(2.0px)"/>`);
  out.push(`<ellipse cx="${mcx.toFixed(1)}" cy="${mcy.toFixed(1)}" rx="${mrx.toFixed(1)}" ry="${mry.toFixed(1)}" fill="#FFC978" opacity="${(hot * 0.35).toFixed(2)}" style="filter:blur(5px)"/>`);
  out.push(`</g>`);

  /* Base: sleek circular weighted disc with chamfered edge and swivel turret */
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: lx - 10, y: ly - 10, w: 20, d: 20, r: 10 }, z0, 0.5, P)}" style="filter:blur(4px)" opacity=".4"/>`);
  out.push(S(k.cylinder(lx, ly, 9.5, z0, 1.8, P, 32, 0.5), { tone: "mid" }));
  out.push(L(k.ring(lx, ly, 7.8, z0 + 1.8, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(lx, ly, 4.0, z0 + 1.8, 2.4, P, 22, 0.4), { tone: "mid" }));
  out.push(L(k.ring(lx, ly, 4.0, z0 + 4.2, P, 22), { tone: "faint" }));

  /* Base pivot joint */
  out.push(sphere(P_BASE[0], P_BASE[1], P_BASE[2], 2.8, {
    fill: "var(--anatomy-face)", lit: "var(--anatomy-top)", shade: "var(--anatomy-shade-2)",
  }));

  /* Lower arm: authentic twin parallel articulated struts */
  const ldx = ELBOW[0] - P_BASE[0], ldy = ELBOW[1] - P_BASE[1];
  const lLen = Math.hypot(ldx, ldy);
  const lnx = (-ldy / lLen) * 1.5, lny = (ldx / lLen) * 1.5;

  const s1_a = [P_BASE[0] + lnx, P_BASE[1] + lny, P_BASE[2]];
  const s1_b = [ELBOW[0] + lnx, ELBOW[1] + lny, ELBOW[2]];
  const s2_a = [P_BASE[0] - lnx, P_BASE[1] - lny, P_BASE[2]];
  const s2_b = [ELBOW[0] - lnx, ELBOW[1] - lny, ELBOW[2]];

  out.push(tube(poly([pt(...s1_a), pt(...s1_b)]), 2.5,
    "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));
  out.push(tube(poly([pt(...s2_a), pt(...s2_b)]), 2.5,
    "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));

  /* Lower cross pin */
  const cp1_a = [P_BASE[0] + lnx * 1.8, P_BASE[1] + lny * 1.8, P_BASE[2] + 4.5];
  const cp1_b = [P_BASE[0] - lnx * 1.8, P_BASE[1] - lny * 1.8, P_BASE[2] + 4.5];
  out.push(tube(poly([pt(...cp1_a), pt(...cp1_b)]), 1.8,
    "var(--anatomy-face)", "var(--anatomy-shade-2)", "var(--anatomy-lit-top)"));

  /* Upper arm: cantilever arm connecting elbow to head */
  out.push(tube(poly([pt(...ELBOW), pt(...HEAD_PIVOT)]), 3.8,
    "var(--anatomy-top)", "var(--anatomy-shade-1)", "var(--anatomy-lit-top)"));
  /* Parallel tension bar */
  const udx = HEAD_PIVOT[0] - ELBOW[0], udy = HEAD_PIVOT[1] - ELBOW[1];
  const uLen = Math.hypot(udx, udy);
  const unx = (-udy / uLen) * 1.8, uny = (udx / uLen) * 1.8;
  const us_a = [ELBOW[0] + unx, ELBOW[1] + uny, ELBOW[2] + 2.8];
  const us_b = [HEAD_PIVOT[0] + unx, HEAD_PIVOT[1] + uny, HEAD_PIVOT[2] + 2.8];
  out.push(tube(poly([pt(...us_a), pt(...us_b)]), 1.5,
    "var(--anatomy-face)", "var(--anatomy-lo)", "var(--anatomy-top)"));

  /* Elbow knuckle: pivot sphere and adjustment thumb knob */
  out.push(sphere(ELBOW[0], ELBOW[1], ELBOW[2], 3.8, {
    fill: "var(--anatomy-face)", lit: "var(--anatomy-top)", shade: "var(--anatomy-shade-2)",
  }));
  const knobPt = pt(ELBOW[0] - lnx * 2.4, ELBOW[1] - lny * 2.4, ELBOW[2]);
  out.push(`<circle cx="${knobPt[0].toFixed(2)}" cy="${knobPt[1].toFixed(2)}" r="2.4" fill="var(--anatomy-lo)"/>`);
  out.push(`<circle cx="${knobPt[0].toFixed(2)}" cy="${knobPt[1].toFixed(2)}" r="1.5" fill="var(--anatomy-shade-3)"/>`);

  /* Head swivel joint */
  out.push(sphere(HEAD_PIVOT[0], HEAD_PIVOT[1], HEAD_PIVOT[2], 3.0, {
    fill: "var(--anatomy-face)", lit: "var(--anatomy-top)", shade: "var(--anatomy-shade-2)",
  }));

  /* Lamp Shade: modern architect bell / tapered cone */
  const shadeBody = poly(hull(mouth.concat(neck)));
  out.push(`<path d="${shadeBody}" fill="var(--anatomy-top)"/>`);
  out.push(`<path d="${shadeBody}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5"/>`);
  out.push(`<path d="${poly(neck)}" fill="var(--anatomy-shade-2)"/>`);

  /* Rolled mouth lip */
  const lip = circle3(mouthC, nHat, MOUTH_R + 1.0);
  out.push(`<path d="${poly(lip)}" fill="var(--anatomy-top)"/>`);
  out.push(`<path d="${poly(lip)}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5"/>`);

  /* Illuminated mouth */
  out.push(`<g>`, flick);
  out.push(`<path d="${poly(mouth)}" fill="url(#lampMouth)"/>`);
  out.push(`<path d="${poly(mouth)}" fill="none" stroke="#FFE9C4" stroke-width=".8" opacity=".95"/>`);
  out.push(`</g>`);

  return out.join("");
}

/* A pad of paper in the lamp's pool, so the light has something to land on.
   The sheets inset a hair at each level — a single slab reads as a block, a
   stepped stack reads as paper — but only a hair: deep insets turn a pad into
   a wedding cake. */
function notepad() {
  const out = [];
  const z = DESK_TOP_Z;
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(NOTEPAD, 2), z, 0.6, P)}" style="filter:blur(4px)" opacity=".4"/>`);
  const sheets = [
    { inset: 0.2, h: 1.5, tone: "lo" },
    { inset: 0.9, h: 1.3, tone: "mid" },
    { inset: 1.6, h: 1.3, tone: "hi" },
  ];
  let zz = z;
  for (const s of sheets) {
    out.push(S(k.slabOf(k.insetPlan(NOTEPAD, s.inset), zz, s.h, P, 3, 0.3), { tone: s.tone, crease: "none" }));
    zz += s.h;
  }
  /* ruled lines; the last one stops short, like a half-written thought */
  const m = k.topMatrix([NOTEPAD.x + 4, NOTEPAD.y + 5], zz - 0.1, P, "x");
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const w = NOTEPAD.w - 8 - (i === 3 ? 12 : 0);
    rows.push(`<rect x="0" y="${(i * 4.4).toFixed(1)}" width="${w.toFixed(1)}" height="1.1" rx=".55" fill="var(--anatomy-faint)"/>`);
  }
  out.push(`<g transform="${m}">${rows.join("")}</g>`);
  /* the pen that was just put down, still ON the page — a rod run corner to
     corner hangs off both ends and reads as a ruler laid across the desk */
  out.push(tube(poly([
    pt(NOTEPAD.x + 7, NOTEPAD.y + 19, zz + 0.9),
    pt(NOTEPAD.x + 23, NOTEPAD.y + 9, zz + 0.9),
  ], false), 2.4, "var(--anatomy-mid)", T.rod.shade, T.rod.lit));
  return out.join("");
}

/* A cup of pencils at the back of the desk, beside the monitor and the
   plant — where a cup actually lives, out of the writing zone. The splay
   is uneven on purpose — an even ring of pencils reads as a cog, a
   lopsided one reads as a cup. */
function pencilCup() {
  const out = [];
  const [x, y] = PENCIL;
  const z = DESK_TOP_Z;
  const CUP = 15;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 7, y: y - 7, w: 14, d: 14, r: 7 }, z, 0.6, P)}" style="filter:blur(4px)" opacity=".45"/>`);
  out.push(S(k.cylinder(x, y, 7, z, CUP, P, 26, 1.2), { tone: "mid" }));
  out.push(L(k.ring(x, y, 6.1, z + CUP, P, 26), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 6.1, z + CUP - 2.6, 2.6, P, 26), { tone: "shade-2", crease: "none" }));
  for (const [dx, dy, len, tone] of [
    [-2.6, -1.4, 9, "hi"],
    [1.8, -2.4, 7, "lit"],
    [0.4, 2.6, 8, "mid"],
  ]) {
    out.push(tube(poly([
      pt(x + dx, y + dy, z + CUP - 3),
      pt(x + dx * 2, y + dy * 2, z + CUP - 3 + len),
    ], false), 2.2, `var(--anatomy-${tone})`, T.rod.shade, T.rod.lit));
  }
  return out.join("");
}

function keyboard() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(KB, 2), KB_Z, 0.6, P)}" style="filter:blur(4px)" opacity=".45"/>`);
  out.push(S(k.slabOf(KB, KB_Z, KB_T, P, 5, 0.6), { tone: "mid" }));
  const m = k.topMatrix([KB.x, KB.y], KB_TOP, P, "x");
  const keys = [];
  const cols = 12, rows = 5;
  const padX = 2.0, padY = 2.0;
  const stepX = (KB.w - padX * 2) / cols;
  const stepY = (KB.d - padY * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && c > 2 && c < 8) continue;
      keys.push(`<rect x="${(padX + c * stepX + .4).toFixed(2)}" y="${(padY + r * stepY + .4).toFixed(2)}" width="${(stepX - .8).toFixed(2)}" height="${(stepY - .8).toFixed(2)}" rx="0.8" fill="var(--anatomy-shade-2)"/>`);
    }
  }
  keys.push(`<rect x="${(padX + 3 * stepX + .4).toFixed(2)}" y="${(padY + (rows - 1) * stepY + .4).toFixed(2)}" width="${(stepX * 5 - .8).toFixed(2)}" height="${(stepY - .8).toFixed(2)}" rx="0.8" fill="var(--anatomy-shade-2)"/>`);
  out.push(`<g transform="${m}">${keys.join("")}</g>`);
  return out.join("");
}

function mouse() {
  const out = [];

  // 1. Minimalist desk mat / mousepad under mouse
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(MOUSE_PAD, 1), KB_Z, 0.4, P)}" style="filter:blur(3px)" opacity=".3"/>`);
  out.push(S(k.slabOf(MOUSE_PAD, KB_Z, 0.8, P, 6, 0.2), { tone: "shade-2", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(MOUSE_PAD, 1.2), KB_Z + 0.8, P, 4), { tone: "faint" }));

  // 2. Mouse contact shadow onto the mousepad
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(MOUSE, 1.0), KB_Z + 0.8, 0.4, P)}" style="filter:blur(2.5px)" opacity=".45"/>`);

  // 3. Mouse lower chassis / glider skirt
  out.push(S(k.slabOf(MOUSE, KB_Z + 0.8, 0.8, P, 6, 0.2), { tone: "lo", crease: "none" }));

  // 4. Mouse ergonomic top shell (slightly inset and domed)
  const shellPlan = k.insetPlan(MOUSE, 0.3);
  out.push(S(k.slabOf(shellPlan, KB_Z + 1.6, 2.2, P, 6, 0.6), { tone: "mid" }));

  // 5. Left/right click split seam and recessed scroll wheel
  const mx = MOUSE.x + MOUSE.w / 2;
  const my = MOUSE.y;
  const topZ = KB_Z + 3.8;
  // Center dividing seam down front half of mouse
  out.push(L(k.lineOnTop([mx, my + 0.6], [mx, my + 4.5], topZ, P), { tone: "lo" }));
  // Recessed metallic scroll wheel capsule
  out.push(S(k.slabOf({ x: mx - 0.55, y: my + 1.6, w: 1.1, d: 1.8, r: 0.5 }, topZ - 0.3, 0.7, P, 4, 0.2), { tone: "shade-1", crease: "none" }));
  out.push(L(k.lineOnTop([mx, my + 1.8], [mx, my + 3.2], topZ + 0.4, P), { tone: "faint" }));

  return out.join("");
}

/* One tapered arm of the five-star base. The silhouette is the hull of both
   faces, so the beam keeps its thickness against the floor; the side walls go
   down first and the top face last, which covers the far wall. */
const starArm = (cx, cy, angDeg, r0, r1, w0, w1, z, h) => {
  const a = (angDeg * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const vx = -uy, vy = ux;
  const at = (r, s, zz) => pt(cx + ux * r + vx * s, cy + uy * r + vy * s, zz);
  const bot = [at(r0, -w0 / 2, z), at(r1, -w1 / 2, z), at(r1, w1 / 2, z), at(r0, w0 / 2, z)];
  const top = [at(r0, -w0 / 2, z + h), at(r1, -w1 / 2, z + h), at(r1, w1 / 2, z + h), at(r0, w0 / 2, z + h)];
  const shell = poly(hull(bot.concat(top)));
  return S({
    fill: shell,
    shades: [
      poly([bot[1], bot[2], top[2], top[1]]),
      poly([bot[2], bot[3], top[3], top[2]]),
      poly([bot[0], bot[1], top[1], top[0]]),
      "",
    ],
    top: poly(top),
    outline: shell,
  }, { tone: "lo" });
};

/* A caster: an upright wheel on a stub axle, its disc turned to stand rather
   than lie flat, so it reads as a wheel and not as another puck. Rubber reads
   darker than the casting, so the disc keeps the unlit paper fill. */
const caster = (cx, cy, angDeg) => {
  const a = (angDeg * Math.PI) / 180;
  const vx = -Math.sin(a), vy = Math.cos(a);
  const wx = cx + Math.cos(a) * (BASE_R - 2.5), wy = cy + Math.sin(a) * (BASE_R - 2.5);
  const disc = (r) => Array.from({ length: 20 }, (_, i) => {
    const t = (i / 20) * Math.PI * 2;
    return pt(wx + vx * Math.cos(t) * r, wy + vy * Math.cos(t) * r, 3.4 + Math.sin(t) * r);
  });
  const tyre = poly(disc(3.4));
  return (
    S({ fill: tyre, shades: [], top: "", outline: tyre }, { tone: "lo", crease: "none", flat: true }) +
    L(poly(disc(1.5)), { tone: "faint" }) +
    S(k.cylinder(wx, wy, 1.5, 6, 3.2, P, 12), { tone: "mid", crease: "none" })
  );
};

function chairBase() {
  const out = [];
  const [cx, cy] = CHAIR;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: cx - BASE_R, y: cy - BASE_R, w: BASE_R * 2, d: BASE_R * 2, r: BASE_R }, -4, 5, P)}"/>`);
  /* five arms, seventy-two degrees apart, each standing on its caster */
  const ANG = [-90, -18, 54, 126, 198];
  for (const a of ANG) out.push(caster(cx, cy, a));
  for (const a of ANG) out.push(starArm(cx, cy, a, 4, BASE_R - 4, 9, 5, 6, 4));
  /* hub, then the two-stage gas lift with its collar */
  out.push(S(k.cylinder(cx, cy, 6.5, 9, 5, P, 28, 0.6), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 4.4, 14, P, 28), { tone: "faint" }));
  out.push(S(k.cylinder(cx, cy, 4.6, 14, 6, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, 3.3, 20, 7, P, 20), { tone: "lo", crease: "none" }));
  out.push(L(k.ring(cx, cy, 4.9, 20, P, 20), { tone: "faint" }));
  out.push(S(k.slabOf(SEAT, SEAT_Z, 7, P, 8, 1.4), { tone: "lo", crease: "faint" }));
  return out.join("");
}

function chairBack() {
  return S(k.slabOf(BACK, SEAT_Z + 7, BACK_TOP - SEAT_Z - 7, P, 4, 0.9), { tone: "lo", crease: "faint" });
}

function person() {
  const [hx, hy] = HEAD;
  const headZ = HEAD_Z;
  const far = [], near = [];

  /* The hand. Drawn as ONE silhouette — palm, four fingers, a thumb lobe —
     because stacked shapes read as loose objects at this size, and drawn
     BEFORE the arm so the sleeve's round cap laps over the wrist exactly the
     way a cuff does. Local frame: +x runs wrist-to-fingertip, +y is the thumb
     side. TH picks which screen side that is, solved from the direction of the
     body's midline rather than guessed: a palm-down hand puts the thumb on the
     inner digit, and the two hands mirror each other across the centre. */
  const hand = (from, to, scale, isMouse = false, worldWrist) => {
    const [wx, wy] = to;
    const [ex, ey] = from;

    let ux, uy;
    if (isMouse) {
      const mf = pt(worldWrist[0], worldWrist[1] - 14.5, worldWrist[2]);
      ux = mf[0] - wx;
      uy = mf[1] - wy;
    } else {
      ux = wx - ex;
      uy = wy - ey;
    }
    const un = Math.hypot(ux, uy) || 1;
    ux /= un;
    uy /= un;

    /* "Inward" means toward the body's midline, so it has to be read off the
       wrist's WORLD x and projected. `to` is already a screen point: comparing
       it against CX was always true, and pt() was then handed a screen x as a
       world x together with an undefined z — so TH came out of a NaN test and
       both hands were forced to the same chirality, putting one thumb on the
       wrong side of its own hand. */
    const inward = worldWrist[0] > CX ? -1 : 1;
    const [mx, my] = pt(worldWrist[0] + inward, worldWrist[1], worldWrist[2]);
    const TH = (mx - wx) * -uy + (my - wy) * ux >= 0 ? 1 : -1;

    const n = (v) => (v * scale).toFixed(2);
    const X = (v) => n(v);
    const Y = (v) => n(v * TH);
    const p = (a, b) => `${X(a)} ${Y(b)}`;

    let body, creases;
    if (isMouse) {
      body =
        `M${p(-2, 3.8)}` +
        `C${p(0, 4.2)} ${p(2, 5.0)} ${p(4, 6.2)}` +
        `C${p(5.5, 7.0)} ${p(7.2, 7.2)} ${p(9.2, 6.6)}` +
        `C${p(10.4, 6.0)} ${p(10.8, 5.0)} ${p(10.2, 4.0)}` +
        `C${p(9.8, 3.5)} ${p(10.5, 3.3)} ${p(11.8, 3.1)}` +
        `C${p(13.8, 2.8)} ${p(16.0, 2.5)} ${p(17.8, 2.1)}` +
        `C${p(18.7, 1.8)} ${p(18.8, 1.0)} ${p(18.0, 0.5)}` +
        `C${p(17.2, 0.3)} ${p(17.2, -0.1)} ${p(17.9, -0.3)}` +
        `C${p(18.7, -0.6)} ${p(18.6, -1.5)} ${p(17.8, -1.8)}` +
        `C${p(16.5, -2.2)} ${p(15.2, -2.6)} ${p(14.0, -3.2)}` +
        `C${p(11.5, -4.0)} ${p(8.5, -4.6)} ${p(5.5, -4.5)}` +
        `C${p(2.5, -4.3)} ${p(0, -4.0)} ${p(-2, -3.6)}Z`;

      creases =
        `<path d="M${p(9.2, 0.2)}L${p(17.2, 0.1)}" fill="none" stroke="${T.skin[2]}" stroke-width="${n(0.42)}" opacity=".65"/>` +
        `<path d="M${p(8.2, 2.4)}C${p(8.5, 0.8)} ${p(8.0, -0.8)} ${p(6.8, -2.4)}" fill="none" stroke="${T.skin[2]}" stroke-width="${n(0.42)}" opacity=".5"/>` +
        `<path d="M${p(6.5, 4.2)}C${p(5.0, 3.0)} ${p(3.2, 2.0)} ${p(1.5, 1.0)}" fill="none" stroke="${T.skin[2]}" stroke-width="${n(0.42)}" opacity=".45"/>`;
    } else {
      body =
        `M${p(-5, 5.4)}` +
        `C${p(-2, 5.8)} ${p(1, 6.1)} ${p(5, 6.1)}` +
        `C${p(6.3, 7.2)} ${p(7.8, 8.5)} ${p(10, 8.4)}` +
        `C${p(10.5, 7.4)} ${p(9.6, 6.7)} ${p(8.2, 6.4)}` +
        `C${p(8.9, 6.35)} ${p(9.5, 6.25)} ${p(10, 6.1)}` +
        `C${p(13, 6)} ${p(16.4, 5.7)} ${p(17.7, 5.2)}` +
        `C${p(18.7, 4.9)} ${p(18.8, 3.8)} ${p(17.8, 3.5)}` +
        `C${p(16.6, 3.2)} ${p(15.4, 3.1)} ${p(14.4, 3.05)}` +
        `C${p(15.4, 3)} ${p(17.2, 2.7)} ${p(18.2, 2.3)}` +
        `C${p(19.2, 1.9)} ${p(19.2, 0.8)} ${p(18.2, 0.5)}` +
        `C${p(17, 0.2)} ${p(15.6, 0.05)} ${p(14.5, 0)}` +
        `C${p(15.5, -0.05)} ${p(17, -0.3)} ${p(18, -0.7)}` +
        `C${p(19, -1.1)} ${p(19, -2.1)} ${p(17.9, -2.5)}` +
        `C${p(16.7, -2.85)} ${p(15.5, -3)} ${p(14.4, -3.05)}` +
        `C${p(15.3, -3.2)} ${p(16.6, -3.5)} ${p(17.4, -3.9)}` +
        `C${p(18.2, -4.25)} ${p(18.1, -5.1)} ${p(17, -5.4)}` +
        `C${p(15.9, -5.7)} ${p(14.6, -6)} ${p(13.4, -6.05)}` +
        `C${p(10, -6.2)} ${p(4, -6.4)} ${p(-1, -6.0)}` +
        `C${p(-3, -5.8)} ${p(-4, -5.6)} ${p(-5, -5.2)}Z`;

      creases =
        `<path d="M${p(8.2, 5.2)}C${p(9.6, 3.8)} ${p(9.9, 1.6)} ${p(9.6, -1.8)}C${p(9.3, -3.9)} ${p(8.8, -5)} ${p(8.2, -5.6)}" fill="none" stroke="${T.skin[2]}" stroke-width="${n(0.42)}" opacity=".55"/>` +
        `<path d="M${p(7.8, 6.1)}C${p(5.8, 5.4)} ${p(4.4, 4.5)} ${p(3.4, 3.1)}" fill="none" stroke="${T.skin[2]}" stroke-width="${n(0.42)}" opacity=".5"/>`;
    }

    let times = ["0"], bendV = ["0"], reachV = ["0 0"];
    if (isMouse) {
      times = ["0", ".21", ".225", ".24", ".61", ".625", ".638", ".652", "1"];
      const d = (1.8 * Math.sign(ux || 1)).toFixed(2);
      bendV = ["0", "0", d, "0", "0", d, "0", d, "0"];
      reachV = ["0 0", "0 0", "0.25 0", "0 0", "0 0", "0.25 0", "0 0", "0.25 0", "0 0"];
    } else {
      let seed = 20261017;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      let t = 0.055;
      while (t < 0.855) {
        const keys = 3 + Math.floor(rnd() * 4);
        for (let i = 0; i < keys && t < 0.855; i++) {
          const down = 0.006 + rnd() * 0.007;
          const deg = (4.5 + rnd() * 4.5) * Math.sign(ux || 1);
          const push = (0.8 + rnd() * 0.8) * scale;
          times.push(t.toFixed(4), (t + down).toFixed(4));
          bendV.push(deg.toFixed(2), "0");
          reachV.push(`${push.toFixed(2)} 0`, "0 0");
          t += down + 0.01 + rnd() * 0.017;
        }
        t += 0.02 + rnd() * 0.045;
      }
      times.push("1");
      bendV.push("0");
      reachV.push("0 0");
    }

    const spin = ((Math.atan2(uy, ux) * 180) / Math.PI).toFixed(1);
    return (
      `<g transform="translate(${wx.toFixed(2)} ${wy.toFixed(2)}) rotate(${spin})">` +
      `<animateTransform attributeName="transform" type="rotate" additive="sum" ` +
      `values="${bendV.join(";")}" keyTimes="${times.join(";")}" dur="${LOOP_S}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" additive="sum" ` +
      `values="${reachV.join(";")}" keyTimes="${times.join(";")}" dur="${LOOP_S}s" repeatCount="indefinite"/>` +
      `<path d="${body}" fill="${T.skin[0]}" stroke="${T.skin[2]}" stroke-width="${n(0.7)}" stroke-linejoin="round"/>` +
      creases +
      `</g>`
    );
  };

  /* far arm is the right arm (-x side), hand out on the MOUSE. The old pose
     put both hands on the keyboard, which parked the far hand exactly behind
     the head — the figure ended up with one visible arm. With the hand out on
     the mouse (past the torso's -x edge, clear of the skull's projected
     circle) both arms read, and the right-handed setup matches the mouse's
     -x position. Each arm is drawn as TWO straight tubes meeting at the elbow
     rather than one three-point polyline — tube()'s round line-join turns a
     single polyline into a smooth curve, which reads as a rubber hose, not an
     arm.

     The elbows sit just BEHIND the desk's near edge (y = CY + 2 > 64) at
     forearm height: an elbow on the desk's own footprint at z < 66 would be
     buried in the slab, and an elbow hung below desk height would send the
     forearm straight through it on the way to the mouse. Resting the fold at
     the edge is also what a seated typist actually does.

     The shade is hood[4] rather than hood[2]: the full-strength shade splits a
     slender tube into a bright bar over a dark one, and with the highlight
     matching the torso the bright bar reads as a pill laid on the sleeve. The
     gentler step keeps the arm one mass. The widths stay slim because this
     camera looks straight down the arm — shoulder to wrist spans only ~21px —
     so a heavy tube collapses into a circle instead of a limb. */
  /* arm: draws continuous relaxed hoodie sleeve with smooth elbow curve and natural drape */
  const arm = (s, e, w, width = 13.5) => {
    const k1 = [e[0] + (s[0] - e[0]) * 0.40, e[1] + (s[1] - e[1]) * 0.40];
    const k2 = [e[0] + (w[0] - e[0]) * 0.40, e[1] + (w[1] - e[1]) * 0.40];
    const curvedPath = `M${s[0].toFixed(2)} ${s[1].toFixed(2)}L${k1[0].toFixed(2)} ${k1[1].toFixed(2)}Q${e[0].toFixed(2)} ${e[1].toFixed(2)} ${k2[0].toFixed(2)} ${k2[1].toFixed(2)}L${w[0].toFixed(2)} ${w[1].toFixed(2)}`;

    return [
      `<path class="iso-tube" d="${curvedPath}" fill="none" stroke="${T.hood[3]}" stroke-width="${(width + 1.0).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      tube(curvedPath, width, T.hood[1], T.hood[4], T.hood[0]),
    ].join("");
  };

  /* Right arm (far side, on mouse):
     Upper arm drops naturally along torso flank with open, relaxed elbow curve.
     Forearm extends smoothly forward to the mouse with comfortable, natural ergonomics. */
  const RIGHT_SHOULDER = [CX - 24, CY - 2, 74];
  const RIGHT_ELBOW = [CX - 34, 55, 71];
  const RIGHT_WRIST = [CX - 45.7, 42.5, 70.2];

  const rw = pt(...RIGHT_WRIST);
  const re = pt(...RIGHT_ELBOW);
  const rs = pt(...RIGHT_SHOULDER);
  const HAND_S = 0.72;
  far.push(hand(re, rw, HAND_S, true, RIGHT_WRIST));
  far.push(arm(rs, re, rw, 13.5));

  /* Torso: sculpted relaxed-fit hoodie with athletic back drape.
     Smooth contours from shoulders to hem, avoiding artificial corset pinches. */
  const bodyLocal = [
    [24, 37], [25, 46], [26.5, 56], [28.5, 66],
    [27.5, 74], [22.5, 78], [13, 81], [5, 82],
    [-5, 82], [-13, 81], [-22.5, 78], [-27.5, 74],
    [-28.5, 66], [-26.5, 56], [-25, 46], [-24, 37],
  ];
  const outline = bodyLocal.map(([v, z]) => pt(CX - v, CY, z));
  const bodyD = roundedPoly(outline, 5);

  const seg2 = (a, b, c) =>
    `M${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${b[0].toFixed(2)} ${b[1].toFixed(2)} ${c[0].toFixed(2)} ${c[1].toFixed(2)}`;

  /* Raglan seams: smooth arch from collar down across shoulder blades to underarms */
  const seam = (s) => seg2(
    pt(CX - s * 13, CY, 80.5), pt(CX - s * 21, CY + 1, 75), pt(CX - s * 28, CY + 1, 66.5),
  );

  /* Hem band: double-stitched ribbed hem across bottom */
  const hemL = pt(CX - 23.5, CY, 41);
  const hemR = pt(CX + 23.5, CY, 41);
  const hemM = pt(CX, CY + 1, 43.5);
  const hemSeam1 = `M${hemL[0].toFixed(2)} ${hemL[1].toFixed(2)}Q${hemM[0].toFixed(2)} ${hemM[1].toFixed(2)} ${hemR[0].toFixed(2)} ${hemR[1].toFixed(2)}`;
  const hemSeam2 = `M${(hemL[0]).toFixed(2)} ${(hemL[1] + 1.4).toFixed(2)}Q${(hemM[0]).toFixed(2)} ${(hemM[1] + 1.4).toFixed(2)} ${(hemR[0]).toFixed(2)} ${(hemR[1] + 1.4).toFixed(2)}`;

  /* Relaxed hoodie drape across the back: horizontal gathers and soft folds */
  const drape1 = seg2(pt(CX - 12, CY + 1, 65), pt(CX, CY + 1.2, 63.5), pt(CX + 12, CY + 1, 65));
  const drape2 = seg2(pt(CX - 16, CY + 1, 56), pt(CX, CY + 1.2, 54.5), pt(CX + 16, CY + 1, 56));
  const drape3 = seg2(pt(CX - 13, CY + 1, 48), pt(CX, CY + 1.2, 47), pt(CX + 13, CY + 1, 48));

  /* Legs & Trousers:
     Thighs run forward from hips under the desk top.
     Shins slant forward cleanly into the sneakers, connecting directly to the ankle collar. */
  const HIP_Y = CY - 4, KNEE_Y = CY - 18, ANKLE_Y = CY - 28;

  for (const s of [-1, 1]) {
    const hx = CX + s * 7.0;
    const kx = hx + s * 3.8, ax = hx + s * 2.8;

    /* Relaxed, natural trouser leg with smooth rounded knee flex */
    const SNEAKER_Z = 4.8;
    const hp = pt(hx, HIP_Y, 40);
    const kp = pt(kx, KNEE_Y, 33);
    const ap = pt(ax, ANKLE_Y, SNEAKER_Z + 7.5);
    const k1 = [kp[0] + (hp[0] - kp[0]) * 0.35, kp[1] + (hp[1] - kp[1]) * 0.35];
    const k2 = [kp[0] + (ap[0] - kp[0]) * 0.35, kp[1] + (ap[1] - kp[1]) * 0.35];
    const fullLeg = `M${hp[0].toFixed(2)} ${hp[1].toFixed(2)}L${k1[0].toFixed(2)} ${k1[1].toFixed(2)}Q${kp[0].toFixed(2)} ${kp[1].toFixed(2)} ${k2[0].toFixed(2)} ${k2[1].toFixed(2)}L${ap[0].toFixed(2)} ${ap[1].toFixed(2)}`;
    const shinLeg = `M${k2[0].toFixed(2)} ${k2[1].toFixed(2)}L${ap[0].toFixed(2)} ${ap[1].toFixed(2)}`;

    far.push(
      `<path class="iso-tube" d="${fullLeg}" fill="none" stroke="${T.hood[3]}" stroke-width="17.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      tube(fullLeg, 16.5, T.trouser[1], T.trouser[2], T.trouser[0]) +
      tube(shinLeg, 14.8, T.trouser[1], T.trouser[2], T.trouser[0])
    );

    /* Soft contact shadow on the footrest platform beneath the sneaker sole */
    far.push(`<path class="iso-halo" d="${k.haloOf({ x: ax - 6.2, y: ANKLE_Y - 14.2, w: 12.4, d: 17.4, r: 5 }, SNEAKER_Z, 0.45, P)}" style="filter:blur(2px)" opacity=".30"/>`);

    /* Trouser cuff: wraps the lower shin right at shoe collar */
    const cuff = k.slabOf({ x: ax - 5.5, y: ANKLE_Y - 4.5, w: 11, d: 9, r: 3 }, SNEAKER_Z + 5.5, 4, P, 8, 1);
    far.push(`<path d="${cuff.fill}" fill="${T.trouser[0]}"/>`);
    far.push(`<path d="${cuff.fill}" fill="${T.trouser[1]}" transform="translate(0 -1.2)"/>`);
    far.push(`<path d="${cuff.outline}" fill="none" stroke="${T.hood[3]}" stroke-width=".55"/>`);

    /* Sneaker: resting firmly on the footrest platform, collar aligned with ankle */
    const sole = k.slabOf({ x: ax - 6, y: ANKLE_Y - 14, w: 12, d: 17, r: 5 }, SNEAKER_Z, 2.2, P, 9, 1);
    const upper = k.slabOf({ x: ax - 5, y: ANKLE_Y - 12.5, w: 10, d: 14.5, r: 4.5 }, SNEAKER_Z + 2.2, 4.8, P, 9, 1.2);
    far.push(`<path d="${sole.fill}" fill="${T.trouser[2]}"/>`);
    far.push(`<path d="${sole.outline}" fill="none" stroke="${T.hood[3]}" stroke-width=".6"/>`);
    far.push(`<path d="${upper.fill}" fill="${T.trouser[1]}"/>`);
    far.push(`<path d="${upper.outline}" fill="none" stroke="${T.hood[3]}" stroke-width=".55"/>`);

    const shoeSeam = (y, x0, x1, w = 0.55, op = 0.85) =>
      `<path d="M${pt(ax - x0, ANKLE_Y - y, SNEAKER_Z + 7).map((v) => v.toFixed(2)).join(" ")}L${pt(ax + x1, ANKLE_Y - y, SNEAKER_Z + 7).map((v) => v.toFixed(2)).join(" ")}" fill="none" stroke="${T.trouser[2]}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`;
    far.push(shoeSeam(9.5, 4.6, 4.6));              // toe cap
    far.push(shoeSeam(6.5, 3.6, 3.6, 0.55, 0.8));   // lace bar 1
    far.push(shoeSeam(4, 3.8, 3.8, 0.55, 0.8));     // lace bar 2
  }

  far.push(
    `<defs><linearGradient id="hoodieGrad" x1="0" y1="0" x2="0.25" y2="1">` +
      `<stop offset="0" stop-color="${T.hood[0]}"/><stop offset=".42" stop-color="${T.hood[1]}"/>` +
      `<stop offset="1" stop-color="${T.hood[2]}"/>` +
    `</linearGradient></defs>`,
    `<path d="${bodyD}" fill="url(#hoodieGrad)"/>`,
    `<path d="${bodyD}" fill="none" stroke="${T.hood[3]}" stroke-width=".55"/>`,
    `<path d="${seam(1)}${seam(-1)}${hemSeam1}${hemSeam2}${drape1}${drape2}${drape3}" fill="none" ` +
      `stroke="${T.hood[3]}" stroke-width=".55" opacity=".5" stroke-linecap="round"/>`,
  );

  /* Neck: realistic proportions, short and natural transition from trapezius to skull */
  const NB = pt(CX, CY - 2, 79);
  const NT = pt(CX, HEAD[1], HEAD_Z - 6);
  const NWB = 8.0;
  const NWT = 7.0;
  const [nbx, nby] = NB;
  const [ntx, nty] = NT;

  far.push(
    `<defs><linearGradient id="neckGrad" x1="0" y1="0" x2="0.25" y2="1">` +
      `<stop offset="0" stop-color="${T.skin[2]}"/>` +
      `<stop offset=".45" stop-color="${T.skin[2]}"/>` +
      `<stop offset=".78" stop-color="${T.skin[0]}"/>` +
      `<stop offset="1" stop-color="${T.skin[0]}"/>` +
      `</linearGradient></defs>`,
    `<path d="M${(ntx - NWT).toFixed(2)} ${nty.toFixed(2)}` +
      `L${(nbx - NWB).toFixed(2)} ${nby.toFixed(2)}` +
      `Q${nbx.toFixed(2)} ${(nby + 3).toFixed(2)} ${(nbx + NWB).toFixed(2)} ${nby.toFixed(2)}` +
      `L${(ntx + NWT).toFixed(2)} ${nty.toFixed(2)}Z" fill="url(#neckGrad)" stroke="${T.skin[2]}" stroke-width=".5"/>`,
  );

  /* Bunched hood: rests comfortably around the nape and shoulders */
  const cowlD = roundedPoly(
    [
      [-17, 74], [-15, 79], [-9, 82.5], [0, 83.5], [9, 82.5], [15, 79], [17, 74],
      [11, 71.5], [0, 71], [-11, 71.5],
    ].map(([v, z]) => pt(CX - v, CY + 1, z)),
    5,
  );
  const cowlRim = seg2(
    pt(CX - 14, CY + 1, 78.5), pt(CX, CY + 1, 83.8), pt(CX + 14, CY + 1, 78.5),
  );
  const cowlCrease1 = seg2(
    pt(CX - 8, CY + 1, 80), pt(CX, CY + 1, 75.5), pt(CX + 8, CY + 1, 80),
  );
  const cowlCrease2 = seg2(
    pt(CX, CY + 1, 82), pt(CX - 1, CY + 1, 76), pt(CX, CY + 1, 71.5),
  );
  far.push(
    `<path d="${cowlD}" fill="${T.hood[3]}" opacity=".35" transform="translate(0 2.2)"/>`,
    `<path d="${cowlD}" fill="${T.hood[2]}" stroke="${T.hood[3]}" stroke-width=".5"/>`,
    `<path d="${cowlRim}" fill="none" stroke="${T.hood[1]}" stroke-width="2.2" opacity=".9" stroke-linecap="round"/>`,
    `<path d="${cowlCrease1}" fill="none" stroke="${T.hood[3]}" stroke-width=".5" opacity=".45" stroke-linecap="round"/>`,
    `<path d="${cowlCrease2}" fill="none" stroke="${T.hood[3]}" stroke-width=".5" opacity=".5" stroke-linecap="round"/>`,
  );

  /* Head and headphones */
  const [nx, ny] = pt(CX, CY, 82);
  const headParts = [];
  const cupOff = HEAD_R + 1.2;
  headParts.push(`<path d="${poly(circleX(hx - cupOff, hy, headZ, 7.2, 30))}" class="iso-cup"/>`);
  headParts.push(`<path d="${poly(circleX(hx - cupOff, hy, headZ, 3.8, 22))}" class="iso-cup-in"/>`);
  headParts.push(sphere(hx, hy, headZ, HEAD_R, { fill: T.hair[0], lit: T.hair[1], shade: T.hair[2] }));
  headParts.push(`<path d="${poly(circleX(hx + cupOff, hy, headZ, 7.2, 30))}" class="iso-cup"/>`);
  headParts.push(`<path d="${poly(circleX(hx + cupOff, hy, headZ, 3.8, 22))}" class="iso-cup-in"/>`);
  const band = poly(circleY(hy, hx, headZ, cupOff, 30, 0, Math.PI), false);
  headParts.push(`<path class="iso-band" d="${band}"/>`);
  headParts.push(`<path class="iso-band-hi" d="${band}"/>`);

  const px0 = nx.toFixed(2);
  const py0 = ny.toFixed(2);
  far.push(
    `<g><animateTransform attributeName="transform" type="rotate" ` +
      `values="0 ${px0} ${py0};1.5 ${px0} ${py0};-1.1 ${px0} ${py0};0.6 ${px0} ${py0};0 ${px0} ${py0}" ` +
      `keyTimes="0;.27;.55;.8;1" dur="9.4s" calcMode="spline" ` +
      `keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" repeatCount="indefinite"/>` +
      `<g><animateTransform attributeName="transform" type="translate" ` +
      `values="0 0;0.5 -1.0;-0.35 -0.6;0.2 -0.8;0 0" ` +
      `keyTimes="0;.27;.55;.8;1" dur="6.7s" begin="1.9s" calcMode="spline" ` +
      `keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" repeatCount="indefinite"/>` +
      headParts.join("") +
      `</g></g>`,
  );

  /* Left arm (near side, typing on keyboard):
     Relaxed upper arm dropping naturally, forearm reaching smoothly to keys with open, ergonomic elbow bend. */
  const LEFT_SHOULDER = [CX + 24, CY - 1, 74];
  const LEFT_ELBOW = [CX + 24, 52, 70];
  const LEFT_WRIST = [CX + 14, 37, 69];

  const lw = pt(...LEFT_WRIST);
  const le = pt(...LEFT_ELBOW);
  const ls = pt(...LEFT_SHOULDER);
  near.push(hand(le, lw, HAND_S, false, LEFT_WRIST));
  near.push(arm(ls, le, lw, 14.0));

  return far.join("") + near.join("");
}

/* ------------------------------------------------------------------ *
 * Assemble — explicit painter's order (far → near)
 * ------------------------------------------------------------------ */
const label =
  "An isometric engineer's desk. A monitor on a post and arm shows an editor with one terracotta line lit and code typing itself in; an articulated desk lamp throws a warm pool of light across a low-profile keyboard and mouse. A pad of paper with a pen, a cup of pencils, a mug with steam, a stack of books in front of a small potted plant fill the surface; a three-drawer cabinet and a cable trough along the back edge carry the clutter. A person in a hooded top wears over-ear headphones and works at the keyboard, seen from behind on a five-star office chair.";

/* Mirrored about the vertical axis so the figure sits on the right and the
   monitor system on the left. Reflecting the FINISHED scene rather than
   re-deriving every world constant is deliberate: the rig carries its own
   internal directions — which way the figure faces, how the two arms mirror
   each other onto the keyboard, where the lamp arm reaches — and those have to
   stay consistent with each other. A 180-degree rotation would be the other
   way round the table, but it would swing the figure to face the camera and
   expose a back-view rig from the front. */
const buildBody = () => [
  `<g transform="translate(${W} 0) scale(-1 1)">`,
  floor(),
  desk(),
  cpu(),
  footrest(),
  floorItems(),
  plant(),
  books(),
  notepad(),
  pencilCup(),
  monitor(),
  keyboard(),
  mouse(),
  mug(),
  lamp(),
  chairBase(),
  person(),
  chairBack(),
  `</g>`,
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
