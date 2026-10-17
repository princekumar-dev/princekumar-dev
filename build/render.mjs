import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(root, "README.md"), "utf8");

let html;
try {
  const res = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: {
      "User-Agent": "readme-verify",
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json",
    },
    body: JSON.stringify({ mode: "gfm", text: md }),
  });
  if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
  html = await res.text();
  console.log("rendered via api.github.com/markdown  (" + html.length + " bytes)");
} catch (e) {
  console.log("GitHub API unavailable: " + e.message);
  process.exit(2);
}

/* NOTE: GitHub's sanitizer keeps safe styles (e.g. <td style="width:50%"> it derives
   from the width attr), so we render the pipeline output as-is for a faithful preview.
   Our README contributes zero inline styles — verified by validate.mjs. */
const mine = (md.match(/[ \t]+style="[^"]*"/gi) || []).length;
console.log("inline styles authored by README.md: " + mine);

/* local preview lives in build/, assets are one level up */
const local = html.replaceAll("./assets/", "../assets/");

writeFileSync(join(root, "build", "rendered.html"), local);

/* GitHub-flavoured canvas for the screenshot */
const page = `<!doctype html><meta charset="utf-8">
<style>
  body{margin:0;background:#010102;}
  .wrap{max-width:896px;margin:0 auto;padding:24px 16px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
    font-size:16px;line-height:1.5;color:#d0d6e0;}
  .wrap h1,.wrap h2,.wrap h3{color:#f7f8f8;font-weight:600;}
  .wrap h2{padding-bottom:.3em;border-bottom:1px solid #23252a;margin-top:24px;}
  .wrap h3{margin-top:16px;}
  .wrap p{margin:8px 0;}
  .wrap ul{margin:8px 0;padding-left:2em;}
  .wrap li{margin:2px 0;}
  .wrap a{color:#828fff;text-decoration:none;}
  .wrap img{max-width:100%;height:auto;background:transparent;}
  .wrap table{border-collapse:collapse;width:100%;margin:8px 0;}
  .wrap td,.wrap th{border:1px solid #23252a;padding:8px;vertical-align:top;}
  .wrap sub{font-size:11px;color:#8a8f98;}
  .wrap code{background:#0f1011;padding:2px 6px;border-radius:6px;font-size:12px;color:#d0d6e0;}
  .wrap pre{background:#0f1011;padding:12px;border-radius:8px;overflow:auto;}
  .wrap pre code{background:none;padding:0;}
  .wrap hr{border:0;border-top:1px solid #23252a;}
</style>
<div class="wrap">${local}</div>`;

writeFileSync(join(root, "build", "page.html"), page);
console.log("wrote build/page.html");
