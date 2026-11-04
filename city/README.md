# Impossible City

A fragment of a metaphysical city as a printable game level: a route that
climbs by stairs and crosses lower ground on viaducts, buildings of arched
windows and arcades, towers, a pit of pillars, gates, balls and obelisks, all on
an island that floats on a 45° taper. Every city is laid out from a seed, can be
edited cell by cell, and exports to binary STL as one closed solid that prints
upright without supports.

## Running

Everything is in a single `index.html` file: open it in a browser. No build step
needed, three.js and the solid modelling library [manifold-3d](https://github.com/elalish/manifold)
are loaded from a CDN (internet connection required).

The city is built in a Web Worker. A page opened straight from disk may not be
allowed to start one; it then builds on the page itself. To keep the page
smooth, serve the folder, for example with `python3 -m http.server`.

## The impossible part

**The endless stair.** A square ring of walkway on arches climbs two (or three)
levels as it goes round a well full of pillars. Its last cell stands as many
cells nearer to the viewer, on both axes, as it has climbed. Seen along the one
direction where a step of one cell back on both axes and one level down lands on
the same spot, the end meets the start and the stair never ends. **Impossible
view** turns the isometric camera to exactly that direction: one cell across,
one cell back and one level down along the line of sight. Zooming and panning
keep the illusion, turning the view breaks it. A print shows the same trick
photographed from that angle with a long lens.

**The wanderer.** A small figure walks the city: along roofs at one level, up and
down stairs, through gates. In the impossible view it also takes the ghost links
and steps from the dead end onto the walkway it lines up with, round and round.
A ghost link is found wherever a walkway with a single way out ends one level
above a walkway one cell back on both axes, with nothing standing up on the
sight line in between. So links you build in the constructor work too.

## Constructor

**Edit** (or the E key) shows the tools; click a cell to change it, drag to turn
the view. Raise and Lower (Shift-click does the opposite), Block, Stair (click
again to turn it; it points itself at the neighbour one level up when there is
one), Arcade (arches on every level; click again for along X, along Y or both),
Tower (click again for a dome, spire, ball or flat top), Pillar, Route (the cells
the figure prefers and the preview paves), ornaments (ball, gate, obelisk, dome,
a stone figure), Bare roof and Remove. Undo and redo: ⌘Z and ⇧⌘Z. **Empty island**
starts from a flat lot.

City settings (seed, size, height, the loop, the pit, how many towers, gates
and ornaments) lay out a new city; an edited one stays in the undo history.
Architecture and island settings only change how the grid is built, so edits
survive them. The link stores the edited grid itself.

## Units

All sizes are millimetres of the print. A cell is one square of the grid, a
level one storey; with a level as high as a cell, the city is made of cubes and
the impossible view is a true isometric view.

## How the city is laid out

1. The island: the grid with bites taken out of its edges by coarse noise,
   reduced to its largest connected piece.
2. The endless stair, in the front corner with a plaza round it, so nothing
   stands between it and the viewer.
3. The route from the front edge through one or two waypoints (cheapest paths
   over random costs with a penalty per turn, never touching itself), with
   stairs in runs of one to three on straight stretches.
4. A pit of pillars of random heights, then blocks of buildings whose heights
   follow the route: plazas at its level, terraces below it, walls above it. The
   city steps down towards the viewer like seats in a theatre. Some buildings
   are arcades, arched on every level.
5. Towers, viaducts where the route crosses lower ground, gates over the route,
   balls, obelisks and domes on roofs that stand above their neighbours, a gate
   and an orb at the goal.

Each seed also gets a chapter and a name, shown over the view.

## Printing

- **Self-supporting crowns.** Arches, windows and gateways follow their curve
  only up to the steepest overhang (45° by default, 30–70° adjustable), then run
  on in straight lines to a tip. Balls and heads are cut flat just above where
  they would overhang more. Arches narrow by themselves when levels are too low
  for their curve.
- **Floating island.** The ground is a slab of the given thickness; under it the
  island tapers at 45° to a foot (the taper stops short if the foot would get
  too small). Or a flat underside.
- **Overhang check.** The stats show the area of faces that overhang past the
  limit, away from the bed. "Overhangs" in the view paints them red. Flat
  lintels and round crowns without self-support show up there.
- **One closed solid.** Pieces join by overlapping volumes, and where their faces
  coincide they face the same way: solids that merely touch can come out as two
  shells, and a hair of overlap leaves slivers. Columns that would meet only
  along a corner get a hair-thin pillar there, since no solid can share an edge.
  The stats report separate pieces and any edges that do not close.

## Preview

Styles: **Game** (flat tones by the way a face turns, haze towards the ground,
ambient occlusion), **Clay** (lit with shadows) and **Ink** (paper with drawn
edges). Palettes: Monument, Dusk, Mint, Desert, Concrete and Night (lit windows
and arches that glow). Isometric or perspective camera.

## Code

The geometry is a module in `<script type="text/plain" id="geometry">`; the page
imports it for the parameters, the generator and the walking graph, and starts
the worker from it. Sections:

- `util`, `params`: hash, seeded random numbers, parameter schema and presets
- `grid`: the cell (kind, top and floor level, direction, ornament, route
  flag), what a cell closes off for its neighbours, the grid packed into the
  link (three bytes a cell)
- `generator`: island mask, route finding, the city layout, chapter and name
- `walking`: the walking graph and the ghost links
- `engine`, `arches`, `ornaments`: manifold-3d, arch outlines, balls, domes,
  pyramids, cones
- `city`: the solid: heightmap prisms, corner pillars, the tapered underside,
  stairs, arch tunnels (runs of cells along a line, cut through or as alcoves),
  windows, towers, pillars, ornaments
- `model`, `stl`, `worker`: the mesh with a role per triangle (welded, with
  cancelling sliver pairs dropped), mesh checks, overhang area, binary STL

The main `<script type="module">` holds the form, the history, the three.js
preview (palettes, styles, ambient occlusion and bloom), the camera moves and the
impossible view, the wanderer and the constructor.
