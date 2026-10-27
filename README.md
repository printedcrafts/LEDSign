# LEDSign — 3D Sign Studio

A **fully static**, browser-based text-to-3D sign generator. No npm, backend, API keys, CDN, or JavaScript dependencies are required.

## Deployment to GitHub Pages

1. Extract `LEDSign.zip` and upload **the contents** of the `LEDSign` folder to the root of the `main` branch (do not upload the ZIP itself).
2. Your repo should show `index.html`, `style.css`, `src/`, `.github/`, `tests/`, and `README.md` at its top level.
3. In GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Select **main** and **/(root)**, then Save.
4. Visit `https://printedcrafts.github.io/LEDSign/` once Pages deployment completes. Browser cache may need a hard refresh following updates.

The site works on **GitHub Pages** and any basic static HTTP server. For local use, from the project directory run `python3 -m http.server 8000`, then open `http://localhost:8000`.

## Features

- Enter up to 24 characters of single-line text.
- Choose built-in system fonts or upload TTF/OTF/WOFF fonts (font stays on your device).
- Set text width, raised-letter height, optional base plate padding and thickness.
- Browser-generated mesh and an interactive 3D preview (drag to rotate, scroll to zoom).
- Download binary **STL** or text **OBJ** with dimensions in millimeters.
- LED strip reference dropdown (voltage guidance only).
- Responsive layout, no external services or telemetry.

## Manufacturing limitations (important)

This app converts the text to a **rasterized pixel outline** and builds a boundary surface around occupied cells. Curves therefore have slightly stepped edges. For standalone letters (backing plate disabled), multiple disconnected objects can result. With a plate, the letters intersect and form a connected surface, although some letter pixels may be separated in very small/complex typefaces. Inspect the result using your slicer's mesh checking tools before print production.

The LED selection is **informational only**. The generated models **do not** contain LED tape channels, diffusers, electrical connections, wiring bores, mounting holes, or power calculations. The generated files are basic 3D text signs, not ready-made electrically engineered LED fixtures.

Fonts depend on those installed in your browser's operating system; uploading a font produces more predictable styling. No font files are included.

## Project structure

```
index.html              User interface
style.css               Responsive styles
src/app.js              Browser interaction, text raster, 3D preview
src/geometry.js         Surface mesh generation + STL/OBJ exporters
tests/geometry.test.mjs Node.js built-in test runner (optional)
.github/workflows/ci.yml Basic automated tests
README.md               Instructions
```

## Tests

Optional development test (Node.js 20+):

```bash
node --test tests/geometry.test.mjs
node --check src/app.js
node --check src/geometry.js
```

No package installation is needed. For best results use a current Chrome, Edge, Firefox, or Safari browser.
