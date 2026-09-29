/*
 * Пресеты и генератор случайной плитки. Каждый пресет — полный набор параметров плитки и слоёв.
 * Координаты в мм: центр плитки (0, 0), X вправо, Y вверх. Углы: 0° — вправо, против часовой стрелки.
 */
(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.OrnamentCore;
  const L = C.makeLayer;
  const SQ = 150, HEX = 130;
  const DIAG = (SQ / 2) * Math.SQRT2; // расстояние до угла квадратной плитки

  const PRESETS = [
    {
      id: 'modern', name: 'Модерн (розетка)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#ece2cc', blur: 0.35, crackSize: 7, crackDepth: 0.08,
        layers: [
          L('lobed', { style: 'outline', lw: 4.5, H: 2.6, rad: 72, lobes: 4, amp: 0.42, sharp: 0.55, ang: 45, color: '#2f3b35' }),
          L('scroll', { n: 4, ang: 45, mirror: true, lrot: 17, lr: 57, rot: 110, r1: 7, r0: 1.5, turns: 1.1, w0: 3.2, w1: 1.6, wt: 1.2, tail: 12, tailBend: 40, H: 2.4, color: '#7b4a22' }),
          L('petal', { n: 4, ang: 45, ln: 7, span: 64, lr: 40, len: 6, wid: 4.2, tipS: 0.15, baseS: 0.95, bulge: 0.6, H: 1.6, bevel: 1.2, color: '#c65b6b' }),
          L('star', { n: 4, ang: 0, R: 37, pts: 4, rad: 8, inner: 0.42, H: 2.4, prof: 'chamfer', bevel: 3, color: '#3f4d38' }),
          L('star', { n: 4, ang: 0, R: 75, pts: 4, rad: 10, inner: 0.42, H: 2.4, prof: 'chamfer', bevel: 3, color: '#3f4d38' }),
          L('petal', { n: 4, ang: 45, R: DIAG, ln: 12, lr: 0, len: 26, wid: 11, tipS: 0.85, baseS: 0.2, H: 2.8, bevel: 2.5, vein: 0.5, color: '#c65b6b' }),
          L('petal', { n: 12, len: 36, wid: 14, tipS: 0.9, baseS: 0.25, bulge: 0.45, H: 3, bevel: 3, vein: 0.7, veinW: 1.2, color: '#cf6676' }),
          L('petal', { n: 12, ang: 15, len: 25, wid: 10, tipS: 0.85, baseS: 0.25, H: 3.8, bevel: 2.5, vein: 0.6, color: '#a8404f' }),
          L('disc', { rad: 10, ring: 4, H: 4.6, color: '#5a1f2a' }),
          L('disc', { rad: 6, H: 4.2, color: '#56663f' }),
        ],
      },
    },
    {
      id: 'cobalt', name: 'Кобальт (завитки)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#1f3db5', blur: 0.5, crackSize: 3, crackDepth: 0.07, crackW: 0.25,
        layers: [
          L('petal', { n: 4, ang: 0, mirror: true, lrot: 9, lr: 20, rot: 6, len: 84, wid: 19, bend: 215, tipS: 0.95, baseS: 0.25, bulge: 0.35, H: 3.2, bevel: 3.5, color: '#8da0ec' }),
          L('petal', { n: 4, ang: 45, R: 50, len: 30, wid: 20, tipS: 0.95, baseS: 0.9, bulge: 0.35, H: 3.2, bevel: 3.5, color: '#8da0ec' }),
          L('petal', { n: 4, ang: 45, mirror: true, R: DIAG, lrot: 180 - 25, len: 30, wid: 13, tipS: 0.95, baseS: 0.3, H: 3, bevel: 3.5, color: '#8da0ec' }),
          L('petal', { n: 10, R: 6.5, len: 9, wid: 7, tipS: 0.05, baseS: 0.3, H: 3.4, bevel: 2, color: '#a8b6f2' }),
          L('disc', { rad: 6, H: 3.8, bevel: 2, color: '#a8b6f2' }),
        ],
      },
    },
    {
      id: 'bordeaux', name: 'Бордо (рамка)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#6e1320', blur: 0.4, edgeR: 3,
        layers: [
          L('frame', { inset: 2, fw: 6, H: 3, prof: 'round', bevel: 2.5, color: '#8a1d2c' }),
          L('frame', { inset: 11, fw: 3, H: 2.4, bevel: 1.3, color: '#8a1d2c' }),
          L('lobed', { style: 'outline', lw: 4.5, H: 3, rad: 58, lobes: 4, amp: 0.36, sharp: 0.7, ang: 0, color: '#8a1d2c' }),
          L('disc', { style: 'outline', lw: 4.5, H: 3, rad: 34, color: '#8a1d2c' }),
          L('petal', { n: 4, ang: 45, R: 36, len: 32, wid: 14, tipS: 0.9, baseS: 0.5, vein: 0.7, H: 3, bevel: 2.5, color: '#8a1d2c' }),
          L('petal', { n: 4, ang: 45, mirror: true, R: 44, lrot: 28, len: 26, wid: 10, bend: -70, tipS: 0.9, baseS: 0.4, H: 2.8, bevel: 2.5, color: '#8a1d2c' }),
          L('petal', { n: 4, ang: 0, R: 7, len: 18, wid: 13, tipS: 0.9, baseS: 0.6, H: 3.2, bevel: 2.5, color: '#8a1d2c' }),
          L('star', { pts: 4, rad: 9, inner: 0.7071, H: 3.4, prof: 'chamfer', bevel: 4, color: '#8a1d2c' }),
        ],
      },
    },
    {
      id: 'turquoise', name: 'Бирюза (спирали и точки)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#1b8c83', blur: 0.35, crackSize: 4, crackDepth: 0.1, crackW: 0.3,
        layers: [
          L('scroll', { n: 4, ang: 45, mirror: true, lrot: 24, lr: 43, rot: 60, r1: 11, r0: 2, turns: 1.45, w0: 4.2, w1: 2.4, wt: 3, tail: 14, tailBend: 70, knob: 0, H: 2.6, bevel: 2.2, color: '#3fb7a9' }),
          L('petal', { n: 4, R: 13, len: 23, wid: 25, tipS: 1, baseS: 0.95, bulge: 0.5, H: 2.6, bevel: 2.5, color: '#3fb7a9' }),
          L('petal', { n: 8, R: 5, len: 8, wid: 4.6, tipS: 0.1, baseS: 0.1, H: 2.2, bevel: 1.5, color: '#58c6b8' }),
          L('disc', { rad: 3.2, H: 2.4, color: '#58c6b8' }),
          L('disc', { n: 4, R: 70, rad: 4, H: 2.4, color: '#3fb7a9' }),
          L('disc', { n: 4, ang: 45, mirror: true, lrot: 14, lr: 64, rad: 4.8, H: 2.4, color: '#3fb7a9' }),
          L('disc', { n: 4, ang: 45, mirror: true, lrot: 9, lr: 44, rad: 2.6, H: 2.2, color: '#3fb7a9' }),
          L('petal', { n: 4, ang: 45, mirror: true, R: DIAG, lrot: 180 - 16, lr: 26, len: 16, wid: 9, bend: 150, tipS: 0.4, baseS: 0.4, H: 2.4, bevel: 2, color: '#3fb7a9' }),
          L('disc', { n: 4, ang: 45, mirror: true, R: DIAG, lrot: 180 - 30, lr: 40, rad: 4.6, H: 2.4, color: '#3fb7a9' }),
        ],
      },
    },
    {
      id: 'compass', name: 'Роза ветров (грани)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#e4dccb', blur: 0.15, edgeR: 2, grain: 0.12, grainSize: 2.5,
        layers: [
          L('petal', { n: 4, ang: 45, shape: 'straight', len: DIAG, wid: 13, bulge: 0.12, H: 2.6, prof: 'chamfer', bevel: 30, color: '#232323' }),
          L('star', { pts: 8, rad: 74, inner: 0.2, H: 3.6, prof: 'chamfer', bevel: 40, color: '#1c1c1c' }),
          L('disc', { rad: 2.4, H: 3.8, color: '#3a3a3a' }),
        ],
      },
    },
    {
      id: 'sicily', name: 'Сицилия (овалы и облака)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#efe9dc', blur: 0.4, crackSize: 9, crackDepth: 0.06,
        layers: [
          L('petal', { n: 4, ang: 45, len: 66, wid: 24, tipS: 0.85, baseS: 0.85, style: 'outline', lw: 4, H: 2.6, bevel: 2, color: '#4b5d61' }),
          L('scroll', { n: 4, ang: 45, mirror: true, lrot: 29, lr: 60, rot: 150, r1: 12, r0: 2.5, turns: 1.05, w0: 4.5, w1: 2.4, wt: 2.2, tail: 34, tailBend: 55, H: 2.6, bevel: 2, color: '#4b5d61' }),
          L('lobed', { n: 4, ang: 0, mirror: true, lrot: 18, lr: 34, rad: 9.5, lobes: 5, amp: 0.3, sharp: 0.6, H: 2.8, bevel: 3, color: '#e7a843' }),
          L('scroll', { n: 4, ang: 0, mirror: true, lrot: 11, lr: 45, rot: -30, r1: 4, r0: 1, turns: 0.9, w0: 3, w1: 1.6, wt: 2.6, tail: 4, H: 2.6, bevel: 2, color: '#e08a30' }),
          L('petal', { n: 4, ang: 45, R: DIAG - 12, lrot: 180, ln: 3, span: 90, len: 20, wid: 9, tipS: 0.3, baseS: 0.7, notch: 0.4, H: 2.4, bevel: 2, color: '#6f9c6c' }),
        ],
      },
    },
    {
      id: 'bowl', name: 'Чаша (глубокий рельеф)',
      d: {
        shape: 'square', size: SQ, T: 12, bg: '#5c0f16', blur: 0.35, edgeR: 2.5,
        layers: [
          L('frame', { inset: 0, fw: 8, H: 3.5, prof: 'chamfer', bevel: 3, color: '#6f1820' }),
          L('frame', { inset: 11, fw: 2.2, H: 2, bevel: 1, color: '#6f1820' }),
          L('disc', { rad: 55, mode: 'cut', H: 7, prof: 'smooth', bevel: 30, color: '#4a0a10' }),
          L('disc', { rad: 58, ring: 5, H: 3, bevel: 2, color: '#6f1820' }),
          L('petal', { n: 6, ang: 90, R: 14, len: 38, wid: 32, tipS: 0.25, baseS: 0.7, mode: 'add', H: 2.6, prof: 'smooth', bevel: 10, color: '#5a0d14' }),
          L('disc', { rad: 16, H: 1.5, mode: 'add', bevel: 3, color: '#7d2029' }),
          L('petal', { n: 12, R: 4, len: 11, wid: 4.5, tipS: 0.3, baseS: 0.5, mode: 'add', H: 1.4, bevel: 1.2, color: '#7d2029' }),
          L('petal', { n: 4, ang: 45, R: 94, lrot: 180, ln: 7, span: 96, lr: 3, len: 19, wid: 6.5, tipS: 0.05, baseS: 0.8, bulge: 0.7, vein: 0.5, H: 3, bevel: 2, color: '#7d2029' }),
          L('disc', { n: 4, ang: 45, R: 96, rad: 4, H: 3.2, color: '#7d2029' }),
          L('disc', { n: 4, ang: 0, R: 64, rad: 2.2, H: 2.6, color: '#7d2029' }),
          L('disc', { n: 4, ang: 45, mirror: true, lrot: 17, lr: 70, rad: 2, H: 2.6, color: '#7d2029' }),
        ],
      },
    },
    {
      id: 'azulejo', name: 'Азулежу (ромб)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#ebe4dc', blur: 0.35, crackSize: 12, crackDepth: 0.05,
        layers: [
          L('line', { n: 4, ang: 45, lr: 53, rot: 90, len: 110, lwid: 8, H: 2.6, bevel: 3, color: '#86a05c' }),
          L('arc', { n: 4, ang: 45, R: DIAG, rad: 33, sweep: 360, aw: 7, H: 2.6, bevel: 3, color: '#86a05c' }),
          L('petal', { n: 4, ang: 45, R: DIAG, len: 12, wid: 8, lr: 8, ln: 4, tipS: 0.2, baseS: 0.2, H: 2.4, bevel: 2, color: '#86a05c' }),
          L('petal', { n: 4, ang: 0, R: 12, len: 38, wid: 17, tipS: 0.9, baseS: 0.5, notch: 0.45, stripe: 'linear', sAng: 90, sPer: 2.4, sDepth: 0.6, H: 2.4, bevel: 2.2, color: '#9e3b50' }),
          L('scroll', { n: 4, ang: 0, mirror: true, lrot: 28, lr: 23, rot: 120, r1: 6, r0: 1.4, turns: 1, w0: 2.6, w1: 1.4, wt: 1.2, tail: 15, tailBend: 30, knob: 1.6, H: 2.4, bevel: 1.6, color: '#9e3b50' }),
          L('petal', { n: 4, ang: 45, mirror: true, lrot: 15, lr: 20, len: 28, wid: 11, bend: 40, tipS: 0.95, baseS: 0.4, stripe: 'linear', sAng: 90, sPer: 2.2, sDepth: 0.6, H: 2.4, bevel: 2, color: '#9e3b50' }),
          L('rect', { rw: 22, rh: 22, rr: 1, style: 'outline', lw: 2, H: 2.2, color: '#9e3b50' }),
          L('rect', { rw: 17, rh: 17, rr: 1, H: 2.6, bevel: 2, color: '#86a05c' }),
        ],
      },
    },
    {
      id: 'vesica', name: 'Овалы (сетка)',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#35b3a8', blur: 0.4, crackSize: 5, crackDepth: 0.08, edgeR: 3,
        layers: [
          L('petal', { rep: 'grid', lat: 'square', P: 37.5, latOff: true, n: 4, len: 37.5, wid: 17, tipS: 0.75, baseS: 0.75, H: 2.8, prof: 'round', bevel: 5, color: '#56c9bd' }),
        ],
      },
    },
    {
      id: 'chrysanthemum', name: 'Хризантема',
      d: {
        shape: 'square', size: SQ, T: 7, bg: '#1b4c77', blur: 0.4,
        layers: [
          L('frame', { inset: 0, fw: 3, H: 0.8, bevel: 1, color: '#245d8f' }),
          L('petal', { n: 24, R: 9, len: 52, wid: 11.5, tipS: 0.02, baseS: 0.9, bulge: 0.8, vein: 0.9, veinW: 1.4, H: 3.2, bevel: 3.5, color: '#3d80bc' }),
          L('disc', { rad: 8, H: 3, bevel: 2.5, color: '#a7a38c' }),
        ],
      },
    },
    {
      id: 'blocks', name: 'Бруски и полудиски (массив)',
      d: {
        shape: 'square', size: SQ, T: 6, bg: '#e9e8e3', blur: 0.3, grain: 0.18, grainSize: 1.2, edgeR: 1,
        cols: 4, rows: 4, gap: 1.5, rotMode: 'random',
        layers: [
          L('rect', { ang: 90, R: 40, rw: 64, rh: 144, rr: 1, H: 9, prof: 'chamfer', bevel: 2, color: '#f1f0ec' }),
          L('disc', { ang: -90, R: 4, rad: 66, sector: 180, H: 9, tiltX: -6, prof: 'cove', bevel: 6, color: '#e2e1dc' }),
        ],
      },
    },
    {
      id: 'hex-rosette', name: 'Соты: розетка',
      d: {
        shape: 'hexFlat', size: HEX, T: 7, bg: '#e9e0cb', blur: 0.35, crackSize: 7, crackDepth: 0.07,
        cols: 5, rows: 4, gap: 2, fade: 'radial', fadeW: 260, fadeCurve: 1.3,
        layers: [
          L('frame', { inset: 1, fw: 3, H: 1.8, bevel: 1.2, color: '#2e4a5c' }),
          L('scroll', { n: 6, ang: 30, mirror: true, lrot: 13, lr: 42, rot: 110, r1: 6.5, r0: 1.4, turns: 1.1, w0: 3, w1: 1.5, wt: 1.2, tail: 12, tailBend: 40, H: 2.4, color: '#2e4a5c' }),
          L('petal', { n: 6, ang: 30, R: 50, lrot: 180, ln: 5, span: 80, lr: 2, len: 11, wid: 4.5, tipS: 0.1, baseS: 0.8, bulge: 0.7, H: 2.2, bevel: 1.4, color: '#c9913d' }),
          L('petal', { n: 12, len: 32, wid: 11, tipS: 0.9, baseS: 0.25, vein: 0.6, H: 3, bevel: 2.5, color: '#3b6f8f' }),
          L('petal', { n: 6, ang: 30, len: 22, wid: 11, tipS: 0.9, baseS: 0.25, vein: 0.6, H: 3.6, bevel: 2.5, color: '#2e4a5c' }),
          L('disc', { rad: 6, H: 4, color: '#c9913d' }),
        ],
      },
    },
    {
      id: 'hex-cube', name: 'Соты: куб и лучи',
      d: {
        shape: 'hexPointy', size: 100, T: 6, bg: '#2f9983', blur: 0.4, edgeR: 1.5,
        cols: 5, rows: 4, gap: 2, rotMode: 'random',
        layers: [
          L('petal', { ang: 90, shape: 'straight', len: 100 / Math.sqrt(3) - 1, wid: 100 - 2, bulge: 0.5, H: 7, tiltX: -4, prof: 'chamfer', bevel: 1.2, color: '#4fb89f' }),
          L('petal', { ang: 210, shape: 'straight', len: 100 / Math.sqrt(3) - 1, wid: 100 - 2, bulge: 0.5, H: 5.5, tiltY: 6, prof: 'chamfer', bevel: 1.2, color: '#2b8a74' }),
          L('petal', { ang: 330, shape: 'straight', len: 100 / Math.sqrt(3) - 1, wid: 100 - 2, bulge: 0.5, H: 6, prof: 'chamfer', bevel: 1.2, stripe: 'rays', sRays: 64, sWave: 'sine', sDepth: 1.8, color: '#3fa88f' }),
        ],
      },
    },
    {
      id: 'hex-chevron', name: 'Соты: шевроны (бетон)',
      d: {
        shape: 'hexFlat', size: 120, T: 5, bg: '#a9a7a1', blur: 0.2, edgeR: 0.8, grain: 0.08, grainSize: 2,
        cols: 3, rows: 3, gap: 3, rotMode: 'random',
        layers: [
          L('petal', { n: 3, ang: 0, shape: 'straight', len: 120 / Math.sqrt(3), wid: 120, bulge: 0.5, H: 10, prof: 'chamfer', bevel: 0.6, stripe: 'contour', sPer: 8, sWave: 'tri', sDepth: 5, color: '#b3b1aa' }),
        ],
      },
    },
    {
      id: 'hex-girih', name: 'Соты: гирих',
      d: {
        shape: 'hexPointy', size: HEX, T: 6, bg: '#1d4d6b', blur: 0.2,
        cols: 4, rows: 3, gap: 2,
        layers: [
          L('frame', { inset: 0.5, fw: 2, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('polygram', { pts: 12, skip: 5, rad: 34.8, gw: 1.8, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('line', { n: 6, ang: 0, lr: 50, len: 30, lwid: 1.8, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('disc', { style: 'outline', rad: 34.8, lw: 1.8, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('polygram', { n: 6, ang: 30, R: HEX / Math.sqrt(3), pts: 12, skip: 5, rad: 24, gw: 1.8, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('star', { n: 6, ang: 30, R: 44, pts: 6, rad: 9, inner: 0.866, style: 'outline', lw: 1.8, H: 1.6, prof: 'chamfer', bevel: 0.8, color: '#d0ac62' }),
          L('star', { pts: 12, rad: 13, inner: 0.62, H: 0.8, prof: 'chamfer', bevel: 3, color: '#2c6f8f' }),
        ],
      },
    },
    {
      id: 'hex-circles', name: 'Соты: круги',
      d: {
        shape: 'hexFlat', size: HEX, T: 6, bg: '#ebe4d4', blur: 0.4, crackSize: 6, crackDepth: 0.06, edgeR: 1.5,
        cols: 4, rows: 3, gap: 2,
        layers: [
          L('disc', { rep: 'grid', lat: 'hex', latRot: 90, P: 26, rad: 26, style: 'outline', lw: 3.2, H: 2.4, bevel: 1.6, color: '#f4efe4' }),
          L('frame', { inset: 0, fw: 2.5, H: 2.4, bevel: 1.6, color: '#f4efe4' }),
        ],
      },
    },
  ];

  /* =========================================================================
     СЛУЧАЙНАЯ ПЛИТКА
     ========================================================================= */
  const PALETTES = [
    ['#ece2cc', '#c65b6b', '#2f3b35', '#7b4a22', '#56663f'],
    ['#1f3db5', '#8da0ec', '#a8b6f2', '#6f86e0', '#c9d2f7'],
    ['#1b8c83', '#3fb7a9', '#58c6b8', '#2aa396', '#8fdcd2'],
    ['#efe9dc', '#4b5d61', '#e7a843', '#6f9c6c', '#e08a30'],
    ['#1d4d6b', '#d0ac62', '#2c6f8f', '#e0c890', '#4e8fb0'],
    ['#6e1320', '#8a1d2c', '#a0303f', '#7d2029', '#b2505a'],
    ['#e9e8e3', '#f4f3ef', '#d8d7d1', '#cfcdc6', '#ffffff'],
  ];

  function randomDesign(seed, shape) {
    const r = C.mulberry32(seed * 9301 + 49297);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const rr = (a, b) => a + (b - a) * r();
    const hex = shape === 'hexFlat' || shape === 'hexPointy';
    const size = hex ? HEX : SQ, a = size / 2;
    const N = hex ? 6 : shape === 'octagon' ? 8 : 4;
    const axis = shape === 'hexPointy' ? 30 : 0;
    const corner = hex ? a / Math.cos(Math.PI / 6) : shape === 'square' ? a * Math.SQRT2 : a;
    const cornerAng = shape === 'hexFlat' ? 0 : shape === 'hexPointy' ? 30 : 45;
    const edgeAng = shape === 'hexFlat' ? 30 : shape === 'hexPointy' ? 0 : 0;
    const pal = pick(PALETTES);
    const col = () => pick(pal.slice(1));
    const layers = [];
    const H = rr(2, 3.5);
    const prof = pick(['round', 'round', 'smooth', 'chamfer']);
    if (r() < 0.4) layers.push(L('frame', { inset: rr(0, 4), fw: rr(2, 6), H: H * 0.8, prof, bevel: 1.5, color: col() }));
    // внешнее кольцо мотивов
    const ringType = pick(['lobed', 'disc', 'scroll', 'petal', 'arc']);
    const outR = a * rr(0.7, 0.95);
    if (ringType === 'lobed') layers.push(L('lobed', { style: 'outline', lw: rr(2.5, 5), rad: outR, lobes: N, amp: rr(0.2, 0.45), sharp: rr(0.4, 0.9), ang: pick([axis, cornerAng]), H, prof, color: col() }));
    else if (ringType === 'disc') layers.push(L('disc', { style: 'outline', lw: rr(2.5, 5), rad: outR * 0.8, H, prof, color: col() }));
    else if (ringType === 'arc') layers.push(L('arc', { n: N, ang: cornerAng, R: corner, rad: a * rr(0.3, 0.55), sweep: 360, aw: rr(3, 7), H, prof, color: col() }));
    else if (ringType === 'scroll') layers.push(L('scroll', { n: N, ang: cornerAng, mirror: true, lrot: rr(10, 25), lr: a * rr(0.55, 0.75), rot: rr(60, 150), r1: rr(5, 11), r0: rr(1, 2), turns: rr(0.9, 1.6), w0: rr(2.5, 4.5), w1: rr(1.2, 2.2), wt: rr(1, 3), tail: rr(6, 25), tailBend: rr(-40, 70), H, prof, color: col() }));
    else layers.push(L('petal', { n: N, ang: cornerAng, mirror: r() < 0.5, lrot: rr(0, 25), R: a * rr(0.25, 0.4), len: a * rr(0.35, 0.6), wid: rr(8, 18), bend: rr(-120, 120), tipS: r(), baseS: r(), H, prof, bevel: rr(1.5, 4), color: col() }));
    // углы
    if (r() < 0.8) {
      const cn = Math.round(rr(3, 9));
      layers.push(L('petal', { n: N, ang: cornerAng, R: corner * rr(0.85, 1), lrot: 180, ln: cn, span: rr(60, 140), lr: rr(0, 6), len: a * rr(0.15, 0.3), wid: rr(4, 10), tipS: r(), baseS: rr(0.3, 1), bulge: rr(0.4, 0.75), vein: r() < 0.5 ? 0.5 : 0, H: H * 0.9, prof, bevel: rr(1.2, 3), color: col() }));
    }
    // середины граней
    if (r() < 0.6) layers.push(L(pick(['disc', 'star']), { n: N, ang: edgeAng, R: a * rr(0.55, 0.85), rad: rr(3, 8), pts: 4, inner: 0.45, H, prof: 'chamfer', bevel: 3, color: col() }));
    // точки
    if (r() < 0.5) layers.push(L('disc', { n: N, ang: cornerAng, ln: Math.round(rr(3, 9)), span: 360 / N * rr(0.3, 0.8), lr: a * rr(0.45, 0.65), rad: rr(1.5, 3.5), H: H * 0.8, prof, color: col() }));
    // центральная розетка
    const pn = pick([N * 2, N * 3, N * 4, 8, 10, 12, 16, 24]);
    const plen = a * rr(0.25, 0.5);
    layers.push(L('petal', { n: pn, len: plen, wid: Math.min(plen * 0.8, (2 * Math.PI * plen * 0.5) / pn * rr(1, 2.2)), tipS: r(), baseS: rr(0.1, 0.9), bulge: rr(0.35, 0.8), notch: r() < 0.2 ? 0.4 : 0, vein: r() < 0.5 ? 0.6 : 0, R: rr(0, 6), H: H * 1.1, prof, bevel: rr(1.5, 4), color: col() }));
    if (r() < 0.6) layers.push(L('petal', { n: pn / 2 | 0 || 4, ang: 180 / pn, len: plen * 0.7, wid: plen * 0.35, tipS: r(), baseS: 0.3, H: H * 1.3, prof, bevel: 2, color: col() }));
    layers.push(L('disc', { rad: rr(3, 8), ring: r() < 0.4 ? rr(1.5, 3) : 0, H: H * 1.4, prof, bevel: 2, color: col() }));
    return {
      shape, size, T: 7, bg: pal[0], blur: rr(0.2, 0.5), crackSize: r() < 0.5 ? rr(3, 10) : 0, crackDepth: 0.07, crackW: 0.3,
      edgeR: rr(0.8, 2.5), seed, layers,
    };
  }

  const api = { PRESETS, randomDesign };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OrnamentPresets = api;
})(typeof window !== 'undefined' ? window : globalThis);
