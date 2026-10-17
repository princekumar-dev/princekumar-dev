/* Project gallery — six tooth-white cards, each with its own mark and accent.
 *
 * Why cards and not markdown: GitHub strips background colours from HTML, so
 * the only way to get a real, solid, designed surface into a README is an
 * image. Each card is drawn at the size it is displayed (296px in a 33% cell)
 * so type stays crisp. Only the display face is embedded (project names) —
 * card body text runs in the system stack, because embedding Inter six times
 * over would cost more than the whole rest of the README. The card is wrapped
 * in a link to the live site, with a source link beneath it.
 *
 * This script also splices the matching section into README.md between
 * <!-- projects:begin/end --> markers, so the prose can never drift from the
 * cards. Re-run after editing copy.mjs.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FONT_CSS } from "./font-data-cards.mjs";
import { PROJECTS } from "./copy.mjs";
import { assertClean, esc } from "./svg-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "assets", "projects");
mkdirSync(OUT, { recursive: true });

/* ---- card geometry (drawn at display size) ---- */
const W = 296;
const H = 188;
const CX = 6;
const CY = 4;
const CW = 284;
const CH = 176;
const L = CX + 16; // 22
const R = CX + CW - 16; // 274

const INK = "#1B1A17";
const TEXT = "#5F5A51";
const MUTED = "#8A8377";
const CARD = "#FAF8F3";
const EDGE = "#E8E2D6";
const RULE = "#EDE7DB";
const PILL = "#F0EBE1";

const DISPLAY = "Newsreader,'Source Serif 4',Palatino,Georgia,serif";
const BODY = "Inter,ui-sans-serif,system-ui,sans-serif";

/* ---- monoline marks, drawn on a 24 grid ---- */
const MARKS = {
  building:
    '<path d="M4.6 19.9V9.6L12 5.1l7.4 4.5v10.3"/><path d="M4.6 19.9h14.8"/><path d="M10.1 19.9v-4.7h3.8v4.7"/><path d="M7.6 11.9h2.4M14 11.9h2.4"/>',
  cap:
    '<path d="M2.9 9.4 12 4.8l9.1 4.6L12 14 2.9 9.4Z"/><path d="M6.7 11.6v4.5c0 0 2.3 2.1 5.3 2.1s5.3-2.1 5.3-2.1v-4.5"/><path d="M20.4 10.3v4.3"/>',
  calendar:
    '<rect x="3.2" y="5.5" width="17.6" height="15.1" rx="2.6"/><path d="M3.2 10.2h17.6"/><path d="M8.2 3.6v3.4M15.8 3.6v3.4"/><path d="m8.7 15.5 2.5 2.5 4.5-4.9"/>',
  bell:
    '<path d="M6.4 17.2V10a5.6 5.6 0 0 1 11.2 0v7.2l1.7 2.5H4.7Z"/><path d="M10.2 19.7a2 2 0 0 0 3.6 0"/>',
  send: '<path d="M20.7 3.7 3.7 10.3l7 2.9 2.9 7Z"/><path d="m10.7 13.2 5.5-5.5"/>',
  bot:
    '<rect x="4.3" y="8.7" width="15.4" height="11.2" rx="3.2"/><path d="M12 5.6v3.1"/><circle cx="12" cy="4.2" r="1.5"/><circle cx="9.4" cy="13.7" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.6" cy="13.7" r="1.25" fill="currentColor" stroke="none"/><path d="M9.9 17.2h4.2"/>',
};

/* greedy wrap — SVG has no text wrapping, so lines are authored */
const wrap = (text, max = 43) => {
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
};

/* advance-width estimate so pills never clip their label */
const pillW = (label, size) => label.length * size * 0.59 + size * 1.9;

const pill = (x, y, label, { bg, fg, size = 10 }) => {
  const w = Math.round(pillW(label, size));
  const h = 22;
  return {
    w,
    svg:
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>` +
      `<text class="p" x="${x + w / 2}" y="${y + h / 2 + 3.5}" text-anchor="middle" font-size="${size}" fill="${fg}">${esc(label)}</text>`,
  };
};

function card(p, i) {
  const a = p.accent;
  const parts = [];

  parts.push(
    `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="15" fill="${CARD}" filter="url(#sh)"/>`,
    `<rect x="${CX + .5}" y="${CY + .5}" width="${CW - 1}" height="${CH - 1}" rx="14.5" fill="none" stroke="${EDGE}"/>`,
  );

  /* mark on its own tinted chip */
  parts.push(
    `<rect x="${L}" y="20" width="34" height="34" rx="10" fill="${a}" fill-opacity=".10"/>`,
    `<g transform="translate(${L + 7} 27) scale(.8333)" fill="none" stroke="${a}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" color="${a}">${MARKS[p.mark]}</g>`,
  );

  /* name (display serif) + kicker (accent) + index */
  parts.push(
    `<text class="n" x="${L + 44}" y="37" font-size="16.5" fill="${INK}">${esc(p.name)}</text>`,
    `<text class="k" x="${L + 44}" y="52" font-size="9.5" letter-spacing="1.05" fill="${a}">${esc(p.kicker)}</text>`,
    `<text class="k" x="${R}" y="37" text-anchor="end" font-size="10" letter-spacing="1" fill="#B9B2A6">${String(i + 1).padStart(2, "0")}</text>`,
  );

  parts.push(`<path d="M${L} 70.5H${R}" stroke="${RULE}"/>`);

  wrap(p.desc).forEach((line, n) => {
    parts.push(
      `<text class="d" x="${L}" y="${89 + n * 15}" font-size="11.5" fill="${TEXT}">${esc(line)}</text>`,
    );
  });

  const y = 134;
  const a1 = pill(L, y, p.lang, { bg: PILL, fg: "#6B655C" });
  const a2 = pill(L + a1.w + 8, y, `${p.status} ↗`, { bg: `${a}1A`, fg: a });
  parts.push(a1.svg, a2.svg);

  const body = parts.join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t${i} d${i}">
  <title id="t${i}">${esc(p.name)} — ${esc(p.kicker.toLowerCase())}</title>
  <desc id="d${i}">${esc(p.alt)}</desc>
  <style>${FONT_CSS}
  .n{font-family:${DISPLAY};font-weight:500;letter-spacing:-.2px;font-kerning:normal}
  .k{font-family:${BODY};font-weight:600}
  .d,.p{font-family:${BODY};font-kerning:normal;text-rendering:optimizeLegibility}
  .d{font-weight:400}
  .p{font-weight:500;letter-spacing:.2px}
  </style>
  <defs>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="165%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#5A5044" flood-opacity=".17"/>
    </filter>
  </defs>
  ${body}
</svg>
`;
}

let bytes = 0;
PROJECTS.forEach((p, i) => {
  const svg = assertClean(card(p, i), p.slug);
  writeFileSync(join(OUT, `${p.slug}.svg`), svg);
  bytes += svg.length;
});
console.log(`projects: ${PROJECTS.length} cards, ${Math.round(bytes / 1024)} KB total`);

/* ---- splice the matching section into README.md ---- */
/* no <br/>: the card is already 100% of the cell, so the <sub> wraps onto its
   own line by itself — and skipping it drops a whole line-box of air that was
   pushing the source link visually closer to the NEXT row than to this card. */
const cell = (p) =>
  `<td width="33%" align="center" valign="top"><a href="${p.live}"><img src="./assets/projects/${p.slug}.svg" width="100%" alt="${esc(p.alt)}" /></a><sub><a href="${p.repo}">source ↗</a></sub></td>`;

const BEGIN = "<!-- projects:begin -->";
const END = "<!-- projects:end -->";
const section =
  `${BEGIN}\n` +
  `## 🚀 Featured Projects\n\n` +
  `*Things I built for campus and beyond — five of them live.*\n\n` +
  `<table>\n` +
  `  <tr>\n    ${[0, 1, 2].map((i) => cell(PROJECTS[i])).join("\n    ")}\n  </tr>\n` +
  `  <tr>\n    ${[3, 4, 5].map((i) => cell(PROJECTS[i])).join("\n    ")}\n  </tr>\n` +
  `</table>\n` +
  `${END}`;

const README = join(HERE, "..", "README.md");
let md = readFileSync(README, "utf8");
if (md.includes(BEGIN) && md.includes(END)) {
  const a = md.indexOf(BEGIN);
  const b = md.indexOf(END) + END.length;
  md = md.slice(0, a) + section + md.slice(b);
} else {
  const start = md.indexOf("## 🚀 Featured Projects");
  const end = md.indexOf("</table>", start);
  if (start === -1 || end === -1) throw new Error("could not locate the existing projects section");
  md = md.slice(0, start) + section + md.slice(end + "</table>".length);
}
writeFileSync(README, md);
console.log("README projects section spliced");
