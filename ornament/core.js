/*
 * Ornament core: parametric relief tile.
 * Motif layers → height field on a grid → closed mesh (square, hexagon, octagon, circle) → STL.
 * No dependency on the DOM or Three.js: works both in the browser and in Node.
 */
(function (root) {
  'use strict';

  const DEG = Math.PI / 180;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  /* =========================================================================
     DEFAULT PARAMETERS
     ========================================================================= */
  const DEFAULTS = {
    shape: 'square', size: 150, T: 8, reliefScale: 1, edgeR: 1.2, bg: '#e8e1cf',
    blur: 0.3, crackSize: 0, crackDepth: 0.1, crackW: 0.35, grain: 0, grainSize: 1.5, seed: 1,
    cols: 3, rows: 3, gap: 2, rotMode: 'none',
    fade: 'none', fadeW: 150, fadeMin: 0, fadeCurve: 1, fadeNoise: 0, fadeAng: 90,
    stepPreview: 0.6, stepExport: 0.3, gloss: 0.6,
    layers: [],
  };

  const COMMON = {
    on: true, mode: 'raise', H: 2, prof: 'round', bevel: 1.5, style: 'fill', lw: 1.2,
    tiltX: 0, tiltY: 0, stripe: 'none', sPer: 3, sAng: 0, sRays: 24, sDepth: 0.6, sWave: 'tri',
    color: '#c8b89a',
    rep: 'radial', n: 1, mirror: false, R: 0, ang: 0, lat: 'square', P: 50, latOff: false, latRot: 0,
    ln: 1, span: 360, lrot: 0, lr: 0, rot: 0, flip: false, scale: 1,
  };

  const MOTIFS = {
    petal: { len: 20, wid: 8, bend: 0, shape: 'curve', tipS: 0.6, baseS: 0.6, bulge: 0.5, notch: 0, vein: 0, veinW: 1 },
    disc: { rad: 5, ring: 0, sector: 360 },
    rect: { rw: 20, rh: 10, rr: 0 },
    scroll: { r0: 1.5, r1: 8, turns: 1.25, wt: 1, w0: 2.5, w1: 1.2, tail: 10, tailBend: 30, knob: 0 },
    curve: { x0: 0, y0: 0, x1: 10, y1: 10, x2: 20, y2: -10, x3: 30, y3: 0, w0: 2, w1: 2, knob0: 0, knob1: 0 },
    arc: { rad: 20, a0: -45, sweep: 90, aw: 2 },
    line: { len: 40, lwid: 3 },
    star: { pts: 8, rad: 30, inner: 0.4 },
    polygram: { pts: 12, skip: 5, rad: 30, gw: 1.5 },
    lobed: { rad: 20, lobes: 4, amp: 0.3, sharp: 0.6 },
    frame: { inset: 0, fw: 6 },
  };

  const MOTIF_NAMES = {
    petal: 'Petal / leaf', disc: 'Circle / ring / sector', rect: 'Rectangle', scroll: 'Scroll',
    curve: 'Curve (stem)', arc: 'Arc', line: 'Band', star: 'Star', polygram: 'Star polygon {n/k}',
    lobed: 'Lobed outline', frame: 'Edge frame',
  };

  // Parameters that scale together with the tile (lengths in mm). Heights are not scaled.
  const LEN_KEYS = ['bevel', 'lw', 'sPer', 'R', 'P', 'lr',
    'len', 'wid', 'veinW', 'rad', 'ring', 'rw', 'rh', 'rr', 'r0', 'r1', 'wt', 'w0', 'w1', 'tail', 'knob',
    'x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'knob0', 'knob1', 'aw', 'lwid', 'gw', 'inset', 'fw'];

  function makeLayer(type, o) {
    return { type, ...COMMON, ...MOTIFS[type], ...(o || {}) };
  }

  function normalizeDesign(d) {
    const out = { ...DEFAULTS, ...d };
    out.layers = (d.layers || []).map((L) => ({ ...COMMON, ...MOTIFS[L.type], ...L }));
    return out;
  }

  function scaleDesign(d, k) {
    for (const L of d.layers) for (const key of LEN_KEYS) if (typeof L[key] === 'number') L[key] *= k;
  }

  /* =========================================================================
     NOISE AND RANDOMNESS
     ========================================================================= */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(i, j, seed) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, seed) {
    const i = Math.floor(x), j = Math.floor(y);
    let fx = x - i, fy = y - j;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = hash2(i, j, seed), b = hash2(i + 1, j, seed), c = hash2(i, j + 1, seed), d = hash2(i + 1, j + 1, seed);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  /* =========================================================================
     TILE OUTLINE
     ========================================================================= */
  function tileOutline(shape, size) {
    const a = size / 2;
    let n, phase;
    switch (shape) {
      case 'hexFlat': n = 6; phase = 0; break;
      case 'hexPointy': n = 6; phase = 30; break;
      case 'octagon': n = 8; phase = 22.5; break;
      case 'circle': n = 180; phase = 0; break;
      default: n = 4; phase = 45;
    }
    const rc = a / Math.cos(Math.PI / n);
    const vx = [], vy = [], nx = [], ny = [];
    for (let k = 0; k < n; k++) {
      const t = (phase + (k * 360) / n) * DEG;
      vx.push(rc * Math.cos(t)); vy.push(rc * Math.sin(t));
      const m = (phase + ((k + 0.5) * 360) / n) * DEG;
      nx.push(Math.cos(m)); ny.push(Math.sin(m));
    }
    const circle = shape === 'circle';
    return {
      shape, n, a, rc, vx, vy, nx, ny, circle,
      sdf(x, y) {
        if (circle) return Math.hypot(x, y) - a;
        let d = -Infinity;
        for (let k = 0; k < n; k++) { const v = x * nx[k] + y * ny[k]; if (v > d) d = v; }
        return d - a;
      },
    };
  }

  /* =========================================================================
     AFFINE TRANSFORMS [a b c d e f]: x' = a x + c y + e, y' = b x + d y + f
     ========================================================================= */
  const I = [1, 0, 0, 1, 0, 0];
  const mul = (M, N) => [
    M[0] * N[0] + M[2] * N[1], M[1] * N[0] + M[3] * N[1],
    M[0] * N[2] + M[2] * N[3], M[1] * N[2] + M[3] * N[3],
    M[0] * N[4] + M[2] * N[5] + M[4], M[1] * N[4] + M[3] * N[5] + M[5],
  ];
  const rotM = (deg) => { const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG); return [c, s, -s, c, 0, 0]; };
  const trM = (x, y) => [1, 0, 0, 1, x, y];
  const reflY = [1, 0, 0, -1, 0, 0];
  const scM = (k) => [k, 0, 0, k, 0, 0];
  function inv(M) {
    const det = M[0] * M[3] - M[1] * M[2];
    return [M[3] / det, -M[1] / det, -M[2] / det, M[0] / det,
      (M[2] * M[5] - M[3] * M[4]) / det, (M[1] * M[4] - M[0] * M[5]) / det];
  }
  const apply = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

  /* =========================================================================
     SDF PRIMITIVES (motif local coordinates)
     ========================================================================= */
  // Exact signed distance to a polygon (negative inside).
  function polySdf(P, x, y) {
    const n = P.length >> 1;
    let d = Infinity, s = 1;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = P[2 * i], yi = P[2 * i + 1], xj = P[2 * j], yj = P[2 * j + 1];
      const ex = xj - xi, ey = yj - yi, wx = x - xi, wy = y - yi;
      const ee = ex * ex + ey * ey;
      let t = ee > 0 ? (wx * ex + wy * ey) / ee : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = wx - ex * t, dy = wy - ey * t, dd = dx * dx + dy * dy;
      if (dd < d) d = dd;
      const c1 = y >= yi, c2 = y < yj, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  }
  // Chain of capsules with variable radius (stroke). Writes the nearest point parameter to SCR.t.
  const SCR = { t: 0, cl: 0, d: 0 };
  function chainSdf(P, Rr, x, y) {
    const n = P.length >> 1;
    let best = Infinity, bt = 0;
    for (let i = 0; i < n - 1; i++) {
      const ax = P[2 * i], ay = P[2 * i + 1], ex = P[2 * i + 2] - ax, ey = P[2 * i + 3] - ay;
      const wx = x - ax, wy = y - ay, ee = ex * ex + ey * ey;
      let t = ee > 0 ? (wx * ex + wy * ey) / ee : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = wx - ex * t, dy = wy - ey * t;
      const d = Math.sqrt(dx * dx + dy * dy) - (Rr ? Rr[i] + (Rr[i + 1] - Rr[i]) * t : 0);
      if (d < best) { best = d; bt = i + t; }
    }
    SCR.t = n > 1 ? bt / (n - 1) : 0;
    return best;
  }
  function bboxOf(P, pad) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < P.length; i += 2) {
      if (P[i] < x0) x0 = P[i]; if (P[i] > x1) x1 = P[i];
      if (P[i + 1] < y0) y0 = P[i + 1]; if (P[i + 1] > y1) y1 = P[i + 1];
    }
    return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  }

  /* =========================================================================
     MOTIFS: { sdf(u, v), bb, vein? }
     ========================================================================= */
  function buildPetal(p) {
    const N = 44, L = Math.max(0.1, p.len), W = Math.max(0.02, p.wid) / 2;
    const kap = (p.bend * DEG) / L;
    const pB = 0.3 + 1.4 * p.baseS, pT = 0.3 + 1.4 * p.tipS;
    const b = clamp(p.bulge, 0.05, 0.95);
    const C = (t) => {
      const s = t * L;
      if (Math.abs(kap) < 1e-6) return [s, 0, 0, 1];
      const a = kap * s;
      return [Math.sin(a) / kap, (1 - Math.cos(a)) / kap, -Math.sin(a), Math.cos(a)];
    };
    const wf = (t) => {
      const u = t < b ? (0.5 * t) / b : 0.5 + (0.5 * (t - b)) / (1 - b);
      if (p.shape === 'straight') return W * (u < 0.5 ? 2 * u : 2 * (1 - u));
      return W * Math.pow(Math.max(0, Math.sin(Math.PI * u)), u < 0.5 ? pB : pT);
    };
    const notch = clamp(p.notch, 0, 1), tmax = 1 - 0.15 * notch;
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const t = (tmax * i) / N, [x, y, nx, ny] = C(t), w = wf(t);
      left.push([x + nx * w, y + ny * w]); right.push([x - nx * w, y - ny * w]);
    }
    const pts = [];
    for (const q of left) pts.push(q[0], q[1]);
    if (notch > 0) { const q = C(1 - 0.5 * notch); pts.push(q[0], q[1]); }
    for (let i = N; i >= 1; i--) {
      if (i === N && notch === 0) continue;
      pts.push(right[i][0], right[i][1]);
    }
    const poly = new Float64Array(pts);
    const cl = [];
    for (let i = 0; i <= N; i++) { const q = C(i / N); cl.push(q[0], q[1]); }
    const clA = new Float64Array(cl);
    return {
      bb: bboxOf(poly, 0),
      sdf: (u, v) => polySdf(poly, u, v),
      vein: p.vein > 0 ? (u, v) => { SCR.cl = chainSdf(clA, null, u, v); return SCR.t; } : null,
    };
  }

  function buildDisc(p) {
    const R = Math.max(0.05, p.rad), ring = Math.max(0, p.ring), sec = clamp(p.sector, 1, 360);
    const half = (sec / 2) * DEG, cs = Math.sin(half), cc = Math.cos(half);
    return {
      bb: [-R, -R, R, R],
      sdf: (u, v) => {
        const r = Math.hypot(u, v);
        let d = r - R;
        if (ring > 0 && ring < R) d = Math.abs(r - (R - ring / 2)) - ring / 2;
        if (sec < 360) {
          // sector around the +x axis (sdPie)
          const px = Math.abs(v), py = u;
          const l = r - R;
          const k = clamp(px * cs + py * cc, 0, R);
          const m = Math.hypot(px - cs * k, py - cc * k);
          const pie = Math.max(l, m * Math.sign(cc * px - cs * py));
          d = ring > 0 && ring < R ? Math.max(d, pie) : pie;
        }
        return d;
      },
    };
  }

  function buildRect(p) {
    const bx = Math.max(0.05, p.rw) / 2, by = Math.max(0.05, p.rh) / 2, rr = clamp(p.rr, 0, Math.min(bx, by));
    return {
      bb: [-bx, -by, bx, by],
      sdf: (u, v) => {
        const qx = Math.abs(u) - bx + rr, qy = Math.abs(v) - by + rr;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
      },
    };
  }

  function strokeMotif(pts, rad, extra) {
    const P = new Float64Array(pts), Rr = new Float64Array(rad);
    let pad = 0;
    for (const r of rad) pad = Math.max(pad, r);
    const bb = bboxOf(P, pad);
    const discs = (extra || []).filter((d) => d[2] > 0);
    for (const d of discs) {
      bb[0] = Math.min(bb[0], d[0] - d[2]); bb[1] = Math.min(bb[1], d[1] - d[2]);
      bb[2] = Math.max(bb[2], d[0] + d[2]); bb[3] = Math.max(bb[3], d[1] + d[2]);
    }
    return {
      bb,
      sdf: (u, v) => {
        let d = chainSdf(P, Rr, u, v);
        for (const q of discs) d = Math.min(d, Math.hypot(u - q[0], v - q[1]) - q[2]);
        return d;
      },
    };
  }

  function buildScroll(p) {
    const turns = Math.max(0.05, p.turns), Th = turns * 2 * Math.PI;
    const M = Math.ceil(turns * 48) + 2;
    const r1 = Math.max(0.1, p.r1), r0 = clamp(p.r0, 0, r1);
    const sp = [];
    for (let i = 0; i <= M; i++) {
      const th = (Th * i) / M, r = r1 + ((r0 - r1) * i) / M;
      sp.push([r * Math.cos(th), r * Math.sin(th)]);
    }
    const tail = [];
    if (p.tail > 0.01) {
      const dr = (r0 - r1) / Th;
      let h = Math.atan2(-r1, -dr);
      const K = Math.max(2, Math.ceil(p.tail / 1.2)), ds = p.tail / K, k = (p.tailBend * DEG) / p.tail;
      let x = sp[0][0], y = sp[0][1];
      for (let q = 0; q < K; q++) {
        h += k * ds * 0.5; x += Math.cos(h) * ds; y += Math.sin(h) * ds; h += k * ds * 0.5;
        tail.push([x, y]);
      }
      tail.reverse();
    }
    const pts = [], rad = [];
    const nt = tail.length;
    tail.forEach((q, i) => { pts.push(q[0], q[1]); rad.push((p.wt + ((p.w0 - p.wt) * i) / nt) / 2); });
    sp.forEach((q, i) => { pts.push(q[0], q[1]); rad.push((p.w0 + ((p.w1 - p.w0) * i) / M) / 2); });
    const end = sp[M];
    return strokeMotif(pts, rad, [[end[0], end[1], p.knob]]);
  }

  function buildCurve(p) {
    const pts = [], rad = [], N = 48;
    for (let i = 0; i <= N; i++) {
      const t = i / N, s = 1 - t;
      const a = s * s * s, b = 3 * s * s * t, c = 3 * s * t * t, d = t * t * t;
      pts.push(a * p.x0 + b * p.x1 + c * p.x2 + d * p.x3, a * p.y0 + b * p.y1 + c * p.y2 + d * p.y3);
      rad.push((p.w0 + (p.w1 - p.w0) * t) / 2);
    }
    return strokeMotif(pts, rad, [[p.x0, p.y0, p.knob0], [p.x3, p.y3, p.knob1]]);
  }

  function buildArc(p) {
    const R = Math.max(0.1, p.rad), w = Math.max(0.05, p.aw) / 2, sw = clamp(p.sweep, 1, 360) * DEG, a0 = p.a0 * DEG;
    const e0 = [R * Math.cos(a0), R * Math.sin(a0)], e1 = [R * Math.cos(a0 + sw), R * Math.sin(a0 + sw)];
    return {
      bb: [-R - w, -R - w, R + w, R + w],
      sdf: (u, v) => {
        const r = Math.hypot(u, v);
        if (sw >= 2 * Math.PI - 1e-6) return Math.abs(r - R) - w;
        let a = Math.atan2(v, u) - a0;
        a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (a <= sw) return Math.abs(r - R) - w;
        return Math.min(Math.hypot(u - e0[0], v - e0[1]), Math.hypot(u - e1[0], v - e1[1])) - w;
      },
    };
  }

  function buildLine(p) {
    const h = Math.max(0.01, p.len) / 2, w = Math.max(0.05, p.lwid) / 2;
    return {
      bb: [-h - w, -w, h + w, w],
      sdf: (u, v) => Math.hypot(Math.max(Math.abs(u) - h, 0), v) - w,
    };
  }

  function polyMotif(pts) {
    const P = new Float64Array(pts);
    return { bb: bboxOf(P, 0), sdf: (u, v) => polySdf(P, u, v) };
  }
  function buildStar(p) {
    const n = Math.max(2, Math.round(p.pts)), pts = [];
    for (let i = 0; i < 2 * n; i++) {
      const a = (i * Math.PI) / n, r = i % 2 ? p.rad * p.inner : p.rad;
      pts.push(r * Math.cos(a), r * Math.sin(a));
    }
    return polyMotif(pts);
  }
  function buildLobed(p) {
    const k = Math.max(1, Math.round(p.lobes)), M = k * 36, pts = [];
    for (let i = 0; i < M; i++) {
      const t = (i / M) * 2 * Math.PI;
      const r = p.rad * (1 - p.amp + p.amp * Math.pow(Math.abs(Math.cos((k * t) / 2)), Math.max(0.05, p.sharp)));
      pts.push(r * Math.cos(t), r * Math.sin(t));
    }
    return polyMotif(pts);
  }
  function buildPolygram(p) {
    const n = Math.max(3, Math.round(p.pts)), k = clamp(Math.round(p.skip), 1, n - 1), w = Math.max(0.05, p.gw) / 2;
    const V = [];
    for (let i = 0; i < n; i++) V.push([p.rad * Math.cos((2 * Math.PI * i) / n), p.rad * Math.sin((2 * Math.PI * i) / n)]);
    const seg = [], seen = new Set();
    for (let i = 0; i < n; i++) {
      const j = (i + k) % n, key = Math.min(i, j) + ':' + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      seg.push(V[i][0], V[i][1], V[j][0], V[j][1]);
    }
    const S = new Float64Array(seg), R = p.rad + w;
    return {
      bb: [-R, -R, R, R],
      sdf: (u, v) => {
        let best = Infinity;
        for (let i = 0; i < S.length; i += 4) {
          const ex = S[i + 2] - S[i], ey = S[i + 3] - S[i + 1], wx = u - S[i], wy = v - S[i + 1];
          let t = (wx * ex + wy * ey) / (ex * ex + ey * ey);
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const d = Math.hypot(wx - ex * t, wy - ey * t);
          if (d < best) best = d;
        }
        return best - w;
      },
    };
  }

  const BUILDERS = {
    petal: buildPetal, disc: buildDisc, rect: buildRect, scroll: buildScroll, curve: buildCurve, arc: buildArc,
    line: buildLine, star: buildStar, polygram: buildPolygram, lobed: buildLobed,
  };

  /* =========================================================================
     REPLICATION: list of motif copies (local → tile matrices)
     ========================================================================= */
  function layerCopies(L, motif, cover) {
    const bb = motif.bb;
    const reachM = Math.max(Math.hypot(bb[0], bb[1]), Math.hypot(bb[2], bb[3]), Math.hypot(bb[0], bb[3]), Math.hypot(bb[2], bb[1]));
    const reach = Math.abs(L.R) + Math.abs(L.lr) + reachM * Math.abs(L.scale) + L.lw;
    const centers = [];
    if (L.rep === 'grid') {
      const P = Math.max(1, L.P), ext = cover + reach + P;
      const R0 = rotM(L.latRot);
      const off = L.latOff ? P / 2 : 0;
      if (L.lat === 'hex') {
        const dy = (P * Math.sqrt(3)) / 2, nj = Math.ceil(ext / dy), ni = Math.ceil(ext / P) + 1;
        for (let j = -nj; j <= nj; j++) for (let i = -ni; i <= ni; i++) {
          const x = i * P + (Math.abs(j) % 2 ? P / 2 : 0) + off, y = j * dy;
          const q = apply(R0, x, y);
          if (Math.abs(q[0]) <= ext && Math.abs(q[1]) <= ext) centers.push(q);
        }
      } else {
        const ni = Math.ceil(ext / P) + 1;
        for (let j = -ni; j <= ni; j++) for (let i = -ni; i <= ni; i++) {
          const q = apply(R0, i * P + off, j * P + off);
          if (Math.abs(q[0]) <= ext && Math.abs(q[1]) <= ext) centers.push(q);
        }
      }
    } else centers.push([0, 0]);

    const n = Math.max(1, Math.round(L.n)), ln = Math.max(1, Math.round(L.ln));
    const full = L.span >= 359.999;
    const tail = mul(mul(mul(trM(L.lr, 0), rotM(L.rot)), L.flip ? reflY : I), scM(L.scale));
    const out = [];
    for (const c of centers) {
      for (let k = 0; k < n; k++) {
        for (const m of L.mirror ? [false, true] : [false]) {
          let M = mul(trM(c[0], c[1]), rotM(L.ang + (k * 360) / n));
          if (m) M = mul(M, reflY);
          M = mul(mul(M, trM(L.R, 0)), rotM(L.lrot));
          for (let j = 0; j < ln; j++) {
            const phi = full ? (j * 360) / ln : ln === 1 ? 0 : -L.span / 2 + (j * L.span) / (ln - 1);
            out.push(mul(mul(M, rotM(phi)), tail));
          }
        }
      }
    }
    return out;
  }

  /* =========================================================================
     LAYER HEIGHT AT A POINT
     ========================================================================= */
  const PROFILES = {
    round: (t) => Math.sqrt(1 - (1 - t) * (1 - t)),
    chamfer: (t) => t,
    smooth: (t) => t * t * (3 - 2 * t),
    cove: (t) => 1 - Math.sqrt(1 - t * t),
  };

  function layerShader(L, scaleRelief) {
    const prof = PROFILES[L.prof] || PROFILES.round;
    const H = L.H * scaleRelief, bevel = Math.max(0.02, L.bevel);
    const outline = L.style === 'outline', halfW = L.lw / 2;
    const tx = Math.tan(clamp(L.tiltX, -80, 80) * DEG) * scaleRelief, ty = Math.tan(clamp(L.tiltY, -80, 80) * DEG) * scaleRelief;
    const tilted = tx !== 0 || ty !== 0;
    const st = L.stripe, sDepth = L.sDepth * scaleRelief, per = Math.max(0.05, L.sPer);
    const sc = Math.cos(L.sAng * DEG), ss = Math.sin(L.sAng * DEG), rays = Math.max(1, L.sRays);
    const wave = L.sWave === 'sine' ? (f) => 0.5 - 0.5 * Math.cos(2 * Math.PI * f)
      : L.sWave === 'step' ? (f) => (f < 0.5 ? 0 : 1)
        : (f) => 1 - Math.abs(2 * f - 1);
    const vein = L.type === 'petal' && L.vein > 0 && !outline ? L.vein * scaleRelief : 0, veinW = Math.max(0.05, L.veinW);
    return function (d, u, v, motif, lu, lv, scl) {
      const d0 = d;
      if (outline) d = Math.abs(d) - halfW;
      SCR.d = d;
      if (d >= 0) return 0;
      let t = -d / bevel;
      if (t > 1) t = 1;
      let base = H;
      if (tilted) base += tx * u + ty * v;
      if (base <= 0) return 0;
      let h = base * prof(t);
      if (vein) {
        const tc = motif.vein(lu, lv), k = (SCR.cl * scl) / veinW;
        if (k < 1) h -= vein * (1 - k * k) * (1 - k * k) * Math.sqrt(Math.max(0, Math.sin(Math.PI * tc)));
      }
      if (st !== 'none') {
        let ph;
        if (st === 'rings') ph = Math.hypot(u, v) / per;
        else if (st === 'contour') ph = -d0 / per;
        else if (st === 'rays') ph = ((Math.atan2(v, u) / (2 * Math.PI)) * rays) + 0.5;
        else ph = (u * sc + v * ss) / per;
        ph -= Math.floor(ph);
        h -= sDepth * wave(ph) * Math.min(1, t * 4);
      }
      return h > 0 ? h : 0;
    };
  }

  /* =========================================================================
     HEIGHT FIELD OF ONE TILE (same for all tiles in the array)
     ========================================================================= */
  function makeGrid(outline, step) {
    // The step is adjusted so that outline edges pass midway between nodes.
    const k = Math.max(2, Math.round(outline.a / step - 0.5));
    const s = outline.a / (k + 0.5);
    const half = Math.ceil(outline.rc / s) + 2;
    return { s, half, n: 2 * half + 1 };
  }

  function hexRGB(c) {
    const m = /^#?([0-9a-f]{6})$/i.exec(c || '');
    const v = m ? parseInt(m[1], 16) : 0xc8b89a;
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }

  // opts.colors — compute the preview colour at nodes (sRGB 0..1, smooth layer boundaries).
  function computeRelief(design, step, opts) {
    const D = design;
    const outline = tileOutline(D.shape, D.size);
    const G = makeGrid(outline, step);
    const { n, s, half } = G, NN = n * n;
    const X = new Float64Array(n);
    for (let i = 0; i < n; i++) X[i] = (i - half) * s;
    const h = new Float32Array(NN), buf = new Float32Array(NN), cov = opts && opts.colors ? new Float32Array(NN) : null;
    const covW = 1.5 * s; // colour transition width at the motif boundary
    const cover = (half + 1) * s;
    const minH = -(D.T - 0.6);
    let rgb = null;
    if (opts && opts.colors) {
      rgb = new Float32Array(NN * 3);
      const b = hexRGB(D.bg);
      for (let k = 0; k < NN; k++) { rgb[3 * k] = b[0]; rgb[3 * k + 1] = b[1]; rgb[3 * k + 2] = b[2]; }
    }

    D.layers.forEach((L, li) => {
      if (!L.on) return;
      buf.fill(0);
      if (cov) cov.fill(0);
      const shade = layerShader(L, D.reliefScale);
      if (L.type === 'frame') {
        const ins = L.inset, fw = Math.max(0.05, L.fw);
        for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++, k++) {
          const dO = outline.sdf(X[i], X[j]) + ins;
          buf[k] = shade(Math.max(dO, -(dO + fw)), X[i], X[j], null, 0, 0, 1);
          if (cov) cov[k] = clamp(-SCR.d / covW, 0, 1);
        }
      } else {
        const motif = BUILDERS[L.type](L);
        const pad = L.style === 'outline' ? L.lw / 2 + 0.01 : 0.01;
        const lb = [motif.bb[0] - pad, motif.bb[1] - pad, motif.bb[2] + pad, motif.bb[3] + pad];
        const copies = layerCopies(L, motif, cover);
        for (const M of copies) {
          const scl = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const [cx, cy] of [[lb[0], lb[1]], [lb[2], lb[1]], [lb[0], lb[3]], [lb[2], lb[3]]]) {
            const q = apply(M, cx, cy);
            if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
            if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
          }
          const i0 = Math.max(0, Math.ceil(x0 / s + half)), i1 = Math.min(n - 1, Math.floor(x1 / s + half));
          const j0 = Math.max(0, Math.ceil(y0 / s + half)), j1 = Math.min(n - 1, Math.floor(y1 / s + half));
          if (i0 > i1 || j0 > j1) continue;
          const Mi = inv(M);
          for (let j = j0; j <= j1; j++) {
            const y = X[j];
            for (let i = i0; i <= i1; i++) {
              const x = X[i];
              const u = Mi[0] * x + Mi[2] * y + Mi[4], v = Mi[1] * x + Mi[3] * y + Mi[5];
              if (u < lb[0] || u > lb[2] || v < lb[1] || v > lb[3]) continue;
              const d = motif.sdf(u, v) * scl;
              if (d >= (L.style === 'outline' ? L.lw / 2 : 0)) continue;
              const val = shade(d, u * scl, v * scl, motif, u, v, scl);
              const k = j * n + i;
              if (val > buf[k]) buf[k] = val;
              if (cov && val > 0) { const c = clamp(-SCR.d / covW, 0, 1); if (c > cov[k]) cov[k] = c; }
            }
          }
        }
      }
      const lc = rgb ? hexRGB(L.color) : null;
      for (let k = 0; k < NN; k++) {
        const v = buf[k];
        if (v <= 0) continue;
        if (L.mode === 'add') h[k] += v;
        else if (L.mode === 'cut') h[k] = Math.max(minH, h[k] - v);
        else if (v > h[k]) h[k] = v;
        else continue;
        if (rgb) {
          const w = cov[k], o = 3 * k;
          rgb[o] += (lc[0] - rgb[o]) * w; rgb[o + 1] += (lc[1] - rgb[o + 1]) * w; rgb[o + 2] += (lc[2] - rgb[o + 2]) * w;
        }
      }
    });

    // Glaze pooling: Gaussian blur.
    const sig = D.blur / s;
    if (sig > 0.25) blurGrid(h, n, sig);

    // Texture (shagreen) is part of the relief.
    if (D.grain > 0) {
      const f = 1 / Math.max(0.1, D.grainSize);
      for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++, k++) {
        const x = X[i] * f, y = X[j] * f;
        h[k] += D.grain * ((vnoise(x, y, D.seed) - 0.5) + 0.5 * (vnoise(x * 2.3, y * 2.3, D.seed + 7) - 0.5));
      }
    }

    // Craquelure: grooves along Voronoi cell boundaries (does not fade with the relief).
    let crack = null;
    if (D.crackSize > 0 && D.crackDepth > 0) {
      crack = new Float32Array(NN);
      const c = D.crackSize, w = Math.max(0.02, D.crackW), dep = D.crackDepth;
      for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++, k++) {
        const wx = X[i] + (vnoise(X[i] / c * 0.7, X[j] / c * 0.7, D.seed + 3) - 0.5) * c * 0.5;
        const wy = X[j] + (vnoise(X[i] / c * 0.7 + 9, X[j] / c * 0.7, D.seed + 5) - 0.5) * c * 0.5;
        const gx = Math.floor(wx / c), gy = Math.floor(wy / c);
        let f1 = Infinity, f2 = Infinity;
        for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
          const px = (gx + a + 0.15 + 0.7 * hash2(gx + a, gy + b, D.seed)) * c;
          const py = (gy + b + 0.15 + 0.7 * hash2(gx + a, gy + b, D.seed + 11)) * c;
          const dd = Math.hypot(wx - px, wy - py);
          if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
        }
        const e = (f2 - f1) / 2;
        if (e < w) { const q = 1 - e / w; crack[k] = dep * q * q; }
      }
    }
    return { G, X, outline, h, rgb, crack, design: D };
  }

  function blurGrid(a, n, sig) {
    const r = Math.ceil(sig * 3), K = new Float32Array(2 * r + 1);
    let sum = 0;
    for (let i = -r; i <= r; i++) { K[i + r] = Math.exp((-i * i) / (2 * sig * sig)); sum += K[i + r]; }
    for (let i = 0; i < K.length; i++) K[i] /= sum;
    const tmp = new Float32Array(a.length);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let q = -r; q <= r; q++) acc += K[q + r] * a[j * n + clamp(i + q, 0, n - 1)];
      tmp[j * n + i] = acc;
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let q = -r; q <= r; q++) acc += K[q + r] * tmp[clamp(j + q, 0, n - 1) * n + i];
      a[j * n + i] = acc;
    }
  }

  /* =========================================================================
     TILE ARRAY AND FADE
     ========================================================================= */
  function arrayLayout(D) {
    const cols = Math.max(1, Math.round(D.cols)), rows = Math.max(1, Math.round(D.rows));
    const out = tileOutline(D.shape, D.size);
    const p = D.size + D.gap;
    const tiles = [];
    const hex = D.shape === 'hexFlat' || D.shape === 'hexPointy';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let x, y;
      if (D.shape === 'hexFlat') { x = c * p * Math.sqrt(3) / 2; y = -(r * p + (c % 2 ? p / 2 : 0)); }
      else if (D.shape === 'hexPointy') { x = c * p + (r % 2 ? p / 2 : 0); y = -r * p * Math.sqrt(3) / 2; }
      else { x = c * p; y = -r * p; }
      tiles.push({ c, r, x, y });
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const t of tiles) { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); y0 = Math.min(y0, t.y); y1 = Math.max(y1, t.y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const stepA = hex ? 60 : D.shape === 'octagon' ? 45 : 90;
    const nRot = Math.round(360 / stepA);
    const rnd = mulberry32(D.seed * 7919 + 13);
    for (const t of tiles) {
      t.x -= cx; t.y -= cy;
      let k = 0;
      switch (D.rotMode) {
        case 'checker': k = (t.c + t.r) % 2; break;
        case 'pinwheel': k = [[0, 1], [3, 2]][t.r % 2][t.c % 2]; break;
        case 'rows': k = t.r; break;
        case 'cols': k = t.c; break;
        case 'random': k = Math.floor(rnd() * nRot); break;
        default: k = 0;
      }
      t.rot = ((k % nRot) * stepA);
      t.name = 'R' + String(t.r + 1).padStart(2, '0') + 'C' + String(t.c + 1).padStart(2, '0');
    }
    // Array bounds are taken from the tile outlines.
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    for (const t of tiles) for (let k = 0; k < out.n; k++) {
      const x = t.x + out.vx[k], y = t.y + out.vy[k];
      bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
    }
    if (out.circle) { bx0 = Infinity; bx1 = -Infinity; by0 = Infinity; by1 = -Infinity; for (const t of tiles) { bx0 = Math.min(bx0, t.x - out.a); bx1 = Math.max(bx1, t.x + out.a); by0 = Math.min(by0, t.y - out.a); by1 = Math.max(by1, t.y + out.a); } }
    return { tiles, box: [bx0, by0, bx1, by1], outline: out };
  }

  // Relief multiplier at an array point (world coordinates).
  function fadeFn(D, box) {
    if (D.fade === 'none') return null;
    const W = (box[2] - box[0]) / 2, H = (box[3] - box[1]) / 2;
    const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
    const fw = Math.max(1, D.fadeW), mn = clamp(D.fadeMin, 0, 1), g = Math.max(0.1, D.fadeCurve);
    const dx = Math.cos(D.fadeAng * DEG), dy = Math.sin(D.fadeAng * DEG);
    const smin = Math.min(...[[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]].map((q) => q[0] * dx + q[1] * dy));
    return function (x, y) {
      let e;
      if (D.fade === 'radial') {
        const rr = Math.hypot((x - cx) / W, (y - cy) / H);
        e = (1 - rr) * Math.min(W, H);
      } else if (D.fade === 'side') e = x * dx + y * dy - smin;
      else e = Math.min(W - Math.abs(x - cx), H - Math.abs(y - cy));
      if (D.fadeNoise > 0) e += (vnoise(x / 40, y / 40, D.seed + 101) - 0.5) * 2 * D.fadeNoise * fw;
      let t = clamp(e / fw, 0, 1);
      t = t * t * (3 - 2 * t);
      t = Math.pow(t, g);
      return mn + (1 - mn) * t;
    };
  }

  /* =========================================================================
     TILE MESH (closed solid: top from the height field, sides, bottom)
     tile — {x, y, rot} for fade; null — no fade.
     ========================================================================= */
  function buildTileMesh(R, tile, fade) {
    const D = R.design, { n, s, half } = R.G, X = R.X, out = R.outline;
    const NN = n * n;
    // Final node heights.
    const Z = new Float32Array(NN);
    const cr = tile ? Math.cos(tile.rot * DEG) : 1, sr = tile ? Math.sin(tile.rot * DEG) : 0;
    for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++, k++) {
      let f = 1;
      if (fade && tile) f = fade(tile.x + cr * X[i] - sr * X[j], tile.y + sr * X[i] + cr * X[j]);
      Z[k] = D.T + R.h[k] * f - (R.crack ? R.crack[k] : 0);
    }
    const eR = Math.max(0, Math.min(D.edgeR, D.T * 0.9));
    const zAt = (x, y) => {
      let fi = x / s + half, fj = y / s + half;
      let i = Math.floor(fi), j = Math.floor(fj);
      i = clamp(i, 0, n - 2); j = clamp(j, 0, n - 2);
      const tx = fi - i, ty = fj - j, k = j * n + i;
      let z = Z[k] * (1 - tx) * (1 - ty) + Z[k + 1] * tx * (1 - ty) + Z[k + n] * (1 - tx) * ty + Z[k + n + 1] * tx * ty;
      if (eR > 0) {
        const e = -out.sdf(x, y);
        if (e < eR) { const q = eR - Math.max(0, e); z -= eR - Math.sqrt(Math.max(0, eR * eR - q * q)); }
      }
      return z < 0.2 ? 0.2 : z;
    };

    const pos = [];
    const nodeV = new Int32Array(NN).fill(-1);
    const bmap = new Map();
    const node = (i, j) => {
      const k = j * n + i;
      let v = nodeV[k];
      if (v < 0) { v = pos.length / 3; pos.push(X[i], X[j], zAt(X[i], X[j])); nodeV[k] = v; }
      return v;
    };
    const bpt = (x, y) => {
      const key = Math.round(x * 1e6) + '_' + Math.round(y * 1e6);
      let v = bmap.get(key);
      if (v === undefined) {
        v = pos.length / 3;
        pos.push(x, y, zAt(x, y));
        bmap.set(key, v);
      }
      return v;
    };
    const vOf = (P) => (P.i >= 0 ? node(P.i, P.j) : bpt(P.x, P.y));

    const tri = [];
    const bnd = [];
    const diag = 0.7072 * s, margin = (out.circle ? out.rc - out.a : 0) + 1e-6;
    const tol = 1e-6 * Math.max(1, out.a);
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const cx = X[i] + s / 2, cy = X[j] + s / 2;
      const sd = out.sdf(cx, cy);
      if (sd > diag + margin) continue;
      if (sd < -diag - 1e-6) {
        const a = node(i, j), b = node(i + 1, j), c = node(i + 1, j + 1), d = node(i, j + 1);
        const za = pos[a * 3 + 2], zb = pos[b * 3 + 2], zc = pos[c * 3 + 2], zd = pos[d * 3 + 2];
        if (Math.abs(za - zc) <= Math.abs(zb - zd)) tri.push(a, b, c, a, c, d);
        else tri.push(a, b, d, b, c, d);
        continue;
      }
      // Clip the cell by the convex outline (Sutherland–Hodgman).
      let poly = [
        { x: X[i], y: X[j], i, j }, { x: X[i + 1], y: X[j], i: i + 1, j },
        { x: X[i + 1], y: X[j + 1], i: i + 1, j: j + 1 }, { x: X[i], y: X[j + 1], i, j: j + 1 },
      ];
      const used = [];
      for (let e = 0; e < out.n && poly.length; e++) {
        const ex = out.nx[e], ey = out.ny[e];
        if (cx * ex + cy * ey - out.a < -diag - 1e-6) continue;
        used.push(e);
        const f = (P) => P.x * ex + P.y * ey - out.a;
        const res = [];
        for (let q = 0; q < poly.length; q++) {
          const S = poly[(q + poly.length - 1) % poly.length], E = poly[q];
          const fs = f(S), fe = f(E);
          const inS = fs <= 0, inE = fe <= 0;
          if (inE !== inS) {
            // intersection point, computed identically for both neighbouring cells
            let A = S, B = E, fa = fs, fb = fe;
            if (B.x < A.x || (B.x === A.x && B.y < A.y)) { A = E; B = S; fa = fe; fb = fs; }
            const t = fa / (fa - fb);
            let Pn;
            if (t <= 1e-9) Pn = A; else if (t >= 1 - 1e-9) Pn = B;
            else Pn = { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t, i: -1 };
            if (!inE) res.push(Pn);
            else { res.push(Pn); }
          }
          if (inE) res.push(E);
        }
        // remove consecutive duplicates
        poly = [];
        for (const P of res) {
          const L = poly[poly.length - 1];
          if (L && Math.abs(L.x - P.x) < 1e-9 && Math.abs(L.y - P.y) < 1e-9) continue;
          poly.push(P);
        }
        if (poly.length > 1) {
          const F = poly[0], L = poly[poly.length - 1];
          if (Math.abs(F.x - L.x) < 1e-9 && Math.abs(F.y - L.y) < 1e-9) poly.pop();
        }
      }
      if (poly.length < 3) continue;
      const ids = poly.map(vOf);
      for (let q = 1; q < ids.length - 1; q++) tri.push(ids[0], ids[q], ids[q + 1]);
      // edges lying on the tile outline
      for (let q = 0; q < poly.length; q++) {
        const A = poly[q], B = poly[(q + 1) % poly.length];
        for (const e of used) {
          const fa = A.x * out.nx[e] + A.y * out.ny[e] - out.a, fb = B.x * out.nx[e] + B.y * out.ny[e] - out.a;
          if (Math.abs(fa) < tol && Math.abs(fb) < tol) { bnd.push(ids[q], ids[(q + 1) % poly.length]); break; }
        }
      }
    }
    const nTop = tri.length / 3;
    // Sides and bottom.
    const nextOf = new Map();
    for (let q = 0; q < bnd.length; q += 2) nextOf.set(bnd[q], bnd[q + 1]);
    const bottom = new Map();
    const low = (v) => {
      let b = bottom.get(v);
      if (b === undefined) { b = pos.length / 3; pos.push(pos[v * 3], pos[v * 3 + 1], 0); bottom.set(v, b); }
      return b;
    };
    const c0 = pos.length / 3;
    pos.push(0, 0, 0);
    for (let q = 0; q < bnd.length; q += 2) {
      const a = bnd[q], b = bnd[q + 1], a2 = low(a), b2 = low(b);
      tri.push(a, a2, b2, a, b2, b);
      tri.push(c0, b2, a2);
    }
    return { pos: new Float32Array(pos), tri: new Uint32Array(tri), nTop };
  }

  /* =========================================================================
     STL AND ZIP
     ========================================================================= */
  // Mesh triangles in binary STL (no header). M — {x, y, rot} placement.
  function stlChunk(mesh, place) {
    const { pos, tri } = mesh, nt = tri.length / 3;
    const buf = new ArrayBuffer(nt * 50), dv = new DataView(buf);
    const c = place ? Math.cos(place.rot * DEG) : 1, s = place ? Math.sin(place.rot * DEG) : 0;
    const ox = place ? place.x : 0, oy = place ? place.y : 0;
    const P = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      P[i] = ox + c * pos[i] - s * pos[i + 1]; P[i + 1] = oy + s * pos[i] + c * pos[i + 1]; P[i + 2] = pos[i + 2];
    }
    let o = 0;
    for (let t = 0; t < tri.length; t += 3) {
      const a = tri[t] * 3, b = tri[t + 1] * 3, d = tri[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
      o += 12;
      for (const q of [a, b, d]) {
        dv.setFloat32(o, P[q], true); dv.setFloat32(o + 4, P[q + 1], true); dv.setFloat32(o + 8, P[q + 2], true);
        o += 12;
      }
      dv.setUint16(o, 0, true); o += 2;
    }
    return { buf, count: nt };
  }
  function stlHeader(count, name) {
    const buf = new ArrayBuffer(84), dv = new DataView(buf);
    const head = ('ornament ' + (name || '')).slice(0, 79);
    for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 0x7f);
    dv.setUint32(80, count, true);
    return buf;
  }
  function stlParts(chunks, name) {
    let count = 0;
    for (const c of chunks) count += c.count;
    return [stlHeader(count, name), ...chunks.map((c) => c.buf)];
  }
  function concat(parts) {
    let n = 0;
    for (const p of parts) n += p.byteLength;
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(new Uint8Array(p), o); o += p.byteLength; }
    return out;
  }

  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  // Uncompressed ZIP from [{ name, data: Uint8Array | string }].
  function makeZip(files) {
    const enc = new TextEncoder();
    const entries = files.map((f) => ({ name: enc.encode(f.name), data: typeof f.data === 'string' ? enc.encode(f.data) : f.data }));
    let size = 22;
    for (const e of entries) size += 30 + 46 + 2 * e.name.length + e.data.length;
    const out = new Uint8Array(size), dv = new DataView(out.buffer);
    let o = 0;
    const offsets = [];
    for (const e of entries) {
      e.crc = crc32(e.data);
      offsets.push(o);
      dv.setUint32(o, 0x04034b50, true); dv.setUint16(o + 4, 20, true); dv.setUint16(o + 6, 0x0800, true);
      dv.setUint16(o + 8, 0, true); dv.setUint16(o + 10, 0, true); dv.setUint16(o + 12, 0x21, true);
      dv.setUint32(o + 14, e.crc, true); dv.setUint32(o + 18, e.data.length, true); dv.setUint32(o + 22, e.data.length, true);
      dv.setUint16(o + 26, e.name.length, true); dv.setUint16(o + 28, 0, true);
      out.set(e.name, o + 30); out.set(e.data, o + 30 + e.name.length);
      o += 30 + e.name.length + e.data.length;
    }
    const cd = o;
    entries.forEach((e, i) => {
      dv.setUint32(o, 0x02014b50, true); dv.setUint16(o + 4, 20, true); dv.setUint16(o + 6, 20, true);
      dv.setUint16(o + 8, 0x0800, true); dv.setUint16(o + 10, 0, true); dv.setUint16(o + 12, 0, true); dv.setUint16(o + 14, 0x21, true);
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

  const api = {
    DEFAULTS, COMMON, MOTIFS, MOTIF_NAMES, LEN_KEYS,
    makeLayer, normalizeDesign, scaleDesign, tileOutline, computeRelief, buildTileMesh,
    arrayLayout, fadeFn, stlChunk, stlParts, concat, makeZip, mulberry32,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OrnamentCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
