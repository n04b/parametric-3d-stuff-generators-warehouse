# 3D Texture Generator

A parametric generator of relief textures for 3D printing and CNC milling.
Dimensions are in millimetres, the result is exported to binary STL
(a closed, correctly oriented solid, ready for a slicer).

## Running

Everything is in a single `index.html` file: open it in a browser with a double click.
No build step or server needed, three.js is loaded from a CDN (internet connection required).

## What you can configure

**Surface**: rectangular panel (width × height), round panel (diameter)
or sphere (diameter). For panels you set the base thickness and relief depth,
as well as an "edge fade": over the given width from the edge the relief
smoothly settles to a flat field, and the corners of a rectangular panel are rounded.
"Edge level" sets where that field ends up: 0 — at the level of the deepest points
of the relief, 1 — flush with the peaks. The mesh step
defines the STL detail; the preview is built coarser if needed.

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
The texture is computed in 3D coordinates, so the sphere has no seams or stretching.

All parameters are stored in the page URL, so you can share a link.

## Structure

All code is in `index.html`, in a single `<script type="module">` split into sections:

- `noise`: seeded simplex noise, fbm
- `patterns`: patterns as functions `(x, y, z) mm → [0, 1]` and the parameter schema
- `mesh`: building closed meshes for panels and the sphere
- `stl`: writing binary STL
- `presets`: presets
- `main`: UI and three.js preview
