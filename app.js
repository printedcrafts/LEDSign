import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

const $ = (id) => document.getElementById(id);
const viewport = $('previewContainer');
const status = $('status');
const profiles = {
  WS2812B: '5 V addressable strip; verify actual strip width and power requirements before designing channels.',
  WS2813: '5 V addressable strip with backup data; check actual strip dimensions.',
  SK6812: '5 V addressable strip; RGBW variants may have different power requirements.',
  WS2815: '12 V addressable strip; check wiring and power supply requirements.'
};
let renderer, scene, camera, controls, model = null;
let customFont = null;
let busy = false;
const material = new THREE.MeshStandardMaterial({ color: 0x64dcc4, metalness: .18, roughness: .46, side: THREE.DoubleSide });

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}
function getFont() {
  switch ($('fontSelect').value) {
    case 'serif': return '700 130px Georgia, "Times New Roman", serif';
    case 'mono': return '700 130px "Courier New", monospace';
    case 'script': return 'italic 700 130px "Brush Script MT", "Segoe Script", cursive';
    case 'custom':
      if (!customFont) throw new Error('Please upload a font before selecting Uploaded font.');
      return '130px "LEDSignCustom"';
    default: return '700 130px Arial, Helvetica, sans-serif';
  }
}
function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);
  camera = new THREE.PerspectiveCamera(45, 1, .1, 5000);
  camera.position.set(120, -150, 225);
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x253247, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(100, -80, 230);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x65d8ff, 1.5);
  rim.position.set(-140, 100, 100);
  scene.add(rim);
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.replaceChildren(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 25;
  controls.maxDistance = 1500;
  controls.target.set(0, 0, 0);
  const resize = () => {
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  new ResizeObserver(resize).observe(viewport);
  resize();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
}
function clearModel() {
  if (!model) return;
  scene.remove(model);
  model.traverse(child => { if (child.isMesh) child.geometry.dispose(); });
  model = null;
  $('downloadStl').disabled = $('downloadObj').disabled = true;
}
function createTextModel() {
  const input = $('textInput').value.trim();
  if (!input) throw new Error('Enter some text first.');
  const font = getFont();
  const widthMM = Number($('signWidth').value);
  const depth = Number($('thickness').value);
  if (!Number.isFinite(widthMM) || !Number.isFinite(depth)) throw new Error('Invalid model dimensions.');

  // Render the browser-supported font to a mask, then turn filled horizontal
  // runs into watertight prisms. No proprietary font files are distributed.
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const metrics = measure.measureText(input);
  const naturalWidth = Math.ceil(metrics.width + 20);
  const rawWidth = Math.max(1, naturalWidth);
  const rawHeight = 180;
  // Bound generation cost for long text while preserving proportions.
  const scale = Math.min(1, 1100 / rawWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.ceil(rawWidth * scale));
  canvas.height = Math.ceil(rawHeight * scale);
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font;
  ctx.fillText(input, 10, 135);
  const {width, height} = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 120) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error('The chosen font could not render this text.');
  const pxToMM = widthMM / (right - left + 1);
  const step = Math.max(1, Math.ceil(1 / pxToMM));
  const group = new THREE.Group();
  // Adjacent filled pixels are coalesced into one prism per horizontal run.
  // The selected resolution provides a usable block-style approximation.
  const geometryCache = new Map();
  let count = 0;
  for (let y = top; y <= bottom; y += step) {
    let x = left;
    while (x <= right) {
      const filled = (xx) => data[(y * width + xx) * 4 + 3] > 120;
      if (!filled(x)) { x += step; continue; }
      const start = x;
      while (x <= right && filled(x)) x += step;
      const end = Math.min(x, right + 1);
      const length = (end - start) * pxToMM;
      const rowHeight = Math.min(step, bottom - y + 1) * pxToMM;
      const cacheKey = `${length.toFixed(4)}:${rowHeight.toFixed(4)}`;
      let geometry = geometryCache.get(cacheKey);
      if (!geometry) {
        geometry = new THREE.BoxGeometry(length, rowHeight, depth);
        geometryCache.set(cacheKey, geometry);
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((start + (end - start) / 2 - (left + right + 1) / 2) * pxToMM,
        ((top + bottom + 1) / 2 - y - Math.min(step, bottom - y + 1) / 2) * pxToMM, depth / 2);
      group.add(mesh); count++;
      if (count > 12000) throw new Error('Text is too complex. Try fewer characters or a simpler font.');
    }
  }
  // Combining horizontal prisms produces an overlapping-surface mesh; STL/OBJ
  // export remains usable for many slicers, but isn't a unioned manifold solid.
  return {group, count, heightMM:(bottom-top+1)*pxToMM, widthMM, depth};
}
function frameModel(group) {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  const fov = camera.fov * Math.PI / 180;
  const fit = Math.max(size.y, size.x / Math.max(camera.aspect, .25));
  const distance = Math.max(75, fit / (2 * Math.tan(fov / 2)) * 1.6);
  camera.position.set(center.x + distance * .3, center.y - distance * .45, center.z + distance);
  camera.near = Math.max(.01, distance / 1000);
  camera.far = distance * 10 + 1000;
  camera.updateProjectionMatrix();
  controls.update();
}
function generate() {
  if (busy) return;
  busy = true;
  $('generateModel').disabled = true;
  setStatus('Generating model…');
  try {
    clearModel();
    const {group, count, heightMM, widthMM, depth} = createTextModel();
    model = group;
    scene.add(model);
    frameModel(model);
    $('downloadStl').disabled = $('downloadObj').disabled = false;
    $('modelDetails').textContent = `Approx. ${widthMM.toFixed(0)} × ${heightMM.toFixed(1)} × ${depth} mm · ${count.toLocaleString()} model segments · ${$('ledProfile').value}`;
    setStatus('Preview ready. Export STL or OBJ below. Inspect and repair the mesh in your slicer before printing.');
  } catch (error) {
    setStatus(error.message || 'Model generation failed.', true);
    $('modelDetails').textContent = 'No model generated.';
  } finally { busy = false; $('generateModel').disabled = false; }
}
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function exportModel(type) {
  if (!model) { setStatus('Generate a model before exporting.', true); return; }
  try {
    model.updateMatrixWorld(true);
    const slug = ($('textInput').value.trim().replace(/[^a-z0-9_-]+/gi, '_').slice(0, 36) || 'ledsign');
    if (type === 'stl') {
      const data = new STLExporter().parse(model, {binary:true});
      download(data, `${slug}.stl`, 'model/stl');
    } else {
      download(new OBJExporter().parse(model), `${slug}.obj`, 'text/plain');
    }
    setStatus(`${type.toUpperCase()} export started. Review mesh integrity in your slicer before printing.`);
  } catch (error) { setStatus(`Export failed: ${error.message}`, true); }
}
$('ledProfile').addEventListener('change', () => { $('ledInfo').textContent = profiles[$('ledProfile').value]; });
$('ledInfo').textContent = profiles[$('ledProfile').value];
for (const [control, output, suffix] of [['signWidth','widthValue',' mm'], ['thickness','depthValue',' mm']]) {
  $(control).addEventListener('input', () => { $(output).textContent = $(control).value + suffix; });
}
$('fontUpload').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
    setStatus('Choose a TTF, OTF, WOFF, or WOFF2 font under 10 MB.', true); return;
  }
  try {
    const font = new FontFace('LEDSignCustom', await file.arrayBuffer());
    await font.load();
    if (customFont) document.fonts.delete(customFont);
    document.fonts.add(font);
    customFont = font;
    $('fontSelect').value = 'custom';
    setStatus(`Loaded ${file.name}. Select Generate 3D model.`);
  } catch (error) { setStatus(`Could not load font: ${error.message}`, true); }
});
$('generateModel').addEventListener('click', generate);
$('downloadStl').addEventListener('click', () => exportModel('stl'));
$('downloadObj').addEventListener('click', () => exportModel('obj'));
try { setupScene(); generate(); }
catch (error) { viewport.textContent = '3D preview unavailable.'; setStatus(`Could not start 3D preview: ${error.message}`, true); }
