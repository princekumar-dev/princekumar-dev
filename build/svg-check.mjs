/* Cheap well-formedness guard for the SVGs this project generates.
 *
 * Two bugs this actually caught, both invisible until the browser refused the
 * file: a raw "<img" written inside a <style> block (SVG is XML — any raw "<"
 * in element content terminates parsing, and Chrome shows a broken-image
 * icon), and an object handed to a path's d attribute, which stringified to
 * "[object Object]" and silently drew nothing.
 */
import { readFileSync } from "node:fs";

export function assertClean(svg, name) {
  const fail = (msg) => {
    throw new Error(`${name}: ${msg}`);
  };

  if (!svg.startsWith("<svg")) fail("does not start with <svg");
  if (!svg.trimEnd().endsWith("</svg>")) fail("does not end with </svg>");

  const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(svg);
  if (style) {
    const body = style[1];
    if (body.includes("<")) fail("raw '<' inside <style> — SVG is XML, escape it or rewrite");
    const rawAmp = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.exec(body);
    if (rawAmp) fail("raw '&' inside <style> — escape as &amp;");
  }

  if (/\[object\s/i.test(svg)) fail("an object stringified into markup");
  if (/d="(?:undefined|NaN|null)"/.test(svg)) fail("empty/NaN path data");

  return svg;
}

/** escape text content and attribute values for XML */
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** read a generated asset back, for spot checks */
export const read = (p) => readFileSync(p, "utf8");
