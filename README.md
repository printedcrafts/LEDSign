# LEDSign rear wiring prototype

Deploy `index.html`, `style.css`, and `app.js` together in the root of the GitHub Pages `main` branch. This release retains the Brittany Signature tracing fallback.

## Wiring
Select **Start** and click the end of a visible LED path. Optionally select **Waypoint** and click one or more locations for the hidden rear wiring; select **End** and click the beginning of the next path. Green dashed lines mark the rear wiring route. The ZIP export includes separate rear-wire-raceway STL pieces, split to fit your configured printer bed.

## Safety and manufacturing limitations
The rear wiring conduits are *separate printed open-back raceways*, not grooves cut into a unified rear sign plate. The exporter does **not** automatically add the wire feed-through holes at the endpoints, join the raceways to the backing, electrically connect strips, or validate strain relief, voltage/current, bend radius, fire safety, or IP protection. Don't print or wire until those are reviewed. It does not include positive-locking dovetails. Inspect every STL with a slicer.
