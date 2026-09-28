/* Tiles — geometry core.
 *
 * Builds a wall installation out of separate, individually printable parts
 * (pyramids / spikes, tilted blocks, sheared cubes, cylinders, drops) laid out
 * on a rectangular or radial grid. All units are millimetres; the wall is the
 * XY plane and every part stands on it at z = 0, growing towards +Z.
 *
 * No dependencies: works as a classic <script> (window.TileCore) and in Node
 * (module.exports) so the meshes can be checked in tests.
 */
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  /* ------------------------------------------------------------------ */
  /* Defaults & presets                                                  */
  /* ------------------------------------------------------------------ */

  const DEFAULTS = {
    seed: 7,
    // layout
    layout: 'rect',          // rect | radial | hex
    W: 400, H: 400,          // rect / hex: panel size, mm
    cols: 12, rows: 12,      // hex uses cols only: cells across the width
    hexShape: 'rect',        // hex: rect | hexagon
    hexOrient: 'pointy',     // hex: pointy | flat (which side of the cell faces up)
    hexRings: 6,             // hex hexagon: rings around the centre cell
    hexSize: 40,             // hex hexagon: cell size across flats, mm
    rIn: 0,                  // radial: inner radius, mm
    rings: 8,
    ringW: 25,               // mm
    segMode: 'equal',        // equal | fixed
    segs: 24,
    aspect: 1,               // equal mode: cell arc length / ring width
    stagger: true,           // rotate every other ring by half a cell
    arcDiv: 1,               // facets per cell arc
    centerPiece: true,
    startAng: 0,             // deg
    gap: 0.8,                // mm between neighbouring parts
    // part shape
    foot: 'cell',            // cell | circle | drop
    sides: 24,               // circle / drop resolution
    dropLen: 1.9,            // drop: tip distance / radius
    fScale: 1,               // footprint scale inside the cell (<= 1)
    sizeLink: 0,             // footprint shrinks with low height
    topScale: 0,             // 0 = pyramid apex, 1 = prism
    curv: 0,                 // profile: >0 domed, <0 concave
    layers: 6,
    plinth: 1,               // straight wall at the base, mm
    // height
    hMin: 20, hMax: 30,
    h_mode: 'const', h_angle: 90, h_px: 0, h_py: 0, h_freq: 1, h_phase: 0, h_noise: 1.5, h_jit: 0, h_gamma: 1, h_inv: false,
    // lean
    offset: 0.5,             // lateral shift of the top, in cell sizes
    tilt: 0,                 // top plane tilt, deg
    twist: 0,                // top rotation, deg
    twistJit: 0,             // random extra rotation, deg
    // direction field
    d_mode: 'point', d_angle: 0, d_px: 0, d_py: 0, d_rot: 0, d_amp: 90, d_freq: 1, d_wAngle: 90, d_noise: 1.2, d_jit: 0,
    // intensity field (scales offset / tilt / twist)
    iMin: 0,
    i_mode: 'radial', i_angle: 0, i_px: 0, i_py: 0, i_freq: 1, i_phase: 0, i_noise: 1.5, i_jit: 0, i_gamma: 1, i_inv: false,
    // colour groups
    colMain: '#ebe7df', colAcc: '#8e8b88',
    acc: 'none',             // none | random | checker | border | stripes | height
    accN: 1, accP: 0.2,
    // backboard
    board: true, bMargin: 25, bThick: 6, colBoard: '#f4f2ee',
    // export
    exBoard: false, bedX: 220, bedY: 220, bedGap: 3,
    // view
    lightAz: 135, lightEl: 32,
  };

  // Each preset only lists what differs from DEFAULTS.
  const PRESETS = [
    {
      name: 'Бумажные волны',
      p: {
        W: 420, H: 600, cols: 20, rows: 14, gap: 0.6, topScale: 0, plinth: 0.8,
        hMin: 18, hMax: 26, h_mode: 'noise', h_noise: 1.2,
        offset: 0.42, d_mode: 'wave', d_angle: 0, d_amp: 180, d_freq: 0.8, d_wAngle: 20, d_jit: 6,
        iMin: 0.35, i_mode: 'noise', i_noise: 1.4, colMain: '#f1ede4', board: true, bMargin: 20,
      },
    },
    {
      name: 'Наклонные блоки',
      p: {
        W: 400, H: 420, cols: 13, rows: 14, gap: 1.2, topScale: 1, plinth: 0,
        hMin: 30, hMax: 40, h_mode: 'noise', h_noise: 1,
        offset: 0, tilt: 42, d_mode: 'noise', d_angle: -90, d_amp: 70, d_noise: 1.3,
        iMin: 0.05, i_mode: 'linear', i_angle: -90, i_jit: 0.35, i_gamma: 0.8,
        colMain: '#e8e3d8', colBoard: '#e6e2da', bMargin: 15,
      },
    },
    {
      name: 'Капли',
      p: {
        W: 360, H: 400, cols: 9, rows: 10, gap: 1, foot: 'drop', sides: 16, dropLen: 1.9, fScale: 1,
        topScale: 0, curv: 1.3, layers: 7, plinth: 0,
        hMin: 28, hMax: 42, h_mode: 'radial', h_px: 0.1, h_py: 0.2, h_inv: true,
        offset: 0.55, d_mode: 'point', d_px: 0.1, d_py: 0.2, d_rot: 115, d_jit: 8,
        iMin: 0.35, i_mode: 'radial', i_px: 0.1, i_py: 0.2,
        colMain: '#5fc4ba', board: false,
      },
    },
    {
      name: 'Медная звезда',
      p: {
        W: 480, H: 480, cols: 16, rows: 16, gap: 0.6, topScale: 0, plinth: 1,
        hMin: 18, hMax: 34, h_mode: 'radial', h_px: 0.12, h_py: 0.05, h_gamma: 1.4,
        offset: 1.1, d_mode: 'point', d_px: 0.12, d_py: 0.05, d_rot: 0,
        iMin: 0, i_mode: 'radial', i_px: 0.12, i_py: 0.05, i_gamma: 1.3,
        colMain: '#c98462', colAcc: '#8d8986', acc: 'border', accN: 1, board: false,
      },
    },
    {
      name: 'Диагональ',
      p: {
        W: 400, H: 400, cols: 8, rows: 8, gap: 0.8, topScale: 0, plinth: 1,
        hMin: 24, hMax: 30, h_mode: 'const',
        offset: 1.5, d_mode: 'linear', d_angle: 22, d_jit: 3,
        iMin: 0, i_mode: 'wave', i_angle: -45, i_freq: 0.5, i_phase: 90, i_gamma: 1.2,
        colMain: '#f3f0ea', board: true,
      },
    },
    {
      name: 'Кубики',
      p: {
        W: 400, H: 400, cols: 8, rows: 8, gap: 3, topScale: 1, plinth: 0,
        hMin: 40, hMax: 46, h_mode: 'random',
        offset: 0.1, tilt: 24, d_mode: 'random', twist: 0, twistJit: 8,
        iMin: 0.35, i_mode: 'random', colMain: '#f2efe9', board: true, bMargin: 50,
      },
    },
    {
      name: 'Цилиндры',
      p: {
        W: 400, H: 400, cols: 17, rows: 17, gap: 1, foot: 'circle', sides: 32, fScale: 0.72, sizeLink: 0.35,
        topScale: 1, plinth: 0, hMin: 6, hMax: 42, h_mode: 'wave', h_angle: 30, h_freq: 0.7, h_phase: 30,
        offset: 0, tilt: 0, colMain: '#ece6d8', colBoard: '#1e1e1e', bMargin: 30,
      },
    },
    {
      name: 'Шипы из угла',
      p: {
        W: 300, H: 375, cols: 12, rows: 15, gap: 0.6, topScale: 0, plinth: 1,
        hMin: 16, hMax: 22, h_mode: 'radial', h_px: -1.1, h_py: -1.2,
        offset: 1.0, d_mode: 'point', d_px: -1.1, d_py: -1.2, d_rot: 0,
        iMin: 0, i_mode: 'radial', i_px: -1.1, i_py: -1.2, i_gamma: 0.9,
        colMain: '#f4f1eb', board: false,
      },
    },
    {
      name: 'Вихрь',
      p: {
        W: 420, H: 420, cols: 12, rows: 12, gap: 0.8, topScale: 0.42, plinth: 0,
        hMin: 20, hMax: 40, h_mode: 'radial', h_inv: true, h_gamma: 0.8,
        offset: 0.6, d_mode: 'point', d_rot: 100,
        iMin: 0.1, i_mode: 'radial', colMain: '#dcd8d0', colBoard: '#161616', bMargin: 45,
      },
    },
    {
      name: 'Соты',
      p: {
        layout: 'hex', hexShape: 'rect', hexOrient: 'pointy', W: 420, H: 420, cols: 12, gap: 0.8,
        topScale: 0, plinth: 1, hMin: 16, hMax: 28, h_mode: 'radial', h_inv: true,
        offset: 0.55, d_mode: 'point', d_rot: 0, iMin: 0, i_mode: 'radial', i_gamma: 1.2,
        colMain: '#eee9df', board: true, bMargin: 20,
      },
    },
    {
      name: 'Шестиугольник',
      p: {
        layout: 'hex', hexShape: 'hexagon', hexOrient: 'flat', hexRings: 6, hexSize: 38, gap: 1,
        topScale: 0.5, plinth: 0, hMin: 14, hMax: 34, h_mode: 'ring', h_freq: 1.2,
        offset: 0.35, tilt: 18, d_mode: 'point', d_rot: 90, iMin: 0.2, i_mode: 'radial',
        colMain: '#e9e4da', colAcc: '#c7a27c', acc: 'checker', colBoard: '#232323', board: true, bMargin: 18,
      },
    },
    {
      name: 'Радиальная звезда',
      p: {
        layout: 'radial', rIn: 0, rings: 9, ringW: 22, segMode: 'equal', aspect: 1, stagger: true, arcDiv: 1,
        gap: 0.8, topScale: 0, plinth: 1, hMin: 16, hMax: 28, h_mode: 'radial', h_inv: true,
        offset: 0.7, d_mode: 'point', d_rot: 0, iMin: 0, i_mode: 'radial',
        colMain: '#efebe3', acc: 'stripes', accN: 3, colAcc: '#b9b3a8', board: true,
      },
    },
    {
      name: 'Радиальный вихрь',
      p: {
        layout: 'radial', rIn: 24, rings: 8, ringW: 24, segMode: 'fixed', segs: 28, stagger: false, arcDiv: 2,
        centerPiece: true, gap: 0.8, topScale: 0.4, plinth: 0, hMin: 18, hMax: 36, h_mode: 'radial', h_inv: true,
        offset: 0.5, twist: 25, d_mode: 'point', d_rot: 90, iMin: 0.15, i_mode: 'radial',
        colMain: '#e2ddd3', colBoard: '#202020', board: true, bMargin: 20,
      },
    },
    {
      name: 'Радиальные цилиндры',
      p: {
        layout: 'radial', rIn: 0, rings: 10, ringW: 20, segMode: 'equal', aspect: 1, stagger: true,
        gap: 1, foot: 'circle', sides: 28, fScale: 0.8, sizeLink: 0.3, topScale: 1, plinth: 0,
        hMin: 5, hMax: 38, h_mode: 'ring', h_freq: 1.5, h_phase: 0,
        offset: 0, tilt: 0, colMain: '#efe9dd', colBoard: '#1f1f1f', bMargin: 20,
      },
    },
  ];

  /* ------------------------------------------------------------------ */
  /* Random & noise                                                      */
  /* ------------------------------------------------------------------ */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngFor = (seed, stream) => mulberry32((seed * 7919 + stream * 104729) | 0);

  function makeNoise(seed) {
    const rnd = rngFor(seed, 99);
    const perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y) => { const g = G[h & 7]; return g[0] * x + g[1] * y; };
    function perlin(x, y) {
      let X = Math.floor(x), Y = Math.floor(y);
      x -= X; y -= Y; X &= 255; Y &= 255;
      const u = fade(x), v = fade(y);
      const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
      const l1 = grad(aa, x, y) + (grad(ba, x - 1, y) - grad(aa, x, y)) * u;
      const l2 = grad(ab, x, y - 1) + (grad(bb, x - 1, y - 1) - grad(ab, x, y - 1)) * u;
      return l1 + (l2 - l1) * v;
    }
    return function fbm(x, y) {
      let s = 0, a = 0.5, f = 1, n = 0;
      for (let o = 0; o < 3; o++) { s += a * perlin(x * f + 17.3 * o, y * f - 9.1 * o); n += a; a *= 0.5; f *= 2; }
      return s / n; // roughly -0.7..0.7
    };
  }

  /* ------------------------------------------------------------------ */
  /* 2D polygon helpers                                                  */
  /* ------------------------------------------------------------------ */

  function signedArea(poly) {
    let a = 0;
    for (let i = 0, n = poly.length; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a / 2;
  }
  const ccw = (poly) => (signedArea(poly) < 0 ? poly.slice().reverse() : poly);

  function centroid(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, n = poly.length; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      const c = p[0] * q[1] - q[0] * p[1];
      a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
    }
    if (Math.abs(a) < 1e-12) {
      let x = 0, y = 0;
      for (const p of poly) { x += p[0]; y += p[1]; }
      return [x / poly.length, y / poly.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }

  // Shrink a CCW polygon by d (mm). Returns null when the polygon collapses.
  function inset(poly, d) {
    if (d === 0) return poly.slice();
    const n = poly.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = poly[(i - 1 + n) % n], p = poly[i], b = poly[(i + 1) % n];
      const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]];
      const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
      const n1 = [-e1[1] / l1, e1[0] / l1], n2 = [-e2[1] / l2, e2[0] / l2];
      const cr = e1[0] * e2[1] - e1[1] * e2[0];
      if (Math.abs(cr) < 1e-9 * l1 * l2) {
        out.push([p[0] + n1[0] * d, p[1] + n1[1] * d]);
        continue;
      }
      const w = [(n2[0] - n1[0]) * d, (n2[1] - n1[1]) * d];
      const t = (w[0] * e2[1] - w[1] * e2[0]) / cr;
      out.push([p[0] + n1[0] * d + t * e1[0], p[1] + n1[1] * d + t * e1[1]]);
    }
    // every edge must keep its direction, otherwise the polygon flipped
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ex = poly[j][0] - poly[i][0], ey = poly[j][1] - poly[i][1];
      const fx = out[j][0] - out[i][0], fy = out[j][1] - out[i][1];
      if (ex * fx + ey * fy <= 0) return null;
    }
    if (signedArea(out) <= 1e-6) return null;
    return out;
  }

  function inradius(poly, c) {
    let r = Infinity;
    for (let i = 0, n = poly.length; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      const ex = q[0] - p[0], ey = q[1] - p[1], l = Math.hypot(ex, ey);
      if (l < 1e-9) continue;
      r = Math.min(r, Math.abs((c[0] - p[0]) * ey - (c[1] - p[1]) * ex) / l);
    }
    return r;
  }

  const cross3 = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

  function isConvex(poly) {
    for (let i = 0, n = poly.length; i < n; i++) {
      if (cross3(poly[i], poly[(i + 1) % n], poly[(i + 2) % n]) < -1e-9) return false;
    }
    return true;
  }

  // Ear clipping for a simple CCW polygon; triangles are CCW index triples.
  function triangulate(poly) {
    const n = poly.length, tris = [];
    if (isConvex(poly)) {
      for (let i = 1; i < n - 1; i++) tris.push([0, i, i + 1]);
      return tris;
    }
    const idx = Array.from({ length: n }, (_, i) => i);
    const inTri = (p, a, b, c) => cross3(a, b, p) > 1e-12 && cross3(b, c, p) > 1e-12 && cross3(c, a, p) > 1e-12;
    let guard = 0;
    while (idx.length > 3 && guard++ < 100000) {
      let clipped = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k - 1 + idx.length) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
        const a = poly[i0], b = poly[i1], c = poly[i2];
        if (cross3(a, b, c) <= 1e-12) continue;
        let blocked = false;
        for (const j of idx) {
          if (j !== i0 && j !== i1 && j !== i2 && inTri(poly[j], a, b, c)) { blocked = true; break; }
        }
        if (blocked) continue;
        tris.push([i0, i1, i2]);
        idx.splice(k, 1);
        clipped = true;
        break;
      }
      if (!clipped) { tris.push([idx[0], idx[1], idx[2]]); idx.splice(1, 1); }
    }
    tris.push([idx[0], idx[1], idx[2]]);
    return tris;
  }

  /* ------------------------------------------------------------------ */
  /* Layouts → cells                                                     */
  /* ------------------------------------------------------------------ */

  const pad2 = (n) => String(n).padStart(2, '0');

  function layoutRect(P) {
    const cols = Math.max(1, Math.round(P.cols)), rows = Math.max(1, Math.round(P.rows));
    const cw = P.W / cols, ch = P.H / rows, cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = -P.W / 2 + c * cw, y1 = P.H / 2 - r * ch, y0 = y1 - ch;
        cells.push({
          id: 'R' + pad2(r + 1) + 'C' + pad2(c + 1),
          poly: [[x0, y0], [x0 + cw, y0], [x0 + cw, y1], [x0, y1]],
          band: r, parity: (r + c) & 1,
          edge: Math.min(r, c, rows - 1 - r, cols - 1 - c),
        });
      }
    }
    const w = P.W / 2, h = P.H / 2;
    return { cells, outline: [[-w, -h], [w, -h], [w, h], [-w, h]] };
  }

  function layoutRadial(P) {
    const nRings = Math.max(1, Math.round(P.rings));
    const div = Math.max(1, Math.round(P.arcDiv));
    const rings = [];
    for (let k = 0; k < nRings; k++) {
      const r0 = P.rIn + k * P.ringW, r1 = r0 + P.ringW;
      const n = P.segMode === 'fixed'
        ? Math.max(3, Math.round(P.segs))
        : Math.max(3, Math.round((TAU * (r0 + r1) / 2) / (P.ringW * P.aspect)));
      const step = TAU / n;
      const phase = P.startAng * DEG + ((P.stagger && k % 2) ? 0.5 * step : 0);
      rings.push({ r0, r1, n, step, phase, m: n * div });
    }
    // Neighbouring rings with different facet counts would overlap along the
    // shared circle (chords of one poke through the other), so pull the outer
    // edge of the inner ring in to the inscribed circle of the next ring.
    for (let k = 0; k < nRings; k++) {
      const a = rings[k], b = rings[k + 1];
      a.r1e = a.r1;
      if (!b) continue;
      const fstep = TAU / a.m;
      const d = (a.phase - b.phase) / fstep;
      const aligned = a.m === b.m && Math.abs(d - Math.round(d)) < 1e-9;
      if (!aligned) a.r1e = a.r1 * Math.cos(Math.PI / b.m);
    }
    const arc = (r, t0, t1) => {
      const pts = [];
      for (let i = 0; i <= div; i++) {
        const t = t0 + (t1 - t0) * (i / div);
        pts.push([r * Math.cos(t), r * Math.sin(t)]);
      }
      return pts;
    };
    const cells = [];
    const R0 = rings[0];
    if (P.rIn > 1e-6 && P.centerPiece) {
      const poly = [];
      for (let s = 0; s < R0.n; s++) {
        const a0 = R0.phase + s * R0.step;
        poly.push(...arc(P.rIn, a0, a0 + R0.step).slice(0, div));
      }
      cells.push({ id: 'C00', poly, band: -1, parity: 0, edge: nRings });
    }
    rings.forEach((R, k) => {
      for (let s = 0; s < R.n; s++) {
        const a0 = R.phase + s * R.step, a1 = a0 + R.step;
        const outer = arc(R.r1e, a0, a1);
        const inner = R.r0 < 1e-6 ? [[0, 0]] : arc(R.r0, a1, a0);
        cells.push({
          id: 'K' + pad2(k + 1) + 'S' + pad2(s + 1),
          poly: outer.concat(inner),
          band: k, parity: (k + s) & 1, edge: nRings - 1 - k,
        });
      }
    });
    const Rout = P.rIn + nRings * P.ringW;
    return { cells, outline: regularPolygon([0, 0], Rout, 96, 0) };
  }

  // Convex hull (monotone chain), CCW.
  function convexHull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const half = (list) => {
      const h = [];
      for (const q of list) {
        while (h.length >= 2 && cross3(h[h.length - 2], h[h.length - 1], q) <= 1e-9) h.pop();
        h.push(q);
      }
      h.pop();
      return h;
    };
    return half(p).concat(half(p.slice().reverse()));
  }

  // Honeycomb. Cells are built "pointy side up" in a local frame and the whole
  // frame is turned 90° for the flat orientation.
  function layoutHex(P) {
    const flat = P.hexOrient === 'flat';
    const raw = []; // frame centre, band, distance to the edge, 3-colour index
    let s;
    if (P.hexShape === 'hexagon') {
      const N = Math.max(0, Math.round(P.hexRings));
      s = P.hexSize / Math.sqrt(3);
      const w = P.hexSize;
      for (let r = -N; r <= N; r++) {
        for (let q = -N; q <= N; q++) {
          const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
          if (ring > N) continue;
          raw.push({ x: w * (q + r / 2), y: -1.5 * s * r, edge: N - ring, band: ring, tri: (((q - r) % 3) + 3) % 3 });
        }
      }
    } else {
      // frame width runs along the rows, frame height across them
      const cols = Math.max(1, Math.round(P.cols));
      let Wf, Hf;
      if (flat) { Wf = P.H; Hf = P.W; s = P.W / (1.5 * cols + 0.5); }
      else { Wf = P.W; Hf = P.H; s = P.W / (Math.sqrt(3) * cols); }
      const w = Math.sqrt(3) * s;
      const nRows = Math.max(1, Math.floor((Hf - 2 * s) / (1.5 * s) + 1e-9) + 1);
      const n0 = Math.max(1, Math.floor(Wf / w + 1e-9));
      const n1 = Math.max(1, Math.floor((Wf - w / 2) / w + 1e-9));
      const y0 = ((nRows - 1) * 1.5 * s) / 2;
      // odd rows sit half a cell to the right; centre the whole block
      const x0 = -Math.max((n0 - 1) * w, w / 2 + (n1 - 1) * w) / 2;
      for (let r = 0; r < nRows; r++) {
        const n = r % 2 ? n1 : n0;
        for (let c = 0; c < n; c++) {
          const q = c - Math.floor(r / 2); // axial column, for the 3-colour pattern
          raw.push({
            x: x0 + (r % 2 ? w / 2 : 0) + c * w, y: y0 - r * 1.5 * s, band: r,
            edge: Math.min(r, nRows - 1 - r, c, n - 1 - c), tri: (((q - r) % 3) + 3) % 3,
          });
        }
      }
    }
    // turn the frame for flat-top cells: frame x → world y, frame y → world −x
    const place = flat ? (x, y) => [-y, x] : (x, y) => [x, y];
    const cells = raw.map((h) => {
      const poly = regularPolygon([h.x, h.y], s, 6, Math.PI / 6).map((p) => place(p[0], p[1]));
      const c = place(h.x, h.y);
      return { h, poly, c };
    });
    // Numbering: pointy cells form horizontal rows (R top to bottom, C left to
    // right inside the row); flat cells form vertical columns (C left to right,
    // R top to bottom inside the column).
    const lineOf = (k) => Math.round((flat ? k.c[0] : -k.c[1]) * 100);
    const along = (k) => (flat ? -k.c[1] : k.c[0]);
    const keyed = cells.slice().sort((a, b) => lineOf(a) - lineOf(b) || along(a) - along(b));
    let line = -1, pos = 0, last = null;
    for (const k of keyed) {
      const lk = lineOf(k);
      if (lk !== last) { line++; pos = 0; last = lk; }
      pos++;
      k.id = flat ? 'R' + pad2(pos) + 'C' + pad2(line + 1) : 'R' + pad2(line + 1) + 'C' + pad2(pos);
    }
    const out = keyed.map((k) => ({
      id: k.id, poly: k.poly, band: k.h.band, edge: k.h.edge, parity: k.h.tri === 0 ? 1 : 0,
    }));
    const outline = P.hexShape === 'hexagon'
      ? convexHull([].concat(...out.map((c) => c.poly)))
      : [[-P.W / 2, -P.H / 2], [P.W / 2, -P.H / 2], [P.W / 2, P.H / 2], [-P.W / 2, P.H / 2]];
    return { cells: out, outline };
  }

  /* ------------------------------------------------------------------ */
  /* Fields                                                              */
  /* ------------------------------------------------------------------ */

  // Scalar field in 0..1 for every cell. Prefix selects the parameter group.
  function scalarField(P, pre, cells, noise, rnd) {
    const g = (k) => P[pre + '_' + k];
    const mode = g('mode');
    const a = g('angle') * DEG, ux = Math.cos(a), uy = Math.sin(a);
    const px = g('px'), py = g('py'), f = g('freq'), ph = g('phase') * DEG, ns = g('noise');
    const raw = cells.map((c) => {
      const [x, y] = c.pn;
      switch (mode) {
        case 'linear': return x * ux + y * uy;
        case 'radial': return Math.hypot(x - px, y - py);
        case 'wave': return Math.sin(TAU * f * (x * ux + y * uy) + ph);
        case 'ring': return Math.cos(TAU * f * Math.hypot(x - px, y - py) + ph);
        case 'noise': return noise(x * ns + 31.7 * (pre === 'h'), y * ns);
        case 'random': return rnd();
        case 'checker': return c.parity;
        case 'border': return -c.edge;
        default: return 1;
      }
    });
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const span = hi - lo;
    const jit = g('jit'), gam = Math.max(0.05, g('gamma')), inv = g('inv');
    return raw.map((v) => {
      let s = span > 1e-12 ? (v - lo) / span : 1;
      if (jit > 0) s = s * (1 - jit) + rnd() * jit;
      s = Math.pow(Math.min(1, Math.max(0, s)), gam);
      return inv ? 1 - s : s;
    });
  }

  // Lean direction (radians) for every cell.
  function directionField(P, cells, noise, rnd) {
    const a = P.d_angle * DEG, amp = P.d_amp * DEG, wa = P.d_wAngle * DEG;
    const wx = Math.cos(wa), wy = Math.sin(wa);
    return cells.map((c) => {
      const [x, y] = c.pn;
      let t;
      switch (P.d_mode) {
        case 'point': {
          const dx = x - P.d_px, dy = y - P.d_py;
          t = (Math.abs(dx) + Math.abs(dy) < 1e-9 ? 0 : Math.atan2(dy, dx)) + P.d_rot * DEG;
          break;
        }
        case 'wave': t = a + amp * Math.sin(TAU * P.d_freq * (x * wx + y * wy)); break;
        case 'noise': t = a + 2 * amp * noise(x * P.d_noise + 57.1, y * P.d_noise - 12.9) / 0.7; break;
        case 'alternate': t = a + (((c.band % 2) + 2) % 2) * amp; break;
        case 'random': t = rnd() * TAU; break;
        default: t = a;
      }
      if (P.d_jit > 0) t += (rnd() * 2 - 1) * P.d_jit * DEG;
      return t;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Part mesh                                                           */
  /* ------------------------------------------------------------------ */

  function regularPolygon(c, r, n, rot) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = rot + (i / n) * TAU;
      pts.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
    }
    return pts;
  }

  // Teardrop outline: a circle with a pointed tail, the tip towards `ang`.
  // The whole drop fits in a circle of radius R around c.
  function dropPolygon(c, R, e, n, ang) {
    e = Math.max(1.05, e);
    const r = (2 * R) / (1 + e);
    const d = [Math.cos(ang), Math.sin(ang)];
    const C = [c[0] - d[0] * r * (e - 1) / 2, c[1] - d[1] * r * (e - 1) / 2];
    const beta = Math.acos(1 / e);
    const pts = [[C[0] + d[0] * r * e, C[1] + d[1] * r * e]];
    const seg = Math.max(4, n);
    for (let i = 0; i <= seg; i++) {
      const t = ang + beta + (TAU - 2 * beta) * (i / seg);
      pts.push([C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)]);
    }
    return pts;
  }

  /**
   * Lofted solid from a CCW footprint.
   * opt: { h, plinth, topScale, curv, layers, off:[x,y], dir:[x,y], tilt(rad), twist(rad) }
   * Returns a flat array of triangles (9 numbers each), outward-facing.
   */
  function buildPart(foot, c, opt) {
    const out = [];
    const tri = (a, b, d) => out.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]);
    const n = foot.length;
    const apex = opt.topScale < 1e-3;
    const bent = Math.abs(opt.curv) > 1e-3 || Math.abs(opt.twist) > 1e-4;
    const L = bent ? Math.max(2, Math.round(opt.layers)) : 1;
    const expo = Math.pow(2, opt.curv);
    const scaleAt = (t) => 1 - (1 - opt.topScale) * Math.pow(t, expo);

    // keep the lowest point of a tilted top above the plinth
    let tanT = Math.tan(Math.min(opt.tilt, 80 * DEG));
    if (!apex && tanT > 0) {
      const cs = Math.cos(opt.twist), sn = Math.sin(opt.twist);
      let minProj = 0;
      for (const p of foot) {
        const vx = (p[0] - c[0]) * opt.topScale, vy = (p[1] - c[1]) * opt.topScale;
        const rx = vx * cs - vy * sn, ry = vx * sn + vy * cs;
        minProj = Math.min(minProj, rx * opt.dir[0] + ry * opt.dir[1]);
      }
      const minTop = Math.min(0.8, opt.h * 0.5);
      if (minProj < 0) tanT = Math.min(tanT, (opt.h - minTop) / -minProj);
    }

    const ringAt = (t) => {
      const s = scaleAt(t), rot = opt.twist * t;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const cx = c[0] + opt.off[0] * t, cy = c[1] + opt.off[1] * t;
      return foot.map((p) => {
        const vx = (p[0] - c[0]) * s, vy = (p[1] - c[1]) * s;
        const rx = vx * cs - vy * sn, ry = vx * sn + vy * cs;
        const z = opt.plinth + t * (opt.h + tanT * (rx * opt.dir[0] + ry * opt.dir[1]));
        return [cx + rx, cy + ry, z];
      });
    };

    const rings = [foot.map((p) => [p[0], p[1], 0])];
    if (opt.plinth > 1e-3) rings.push(foot.map((p) => [p[0], p[1], opt.plinth]));
    for (let k = 1; k <= (apex ? L - 1 : L); k++) rings.push(ringAt(k / L));

    const capTris = triangulate(foot);
    const bottom = rings[0];
    for (const [a, b, d] of capTris) tri(bottom[a], bottom[d], bottom[b]);
    for (let r = 0; r < rings.length - 1; r++) {
      const A = rings[r], B = rings[r + 1];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        tri(A[i], A[j], B[j]);
        tri(A[i], B[j], B[i]);
      }
    }
    const last = rings[rings.length - 1];
    if (apex) {
      const tip = [c[0] + opt.off[0], c[1] + opt.off[1], opt.plinth + opt.h];
      for (let i = 0; i < n; i++) tri(last[i], last[(i + 1) % n], tip);
    } else {
      for (const [a, b, d] of capTris) tri(last[a], last[b], last[d]);
    }
    return new Float32Array(out);
  }

  // Straight extrusion of a CCW polygon between z0 and z1 (used for the board).
  function buildSlab(poly, z0, z1) {
    const out = [];
    const tri = (a, b, d) => out.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]);
    const A = poly.map((p) => [p[0], p[1], z0]), B = poly.map((p) => [p[0], p[1], z1]);
    const caps = triangulate(poly);
    for (const [a, b, d] of caps) { tri(A[a], A[d], A[b]); tri(B[a], B[b], B[d]); }
    for (let i = 0, n = poly.length; i < n; i++) {
      const j = (i + 1) % n;
      tri(A[i], A[j], B[j]); tri(A[i], B[j], B[i]);
    }
    return new Float32Array(out);
  }

  /* ------------------------------------------------------------------ */
  /* Generate                                                            */
  /* ------------------------------------------------------------------ */

  function generate(input) {
    const P = Object.assign({}, DEFAULTS, input);
    const seed = Math.round(P.seed) | 0;
    const noise = makeNoise(seed);
    const L = P.layout === 'radial' ? layoutRadial(P) : P.layout === 'hex' ? layoutHex(P) : layoutRect(P);
    L.outline = ccw(L.outline);
    L.half = [0, 1].map((k) => Math.max(...L.outline.map((p) => Math.abs(p[k]))));
    L.ext = Math.max(L.half[0], L.half[1]);
    const warnings = [];

    // shrink each cell by half the gap so neighbours never touch
    const cells = [];
    let dropped = 0;
    for (const cell of L.cells) {
      const poly = inset(ccw(cell.poly), P.gap / 2);
      if (!poly) { dropped++; continue; }
      const c = centroid(poly);
      cell.poly = poly;
      cell.c = c;
      cell.inr = inradius(poly, c);
      cell.pn = [c[0] / L.ext, c[1] / L.ext];
      cells.push(cell);
    }
    if (dropped) warnings.push(`${dropped} ячеек пропущено: зазор больше самой ячейки`);

    const sH = scalarField(P, 'h', cells, noise, rngFor(seed, 1));
    const sI = scalarField(P, 'i', cells, noise, rngFor(seed, 2));
    const dir = directionField(P, cells, noise, rngFor(seed, 3));
    const rTw = rngFor(seed, 4), rAcc = rngFor(seed, 5);

    const fScale = Math.min(1, Math.max(0.05, P.fScale));
    const parts = [];
    cells.forEach((cell, i) => {
      const h = Math.max(0.3, P.hMin + (P.hMax - P.hMin) * sH[i]);
      const I = P.iMin + (1 - P.iMin) * sI[i];
      const ang = dir[i], d = [Math.cos(ang), Math.sin(ang)];
      const fs = Math.max(0.1, fScale * (1 - Math.min(0.9, P.sizeLink) * (1 - sH[i])));
      const c = cell.c;

      let foot;
      if (P.foot === 'circle') {
        const n = Math.max(3, Math.round(P.sides));
        foot = regularPolygon(c, cell.inr * fs, n, ang + Math.PI / n);
      } else if (P.foot === 'drop') {
        foot = dropPolygon(c, cell.inr * fs, P.dropLen, Math.round(P.sides), ang);
      } else {
        foot = cell.poly.map((p) => [c[0] + (p[0] - c[0]) * fs, c[1] + (p[1] - c[1]) * fs]);
      }
      foot = ccw(foot);

      const unit = 2 * cell.inr;
      const offMm = P.offset * I * unit;
      const twist = (P.twist * I + (rTw() * 2 - 1) * P.twistJit) * DEG;
      const tris = buildPart(foot, c, {
        h, plinth: Math.max(0, P.plinth), topScale: Math.max(0, P.topScale), curv: P.curv, layers: P.layers,
        off: [d[0] * offMm, d[1] * offMm], dir: d, tilt: Math.max(0, P.tilt) * I * DEG, twist,
      });

      let group = 0;
      switch (P.acc) {
        case 'random': group = rAcc() < P.accP ? 1 : 0; break;
        case 'checker': group = cell.parity; break;
        case 'border': group = cell.edge < Math.max(1, Math.round(P.accN)) ? 1 : 0; break;
        case 'stripes': group = Math.floor(Math.max(0, cell.band) / Math.max(1, Math.round(P.accN))) % 2; break;
        case 'height': group = sH[i] >= 1 - P.accP ? 1 : 0; break;
      }

      parts.push({
        id: cell.id, group, tris, foot, c, dir: d, h,
        top: [c[0] + d[0] * offMm, c[1] + d[1] * offMm],
      });
    });

    let board = null;
    if (P.board) {
      const m = Math.max(0, P.bMargin), T = Math.max(0.5, P.bThick);
      const poly = m > 0 ? inset(L.outline, -m) || L.outline : L.outline;
      board = { id: 'BOARD', group: 2, poly, tris: buildSlab(poly, -T, 0) };
    }

    const all = board ? parts.concat([board]) : parts;
    const bb = bounds(all.map((p) => p.tris));
    return { P, layout: L, parts, board, bounds: bb, warnings };
  }

  /* ------------------------------------------------------------------ */
  /* Bounds, STL, ZIP, plates, SVG                                       */
  /* ------------------------------------------------------------------ */

  function bounds(list) {
    const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    for (const t of list) {
      for (let i = 0; i < t.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          const v = t[i + k];
          if (v < b.min[k]) b.min[k] = v;
          if (v > b.max[k]) b.max[k] = v;
        }
      }
    }
    return b;
  }

  // Binary STL from a list of { tris, dx, dy, dz } (offsets optional).
  function stlBinary(items, name) {
    let count = 0;
    for (const it of items) count += it.tris.length / 9;
    const buf = new ArrayBuffer(84 + count * 50);
    const dv = new DataView(buf);
    const head = ('tiles ' + (name || '')).slice(0, 79);
    for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 0x7f);
    dv.setUint32(80, count, true);
    let o = 84;
    for (const it of items) {
      const t = it.tris, dx = it.dx || 0, dy = it.dy || 0, dz = it.dz || 0;
      for (let i = 0; i < t.length; i += 9) {
        const ax = t[i + 3] - t[i], ay = t[i + 4] - t[i + 1], az = t[i + 5] - t[i + 2];
        const bx = t[i + 6] - t[i], by = t[i + 7] - t[i + 1], bz = t[i + 8] - t[i + 2];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const l = Math.hypot(nx, ny, nz) || 1;
        dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
        o += 12;
        for (let v = 0; v < 3; v++) {
          dv.setFloat32(o, t[i + v * 3] + dx, true);
          dv.setFloat32(o + 4, t[i + v * 3 + 1] + dy, true);
          dv.setFloat32(o + 8, t[i + v * 3 + 2] + dz, true);
          o += 12;
        }
        dv.setUint16(o, 0, true);
        o += 2;
      }
    }
    return new Uint8Array(buf);
  }

  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // Uncompressed ZIP of [{ name, data: Uint8Array | string }].
  function makeZip(files) {
    const enc = new TextEncoder();
    const entries = files.map((f) => ({
      name: enc.encode(f.name),
      data: typeof f.data === 'string' ? enc.encode(f.data) : f.data,
    }));
    let size = 22;
    for (const e of entries) size += 30 + 46 + 2 * e.name.length + e.data.length;
    const out = new Uint8Array(size);
    const dv = new DataView(out.buffer);
    let o = 0;
    const offsets = [];
    for (const e of entries) {
      e.crc = crc32(e.data);
      offsets.push(o);
      dv.setUint32(o, 0x04034b50, true); dv.setUint16(o + 4, 20, true); dv.setUint16(o + 6, 0, true);
      dv.setUint16(o + 8, 0, true); dv.setUint16(o + 10, 0, true); dv.setUint16(o + 12, 0x21, true);
      dv.setUint32(o + 14, e.crc, true); dv.setUint32(o + 18, e.data.length, true); dv.setUint32(o + 22, e.data.length, true);
      dv.setUint16(o + 26, e.name.length, true); dv.setUint16(o + 28, 0, true);
      out.set(e.name, o + 30); out.set(e.data, o + 30 + e.name.length);
      o += 30 + e.name.length + e.data.length;
    }
    const cd = o;
    entries.forEach((e, i) => {
      dv.setUint32(o, 0x02014b50, true); dv.setUint16(o + 4, 20, true); dv.setUint16(o + 6, 20, true);
      dv.setUint16(o + 8, 0, true); dv.setUint16(o + 10, 0, true); dv.setUint16(o + 12, 0, true); dv.setUint16(o + 14, 0x21, true);
      dv.setUint32(o + 16, e.crc, true); dv.setUint32(o + 20, e.data.length, true); dv.setUint32(o + 24, e.data.length, true);
      dv.setUint16(o + 28, e.name.length, true); dv.setUint16(o + 30, 0, true); dv.setUint16(o + 32, 0, true);
      dv.setUint16(o + 34, 0, true); dv.setUint16(o + 36, 0, true); dv.setUint32(o + 38, 0, true);
      dv.setUint32(o + 42, offsets[i], true);
      out.set(e.name, o + 46);
      o += 46 + e.name.length;
    });
    dv.setUint32(o, 0x06054b50, true); dv.setUint16(o + 4, 0, true); dv.setUint16(o + 6, 0, true);
    dv.setUint16(o + 8, entries.length, true); dv.setUint16(o + 10, entries.length, true);
    dv.setUint32(o + 12, o - cd, true); dv.setUint32(o + 16, cd, true); dv.setUint16(o + 20, 0, true);
    return out;
  }

  // Shelf-pack parts onto print beds. Parts keep their orientation (base down).
  function packPlates(parts, bedX, bedY, gap) {
    const items = parts.map((p) => {
      const b = bounds([p.tris]);
      return { part: p, b, w: b.max[0] - b.min[0], d: b.max[1] - b.min[1] };
    }).sort((a, b) => b.d - a.d || b.w - a.w);
    const plates = [];
    const oversize = [];
    let cur = null, x = 0, y = 0, rowD = 0;
    const newPlate = () => { cur = { items: [] }; plates.push(cur); x = 0; y = 0; rowD = 0; };
    for (const it of items) {
      if (it.w > bedX || it.d > bedY) {
        oversize.push(it.part.id);
        plates.push({ items: [{ part: it.part, dx: -it.b.min[0], dy: -it.b.min[1], dz: -it.b.min[2] }] });
        cur = null;
        continue;
      }
      if (!cur) newPlate();
      if (x > 0 && x + it.w > bedX) { x = 0; y += rowD + gap; rowD = 0; }
      if (y + it.d > bedY) newPlate();
      cur.items.push({ part: it.part, dx: x - it.b.min[0], dy: y - it.b.min[1], dz: -it.b.min[2] });
      x += it.w + gap;
      rowD = Math.max(rowD, it.d);
    }
    return { plates, oversize };
  }

  // 1:1 assembly template: base outlines, part IDs, arrows to the tip.
  function assemblySVG(G) {
    const f = (v) => +v.toFixed(2);
    const L = G.layout, P = G.P;
    const m = P.board ? P.bMargin : 5;
    const hw = L.half[0] + m, hh = L.half[1] + m;
    const fills = [P.colMain, P.colAcc];
    const s = [];
    s.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(2 * hw)}mm" height="${f(2 * hh)}mm" viewBox="${f(-hw)} ${f(-hh)} ${f(2 * hw)} ${f(2 * hh)}">`);
    s.push(`<title>Tiles assembly template ${f(2 * hw)} x ${f(2 * hh)} mm</title>`);
    s.push(`<rect x="${f(-hw)}" y="${f(-hh)}" width="${f(2 * hw)}" height="${f(2 * hh)}" fill="#fff"/>`);
    if (G.board) {
      s.push(`<polygon points="${G.board.poly.map((p) => f(p[0]) + ',' + f(-p[1])).join(' ')}" fill="none" stroke="#999" stroke-width="0.4" stroke-dasharray="3 2"/>`);
    }
    for (const p of G.parts) {
      const pts = p.foot.map((q) => f(q[0]) + ',' + f(-q[1])).join(' ');
      s.push(`<polygon points="${pts}" fill="${fills[p.group] || '#eee'}" fill-opacity="0.35" stroke="#222" stroke-width="0.25"/>`);
      const dx = p.top[0] - p.c[0], dy = p.top[1] - p.c[1];
      if (Math.hypot(dx, dy) > 0.5) {
        s.push(`<line x1="${f(p.c[0])}" y1="${f(-p.c[1])}" x2="${f(p.top[0])}" y2="${f(-p.top[1])}" stroke="#c0392b" stroke-width="0.35"/>`);
        s.push(`<circle cx="${f(p.top[0])}" cy="${f(-p.top[1])}" r="0.9" fill="#c0392b"/>`);
      }
      const r = inradius(p.foot, p.c);
      const fs = Math.max(1.2, Math.min(6, r * 0.42));
      s.push(`<text x="${f(p.c[0])}" y="${f(-p.c[1])}" font-family="Helvetica,Arial,sans-serif" font-size="${f(fs)}" text-anchor="middle" dominant-baseline="central" fill="#111">${p.id}</text>`);
    }
    s.push('</svg>');
    return s.join('\n');
  }

  // Mesh sanity: every edge used exactly twice, in opposite directions.
  function checkClosed(tris) {
    const key = (i) => `${tris[i].toFixed(4)},${tris[i + 1].toFixed(4)},${tris[i + 2].toFixed(4)}`;
    const edges = new Map();
    let vol = 0;
    for (let i = 0; i < tris.length; i += 9) {
      const v = [key(i), key(i + 3), key(i + 6)];
      for (let k = 0; k < 3; k++) {
        const e = v[k] + '|' + v[(k + 1) % 3];
        edges.set(e, (edges.get(e) || 0) + 1);
      }
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = tris.slice(i, i + 9);
      vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    }
    let bad = 0;
    for (const [e, n] of edges) {
      const [a, b] = e.split('|');
      if (n !== 1 || edges.get(b + '|' + a) !== 1) bad++;
    }
    return { closed: bad === 0, badEdges: bad, volume: vol };
  }

  const api = {
    DEFAULTS, PRESETS, generate, buildPart, stlBinary, makeZip, packPlates, assemblySVG,
    checkClosed, bounds, inset, triangulate,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TileCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
