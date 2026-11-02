// Lets the tests import the same vendored three.js that the browser import map points at.
// Uses module.registerHooks() where Node has it (the older module.register() is deprecated since Node 25) and falls back otherwise.
// Set LEDSIGN_LEGACY_HOOKS=1 to force the fallback.
import * as mod from 'node:module';

const vendor = new URL('../vendor/three/', import.meta.url);
function mapThree(specifier) {
  if (specifier === 'three') return new URL('build/three.module.js', vendor).href;
  if (specifier.startsWith('three/addons/')) return new URL('examples/jsm/' + specifier.slice('three/addons/'.length), vendor).href;
  return null;
}
if (typeof mod.registerHooks === 'function' && !process.env.LEDSIGN_LEGACY_HOOKS) {
  mod.registerHooks({ resolve(specifier, context, nextResolve) { const url = mapThree(specifier); return url ? { url, shortCircuit: true } : nextResolve(specifier, context); } });
} else {
  mod.register('./_three-loader.mjs', import.meta.url);
}
