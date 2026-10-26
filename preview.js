import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';

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
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 20, 0);
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(50, 100, 50);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  const grid = new THREE.GridHelper(200, 20, 0x45a29e, 0x1f2833);
  scene.add(grid);

  const state = { scene, camera, renderer, controls, currentMesh: null };

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
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
