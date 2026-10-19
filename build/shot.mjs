/* One-off crop shooter: freezes the crest at an explicit SMIL time (a plain
   headless screenshot lands on a random frame) and captures a
   [cx, cy, zoom] window of either theme.
   node build/shot.mjs <cx> <cy> <zoom> <dark|light> <out.png> [seconds] */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const [cxS, cyS, zS, theme, out, at = "2.5"] = process.argv.slice(2);
if (!out) { console.error("usage: node build/shot.mjs <cx> <cy> <zoom> <dark|light> <out.png> [sec]"); process.exit(1); }
const cx = Number(cxS), cy = Number(cyS), zoom = Number(zS);
const file = theme === "dark" ? "crest.svg" : "crest.light.svg";
const svg = readFileSync(join(ROOT, "assets", file), "utf8");

const PW = 560, PH = 420;
const crop = `translate(${(PW / 2 - zoom * cx).toFixed(1)}px,${(PH / 2 - zoom * cy).toFixed(1)}px) scale(${zoom})`;
const html = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;padding:10px;background:#FAF9F5}
.z{overflow:hidden;width:${PW}px;height:${PH}px;border:1px solid #E8E2D6;border-radius:8px;background:#FAF8F3}
.z>div{position:relative;width:660px;height:480px;transform-origin:0 0;transform:${crop}}</style>
<div class="z"><div>${svg}</div></div>
<script>document.querySelectorAll("svg").forEach(g=>{g.pauseAnimations();g.setCurrentTime(${at});});</script>`;
const htmlPath = join(HERE, "_shot.html");
writeFileSync(htmlPath, html);

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const png = join(HERE, out);
await new Promise((res) => {
  spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
    `--screenshot=${png}`, "--window-size=584,460", "--virtual-time-budget=3000",
    pathToFileURL(htmlPath).href,
  ], { stdio: "ignore" }).on("exit", res);
});
console.log(`${out} written`);
