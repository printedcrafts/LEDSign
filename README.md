# LEDSign — shapes and smooth vector backing (pre-release)

## Install
Upload `index.html` to the repository root. No extra JS bundles are required.

## Changes
- Added editable line, rectangle, circle, ellipse and arc centerlines. Use Add shape, Undo last shape or Clear shapes.
- Text and added shapes use the same LED channel selection, preview, and STL / SVG export pipeline.
- Preview and SVG centerlines now use smoothed cubic curves rather than a polygonal polyline.
- Backing SVG output traces a single contour around raster cells instead of exporting thousands of overlapping rectangle paths, and rounds the contour's sharp pixel corners.
- Slider values update as they move; geometry generation remains a separate operation with an elapsed-time indicator.

## Fabrication limitations
STL files still use a raster voxel meshing method and may have faceted/stepped perimeter edges. The smoother SVG backing is not a guarantee of equally smooth 3D-printed STL walls. For laser cutting or precise smooth curves, inspect SVG geometry in CAD first. Do not use the generated STL for sale or production without repairing/checking manifoldness, continuity, fit, bend radii, and mounting requirements. Shape loops may need bridges to connect to a single backing. Uploaded font paths are approximate stroke traces, not exact outline conversion.

## Verification
JavaScript syntax is checked using Node.js. A full browser test could not be completed in this environment (headless Chromium timed out). Check default preview, slider updates, shape creation/editing, and generation/download after upload.
