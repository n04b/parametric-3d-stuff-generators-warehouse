# 3D Texture Generator

A parametric generator of relief textures for 3D printing and CNC milling.
Dimensions are in millimetres, the result is exported to binary STL
(a closed, correctly oriented solid, ready for a slicer).

## Running

Everything is in a single `index.html` file: open it in a browser with a double click.
No build step or server needed, three.js is loaded from a CDN (internet connection required).

## What you can configure

**Surface**:

| Shape | Size |
| --- | --- |
| Rectangular panel | width × height |
| Round panel | diameter |
| Polygon panel | diameter across corners, 3–12 sides (a hexagon tiles a plane); one edge lies flat at the bottom |
| Cylinder | diameter × height; solid, relief on the side, flat caps |
| Tube / vase | bottom diameter, top diameter as % of it (taper), height, wall thickness; with a bottom thickness above 0 it becomes a cup or vase, at 0 an open tube |
| Cube | edge length, edge rounding; relief on all six faces, continuous across the edges |
| Sphere | diameter |
| Torus | outer diameter, section diameter |

For panels you set the base thickness and relief depth (on the cylinder the base
is the smooth inner wall under the relief), as well as an "edge fade": over the
given width from the edge the relief smoothly settles to a flat field, and the
corners of rectangular and polygon panels are rounded. On the cylinder and the tube
the fade works towards the top and bottom rims, on the cube towards its edges.
On the cylinder, cube, sphere and torus the relief is carved inwards, so the outer
size stays as specified.

The cube's relief is pushed in along the normals of a box with rounded edges, so
the edges are always rounded a little more than the relief depth reached there
(otherwise the walls would fold over each other). For sharp edges, set an edge
fade with the edge level at 1: the relief then settles flush with the faces at the
edges.
"Edge level" sets where that field ends up: 0 — at the level of the deepest points
of the relief, 1 — flush with the peaks. The mesh step
defines the STL detail; the preview is built coarser if needed. Walls and
terrace steps are never sharper than two mesh steps (otherwise they come out
jagged on the grid), so for crisp thin walls reduce the mesh step.

**Patterns**:

| Pattern | What you get |
| --- | --- |
| Topography | flat terraces with steps, like a relief map |
| Contours | thin walls along contour lines, a maze |
| Fibres | elongated curved stripes |
| Dunes | soft ridges, like sand or fabric |
| Cells | Voronoi diagram: walls or bumps |
| Rings | concentric waves around random centres |

Common parameters: seed, feature size (mm), octaves, distortion (domain warp),
stretch and angle. Line thickness, step width and stripe period are also in millimetres.
The texture is computed in 3D coordinates, so the cylinder, cube, sphere and torus have no seams or stretching.

All parameters are stored in the page URL, so you can share a link.

## Structure

All code is in `index.html`, in a single `<script type="module">` split into sections:

- `noise`: seeded simplex noise, fbm
- `patterns`: patterns as functions `(x, y, z) mm → [0, 1]` and the parameter schema
- `mesh`: building closed meshes for every shape
- `stl`: writing binary STL
- `presets`: presets
- `main`: UI and three.js preview
