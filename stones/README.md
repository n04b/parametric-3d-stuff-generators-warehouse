# Faceted Stones

A parametric generator of a wall of chiselled stones: irregular polygonal stones
with rounded edges and large facets, separated by joints, like plaster 3D wall
panels. Dimensions in millimetres, the result is exported to binary STL (closed
solid, flat bottom, ready for a slicer).

## Running

Everything is in a single `index.html` file: open it in a browser. No build step needed,
three.js is loaded from a CDN (internet connection required).

## How it works

**Layout.** Stones are the cells of a power (Laguerre) diagram of a random packing
of circles. Circles of different radii are grown from the panel centre, so big and
small stones mix like in a laid wall, and every cell holds its circle: there are no
slivers. "Size spread" sets the ratio between the biggest and the smallest stone
(up to 4×). "Elongation" and its direction stretch the whole layout, "Edge
curvature" bends the joints with noise.

**Joints and edges.** A stone is its cell shrunk by half a joint on every side.
"Corner rounding in plan" rounds the corners of this outline; large values turn
the stones into pebbles. In section the edge is a round-over of the "Edge rounding"
radius that runs into a wall leaning outwards by the "Wall slope", down to the base.
Where the walls of neighbouring stones meet above the base, the joint becomes a V.
"Joint along the panel edge": the panel edge is half a joint, so panels laid side
by side show a regular joint; without it the pattern runs past the edge and is cut.

**Stone shape.** The top of every stone is a tilted plane, carved by:

- **facets**: planes falling outwards from a line inside the stone. Their
  directions are spread around the stone, like on a chipped rock. "Facet width"
  is how far in a facet reaches (share of the way from the centre to the edge),
  "Facet angle" is its slope;
- **folds**: V-shaped valleys that enter from an edge. With "Fold length" below 1
  a fold closes to a point inside the stone (the chevrons of cut pebbles), long
  folds cross the whole stone;
- **scoops**: elliptic bowls; "Scoop depth" sets the slope at the rim.

All creases are rounded with the "Crease rounding" radius (a smooth minimum),
"Pillow" makes the tops convex. The angles are the same for small and big stones.
The top of a stone is at the "Relief height", lowered at random by "Height spread";
if the carving would go below the "Lowest point of a stone", the stone is squeezed
to fit. "Roughness" adds fine noise to the tops.

Presets: plaster stones, cut pebbles, soft cells, crystal shards, flagstones.
All parameters are saved in the page URL.

"Mesh step" sets the STL detail; the preview is built coarser if needed (the preview
step is shown in the summary). The edge profile is averaged over one mesh step on
either side of the outline, so a wall is never narrower than two mesh steps
(otherwise it lands on the grid as a comb). For crisp narrow joints reduce the
mesh step: a joint should be at least 3 mesh steps wide.

## Code

A single `<script type="module">` in `index.html`, sections:

- `noise`: seeded 2D simplex noise, fbm, hash, smooth minimum
- `params`: parameter schema and presets
- `layout`: circle packing, power diagram cells, convex polygon clipping
- `stones`: stone outline with rounded corners, signed distance to it, carved top
- `heightmap`: owner stone of every sample, edge profile, walls of the neighbours
- `mesh`: closed solid (relief, walls, bottom as a fan from the centre)
- `stl`: binary STL
- `main`: UI and three.js preview
