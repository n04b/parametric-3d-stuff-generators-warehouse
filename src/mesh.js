// Watertight mesh builders. All sizes are in millimetres; the output is an
// indexed triangle mesh with outward-facing (counter-clockwise) triangles.

export const SHAPES = {
  rect: 'Прямоугольная панель',
  disk: 'Круглая панель',
  sphere: 'Шар',
};

export const SHAPE_PARAMS = [
  { key: 'shape', label: 'Форма', type: 'select', options: SHAPES, value: 'rect' },
  { key: 'width', label: 'Ширина, мм', type: 'number', min: 5, max: 2000, step: 1, value: 150, shapes: ['rect'] },
  { key: 'height', label: 'Высота, мм', type: 'number', min: 5, max: 2000, step: 1, value: 100, shapes: ['rect'] },
  { key: 'diameter', label: 'Диаметр, мм', type: 'number', min: 5, max: 2000, step: 1, value: 120, shapes: ['disk', 'sphere'] },
  { key: 'base', label: 'Толщина основания, мм', type: 'number', min: 0.2, max: 100, step: 0.1, value: 2, shapes: ['rect', 'disk'] },
  { key: 'depth', label: 'Глубина рельефа, мм', type: 'number', min: 0, max: 100, step: 0.1, value: 4 },
  { key: 'margin', label: 'Гладкий край, мм', type: 'number', min: 0, max: 200, step: 0.5, value: 0, shapes: ['rect', 'disk'] },
  { key: 'resolution', label: 'Шаг сетки, мм', type: 'number', min: 0.05, max: 10, step: 0.05, value: 0.4 },
];

export function defaultShapeParams() {
  const out = {};
  for (const p of SHAPE_PARAMS) out[p.key] = p.value;
  return out;
}

const smoothstep = (a, b, x) => {
  if (b <= a) return x < a ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function gridCounts(s, resolution) {
  const res = Math.max(resolution, 1e-3);
  if (s.shape === 'rect') {
    return {
      nx: Math.max(2, Math.ceil(s.width / res) + 1),
      ny: Math.max(2, Math.ceil(s.height / res) + 1),
    };
  }
  if (s.shape === 'disk') {
    const r = s.diameter / 2;
    return { rings: Math.max(2, Math.ceil(r / res)), segs: Math.max(12, Math.ceil((2 * Math.PI * r) / res)) };
  }
  const r = s.diameter / 2;
  return { rings: Math.max(4, Math.ceil((Math.PI * r) / res)), segs: Math.max(8, Math.ceil((2 * Math.PI * r) / res)) };
}

// Triangle count for a given shape and grid step, without building anything.
export function estimateTriangles(shape, resolution = shape.resolution) {
  const s = { ...defaultShapeParams(), ...shape };
  const g = gridCounts(s, resolution);
  if (s.shape === 'rect') {
    const top = 2 * (g.nx - 1) * (g.ny - 1);
    return 2 * top + 4 * (g.nx - 1 + g.ny - 1);
  }
  if (s.shape === 'disk') {
    const top = g.segs + 2 * g.segs * (g.rings - 1);
    return 2 * top + 2 * g.segs;
  }
  return 2 * g.segs + 2 * g.segs * (g.rings - 2);
}

// Turns a top surface (xy grid with heights) and its CCW boundary loop into a
// closed solid: a mirrored flat bottom at z = 0 and vertical side walls.
function closePlate(topXY, topZ, topTris, loop) {
  const n = topZ.length;
  const positions = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = topXY[i * 2];
    positions[i * 3 + 1] = topXY[i * 2 + 1];
    positions[i * 3 + 2] = topZ[i];
    const j = (n + i) * 3;
    positions[j] = topXY[i * 2];
    positions[j + 1] = topXY[i * 2 + 1];
    positions[j + 2] = 0;
  }
  const t = topTris.length;
  const indices = new Uint32Array(t * 2 + loop.length * 6);
  indices.set(topTris, 0);
  for (let i = 0; i < t; i += 3) {
    indices[t + i] = topTris[i] + n;
    indices[t + i + 1] = topTris[i + 2] + n;
    indices[t + i + 2] = topTris[i + 1] + n;
  }
  let o = t * 2;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    indices[o++] = a + n; indices[o++] = b + n; indices[o++] = b;
    indices[o++] = a + n; indices[o++] = b; indices[o++] = a;
  }
  return { positions, indices };
}

function buildRect(s, field, res) {
  const { nx, ny } = gridCounts(s, res);
  const W = s.width, H = s.height;
  const n = nx * ny;
  const xy = new Float64Array(n * 2);
  const z = new Float64Array(n);
  for (let j = 0; j < ny; j++) {
    const y = (j / (ny - 1) - 0.5) * H;
    for (let i = 0; i < nx; i++) {
      const x = (i / (nx - 1) - 0.5) * W;
      const k = j * nx + i;
      xy[k * 2] = x;
      xy[k * 2 + 1] = y;
      const edge = Math.min(x + W / 2, W / 2 - x, y + H / 2, H / 2 - y);
      z[k] = s.base + s.depth * field(x, y, 0) * smoothstep(0, s.margin, edge);
    }
  }
  const tris = new Uint32Array((nx - 1) * (ny - 1) * 6);
  let o = 0;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx;
      tris[o++] = a; tris[o++] = b; tris[o++] = c;
      tris[o++] = a; tris[o++] = c; tris[o++] = d;
    }
  }
  const loop = [];
  for (let i = 0; i < nx - 1; i++) loop.push(i);
  for (let j = 0; j < ny - 1; j++) loop.push(j * nx + nx - 1);
  for (let i = nx - 1; i > 0; i--) loop.push((ny - 1) * nx + i);
  for (let j = ny - 1; j > 0; j--) loop.push(j * nx);
  return closePlate(xy, z, tris, loop);
}

function buildDisk(s, field, res) {
  const { rings, segs } = gridCounts(s, res);
  const R = s.diameter / 2;
  const n = 1 + rings * segs;
  const xy = new Float64Array(n * 2);
  const z = new Float64Array(n);
  z[0] = s.base + s.depth * field(0, 0, 0) * smoothstep(0, s.margin, R);
  for (let k = 1; k <= rings; k++) {
    const r = (R * k) / rings;
    const fall = smoothstep(0, s.margin, R - r);
    for (let m = 0; m < segs; m++) {
      const th = (2 * Math.PI * m) / segs;
      const x = r * Math.cos(th), y = r * Math.sin(th);
      const idx = 1 + (k - 1) * segs + m;
      xy[idx * 2] = x;
      xy[idx * 2 + 1] = y;
      z[idx] = s.base + s.depth * field(x, y, 0) * fall;
    }
  }
  const ring = (k, m) => 1 + (k - 1) * segs + (m % segs);
  const tris = new Uint32Array((segs + 2 * segs * (rings - 1)) * 3);
  let o = 0;
  for (let m = 0; m < segs; m++) {
    tris[o++] = 0; tris[o++] = ring(1, m); tris[o++] = ring(1, m + 1);
  }
  for (let k = 1; k < rings; k++) {
    for (let m = 0; m < segs; m++) {
      const a = ring(k, m), b = ring(k + 1, m), c = ring(k + 1, m + 1), d = ring(k, m + 1);
      tris[o++] = a; tris[o++] = b; tris[o++] = c;
      tris[o++] = a; tris[o++] = c; tris[o++] = d;
    }
  }
  const loop = [];
  for (let m = 0; m < segs; m++) loop.push(ring(rings, m));
  return closePlate(xy, z, tris, loop);
}

function buildSphere(s, field, res) {
  const { rings, segs } = gridCounts(s, res);
  const R = s.diameter / 2;
  const n = 2 + (rings - 1) * segs;
  const positions = new Float32Array(n * 3);
  // Relief is carved inwards so the outer diameter stays as specified.
  const put = (idx, ux, uy, uz) => {
    const r = R - s.depth * (1 - field(ux * R, uy * R, uz * R));
    positions[idx * 3] = ux * r;
    positions[idx * 3 + 1] = uy * r;
    positions[idx * 3 + 2] = uz * r;
  };
  put(0, 0, 0, 1);
  for (let k = 1; k < rings; k++) {
    const phi = (Math.PI * k) / rings;
    const sp = Math.sin(phi), cp = Math.cos(phi);
    for (let m = 0; m < segs; m++) {
      const th = (2 * Math.PI * m) / segs;
      put(1 + (k - 1) * segs + m, sp * Math.cos(th), sp * Math.sin(th), cp);
    }
  }
  const south = n - 1;
  put(south, 0, 0, -1);
  const ring = (k, m) => 1 + (k - 1) * segs + (m % segs);
  const indices = new Uint32Array((2 * segs + 2 * segs * (rings - 2)) * 3);
  let o = 0;
  for (let m = 0; m < segs; m++) {
    indices[o++] = 0; indices[o++] = ring(1, m); indices[o++] = ring(1, m + 1);
  }
  for (let k = 1; k < rings - 1; k++) {
    for (let m = 0; m < segs; m++) {
      const a = ring(k, m), b = ring(k + 1, m), c = ring(k + 1, m + 1), d = ring(k, m + 1);
      indices[o++] = a; indices[o++] = b; indices[o++] = c;
      indices[o++] = a; indices[o++] = c; indices[o++] = d;
    }
  }
  for (let m = 0; m < segs; m++) {
    indices[o++] = south; indices[o++] = ring(rings - 1, m + 1); indices[o++] = ring(rings - 1, m);
  }
  return { positions, indices };
}

// Builds the solid for `shape` params using `field` (x, y, z mm -> [0, 1]).
// `resolution` overrides the grid step, e.g. for a coarse preview.
export function buildMesh(shape, field, resolution = shape.resolution) {
  const s = { ...defaultShapeParams(), ...shape };
  switch (s.shape) {
    case 'rect': return buildRect(s, field, resolution);
    case 'disk': return buildDisk(s, field, resolution);
    case 'sphere': return buildSphere(s, field, resolution);
    default: throw new Error(`Unknown shape: ${s.shape}`);
  }
}
