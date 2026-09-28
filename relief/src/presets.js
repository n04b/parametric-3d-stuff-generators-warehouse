// Starting points modelled on the reference images; any parameter not listed
// keeps its default from the schema.
export const PRESETS = [
  {
    name: 'Топографическая панель',
    params: { shape: 'rect', width: 150, height: 100, depth: 7, pattern: 'topo', scale: 55, octaves: 2, levels: 14, warp: 0.35, seed: 7 },
  },
  {
    name: 'Лабиринт изолиний',
    params: { shape: 'rect', width: 180, height: 110, depth: 6, pattern: 'contours', scale: 70, levels: 10, lineWidth: 1, edge: 0.5, baseSlope: 0.3, warp: 0.8, octaves: 2, seed: 21, resolution: 0.3 },
  },
  {
    name: 'Шар с террасами',
    params: { shape: 'sphere', diameter: 80, depth: 6, pattern: 'topo', scale: 50, levels: 10, edge: 0.4, warp: 0.3, octaves: 1, seed: 4 },
  },
  {
    name: 'Шар с волокнами',
    params: { shape: 'sphere', diameter: 80, depth: 3, pattern: 'fibers', scale: 35, period: 4, stretch: 3, warp: 0.3, octaves: 2, profile: 1.2, seed: 12, angle: 30 },
  },
  {
    name: 'Дюны на круге',
    params: { shape: 'disk', diameter: 140, base: 3, depth: 4, pattern: 'dunes', scale: 30, stretch: 2.5, warp: 0.4, octaves: 3, profile: 1.5, angle: 10, seed: 9 },
  },
  {
    name: 'Ячейки',
    params: { shape: 'rect', width: 120, height: 120, depth: 3, pattern: 'cells', scale: 12, lineWidth: 1.2, warp: 0.25, octaves: 1, seed: 5 },
  },
  {
    name: 'Кольца',
    params: { shape: 'disk', diameter: 120, base: 2, depth: 2.5, pattern: 'rings', scale: 35, period: 3, profile: 1.5, warp: 0.3, seed: 3 },
  },
];
