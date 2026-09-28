import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FIELD_PARAMS, createField } from './patterns.js';
import { SHAPE_PARAMS, buildMesh, estimateTriangles } from './mesh.js';
import { meshToSTL } from './stl.js';
import { PRESETS } from './presets.js';

const PREVIEW_MAX_TRIANGLES = 700_000;
const EXPORT_WARN_TRIANGLES = 8_000_000;

const ALL_PARAMS = [...SHAPE_PARAMS, ...FIELD_PARAMS];
const state = Object.fromEntries(ALL_PARAMS.map((p) => [p.key, p.value]));
Object.assign(state, PRESETS[0].params);
const fromHash = readHash();

const $ = (id) => document.getElementById(id);
const controlsByKey = new Map();

// ---------- form ----------

function makeControl(p) {
  const wrap = document.createElement('label');
  wrap.className = 'field';
  const title = document.createElement('span');
  title.textContent = p.label;
  wrap.append(title);

  if (p.type === 'select') {
    const sel = document.createElement('select');
    for (const [value, text] of Object.entries(p.options)) sel.add(new Option(text, value));
    sel.addEventListener('change', () => update(p.key, sel.value));
    wrap.append(sel);
    controlsByKey.set(p.key, { wrap, set: (v) => (sel.value = v) });
  } else if (p.type === 'bool') {
    wrap.classList.add('bool');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.addEventListener('change', () => update(p.key, box.checked));
    wrap.append(box);
    controlsByKey.set(p.key, { wrap, set: (v) => (box.checked = v) });
  } else {
    const num = document.createElement('input');
    num.type = 'number';
    num.min = p.min; num.max = p.max; num.step = p.step;
    const range = document.createElement('input');
    range.type = 'range';
    range.min = p.min; range.max = p.max; range.step = p.step;
    const parse = (v) => {
      let x = Number(v);
      if (!Number.isFinite(x)) return null;
      if (p.type === 'int') x = Math.round(x);
      return Math.min(p.max, Math.max(p.min, x));
    };
    num.addEventListener('change', () => {
      const x = parse(num.value);
      if (x === null) { num.value = state[p.key]; return; }
      num.value = x; range.value = x;
      update(p.key, x);
    });
    range.addEventListener('input', () => {
      const x = parse(range.value);
      num.value = x;
      update(p.key, x);
    });
    wrap.append(num, range);
    controlsByKey.set(p.key, { wrap, set: (v) => { num.value = v; range.value = v; } });
  }
  return wrap;
}

for (const p of SHAPE_PARAMS) $('shape-params').append(makeControl(p));
for (const p of FIELD_PARAMS) $('field-params').append(makeControl(p));

PRESETS.forEach((pr, i) => $('preset').add(new Option(pr.name, i)));
$('preset').add(new Option('— свои настройки —', 'custom'));
$('preset').value = fromHash ? 'custom' : 0;
$('preset').addEventListener('change', () => {
  const pr = PRESETS[Number($('preset').value)];
  if (!pr) return;
  Object.assign(state, Object.fromEntries(ALL_PARAMS.map((p) => [p.key, p.value])), pr.params);
  syncForm();
  schedule();
});

function syncForm() {
  for (const p of ALL_PARAMS) {
    const c = controlsByKey.get(p.key);
    c.set(state[p.key]);
    const visible = (!p.shapes || p.shapes.includes(state.shape)) && (!p.patterns || p.patterns.includes(state.pattern));
    c.wrap.hidden = !visible;
  }
}

function update(key, value) {
  state[key] = value;
  if (key !== 'resolution') $('preset').value = 'custom';
  if (key === 'shape' || key === 'pattern') syncForm();
  schedule();
}

$('reseed').addEventListener('click', () => {
  update('seed', Math.floor(Math.random() * 100000));
  controlsByKey.get('seed').set(state.seed);
});

// ---------- scene ----------

const viewport = $('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
viewport.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20000);
camera.up.set(0, 0, 1);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.3));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-1, -0.6, 1.4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6);
rim.position.set(1, 1, 0.3);
scene.add(rim);

const material = new THREE.MeshStandardMaterial({ color: 0xf2f1ee, roughness: 0.6, metalness: 0 });
let object = null;

function resize() {
  const { clientWidth: w, clientHeight: h } = viewport;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

function frameObject() {
  const size = state.shape === 'rect' ? Math.max(state.width, state.height) : state.diameter;
  const d = size * 1.9;
  const tilt = state.shape === 'sphere' ? 0.25 : 0.9;
  camera.position.set(0, -d * Math.cos(tilt) * 0.9, d * Math.sin(tilt) + (state.shape === 'sphere' ? 0 : state.base));
  orbit.target.set(0, 0, state.shape === 'sphere' ? 0 : state.base);
  camera.near = size / 200;
  camera.far = size * 20;
  camera.updateProjectionMatrix();
  orbit.update();
}
$('reset-view').addEventListener('click', frameObject);
$('wire').addEventListener('change', () => { material.wireframe = $('wire').checked; });

(function loop() {
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
})();

// ---------- generation ----------

const split = () => [
  Object.fromEntries(SHAPE_PARAMS.map((p) => [p.key, state[p.key]])),
  Object.fromEntries(FIELD_PARAMS.map((p) => [p.key, state[p.key]])),
];

// Coarsens the grid step until the preview fits the triangle budget.
function previewResolution(shape) {
  let res = shape.resolution;
  const tris = estimateTriangles(shape, res);
  if (tris > PREVIEW_MAX_TRIANGLES) res *= Math.sqrt(tris / PREVIEW_MAX_TRIANGLES);
  return res;
}

let timer = 0;
let lastShapeKey = '';
function schedule() {
  clearTimeout(timer);
  $('busy').hidden = false;
  timer = setTimeout(regenerate, 60);
}

function regenerate() {
  const [shape, field] = split();
  const res = previewResolution(shape);
  const mesh = buildMesh(shape, createField(field), res);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
  geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geo.computeVertexNormals();
  if (object) { scene.remove(object); object.geometry.dispose(); }
  object = new THREE.Mesh(geo, material);
  scene.add(object);

  const shapeKey = [shape.shape, shape.width, shape.height, shape.diameter].join();
  if (shapeKey !== lastShapeKey) { frameObject(); lastShapeKey = shapeKey; }

  renderStats(shape, res);
  writeHash();
  $('busy').hidden = true;
}

function renderStats(shape, previewRes) {
  const tris = estimateTriangles(shape);
  const mb = (84 + tris * 50) / 1048576;
  const dims = shape.shape === 'rect'
    ? `${shape.width} × ${shape.height} × ${+(shape.base + shape.depth).toFixed(2)}`
    : shape.shape === 'disk'
      ? `⌀${shape.diameter} × ${+(shape.base + shape.depth).toFixed(2)}`
      : `⌀${shape.diameter}`;
  const rows = [
    ['Габариты, мм', dims],
    ['Треугольников в STL', tris.toLocaleString('ru')],
    ['Размер файла', `${mb.toFixed(1)} МБ`],
  ];
  if (previewRes > shape.resolution * 1.01) rows.push(['Шаг превью', `${previewRes.toFixed(2)} мм`]);
  $('stats').innerHTML = '<dl style="display:contents">' + rows
    .map(([k, v]) => `<dt>${k}</dt><dd${tris > EXPORT_WARN_TRIANGLES && k.startsWith('Тре') ? ' class="warn"' : ''}>${v}</dd>`)
    .join('') + '</dl>';
}

// ---------- export & sharing ----------

$('export').addEventListener('click', () => {
  const [shape, field] = split();
  const tris = estimateTriangles(shape);
  if (tris > EXPORT_WARN_TRIANGLES &&
    !confirm(`Будет ${tris.toLocaleString('ru')} треугольников (~${Math.round((tris * 50) / 1048576)} МБ). Продолжить? Можно увеличить шаг сетки.`)) return;
  const btn = $('export');
  btn.disabled = true;
  $('message').textContent = 'Строю сетку для экспорта…';
  setTimeout(() => {
    try {
      const mesh = buildMesh(shape, createField(field));
      const blob = new Blob([meshToSTL(mesh)], { type: 'model/stl' });
      const name = `texture-${field.pattern}-${shape.shape}-${field.seed}.stl`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      $('message').textContent = `Сохранено: ${name}`;
    } catch (e) {
      $('message').textContent = `Ошибка: ${e.message}`;
    } finally {
      btn.disabled = false;
    }
  }, 30);
});

function writeHash() {
  const q = new URLSearchParams();
  for (const p of ALL_PARAMS) if (state[p.key] !== p.value) q.set(p.key, state[p.key]);
  history.replaceState(null, '', `#${q}`);
}

function readHash() {
  const q = new URLSearchParams(location.hash.slice(1));
  if (![...q.keys()].length) return false;
  Object.assign(state, Object.fromEntries(ALL_PARAMS.map((p) => [p.key, p.value])));
  for (const p of ALL_PARAMS) {
    if (!q.has(p.key)) continue;
    const raw = q.get(p.key);
    if (p.type === 'bool') state[p.key] = raw === 'true';
    else if (p.type === 'select') { if (raw in p.options) state[p.key] = raw; }
    else if (Number.isFinite(Number(raw))) state[p.key] = Number(raw);
  }
  return true;
}

$('share').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    $('message').textContent = 'Ссылка с параметрами скопирована.';
  } catch {
    $('message').textContent = 'Скопируйте адрес страницы: параметры сохранены в нём.';
  }
});

syncForm();
resize();
regenerate();
