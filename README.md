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
Filled artwork gets floor extrusions and wall sweeps along closed contours. Line-art mode sweeps a U-channel along vector subpaths. Floor/wall shells overlap slightly so slicers can union them. The face-plate ledge is separate helper geometry and may be toggled per wall in the preview.
Backplanes support rounded rectangles, square corners and a convex contour approximation around the artwork. Large panels are divided into interlocking printable tiles. Verify the tessellated contour joints, tile size versus bed size, and assembly tolerance in the slicer; these are experimental geometry, not structural certification.

Text outlines use OpenType.js in the browser. Built-in font files are fetched from Google Fonts on request; user font files are parsed locally. Artwork is not uploaded. Mounting tabs, eyelets and standoffs are experimental, not load-rated. Check manifoldness, physical fit, LED bend radius, wall thickness, anchors, insulation, strain relief and power supply rating before fabrication or installation.


## LED / neon profile selection
The selector includes WLED-compatible addressable families, analog single-colour/CCT/RGB/RGBW/RGBCCT tape, and common commercial neon-flex envelopes. Profile dimensions are starting estimates, not guarantees for every SKU: match editable width, height and clearance to the manufacturer's datasheet. Channel width is calculated as strip width plus twice side clearance. Verify wall height, bend direction and minimum bend radius before printing.


## User-controlled sign dimensions
The target width and height box is above the SVG/Text input and has no imposed upper maximum. Geometry preserves aspect ratio and fits inside the target box. Final print dimensions include the backplane and are shown in millimetres and inches. Letter-channel cross-sections use the selected LED profile width plus side clearance; choosing a taller profile raises the recommended wall height if needed.


## User-defined rear wire routing
Users can click the 3D sign to draw rear wire routes and place pass-through holes. Paired raceway rails generate on the rear face; holes are subtracted through panel tiles and intersecting letter/channel floors using browser-side CSG. The CSG output and route clearance must be checked in a slicer, and routes should not cross tile joints or mounts.


## Font centerline tracing
Text mode defaults to a browser-side raster skeleton trace. It thins filled font outlines with Zhang–Suen thinning, traces skeleton branches into paths, then sweeps an LED-sized channel profile over those centerlines. Adjacent strokes only become one route when the rasterized glyph skeletons actually touch; separate block letters remain separate paths. Script joins and complex counters need visual inspection because raster skeletonization is heuristic.
