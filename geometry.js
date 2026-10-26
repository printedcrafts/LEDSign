import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { LED_PROFILES } from './ledProfiles.js';
import { getTextPath } from './font.js';

export function createSignGeometry(options) {
  const group = new THREE.Group();
  const font = options.fontObject;

  if (!font || !options.text || options.text.trim().length === 0) {
    console.warn("No font loaded or empty text");
    return group;
  }

  // 1. TEXT → PATH COMMANDS
  const commands = getTextPath(font, options.text, 80);

  // 2. BUILD SHAPE FROM PATH (BACKING PLATE)
  const shape = new THREE.Shape();
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  commands.forEach(cmd => {
    const x = cmd.x ?? cmd.x1 ?? cmd.x2;
    const y = cmd.y ?? cmd.y1 ?? cmd.y2;
    if (x !== undefined && y !== undefined) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, -y);
      maxY = Math.max(maxY, -y);
    }

    if (cmd.type === "M") {
      shape.moveTo(cmd.x, -cmd.y);
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

  const width = maxX - minX;
  const height = maxY - minY;

  const extrudeSettings = {
    depth: options.backingThickness,
    bevelEnabled: false
  };

  const backingGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const backingMat = new THREE.MeshStandardMaterial({ color: 0x1f2833 });
  const backing = new THREE.Mesh(backingGeom, backingMat);
  backing.position.z = 0;
  group.add(backing);

  // 3. SMOOTH NEON TUBE ALONG TEXT PATH WITH BEND RADIUS CHECK
  const profile = LED_PROFILES[options.ledProfile] || LED_PROFILES["WS2812B"];
  const tubeRadius = profile.tubeDiameter / 2;
  const minBendRadius = profile.bendRadius || 12;

  const points = [];
  commands.forEach(cmd => {
    if (cmd.type === "M" || cmd.type === "L") {
      points.push(new THREE.Vector3(cmd.x, -cmd.y, options.backingThickness + tubeRadius));
    } else if (cmd.type === "C") {
      for (let t = 0; t <= 1; t += 0.1) {
        const x = cubicBezier(cmd.x1, cmd.x2, cmd.x, t);
        const y = cubicBezier(-cmd.y1, -cmd.y2, -cmd.y, t);
        points.push(new THREE.Vector3(x, y, options.backingThickness + tubeRadius));
      }
    } else if (cmd.type === "Q") {
      for (let t = 0; t <= 1; t += 0.1) {
        const x = quadraticBezier(cmd.x1, cmd.x, t);
        const y = quadraticBezier(-cmd.y1, -cmd.y, t);
        points.push(new THREE.Vector3(x, y, options.backingThickness + tubeRadius));
      }
    }
  });

  // Enforce minimum bend radius (simple curvature check)
  const safePoints = enforceMinimumBendRadius(points, minBendRadius);

  if (safePoints.length > 1) {
    const curve = new THREE.CatmullRomCurve3(safePoints, false, 'centripetal');
    const tubeGeom = new THREE.TubeGeometry(curve, 300, tubeRadius, 24, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x66fcf1,
      emissive: 0x66fcf1,
      emissiveIntensity: 2.5,
      metalness: 0.0,
      roughness: 0.2
    });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    group.add(tube);
  } else {
    console.warn("Tube path too short or invalid after bend-radius enforcement.");
  }

  // 4. MOUNTING FEATURES

  // 4a. Holes for hanging
  if (options.holesEnabled) {
    const holeRadius = options.holeDiameter / 2;
    const holeOffset = options.holeOffset;

    const holePositions = [
      new THREE.Vector3(minX + holeOffset, maxY - holeOffset, options.backingThickness / 2),
      new THREE.Vector3(maxX - holeOffset, maxY - holeOffset, options.backingThickness / 2)
    ];

    holePositions.forEach(pos => {
      const holeGeom = new THREE.CylinderGeometry(holeRadius, holeRadius, options.backingThickness, 16);
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const hole = new THREE.Mesh(holeGeom, holeMat);
      hole.rotation.x = Math.PI / 2;
      hole.position.copy(pos);
      group.add(hole);
    });
