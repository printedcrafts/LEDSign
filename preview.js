import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/UnrealBloomPass.js';

export function initPreview(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0c10);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 60, 120);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 20, 0);
  controls.update();

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(50, 100, 50);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // Grid
  const grid = new THREE.GridHelper(200, 20, 0x45a29e, 0x1f2833);
  scene.add(grid);

  // BLOOM EFFECT
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    1.2,   // strength
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);

  const state = { scene, camera, renderer, composer, controls, currentMesh: null };

  function animate() {
    requestAnimationFrame(animate);
    composer.render();
  }
  animate();

  return state;
}

export function updatePreview(preview, mesh) {
  const { scene, currentMesh } = preview;
  if (currentMesh) scene.remove(currentMesh);
  if (mesh) {
    scene.add(mesh);
    preview.currentMesh = mesh;
  }
}
