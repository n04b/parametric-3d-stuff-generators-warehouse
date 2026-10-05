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
| Cube / box | length along X, Y and Z, edge rounding; relief on all six faces, continuous across the edges |
| Sphere | diameter |
| Torus | outer diameter, section diameter |

For panels you set the base thickness and relief depth (on the cylinder the base
is the smooth inner wall under the relief), as well as an "edge fade": over the
given width from the edge the relief smoothly settles to a flat field, and the
corners of rectangular and polygon panels are rounded. On the cylinder and the tube
the fade works towards the top and bottom rims, on the cube towards its edges.
On the cylinder, cube, sphere and torus the relief is carved inwards, so the outer
size stays as specified.

The box's relief is pushed in along the normals of a box with rounded edges, so
the edges are always rounded a little more than the relief depth reached there
(otherwise the walls would fold over each other). For sharp edges, set an edge
fade with the edge level at 1: the relief then settles flush with the faces at the
edges.

The box can also take a separate fade for each face (left/right, front/back,
bottom/top): relief on or off, fade width and edge level. A face without relief
is flat at its edge level, e.g. a flush bottom for printing. Where two faces with
different settings meet, the edge takes the higher of their levels and both faces
ease into it over the edge rounding plus two mesh steps.
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
| Mountains | ridged multifractal: sharp crests with fine detail, smoother valleys |
| Spikes | cones on a jittered grid, standing along the surface normal |
| Gyroid / TPMS | triply periodic minimal surfaces (gyroid, Schwarz P, diamond, Neovius): walls, channels or smooth waves |
| Labyrinth | meandering stripes of an even width, like Turing patterns or brain coral |
| Scales | overlapping fish / dragon / pine-cone scales without regular rows |

Common parameters: seed, feature size (mm), octaves, distortion (domain warp),
stretch and angle. For mountains, "Roughness" sets how much each finer octave
adds, "Valley flatness" widens and smooths the valleys, "Profile sharpness" sharpens
the crests, and "Crest rounding" (mm) keeps them from getting sharper than the mesh
can show; octaves finer than that fade out. Mountains use a continuous variant of
the noise with a random rotation per octave, so no straight lattice creases show up.

For spikes, the feature size is the spacing between them; "Base diameter" is a
percentage of it (above 100 % neighbours merge), "Randomness" shifts them off a
regular grid, "Height variation" mixes in lower spikes, "Spike shape" bends the
cone (1 is straight, above 1 thorn-like, below 1 domed) and "Tip rounding" (mm)
blunts the tips no sharper than the mesh can show. The spike distance is measured
in the surface's tangent plane, so the tips stay sharp and point along the normal
on every shape. On curved shapes a spike whose centre lies off the surface fades
in or out instead of popping up, so some spikes there are lower.

For gyroid / TPMS, the feature size is the cell (one period along every axis).
The relief follows the surface's level set: "Walls" puts walls of the given
thickness (mm) on it, "Channels" raises one side of it, "Smooth waves" maps the
level function straight to height. "Level" moves the surface towards one side
(thinner walls on one side, wider channels on the other), "Lattice tilt" and
"Slice offset" choose how the lattice is cut, which changes the drawing on a flat
panel a lot. Wall thickness is measured along the shape's surface, so it is the
same on panels and on curved shapes; where the level set runs almost parallel to
the surface the walls widen a little.

For the labyrinth, the feature size is the stripe period (one ridge plus one
groove). It is an imitation of reaction–diffusion patterns: the zero set of many
random plane waves of one wavelength. "Stripes" gives flat ridges and grooves,
"Rounded ridges" a smooth coral-like profile (its sharpness set by "Profile
sharpness"), "Thin walls" a maze of walls of the given thickness. "Balance"
widens the ridges or the grooves. Each wave counts by how flat it lies in the
surface, so the stripes keep an even spacing on panels and stay continuous on
curved shapes.

For scales, the feature size is the spacing between them. Each scale rises
towards its free edge and drops there in a step. They are stacked like real
scales: the one centred further upstream lies on top, starts on whatever lies
beneath its root and lifts to its own height at the free edge, so a rim always
steps down onto the scale below. "Direction" sets where the free edges point:
"Along the panel" uses the angle in the xy plane (panels and discs), "Down (−Z)"
follows the shape downwards (vases, cylinders, spheres, box sides); where that
direction vanishes, at the poles or on the top of a box, the scales round off
into domes.

- Layout: "Overlap" (scale size relative to the spacing), "Randomness" (at 0
  they form rows), "Size variation".
- Shape: "Scale width / length", "Pointed tip" (narrows the free edge to a point,
  like dragon scales), "Squareness" (from round to roof-tile rectangles), "Scale
  curve" (how the rise bends) and "Edge rounding" (mm, at least three mesh steps).
- Texture: ribs fanning out from the root (pine cone, scallop), a keel along the
  middle, growth rings parallel to the edge (fish scales) or grain, with its depth
  and the number of ribs / rings.

Under the scales lies a layer at a quarter of the height, so a rare gap in a
random layout shows as a shallow dip; more overlap closes it.

Deep relief on a tight curve gets squeezed: the relief is carved inwards, so its
bottom lies on a surface with a smaller radius. On the box's rounded edges tall
spikes turn into fins; use a larger edge rounding, or an edge fade so the spikes
settle before the edges. Line thickness, step width and stripe period are also in millimetres.
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
