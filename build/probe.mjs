import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";

const P = k.fitProjection([[0, 0, 0], [100, 0, 0], [0, 100, 0], [0, 0, 100]], 600, 400, { pad: 40, azimuth: 45 });
console.log("P =", JSON.stringify(P));

const o = k.iso([0, 0, 0], P);
const px = k.iso([40, 0, 0], P);
const py = k.iso([0, 40, 0], P);
const pz = k.iso([0, 0, 40], P);
const v = (a, b) => [a[0] - b[0], a[1] - b[1]];
console.log("+x screen dir:", v(px, o));
console.log("+y screen dir:", v(py, o));
console.log("+z screen dir:", v(pz, o));

console.log("depthOf +x face:", k.depthOf([50, 0, 0], P));
console.log("depthOf -x face:", k.depthOf([-50, 0, 0], P));
console.log("depthOf +y face:", k.depthOf([0, 50, 0], P));
console.log("depthOf -y face:", k.depthOf([0, -50, 0], P));

// sideMatrix orientation check: project a unit square in each face plane
console.log("sideMatrix left:", k.sideMatrix([0, 0, 0], 0, P, "left"));
console.log("sideMatrix right:", k.sideMatrix([0, 0, 0], 0, P, "right"));
console.log("topMatrix:", k.topMatrix([0, 0], 0, P, "x"));
