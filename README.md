# LEDSign - Font Preview and Dimensions Patch

Upload only `index.html`, `style.css`, and `app.js` to the root of your GitHub Pages repository. These three files must stay together.

Changes:
- Uploaded TTF/OTF fonts display immediately as SVG text before attempting approximate centerline tracing.
- Font tracing is bounded to a smaller raster to avoid locking the browser on large glyphs. If tracing fails, the preview remains visible and STL export is blocked with a diagnostic (rather than exporting a different design).
- Total sign dimensions display both metric (mm) and imperial (inches).
- Generated ZIP contains only files necessary to deploy. No `test.cjs` is included.

Limitations: Font-to-neon centerline tracing is an approximation, not a verified vector font-to-CAD pipeline. Check every STL for manufacturing suitability. SVG preview success does NOT guarantee printable channel generation.
