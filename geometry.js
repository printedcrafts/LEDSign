/** Dependency-free generation of exposed faces for an extruded raster mask.
 * All coordinates are millimeters. Front and back faces are triangulated on
 * a regular grid; side faces are emitted only at visible bitmap boundaries.
 */
export function buildMesh(mask, cols, rows, pixelMM, letterDepth, plate) {
  if (!mask || mask.length !== cols * rows || cols <= 0 || rows <= 0) throw new Error('Invalid text raster.');
  const padCells = plate.enabled ? Math.max(1, Math.ceil(plate.padding / pixelMM)) : 0;
  const w = cols + padCells * 2, h = rows + padCells * 2;
  const offsetX = -w * pixelMM / 2, offsetY = -h * pixelMM / 2;
  const plateHeight = plate.enabled ? plate.thickness : 0;
  const zmax = plateHeight + letterDepth;
  const vertices = [];
  const normals = [];
  const quads = [];
  const occupied = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && !!mask[y * cols + x];
  function face(a, b, c, d, normal) {
    const idx = vertices.length / 3;
    for (const v of [a,b,c,a,c,d]) { vertices.push(...v); normals.push(...normal); }
    // A quad is also retained for fast shaded Canvas preview.
    quads.push({ corners:[a,b,c,d], normal });
    return idx;
  }
  const coordX = x => offsetX + x * pixelMM;
  const coordY = y => offsetY + (h - y) * pixelMM;
  function emitCell(x, y, z0, z1, top, bottom, neighbors) {
    const x0=coordX(x),x1=coordX(x+1),y1=coordY(y),y0=coordY(y+1);
    if(top) face([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]);
    if(bottom) face([x0,y1,z0],[x1,y1,z0],[x1,y0,z0],[x0,y0,z0],[0,0,-1]);
    if(!neighbors.left) face([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0]);
    if(!neighbors.right) face([x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[x1,y0,z0],[1,0,0]);
    if(!neighbors.top) face([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[0,1,0]);
    if(!neighbors.bottom) face([x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y0,z0],[0,-1,0]);
  }
  // Solid underlying plate, with text rising continuously from its upper face.
  if (plate.enabled) for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const ink = occupied(x-padCells,y-padCells);
    emitCell(x,y,0,plateHeight,!ink,true,{left:x>0,right:x<w-1,top:y>0,bottom:y<h-1});
  }
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(occupied(x,y)) {
    const pX=x+padCells,pY=y+padCells;
    emitCell(pX,pY,plateHeight,zmax,true,!plate.enabled,{
      left:occupied(x-1,y),right:occupied(x+1,y),top:occupied(x,y-1),bottom:occupied(x,y+1)
    });
  }
  if(vertices.length===0) throw new Error('No geometry was generated.');
  return {vertices:new Float32Array(vertices),normals:new Float32Array(normals),quads,width:w*pixelMM,height:h*pixelMM,depth:zmax,triangles:vertices.length/9};
}
export function exportBinarySTL(mesh) {
  const {vertices,normals}=mesh, triangles=vertices.length/9;
  const buffer=new ArrayBuffer(84+triangles*50),view=new DataView(buffer);
  const label=new TextEncoder().encode('LEDSign 3D generated model');
  new Uint8Array(buffer,0,label.length).set(label);
  view.setUint32(80,triangles,true);
  let at=84;
  for(let i=0;i<triangles;i++) {
    for(let j=0;j<3;j++,at+=4)view.setFloat32(at,normals[i*9+j],true);
    for(let j=0;j<9;j++,at+=4)view.setFloat32(at,vertices[i*9+j],true);
    view.setUint16(at,0,true);at+=2;
  }
  return new Blob([buffer],{type:'model/stl'});
}
export function exportOBJ(mesh) {
  const {vertices,normals}=mesh;
  const lines=['# LEDSign 3D model, units: millimeters','o LEDSign'];
  for(let i=0;i<vertices.length;i+=3)lines.push(`v ${vertices[i]} ${vertices[i+1]} ${vertices[i+2]}`);
  for(let i=0;i<normals.length;i+=9)lines.push(`vn ${normals[i]} ${normals[i+1]} ${normals[i+2]}`);
  for(let i=0;i<vertices.length/3;i+=3){const n=i/3+1;lines.push(`f ${i+1}//${n} ${i+2}//${n} ${i+3}//${n}`);}
  return new Blob([lines.join('\n')+'\n'],{type:'text/plain'});
}
