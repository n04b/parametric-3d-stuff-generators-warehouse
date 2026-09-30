# Tiles — modular wall installation generator

A parametric generator of wall relief made of **separate pieces**: pyramids with
an offset apex, spikes, tilted blocks, bevelled cubes, cylinders, drops. The grid
can be rectangular, radial or hexagonal (honeycomb). All dimensions are in **millimetres**, export
to **STL**.

![preview](docs/preview.jpg)

## Running

Open **`index.html`** in a browser (a double click works). Three.js is in `vendor/`,
no internet needed. Parameters are kept in the browser between sessions.

## How it works

1. **Layout** divides the surface into cells.
   - *Rectangular*: width × height (mm), number of columns and rows.
   - *Radial*: inner radius, number and width of rings. Segments in a ring are set
     either by "equal cell size" (the count grows towards the edge) or by an equal count.
     There is an offset for even rings (brick bond), splitting the arc into facets and a centre piece.
   - *Hexagonal (honeycomb)*: a rectangular panel (width × height in mm and number of columns, the number of
     rows is derived from the height) or a hexagonal panel (number of rings around the central cell
     and the cell size across flats). Cells are placed corner up or flat side up. The "Checkerboard" mode for hexagons
     colours every third cell — the classic three-colour pattern.
2. **Gap** shrinks each cell by half the gap on all sides, so neighbouring
   pieces never touch. If cells of neighbouring rings are split into a different number of facets,
   the outer edge of the inner ring is pulled in slightly so the chords don't overlap.
3. **A piece** is a loft from the base to the top:
   - base: the whole cell (square / sector), a circle / polygon, or a drop;
   - `Top` 0 → a pyramid with a single apex, 1 → a prism; values in between give a truncated shape;
   - `Profile` makes the sides convex (dome) or concave (needle);
   - `Plinth` adds a vertical rim at the base (handy for printing and gluing).
4. **Fields** define how parameters vary across the surface:
   - *height* — from the min. to the max. value;
   - *tilt strength* — multiplies the apex offset, top face tilt and twist;
   - *tilt direction* — a single direction, from a point / towards a point / vortex, wave, noise,
     alternating rows, random.

   Scalar fields: constant, linear gradient, from a point, wave, circular waves, noise,
   random, checkerboard, edge to centre. Each can have randomness, a curve (gamma)
   and inversion added. Point coordinates are normalised: ±1 is the panel edge along the longer side.

## Export

| Button | What you get |
| --- | --- |
| **STL — whole installation** | One binary STL. Pieces are in place, each a separate closed solid. |
| **ZIP — every piece** | A separate STL for each piece (`R03C07.stl`, `K02S11.stl`…), an assembly map, parameters. With two colours the pieces go into `color1/` and `color2/` folders. |
| **ZIP — per bed** | Pieces are arranged on printer beds of a given size (`plate_01.stl`…), separately for each colour. `plates.txt` lists which pieces are on which bed. |
| **SVG — 1:1 assembly map** | Base outlines with numbers, in millimetres. A red arrow shows where the apex is offset. It can be printed as a gluing template. |
| **Save / load parameters** | JSON with all settings. |

Each piece stands with its base on `z = 0`, so it prints without rotation. The backing board
can be included in the export as a separate piece (`BOARD.stl`).

Numbering: `R` — row from top to bottom, `C` — column from left to right; for the radial grid
`K` — ring from the centre, `S` — segment counter-clockwise from the grid rotation angle,
`C00` — the centre piece. For "corner up" hexagons `R` is the row, `C` the position in the row from left
to right; for "flat side up" hexagons `C` is the column from left to right, `R` the position in it from top to bottom.

## Printing notes

- Strongly tilted spikes (apex offset more than half a cell) overhang their neighbours
  and produce overhangs when printed base down. They need supports or printing on their side.
- The generator guarantees that **bases** do not intersect. The apexes of strongly tilted
  pieces may reach into a neighbour's volume in the air if the direction field changes abruptly.
  Check this in the preview.

## Files

```
index.html          UI, 3D preview, export
core.js             geometry: layouts, fields, pieces, STL / ZIP / SVG (no dependencies)
test/core.test.js   check: all presets and edge cases produce closed solids without intersections
vendor/             Three.js r128 + OrbitControls (MIT)
```

Tests: `node tiles/test/core.test.js`
