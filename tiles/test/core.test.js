// Run: node tiles/test/core.test.js
const assert = require('assert');
const T = require('../core.js');

let checked = 0;

function footprintsDisjoint(parts) {
  // Separating-axis test on convex hulls is overkill here; bounding boxes of
  // neighbours may overlap, so test polygon edges for intersection instead.
  const segs = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
  const inter = (a, b, c, d) => {
    const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  const box = (poly) => {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  };
  const boxes = parts.map((p) => box(p.foot));
  const inside = (pt, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  };
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A[2] < B[0] || B[2] < A[0] || A[3] < B[1] || B[3] < A[1]) continue;
      for (const [a, b] of segs(parts[i].foot)) {
        for (const [c, d] of segs(parts[j].foot)) {
          if (inter(a, b, c, d)) return `${parts[i].id} x ${parts[j].id}`;
        }
      }
      if (inside(parts[i].c, parts[j].foot) || inside(parts[j].c, parts[i].foot)) return `${parts[i].id} in ${parts[j].id}`;
    }
  }
  return null;
}

function checkModel(label, params) {
  const G = T.generate(params);
  assert.ok(G.parts.length > 0, `${label}: no parts`);
  for (const p of G.parts.concat(G.board ? [G.board] : [])) {
    const r = T.checkClosed(p.tris);
    assert.ok(r.closed, `${label}: part ${p.id} is not closed (${r.badEdges} bad edges)`);
    assert.ok(r.volume > 0, `${label}: part ${p.id} has non-positive volume ${r.volume}`);
    const b = T.bounds([p.tris]);
    if (p.id !== 'BOARD') assert.ok(Math.abs(b.min[2]) < 1e-4, `${label}: part ${p.id} does not sit on z=0`);
    checked++;
  }
  const clash = footprintsDisjoint(G.parts);
  assert.strictEqual(clash, null, `${label}: footprints overlap ${clash}`);
  return G;
}

for (const pr of T.PRESETS) checkModel(pr.name, pr.p);

const extra = [
  ['radial mixed facets', { layout: 'radial', rIn: 10, rings: 6, ringW: 18, segMode: 'equal', arcDiv: 3, stagger: true, gap: 0.4 }],
  ['radial tiny gap', { layout: 'radial', rIn: 0, rings: 5, ringW: 20, segMode: 'equal', arcDiv: 2, gap: 0.05 }],
  ['radial fixed aligned', { layout: 'radial', rIn: 30, rings: 4, segMode: 'fixed', segs: 12, stagger: false, gap: 1 }],
  ['tilted twisted domes', { topScale: 0.6, curv: 1.5, twist: 40, tilt: 50, offset: 0.3, d_mode: 'noise' }],
  ['concave spikes', { topScale: 0, curv: -1.5, layers: 8, offset: 1.2, plinth: 0 }],
  ['circle frustums', { foot: 'circle', sides: 5, topScale: 0.3, tilt: 20, sizeLink: 1, h_mode: 'noise' }],
  ['drops in radial', { layout: 'radial', foot: 'drop', rings: 5, ringW: 30, curv: 1, topScale: 0 }],
  ['huge gap', { cols: 6, rows: 6, W: 60, H: 60, gap: 8 }],
  ['hex rect pointy', { layout: 'hex', hexShape: 'rect', hexOrient: 'pointy', W: 300, H: 200, cols: 7, board: true, acc: 'checker' }],
  ['hex rect flat', { layout: 'hex', hexShape: 'rect', hexOrient: 'flat', W: 300, H: 200, cols: 7, topScale: 0.5, tilt: 30 }],
  ['hex rect narrow', { layout: 'hex', hexShape: 'rect', W: 90, H: 400, cols: 1, board: true }],
  ['hex hexagon circles', { layout: 'hex', hexShape: 'hexagon', hexRings: 4, hexSize: 30, foot: 'circle', sides: 6, curv: 1 }],
  ['hex single cell', { layout: 'hex', hexShape: 'hexagon', hexOrient: 'flat', hexRings: 0, hexSize: 50, board: true }],
];
for (const [label, p] of extra) checkModel(label, p);

// huge gap drops every cell → warning, not a crash
const G0 = T.generate({ cols: 4, rows: 4, W: 40, H: 40, gap: 30 });
assert.strictEqual(G0.parts.length, 0);
assert.ok(G0.warnings.length > 0);

// STL size and ZIP structure
const G = T.generate(T.PRESETS[0].p);
const stl = T.stlBinary(G.parts.map((p) => ({ tris: p.tris })), 'x');
const triCount = G.parts.reduce((s, p) => s + p.tris.length / 9, 0);
assert.strictEqual(stl.length, 84 + 50 * triCount);
assert.strictEqual(new DataView(stl.buffer).getUint32(80, true), triCount);

const zip = T.makeZip([{ name: 'a.txt', data: 'hello' }, { name: 'b.bin', data: new Uint8Array([1, 2, 3]) }]);
const zv = new DataView(zip.buffer);
assert.strictEqual(zv.getUint32(0, true), 0x04034b50);
assert.strictEqual(zv.getUint32(zip.length - 22, true), 0x06054b50);
assert.strictEqual(zv.getUint16(zip.length - 22 + 10, true), 2);

// plates: every part placed once, inside the bed
const { plates } = T.packPlates(G.parts, 220, 220, 3);
const placed = plates.reduce((s, pl) => s + pl.items.length, 0);
assert.strictEqual(placed, G.parts.length);
for (const pl of plates) {
  for (const it of pl.items) {
    const b = T.bounds([it.part.tris]);
    assert.ok(b.min[0] + it.dx > -1e-6 && b.max[0] + it.dx < 220 + 1e-6);
    assert.ok(b.min[1] + it.dy > -1e-6 && b.max[1] + it.dy < 220 + 1e-6);
  }
}

// hex: ids are unique and the pointy rectangle stays inside W x H
for (const o of ['pointy', 'flat']) {
  const H = T.generate({ layout: 'hex', hexShape: 'rect', hexOrient: o, W: 400, H: 300, cols: 8, gap: 0 });
  assert.strictEqual(new Set(H.parts.map((p) => p.id)).size, H.parts.length, `hex ${o}: duplicate ids`);
  const b = T.bounds(H.parts.map((p) => p.foot.flatMap((q) => [q[0], q[1], 0])));
  assert.ok(b.min[0] >= -200 - 1e-6 && b.max[0] <= 200 + 1e-6 && b.min[1] >= -150 - 1e-6 && b.max[1] <= 150 + 1e-6, `hex ${o}: exceeds the panel`);
}

const svg = T.assemblySVG(G);
assert.ok(svg.startsWith('<svg') && svg.includes('R01C01'));

console.log(`ok — ${T.PRESETS.length} presets + ${extra.length} edge cases, ${checked} closed solids, ${plates.length} print plates`);
