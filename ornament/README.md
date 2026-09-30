# Ornament — relief tile generator

A parametric generator of relief ceramic tiles: rosettes, scrolls, leaves, frames,
stars, girih, fluting, facets. A tile can be square, hexagonal (flat side or corner up),
octagonal or round. Tiles can be assembled into an array where the relief fades towards the edges.
All dimensions are in **millimetres**, export to **STL**.

![preview](docs/preview.jpg)

## Running

Open **`index.html`** in a browser (a double click works). Three.js is in `vendor/`,
no internet needed. Parameters are kept in the browser between sessions.

## How it works

A tile is a base of thickness `T` with relief on top. The relief is made of **layers**,
each layer is one **motif** replicated across the tile.

### Motifs

| Motif | What it is |
| --- | --- |
| Petal / leaf | Leaf, petal, drop, rhombus. Parameters: bend (crescent, leaf curl), tip sharpness, position of maximum width, heart notch, vein. |
| Circle / ring / sector | Dots, rings, half-discs. |
| Rectangle | Bars and squares with rounded corners. |
| Scroll | A spiral with a tail: radii, number of turns, thickness along the length, tail bend, ball in the centre. |
| Curve (stem) | A cubic Bézier curve with variable thickness and balls at the ends. |
| Arc | Part of a circle of a given thickness. |
| Band | A straight strap, e.g. the diagonal straps of azulejos. |
| Star | A star with N rays. With the "Chamfer" profile you get faceted rays with a sharp ridge. |
| Star polygon {n/k} | Lines through every k-th vertex of an n-gon — the basis of girih. |
| Lobed outline | Quatrefoil, sexfoil and multifoil. In "outline only" mode it gives interlaced straps. |
| Edge frame | A band along the tile outline at a given inset. |

### Layer relief

- **Mode**: *blend* (maximum with what is already there), *overlay* (on top), *cut* (a recess, e.g. a bowl).
- **Slope profile**: rounded, chamfer (facets), smooth, concave; slope width in mm.
- **Fill**: solid or outline only with a given thickness.
- **Tilt** along and across the motif axis: flat tilted faces, like the "cube" on a hexagon.
- **Fluting**: parallel stripes, rings, rays (fan) or nested outlines. Wave shape:
  ridges, sine or steps.

### Placement

A motif lies along its axis (0° — to the right). Copies are built on two levels:

1. **Around a circle** about the tile centre (`copies`, `first copy angle`, `distance from centre`,
   `mirror pairs`) or **on a lattice** (square or hexagonal, with step, rotation and offset).
2. **As a fan** around the resulting point (`copies`, `spread`, `rotation`, `offset`). This is how
   corner palmettes, arcs of drops and rays are made.

Motifs that extend beyond the tile edge are clipped. So a quarter rosette in the tile corner
becomes a full rosette where four tiles meet.

### Surface

- **Glaze pooling** — smoothing of the whole relief, like thick glaze.
- **Craquelure** — a network of fine cracks (Voronoi cells).
- **Shagreen** — fine noise texture.

## Array and fade

Tiles are laid out in an array of `columns × rows` with a given joint. For hexagons, rows are offset
as they should be. Tiles can be rotated: checkerboard, 2×2 pinwheel, by rows, by columns or
randomly (90° step for squares, 60° for hexagons).

**Relief fade** reduces the pattern height towards the edges of the array:

| Mode | How it is computed |
| --- | --- |
| To edges | By distance to the nearest edge of the array rectangle. |
| From centre | By an ellipse inscribed in the array. |
| From one side | A gradient in a given direction. |

Parameters: fade zone width (mm), relief remaining at the edge (0 — completely flat), curve,
"ragged" boundary (noise). The fade is computed in the coordinates of the whole array, so the pattern flows smoothly
across joints and every tile comes out unique.

## Export

| Button | What you get |
| --- | --- |
| **STL — single tile** | One tile without fade, at the origin. |
| **STL — whole array** | All tiles in place in one binary STL, each a separate closed solid. |
| **ZIP — every tile** | With fade: a separate STL for each tile (`R01C01.stl`…). Without fade: a single `tile.stl`. The archive also contains `layout.txt` with coordinates and rotations, and `params.json`. |
| **Save / load parameters** | JSON with all settings. |

Each tile is a closed mesh without self-intersections: the bottom is at `z = 0`, relief facing up, it prints
without supports. The STL mesh step is set separately from the preview. At a 0.3 mm step a 150 mm tile is
about 0.5 million triangles (~25 MB). An estimate of the file sizes is shown under the buttons.

The tile size changes together with the pattern if "Scale pattern with tile" is enabled.
Heights do not change in that case; use "Relief height scale" for them.

## Printing notes

- Narrow details (thin outlines, craquelure cracks) only make sense if the STL mesh step
  is noticeably smaller than their width.
- A "Cut" layer never lowers the surface below 0.6 mm from the bottom. If a recess hits
  this limit, a warning appears in the stats.

## Files

```
index.html   UI, 3D preview, export
core.js      geometry: motifs, replication, height field, array and fade, mesh, STL and ZIP (no dependencies)
presets.js   presets based on references and a random tile generator
vendor/      Three.js r128 + OrbitControls (MIT)
```

`core.js` and `presets.js` also work in Node:

```js
const C = require('./core.js');
const { PRESETS } = require('./presets.js');
const D = C.normalizeDesign(PRESETS[0].d);
const mesh = C.buildTileMesh(C.computeRelief(D, 0.3), null, null);
require('fs').writeFileSync('tile.stl', C.concat(C.stlParts([C.stlChunk(mesh, null)])));
```
