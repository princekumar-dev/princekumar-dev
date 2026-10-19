/* Tech stack card — the twelve brand marks the README used to hang off a
 * CDN, drawn into one card so the section matches the project cards and
 * keeps working when jsdelivr is slow.
 *
 * The marks come straight from devicon at build time. Each one is unwrapped
 * into a <g> rather than nested as its own <svg>, for two reasons: ids are
 * document-global, so nextjs and nodejs — which both call theirs "a" — need
 * namespacing either way; and a nested <svg> clips to its viewport, which
 * makes it impossible to optically normalise a mark that runs past its own
 * viewBox. Unwrapping keeps every gradient and fill as its author drew it.
 *
 * Colour: this card is full of brand colour already, so the accent only
 * marks the chip, the kicker and the count — the logos carry the rest.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FONT_CSS } from "./font-data-cards.mjs";
import { STACK } from "./copy.mjs";
import { assertClean, esc } from "./svg-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(HERE, "..", "assets"), { recursive: true });

/* ---- card geometry (drawn at display size) ---- */
const W = 640;
const H = 186;
const CX = 6;
const CY = 4;
const CW = 628;
const CH = 174;
const L = CX + 16; // 22
const R = CX + CW - 16; // 618

const INK = "#1B1A17";
const MUTED = "#8A8377";
const CARD = "#FAF8F3";
const EDGE = "#E8E2D6";
const RULE = "#EDE7DB";
/* the README's own coral. it marks, it does not fill. */
const ACCENT = "#CC785C";
const ACCENT_TEXT = "#A9583E";

const DISPLAY = "Newsreader,'Source Serif 4',Palatino,Georgia,serif";
const BODY = "Inter,ui-sans-serif,system-ui,sans-serif";

/* Each group sits in its own recessed panel. The panels share one baseline,
   one height and one gutter, so the three read as a single band rather than
   three unrelated rows — that is what makes the strip feel assembled. */
const SIZE = 30;
const GUTTER = 11;
const PANEL_PAD = 16;
const PANEL_GAP = 20;
const PANEL_Y = 86;
const PANEL_H = 76;
const LABEL_Y = PANEL_Y + 22;
const COL_Y = PANEL_Y + 34;

/* Devicon draws every mark into the same 128 grid, but not every mark fills
   it: the TS and JS squares run edge to edge while React and Tailwind sit
   inside a wide margin. Left alone the row reads as three different icon
   sizes. These multipliers equalise optical weight, measured against the
   96px contact sheet — squares come down, padded marks go up. */
const FIT = {
  typescript: 0.94,
  javascript: 0.94,
  python: 1.12,
  java: 1.08,
  react: 1.24,
  nextjs: 0.94,
  tailwindcss: 1.22,
  html5: 1.02,
  css3: 1.02,
  nodejs: 1.0,
  flask: 1.18,
  mongodb: 1.02,
};

/* ---- marks ---- */
/* a three-tier stack: the one shape the project cards do not already use */
const MARK =
  '<path d="M12 3.1 3.2 7.4 12 11.7l8.8-4.3L12 3.1Z"/><path d="M3.2 12.1 12 16.4l8.8-4.3"/><path d="M3.2 16.6 12 20.9l8.8-4.3"/>';

const SOURCES = (slug) =>
  slug === "flask"
    ? [
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flask/flask-original.svg",
        "https://cdn.simpleicons.org/flask/9A948A",
      ]
    : [`https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}/${slug}-original.svg`];

/* The marks are vendored into build/icons/ so a rebuild never depends on a
   CDN being up — and jsdelivr does rate-limit a burst of twelve requests.
   A missing file is fetched once and written back. */
const ICONS = join(HERE, "icons");

async function grab(slug) {
  const cached = join(ICONS, `${slug}.svg`);
  try {
    const text = readFileSync(cached, "utf8").trim();
    if (/^<svg[\s>]/.test(text)) return text;
  } catch {
    /* not cached yet — fall through and fetch */
  }

  for (const url of SOURCES(slug)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "readme-build" } });
      if (!res.ok) continue;
      const text = await res.text();
      if (!/^<svg[\s>]/.test(text.trim())) continue;
      mkdirSync(ICONS, { recursive: true });
      writeFileSync(cached, text.trim() + "\n");
      console.log(`  cached ${slug}.svg from ${url.split("/").slice(-3).join("/")}`);
      return text.trim();
    } catch {
      /* fall through to the next source */
    }
  }
  throw new Error(`could not fetch an icon for "${slug}"`);
}

/* Unwrap one mark into a group at the origin, scoped and optically scaled.
   Placement happens in the column pass by wrapping this in a translate —
   that keeps the width arithmetic in one place. */
function group(src, slug) {
  const inner = src
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/\sid="([^"]+)"/g, (_, id) => ` id="${slug}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${slug}-${id})`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${slug}-${id}"`);

  const box = /\sviewBox="([^"]*)"/.exec(src)?.[1];
  const [vx = 0, vy = 0, vw = 128, vh = 128] = box
    ? box.trim().split(/[\s,]+/).map(Number)
    : [];

  /* scale about the slot's centre so the mark grows evenly in every direction */
  const k = ((SIZE / Math.max(vw, vh)) * (FIT[slug] ?? 1)).toFixed(4);
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-vw / 2 - vx} ${-vh / 2 - vy})">` +
    inner +
    `</g>`
  );
}

function card(marks) {
  const parts = [];

  parts.push(
    `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="15" fill="${CARD}" filter="url(#sh)"/>`,
    `<rect x="${CX + 0.5}" y="${CY + 0.5}" width="${CW - 1}" height="${CH - 1}" rx="14.5" fill="none" stroke="${EDGE}"/>`,
  );

  /* mark on its own tinted chip */
  parts.push(
    `<rect x="${L}" y="20" width="34" height="34" rx="10" fill="${ACCENT}" fill-opacity=".10"/>`,
    `<g transform="translate(${L + 7} 27) scale(.8333)" fill="none" stroke="${ACCENT}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${MARK}</g>`,
  );

  parts.push(
    `<text class="n" x="${L + 44}" y="37" font-size="16.5" fill="${INK}">${esc(STACK.title)}</text>`,
    `<text class="k" x="${L + 44}" y="52" font-size="9.5" letter-spacing="1.05" fill="${ACCENT_TEXT}">${esc(STACK.kicker)}</text>`,
  );

  /* the count becomes a pill so the accent bookends the card: chip on the
     left, pill on the right, nothing loud in between */
  const countW = Math.round(STACK.count.length * 7.2 + 22);
  parts.push(
    `<rect x="${R - countW}" y="24" width="${countW}" height="20" rx="10" fill="${ACCENT}" fill-opacity=".10"/>`,
    `<text class="k" x="${R - countW / 2}" y="37.5" text-anchor="middle" font-size="10" letter-spacing="1" fill="${ACCENT_TEXT}">${esc(STACK.count)}</text>`,
  );

  parts.push(`<path d="M${L} 70.5H${R}" stroke="${RULE}"/>`);

  /* one panel per group, all sharing a baseline and a height */
  let x = L;
  for (const g of STACK.groups) {
    const inner = g.items.length * SIZE + (g.items.length - 1) * GUTTER;
    const pw = inner + PANEL_PAD * 2;

    parts.push(
      `<rect x="${x}" y="${PANEL_Y}" width="${pw}" height="${PANEL_H}" rx="11" fill="url(#panel)" stroke="${EDGE}"/>`,
      /* a coral pip ties each group back to the chip and the pill */
      `<circle cx="${x + PANEL_PAD + 2.5}" cy="${LABEL_Y - 3}" r="2.5" fill="${ACCENT}"/>`,
      `<text class="k" x="${x + PANEL_PAD + 11}" y="${LABEL_Y}" font-size="9" letter-spacing="1.1" fill="${MUTED}">${esc(g.label)}</text>`,
    );

    g.items.forEach((item, j) => {
      parts.push(
        `<g transform="translate(${x + PANEL_PAD + j * (SIZE + GUTTER)} ${COL_Y})">${marks.get(item.slug)}</g>`,
      );
    });
    x += pw + PANEL_GAP;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tst dst">
  <title id="tst">${esc(STACK.title)} — ${esc(STACK.kicker.toLowerCase())}</title>
  <desc id="dst">${esc(
    STACK.groups.map((g) => `${g.label}: ${g.items.map((i) => i.name).join(", ")}`).join(". "),
  )}</desc>
  <style>${FONT_CSS}
  .n{font-family:${DISPLAY};font-weight:500;letter-spacing:-.2px;font-kerning:normal}
  .k{font-family:${BODY};font-weight:600}
  </style>
  <defs>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="165%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#5A5044" flood-opacity=".17"/>
    </filter>
    <linearGradient id="panel" x1="0" y1="${PANEL_Y}" x2="0" y2="${PANEL_Y + PANEL_H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FCFAF5"/>
      <stop offset="1" stop-color="#F4EFE5"/>
    </linearGradient>
  </defs>
  ${parts.join("\n  ")}
</svg>
`;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */
const wanted = [...new Set(STACK.groups.flatMap((g) => g.items.map((i) => i.slug)))];
const marks = new Map();
await Promise.all(
  wanted.map(async (slug) => {
    marks.set(slug, group(await grab(slug), slug));
  }),
);

const svg = assertClean(card(marks), "stack.svg");
writeFileSync(join(HERE, "..", "assets", "stack.svg"), svg);
console.log(`stack.svg: ${Math.round(svg.length / 1024)} KB, ${wanted.length} marks`);

/* ---- splice the section into README.md ---- */
const BEGIN = "<!-- stack:begin -->";
const END = "<!-- stack:end -->";
const section =
  `${BEGIN}\n` +
  `<div align="center">\n\n` +
  `  <img src="./assets/stack.svg" width="${W}" alt="${esc(
    STACK.groups.map((g) => g.items.map((i) => i.name).join(", ")).join(". "),
  )}" />\n\n` +
  `</div>\n` +
  `${END}`;

const README = join(HERE, "..", "README.md");
let md = readFileSync(README, "utf8");
if (md.includes(BEGIN) && md.includes(END)) {
  const a = md.indexOf(BEGIN);
  const b = md.indexOf(END) + END.length;
  md = md.slice(0, a) + section + md.slice(b);
} else {
  const start = md.indexOf("<!-- centred rows, not a table");
  const end = md.indexOf("</div>", md.indexOf('<div align="center">', start)) + "</div>".length;
  if (start === -1 || end < start) throw new Error("could not locate the tech stack block");
  md = md.slice(0, start) + section + md.slice(end);
}
writeFileSync(README, md);
console.log("README tech stack section spliced");
