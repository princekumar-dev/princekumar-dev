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
 * run in its warm-dark variant so the analytics cards still harmonise.
 * One chromatic accent: coral #cc785c. Amber is illustration-only.
 * ------------------------------------------------------------------ */
const C = {
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
};

const DISPLAY =
  "Newsreader, 'Source Serif 4', 'Iowan Old Style', Palatino, 'Palatino Linotype', Georgia, serif";
const BODY = "Inter, ui-sans-serif, system-ui, sans-serif";

/* The isometric accent uses the anatomy kit's token names, re-tinted warm. */
const ISO = `${k.ISO_CSS}
.iso{
  --anatomy-page:#181715;--anatomy-card:#1F1D1A;--anatomy-paper:#23211D;
  --anatomy-face:#2E2A25;--anatomy-top:#3A352D;
  --anatomy-shade-0:#141312;--anatomy-shade-1:#191715;--anatomy-shade-2:#1E1C19;--anatomy-shade-3:#242220;
  --anatomy-lit-top:#E5A183;--anatomy-lit-shade:#8E5240;
  --anatomy-hi:#F4F1EA;--anatomy-mid:#B9B2A6;--anatomy-lo:#5E574D;--anatomy-faint:#332F2A;
  --anatomy-lit:#CC785C;--anatomy-dot:#E8E3D9;--anatomy-halo:#000000;--anatomy-halo-opacity:.85;
  --anatomy-red:#CC785C;--anatomy-green:#5DB872;--anatomy-amber:#E8A55A;
}
.iso-scene path,.iso-scene circle{vector-effect:non-scaling-stroke}
.iso-tube,.iso-band,.iso-band-hi{vector-effect:none}
`;

/* ------------------------------------------------------------------ *
 * Isometric accent — a small bar-chart artifact for an AI & DS student.
 * ------------------------------------------------------------------ */
const SW = 372;
const SH = 336;

const PLATE = { x: -54, y: -36, w: 108, d: 72, r: 9 };
const BARS = [
  { plan: { x: -42, y: -11, w: 22, d: 22, r: 3 }, h: 15 },
  { plan: { x: -12, y: -11, w: 22, d: 22, r: 3 }, h: 33 },
  { plan: { x: 18, y: -11, w: 22, d: 22, r: 3 }, h: 57, lit: true },
];

const fits = [
  ...k.boxCorners(PLATE, -12, 9),
  ...BARS.flatMap((b) => k.boxCorners(b.plan, 0, b.h)),
];
const P = k.fitProjection(fits, SW, SH, { pad: 30 });

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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="ttl dsc">
  <title id="ttl">Prince R — B.Tech in Artificial Intelligence &amp; Data Science</title>
  <desc id="dsc">Warm, minimal banner on a deep clay-black field with a single terracotta accent, an editorial serif name, and a small isometric bar-chart artifact</desc>

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
      <stop offset="0"   stop-color="#151412"/>
      <stop offset=".5"  stop-color="#1C1A17"/>
      <stop offset="1"   stop-color="#141311"/>
    </linearGradient>

    <!-- the one chromatic accent: a single slow ember, not an atmosphere -->
    <radialGradient id="ember" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(948 208) scale(330 300)">
      <stop offset="0"   stop-color="${C.lit}" stop-opacity=".26"/>
      <stop offset=".46" stop-color="${C.lit}" stop-opacity=".07"/>
      <stop offset="1"   stop-color="${C.lit}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="emberWarm" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(300 380) scale(420 210)">
      <stop offset="0"   stop-color="#E8A55A" stop-opacity=".07"/>
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
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".055"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity=".015"/>
    </linearGradient>

    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset=".5"  stop-color="#FFFFFF" stop-opacity=".30"/>
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
      <rect x="${M}" y="84" width="${eyebrowW.toFixed(0)}" height="32" rx="16" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity=".09"/>
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
      ${chipBoxes.map((b) => `<rect x="${b.x}" y="284" width="${b.w}" height="${chipH}" rx="16" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity=".09"/>`).join("\n      ")}
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

    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".028"/>
  </g>

  <rect x="0.6" y="0.6" width="${W - 1.2}" height="${H - 1.2}" rx="23.4" fill="none" stroke="#FFFFFF" stroke-opacity=".085"/>
</svg>
`;

writeFileSync(join(HERE, "..", "assets", "header.svg"), assertClean(svg, "header.svg"));
console.log("header.svg bytes:", svg.length, "| iso solids:", (svg.match(/iso-solid/g) || []).length);
