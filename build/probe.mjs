/* Reproduces the crest's projection so world coordinates can be read against a
   rendered grid — used to place new scene geometry at an exact spot without
   guessing from pixels. Test-only; feeds nothing.
     node build/probe.mjs                                     */
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";

const W = 660;
const H = 480;

const FLOOR = { x: -122, y: -80, w: 266, d: 166, r: 14 };
const FLOOR_B = -8;
const DESK_TOP_Z = 66;
const MON = { x: -16, y: -46, w: 8, d: 92, r: 4 };
const MON_TOP = 152;
const MON_FACE = MON.x + MON.w;
const HEAD = [100, 0];
const HEAD_R = 17;
const HEAD_Z = 114;
const BACK = { x: 128, y: -15, w: 7, d: 40, r: 3 };
const CHAIR = [114, 6];
const SHADE = [24, -32, DESK_TOP_Z + 76];
const BOOKS = { x: -70, y: -50, w: 30, d: 22, r: 3 };

const fits = [
  ...k.boxCorners(FLOOR, FLOOR_B - 5, 0),
  [MON.x, MON.y, MON_TOP + 4], [MON_FACE, MON.y + MON.d, MON_TOP + 4],
  [HEAD[0], HEAD[1] - HEAD_R, HEAD_Z + HEAD_R + 8], [HEAD[0], HEAD[1] + HEAD_R, HEAD_Z + HEAD_R + 8],
  [BACK.x + BACK.w, CHAIR[1] + 26, 4],
  [SHADE[0], SHADE[1], SHADE[2] + 18],
  ...k.boxCorners(BOOKS, DESK_TOP_Z, DESK_TOP_Z + 16),
];

const P = k.fitProjection(fits, W, H, { pad: 34, azimuth: 45, elevation: 30 });
const pt = (x, y, z) => k.iso([x, y, z], P);

/* screen is linear in world: o + x·ax + y·ay + z·az */
const o = pt(0, 0, 0);
const d = (a, b) => [b[0] - a[0], b[1] - a[1]];
const ax = d(o, pt(1, 0, 0));
const ay = d(o, pt(0, 1, 0));
const az = d(o, pt(0, 0, 1));

/* solve for x,y at a fixed z that lands on a target screen point */
const solve = (sx, sy, z) => {
  const rx = sx - o[0] - az[0] * z;
  const ry = sy - o[1] - az[1] * z;
  const det = ax[0] * ay[1] - ax[1] * ay[0];
  return [
    (rx * ay[1] - ry * ay[0]) / det,
    (ax[0] * ry - ax[1] * rx) / det,
  ];
};

const f = (p) => `(${p[0].toFixed(1)}, ${p[1].toFixed(1)})`;

console.log("origin", f(o), "ax", f(ax), "ay", f(ay), "az", f(az));
console.log("\nlandmarks (world -> screen)");
const marks = [
  ["floor L", -122, 86, 0], ["floor R", 144, 86, 0],
  ["floor back", 144, -80, 0], ["floor front", -122, -80, 0],
  ["cabinet", -74, 60, 30], ["desk top FL", -105, 64, DESK_TOP_Z],
  ["chair", 114, 6, 43], ["plant", -92, 44, DESK_TOP_Z],
  ["mug", -40, 46, DESK_TOP_Z], ["monitor", -12, 0, 120],
];
for (const [n, x, y, z] of marks) console.log(`  ${n.padEnd(12)} w(${x},${y},${z}) -> ${f(pt(x, y, z))}`);

console.log("\ncandidates -> screen");
for (const [n, x, y, z] of [
  ["floor strip A", -60, 74, 0], ["floor strip B", -95, 74, 0],
  ["left floor", -112, 30, 0], ["knee hole", -6, 0, 30],
  ["front-left", -80, 78, 0],
]) console.log(`  ${n.padEnd(12)} w(${x},${y},${z}) -> ${f(pt(x, y, z))}`);

console.log("\ntarget screen -> world");
for (const [n, sx, sy] of [
  ["(205,285)", 205, 285], ["(205,300)", 205, 300],
  ["(180,320)", 180, 320], ["(230,260)", 230, 260],
]) {
  const [x, y] = solve(sx, sy, 0);
  console.log(`  ${n} @z=0 -> w(${x.toFixed(1)}, ${y.toFixed(1)}, 0)  ${f(pt(x, y, 0))}`);
}
