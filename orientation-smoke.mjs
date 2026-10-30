// Closed shells made by sweepGeometry / shapeGeo must have positive signed volume (outward winding) for slicers.
// Run with: node --import ./tests/_register.mjs tests/orientation-smoke.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function extract(start, end) { const i = app.indexOf(start), j = app.indexOf(end, i); assert.ok(i >= 0 && j > i, 'could not find ' + start); return app.slice(i, j); }
const $ = id => ({ value: id === 'cornerMode' ? 'bevel' : '6' });
const { thin, orientOutward, sweepGeometry, shapeGeo } = new Function('THREE', '$',
  extract('function thin(', 'function addMesh(') + extract('function shapeGeo(', 'function roundedRect(') + '; return {thin,orientOutward,sweepGeometry,shapeGeo};')(THREE, $);

function volume(g) {
  const p = g.attributes.position, idx = g.index, n = idx ? idx.count : p.count; let v = 0; const P = i => [p.getX(i), p.getY(i), p.getZ(i)];
  for (let t = 0; t < n; t += 3) { const a = P(idx ? idx.getX(t) : t), b = P(idx ? idx.getX(t + 1) : t + 1), c = P(idx ? idx.getX(t + 2) : t + 2);
    v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6; }
  return v;
}
// normals stored on the geometry must agree with the winding (outward): sum of dot(faceNormal, vertexNormal) > 0
function normalsAgree(g) {
  const p = g.attributes.position, nr = g.attributes.normal, idx = g.index, n = idx ? idx.count : p.count; let agree = 0, total = 0;
  const V = i => new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), N = i => new THREE.Vector3(nr.getX(i), nr.getY(i), nr.getZ(i));
  for (let t = 0; t < n; t += 3) { const ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
    const f = V(ib).sub(V(ia)).cross(V(ic).sub(V(ia))); if (f.lengthSq() < 1e-12) continue; total++; if (f.dot(N(ia)) > 0) agree++; }
  return agree / total;
}
const V2 = (x, y) => new THREE.Vector2(x, y);
const square = (s, ccw) => { const pts = [V2(-s, -s), V2(s, -s), V2(s, s), V2(-s, s)]; return ccw ? pts : pts.reverse(); };
// the wall profile used for channel letters (outer 13.5, inner 9.5, wall 18, floor 2)
const outer = 13.5, inner = 9.5, wallH = 18, floorT = 2;
const wall = [[-outer / 2, 0], [outer / 2, 0], [outer / 2, wallH], [inner / 2, wallH], [inner / 2, floorT], [-inner / 2, floorT], [-inner / 2, wallH], [-outer / 2, wallH]];
for (const ccw of [true, false]) {
  const g = sweepGeometry(square(40, ccw), wall, true, false);
  assert.ok(volume(g) > 0, `wall sweep (${ccw ? 'ccw' : 'cw'} path) must have positive volume, got ${volume(g)}`);
  assert.ok(normalsAgree(g) > 0.99, 'vertex normals must agree with winding');
  for (const s of [1, -1]) { // ledge profile: asymmetric, mirrored by the path direction in the app
    const ledge = [[0, 13], [s * 3, 13], [s * 3, 15], [s * 3 * .72, 15], [0, 15 + 1.5]];
    assert.ok(volume(sweepGeometry(square(40, ccw), ledge, true, false)) > 0, `ledge sweep side ${s} (${ccw ? 'ccw' : 'cw'}) must have positive volume`);
  }
}
// open sweep with end caps (wire groove / ID engraving cutters)
const groove = [[-3.5, -.025], [3.5, -.025], [4.9, 2], [-4.9, 2]];
assert.ok(volume(sweepGeometry([V2(0, 0), V2(30, 10), V2(60, 10)], groove, false, true)) > 0, 'open capped sweep must have positive volume');
// floor extrusion: Y-mirrored by shapeGeo
const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(50, 0); shape.lineTo(50, 20); shape.lineTo(0, 20); shape.closePath();
const floor = shapeGeo(shape, 2, -.03, { cx: 25, cy: 10 }, 1.2);
assert.ok(volume(floor) > 0, `mirrored floor extrusion must have positive volume, got ${volume(floor)}`);
assert.ok(normalsAgree(floor) > 0.99, 'floor normals must agree with winding');
// orientOutward leaves correct meshes alone and fixes reversed ones (indexed and non-indexed)
const box = new THREE.BoxGeometry(2, 2, 2); const before = volume(box); assert.ok(before > 0);
assert.equal(volume(orientOutward(box)), before);
const flipped = new THREE.BoxGeometry(2, 2, 2).scale(1, -1, 1); assert.ok(volume(flipped) < 0); assert.ok(volume(orientOutward(flipped)) > 0, 'indexed reversed mesh must be fixed');
const flat = new THREE.BoxGeometry(2, 2, 2).toNonIndexed().scale(1, -1, 1); assert.ok(volume(flat) < 0); assert.ok(volume(orientOutward(flat)) > 0, 'non-indexed reversed mesh must be fixed');
// dense paths (spacing below the 0.025 mm tolerance) must be thinned, not collapsed to a single point
const dense = Array.from({ length: 20000 }, (_, i) => V2(i * 0.005, 0)); // 100 mm long, 0.005 mm apart
const thinned = thin(dense, .025);
assert.ok(thinned.length > 3000 && thinned.length < 5000, `dense path should keep about 4000 points, kept ${thinned.length}`);
assert.ok(thinned.at(-1).x > 99.9 - .025 && thinned[0].x === 0, 'thinned path must keep its start and run to its end');
assert.equal(thin(square(10, true), .025).length, 4, 'sparse paths are unchanged');
console.log('Orientation smoke tests passed: sweeps (both path directions), ledge profiles, capped sweeps, mirrored floors.');
