# vendor/

Third-party code that the app loads at runtime. Everything here is served from the same origin as `index.html`, so the app makes **no** requests to a CDN for code.
Deploy this whole folder next to `index.html`.

| Package | Version | License | Files |
|---|---|---|---|
| three | 0.180.0 | MIT | `three/build/three.module.js`, `three/build/three.core.js`, `three/examples/jsm/{controls/OrbitControls,loaders/SVGLoader,exporters/STLExporter,exporters/GLTFExporter,utils/BufferGeometryUtils}.js` (unmodified copies from the npm package) |
| three-bvh-csg | 0.0.18 | MIT | `three-bvh-csg.js` (bundle, also contains three-mesh-bvh 0.9.17) |
| three-mesh-bvh | 0.9.17 | MIT | inside `three-bvh-csg.js` |
| opentype.js | 1.3.4 | MIT | `opentype.module.js` (unmodified `dist/opentype.module.js`) |
| clipper-lib | 6.4.2 | Boost | `clipper.js` |

`index.html` maps the bare imports `three` and `three/addons/` to these files with an import map. `app.js` loads `three-bvh-csg.js` and `opentype.module.js` on first use with a relative `import()`, and retries with a fresh `?retry=N` URL after a failed download (browsers remember failed module URLs).

## Regenerating

```
npm install three@0.180.0 three-bvh-csg@0.0.18 three-mesh-bvh@0.9.17 opentype.js@1.3.4 esbuild
npx esbuild node_modules/three-bvh-csg/src/index.js --bundle --format=esm --external:three --outfile=vendor/three-bvh-csg.js
# then copy the other files listed above from node_modules (same relative paths)
```

Keep `three-mesh-bvh` at the version above: `three-bvh-csg` only declares `>=0.9.7`, so an unpinned install can pick up breaking changes.

## Fonts

The built-in fonts (Roboto, Oswald, Open Sans, Lato) are not stored here. `app.js` fetches them at runtime from `raw.githubusercontent.com/google/fonts/<commit>/ofl/...`, pinned to one commit. To update them, change the commit in `FONT_URLS` and check that all four URLs still return 200. The fonts are licensed under the SIL Open Font License.

## SHA-256 of the vendored files

```
76b50f7e7fcf261698c5368737614d54835db3b12999a3d28b365b99c465eff7  vendor/clipper-LICENSE.txt
a650c6946682edc1a64016f6553eeb5c32ce45eb7ca0ad5d8221961af011d97c  vendor/clipper.js
a5b87c9bc191e7f9c06b07bd7cbbed3ed846dfdb50e859484b2c245aa1ab2e61  vendor/opentype-LICENSE.txt
8d79d17388114a29d74681dfaed84068b1d7d9b4e39a9544fb6406d25579ad8f  vendor/opentype.module.js
9c0532b74be2071ecc3e9a0f05fc6a894e77aeec0b6813d612fea76f64abb4a1  vendor/three-bvh-csg-LICENSE.txt
1753a8c79e9a91d1da23d1f7af141362a17ba78c5d8e1d899a4689d1795b2d72  vendor/three-bvh-csg.js
bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601  vendor/three/LICENSE
eb077d2417f61d3e6d9264c317cabc4ea35769ed6b0ab533067292a550784c20  vendor/three/build/three.core.js
c8211c69345d2e9949dc7a8ac969380497aa0600a5a8ac6a459c8cd02dd9cb8a  vendor/three/build/three.module.js
b97879c748170baadeb3fb84cea1ffdf4674e283dc06042f34e2acb95a76042c  vendor/three/examples/jsm/controls/OrbitControls.js
e7c29444454eb321b39e4c8b3062944f4fd5299a0e7483e9cb8c0594cdec829f  vendor/three/examples/jsm/exporters/GLTFExporter.js
6508e5f79d120c7fdb677430342179609b27f59942dd6a2e215eef3ff60a7e60  vendor/three/examples/jsm/exporters/STLExporter.js
90aa8d9c60b4f93f2a482669f5761a530479049a5c42f4bcd32575a43d7a119e  vendor/three/examples/jsm/loaders/SVGLoader.js
fda7e946b8e0b5ab39b779206589e7a1079a22eb24efb89d7223e03fdfb1f751  vendor/three/examples/jsm/utils/BufferGeometryUtils.js
```
