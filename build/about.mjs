/* About block — the two-column markdown table this replaces had a structural
 * flaw: the illustration column ran ~190px taller than the prose column, so
 * the cell ended in a hole that no amount of padding could close.
 *
 * The fix is not padding, it is authorship. GitHub strips <style> and inline
 * styles from README HTML, so prose can only ever render in the system stack —
 * the one way to set this section in a real face is to draw it. That also
 * solves the icon problem: with the type doing the work, the emoji bullets the
 * section leaned on are no longer load-bearing and can go.
 *
 * Layout is a wide lead, a body paragraph, then two columns on a shared
 * baseline. The columns are allowed different heights — that is what columns
 * are for — but the card closes on whichever runs longer, so it never ends in
 * a gap again.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FONT_CSS } from "./font-data-cards.mjs";
import { ABOUT } from "./copy.mjs";
import { assertClean, esc } from "./svg-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(HERE, "..", "assets"), { recursive: true });

/* ---- card geometry (drawn at display size) ---- */
const W = 864;
const CX = 6;
const CY = 4;
const CW = 852;
const L = CX + 28; // 34
const R = CX + CW - 28; // 830
const USABLE = R - L; // 796
const GUTTER = 36;
const COL = (USABLE - GUTTER) / 2; // 380

const INK = "#1B1A17";
const TEXT = "#5F5A51";
const MUTED = "#8A8377";
const CARD = "#FAF8F3";
const EDGE = "#E8E2D6";
const RULE = "#EDE7DB";
const ACCENT = "#CC785C";

const DISPLAY = "Newsreader,'Source Serif 4',Palatino,Georgia,serif";
const BODY = "Inter,ui-sans-serif,system-ui,sans-serif";

const LEAD_SIZE = 21;
const LEAD_LH = 30;
const BODY_SIZE = 15.5;
const BODY_LH = 24;
const ITEM_SIZE = 14.5;
const ITEM_LH = 21;
const ITEM_GAP = 11;

/* Advance-width estimates per face. These are why lines are authored rather
   than measured: SVG will not wrap text, and a browser cannot be consulted at
   build time. The figures are deliberately generous — a line that breaks a
   word early costs a little air, one that overruns the card costs the design. */
const ADV = { display: 0.5, body: 0.52, strong: 0.555 };

/** "**bold** runs" -> [{t, bold}] */
function runs(s) {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((r) =>
      r.startsWith("**") && r.endsWith("**")
        ? { t: r.slice(2, -2), bold: true }
        : { t: r, bold: false },
    );
}

/** greedy wrap of runs to a max width, keeping bold runs whole */
function wrap(runsIn, size, kind, max) {
  const unit = (b) => size * (kind === "display" ? ADV.display : b ? ADV.strong : ADV.body);
  const space = size * ADV.body;
  const lines = [];
  let cur = [];
  let curW = 0;
  for (const r of runsIn) {
    for (const word of r.t.split(/\s+/)) {
      if (!word) continue;
      const ww = word.length * unit(r.bold);
      if (cur.length && curW + space + ww > max) {
        lines.push(cur);
        cur = [];
        curW = 0;
      }
      if (cur.length) curW += space;
      cur.push({ t: word, bold: r.bold });
      curW += ww;
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

/* One line of text. Runs carry no x, so SVG flows them on from each other —
   which is what lets a bold phrase sit mid-sentence without measuring it. */
function line(x, y, words, size, fill, cls = "b") {
  const spans = words
    .map((w, i) => `<tspan${w.bold ? ` font-weight="600" fill="${INK}"` : ""}>${i ? " " : ""}${esc(w.t)}</tspan>`)
    .join("");
  return `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" fill="${fill}" xml:space="preserve">${spans}</text>`;
}

function eyebrow(x, y, label) {
  return (
    `<circle cx="${x + 2.5}" cy="${y - 3}" r="2.5" fill="${ACCENT}"/>` +
    `<text class="b" x="${x + 12}" y="${y}" font-size="9.5" font-weight="600" letter-spacing="1.15" fill="${MUTED}">${esc(label)}</text>`
  );
}

function column(x, y, group) {
  const out = [eyebrow(x, y, group.label)];
  let cy = y + 26;
  for (const item of group.items) {
    /* a pip, not an icon: the same mark that opens every panel elsewhere, small
       enough to be punctuation */
    out.push(`<circle cx="${x + 3}" cy="${cy - 4}" r="1.9" fill="${ACCENT}" fill-opacity=".9"/>`);
    const lines = wrap(runs(item), ITEM_SIZE, "body", COL - 16);
    lines.forEach((ln, i) => out.push(line(x + 16, cy + i * ITEM_LH, ln, ITEM_SIZE, TEXT)));
    cy += lines.length * ITEM_LH + ITEM_GAP;
  }
  return { out, bottom: cy - ITEM_GAP };
}

function card() {
  const parts = [];

  let y = 40;
  const leadLines = wrap(runs(ABOUT.lead), LEAD_SIZE, "display", USABLE);
  leadLines.forEach((ln, i) => parts.push(line(L, y + i * LEAD_LH, ln, LEAD_SIZE, INK, "l")));
  y += leadLines.length * LEAD_LH + 12;

  const bodyLines = wrap(runs(ABOUT.body), BODY_SIZE, "body", USABLE);
  bodyLines.forEach((ln, i) => parts.push(line(L, y + i * BODY_LH, ln, BODY_SIZE, TEXT)));
  y += bodyLines.length * BODY_LH + 26;

  parts.push(`<path d="M${L} ${y}H${R}" stroke="${RULE}"/>`);
  y += 30;

  const [a, b] = ABOUT.groups;
  const left = column(L, y, a);
  const right = column(L + COL + GUTTER, y, b);
  parts.push(...left.out, ...right.out);

  const H = Math.max(left.bottom, right.bottom) + 26;
  const CH = H - CY;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tab dab">
  <title id="tab">About Prince R</title>
  <desc id="dab">${esc(
    `${ABOUT.lead} ${ABOUT.body} ` +
      ABOUT.groups.map((g) => `${g.label}: ${g.items.join(". ")}`).join(" "),
  )}</desc>
  <style>${FONT_CSS}
  .l{font-family:${DISPLAY};font-weight:500;letter-spacing:-.3px;font-kerning:normal}
  .b{font-family:${BODY};font-kerning:normal;text-rendering:optimizeLegibility}
  </style>
  <defs>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="165%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#5A5044" flood-opacity=".17"/>
    </filter>
  </defs>
  <rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="15" fill="${CARD}" filter="url(#sh)"/>
  <rect x="${CX + 0.5}" y="${CY + 0.5}" width="${CW - 1}" height="${CH - 1}" rx="14.5" fill="none" stroke="${EDGE}"/>
  ${parts.join("\n  ")}
</svg>
`;
}

const svg = assertClean(card(), "about.svg");
writeFileSync(join(HERE, "..", "assets", "about.svg"), svg);
console.log(`about.svg: ${Math.round(svg.length / 1024)} KB`);

/* ---- splice the section into README.md ---- */
const BEGIN = "<!-- about:begin -->";
const END = "<!-- about:end -->";
const section =
  `${BEGIN}\n` +
  `<div align="center">\n` +
  `  <picture>\n` +
  `    <source media="(prefers-color-scheme: dark)" srcset="./assets/crest.svg" />\n` +
  `    <img src="./assets/crest.light.svg" width="420" alt="Isometric illustration of Prince R at a desk — a monitor showing code, a keyboard, a mug, a small plant and an office chair" />\n` +
  `  </picture>\n` +
  `</div>\n\n` +
  `<img src="./assets/about.svg" width="100%" alt="${esc(ABOUT.lead)} ${esc(ABOUT.body)}" />\n` +
  `${END}`;

const README = join(HERE, "..", "README.md");
let md = readFileSync(README, "utf8");
if (!md.includes(BEGIN) || !md.includes(END)) throw new Error("about markers missing from README.md");
const s = md.indexOf(BEGIN);
const e = md.indexOf(END) + END.length;
writeFileSync(README, md.slice(0, s) + section + md.slice(e));
console.log("README about section spliced");
