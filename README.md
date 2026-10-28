# PrintedCrafts LEDSign Studio

A browser-based LED neon sign designer with per-character centerline tracing, adjustable kerning, interlocking backplane tiles, mounting accessories, and an assembled 3D preview.

## Workflow
1. Enter text and upload a TTF/OTF font or use the built-in single-line alphabet.
2. Adjust global letter/pair spacing. Click one character button to select a letter; Shift-click another to select a range, then move that selection horizontally or vertically.
3. Configure the LED channel and choose tile dimensions of at least 100 × 100 mm. Tile size plus connector overhang must fit the selected printer bed.
4. Choose dovetail interlocks (default) or puzzle-step connectors and optionally emboss tile IDs.
5. Use Preview assembled 3D to orbit and inspect the complete layout before export.
6. Generate STL files. Each tile assembly STL includes its backplane, channel geometry, and optional embossed ID. Channel ends at tile seams are left uncapped so LED flex can continue through joined tiles. Mounting accessories are separate STL parts. ZIP includes a build guide, SVG assembly map, and channel cross-section.

## Geometry
Uploaded glyphs are rasterized and skeletonized per character so letter groups can be adjusted independently. Distance simplification, three corner-cutting passes and even-distance resampling reduce raster wobble. Script fonts and branching joins still need visual review.

Backplane tiles have complementary dovetail or puzzle-step edges. Channel shells overlap the plate top by 0.05 mm so the slicer can fuse them; confirm each tile is a single connected printable body. No separate dowels, diffuser cap or boolean-cut wire feed-throughs are included.

## Fabrication safety
Mount accessories are separate and not load-rated. Confirm fasteners and attach mounts to strong backplane regions. Verify actual LED clearance, bend radius, wall/floor thickness, tile connector fit, printer-bed clearance, mesh integrity and mounts in a slicer. Use appropriate wall anchors, wiring insulation, strain relief, heat management, and a rated power supply. This is experimental software, not structural or electrical certification.

Font files are processed locally. Publish `index.html`, `app.js`, `preview3d.js`, and `style.css` together for GitHub Pages.
