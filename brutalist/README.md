# Brutalist Surface

A parametric generator of brutalist concrete relief. A single HTML file, everything
is computed in the browser. Dimensions in millimetres, export to **STL** and a **16-bit heightmap**.

![Five patterns](docs/preview.jpg)

## Running

Open `index.html` in a browser — no build step needed (Three.js is in `vendor/`).

- **Left mouse** — rotate, **wheel** — zoom, **right mouse** — pan
- Buttons at the bottom left: **Front** (straight-on view, like the photo), **3/4**, **Grazing**
- `R` — random seed, `F` — "Front" view
- "Copy link" — all parameters are stored in the page URL

## Patterns

Each pattern follows its own architectural reference.

| Pattern | What you get | Main parameters |
| --- | --- | --- |
| **Rubble** | Tilted concrete blocks piled on top of each other. | count, size, proportion, tilt, height spread |
| **Blocks** | A wall of protruding cubes. Offset layout: checkerboard, diagonal, random, gradient, wave, noise. | grid, levels, row bond, joint, chamfer, face tilt |
| **Pyramids** | Faceted pyramids with an offset apex on a square, rhombic or triangular grid. | apex offset, direction (random / single / alternating / from centre / flow) |
| **Ribs** | Fins of varying width made of segments of varying depth, with staggered joints. | count, width spread, segment length, levels, gap |
| **Folds** | Panels with a broken face; the fold strength follows a gradient across the slab. | fold line and bevel, break point, gradient |

**Slab** — width, length, base thickness and relief depth (above the base).
**Light and material** affect the preview only: sun azimuth and elevation, concrete/plastic,
concrete texture, tone variation between elements.

All patterns tile seamlessly. The exceptions are gradients and the "from centre" mode:
they are inherently non-periodic.

## Export

| Button | What it is | When to use |
| --- | --- | --- |
| **STL — monolith** | A single closed mesh built from the heightmap (step set by a slider). | 3D printing, CNC, any software that needs a manifold mesh |
| **STL — exact solids** | Each element is a separate closed convex solid with exact faces. The solids intersect the base; slicers (Prusa, Bambu, Cura) merge them automatically. | rendering, small files, perfectly sharp edges |
| **PNG 16-bit** | Heightmap: black is the base, white is the relief maximum. The top of the image is the far edge (Y). | displacement in Blender/Unreal, heightmap-based CNC |

The model is built Z-up: the bottom is at `z = 0`, the relief on top — ready to print "bottom on the bed".

## How it works

Each relief element is described by a set of points and turned into a convex hull.
The hull is then clipped by planes at the slab bounds. That is why the faces are exact and
the solids at the edges are properly trimmed, which gives seamless tiling. For the monolith,
vertical rays are cast from above over a grid to find the top point of the union of solids;
a closed mesh is assembled from the result.

The geometry core lives in `index.html` between the `CORE:BEGIN` / `CORE:END` markers
and depends on neither the DOM nor Three.js.

## Tests

```bash
cd brutalist && npm test
```

The tests check that:

- every solid of every pattern is closed, oriented outwards and lies inside the slab;
- the monolith is watertight and its opposite edges match (seamless tiling);
- the binary STL and 16-bit PNG are valid (including CRC and decompression).
