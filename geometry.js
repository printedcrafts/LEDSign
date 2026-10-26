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

  // 3. SMOOTH NEON TUBE ALONG TEXT PATH
  const profile = LED_PROFILES[options.ledProfile] || LED_PROFILES["WS2812B"];
  const tubeRadius = profile.tubeDiameter / 2;

  const points = [];
  commands.forEach(cmd => {
    if (cmd.type === "M" || cmd.type === "L") {
      points.push(new THREE.Vector3(cmd.x, -cmd.y, options.backingThickness + tubeRadius));
    } else if (cmd.type === "C") {
      // sample cubic bezier
      for (let t = 0; t <= 1; t += 0.1) {
        const x = cubicBezier(cmd.x1, cmd.x2, cmd.x, t);
        const y = cubicBezier(-cmd.y1, -cmd.y2, -cmd.y, t);
        points.push(new THREE.Vector3(x, y, options.backingThickness + tubeRadius));
      }
    } else if (cmd.type === "Q") {
      // sample quadratic bezier
      for (let t = 0; t <= 1; t += 0.1) {
        const x = quadraticBezier(cmd.x1, cmd.x, t);
        const y = quadraticBezier(-cmd.y1, -cmd.y, t);
        points.push(new THREE.Vector3(x, y, options.backingThickness + tubeRadius));
      }
    }
  });

  if (points.length > 1) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
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
  }

  // 4. MOUNTING FEATURES

  // 4a. Holes for hanging (simple visual cylinders)
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
  }

  // 4b. Rear posts
  if (options.postsEnabled) {
    const postRadius = 3;
    const postLength = options.postLength;

    const postPositions = [
      new THREE.Vector3(minX + width * 0.25, minY + height * 0.25, -postLength / 2),
      new THREE.Vector3(maxX - width * 0.25, minY + height * 0.25, -postLength / 2)
    ];

    postPositions.forEach(pos => {
      const postGeom = new THREE.CylinderGeometry(postRadius, postRadius, postLength, 16);
      const postMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const post = new THREE.Mesh(postGeom, postMat);
      post.rotation.x = Math.PI / 2;
      post.position.copy(pos);
      group.add(post);
    });
  }

  // 4c. Slat wall mounts (simple clips along top edge)
  if (options.slatEnabled) {
    const clipWidth = 10;
    const clipHeight = 5;
    const clipDepth = 5;

    const clipPositions = [
      new THREE.Vector3(minX + width * 0.33, maxY + clipHeight / 2, options.backingThickness / 2),
      new THREE.Vector3(minX + width * 0.66, maxY + clipHeight / 2, options.backingThickness / 2)
    ];

    clipPositions.forEach(pos => {
      const clipGeom = new THREE.BoxGeometry(clipWidth, clipHeight, clipDepth);
      const clipMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
      const clip = new THREE.Mesh(clipGeom, clipMat);
      clip.position.copy(pos);
      group.add(clip);
    });
  }

  return group;
}

// Helper functions for bezier sampling
function cubicBezier(p1, p2, p3, t) {
  // simple approximation: treat as 3-point curve
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return a * p1 + b * p2 + c * p3;
}

function quadraticBezier(p1, p2, t) {
  const a = (1 - t);
  const b = t;
  return a * p1 + b * p2;
}
