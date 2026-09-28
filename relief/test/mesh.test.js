import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMesh, estimateTriangles } from '../src/mesh.js';
import { createField, PATTERNS } from '../src/patterns.js';
import { meshToSTL } from '../src/stl.js';

// Every directed edge must appear exactly once and its reverse exactly once:
// the surface is closed and consistently oriented.
function assertWatertight({ indices, positions }) {
  const edges = new Map();
  const n = positions.length / 3;
  const key = (a, b) => a * n + b;
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = indices[t + e], b = indices[t + ((e + 1) % 3)];
      assert.notEqual(a, b, 'degenerate triangle');
      const k = key(a, b);
      assert.ok(!edges.has(k), `directed edge ${a}->${b} used twice`);
      edges.set(k, true);
    }
  }
  for (const k of edges.keys()) {
    const a = Math.floor(k / n), b = k % n;
    assert.ok(edges.has(key(b, a)), `open edge ${a}->${b}`);
  }
}

function signedVolume({ indices, positions: p }) {
  let v = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
    v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
      - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
      + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
  }
  return v;
}

const flat = () => 0;

test('rect plate is watertight, outward and sized in mm', () => {
  const shape = { shape: 'rect', width: 30, height: 20, base: 2, depth: 3, resolution: 1 };
  const mesh = buildMesh(shape, flat);
  assertWatertight(mesh);
  assert.ok(Math.abs(signedVolume(mesh) - 30 * 20 * 2) < 1e-3);
  assert.equal(mesh.indices.length / 3, estimateTriangles(shape));
});

test('disk plate is watertight and outward', () => {
  const shape = { shape: 'disk', diameter: 40, base: 2, depth: 3, resolution: 1 };
  const mesh = buildMesh(shape, flat);
  assertWatertight(mesh);
  const v = signedVolume(mesh);
  assert.ok(v > 0.99 * Math.PI * 400 * 2 && v < Math.PI * 400 * 2);
  assert.equal(mesh.indices.length / 3, estimateTriangles(shape));
});

test('sphere is watertight and outward', () => {
  const shape = { shape: 'sphere', diameter: 40, depth: 3, resolution: 1 };
  const mesh = buildMesh(shape, () => 1);
  assertWatertight(mesh);
  const v = signedVolume(mesh);
  const ideal = (4 / 3) * Math.PI * 20 ** 3;
  assert.ok(v > 0.99 * ideal && v < ideal);
  assert.equal(mesh.indices.length / 3, estimateTriangles(shape));
});

test('every pattern stays in [0, 1] and is deterministic per seed', () => {
  for (const pattern of Object.keys(PATTERNS)) {
    for (const invert of [false, true]) {
      const f = createField({ pattern, seed: 3, warp: 0.8, invert });
      const g = createField({ pattern, seed: 3, warp: 0.8, invert });
      let min = 1, max = 0;
      for (let i = 0; i < 2000; i++) {
        const x = (i % 50) * 1.7 - 40, y = Math.floor(i / 50) * 2.3 - 40, z = (i % 7) * 3;
        const v = f(x, y, z);
        assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, `${pattern}: ${v}`);
        assert.equal(v, g(x, y, z));
        min = Math.min(min, v); max = Math.max(max, v);
      }
      assert.ok(max - min > 0.3, `${pattern} has too little contrast`);
    }
  }
});

test('textured plate heights respect base and depth', () => {
  const shape = { shape: 'rect', width: 50, height: 50, base: 1.5, depth: 4, resolution: 1 };
  const mesh = buildMesh(shape, createField({ pattern: 'topo' }));
  assertWatertight(mesh);
  let zmax = 0;
  for (let i = 2; i < mesh.positions.length; i += 3) zmax = Math.max(zmax, mesh.positions[i]);
  assert.ok(zmax <= 5.5 + 1e-6 && zmax > 3);
});

test('binary STL has the right size and triangle count', () => {
  const mesh = buildMesh({ shape: 'rect', width: 10, height: 10, resolution: 2 }, flat);
  const buf = meshToSTL(mesh);
  const tris = mesh.indices.length / 3;
  assert.equal(buf.byteLength, 84 + 50 * tris);
  assert.equal(new DataView(buf).getUint32(80, true), tris);
});
