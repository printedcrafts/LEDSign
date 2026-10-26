import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';

export function initPreview(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0c10);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 60, 120);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const state = { scene, camera, renderer, controls, currentMesh: null };

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  return state;
}

export function updatePreview(preview, mesh) {
  if (preview.currentMesh) preview.scene.remove(preview.currentMesh);
  preview.scene.add(mesh);
  preview.currentMesh = mesh;
}
