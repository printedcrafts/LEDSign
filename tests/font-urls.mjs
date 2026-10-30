// Needs network. Checks that every built-in font URL in app.js is pinned to a commit and still returns a font file.
// (Lato used to point at a file that does not exist, so choosing Lato failed with a 404.)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const block = app.match(/const FONT_URLS=(\{[^}]*\});/);
assert.ok(block, 'could not find FONT_URLS in app.js');
const urls = Object.entries(new Function('return ' + block[1])());
assert.equal(urls.length, 4, 'expected roboto, oswald, opensans and lato');
for (const [name, url] of urls) {
  assert.match(url, /\/google\/fonts\/[0-9a-f]{40}\/ofl\//, `${name}: font URL must be pinned to a commit, not a branch`);
  const res = await fetch(url, { method: 'HEAD' });
  assert.equal(res.status, 200, `${name}: ${url} returned ${res.status}`);
  assert.ok(Number(res.headers.get('content-length')) > 100000, `${name}: unexpectedly small font file`);
  console.log('ok', name, res.headers.get('content-length'), 'bytes');
}
console.log('Font URL check passed.');
