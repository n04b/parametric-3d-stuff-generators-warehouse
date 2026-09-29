import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// The geometry core lives inside index.html between CORE markers (single-file tool).
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('// ===== CORE:BEGIN'), html.indexOf('// ===== CORE:END'));
const Core = new Function(src + '\nreturn GlyphCore;')();

const params = (over = {}) => ({ ...Core.defaults(), ...over });

// Small panels that exercise every branch: flows, rotations, shapes, profiles, emboss, zero gap.
const VARIANTS = [
  {},
  { text: 'AB C^D~', flow: 'snake', rot: 'both', blank: 'dome', jitter: 1.5 },
  { text: 'ЖЁЙ 09', flow: 'cols', profile: 'round', ends: 'round', blank: 'roof', rot: 'rot' },
  { text: 'SOS', mode: 'emboss', gap: 0, border: 0, bevelW: 0, blank: 'flat' },
  { text: 'X ', flow: 'random', blank: 'pit', border: 4, gap: 2, bevelDrop: 6, H: 6 },
  { text: 'ЩЫЮЯ?!', flow: 'diag', rot: 'mirror', weight: 0.3, margin: 0 },
];
const SMALL = { cols: 3, rows: 2, tile: 16 };

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

test('every glyph compiles, fits its box and actually cuts the tile', () => {
  const chars = [...Object.keys(Core.FONT), ...Object.keys(Core.ALIAS)];
  for (const ch of chars) {
    const g = Core.glyphFor(ch).glyph;
    assert.ok(g && g.prims.length, `${ch}: no glyph`);
    const [x0, y0, x1, y1] = g.box;
    assert.ok(x0 >= -0.05 && y0 >= -0.05 && x1 <= 1.05 && y1 <= 1.05, `${ch}: box ${g.box}`);
    for (const q of g.prims) for (const v of Object.values(q)) if (typeof v === 'number') assert.ok(isFinite(v), `${ch}: NaN in font`);
    const L = Core.layout(params({ text: ch, cols: 1, rows: 1 }));
    const P = L.P, top = P.top0;
    let cut = 0;
    for (let y = 0; y <= P.T; y += 0.25) for (let x = 0; x <= P.T; x += 0.25) {
      if (Core.tileZ(P, L.tiles[0], x, y) < top - 0.5 * P.depth) cut++;
    }
    assert.ok(cut > 20, `${ch}: glyph leaves no cut`);
  }
  // lower case and Cyrillic look-alikes resolve to the same shapes
  assert.equal(Core.glyphFor('a').glyph, Core.GLYPHS.A);
  assert.equal(Core.glyphFor('р').glyph, Core.GLYPHS.P);
  assert.equal(Core.glyphFor(' ').glyph, undefined);
  assert.ok(!Core.supported('@'));
});

test('stroke ends: free ends are square, ends running into another stroke are round', () => {
  const T = Core.GLYPHS.T;                 // bar 0,1–1,1 and stem .5,1–.5,0
  const [bar, stem] = T.prims;
  assert.ok(bar.eA.cap && bar.eB.cap, 'free bar ends get caps');
  assert.ok(stem.eB.cap, 'free stem foot gets a cap');
  assert.ok(!stem.eA.cap, 'stem top runs into the bar');
  const L = Core.GLYPHS.L;                 // right-angle corner: mitred by both caps
  assert.ok(L.prims[0].eB.cap && L.prims[1].eA.cap);
  const V = Core.GLYPHS.V;                 // sharp corner stays round
  assert.ok(!V.prims[0].eB.cap && !V.prims[1].eA.cap);
  // square cap: the distance field is a box around the end, not a disc
  const d = Core.glyphDist(Core.GLYPHS.I, 0.6, -0.1, true);
  assert.ok(Math.abs(d - 0.1) < 1e-9);
  assert.ok(Math.abs(Core.glyphDist(Core.GLYPHS.I, 0.6, -0.1, false) - Math.hypot(0.1, 0.1)) < 1e-9);
});

test('text flows through the grid in the chosen order', () => {
  const at = (L, i, r) => L.tiles[(L.P.rows - 1 - r) * L.P.cols + i].ch;
  const rows = Core.layout(params({ text: 'ABCDEF', cols: 4, rows: 3, flow: 'rows' }));
  assert.deepEqual([0, 1, 2, 3].map((i) => at(rows, i, 0)), ['A', 'B', 'C', 'D']);
  assert.deepEqual([0, 1].map((i) => at(rows, i, 1)), ['E', 'F']);
  const snake = Core.layout(params({ text: 'ABCDEFGH', cols: 4, rows: 2, flow: 'snake' }));
  assert.deepEqual([0, 1, 2, 3].map((i) => at(snake, i, 1)), ['H', 'G', 'F', 'E']);
  const shift = Core.layout(params({ text: 'ABCDE', cols: 3, rows: 2, flow: 'shift', shift: 2 }));
  assert.deepEqual([0, 1, 2].map((i) => at(shift, i, 1)), ['C', 'D', 'E']);
  const cols = Core.layout(params({ text: 'ABCD', cols: 2, rows: 2, flow: 'cols' }));
  assert.equal(at(cols, 0, 1), 'B');
  assert.equal(at(cols, 1, 0), 'C');
  // top row is at the far edge (large y)
  assert.equal(Core.tileAt(rows, 1, rows.D - 1).ch, 'A');
});

test('panel mesh is watertight, outward-facing and inside its bounds', () => {
  for (const over of VARIANTS) {
    const p = params({ ...SMALL, ...over });
    const L = Core.layout(p);
    const label = JSON.stringify(over);
    const pos = Core.heightfieldMesh(Core.samplePanel(L, 0.8));
    assertClosed(pos, label);
    assert.ok(signedVolume(pos) > 0, `${label}: inside-out`);
    let zmax = 0;
    for (let i = 0; i < pos.length; i += 3) {
      assert.ok(pos[i] >= 0 && pos[i] <= L.W + 1e-4, `${label}: x out of panel`);
      assert.ok(pos[i + 1] >= 0 && pos[i + 1] <= L.D + 1e-4, `${label}: y out of panel`);
      assert.ok(pos[i + 2] >= 0 && pos[i + 2] <= L.top + 1e-4, `${label}: z out of range`);
      zmax = Math.max(zmax, pos[i + 2]);
    }
    assert.ok(zmax > p.base + 0.5, `${label}: flat panel`);
  }
});

test('grid lines hit tile edges exactly, so seams are vertical and ridges crisp', () => {
  const L = Core.layout(params({ ...SMALL, gap: 2, border: 3, text: ' ', blank: 'flat' }));
  const { xs } = Core.panelAxes(L, 0.7);
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1], 'axis is strictly increasing');
  const P = L.P;
  for (let i = 0; i < P.cols; i++) {
    const a = P.border + i * P.pitch + P.gap / 2;
    for (const f of [a + P.bw, a + P.T / 2, a + P.T - P.bw]) {
      assert.ok(xs.some((x) => Math.abs(x - f) < 1e-9), `feature ${f} on the grid`);
    }
    // seam on one side, tile on the other, a few microns apart
    assert.equal(Core.heightAt(L, a - 0.004, P.T / 2 + P.border + P.gap / 2), P.base);
    assert.ok(Core.heightAt(L, a + 0.004, P.border + P.gap / 2 + P.T / 2) > P.base + P.H - P.drop - 0.01);
  }
});

test('loose tiles: one closed solid per unique tile, and a layout map', () => {
  const L = Core.layout(params({ ...SMALL, text: 'ABA ^', rot: 'both' }));
  const uniq = Core.uniqueTiles(L);
  assert.equal(uniq.reduce((s, u) => s + u.count, 0), L.tiles.length);
  const names = new Set();
  for (const u of uniq) {
    const pos = Core.heightfieldMesh(Core.sampleTile(L, u.tile, 0.5));
    assertClosed(pos, u.key);
    assert.ok(signedVolume(pos) > 0);
    for (let i = 0; i < pos.length; i += 3) assert.ok(pos[i] >= 0 && pos[i] <= L.P.T + 1e-4);
    const n = Core.tileFileName(u.tile);
    assert.ok(/^[\w\-А-ЯЁ]+$/.test(n), n);
    assert.ok(!names.has(n), `duplicate file name ${n}`);
    names.add(n);
  }
  const map = Core.layoutText(L).split('\n');
  assert.equal(map.length, 3 + L.P.rows + 1);
  assert.equal(Core.tileFileName({ glyph: {}, ch: '?', mir: false }), 'tile-u003F');
});

test('binary STL and ZIP are well-formed', () => {
  const L = Core.layout(params({ cols: 1, rows: 1 }));
  const pos = Core.heightfieldMesh(Core.sampleTile(L, L.tiles[0], 1));
  const stl = Core.toSTL(pos, 'test');
  const dv = new DataView(stl);
  assert.equal(dv.getUint32(80, true), pos.length / 9);
  assert.equal(stl.byteLength, 84 + 50 * (pos.length / 9));

  const a = new Uint8Array([1, 2, 3, 4, 5]), b = new TextEncoder().encode('hello');
  const z = Core.zip([{ name: 'a.bin', data: a }, { name: 'Ж.txt', data: b }]);
  const zv = new DataView(z.buffer);
  assert.equal(zv.getUint32(0, true), 0x04034b50);
  const eocd = z.length - 22;
  assert.equal(zv.getUint32(eocd, true), 0x06054b50);
  assert.equal(zv.getUint16(eocd + 10, true), 2);
  let cd = zv.getUint32(eocd + 16, true);
  for (const [name, data] of [['a.bin', a], ['Ж.txt', b]]) {
    assert.equal(zv.getUint32(cd, true), 0x02014b50);
    assert.equal(zv.getUint32(cd + 16, true), Core.crc32(data));
    const nl = zv.getUint16(cd + 28, true), off = zv.getUint32(cd + 42, true);
    assert.equal(new TextDecoder().decode(z.subarray(cd + 46, cd + 46 + nl)), name);
    const lnl = zv.getUint16(off + 26, true);
    assert.deepEqual(z.subarray(off + 30 + lnl, off + 30 + lnl + data.length), data);
    cd += 46 + nl;
  }
  assert.equal(Core.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('16-bit PNG height map decodes to the panel heights', async () => {
  const L = Core.layout(params({ cols: 2, rows: 1, tile: 10 }));
  const { png, w, h } = await Core.heightmapPNG(L, 1, 0, L.top);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const dv = new DataView(png.buffer);
  assert.equal(dv.getUint32(16), w);
  assert.equal(dv.getUint32(20), h);
  const idatLen = dv.getUint32(33);
  const raw = inflateSync(png.subarray(41, 41 + idatLen));
  const stride = w * 2 + 1;
  // first pixel of the bottom image row = corner (0,0) = seam level
  const o = (h - 1) * stride;
  const v = (raw[o + 1] << 8) | raw[o + 2];
  assert.ok(Math.abs((v / 65535) * L.top - L.P.base) < 0.01);
});
