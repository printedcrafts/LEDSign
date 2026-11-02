# PrintedCrafts LED Neon Sign Studio

Independent browser-side recreation of the public LED Neon Sign Generator workflow: SVG or text input, channel-letter or line-channel construction, a parameterized 3D preview, and STL/GLB export.

## Interface theme
The interface uses a vermilion highlight (`#E34234`) on the dark control-panel and 3D-viewport layout.

## Workflow
1. Choose SVG and drop/select a vector file, or switch to Text, type text, choose a font, and build its vector outlines.
2. Choose Channel letters for filled artwork or LED channel along lines for vector strokes.
3. Adjust artwork width, walls/floor, optional diffuser ledge, support angle, diffuser thickness and smoothness.
4. Enable a rounded, square, or contour/outline backplane. Choose your 3D printer bed (the sign is split into pieces that fit it automatically, or set a manual tile size), pick dovetail/puzzle/flat joins and the joint clearance, and choose keyhole/eyelet/standoff mounting options. Pieces are never smaller than 100 mm.
5. Inspect the 3D model, adjust preview finish / feature edges, click a wall to remove or restore its ledge helper, then export STL or GLB.
6. Check the result in a slicer before printing. The diffuser/acrylic face itself is not exported.

## Geometry notes
Filled artwork gets floor extrusions and wall sweeps along closed contours. Line-art and font-centerline mode builds each letter's channel in 2D (outer band minus inner band, round joins, rounded closed ends) and extrudes it, so branches that meet share one open LED channel. This uses `vendor/clipper.js` (clipper-lib 6.4.2, Boost Software License, see `vendor/clipper-LICENSE.txt`), which must be deployed next to `index.html` together with the rest of the `vendor/` folder (see `vendor/README.md`). Floor/wall shells overlap slightly so slicers can union them. The face-plate ledge is separate helper geometry and may be toggled per wall in the preview.
Backplanes support rounded rectangles, square corners and a convex contour offset around the artwork. The margin is measured from the outer face of the channel walls and the plate is centered on the artwork; ellipse, shield and hexagon plates are scaled until the walls plus margin fit inside. Large panels are divided into interlocking printable tiles. Verify the tessellated contour joints, tile size versus bed size, and assembly tolerance in the slicer; these are experimental geometry, not structural certification.

Text outlines use OpenType.js in the browser. Built-in font files are fetched when first used from the google/fonts GitHub repository (`raw.githubusercontent.com`, pinned to one commit); user font files are parsed locally. Characters the chosen font has no glyph for are left out of the sign and listed in the build warnings. Artwork is not uploaded. Mounting tabs, eyelets and standoffs are experimental, not load-rated. Check manifoldness, physical fit, LED bend radius, wall thickness, anchors, insulation, strain relief and power supply rating before fabrication or installation.


## LED / neon profile selection
The selector includes WLED-compatible addressable families, analog single-colour/CCT/RGB/RGBW/RGBCCT tape, and common commercial neon-flex envelopes. Profile dimensions are starting estimates, not guarantees for every SKU: match editable width, height and clearance to the manufacturer's datasheet. Channel width is calculated as strip width plus twice side clearance. Verify wall height, bend direction and minimum bend radius before printing.


## User-controlled sign dimensions
The target width and height box is above the SVG/Text input and has no imposed upper maximum. Geometry preserves aspect ratio and fits inside the target box. Final print dimensions include the backplane and are shown in millimetres and inches. Letter-channel cross-sections use the selected LED profile width plus side clearance; choosing a taller profile raises the recommended wall height if needed.


## User-defined rear wire routing
Choosing a wire tool turns the view to the back of the sign and locks orbit. Clicks add route points (double-click or Enter finishes, Shift snaps to 45°, Esc cancels) or place pass-through holes; the model only rebuilds when a route is finished or a hole is placed, and the camera is never re-fitted by a rebuild. Paired raceway rails generate on the rear face; holes are subtracted through panel tiles and intersecting letter/channel floors using browser-side CSG. The CSG output and route clearance must be checked in a slicer, and routes should not cross tile joints or mounts.


## Font centerline tracing
Text mode defaults to a browser-side raster skeleton trace. It thins filled font outlines with Zhang–Suen thinning, traces skeleton branches into paths, then sweeps an LED-sized channel profile over those centerlines. Adjacent strokes only become one route when the rasterized glyph skeletons actually touch; separate block letters remain separate paths. Short thinning spurs are pruned, branches that run straight through a junction are joined, and each route is smoothed with junction points held in place. Script joins and complex counters need visual inspection because raster skeletonization is heuristic.


## Letter selection and alignment
For text input, each glyph receives a group ID and is centerline-traced independently so it can be selected in the 3D viewport. Click a glyph to select it and drag it in the sign plane (no mode switch); Shift/Ctrl-click multi-selects, dragging empty space orbits, and arrow keys nudge 1 mm (Shift: 10 mm). Left/right/top/middle/bottom move the selection as one block to line up with the other letters; Mid-line moves each selected letter up or down onto one shared horizontal line without changing its sideways position; 45° incline lines the selected letters' centers up on a rising 45° slope from the leftmost letter. In LED-channel mode, letters whose channels overlap are rebuilt as one joined channel with no walls or end caps inside the overlap; this is recalculated about ten times a second while dragging and exactly when the drag ends. The backplane is regenerated to the new combined bounds. Uploaded SVG files are grouped by path id or path number, so a combined single-path logo is not split into individual letters automatically.


## Geometry validation matrix
`npm test` runs the source-level smoke checks, a CSG regression test (`tests/csg-smoke.mjs`), a mesh-orientation test (`tests/orientation-smoke.mjs`) and a vendor-integrity check. They cover the two matching edge profiles, rounded/square panel outline generation, target-box centering, glyph grouping, channel smoothing and letter alignment. Browser-side CSG unions and recess/cut operations remain dependent on the external module and require real-browser/slicer acceptance; geometry settings should not be considered production-qualified until those tests pass.


## Integrated from alternate LEDSign Studio HTML
Selected compatible features from the alternate single-file implementation were integrated into the modular editor:
- Additional ellipse, shield/badge and hexagonal backplane silhouettes, clipped per tile so the existing dovetail/puzzle seam machinery is retained.
- A line-spacing control for multiline typed signs.
- A millimetre/inch entry-unit switch for target width and height. Switching units converts entered values to preserve physical size, final sizes continue to show both units, and changing the target box re-normalizes the source geometry and scales existing manual letter offsets.

The alternate implementation's Three.js TubeGeometry outline tracing and separate glow tube were not carried over because they do not create the project's required open LED-sized printable channel cross-sections and would regress the existing centerline/CSG architecture.

## Mounting points, holes and validation

The eyelet editor supports adding/removing mounting points, multi-selecting them in the rear view, dragging a selected group, and aligning or distributing only the selected points. The 6.4 mm mounting opening must retain at least 10 mm of solid backplane material beyond its edge. Invalid drag positions are rejected without changing the model.

Pass-through holes are validated against the solid backplane, text / LED channel clearance, rear wiring channels and other mounting or pass-through holes. Invalid holes stay visible in red and are not subtracted from the solid. Manufacturing-critical issues are listed in the validation panel and disable STL exports; the last valid 3D preview stays on screen while the design is corrected.

## Custom SVG backplanes and text layout

Choose **Custom SVG outline** in the backplane style selector and upload a separate SVG. Use filled, closed shapes; compound paths can include internal subpaths that become through-cutouts. The outline is fitted around the current artwork, but the artwork itself is not automatically moved. A custom shape can be tiled using the existing tile sizes and joint profiles.

The backplane is always rebuilt around the outer edges of the artwork, so the artwork stays centered on it. A custom outline is enlarged (up to 3x) until the artwork and its clearance fit inside it. Equalize spacing acts on three or more selected letters, makes edge-to-edge gaps equal and preserves the first and last selected letters. These actions are user-invoked; manual letter placement otherwise remains in place.

## Printing a large sign on a small printer

The backplane is split into tiles that interlock, and the LED channel is cut at the same seams, so every piece is one backplane tile together with its own part of the channel, walls and ledge.

- **Piece sizing.** Automatic mode (default) reads your printer bed (width, height, edge margin) and uses the fewest pieces that fit, counting the tabs that stick out of each tile. The *Piece size* slider trades piece count against piece size: right gives fewer, larger pieces (as big as the bed allows); left gives more, smaller pieces (down to 40% of the printable area, never below 100 mm). On a rectangular bed, pieces are turned 90° when that needs fewer pieces. Manual mode keeps the old *Tile max width/height* fields.
- **Joint clearance.** The female pocket of every dovetail or puzzle joint is the male tab outline plus the joint clearance (default 0.20 mm) on the sides and bottom, so printed parts press together instead of fusing. The tab itself keeps its exact size. Set 0 for no gap.
- **Seam placement.** By default the seams are placed between the letters ("Between the letters when possible"): for every possible seam position the app measures how much LED channel it would slice, then picks the positions that cut the least while keeping every piece within the bed limit (and at least 100 mm). Neighbouring letters whose channels touch leave no clean gap, so the plan reports how many millimetres of channel the seams still cut compared with an even grid. "Even grid" gives equal tiles. Both work in automatic and manual sizing, and the 0.20 mm clearance is the same on uneven tiles.
- **Print plan and piece list.** Under the controls, the plan shows the piece grid, the largest piece, its height, and the seam summary, and warns when a piece is too big for the bed or too tall for the printer height (Z). Below it, every piece has a row with its size and a fits/too-big marker. Click a row to highlight that piece in the preview; the STL button on a row downloads just that piece (the same file as in the ZIP). *Show seam lines* draws orange lines where the sign and its channel are cut.
- **Preview pieces apart.** The slider shows the real cut pieces (backplane tile, its channel and rear hardware) moved apart by 0 to 60 mm. It is view-only: letters cannot be picked while it is open, and any change to the design returns to the editable model.
- **Download printable pieces (ZIP).** One STL per piece, already placed on the bed with the rear of the backplane down and the channel pointing up, named after the IDs engraved on the rear (for example `T01-02`). The ZIP also holds `print-plan.txt` (sizes, fit, where to glue rear hardware) and `assembly-map.svg`.
- **Rear hardware** (keyhole tabs, eyelet rings, standoff posts) sits behind the plate and cannot print in place, so it is exported as separate parts in `*-rear-mounts.stl`; glue it at the positions in `print-plan.txt`. Wire channel guards are exported per piece as `*-wire-guards.stl`.
- **Download assembled STL (preview only)** still writes the whole sign as one file at its assembled position. It is for viewing and checking, not for printing.

Known limitation: with *Engrave tile IDs* on, the engraved text leaves tiny gaps in the mesh of each backplane tile (about 10 mm² per tile in tests). Slicers normally repair these on import. With *Engrave tile IDs* off, the tiles are fully watertight.

## Running and deploying

The app is plain static files: serve the folder over HTTP (ES modules do not load from `file://`), for example `python3 -m http.server` and open `http://localhost:8000`. All JavaScript, including three.js, the CSG library and the font parser, is served from `vendor/`; the only runtime request to another host is the font download from `raw.githubusercontent.com` (and the bundled sample logo is used if that is blocked).

Tests need Node 22 and no packages: `npm test`. `npm run test:network` also checks that the built-in font URLs still return 200.

## Build warnings

Problems that do not stop an export (tiles larger than the print bed, rear channels that cross tile seams, skipped open paths or characters, an enlarged custom outline, tile IDs that could not be engraved) are listed in the *Build warnings* box under the export buttons and stay there until the cause is fixed. Problems that make a part unprintable block the STL export and are listed in the red validation box.
