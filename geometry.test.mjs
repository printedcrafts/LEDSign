import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMesh,exportBinarySTL,exportOBJ} from '../src/geometry.js';
test('single cell makes a closed cube with 12 triangles',()=>{const m=buildMesh(new Uint8Array([1]),1,1,2,4,{enabled:false});assert.equal(m.triangles,12);assert.equal(m.width,2);assert.equal(m.depth,4);});
test('adjacent pixels omit internal faces',()=>{const m=buildMesh(new Uint8Array([1,1]),2,1,2,4,{enabled:false});assert.equal(m.triangles,20);});
test('backing connects text and has expected height',()=>{const m=buildMesh(new Uint8Array([1]),1,1,2,4,{enabled:true,padding:2,thickness:3});assert.equal(m.width,6);assert.equal(m.depth,7);assert.ok(m.triangles>12);});
test('STL binary triangle count and length match',async()=>{const m=buildMesh(new Uint8Array([1]),1,1,2,4,{enabled:false});const b=await exportBinarySTL(m).arrayBuffer();assert.equal(b.byteLength,84+12*50);assert.equal(new DataView(b).getUint32(80,true),12);});
test('OBJ contains correct face count',async()=>{const m=buildMesh(new Uint8Array([1]),1,1,2,4,{enabled:false});const s=await exportOBJ(m).text();assert.equal(s.split('\n').filter(l=>l.startsWith('f ')).length,12);});
