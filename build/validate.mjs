import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
const bad = (m) => { console.log("  FAIL " + m); fail++; };
const ok = (m) => console.log("  ok   " + m);

/* ---------- README structure ---------- */
const md = readFileSync(join(root, "README.md"), "utf8");
console.log("README.md  " + md.length + " bytes");

/* "<table" not "<table>": an explicit <table width="100%"> is still a table,
   and the close-count is what catches a unclosed one. */
for (const [a, b, name] of [
  ["<table", "</table>", "table"],
  ["<tr", "</tr>", "tr"],
  ["<td", "</td>", "td"],
  ["<div", "</div>", "div"],
  ["<ul>", "</ul>", "ul"],
  ["<a href", "</a>", "a"],
  ["<p>", "</p>", "p"],
]) {
  const open = md.split(a).length - 1;
  const close = md.split(b).length - 1;
  (open === close ? ok : bad)(`${name}: ${open} open / ${close} close`);
}

/* asset references — srcset too: <picture> names the dark variant there */
const refs = [
  ...md.matchAll(/(?:src|href)="\.\/([^"]+)"/g),
  ...md.matchAll(/srcset="\.\/([^"]+)"/g),
].map((m) => m[1]);
const uniq = [...new Set(refs)];
for (const r of uniq) (existsSync(join(root, r)) ? ok : bad)(`asset ${r} (${refs.filter((x) => x === r).length} refs)`);

/* external links preserved */
const links = [...md.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]);
ok(`${links.length} external links, ${new Set(links).size} unique`);

/* GitHub sanitiser hazards: inline style / script */
const inlineStyle = [...md.matchAll(/<[a-z]+[^>]*\sstyle="/gi)].length;
const scripts = [...md.matchAll(/<script/gi)].length;
(inlineStyle === 0 ? ok : bad)(`${inlineStyle} inline style attrs (must be 0)`);
(scripts === 0 ? ok : bad)(`${scripts} <script> (must be 0)`);

/* markdown inside <td> needs blank lines around it */
const tds = md.split(/<td[^>]*>/).slice(1).map((s) => s.split("</td>")[0]);
let mdInTd = 0;
for (const t of tds) {
  if (/^\s*\n#{1,6} /m.test(t)) mdInTd++;
  if (/^\s*\n\*[^*]/m.test(t)) mdInTd++;
}
ok(`${mdInTd} markdown blocks inside <td>`);

/* ---------- palette ---------- */
/* Linear (previous) + the original violet set are all retired. */
const OLD = [
  "5E6AD2", "828FFF", "010102", "0F1011", "23252A", "8A8F98", "F7F8F8",
  "7C3AED", "10B981", "A78BFA", "C4B5FD", "EDE9FE", "E6E2F5",
  "EF4444", "F59E0B", "06B6D4", "3B82F6", "00C853", "FFDD00", "D14836",
  "EA4AAA", "E4405F", "0A66C2", "0A0812", "08060D", "27A644", "D0D6E0",
];
/* Claude, warm-dark variant — one chromatic accent, coral #cc785c. */
const WANT = ["CC785C", "181715", "2B2822", "5DB872", "9A948A", "E5A183"];

const files = [
  "README.md",
  "assets/header.svg",
  "assets/header.light.svg",
  "assets/divider.svg",
  "assets/crest.svg",
  "assets/crest.light.svg",
  "assets/stack.svg",
  "assets/analytics.svg",
];
for (const f of files) {
  const s = readFileSync(join(root, f), "utf8").toUpperCase();
  const oldHits = OLD.filter((c) => s.includes(c.toUpperCase()));
  const want = WANT.filter((c) => s.includes(c.toUpperCase()));
  if (f.startsWith("assets/crest")) {
    // the crest is fully token-driven, but it must still shed the Linear accent
    const retired = ["5E6AD2", "828FFF"].filter((c) => s.includes(c));
    (retired.length === 0 ? ok : bad)(
      `${f}: ${s.length} bytes, retired accent ${retired.join(",") || "none"} | warm ${want.join(",") || "via tokens"}`,
    );
  } else {
    (oldHits.length === 0 ? ok : bad)(
      `${f}: retired palette ${oldHits.join(",") || "none"} | warm ${want.join(",") || "NONE"}`,
    );
  }
}

/* ---------- SVG XML ---------- */
const { XMLParser } = await import("fast-xml-parser").catch(() => ({ XMLParser: null }));
for (const f of readdirSync(join(root, "assets")).filter((x) => x.endsWith(".svg"))) {
  const s = readFileSync(join(root, "assets", f), "utf8");
  const opens = (s.match(/<(?!\/)(?!!)(?![?])[a-zA-Z]/g) || []).length;
  // crude self-closing check: every <tag must either self-close or have a matching </tag>
  const tags = [...s.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)];
  const stack = [];
  let x = true;
  for (const [, slash, name, attrs, self] of tags) {
    if (self === "/" ) continue;
    if (slash) { if (stack.pop() !== name) { x = false; break; } }
    else stack.push(name);
  }
  if (x && stack.length === 0) ok(`${f}: XML well-formed, ${tags.length} tags`);
  else bad(`${f}: XML unbalanced (leftover: ${stack.join(",")})`);
}

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} FAILURE(S)`);
process.exit(fail ? 1 : 0);
