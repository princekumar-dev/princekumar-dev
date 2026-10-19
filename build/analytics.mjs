/* GitHub analytics card — the four dark external images the README used to
 * hang off github-profile-summary-cards and streak-stats, drawn into one light
 * card that matches the tech stack and the project cards.
 *
 * Why build this one at all: those services render `theme=github_dark`, which
 * on a light-default README is a black rectangle in the middle of a cream page.
 * They are also three separate origins, each of which can be down or rate
 * limited on the day someone opens the profile. Numbers baked at build time
 * never fail to load.
 *
 * Layout: three stat panels on one baseline, then a wide band split between a
 * twelve-month chart and a language list. The chart bars take the coral at a
 * strength proportional to their value, so the shape of the year — a quiet
 * spring, a very loud August — is readable before any number is.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FONT_CSS } from "./font-data-cards.mjs";
import { ANALYTICS, VIEWS_FALLBACK } from "./copy.mjs";
import { assertClean, esc } from "./svg-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(HERE, "..", "assets"), { recursive: true });

/* ---- card geometry (drawn at display size) ---- */
const W = 640;
const H = 300;
const CX = 6;
const CY = 4;
const CW = 628;
const CH = 292;
const L = CX + 16; // 22
const R = CX + CW - 16; // 618

const INK = "#1B1A17";
const MUTED = "#8A8377";
const CARD = "#FAF8F3";
const EDGE = "#E8E2D6";
const RULE = "#EDE7DB";
const FAINT = "#B9B2A6";
/* the README's own coral. it marks, it does not fill. */
const ACCENT = "#CC785C";
const ACCENT_TEXT = "#A9583E";

const DISPLAY = "Newsreader,'Source Serif 4',Palatino,Georgia,serif";
const BODY = "Inter,ui-sans-serif,system-ui,sans-serif";

/* the two bands. panels inside a band share a baseline and a height; the
   bands themselves do not, which is why the fill is object-space rather than
   user-space — one gradient, any panel height. */
const BAND1_Y = 86;
const BAND1_H = 84;
const BAND2_Y = 186;
const BAND2_H = 98;
const GAP = 20;

const LABEL_DY = 22; // label baseline below a panel's top edge

/* ---- mark: a rising bar chart, the one shape the other cards do not use ---- */
const MARK =
  '<path d="M3.8 20.2h16.4"/><path d="M7 20.2v-5.4"/><path d="M12 20.2v-10"/><path d="M17 20.2v-14.4"/>';

function panel(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="url(#panel)" stroke="${EDGE}"/>`;
}

/* the pip + label pair every panel opens with */
function panelHead(x, y, label) {
  return (
    `<circle cx="${x + 16 + 2.5}" cy="${y + LABEL_DY - 3}" r="2.5" fill="${ACCENT}"/>` +
    `<text class="k" x="${x + 16 + 11}" y="${y + LABEL_DY}" font-size="9" letter-spacing="1.1" fill="${MUTED}">${esc(label)}</text>`
  );
}

function card(stats) {
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
    `<text class="n" x="${L + 44}" y="37" font-size="16.5" fill="${INK}">${esc(ANALYTICS.title)}</text>`,
    `<text class="k" x="${L + 44}" y="52" font-size="9.5" letter-spacing="1.05" fill="${ACCENT_TEXT}">${esc(ANALYTICS.kicker)}</text>`,
  );

  /* the numbers are frozen at build time, so the card says when it was read —
     a stat with no date is a stat you cannot check */
  parts.push(
    `<text class="k" x="${R}" y="63" text-anchor="end" font-size="8.5" letter-spacing="0.9" fill="${FAINT}">AS OF ${esc(ANALYTICS.asOf)}</text>`,
  );

  const countW = Math.round(ANALYTICS.count.length * 7.2 + 22);
  parts.push(
    `<rect x="${R - countW}" y="24" width="${countW}" height="20" rx="10" fill="${ACCENT}" fill-opacity=".10"/>`,
    `<text class="k" x="${R - countW / 2}" y="37.5" text-anchor="middle" font-size="10" letter-spacing="1" fill="${ACCENT_TEXT}">${esc(ANALYTICS.count)}</text>`,
  );

  parts.push(`<path d="M${L} 70.5H${R}" stroke="${RULE}"/>`);

  /* ---- band 1: one panel per headline figure, evenly divided ---- */
  const usable = R - L - GAP * (stats.length - 1);
  const base = Math.floor(usable / stats.length);
  let x = L;
  stats.forEach((s, i) => {
    /* the remainder goes to the last panel so the band lands exactly on R */
    const pw = base + (i === stats.length - 1 ? usable - base * stats.length : 0);
    parts.push(panel(x, BAND1_Y, pw, BAND1_H), panelHead(x, BAND1_Y, s.label));
    parts.push(
      `<text class="n" x="${x + 16}" y="${BAND1_Y + 62}" font-size="34" letter-spacing="-0.8" fill="${INK}">${esc(s.value)}</text>`,
      `<text class="k" x="${x + 16}" y="${BAND1_Y + 78}" font-size="9" letter-spacing="0.4" fill="${MUTED}">${esc(s.sub)}</text>`,
    );
    x += pw + GAP;
  });

  /* ---- band 2: the year, then the languages ---- */
  const CHART_W = 360;
  const LANG_W = R - L - CHART_W - GAP; // 216

  const chartX = L;
  parts.push(panel(chartX, BAND2_Y, CHART_W, BAND2_H), panelHead(chartX, BAND2_Y, "LAST 12 MONTHS"));

  const months = ANALYTICS.months;
  const peak = Math.max(...months.map((m) => m.value));
  const inner = CHART_W - 32;
  const step = inner / months.length;
  const barW = Math.min(16, step - 8);
  const baseY = BAND2_Y + BAND2_H - 16; // 268
  const topY = BAND2_Y + 38; // 224
  const maxH = baseY - topY;

  months.forEach((m, i) => {
    const h = m.value === 0 ? 2 : Math.max(3, (m.value / peak) * maxH);
    const bx = chartX + 16 + i * step + (step - barW) / 2;
    /* strength tracks value: a quiet month recedes, a loud one carries the
       card. zero still draws a stub so the baseline reads as an axis. */
    const op = m.value === 0 ? 0.16 : (0.3 + 0.62 * (m.value / peak)).toFixed(3);
    parts.push(
      `<rect x="${bx.toFixed(2)}" y="${(baseY - h).toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" rx="3" fill="${ACCENT}" fill-opacity="${op}"/>`,
      `<text class="k" x="${(bx + barW / 2).toFixed(2)}" y="${baseY + 12}" text-anchor="middle" font-size="7.5" letter-spacing="0.5" fill="${FAINT}">${esc(m.label)}</text>`,
    );
    if (m.value === peak) {
      parts.push(
        `<text class="k" x="${(bx + barW / 2).toFixed(2)}" y="${baseY - h - 5}" text-anchor="middle" font-size="8.5" font-weight="600" fill="${ACCENT_TEXT}">${m.value}</text>`,
      );
    }
  });

  const langX = L + CHART_W + GAP; // 402
  parts.push(panel(langX, BAND2_Y, LANG_W, BAND2_H), panelHead(langX, BAND2_Y, "TOP LANGUAGES"));

  const langPeak = Math.max(...ANALYTICS.languages.map((l) => l.value));
  const nameX = langX + 16;
  const trackX = langX + 96;
  const trackW = 72;
  const countX = langX + LANG_W - 16;
  const rowY = BAND2_Y + 40;
  const rowStep = 13;

  ANALYTICS.languages.forEach((l, i) => {
    const y = rowY + i * rowStep;
    const w = (l.value / langPeak) * trackW;
    parts.push(
      `<text class="k" x="${nameX}" y="${y}" font-size="9" fill="${INK}">${esc(l.name)}</text>`,
      `<rect x="${trackX}" y="${y - 4.5}" width="${trackW}" height="5" rx="2.5" fill="${RULE}"/>`,
      `<rect x="${trackX}" y="${y - 4.5}" width="${w.toFixed(2)}" height="5" rx="2.5" fill="${ACCENT}" fill-opacity=".8"/>`,
      `<text class="k" x="${countX}" y="${y}" text-anchor="end" font-size="9" font-weight="600" fill="${MUTED}">${l.value}</text>`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tan dan">
  <title id="tan">${esc(ANALYTICS.title)} — ${esc(ANALYTICS.kicker.toLowerCase())}</title>
  <desc id="dan">${esc(ANALYTICS.alt)}</desc>
  <style>${FONT_CSS}
  .n{font-family:${DISPLAY};font-weight:500;letter-spacing:-.2px;font-kerning:normal}
  .k{font-family:${BODY};font-weight:600}
  </style>
  <defs>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="165%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#5A5044" flood-opacity=".17"/>
    </filter>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FCFAF5"/>
      <stop offset="1" stop-color="#F4EFE5"/>
    </linearGradient>
  </defs>
  ${parts.join("\n  ")}
</svg>
`;
}

/* Profile views: read live, because a baked counter stops being a counter.
   komarev answers a direct fetch but is unreliable through GitHub's camo
   proxy, so the badge is gone from the README and the number lives here. */
async function viewCount() {
  try {
    const res = await fetch(
      "https://komarev.com/ghpvc/?username=princekumar-dev",
      { headers: { "User-Agent": "readme-build" } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const n = [...text.matchAll(/>([\d][\d,]*)</g)].map((m) => m[1]);
    if (!n.length) throw new Error("no count in response");
    console.log(`  profile views: ${n[0]} (live)`);
    return n[0];
  } catch (e) {
    console.log(`  profile views: ${VIEWS_FALLBACK} (komarev unreachable — ${e.message})`);
    return VIEWS_FALLBACK;
  }
}

const views = await viewCount();
const stats = [
  ...ANALYTICS.stats,
  { label: "PROFILE VIEWS", value: views, sub: "counted by komarev" },
];

const svg = assertClean(card(stats), "analytics.svg");
writeFileSync(join(HERE, "..", "assets", "analytics.svg"), svg);
console.log(`analytics.svg: ${Math.round(svg.length / 1024)} KB`);

/* ---- splice the section into README.md ---- */
const BEGIN = "<!-- analytics:begin -->";
const END = "<!-- analytics:end -->";
const section =
  `${BEGIN}\n` +
  `<div align="center">\n\n` +
  `  <img src="./assets/analytics.svg" width="${W}" alt="${esc(ANALYTICS.alt)}" />\n\n` +
  `</div>\n` +
  `${END}`;

const README = join(HERE, "..", "README.md");
let md = readFileSync(README, "utf8");
if (!md.includes(BEGIN) || !md.includes(END)) {
  throw new Error("analytics markers missing from README.md");
}
const a = md.indexOf(BEGIN);
const b = md.indexOf(END) + END.length;
writeFileSync(README, md.slice(0, a) + section + md.slice(b));
console.log("README analytics section spliced");
