// Needs network. Checks that auto-kerning really finds kerning pairs in the built-in fonts.
// (Lato keeps its kerning in a GPOS extension lookup, which opentype.js cannot read; app.js reads it itself.)
// Open Sans is not checked: the pinned file has no kerning data at all.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import opentype from '../vendor/opentype.module.js';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const { readGposKerning, kernPair } = new Function(app.slice(app.indexOf('function readGposKerning('), app.indexOf('function signLines(')) + 'return {readGposKerning,kernPair};')();
const urls = new Function('return ' + app.match(/const FONT_URLS=(\{[^}]*\});/)[1])();
for (const name of ['roboto', 'oswald', 'lato']) {
  const buf = await (await fetch(urls[name])).arrayBuffer(), font = opentype.parse(buf);
  font.extKern = readGposKerning(buf);
  for (const pair of ['AV', 'To', 'LT', 'Wa']) assert.ok(kernPair(font, font.charToGlyph(pair[0]), font.charToGlyph(pair[1]), 1) < 0, `${name}: ${pair} should kern tighter`);
  assert.equal(kernPair(font, font.charToGlyph('A'), font.charToGlyph('B'), 1), 0, `${name}: AB has no kerning`);
  console.log('ok', name);
}
// Values checked against HarfBuzz (kern on minus kern off), in font units for Lato (2000 per em).
const lato = await (await fetch(urls.lato)).arrayBuffer(), f = opentype.parse(lato), k = readGposKerning(lato);
for (const [pair, want] of Object.entries({ AV: -108, To: -244, LT: -188, Wa: -113 })) assert.equal(k(f.charToGlyph(pair[0]).index, f.charToGlyph(pair[1]).index), want, 'lato ' + pair);
console.log('Font kerning check passed.');
