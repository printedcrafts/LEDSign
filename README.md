# PrintedCrafts LED Neon Sign Studio

Independent browser-side recreation of the public LED Neon Sign Generator workflow: SVG or text input, channel-letter or line-channel construction, a parameterized 3D preview, and STL/GLB export.

## Interface theme
The interface uses a vermilion highlight (`#E34234`) on the dark control-panel and 3D-viewport layout.

## Workflow
1. Choose SVG and drop/select a vector file, or switch to Text, type text, choose a font, and build its vector outlines.
2. Choose Channel letters for filled artwork or LED channel along lines for vector strokes.
3. Adjust artwork width, walls/floor, optional diffuser ledge, support angle, diffuser thickness and smoothness.
4. Enable a rounded, square, or contour/outline backplane. Set tile max dimensions (minimum 100 mm), dovetail/puzzle/flat joins, and keyhole/eyelet/standoff mounting options.
5. Inspect the 3D model, adjust preview finish / feature edges, click a wall to remove or restore its ledge helper, then export STL or GLB.
6. Check the result in a slicer before printing. The diffuser/acrylic face itself is not exported.

## Geometry notes
Filled artwork gets floor extrusions and wall sweeps along closed contours. Line-art and font-centerline mode builds each letter's channel in 2D (outer band minus inner band, round joins, rounded closed ends) and extrudes it, so branches that meet share one open LED channel. This uses `vendor/clipper.js` (clipper-lib 6.4.2, Boost Software License, see `vendor/clipper-LICENSE.txt`), which must be deployed next to `index.html`. Floor/wall shells overlap slightly so slicers can union them. The face-plate ledge is separate helper geometry and may be toggled per wall in the preview.
Backplanes support rounded rectangles, square corners and a convex contour offset around the artwork. The margin is measured from the outer face of the channel walls and the plate is centered on the artwork; ellipse, shield and hexagon plates are scaled until the walls plus margin fit inside. Large panels are divided into interlocking printable tiles. Verify the tessellated contour joints, tile size versus bed size, and assembly tolerance in the slicer; these are experimental geometry, not structural certification.

Text outlines use OpenType.js in the browser. Built-in font files are fetched from Google Fonts on request; user font files are parsed locally. Artwork is not uploaded. Mounting tabs, eyelets and standoffs are experimental, not load-rated. Check manifoldness, physical fit, LED bend radius, wall thickness, anchors, insulation, strain relief and power supply rating before fabrication or installation.


## LED / neon profile selection
The selector includes WLED-compatible addressable families, analog single-colour/CCT/RGB/RGBW/RGBCCT tape, and common commercial neon-flex envelopes. Profile dimensions are starting estimates, not guarantees for every SKU: match editable width, height and clearance to the manufacturer's datasheet. Channel width is calculated as strip width plus twice side clearance. Verify wall height, bend direction and minimum bend radius before printing.


## User-controlled sign dimensions
The target width and height box is above the SVG/Text input and has no imposed upper maximum. Geometry preserves aspect ratio and fits inside the target box. Final print dimensions include the backplane and are shown in millimetres and inches. Letter-channel cross-sections use the selected LED profile width plus side clearance; choosing a taller profile raises the recommended wall height if needed.


## User-defined rear wire routing
Choosing a wire tool turns the view to the back of the sign and locks orbit. Clicks add route points (double-click or Enter finishes, Shift snaps to 45°, Esc cancels) or place pass-through holes; the model only rebuilds when a route is finished or a hole is placed, and the camera is never re-fitted by a rebuild. Paired raceway rails generate on the rear face; holes are subtracted through panel tiles and intersecting letter/channel floors using browser-side CSG. The CSG output and route clearance must be checked in a slicer, and routes should not cross tile joints or mounts.


## Font centerline tracing
Text mode defaults to a browser-side raster skeleton trace. It thins filled font outlines with Zhang–Suen thinning, traces skeleton branches into paths, then sweeps an LED-sized channel profile over those centerlines. Adjacent strokes only become one route when the rasterized glyph skeletons actually touch; separate block letters remain separate paths. Short thinning spurs are pruned, branches that run straight through a junction are joined, and each route is smoothed with junction points held in place. Script joins and complex counters need visual inspection because raster skeletonization is heuristic.


## Letter selection and alignment
For text input, each glyph receives a group ID and is centerline-traced independently so it can be selected in the 3D viewport. Click a glyph to select it and drag it in the sign plane (no mode switch); Shift/Ctrl-click multi-selects, dragging empty space orbits, and arrow keys nudge 1 mm (Shift: 10 mm). Left/center/right/top/middle/bottom move the selection as one block to match the other letters (or the whole artwork when every letter is selected); 45° incline lines the selected letters' centers up on a rising 45° slope from the leftmost letter. In LED-channel mode, letters whose channels overlap are rebuilt as one joined channel with no walls or end caps inside the overlap; this is recalculated about ten times a second while dragging and exactly when the drag ends. The backplane is regenerated to the new combined bounds. Uploaded SVG files are grouped by path id or path number, so a combined single-path logo is not split into individual letters automatically.


## Geometry validation matrix
The source-level smoke checks cover the two matching edge profiles, rounded/square panel outline generation, target-box centering, glyph grouping, channel smoothing and letter alignment. Browser-side CSG unions and recess/cut operations remain dependent on the external module and require real-browser/slicer acceptance; geometry settings should not be considered production-qualified until those tests pass.


## Integrated from alternate LEDSign Studio HTML
Selected compatible features from the alternate single-file implementation were integrated into the modular editor:
- Additional ellipse, shield/badge and hexagonal backplane silhouettes, clipped per tile so the existing dovetail/puzzle seam machinery is retained.
- A line-spacing control for multiline typed signs.
- A millimetre/inch entry-unit switch for target width and height. Switching units converts entered values to preserve physical size, final sizes continue to show both units, and changing the target box re-normalizes the source geometry and scales existing manual letter offsets.

The alternate implementation's Three.js TubeGeometry outline tracing and separate glow tube were not carried over because they do not create the project's required open LED-sized printable channel cross-sections and would regress the existing centerline/CSG architecture.
