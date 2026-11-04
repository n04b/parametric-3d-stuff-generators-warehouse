# SDF Editor

A small solid modeller built on signed distance fields (SDF): put primitives
together with boolean and smooth operations, organise them in groups, cover
any part, group or the whole model with its own relief texture (any pattern
from [`relief/`](../relief/)), and export a closed STL for printing.
Dimensions are in millimetres.

## Running

Everything is in a single `index.html` file: open it in a browser with a double click.
No build step or server needed, three.js is loaded from a CDN (internet connection required).

## The window

- **Top bar**: presets, undo / redo, open / save a `.json` scene, copy a link,
  mesh settings and the STL download.
- **Left**: the parts palette, the scene tree and the texture library.
- **Middle**: the 3D view. The model is tinted with the colours of the
  textures on it, the selected part is blue. Click a part to select it, click
  it again to select its group (and again for the group above).
- **Right**: the properties of whatever is selected: a part, a group, several
  items, the whole model or a texture.

On a narrower screen the scene and the properties share one column; on a
phone the view stays at the top and the scene, properties and textures are
tabs under it (tapping the model opens its properties).

## Scene tree

The top row is the whole model. Under it are parts and groups; groups can
hold parts and other groups. Inside every group, children combine top to
bottom: each is added to, cut from or intersected with everything above it
**in that group**, so a group keeps its cuts to itself, and then the group
joins the level above like a single part.

Every row shows the operation (∪ add, − cut, ∩ common; ~ when smooth), a
texture chip and, on hover, an eye to hide it. Rows can be dragged to
reorder them or into a group (top or bottom edge of a row: before / after it,
middle of a group: into it); they keep their place in the world.

- Click selects, Ctrl / ⌘‑click adds to the selection, Shift‑click selects a range.
- Double click or F2 renames, the arrow keys move through the rows.
- **Group** (Ctrl+G) wraps the selection in a group with its pivot in the
  middle of them; items that all cut make a group that cuts.
  **Ungroup** (Ctrl+Shift+G) moves the children back up and keeps what the group
  gave them (placement, texture, the group's cut).
- Duplicate (Ctrl+D), delete (Del), hide / show (H), move up / down.

New parts go into the selected group, or right after the selected part.

## Parts and groups

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

Parts and groups share these settings:

- **Combine**: add, cut or keep the common part, with a **blend radius** (0 =
  sharp) that fillets the joint.
- **Position and rotation** (degrees, applied X, then Y, then Z), relative to
  the group the item is in: moving or turning a group moves everything in it.
  Drag the letter of a box sideways to change the number (Shift: fine, Alt:
  coarse), or use the gizmo in the view (W move, E rotate, Q hide).
  "Sit on the bed" moves a part down to Z = 0.
- **Shell thickness**: turns it into a wall of that thickness inside its surface;
  **inflate / shrink** grows or shrinks it, rounding all edges.
- **Mirror** across the X = 0, Y = 0 or Z = 0 planes of the group it is in,
  **radial copies** around the group's Z axis (its own angle is kept) and
  **linear arrays** along X, Y and Z with a spacing. Copies are folded space, so
  they cost nothing extra; a copy wider than its spacing is cut. On a group
  these repeat the whole group, e.g. a crown of nine spikes with a gem each.

Cutters and hidden items are shown as a translucent outline when selected.

## Textures

Textures live in a library. Each has a name, a colour (the tint in the view),
a pattern with all the settings of the relief generator (topography,
contours, fibres, dunes, cells, rings, mountains, spikes, gyroid / TPMS,
labyrinth, scales, foam; see [`relief/README.md`](../relief/README.md), the
pattern code is the same) and how the relief lands on the surface:

- **Relief depth** and **placement**: carve into the surface (peaks stay on it),
  emboss out of it, or centre on it.
- **Where**: all faces, all but downward or upward faces, sides only, or upward
  faces only, with the half-angle and softness of the smooth zone. Keeps the
  printing face flat.
- **Pattern position**: an offset that moves the pattern without moving the model.

The pattern picker shows a sample of every pattern; switching patterns loads
sizes that suit it. The preview on top of a texture's properties is a patch
of a few of its features (the width is written under it); scales that flow
down are shown on a wall.

### Which texture goes where

Any node — the whole model, a group or a part — can have:

| Setting | Its surface gets |
| --- | --- |
| Inherit (parts and groups) | the texture of the group it is in, times its strength |
| A texture | that texture, at its strength |
| A texture, layered | that texture on top of the inherited one (displacements add up) |
| No texture | a smooth surface, e.g. the inside of a mug or a gem |

So a texture on the model covers everything that doesn't choose otherwise, a
texture on a group covers that group, and a part can still override it.
**Strength** (0–1) scales how much relief lands on that surface. Where parts
with different textures meet in a smooth joint, the textures blend across
the joint along with the shapes. The surface a cutter leaves behind (a door
cut into a wall, the inside of a mug) gets the cutter's texture.

To apply a texture: drag it from the library onto a row or onto the model (a
part under the pointer, or the whole model on empty space), pick it from the
chip next to a row or the texture box in the properties, or open the texture
and press "Apply to …" for the selection. Hovering a texture in the library
highlights where it is on the model. Deleting a texture makes its users
inherit again.

The pattern is evaluated in 3D at the point's projection on the base surface
and displaces the surface along its normal, so there are no seams or
stretching on any shape.

## Whole model

Selecting the top row (or clicking empty space in the view) shows what
applies to the whole result: its texture, offset (grow / shrink), twist
around Z, bend around Y, taper along Z (all per 100 mm of height or length),
hollowing with a wall of a given thickness measured under the deepest relief,
and flat cuts below and above a height (the bottom cut gives a flat face to
print on, and the relief can fade out above it).

## Mesh and export

The mesh comes from marching cubes over the SDF, computed in parallel web
workers, slice by slice (memory stays small even for fine grids), skipping
empty space. The preview is built at "Preview detail" cells across the model
(a quick coarse pass comes first when the full one is slow), the STL at
"Export cell size"; both are in the Mesh menu, with the model's size, volume
and the expected triangle count and file size of the export. Renaming or
recolouring doesn't rebuild the mesh, and "Relief" in the view can be turned
off for a quick preview of the shapes (the export always has it).

The mesh is closed and correctly oriented, specks smaller than two cells that
float free are dropped, and by default it's moved so that its lowest point is
at Z = 0. Fine relief needs a cell size of about a third of its smallest
detail or less; as in the relief generator, sharp steps are never sharper
than two cells.

Undo / redo (Ctrl+Z, Ctrl+Shift+Z). The scene is kept in the page URL (with
default values left out) and in the browser, so a reload or a shared link
brings it back; it can also be saved to and opened from a `.json` file.
Scenes and links of the first version (a flat list with one texture) open
with that texture on the whole model.

## Structure

All code is in `index.html`:

- `<script id="core">` is shared by the page and the workers:
  - `noise`, `patterns`: copied unchanged from `relief/index.html`
  - `sdf`: primitives, parts / groups / textures and their settings, texture
    resolution down the tree (`textureVectors`, `planScene`), the compiler of
    the tree into one JS function that returns the distance, the weight of
    every texture and the part index (`compileScene`), bounds, the full field
    with whole-model geometry and the relief of every texture
    (`createSceneField`), pattern preview tiles
  - `marching cubes`: slice-by-slice polygonisation with shared vertices,
    speck removal, per-vertex texture weights and part indices for the preview
  - `stl`: binary STL writer
- `<script id="worker">`: the worker (mesh slabs and preview tiles)
- the module script: presets, document and undo, the tree, the texture
  library, the properties panel, the three.js view (picking, tints, gizmo,
  outlines), the worker pool, export
