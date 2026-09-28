// Parametric texture fields. A field maps a point in millimetres to a
// relief value in [0, 1]; the mesh builder turns that into height.

import { createNoise3D, fbm, mulberry32 } from './noise.js';

const TAU = Math.PI * 2;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Parameter schema shared by the UI, the CLI and the tests.
// `patterns` lists which patterns show the parameter (absent = all).
export const PATTERNS = {
  topo: 'Топография (террасы)',
  contours: 'Изолинии (стенки)',
  fibers: 'Волокна (полосы)',
  dunes: 'Дюны (гребни)',
  cells: 'Ячейки (Вороной)',
  rings: 'Кольца (концентрические)',
};

export const FIELD_PARAMS = [
  { key: 'pattern', label: 'Паттерн', type: 'select', options: PATTERNS, value: 'topo' },
  { key: 'seed', label: 'Сид', type: 'int', min: 0, max: 99999, step: 1, value: 7 },
  { key: 'scale', label: 'Размер элементов, мм', type: 'number', min: 2, max: 500, step: 1, value: 40 },
  { key: 'octaves', label: 'Детализация (октавы)', type: 'int', min: 1, max: 8, step: 1, value: 3 },
  { key: 'warp', label: 'Искажение', type: 'number', min: 0, max: 3, step: 0.05, value: 0.4 },
  { key: 'stretch', label: 'Вытянутость', type: 'number', min: 1, max: 8, step: 0.1, value: 1 },
  { key: 'angle', label: 'Угол, °', type: 'number', min: 0, max: 180, step: 1, value: 0 },
  { key: 'levels', label: 'Число уровней', type: 'int', min: 2, max: 60, step: 1, value: 12, patterns: ['topo', 'contours'] },
  { key: 'edge', label: 'Скругление ступеней, мм', type: 'number', min: 0.1, max: 5, step: 0.05, value: 0.6, patterns: ['topo', 'contours', 'cells'] },
  { key: 'lineWidth', label: 'Толщина линии, мм', type: 'number', min: 0.2, max: 10, step: 0.1, value: 1.2, patterns: ['contours', 'cells'] },
  { key: 'baseSlope', label: 'Рельеф под линиями', type: 'number', min: 0, max: 1, step: 0.01, value: 0.3, patterns: ['contours'] },
  { key: 'period', label: 'Период, мм', type: 'number', min: 1, max: 100, step: 0.5, value: 6, patterns: ['fibers', 'rings'] },
  { key: 'profile', label: 'Острота профиля', type: 'number', min: 0.2, max: 4, step: 0.05, value: 1, patterns: ['fibers', 'dunes', 'rings'] },
  { key: 'cellMode', label: 'Режим ячеек', type: 'select', options: { walls: 'Стенки', bubbles: 'Выпуклости' }, value: 'walls', patterns: ['cells'] },
  { key: 'invert', label: 'Инвертировать', type: 'bool', value: false },
];

export function defaultFieldParams() {
  const out = {};
  for (const p of FIELD_PARAMS) out[p.key] = p.value;
  return out;
}

function hash3(seed, x, y, z) {
  let h = seed ^ Math.imul(x, 0x8da6b343) ^ Math.imul(y, 0xd8163841) ^ Math.imul(z, 0xcb1ab31f);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

// Worley noise: distances (in cell units) to the nearest and second-nearest
// feature points, written into `out`.
function worley(seed, x, y, z, out) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let f1 = 1e9, f2 = 1e9;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = xi + dx, cy = yi + dy, cz = zi + dz;
        const h = hash3(seed, cx, cy, cz);
        const px = cx + (h & 1023) / 1023;
        const py = cy + ((h >>> 10) & 1023) / 1023;
        const pz = cz + ((h >>> 20) & 1023) / 1023;
        const ddx = px - x, ddy = py - y, ddz = pz - z;
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
      }
    }
  }
  out[0] = f1;
  out[1] = f2;
}

// Returns f(x, y, z) -> [0, 1] for coordinates in millimetres.
export function createField(params) {
  const p = { ...defaultFieldParams(), ...params };
  const seed = p.seed | 0;
  const noise = createNoise3D(seed);
  const warpNoise = createNoise3D(seed + 1013);
  const rand = mulberry32(seed + 77);
  // Random offsets decorrelate the three warp channels.
  const off = Array.from({ length: 9 }, () => rand() * 1000);

  const a = (p.angle * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const scale = Math.max(p.scale, 1e-3);
  const stretch = Math.max(p.stretch, 1);
  const octaves = Math.max(1, p.octaves | 0);
  const warp = p.warp;
  const wv = new Float64Array(2);

  // Rotates (u runs along the stretch direction), scales and warps a point
  // in mm, writing the noise-space coordinates into q.
  const q = new Float64Array(3);
  function toNoiseSpace(x, y, z) {
    const u = x * ca + y * sa;
    const v = -x * sa + y * ca;
    let qx = u / (scale * stretch);
    let qy = v / scale;
    let qz = z / scale;
    if (warp > 0) {
      const wx = fbm(warpNoise, qx * 0.5 + off[0], qy * 0.5 + off[1], qz * 0.5 + off[2], 2);
      const wy = fbm(warpNoise, qx * 0.5 + off[3], qy * 0.5 + off[4], qz * 0.5 + off[5], 2);
      const wz = fbm(warpNoise, qx * 0.5 + off[6], qy * 0.5 + off[7], qz * 0.5 + off[8], 2);
      qx += warp * wx;
      qy += warp * wy;
      qz += warp * wz;
    }
    q[0] = qx; q[1] = qy; q[2] = qz;
  }

  // Smooth base height in [0, 1] with contrast stretched to use the range.
  function baseHeight(x, y, z) {
    toNoiseSpace(x, y, z);
    return clamp01(fbm(noise, q[0], q[1], q[2], octaves) * 0.55 + 0.5);
  }

  // Level coordinate t = baseHeight * levels and its gradient magnitude per
  // mm (finite differences), so distances to isolines can be measured in mm
  // and walls get a uniform width regardless of how steep the terrain is.
  const levels = Math.max(2, p.levels | 0);
  const fd = Math.min(0.2, scale * 0.01);
  const lv = new Float64Array(2);
  function levelAndGradient(x, y, z) {
    const t = baseHeight(x, y, z) * levels;
    const gx = baseHeight(x + fd, y, z) * levels - t;
    const gy = baseHeight(x, y + fd, z) * levels - t;
    const gz = z === 0 ? 0 : baseHeight(x, y, z + fd) * levels - t;
    lv[0] = t;
    lv[1] = Math.max(Math.sqrt(gx * gx + gy * gy + gz * gz) / fd, 1e-6);
  }

  const edge = Math.max(p.edge, 0.05);
  let field;
  switch (p.pattern) {
    case 'topo': {
      field = (x, y, z) => {
        levelAndGradient(x, y, z);
        const t = lv[0];
        const k = Math.floor(t);
        // Each terrace rises to the next one over `edge` mm right before
        // the isoline, giving flat plateaus with near-vertical steps.
        const dist = (k + 1 - t) / lv[1];
        return Math.min(levels, k + 1 - smoothstep(0, edge, dist)) / levels;
      };
      break;
    }
    case 'contours': {
      const half = p.lineWidth / 2;
      const m = clamp01(p.baseSlope);
      field = (x, y, z) => {
        levelAndGradient(x, y, z);
        const t = lv[0];
        const f = t - Math.floor(t);
        const dist = Math.min(f, 1 - f) / lv[1];
        const wall = 1 - smoothstep(half, half + edge, dist);
        return clamp01((m * t) / levels + (1 - m) * wall);
      };
      break;
    }
    case 'fibers': {
      const period = Math.max(p.period, 0.1);
      const exp = p.profile;
      field = (x, y, z) => {
        toNoiseSpace(x, y, z);
        const n = fbm(noise, q[0], q[1], q[2], octaves);
        // Stripes run along the angle direction; warp and noise bend them.
        const phase = ((q[1] + 0.25 * n) * scale) / period;
        const s = 0.5 + 0.5 * Math.cos(TAU * phase);
        return Math.pow(s, exp);
      };
      break;
    }
    case 'dunes': {
      const exp = p.profile;
      field = (x, y, z) => {
        toNoiseSpace(x, y, z);
        // Crests follow the zero set of the noise; a second, smoother layer
        // adds the broad swell between them.
        const n = fbm(noise, q[0], q[1], q[2], octaves);
        const swell = fbm(noise, q[0] * 0.5 + 31.7, q[1] * 0.5, q[2] * 0.5, 2) * 0.5 + 0.5;
        const crest = Math.pow(1 - clamp01(Math.abs(n) / 0.9), exp);
        return clamp01(0.75 * crest + 0.25 * swell);
      };
      break;
    }
    case 'cells': {
      const half = p.lineWidth / 2;
      const walls = p.cellMode !== 'bubbles';
      field = (x, y, z) => {
        toNoiseSpace(x, y, z);
        worley(seed, q[0], q[1], q[2], wv);
        if (walls) {
          // (F2 - F1) / 2 approximates the distance to the cell border.
          const dist = ((wv[1] - wv[0]) / 2) * scale;
          return 1 - smoothstep(half, half + edge, dist);
        }
        const d = clamp01(wv[0] / 0.9);
        return Math.sqrt(Math.max(0, 1 - d * d));
      };
      break;
    }
    case 'rings': {
      const period = Math.max(p.period, 0.1);
      const exp = p.profile;
      field = (x, y, z) => {
        toNoiseSpace(x, y, z);
        worley(seed, q[0], q[1], q[2], wv);
        const s = 0.5 + 0.5 * Math.cos((TAU * wv[0] * scale) / period);
        return Math.pow(s, exp);
      };
      break;
    }
    default:
      throw new Error(`Unknown pattern: ${p.pattern}`);
  }

  return p.invert ? (x, y, z) => 1 - field(x, y, z) : field;
}
