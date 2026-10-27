# LEDSign: printable neon channels (reliability revision)

Upload `index.html`, `style.css`, and `app.js` to the root of a GitHub Pages repository. The page is static and does not require a build step.

## Fixed in this revision
- Spaces in lettering create spacing only; they never generate the previous unwanted `o` glyph.
- Selected shapes can be aligned Left, Center, Right, Top, Middle, or Bottom relative to the lettering bounds.
- Preview dragging uses the SVG screen transform, including CSS scaling and zoom, rather than multiplying pointer movement using the screen rectangle.
- The slicer export uses a repaired standards-conforming ZIP writer. ZIP integrity was checked using an independent archive extractor.
- Printer X/Y dimensions are used to clip channel and support **paths** into bed-sized STL sections. The dimensions leave a safety margin for sweep thickness. Sections are named by tile location.

## Important manufacturing limitations
- Segmented channels/supports have simple cut ends, **not a locking dovetail or snap joint**. The previous false locking claim has been removed. A physically tested connector is needed for self-retaining assembly.
- Individual paths are exported as independent meshes; crossings/intersections are not boolean-unioned. Verify in a slicer.
- Uploaded fonts are approximate raster-to-centerline traces, not guaranteed manufacturable sign paths. Check every output before printing.
- Only X/Y bed fit is considered, and the generated profiles are illustrative until verified against a specific LED product's datasheet.
- There is no automatic assembly plate or unified contour backplane. The support output is individual strips.

## Tests
`node --check app.js`, `node test.cjs`, and `node verify.cjs` are included. `verify.cjs` writes a small test ZIP to its original development path and requires adjustment if run elsewhere. A browser-based end-to-end check has not yet been completed.
