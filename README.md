# LEDSign — 3D Printed Sign Designer

A browser-based 3D text sign designer with an interactive Three.js preview and STL/OBJ downloads.

## Running locally

Serve the project folder with a local HTTP server (ES modules will not reliably load via `file://`):

```bash
python -m http.server 8000
```

Open http://localhost:8000 . Internet access is required to load Three.js from jsDelivr. The project can also be hosted as static files on GitHub Pages.

## Features

- Sign text and four font presets; optional upload of a local TTF, OTF, WOFF or WOFF2 font.
- Adjustable target text width (mm) and letter depth (mm).
- LED strip model selector with model-specific guidance.
- Orbit/zoom interactive 3D preview.
- Binary STL or OBJ export.

## Important limitations

The generator creates a block-style raster extrusion of text using rectangular segments. Export meshes contain overlapping coplanar surfaces and are **not guaranteed watertight/manifold**; run a mesh union/repair in a slicer or CAD application before printing. This is not yet a production-grade LED housing generator: it does not create LED strip channels, diffusion covers, wire routing, or mounting features. Strip selection currently updates design guidance/metadata but does not change model geometry. Local fonts depend on browser support. The application requires WebGL and a working CDN connection.

## Repository layout

```
index.html
style.css
src/app.js
README.md
```

## Deployment

Push these files to the root of the `main` branch. Enable GitHub Pages from `main` / root in repository Settings → Pages.
