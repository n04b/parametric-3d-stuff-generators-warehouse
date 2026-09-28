import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// The geometry core lives inside index.html between CORE markers (single-file tool).
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('// ===== CORE:BEGIN'), html.indexOf('// ===== CORE:END'));
const Core = new Function(src + '\nreturn BrutalCore;')();

const COMMON = Core.defaults(Core.COMMON);
const params = (pattern, over = {}) => ({ ...Core.defaults(Core.PATTERNS[pattern].params), ...over });

// Variants that exercise every layout / mode branch.
const VARIANTS = [
  ['pile', {}],
  ['pile', { count: 150, size: 70, tilt: 60 }],
  ['blocks', {}],
  ['blocks', { mode: 'diagonal', bond: 0.5, tilt: 20, tiltMode: 'random' }],
  ['blocks', { mode: 'noise', joint: 0, chamfer: 0 }],
  ['blocks', { mode: 'wave', tilt: 15, tiltMode: 'alt' }],
  ['pyramids', {}],
  ['pyramids', { layout: 'diamond', dirMode: 'flow' }],
  ['pyramids', { layout: 'triangle', dirMode: 'alternate', joint: 0 }],
  ['fins', {}],
  ['fins', { orient: 'h', chamfer: 0, gap: 0 }],
  ['folds', {}],
  ['folds', { grad: 'noise', skew: -0.4, kink: 1, topRatio: 1 }],
];

// Weld identical coordinates, then every directed edge must appear once and its reverse once.
function assertClosed(pos, label) {
  const ids = new Map(), idx = [];
  for (let v = 0; v < pos.length / 3; v++) {
    const k = `${pos[v * 3]},${pos[v * 3 + 1]},${pos[v * 3 + 2]}`;
    if (!ids.has(k)) ids.set(k, ids.size);
    idx.push(ids.get(k));
  }
  const edges = new Set();
  for (let t = 0; t < idx.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = idx[t + e], b = idx[t + ((e + 1) % 3)];
      assert.notEqual(a, b, `${label}: degenerate triangle`);
      const k = a + '>' + b;
      assert.ok(!edges.has(k), `${label}: directed edge used twice`);
      edges.add(k);
    }
  }
  for (const k of edges) {
    const [a, b] = k.split('>');
    assert.ok(edges.has(b + '>' + a), `${label}: open edge`);
  }
}

function signedVolume(p) {
  let v = 0;
  for (let k = 0; k < p.length; k += 9) {
    v += (p[k] * (p[k + 4] * p[k + 8] - p[k + 5] * p[k + 7])
      - p[k + 1] * (p[k + 3] * p[k + 8] - p[k + 5] * p[k + 6])
      + p[k + 2] * (p[k + 3] * p[k + 7] - p[k + 4] * p[k + 6])) / 6;
  }
  return v;
}

test('every pattern builds closed, outward-facing solids inside the plate', () => {
  const top = COMMON.base + COMMON.H;
  for (const [pattern, over] of VARIANTS) {
    for (const seed of [1, 2, 1937]) {
      const label = `${pattern} ${JSON.stringify(over)} seed=${seed}`;
      const solids = Core.build(pattern, params(pattern, over), { ...COMMON, seed });
      assert.ok(solids.length > 1, `${label}: produced no relief`);
      for (const s of solids) {
        const { pos } = Core.triangulate([s]);
        assertClosed(pos, label);
        assert.ok(signedVolume(pos) > 0, `${label}: inside-out or empty solid`);
        for (let i = 0; i < pos.length; i += 3) {
          assert.ok(pos[i] >= -1e-3 && pos[i] <= COMMON.W + 1e-3, `${label}: x out of plate`);
          assert.ok(pos[i + 1] >= -1e-3 && pos[i + 1] <= COMMON.D + 1e-3, `${label}: y out of plate`);
          assert.ok(pos[i + 2] >= -1e-3 && pos[i + 2] <= top + 1e-3, `${label}: z out of range`);
        }
      }
    }
  }
});

test('clipping a cube by a diagonal plane keeps a closed solid', () => {
  const cube = Core.convexHull([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0], [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10]]);
  const n = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];
  const cut = Core.clipHull(cube, n, 10 / Math.sqrt(3) * 1.5);     // plane x+y+z = 15: hexagonal section
  const { pos } = Core.triangulate([{ faces: cut.faces, tone: 0, uo: 0, vo: 0 }]);
  assertClosed(pos, 'cut cube');
  assert.ok(Math.abs(signedVolume(pos) - 500) < 1e-3, 'half of the cube remains');
  assert.equal(Core.clipHull(cube, [1, 0, 0], -1), null, 'fully clipped away');
});

test('monolith heightfield is watertight and tiles seamlessly', () => {
  const seamless = [
    ['pile', {}], ['blocks', {}], ['pyramids', { layout: 'diamond' }], ['pyramids', { layout: 'triangle' }],
    ['fins', {}], ['fins', { orient: 'h' }], ['folds', { grad: 'none' }], ['folds', { grad: 'noise' }],
  ];
  for (const [pattern, over] of seamless) {
    const label = `${pattern} ${JSON.stringify(over)}`;
    const solids = Core.build(pattern, params(pattern, over), COMMON);
    const hf = Core.rasterize(solids, COMMON.W, COMMON.D, 1);
    const gx = hf.nx + 1;
    for (let j = 0; j <= hf.ny; j++) {
      assert.ok(Math.abs(hf.z[j * gx] - hf.z[j * gx + hf.nx]) < 1e-3, `${label}: left/right seam differs at row ${j}`);
    }
    for (let i = 0; i <= hf.nx; i++) {
      assert.ok(Math.abs(hf.z[i] - hf.z[hf.ny * gx + i]) < 1e-3, `${label}: bottom/top seam differs at column ${i}`);
    }
    const zmax = Math.max(...hf.z), zmin = Math.min(...hf.z);
    assert.ok(zmin >= COMMON.base - 1e-3 && zmax <= COMMON.base + COMMON.H + 1e-3, `${label}: heights out of range`);
    assert.ok(zmax > COMMON.base + 1, `${label}: flat heightfield`);
    const pos = Core.heightfieldMesh(hf);
    assertClosed(pos, label);
    const vol = signedVolume(pos);
    assert.ok(vol > COMMON.W * COMMON.D * COMMON.base * 0.99, `${label}: volume below the base slab`);
  }
});

test('heightfield samples the exact top of the union', () => {
  const solids = Core.build('blocks', params('blocks', { mode: 'checker', joint: 0, chamfer: 0, minDepth: 0.5 }), COMMON);
  const hf = Core.rasterize(solids, COMMON.W, COMMON.D, 2.5);
  const at = (x, y) => hf.z[Math.round(y / 2.5) * (hf.nx + 1) + Math.round(x / 2.5)];
  // 8×8 cells of 20 mm; checker: (0,0) low, (1,0) high
  assert.ok(Math.abs(at(10, 10) - (COMMON.base + COMMON.H * 0.5)) < 1e-4);
  assert.ok(Math.abs(at(30, 10) - (COMMON.base + COMMON.H)) < 1e-4);
});

test('binary STL layout', () => {
  const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1]);
  const buf = Core.toSTL(pos, 'hello');
  const dv = new DataView(buf);
  assert.equal(buf.byteLength, 84 + 2 * 50);
  assert.equal(dv.getUint32(80, true), 2);
  assert.equal(String.fromCharCode(...new Uint8Array(buf, 0, 5)), 'hello');
  assert.deepEqual([dv.getFloat32(84, true), dv.getFloat32(88, true), dv.getFloat32(92, true)], [0, 0, 1]);
  assert.deepEqual([dv.getFloat32(134, true), dv.getFloat32(138, true), dv.getFloat32(142, true)], [1, 0, 0]);
});

test('16-bit PNG heightmap round-trips', async () => {
  const hf = { nx: 3, ny: 2, W: 3, D: 2, z: new Float32Array(12) };
  for (let k = 0; k < 12; k++) hf.z[k] = 10 + k;                 // zmin=10, zmax=21
  const png = await Core.heightmapPNG(hf, 10, 21);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const dv = new DataView(png.buffer, png.byteOffset);
  let o = 8, idat = null;
  const crcOf = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
    return (c ^ 0xffffffff) >>> 0;
  };
  while (o < png.length) {
    const n = dv.getUint32(o), type = String.fromCharCode(...png.subarray(o + 4, o + 8));
    assert.equal(dv.getUint32(o + 8 + n), crcOf(png.subarray(o + 4, o + 8 + n)), `${type} CRC`);
    if (type === 'IHDR') {
      assert.equal(dv.getUint32(o + 8), 4); assert.equal(dv.getUint32(o + 12), 3);
      assert.equal(png[o + 16], 16); assert.equal(png[o + 17], 0);
    }
    if (type === 'IDAT') idat = png.subarray(o + 8, o + 8 + n);
    o += 12 + n;
  }
  const raw = inflateSync(idat);
  assert.equal(raw.length, 3 * (1 + 4 * 2));
  for (let r = 0; r < 3; r++) {
    const row = raw.subarray(r * 9, r * 9 + 9);
    assert.equal(row[0], 1);
    const bytes = [];                                             // undo the Sub filter
    for (let i = 1; i < 9; i++) bytes.push((row[i] + (i > 2 ? bytes[i - 3] : 0)) & 255);
    for (let i = 0; i < 4; i++) {
      const v = (bytes[i * 2] << 8) | bytes[i * 2 + 1];
      const j = 2 - r;                                            // top row = far edge
      assert.equal(v, Math.round(((hf.z[j * 4 + i] - 10) / 11) * 65535));
    }
  }
});
