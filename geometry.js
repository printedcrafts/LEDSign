import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { LED_PROFILES } from './ledProfiles.js';

export function createSignGeometry(options) {
  const group = new THREE.Group();

  const backingWidth = Math.max(80, (options.text?.length || 1) * 12);
  const backingHeight = 40;
  const backingGeom = new THREE.BoxGeometry(
    backingWidth,
    options.backingThickness,
    backingHeight
  );
  const backingMat = new THREE.MeshStandardMaterial({ color: 0x1f2833 });
  const backing = new THREE.Mesh(backingGeom, backingMat);
  backing.position.set(0, options.backingThickness / 2, 0);
  group.add(backing);

const profile = LED_PROFILES[options.ledProfile] || LED_PROFILES["WS2812B"];
const tubeRadius = profile.tubeDiameter / 2;

  const tubeGeom = new THREE.CylinderGeometry(
    tubeRadius,
    tubeRadius,
    backingWidth * 0.8,
    32
  );
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x66fcf1,
    metalness: 0.1,
    roughness: 0.4,
  });
  const tube = new THREE.Mesh(tubeGeom, tubeMat);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(0, options.backingThickness + tubeRadius, 0);
  group.add(tube);

  group.position.set(0, 0, 0);
  return group;
}
