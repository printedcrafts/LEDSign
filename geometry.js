import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { LED_PROFILES } from './ledProfiles.js';
import { getTextPath } from './font.js';

export function createSignGeometry(options) {
  const group = new THREE.Group();
  const font = options.fontObject;

  if (!font || !options.text) {
    return group;
  }

  // Convert text to vector path commands
  const commands = getTextPath(font, options.text, 80);

  // Convert commands to Three.js Shape
  const shape = new THREE.Shape();
  let first = true;

  commands.forEach(cmd => {
    if (cmd.type === "M") {
      shape.moveTo(cmd.x, -cmd.y);
      first = false;
    } else if (cmd.type === "L") {
      shape.lineTo(cmd.x, -cmd.y);
    } else if (cmd.type === "C") {
      shape.bezierCurveTo(cmd.x1, -cmd.y1, cmd.x2, -cmd.y2, cmd.x, -cmd.y);
    } else if (cmd.type === "Q") {
      shape.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y);
    } else if (cmd.type === "Z") {
      shape.closePath();
    }
  });

  // Backing plate
  const extrudeSettings = {
    depth: options.backingThickness,
    bevelEnabled: false
  };

  const backingGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const backingMat = new THREE.MeshStandardMaterial({ color: 0x1f2833 });
  const backing = new THREE.Mesh(backingGeom, backingMat);
  group.add(backing);

  // LED tube geometry
  const profile = LED_PROFILES[options.ledProfile] || LED_PROFILES["WS2812B"];
  const tubeRadius = profile.tubeDiameter / 2;

  const tubePath = new THREE.CurvePath();

  commands.forEach(cmd => {
    if (cmd.type === "L") {
      const start = new THREE.Vector3(cmd.x, -cmd.y, options.backingThickness + tubeRadius);
      const end = new THREE.Vector3(cmd.x, -cmd.y, options.backingThickness + tubeRadius);
      tubePath.add(new THREE.LineCurve3(start, end));
    }
  });

  const tubeGeom = new THREE.TubeGeometry(tubePath, 200, tubeRadius, 16, false);
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x66fcf1 });
  const tube = new THREE.Mesh(tubeGeom, tubeMat);
  group.add(tube);

  return group;
}
