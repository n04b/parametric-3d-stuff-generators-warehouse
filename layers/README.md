# Layered Waves

A parametric generator of relief made of wavy plates laid with an overlap:
graphite ribbons, slate, veneer, a topographic map. Dimensions in millimetres,
the result is exported to binary STL (closed solid, flat bottom, ready
for a slicer).

## Running

Everything is in a single `index.html` file: open it in a browser. No build step needed,
three.js is loaded from a CDN (internet connection required).

## How it works

Plate edges are level lines of the field `s` (mm); each band of
"Plate width" is one plate. The field defines the pattern:

- **Stripes** — a tilted plane across the "Layer direction".
- **Rings around a point** — distance to the centre (ripples on water).
- **Contours** — pure noise, edges follow the contour lines of the relief.

On top of that there is anisotropic distortion (bend, scale, detail, stretch
along the layers, swirls). If the bends fold the layers into loops, reduce
the bend or detail, or increase the scale.

**Plates**: the "Overlap ↔ staircase" slider blends shingles (each plate
descends from its edge to the next one, overall height does not grow) and terraces
(plates are flat, each one step higher than the previous, like cardboard layers on a
relief map). Plate profile from convex (cushions) to concave, spread of
width and height, pinch-out: plates fade out in places and merge.

**Edge**: step width and rounding (from a smooth inflection to a quarter circle),
shadow gap at the foot of the step, lip along the top of the edge, raggedness. These sizes
are in millimetres and do not depend on plate width; where plates narrow,
edge details shrink proportionally.

**Surface**: large waves, fibres along the layers (veneer, brushed
wood), fine lines following the edges (slate), smoothing.

Presets: graphite ribbons, slate plates, overlapping veneer, topographic
map, ripples on water. All parameters are saved in the page URL.

**Edge fade** (the "Panel" group): over the given width from the edge the relief
smoothly settles to a flat field, and the corners are rounded. "Edge level" sets where
that field ends up: 0 — at the level of the deepest points of the relief, 1 — flush
with the peaks. Handy for tiles glued edge to edge or set into a frame.

"Mesh step" sets the STL detail; the preview is built coarser if needed
(the preview step is shown in the summary). For fine lines the mesh step should be at least
3 times smaller than the line spacing.

## Code

A single `<script type="module">` in `index.html`, sections:

- `noise`: seeded 2D simplex noise, fbm, hash
- `params`: parameter schema and presets
- `heightmap`: layer field and plate profile on a regular grid
- `mesh`: closed solid (relief, walls, bottom as a fan from the centre)
- `stl`: binary STL
- `main`: UI and three.js preview
