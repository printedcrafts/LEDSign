// Runs the app's own CSG helpers (csgCleanGeometry / subtractSolids) in Node against the vendored libraries.
// Regression test: the evaluator used to throw "Cannot read properties of undefined (reading 'array')"
// because the cut shapes had no uv attribute but the evaluator expected one.
// Run with: node --import ./tests/_register.mjs tests/csg-smoke.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import * as csg from '../vendor/three-bvh-csg.js';

const origWarn = console.warn; console.warn = (...a) => { if (!String(a[0]).includes('maxLeafSize')) origWarn(...a); };
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function extract(start, end) { const i = app.indexOf(start), j = app.indexOf(end, i); assert.ok(i >= 0 && j > i, 'could not find ' + start); return app.slice(i, j); }
const { subtractSolids } = new Function('THREE', 'getCSG', extract('function csgCleanGeometry(', 'function channelGeometry(') + '; return {subtractSolids};')(THREE, async () => csg);

function volume(g) {
  const p = g.attributes.position, idx = g.index, n = idx ? idx.count : p.count; let v = 0;
  const P = i => [p.getX(i), p.getY(i), p.getZ(i)];
  for (let t = 0; t < n; t += 3) {
    const a = P(idx ? idx.getX(t) : t), b = P(idx ? idx.getX(t + 1) : t + 1), c = P(idx ? idx.getX(t + 2) : t + 2);
    v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }
  return v;
}

// base: a non-indexed extrusion (what the app uses for backplane tiles); cuts: cylinders like the pass-through holes
const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(100, 0); shape.lineTo(100, 60); shape.lineTo(0, 60); shape.closePath();
const base = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
const baseVolume = volume(base);
const hole = (x, y) => { const g = new THREE.CylinderGeometry(2, 2, 6, 32); g.rotateX(Math.PI / 2); g.translate(x, y, 1.5); return g; };

const none = await subtractSolids(base, []);
assert.equal(none, base, 'no cuts must return the input unchanged');

const one = await subtractSolids(base, [hole(20, 30)]);
const expectOne = baseVolume - Math.PI * 4 * 3;
assert.ok(Math.abs(volume(one) - expectOne) / baseVolume < 0.01, `one hole: volume ${volume(one)} vs expected ${expectOne}`);

const three = await subtractSolids(base, [hole(20, 30), hole(50, 30), hole(80, 30)]);
const expectThree = baseVolume - 3 * Math.PI * 4 * 3;
assert.ok(Math.abs(volume(three) - expectThree) / baseVolume < 0.01, `three holes: volume ${volume(three)} vs expected ${expectThree}`);
assert.ok(volume(three) > 0, 'result must be a positively oriented solid');
console.log('CSG smoke tests passed: subtractSolids with 0, 1 and 3 cuts on a non-indexed extrusion.');
