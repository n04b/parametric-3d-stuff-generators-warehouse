# Khrushchyovka

A parametric generator of Soviet five-storey blocks of flats from the 1960s
(khrushchyovkas) as models for 3D printing: large-panel, large-block and brick
houses with entrances, stairwells, balconies or loggias, a flat, gable or hip
roof. The result is exported to binary STL: every part is a closed solid with a
flat bottom, ready for a slicer.

## Running

Everything is in a single `index.html` file: open it in a browser. No build step
needed, three.js and the solid modelling library [manifold-3d](https://github.com/elalish/manifold)
are loaded from a CDN (internet connection required).

The model is built in Web Workers, several parts in parallel. A page opened
straight from disk may not be allowed to start workers; it then builds on the
page itself, and the controls stall while a house is built. To keep the page
smooth, serve the folder, for example with `python3 -m http.server`.

## Units

The house is set in metres of the real building (floor height, bay width,
window size and so on) and scaled down by "Scale 1:". Print details are set in
millimetres of the model, so they stay printable at any scale: window recess
depth, joint width and depth, brick course pitch, frame bars, wall thickness,
pin holes. "Thinnest detail" is the smallest thickness of anything that sticks
out (slabs, parapets, railing bars, frames, posts); thinner real parts are
thickened to it. Typical scales: 1:87 (H0), 1:120 (TT), 1:160 (N), 1:200 and
smaller for architectural models.

## How it works

**Plan.** The house is a row of entrances (sections). Each entrance has its
window bays, half of them on either side of the stairwell. On the entrance
facade the stairwell has the door with a porch and a canopy at the ground, and
its windows sit half a floor up, at the landings (or one glass-block strip).
The bays next to it have narrower kitchen windows. The back facade has a window
in every bay, the stairwell included. End walls are blank or get columns of
windows.

**Walls.** Large panels: joints at every floor and between the bays, the
stairwell panels shifted half a floor. Large blocks: also joints along the
sills and lintels and beside the windows. Brick: horizontal courses. The plinth
can stand out or be set back, with basement vents.

**Windows.** Every opening is a recess with a frame left standing in it: two
leaves with a small vent pane on one of them, balcony doors with a solid lower
panel, double entrance doors with a transom. Window sills stick out under the
windows.

**Balconies** are a slab with a solid panel, a fluted sheet or a railing, on
the back facade, the entrance facade or both, from a chosen floor up; or
loggias cut into the wall. **Lived-in details** add, at random: balconies
glazed by the residents (frames or plain panels), replaced windows without the
vent pane, outdoor units of air conditioners.

**Roof.** Flat with a parapet and a cornice, or a gable or hip roof with an
overhang, dormers and vent stacks; on a flat roof optionally an exit hut over
each stairwell.

## Printing

- **Self-supporting overhangs (45°)**: balcony slabs and the canopy get
  triangular brackets, the cornice and the eaves a 45° chamfer underneath, so
  the model prints upright without supports.
- **Hollow, open bottom**: walls of the given thickness; with "Windows cut
  through" the openings go through to the inside, for lighting with LEDs. With
  self-supporting overhangs the ceiling of the hollow is peaked, so it prints
  without a long bridge (flat when the windows are cut through, so that the top
  floor stays lit).
- **Max part length**: the house is cut between entrances into parts no longer
  than that (the default 250 mm fits common printer beds). Every part is a
  separate STL in a ZIP. Pin holes at the joints take short pieces of 1.75 mm
  filament as dowels; a hollow part gets an end wall at every joint, thick
  enough for the pin holes.
- **Ground plate**: a slab under the whole house for a diorama.

Presets: large-panel 1-464, brick 1-447 with a hip roof, large-block with a
cornice, lived-in today, loggias with glass-block stairwells, a three-storey
brick house with a gable roof, an H0 hollow shell for lighting. All parameters
are saved in the page URL.

## Code

The geometry is a module in `<script type="text/plain" id="geometry">`; the page
imports it for the parameters and starts the workers from it. Sections:

- `util`, `params`: hash, parameter schema and presets
- `engine`: loading manifold-3d, an arena that frees every WASM object of a
  build, primitives in facade coordinates (u along the wall, v up, w out)
- `layout`: plain numbers, bays, openings, balconies, entrances, part joints
- `house`: the solid of one part. The main volume, minus everything recessed
  (the facade relief as layers of 2D regions, loggias, hollow, pin holes), plus
  everything attached. Booleans cost time in proportion to the triangles they
  touch, so small groups are prepared first and a part goes through only two
  booleans over its whole mesh. Solids never share a face: touching pieces
  overlap by a hair, so the STL has no zero-area triangles.
- `mesh`: the mesh of a part with a role per triangle for the preview colours
- `stl`, `worker`: binary STL, ZIP, the worker message loop

The main `<script type="module">` holds the form, the worker pool and the
three.js preview.
