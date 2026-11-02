// Offline test for text alignment, letter spacing and auto-kerning. Uses a tiny font built in memory, so no network is needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import opentype from '../vendor/opentype.module.js';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const i = app.indexOf('function readGposKerning('), j = app.indexOf('function signLines(');
assert.ok(i >= 0 && j > i, 'could not find the layout functions in app.js');
const { readGposKerning, kernPair, layoutTextLines } = new Function(app.slice(i, j) + 'return {readGposKerning,kernPair,layoutTextLines};')();

// Every letter is a 600-wide box in a 1000-unit em, so ink widths are easy to predict.
const box = () => { const p = new opentype.Path(); p.moveTo(0, 0); p.lineTo(600, 0); p.lineTo(600, 700); p.lineTo(0, 700); p.close(); return p; };
const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 600, path: new opentype.Path() }),
  new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 300, path: new opentype.Path() })];
for (const ch of 'ABW') glyphs.push(new opentype.Glyph({ name: ch, unicode: ch.charCodeAt(0), advanceWidth: 700, path: box() }));
glyphs.forEach((g, n) => { g.index = n; }); // the Font constructor does not number glyphs, but kerning pairs are keyed by glyph number
const font = new opentype.Font({ familyName: 'T', styleName: 'R', unitsPerEm: 1000, ascender: 800, descender: -200, glyphs });
const idx = ch => font.charToGlyph(ch).index;
const base = { size: 100, lineStep: 140 };
// Ink extents per line: group the returned glyphs by the line they were placed on (their baseline sits at row*lineStep, boxes grow upward).
function lineExtents(r) {
  const out = {};
  for (const g of r.glyphs) { const row = Math.round(((g.bounds.y1 + g.bounds.y2) / 2 + 35) / 140); const o = out[row] ||= [Infinity, -Infinity]; o[0] = Math.min(o[0], g.bounds.x1); o[1] = Math.max(o[1], g.bounds.x2); }
  return out;
}
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-6, `${m}: ${a} vs ${b}`);
const lines = ['ABABAB', 'AB', 'A'];

// Left, center and right line up the ink of every line against the widest line.
for (const align of ['left', 'center', 'right']) {
  const r = layoutTextLines(font, lines, { ...base, spacing: 0, align });
  const e = lineExtents(r), W = e[0][1] - e[0][0];
  for (const k of [1, 2]) {
    const w = e[k][1] - e[k][0];
    const want = align === 'left' ? e[0][0] : align === 'right' ? e[0][1] - w : e[0][0] + (W - w) / 2;
    near(e[k][0], want, align + ' line ' + k);
  }
}
// Per-line custom mode gives each line its own choice.
const c = layoutTextLines(font, lines, { ...base, spacing: 0, align: 'custom', lineAligns: ['left', 'right', 'center'] });
const ce = lineExtents(c);
near(ce[1][1], ce[0][1], 'custom: line 2 is right aligned');
near((ce[2][0] + ce[2][1]) / 2, (ce[0][0] + ce[0][1]) / 2, 'custom: line 3 is centered');
// A missing choice falls back to center, and blank lines do not break anything.
const m = layoutTextLines(font, ['AB', '', 'A'], { ...base, spacing: 0, align: 'custom', lineAligns: [] });
assert.equal(m.glyphs.length, 3);

// Letter spacing: 10% of a 100 unit font size is 10 units per gap.
const s0 = layoutTextLines(font, ['ABAB'], { ...base, spacing: 0, align: 'left' }), s10 = layoutTextLines(font, ['ABAB'], { ...base, spacing: 10, align: 'left' });
near((s10.maxX - s10.minX) - (s0.maxX - s0.minX), 3 * 10, 'tracking adds one step per gap');
const sn = layoutTextLines(font, ['ABAB'], { ...base, spacing: -5, align: 'left' });
near((sn.maxX - sn.minX) - (s0.maxX - s0.minX), -3 * 5, 'negative tracking tightens');

// Auto-kerning: a pair value from the font moves the second letter, and bad values never break the layout.
font.kerningPairs = {}; // a font built in memory starts with no kern table
font.kerningPairs[idx('A') + ',' + idx('W')] = -100;
const k0 = layoutTextLines(font, ['AB'], { ...base, spacing: 0, align: 'left' }), k1 = layoutTextLines(font, ['AW'], { ...base, spacing: 0, align: 'left' });
near(k1.maxX - k0.maxX, -10, 'AW pair kerns by -100 font units (-10 at size 100)');
assert.equal(kernPair(font, null, glyphs[2], 0.1), 0);
assert.equal(kernPair({ getKerningValue() { throw new Error('boom'); } }, glyphs[2], glyphs[3], 0.1), 0);
assert.equal(kernPair({ getKerningValue() { return NaN; } }, glyphs[2], glyphs[3], 0.1), 0);
assert.equal(kernPair({}, glyphs[2], glyphs[3], 0.1), 0);

// Characters the font lacks are reported, not drawn.
const realLookup = font.charToGlyph.bind(font); // a font built in memory cannot look up an unknown character itself, so return .notdef the way a real font does
font.charToGlyph = c => (c === 'Z' ? glyphs[0] : realLookup(c));
const x = layoutTextLines(font, ['AZ'], { ...base, spacing: 0, align: 'left' });
assert.equal(x.glyphs.length, 1); assert.ok(x.missingChars.has('Z'));
// The extension-lookup reader gives up quietly on data it cannot read.
assert.equal(readGposKerning(new ArrayBuffer(4)), null);
assert.equal(readGposKerning(new Uint8Array(40).buffer), null);
// A font whose own kerning is 0 can still get a value from the extension reader, and the font's own value wins when it has one.
const ext = { getKerningValue: () => 0, extKern: (a, b) => (a === 1 && b === 2 ? -100 : 0) };
assert.equal(kernPair(ext, { index: 1 }, { index: 2 }, 0.1), -10);
assert.equal(kernPair({ ...ext, getKerningValue: () => -50 }, { index: 1 }, { index: 2 }, 0.1), -5);
console.log('Text layout checks passed.');
