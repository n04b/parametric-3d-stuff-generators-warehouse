# SDF Editor

A small solid modeller built on signed distance fields (SDF): put primitives
together with boolean and smooth operations, cover the result with any relief
pattern from [`relief/`](../relief/), and export a closed STL for printing.
Dimensions are in millimetres.

## Running

Everything is in a single `index.html` file: open it in a browser with a double click.
No build step or server needed, three.js is loaded from a CDN (internet connection required).

## Objects

Primitives (each centred on its position, axis along Z):

| Primitive | Size |
| --- | --- |
| Sphere | radius |
| Box | X × Y × Z, edge rounding |
| Cylinder | radius, height, edge rounding |
| Cone | bottom and top radius (a frustum when both are above 0), height, rounding |
| Capsule | radius, overall length |
| Torus | ring radius, tube radius |
| Ellipsoid | three radii |
| Prism | 3–16 sides, radius to the corners, height, edge rounding |
| Pyramid | square base, height |
| Octahedron | radius to the tips |
| Chain link | straight length, ring radius, wire radius |
| Half-space | everything below the object's XY plane; a cutter for slicing the model |

Objects are combined top to bottom in the list: each one is added to, cut from
or intersected with everything above it. Operations: union, subtract,
intersect and their smooth versions with a blend radius (mm), which fillets
the joint. Reorder with the arrows, hide an object with its checkbox.

Every object has a position and a rotation (degrees, applied X, then Y, then Z),
and under the extra sections:

- **Shell thickness**: turns the object into a wall of that thickness inside its surface.
- **Inflate / shrink**: grows or shrinks it by a distance, rounding all edges.
- **Texture strength**: how much of the relief lands on the surface this object
  produces (0 keeps it smooth, e.g. a mug's inside or handle). Across smooth
  joints the strength blends too.
- **Mirror** across the X = 0, Y = 0 or Z = 0 planes.
- **Radial copies** around the Z axis (the object's own angle is kept), and
  **linear arrays** along X, Y and Z with a spacing. Copies are folded
  space, so they cost nothing extra; a copy wider than its spacing is cut.

Move and rotate the selected object with the gizmo in the view (W move, E
rotate, Q hide), or type exact values. Cutters and hidden objects are shown as
a translucent outline when selected.

## Result geometry

Applied to the whole model: offset (grow / shrink), twist around Z, bend around
Y, taper along Z (all per 100 mm of height or length), hollowing with a wall of
a given thickness measured under the deepest relief, and flat cuts below and
above a height (the bottom cut gives a flat face to print on).

## Texture

All patterns of the relief generator with all of their settings: topography,
contours, fibres, dunes, cells, rings, mountains, spikes, gyroid / TPMS,
labyrinth, scales, foam. See [`relief/README.md`](../relief/README.md) for what
each setting does; the pattern code is the same.

The pattern is evaluated in 3D at the point's projection on the base surface
and displaces the surface along its normal, so there are no seams or stretching
on any shape. Settings on top of the pattern's own:

- **Relief depth** and **placement**: carve into the surface (peaks stay on it),
  emboss out of it, or centre on it.
- **Where**: all faces, all but downward or upward faces, sides only, or upward
  faces only, with the half-angle and softness of the smooth zone. Keeps the
  printing face flat.
- **Fade above the bottom cut**, so the relief settles before the flat bottom.
- **Pattern offset** to move the pattern without moving the model.

## Mesh and export

The mesh comes from marching cubes over the SDF, computed in parallel web
workers, slice by slice (memory stays small even for fine grids), skipping
empty space. The preview is built at "Preview detail" cells across the model
(a quick coarse pass comes first when the full one is slow); the STL is built at
"Export cell size". The panel shows the model's size, volume and the expected
triangle count and file size of the export. The mesh is closed and correctly
oriented; by default it's moved so that its lowest point is at Z = 0.

Fine relief needs a cell size of about a third of its smallest detail or less;
as in the relief generator, sharp steps are never sharper than two cells.

Undo / redo (Ctrl+Z, Ctrl+Shift+Z), duplicate (Ctrl+D), delete (Del). The scene
is kept in the page URL and in the browser, so a reload or a shared link brings
it back; it can also be saved to and opened from a `.json` file.

## Structure

All code is in `index.html`:

- `<script id="core">` is shared by the page and the workers:
  - `noise`, `patterns`: copied unchanged from `relief/index.html`
  - `sdf`: primitives, the compiler of the object list into one JS function,
    global deformations, relief displacement, bounds
  - `marching cubes`: slice-by-slice polygonisation with shared vertices
  - `stl`: binary STL writer
- `<script id="worker">`: the mesh worker
- the module script: UI, presets, three.js preview, worker pool, export
