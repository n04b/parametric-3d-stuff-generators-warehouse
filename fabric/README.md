# Space Fabric

A parametric generator of print-in-place "space fabric": a chainmail of tiles
linked underneath, in the spirit of the 4D-printed metal fabric made at NASA JPL.
The front is a mosaic of tiles, the back is a layer of hooks and bars that hold
every tile to its neighbours while letting the sheet bend and drape. Everything is
printed in one go, flat, with no supports. Dimensions in millimetres, export to
binary STL.

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

**Links.** Along every shared edge each tile has, side by side:

- a **bar** lying on the bed, between two posts that rise to the tile;
- a **hook**: a post under the tile, a beam that crosses the gap above the
  neighbour's bar and a leg that drops back down behind that bar.

The neighbour has the same pair mirrored, so its hook goes over our bar and our
hook goes over its bar. Pulling the tiles apart catches the leg on the bar, lifting
one tile catches its bar under the other tile's hook, so the tiles stay linked but
can turn and slide by the clearances. Heights from the bed: bar, vertical
clearance, hook beam, vertical clearance, tile. "Links per edge" places several
bar + hook pairs along long edges, "Spread" moves them from the middle of the edge
towards the corners.

The links of neighbouring edges of a tile must not meet near the corners: the
usable part of an edge depends on the corner angle (triangles need longer edges
than squares, hexagons and octagons less). If the edge is too short, the summary
shows "Links do not fit" with the minimum edge for the current link sizes.

Clearances: "Clearance (sideways)" is the gap between parts of different tiles in
plan, "Clearance (vertical)" the gap between the hook and the bar under it and
between the hook and the tile above. For FDM, 0.4–0.5 mm and two layers work well.

**Tiles.** A tile is a loft of its outline along a cross-section profile:

- style: solid tile, or a ring (an open chainmail link);
- outline: the cell polygon, a rounded polygon, a circle, a star, a flower; "Tile
  size" shrinks it inside the cell;
- top: flat, chamfered edge, dome, pyramid, dish, stepped (ziggurat). On a ring,
  dome gives a round section, pyramid a ridge.

If the outline does not cover the posts of the links (a circle, a star, a small
tile, a narrow ring), a thin frame along the cell edge is added under it to hold
the posts; if the tile does not reach that frame, spokes join them.
A "Centre pillar" under a solid tile shortens the bridge of its first layer.

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

The STL is a set of closed, overlapping solids (tile, posts, bars, hooks, model),
which slicers merge on import. Solids of different tiles never touch.

Presets: square space fabric, hexagon scales, triangle mesh, chainmail rings,
octagons and squares, kagome stars, round buttons, flower tiles.
All parameters are saved in the page URL.

The preview has a cutaway (a vertical section moving across the fabric) and a view
from below to inspect the links.

## Code

A single `<script type="module">` in `index.html`, sections:

- `util`: integer hashing
- `params`: parameter schema and presets
- `tilings`: unit cells of the tilings, outline mask, shared edges
- `outlines`: polygon inset, rounded, circle, star and flower outlines
- `mesh`: triangle soup builder (box, loft with orientation check), tile profiles, link layout, fabric
- `decoration`: STL parser, built-in models, placement on the tiles
- `stl`: binary STL
- `main`: UI and three.js preview
