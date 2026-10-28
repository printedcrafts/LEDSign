# PrintedCrafts LEDSign Studio

A browser-based LED neon sign builder focused on centreline lettering and printable U-channel geometry.

## Workflow
1. Enter text such as `NEON SIGN`. The built-in alphabet is authored as single-line LED strokes.
2. Upload a TTF/OTF font to rasterize the glyphs and automatically trace the thinned medial skeleton. Review the centreline preview; branching letters and decorative fonts may need manual correction.
3. Adjust global letter spacing and one character pair, then set target width and LED channel profile.
4. Enable **Integrate channel and backplane flange** to generate one swept STL cross-section in which the channel floor/walls and backing flange are connected. Select optional mounting accessories: keyway hanger tabs, hanging eyelets, or wall standoffs.
5. Select the printer bed, generate parts, and download the ZIP. The ZIP includes `README-PRINTING.txt`, `ASSEMBLY-GUIDE.svg`, and `CHANNEL-CROSS-SECTION.svg`.
6. Arrange tile parts by the assembly map, dry-fit, attach mounts, check LED fit and inspect every STL in a slicer before printing.

## Geometry and smoothing
The app thins font rasters using Zhang–Suen skeletonization, traces the pixel graph, suppresses redundant diagonal neighbours, simplifies polylines, then uses corner-cutting and distance-based resampling to reduce pixel-scale waves. This does not guarantee a perfect skeleton for every font or resolve every branch junction.

The integrated backing is a swept flange under each centreline channel; it is not one solid silhouette plate filling all empty spaces between letters. Tile joints are flat butt joints: dovetails, snap locks, diffuser caps, and boolean-cut wire/mount holes are not included.

## Mounting and safety
Mounting accessories are separate STL parts and require physical fit-check and attachment to the backplane. The keyway tab is an open keyway, not a load-rated fastener. Eyelets and standoffs are experimental. Select screws, anchors, adhesives and mounting points based on the actual sign weight, wall/chain and print orientation; no load certification is provided.

Verify actual LED flex dimensions, clearance, minimum bend radius, wall/floor thickness, mesh integrity, tile alignment, heat management, insulated wiring, strain relief and power supply rating. This is experimental fabrication software, not electrical or structural certification.

Font files are processed locally in the browser. GitHub Pages is supported when `index.html`, `app.js` and `style.css` are published from the same directory.
