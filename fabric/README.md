# Space Fabric

A parametric generator of print-in-place "space fabric": a chainmail of tiles,
in the spirit of the 4D-printed metal fabric made at NASA JPL. The front is a mosaic
of tiles; rings, free links, hooks, rod hinges or flexible strips hold every tile to
its neighbours while letting the sheet bend and drape. Everything is printed in one
go, face up, flat, with no supports. Dimensions in millimetres, export to binary STL.

## Running

Everything is in a single `index.html` file: open it in a browser. No build step needed,
three.js is loaded from a CDN (internet connection required).

## How it works

**Tilings.** Tiles are the cells of a tiling with equal edges, so every shared edge
gets the same link:

- squares, rhombi (sheared squares, adjustable angle);
- hexagons, triangles;
- octagons + squares (4.8.8), hexagons + triangles (kagome, 3.6.3.6).

"Tile edge" sets the size, "Tiling rotation" turns the pattern inside the fabric
outline (rectangle, ellipse / circle, hexagon, diamond). Only tiles lying fully
inside the outline are kept; a tile without neighbours is dropped.

**Joints.** Every shared edge gets one or more joints. All of them print face up
on a flat bed with no supports: every overhang is either on the bed, a short bridge
between two supports, or a 45° chamfer. Five types:

| Type | How it holds | Bends (defaults), tiles out / in | Notes |
| --- | --- | --- | --- |
| Ring around a bar (default) | a closed ring on one tile goes around a raised bar held by two posts of the other | 180° / ~47° | closed loop, cannot come apart |
| Free link between two bars | a separate closed link goes around a bar of each tile | 180° / ~53° | two pivots per joint, the most cloth-like; links are a separate colour |
| Hook over a bar | post, beam over the neighbour's bar, leg behind it | ~48° / ~33° with the "Compact hooks" preset | thinnest (4.2 mm); open hook, see below |
| Hinge on a rod | knuckles along the edge, a rod of one tile through holes in the knuckles of the other | ~117° / ~112° | tiles lie on the bed, no bridges under them; folds along lines |
| Flexible strips | thin strips join neighbouring tiles at the bottom | depends on the material | one piece; TPU or PETG (PLA strips crack) |

Why the joints were reworked: in the earlier version each edge carried a bar of each
tile, one on each side of the gap. Two bars give two parallel pivots, so the joint jams
after a few degrees (about 7° tiles out and 13° tiles in, with 0.4 mm of play): the
sheet behaved like a stiff plate. Now all joints of an edge face the same way
("Direction on each edge": one way with all tiles alike, one way by tile colour, or the
old alternating layout), the bar sits in a roomy ring window ("Extra play when
pulled"), and the ring corners and the tile edges are chamfered so the tiles can turn
a long way before anything touches.

The summary shows how far two neighbouring tiles bend each way, the play when the
sheet is pulled or pushed and whether the joint can come apart. These limits come from
a section across the edge: the moving tile is turned step by step while the free
positions of its joint are followed. The hook is an open shape: with a large clearance
over it, it can lift off the bar when bent hard, and the summary says so ("Can come
apart"). Lower the clearance under bridges or use a taller bar. Rings and links are
closed loops and never come apart.

Hinges lock where three tiles meet at a corner (hexagons, octagons + squares): use
squares, rhombi, triangles or kagome. The tile is thickened if the rod and the walls
around its hole do not fit in it.

Joint settings: joints per edge and their spread, extra play when pulled, ring / hook
width, ring wire, bar width and thickness, post width and inset, hook leg and
thickness, rod diameter, knuckles per edge, strip width and thickness, loops on the
outer edges (for attaching sheets). The joints of neighbouring edges keep the
clearance near the corners; if an edge is too short the summary shows "Joints do not
fit" with the minimum edge.

**Printing.** All heights of the joints are snapped to whole layers ("Layer height",
"First layer height"), so the slicer keeps every gap. "Clearance sideways" is the gap
between parts of different bodies in plan (0.4 mm), "Clearance under bridges" the gap
under every bridged part: a bar over a ring, a ring over a bar, a tile over the joints
(0.6 mm, three layers at 0.2: bridges sag). "First layer chamfer" trims the bottom edges
of the parts on the bed against elephant foot. "Line width" is only used to flag parts
thinner than two lines. The summary lists the heights of the joint layers and the
longest bridge inside a joint.

**Tiles.** A tile is a loft of its outline along a cross-section profile:

- style: solid tile, or a ring (an open chainmail link);
- outline: the cell polygon, a rounded polygon, a circle, a star, a flower; "Tile
  size" shrinks it inside the cell;
- top: flat, chamfered edge, dome, pyramid, dish, stepped (ziggurat). On a ring,
  dome gives a round section, pyramid a ridge.

If the outline does not cover the posts of the joints (a circle, a star, a small
tile, a narrow ring), a thin frame along the cell edge is added under it to hold
the posts; if the tile does not reach that frame, spokes join them.
A "Centre pillar" under a solid tile, flared at 45° under the tile, shortens the
bridges of its first layer. "Bevel under the tile edges" is a 45° chamfer under the
outer edge: it gives the joints room when the sheet bends tiles in.

**Model on the top face.** Any STL (binary or ASCII) can be placed on the tiles:
it is centred on its bounding box, stood on its lowest point, scaled to a share of
the tile (inscribed circle) and sunk into the tile by a fraction of a millimetre so
the slicer merges them. Height can be proportional or set in millimetres. Turn per
tile: same for all, following the tile (triangles pointing up and down get their
own turn), alternating, random. Placement: all tiles, a checkerboard (colour
classes of the tiling), its inverse, the largest tiles only (octagons, hexagons in
mixed tilings) or a random share. Built-in models: hemisphere, cone, pyramid,
stud, star, heart, ring. The STL itself is not stored in the link.

Export: fabric and models together, the fabric only, or the models only (for a
second colour / material, they line up with the fabric).

The STL is a set of closed, overlapping solids (tile, posts, bars, rings, links,
knuckles, model), which slicers merge on import. Solids of different bodies keep the
clearance and never touch (only flexible strips join tiles on purpose).

Presets: rings around bars (squares), free links on hexagons, hinged plates, hinged
triangles, chainmail rings, octagons and squares, kagome stars, compact hooks,
flexible TPU / PETG sheet, round buttons, flower tiles.
All parameters are saved in the page URL.

The preview has a cutaway (a vertical section moving across the fabric) and a view
from below to inspect the links.

## Code

A single `<script type="module">` in `index.html`, sections:

- `util`: integer hashing
- `params`: parameter schema and presets
- `tilings`: unit cells of the tilings, outline mask, shared edges
- `outlines`: polygon inset, rounded, circle, star and flower outlines
- `links`: layer grid, joint geometry of each type (parts in the frame of an edge), corner reach and spacing of the joints, roles of the tiles on each edge, bending limits (2D section across the edge)
- `mesh`: triangle soup builder (box, loft, ring chains, joint parts with a first layer chamfer), tile profiles, fabric
- `decoration`: STL parser, built-in models, placement on the tiles
- `stl`: binary STL
- `main`: UI and three.js preview
