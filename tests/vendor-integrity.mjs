// Supply-chain guard: vendored files must match the sha256 list in vendor/README.md, every import-map target must exist,
// and no code may be loaded from a CDN.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

const listed = [...read('vendor/README.md').matchAll(/^([0-9a-f]{64})  (vendor\/\S+)$/gm)];
assert.ok(listed.length >= 10, 'vendor/README.md must list the sha256 of every vendored file');
for (const [, hash, path] of listed) {
  assert.ok(existsSync(new URL(path, root)), `${path} is listed in vendor/README.md but missing`);
  const actual = createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
  assert.equal(actual, hash, `${path} does not match the sha256 recorded in vendor/README.md (was it edited or replaced?)`);
}

const html = read('index.html'), app = read('app.js');
const map = JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
for (const [name, target] of Object.entries(map)) {
  assert.ok(target.startsWith('./vendor/'), `import map entry ${name} must point into ./vendor/, found ${target}`);
  if (!target.endsWith('/')) assert.ok(existsSync(new URL(target, root)), `import map target ${target} is missing`);
}
for (const f of ['vendor/three-bvh-csg.js', 'vendor/opentype.module.js']) assert.ok(existsSync(new URL(f, root)), f + ' is missing');
for (const [file, text] of [['index.html', html], ['app.js', app]]) {
  const hit = text.match(/https?:\/\/(?:cdn\.jsdelivr\.net|esm\.sh|unpkg\.com|cdnjs\.cloudflare\.com|ga\.jspm\.io)[^\s'"]*/);
  assert.equal(hit, null, `${file} must not load code from a CDN (${hit && hit[0]})`);
}
console.log(`Vendor integrity passed: ${listed.length} files match vendor/README.md, import map targets exist, no CDN references.`);
