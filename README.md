# LEDSign vector neon sign studio

Static browser-based sign designer for GitHub Pages. No external libraries or build tools.

## Deploy
Upload **index.html, style.css, and the entire src directory** to the repository root. GitHub Settings > Pages > Deploy from branch > main / (root). Refresh with Ctrl+Shift+R.

## Preview and editing
The preview now renders directly from monoline SVG vector paths, independently of STL mesh generation. Drag the mint points to edit paths; click **Generate sign & fabrication geometry** after edits to rebuild the printable solids. **Reset paths** restores the text-derived path. **Hide nodes** provides an unobstructed neon view. Text changes regenerate the paths and discard your edits.

## Fabrication exports
- Channel STL: voxel-based top-opening U-channel using LED profile slot width, wall thickness, and floor/height configuration.
- Backing STL: independent contour-offset backing plate.
- SVG: millimeter-scaled path-based layout with exact editable centerline vertices, stroke-defined channel edges, and optional backing silhouette.

## Important limitations
This version uses a custom *single-line vector alphabet*, not automatic tracing of arbitrary uploaded font files. The font selector currently doesn't switch the monoline alphabet; font upload is deliberately not used. This is an explicitly editable path-based foundation rather than the previous unreliable font-raster skeletonizer. In particular, it will **not** precisely reproduce the script typeface in the reference photo unless you manually edit/replace those paths. SVG paths are line segments between adjustable control nodes, not smooth Bezier curves; segment sampling makes corners less pronounced. It does not validate manufacturer-specific side-bend neon holders, minimum bend radius, mounts, cable exits, retaining lips, diffuser covers or snap fits. Side-bend outputs are marked approximate. Check STL topology and fit in slicer/CAD before manufacturing. The plate and channel meshes may contain separate disconnected islands and need deliberate bridges or segmented assembly.

## Test
`node --test tests/geometry.test.mjs` (Node 18+). Browser console and Preview status provide runtime diagnostics.
