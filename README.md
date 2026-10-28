LEDSign custom-font centerline editor

Deployment: replace index.html, app.js, style.css in the root of main.

Uploaded fonts are rendered only as a dim reference. Click Draw LED path, then click successive points along the middle of the neon tube. Finish section for each separate LED segment. STL export uses those actual user-defined centerlines. Use rear wiring route tools for electrical links.

Limits: manual placement required; curved routes are polyline approximations; no automated font-to-neon path inference, bend radius enforcement, mechanical locks, or manufacturer-validated retention features. Verify STLs in slicer and LED hardware fit before manufacturing.

## SVG Channel Letter Studio add-on

The main page includes an **Open SVG Channel Letter Studio** launch button. It is an additive experimental mode; the existing generator remains in place. Import a filled SVG (convert text/strokes to outlines first), or upload a TTF/OTF/WOFF font and build vector text outlines. Set channel wall height, wall thickness, floor thickness, and an optional flat diffuser ledge. Preview the geometry in 3D and export STL or GLB.

The add-on loads Three.js geometry libraries and OpenType.js from public CDNs, so a network connection is needed. The uploaded SVG/font is processed in the browser; this code does not upload the artwork. This feature has only received static JavaScript syntax validation in this change, not browser/WebGL end-to-end testing. Cavity offsets and boolean operations can fail on narrow counters, tiny details, or acute corners. Always inspect manifoldness, dimensions, LED clearance, and diffuser fit in a slicer before manufacturing. It does not yet implement angled ledge gussets, per-wall ledge toggles, or robust automatic mesh repair.
