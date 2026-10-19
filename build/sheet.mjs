/* Contact sheet of the six project cards at display size, plus a 3x zoom of two
 * MSEC cards — used to judge whether a 120x137 coat of arms still reads at the
 * 34px chip it lands in. Run: node build/sheet.mjs  -> build/sheet.html
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "assets", "projects");
const slugs = ["campus-serve", "msec-academics", "msec-connect", "msec-notify", "logipilot", "busybot"];

const cell = (slug, scale) =>
  `<figure style="margin:0">
     <div style="width:${296 * scale}px;height:${188 * scale}px">${readFileSync(join(OUT, slug + ".svg"), "utf8")}</div>
     <figcaption>${slug} @ ${scale}x</figcaption>
   </figure>`;

const zoom = (slug) => readFileSync(join(OUT, slug + ".svg"), "utf8").replace(
  `<svg `,
  `<svg style="transform:scale(3);transform-origin:0 0" `,
);

const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;padding:24px;background:#FAF9F5;font:13px/1.5 system-ui;color:#444}
  h2{font:600 13px system-ui;letter-spacing:.08em;text-transform:uppercase;color:#8A8377;margin:24px 0 10px}
  .row{display:flex;gap:18px;flex-wrap:wrap}
  figcaption{font:11px system-ui;color:#9a958c;margin-top:6px}
  .zoom{overflow:hidden;width:300px;height:200px;border:1px solid #E8E2D6;border-radius:12px;background:#FAF8F3}
</style>
<h2>Display size (296px)</h2>
<div class="row">${slugs.map((s) => cell(s, 1)).join("")}</div>
<h2>Zoomed 3x — chip legibility</h2>
<div class="row">
  <div><div class="zoom">${zoom("msec-academics")}</div><div class="cap">msec-academics</div></div>
  <div><div class="zoom">${zoom("msec-notify")}</div><div class="cap">msec-notify (light theme)</div></div>
</div>`;

writeFileSync(join(HERE, "sheet.html"), html);
console.log("wrote build/sheet.html", html.length, "bytes");
