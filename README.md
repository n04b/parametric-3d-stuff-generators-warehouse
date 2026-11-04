# Parametric 3D Stuff Generators Warehouse

![Thingies](thingies.png)

Some parametric generators of relief 3D textures and printable models, all with STL export. Dimensions are in millimetres.

| Folder | What it does |
| --- | --- |
| [`relief/`](relief/) | Noise patterns: topography (terraces), contour lines, fibres, dunes, Voronoi cells, rings, mountains (ridges), spikes, gyroid and other TPMS, labyrinth (Turing patterns, brain coral), scales, foam / bubbles. Rectangular, round or polygon panel, cylinder, tube/vase, cube/box, sphere, torus. |
| [`sdf/`](sdf/) | SDF solid editor: sphere, box, cylinder, cone, capsule, torus, ellipsoid, prism, pyramid, octahedron, chain link, half-space cutter, in a tree of groups. Union, subtraction, intersection with smooth blends, mirrors and arrays of parts or whole groups, twist / bend / taper, hollowing, flat cuts. A library of textures (any relief pattern from `relief/`) applied to single parts, to groups or to the whole model: inherited, replaced, layered or left smooth, blending across smooth joints. Click or drag-and-drop editing, marching cubes mesh, STL export. |
| [`waves/`](waves/) | Interference of circular waves from several sources (moiré effect). |
| [`tiles/`](tiles/) | Modular wall installations made of separate pieces: pyramids, spikes, tilted blocks, cylinders, drops. Rectangular, radial and hexagonal grids. Export the whole installation, each piece, or per printer bed, plus a 1:1 assembly map. |
| [`ornament/`](ornament/) | Relief decorative tiles: square, hexagon, octagon, circle. The ornament is built from motif layers (rosettes, scrolls, leaves, stars, girih, frames, fluting, facets). Tile arrays with rotations and relief fade towards the edges. Export a single tile, the whole array, or every tile in a ZIP. |
| [`brutalist/`](brutalist/) | Brutalist concrete relief with crisp faces: rubble, blocks, pyramids, ribs, folds. Export: STL (monolith or exact solids) and a 16-bit heightmap. |
| [`glyphs/`](glyphs/) | A wall of concrete letter tiles: each letter is a crease ridge with slopes running down to the base. Text (Latin letters, digits) is laid out on a grid; a space is a flat cell of adjustable height, `^` and `~` are a pyramid and a funnel. Export: STL of the whole panel, a ZIP with every unique tile and a layout map, a 16-bit heightmap. |
| [`wood/`](wood/) | Wood relief: growth rings modelled as a cut through a log (quarter-sawn, cathedral arches, figure), knots with rings flowing around them and radial checks, cross and lengthwise cracks, charring/weathering. |
| [`layers/`](layers/) | Overlapping wavy plates: stripes, rings or contours bent by noise. Shingles or terraces, rounded edges, shadow gap, lip, pinch-out, fibres and fine lines. |
| [`stones/`](stones/) | Faceted stones: irregular stones of mixed size with rounded edges, separated by joints. Tops carved with facets, V-folds (chevrons) and scoops. From plaster wall panels to cut pebbles and flagstones. |
| [`khrushchyovka/`](khrushchyovka/) | Soviet five-storey blocks of flats as printable models: large-panel, large-block or brick walls, entrances with canopies, stairwell windows, balconies or loggias, flat, gable or hip roof, lived-in details. Self-supporting overhangs, hollow shell with windows cut through for lighting, split into parts with pin holes. |
| [`fabric/`](fabric/) | Print-in-place space fabric (after NASA's 4D-printed chainmail): tiles linked underneath by hooks and bars. Squares, rhombi, hexagons, triangles, octagons + squares, hexagons + triangles; solid tiles or rings, polygon / rounded / circle / star / flower outlines, flat, chamfered, domed, pyramid, dish or stepped tops. Any STL placed on the top face of the tiles. |
| [`motion/`](motion/) | Abstract solids sculpted by moving a phone: shake, tilt and spin it, touch the screen, make noise (accelerometer, gyroscope, microphone). The gesture is frozen into a vase (time runs upwards), a spiky blob or a ring. Live mode, mobile-first UI, the take is saved in the link. |

See the README in each folder for details.
