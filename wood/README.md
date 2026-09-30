# Wood Texture

A parametric generator of wood relief: growth rings, knots, cracks.
Dimensions in millimetres, the result is exported to binary STL (closed solid,
flat bottom, ready for a slicer).

## Running

Everything is in a single `index.html` file: open it in a browser. No build step needed,
three.js is loaded from a CDN (internet connection required).

## How it works

A board is a planar cut through a log. The trunk axis runs along the grain, growth rings are
lines of equal distance from the axis. All sawing types follow from this:

- **Distance to pith** 0 — quarter-sawn, straight parallel stripes;
  larger — flat-sawn, "arches" (cathedrals) appear in the middle of the board.
- **Trunk tilt** — the axis is not parallel to the cut plane, the arches close along the board.
- **Grain bend / Swirls** — noise bends the rings, swirls twist them
  into figured grain, like driftwood.

Ring relief: latewood is a ridge, earlywood is carved out as a groove (as after
charring or sandblasting). You set the ridge width, groove shape (V or U),
asymmetry, ridge height variation from year to year, uneven wear, fine
fibres and large surface waves.

**Knots**: rings flow around a knot like a stream around an obstacle (the eye), with its own
concentric rings inside. Radius, elongation, flow strength and zone, height
(protruding or sunken), radial checks and a crack along the outline.

**Cracks**: cross cracks (a grid of short cracks across the grain, like on a charred
board) and lengthwise cracks (along individual rings, with tapering ends). Common width
and edge raggedness.

Presets: charred board with knots, dark board with figured grain, weathered driftwood,
planed board with arches. All parameters are saved in the page URL.

"Mesh step" sets the STL detail; the preview is built coarser if needed
(the preview step is shown in the summary). For 2–3 mm rings and ~1 mm cracks a 0.2–0.3 mm step is needed.

## Code

A single `<script type="module">` in `index.html`, sections:

- `noise`: seeded 2D simplex noise, fbm, anisotropic Voronoi with distance to the boundary in mm
- `params`: parameter schema and presets
- `heightmap`: wood model on a regular grid
- `mesh`: closed solid (relief, walls, bottom as a fan from the centre)
- `stl`: binary STL
- `main`: UI and three.js preview
