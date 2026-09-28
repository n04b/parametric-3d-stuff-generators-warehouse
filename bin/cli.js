#!/usr/bin/env node
// Command-line STL export: node bin/cli.js --pattern=topo --width=150 --out=panel.stl
import { writeFileSync } from 'node:fs';
import { FIELD_PARAMS, createField } from '../src/patterns.js';
import { SHAPE_PARAMS, buildMesh, estimateTriangles } from '../src/mesh.js';
import { meshToSTL } from '../src/stl.js';

const all = [...SHAPE_PARAMS, ...FIELD_PARAMS];
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) throw new Error(`Непонятный аргумент: ${a}`);
    return [m[1], m[2] ?? 'true'];
  }),
);

if (args.help) {
  console.log('Использование: node bin/cli.js [--параметр=значение ...] [--out=file.stl]\n');
  for (const p of all) {
    const extra = p.options ? ` (${Object.keys(p.options).join(' | ')})` : '';
    console.log(`  --${p.key.padEnd(11)} ${p.label}${extra}, по умолчанию ${p.value}`);
  }
  process.exit(0);
}

const shape = {};
const field = {};
for (const p of all) {
  const raw = args[p.key];
  let v = p.value;
  if (raw !== undefined) {
    if (p.type === 'bool') v = raw === 'true' || raw === '1';
    else if (p.type === 'select') {
      if (!(raw in p.options)) throw new Error(`--${p.key}: ожидается ${Object.keys(p.options).join(', ')}`);
      v = raw;
    } else {
      v = Number(raw);
      if (!Number.isFinite(v)) throw new Error(`--${p.key}: ожидается число`);
    }
  }
  (SHAPE_PARAMS.includes(p) ? shape : field)[p.key] = v;
}

const out = args.out ?? `texture-${field.pattern}-${field.seed}.stl`;
const tris = estimateTriangles(shape);
console.log(`Строю ${tris.toLocaleString('ru')} треугольников…`);
const mesh = buildMesh(shape, createField(field));
const stl = meshToSTL(mesh);
writeFileSync(out, Buffer.from(stl));
console.log(`Готово: ${out} (${(stl.byteLength / 1048576).toFixed(1)} МБ)`);
