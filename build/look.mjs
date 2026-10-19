/* Diagnostic harness for the crest. A headless screenshot doesn't reliably
   land on a given SMIL frame, so this inlines the SVG and freezes the
   timeline at an explicit moment — the only way to see what the reader sees
   at t = 2.5s rather than whatever the capture happened to catch. Crop boxes
   are [centre x, centre y, zoom] in crest coordinates. Test-only; nothing
   here feeds the README.
     node build/look.mjs [seconds]                                  */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, "..");
const which = process.argv[3] ?? "light";
/* the dark build has no `.dark` suffix — it is just crest.svg */
const FILE = which === "dark" ? "crest.svg" : `crest.${which}.svg`;
const svg = readFileSync(resolve(ROOT, "assets", FILE), "utf8");
const AT = Number(process.argv[2] ?? 2.5);

/* viewport is PWxPH per pane */
const PW = 560;
const PH = 420;
const crop = (cx, cy, k) => `translate(${(PW / 2 - k * cx).toFixed(1)}px,${(PH / 2 - k * cy).toFixed(1)}px) scale(${k})`;

const panes = [
  ["figure", 310, 195, 3.0],
];

/* coordinate grid drawn in crest space, so a crop centre can be read straight
   off the render. Test-only. */
const grid = (() => {
  let d = "";
  for (let x = 0; x <= 660; x += 25) d += `M${x} 0V480`;
  for (let y = 0; y <= 480; y += 25) d += `M0 ${y}H660`;
  let labels = "";
  for (let x = 0; x <= 660; x += 100) labels += `<text x="${x + 3}" y="12">${x}</text>`;
  for (let y = 100; y <= 480; y += 100) labels += `<text x="3" y="${y - 3}">${y}</text>`;
  return `<svg width="660" height="480" style="position:absolute;left:0;top:0;pointer-events:none" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${d}" stroke="#E0407A" stroke-width=".5" opacity=".38" fill="none"/>` +
    `<path d="M330 0V480M0 240H660" stroke="#E0407A" stroke-width="1" opacity=".7" fill="none"/>` +
    `<g fill="#E0407A" font-family="system-ui" font-size="9" opacity=".9">${labels}</g></svg>`;
})();

const html = `<!doctype html><meta charset="utf-8">
<style>
  body{margin:0;padding:12px;background:#FAF9F5;font:10px system-ui;color:#8a857c}
  h3{font:600 9px system-ui;letter-spacing:.09em;text-transform:uppercase;margin:10px 0 5px}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  .z{overflow:hidden;width:560px;height:420px;border:1px solid #E8E2D6;border-radius:10px;background:#FAF8F3}
  .z>div{position:relative;width:660px;height:480px;transform-origin:0 0}
</style>
<div class="row">
${panes.map(([name, cx, cy, k]) => `<div><h3>${name}</h3><div class="z"><div style="transform:${crop(cx, cy, k)}">${svg}${grid}</div></div></div>`).join("\n")}
</div>
<script>
  document.querySelectorAll("svg").forEach(g => { g.pauseAnimations(); g.setCurrentTime(${AT}); });
</script>`;

writeFileSync(resolve(DIR, "look.html"), html);
console.log(`froze at t=${AT}s (${which}) — screenshot build/look.html`);
