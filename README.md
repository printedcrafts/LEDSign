# LEDSign — custom font contour stability patch

Upload index.html and app.js from this package to the ROOT of GitHub `main` together; keep style.css if already current. This package also includes matching style.css.

## What this addresses
The previous skeleton tracer falsely accepted disconnected small branches as complete Brittany Signature lettering. The new mode uses the real glyph perimeter, with closed-loop smoothing, so lettering remains recognizable. Custom-font upload, rear wiring routes, alignment, and export controls remain present. Cache busting in index.html requests a new app.js revision.

**Critical fabrication limitation:** outline routes are not single-stroke LED centerlines. Printed channels may follow BOTH edges of thick strokes. Do not assume generated channels are suitable for neon flex without route review and physical validation. A true editable centerline tracing workflow is still required.

Testing: JS syntax, package extraction, and basic static regression checks only; Brittany Signature font file was not provided, so that exact font has not been validated end-to-end.
