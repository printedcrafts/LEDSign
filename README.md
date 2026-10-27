# LEDSign — reliable standalone preview

Upload **index.html** to the root of the `main` branch. No other files are required. The complete stylesheet, vector editor, geometry engine, and exporters are included in this single file.

## Preview behavior
- The SVG preview draws immediately on page load. It never waits for STL generation.
- Sliders update their numerical outputs on every `input` event (while dragging).
- LED profile selection sets the physical dimensions of the U-channel; side-bend profiles are a top-opening approximation.
- Drag mint nodes to edit path centerlines.
- Click **Generate fabrication STL files** only when ready to download STL. An elapsed-time counter appears while building. Large synchronous computations may pause its display until work completes.
- Download the SVG layout and separate channel and backing STL exports.

## Limitations
Font upload and true commercial neon path tracing are not implemented. Verify printed dimensions and geometry in your slicer. Contour backing can have disconnected islands. No mounting holes or cable routing. Side-bend profile lacks validated mechanical retention.

## Deploy
GitHub → LEDSign → root `index.html` → replace with included version → commit. In Pages Settings, use `main / (root)`. Hard reload deployed page.
