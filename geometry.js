import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { LED_PROFILES } from './ledProfiles.js';
import { getTextPath } from './font.js';

export function createSignGeometry(options) {
  const group = new THREE.Group();
  const font = options.fontObject;

  if (!font || !options.text) return group;

  const commands = getTextPath(font, options.text, 80);

  const shape = new THREE.Shape();
  commands.forEach(cmd => {
    if (cmd.type === "M") shape.moveTo(cmd.x, -cmd.y);
    else if (cmd.type === "L") shape.lineTo(cmd.x, -cmd.y);
    else if (cmd.type === "C")
      shape.bezierCurveTo(cmd.x1, -cmd.y1, cmd.x2, -cmd.y2, cmd.x, -cmd.y);
    else if (cmd.type === "Q")
      shape.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y);
  });

  const backingGeom = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
  const backing = new THREE.Mesh(backingGeom, new THREE.MeshStandardMaterial({ color: 0x1f2833 }));
  group.add(backing);

  const tubeRadius = LED_PROFILES[options.ledProfile].tubeDiameter / 2;

  const points = commands
    .filter(c => c.x !== undefined && c.y !== undefined)
    .map(c => new THREE.Vector3(c.x, -c.y, 6));

  if (points.length > 1) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 200, tubeRadius, 16, false);
    const tube = new THREE.Mesh(tubeGeom, new THREE.MeshStandardMaterial({ color: 0x66fcf1 }));
    group.add(tube);
  }

  return group;
}
