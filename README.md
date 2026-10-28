# PrintedCrafts LEDSign Studio

A browser-based LED neon sign builder focused on **single centerline paths** and printable U-channel parts.

## Basic workflow
1. Enter a phrase such as `NEON SIGN`. The built-in PrintedCrafts alphabet is authored as single-line LED strokes for an immediate preview.
2. To use another font, upload a TTF or OTF file. The browser renders the lettering to a raster mask, thins the glyph strokes with Zhang–Suen skeletonization, and traces the skeleton into centerline polylines.
3. Review the preview, change the target width and channel profile, and correct tricky joins in manual centerline mode if needed.
4. Choose a printer-bed preset, generate the STL parts, and download the ZIP.
5. Inspect each STL in a slicer before printing. Check channel opening against the real LED flex, minimum bend radius, wall thickness, manifoldness, support fit, and wiring clearance.

## Important limitations
Raster medial-axis extraction is a heuristic, not a perfect typographic skeleton. Branching glyphs (for example E, F, K, and G), thin/light fonts, serif details, scripts, tiny punctuation, and tight character spacing can produce ambiguous joins or unwanted stubs. Manual corrections may be needed. Not every decorative font is suitable for continuous LED routing, and the software cannot guarantee that every phrase is electrically continuous or mechanically valid.

Generated channel parts are experimental: inspect them in your slicer, check dimensions and mesh integrity, verify the strip manufacturer's minimum bend radius, and test with the actual hardware. Rear raceways are separate pieces and are not boolean-cut into supports. Use properly insulated wiring, strain relief, and a suitably rated power supply. This project is a design aid, not electrical certification.

Font files are processed locally in the browser; the app does not upload them to a server. The page requires a modern browser with Canvas and SVG support. GitHub Pages is supported when `index.html`, `app.js`, and `style.css` are published from the same directory.
