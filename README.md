# 3D Textures

Eight parametric generators of relief 3D textures with STL export.
All dimensions are in millimetres.

| Folder | What it does | How to run |
| --- | --- | --- |
| [`relief/`](relief/) | Noise patterns: topography (terraces), contour lines, fibres, dunes, Voronoi cells, rings. Panel, disc or sphere. Has a CLI. | `cd relief && npm start`, then http://localhost:8080 |
| [`waves/`](waves/) | Interference of circular waves from several sources (moiré effect). | Open `waves/index.html` in a browser |
| [`tiles/`](tiles/) | Modular wall installations made of separate pieces: pyramids, spikes, tilted blocks, cylinders, drops. Rectangular, radial and hexagonal grids. Export the whole installation, each piece, or per printer bed, plus a 1:1 assembly map. | Open `tiles/index.html` in a browser |
| [`ornament/`](ornament/) | Relief decorative tiles: square, hexagon, octagon, circle. The ornament is built from motif layers (rosettes, scrolls, leaves, stars, girih, frames, fluting, facets). Tile arrays with rotations and relief fade towards the edges. Export a single tile, the whole array, or every tile in a ZIP. | Open `ornament/index.html` in a browser |
| [`brutalist/`](brutalist/) | Brutalist concrete relief with crisp faces: rubble, blocks, pyramids, ribs, folds. Export: STL (monolith or exact solids) and a 16-bit heightmap. | Open `brutalist/index.html` in a browser |
| [`glyphs/`](glyphs/) | A wall of concrete letter tiles: each letter is a crease ridge with slopes running down to the base. Text (Latin letters, digits) is laid out on a grid; a space is a flat cell of adjustable height, `^` and `~` are a pyramid and a funnel. Export: STL of the whole panel, a ZIP with every unique tile and a layout map, a 16-bit heightmap. | Open `glyphs/index.html` in a browser |
| [`wood/`](wood/) | Wood relief: growth rings modelled as a cut through a log (quarter-sawn, cathedral arches, figure), knots with rings flowing around them and radial checks, cross and lengthwise cracks, charring/weathering. | Open `wood/index.html` in a browser |
| [`layers/`](layers/) | Overlapping wavy plates: stripes, rings or contours bent by noise. Shingles or terraces, rounded edges, shadow gap, lip, pinch-out, fibres and fine lines. | Open `layers/index.html` in a browser |

See the README in each folder for details.
