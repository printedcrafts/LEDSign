// Printable-pieces tests: joint clearance, bed-fit planner, cutting solids at tile seams, ZIP writer, plan text.
// Run with: node --import ./tests/_register.mjs tests/split-smoke.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as zlib from 'node:zlib';
import * as THREE from 'three';
import * as csg from '../vendor/three-bvh-csg.js';

const origWarn = console.warn; console.warn = (...a) => { if (!String(a[0]).includes('maxLeafSize')) origWarn(...a); };
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function extract(start, end) { const i = app.indexOf(start), j = app.indexOf(end, i); assert.ok(i >= 0 && j > i, 'could not find ' + start); return app.slice(i, j); }

const { edgePoints } = new Function(extract('function edgePoints(', 'function clipPolygon(') + '; return {edgePoints};')();
const lib = new Function('THREE', 'getCSG', extract('function csgCleanGeometry(', 'function channelGeometry(') + extract('/* ==== printable pieces: begin ==== */', '/* ==== printable pieces: end ==== */') +
  '; return {planTileGrid,splitIntoSolids,cutSolidToRects,solidVolume,makeZip,crc32,printPlanText,assemblyMapSvg,pointsBox,crossingProfile,chooseSeams};')(THREE, async () => csg);

// ---------- 1. joint clearance: the pocket is the tab pushed outward by exactly `clearance` ----------
const dist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const toPolyDist = (p, poly) => { let m = Infinity; for (let i = 0; i + 1 < poly.length; i++) m = Math.min(m, dist(p, poly[i], poly[i + 1])); return m; };
for (const style of ['dovetail', 'puzzle']) {
  for (const c of [0, 0.2, 0.35]) {
    // seam on y=0; the male tab sticks into the y<0 side; the neighbour's edge runs the other way with the opposite normal
    const male = edgePoints([0, 0], [100, 0], [0, -1], true, 'male', style, 7, 24, c);
    const female = edgePoints([100, 0], [0, 0], [0, 1], true, 'female', style, 7, 24, c);
    assert.equal(JSON.stringify(male), JSON.stringify(edgePoints([0, 0], [100, 0], [0, -1], true, 'male', style, 7, 24)), 'the male tab must not change with clearance');
    // sample the tab outline densely (only the part off the seam line)
    const samples = []; for (let i = 0; i + 1 < male.length; i++) { const a = male[i], b = male[i + 1]; if (Math.abs(a[1]) < 1e-9 && Math.abs(b[1]) < 1e-9) continue; for (let k = 0; k <= 50; k++) samples.push([a[0] + (b[0] - a[0]) * k / 50, a[1] + (b[1] - a[1]) * k / 50]); }
    const gaps = samples.map(p => toPolyDist(p, female)), min = Math.min(...gaps);
    assert.ok(Math.abs(min - c) < 1e-6, `${style} clearance ${c}: smallest tab-to-pocket gap should be ${c}, got ${min}`);
    const tip = Math.min(...female.map(p => p[1])); assert.ok(Math.abs(tip - -(7 + c)) < 1e-9, `${style}: pocket must be ${c} deeper than the tab`);
    if (c === 0) assert.equal(female.length, male.length, 'zero clearance keeps the original shape');
  }
}
assert.equal(JSON.stringify(edgePoints([0, 0], [100, 0], [0, -1], true, 'male', 'dovetail', 7, 24, 0.2)), JSON.stringify(edgePoints([0, 0], [100, 0], [0, -1], true, 'male', 'dovetail', 7, 24, 0)), 'clearance only affects female edges');

// ---------- 2. planner ----------
const base = { totalW: 1250, totalH: 350, bedW: 256, bedH: 256, margin: 5, depth: 7, fraction: 1, mode: 'auto', minPiece: 100 };
const big = lib.planTileGrid(base); assert.deepEqual([big.cols, big.rows, big.rotate], [6, 2, false]);
const small = lib.planTileGrid({ ...base, bedW: 180, bedH: 180 }); assert.deepEqual([small.cols, small.rows], [9, 3]);
const more = lib.planTileGrid({ ...base, fraction: 0.6 }); assert.ok(more.cols * more.rows > big.cols * big.rows, 'smaller piece size must give more pieces');
let prev = 0; for (const f of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) { const p = lib.planTileGrid({ ...base, fraction: f }); assert.ok(p.cols * p.rows >= prev, 'piece count must not fall as pieces get smaller'); prev = p.cols * p.rows; }
for (const [W, H, bed, f] of [[1250, 350, 256, 1], [1250, 350, 180, 1], [900, 900, 220, 0.7], [2000, 600, 300, 0.5]]) {
  const p = lib.planTileGrid({ ...base, totalW: W, totalH: H, bedW: bed, bedH: bed, fraction: f });
  const pieceW = W / p.cols + 14, pieceH = H / p.rows + 14; // worst case: tabs on both sides
  assert.ok(pieceW <= (bed - 10) + 1e-6 && pieceH <= (bed - 10) + 1e-6, `pieces ${pieceW.toFixed(0)}x${pieceH.toFixed(0)} must fit a ${bed} mm bed`);
}
assert.equal(lib.planTileGrid({ ...base, totalW: 200, totalH: 100 }).cols, 1, 'a sign that fits is one piece');
assert.equal(lib.planTileGrid({ ...base, totalW: 250, totalH: 100, fraction: 0.4 }).cols, 2, 'pieces never get smaller than 100 mm');
const wide = lib.planTileGrid({ ...base, totalW: 300, totalH: 1000, bedW: 300, bedH: 200 }); assert.equal(wide.rotate, true, 'rotating pieces on a rectangular bed can need fewer pieces');
assert.equal(lib.planTileGrid({ ...base, totalW: 1000, totalH: 300, bedW: 300, bedH: 200 }).rotate, false);
assert.equal(big.maxNomW, 232); assert.equal(big.maxNomH, 232); assert.equal(small.maxNomW, 156);
assert.equal(wide.maxNomW, 176, 'rotated pieces swap the limits'); assert.equal(wide.maxNomH, 276);
const manual = lib.planTileGrid({ ...base, mode: 'manual', maxW: 250, maxH: 250 }); assert.deepEqual([manual.cols, manual.rows], [5, 2], 'manual mode keeps the old tile max behaviour');

// ---------- 2b. seams between the letters ----------
const sq = (x0, y0, x1, y1) => [{ X: x0 * 1000, Y: y0 * 1000 }, { X: x1 * 1000, Y: y0 * 1000 }, { X: x1 * 1000, Y: y1 * 1000 }, { X: x0 * 1000, Y: y1 * 1000 }];
{
  const prof = lib.crossingProfile([sq(20, 0, 30, 10)], 'x', 0, 50, 1);
  assert.equal(prof[25], 10); assert.equal(prof[15], 0); assert.equal(prof[20], 10, 'left edge is inside'); assert.equal(prof[30], 0, 'right edge is outside (half-open)');
  assert.equal(lib.crossingProfile([sq(0, 0, 10, 10), sq(3, 3, 7, 7)], 'x', 0, 10, 1)[5], 6, 'a hole subtracts its length');
  const py = lib.crossingProfile([sq(20, 0, 30, 10)], 'y', 0, 20, 1); assert.equal(py[5], 10); assert.equal(py[15], 0, 'horizontal cut lines measure along x');
  const diamond = [{ X: 0, Y: 5000 }, { X: 5000, Y: 0 }, { X: 10000, Y: 5000 }, { X: 5000, Y: 10000 }];
  assert.ok(Math.abs(lib.crossingProfile([diamond], 'x', 0, 10, 1)[5] - 10) < 1e-9 && Math.abs(lib.crossingProfile([diamond], 'x', 0, 10, 1)[2] - 4) < 1e-9, 'slanted edges are interpolated');
  const zone = (k, ranges) => ranges.some(([a, b]) => k > a && k < b) ? 50 : 0;
  const cost = Float64Array.from({ length: 901 }, (_, k) => zone(k, [[270, 330], [570, 630]]));
  const seams = lib.chooseSeams({ lo: 0, hi: 900, n: 3, minNom: 100, maxNom: 400, cost, step: 1 });
  assert.equal(seams.length, 4); assert.deepEqual([seams[0], seams[3]], [0, 900]);
  assert.ok(seams.slice(1, 3).every(x => cost[Math.round(x)] === 0), 'seams must avoid the lettering: ' + seams);
  for (let i = 0; i < 3; i++) { const w = seams[i + 1] - seams[i]; assert.ok(w >= 100 - 1e-9 && w <= 400 + 1e-9, 'piece width ' + w); }
  const flat = lib.chooseSeams({ lo: 0, hi: 900, n: 3, minNom: 100, maxNom: 400, cost: new Float64Array(901).fill(30), step: 1 });
  assert.ok(Math.abs(flat[1] - 300) < 1.5 && Math.abs(flat[2] - 600) < 1.5, 'with no gaps the pieces stay about even: ' + flat);
  const tight = lib.chooseSeams({ lo: 0, hi: 900, n: 3, minNom: 100, maxNom: 320, cost, step: 1 });
  for (let i = 0; i < 3; i++) assert.ok(tight[i + 1] - tight[i] <= 320 + 1e-9, 'the size limit beats the gap preference');
  const twoPlaces = Float64Array.from({ length: 501 }, (_, k) => k > 150 && k < 170 ? 10 : k > 230 && k < 260 ? 40 : 60);
  const pick = lib.chooseSeams({ lo: 0, hi: 500, n: 2, minNom: 100, maxNom: 400, cost: twoPlaces, step: 1 }); assert.ok(pick[1] > 150 && pick[1] < 170, 'cheapest cut wins: ' + pick);
  assert.deepEqual(lib.chooseSeams({ lo: 5, hi: 105, n: 1, minNom: 100, maxNom: 400, cost: [], step: 1 }), [5, 105]);
  const impossible = lib.chooseSeams({ lo: 0, hi: 150, n: 3, minNom: 100, maxNom: 400, cost: new Float64Array(151), step: 1 }); assert.deepEqual(impossible, [0, 50, 100, 150], 'impossible limits fall back to an even grid');
  const t0 = Date.now(); lib.chooseSeams({ lo: 0, hi: 1250, n: 27, minNom: 100, maxNom: 156, cost: new Float64Array(1251).fill(5), step: 1 }); assert.ok(Date.now() - t0 < 3000, 'seam search stays fast for 27 pieces');
}

// ---------- 3. splitting solids ----------
const vol = lib.solidVolume;
{ // merged wall+floor mesh -> two solids
  const a = new THREE.BoxGeometry(10, 10, 10).toNonIndexed(), b = new THREE.BoxGeometry(4, 4, 4).toNonIndexed(); b.translate(2, 2, 2);
  const merged = new THREE.BufferGeometry(); for (const n of ['position', 'normal', 'uv']) { const arr = new Float32Array(a.attributes[n].array.length + b.attributes[n].array.length); arr.set(a.attributes[n].array); arr.set(b.attributes[n].array, a.attributes[n].array.length); merged.setAttribute(n, new THREE.BufferAttribute(arr, a.attributes[n].itemSize)); }
  merged.userData.shellSplit = a.attributes.position.count;
  const parts = lib.splitIntoSolids(merged); assert.equal(parts.length, 2); assert.ok(Math.abs(vol(parts[0]) - 1000) < 1e-6 && Math.abs(vol(parts[1]) - 64) < 1e-6, 'each shell keeps its own volume');
  assert.equal(lib.splitIntoSolids(a)[0], a, 'a mesh without a split marker is returned unchanged');
}
{ // a torus that crosses a seam is cut into two closed pieces whose volumes add up
  const torus = new THREE.TorusGeometry(30, 6, 24, 64); torus.translate(50, 0, 3);
  const rects = [[0, -100, 50, 100], [50, -100, 100, 100]], t0 = Date.now(), { pieces, error } = await lib.cutSolidToRects(torus, rects);
  assert.equal(pieces.length, 2); assert.ok(error < 0.001, 'volume error ' + error);
  for (const p of pieces) { p.geometry.computeBoundingBox(); const r = rects[p.index], b = p.geometry.boundingBox; assert.ok(b.min.x >= r[0] - 1e-3 && b.max.x <= r[2] + 1e-3, 'piece stays inside its tile'); assert.ok(vol(p.geometry) > 0, 'piece is an outward solid'); }
  const sum = pieces.reduce((s, p) => s + vol(p.geometry), 0); assert.ok(Math.abs(sum - vol(torus)) / vol(torus) < 0.001);
  const inside = new THREE.BoxGeometry(10, 10, 10); inside.translate(25, 0, 0); const one = await lib.cutSolidToRects(inside, rects); assert.equal(one.pieces[0].geometry, inside, 'a solid inside one tile is passed through untouched'); assert.equal(one.pieces[0].index, 0);
  const far = new THREE.BoxGeometry(5, 5, 5); far.translate(500, 500, 0); assert.equal((await lib.cutSolidToRects(far, rects)).pieces.length, 0, 'a solid outside every tile has no pieces');
}

// ---------- 4. ZIP writer: read it back with an independent parser ----------
{
  const enc = new TextEncoder(), files = [{ name: 'a.stl', data: new Uint8Array([1, 2, 3, 4, 5]) }, { name: 'sub/ünï.txt', data: enc.encode('héllo') }, { name: 'empty.bin', data: new Uint8Array(0) }, { name: 'big.bin', data: Uint8Array.from({ length: 70000 }, (_, i) => i * 7 & 255) }];
  const zip = new Uint8Array(await lib.makeZip(files).arrayBuffer()), dv = new DataView(zip.buffer);
  const eocd = zip.length - 22; assert.equal(dv.getUint32(eocd, true), 0x06054b50); assert.equal(dv.getUint16(eocd + 10, true), files.length);
  let p = dv.getUint32(eocd + 16, true);
  for (const f of files) {
    assert.equal(dv.getUint32(p, true), 0x02014b50); const crc = dv.getUint32(p + 16, true), size = dv.getUint32(p + 24, true), nameLen = dv.getUint16(p + 28, true), off = dv.getUint32(p + 42, true);
    assert.equal(new TextDecoder().decode(zip.slice(p + 46, p + 46 + nameLen)), f.name); assert.equal(size, f.data.length);
    assert.equal(dv.getUint32(off, true), 0x04034b50); const lNameLen = dv.getUint16(off + 26, true), data = zip.slice(off + 30 + lNameLen, off + 30 + lNameLen + size);
    assert.deepEqual(Array.from(data), Array.from(f.data), 'stored data must match'); assert.equal(crc, lib.crc32(f.data));
    if (typeof zlib.crc32 === 'function') assert.equal(crc, zlib.crc32(f.data), 'CRC-32 must match Node\'s implementation');
    p += 46 + nameLen;
  }
}

// ---------- 5. plan text and assembly map ----------
{
  const tiles = [{ id: 'T01-01', x0: 0, y0: 0, w: 200, h: 100, col: 0, row: 0 }, { id: 'T01-02', x0: 200, y0: 0, w: 200, h: 100, col: 1, row: 0 }];
  const text = lib.printPlanText({ title: 'My <sign>', bedW: 256, bedH: 256, bedZ: 250, margin: 5, usableW: 246, usableH: 246, cols: 2, rows: 1, rotate: false, gap: 0.2, seam: 'Seams run between the letters, so no seam cuts through the LED channel.', notes: ['x'],
    pieces: [{ id: 'T01-01', row: 1, col: 1, w: 207, h: 100, z: 21, fits: true, file: 'a.stl', mountsFile: 'm.stl', mounts: [{ name: 'Keyhole tab 1', x: 30, y: 40 }] }, { id: 'T01-02', row: 1, col: 2, w: 200, h: 100, z: 21, fits: false, file: 'b.stl', mounts: [] }] });
  assert.ok(text.includes('T01-02') && text.includes('DOES NOT FIT') && text.includes('0.20 mm') && text.includes('Keyhole tab 1') && text.includes('Seams run between the letters') && !/undefined|NaN/.test(text));
  const svg = lib.assemblyMapSvg({ title: 'My <sign>', tiles, bounds: { minX: 0, maxX: 400, minY: 0, maxY: 100, width: 400, height: 100 } });
  assert.ok(svg.startsWith('<svg') && svg.includes('T01-02') && svg.includes('My &lt;sign&gt;') && !/undefined|NaN/.test(svg));
}
console.log('Split smoke tests passed: joint clearance (dovetail + puzzle), bed planner, seam search, solid cutting, ZIP writer, plan text.');
