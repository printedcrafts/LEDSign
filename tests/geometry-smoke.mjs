import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function extract(start,end){const i=app.indexOf(start),j=app.indexOf(end,i);assert.ok(i>=0&&j>i,'could not find '+start);return app.slice(i,j);}
const geometry=new Function(extract('function edgePoints(','function shapeFromPoints(')+'return {edgePoints,panelOutline};')();
const {edgePoints,panelOutline}=geometry;
const close=(a,b,eps=1e-5)=>Math.hypot(a[0]-b[0],a[1]-b[1])<eps;
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function intersects(a,b,c,d){const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);const a1=cross(a,b,c),a2=cross(a,b,d),b1=cross(c,d,a),b2=cross(c,d,b);return a1*a2 < -1e-8 && b1*b2 < -1e-8;}
function simple(p){for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(close(a,b))return false;for(let j=i+1;j<p.length;j++){if(j===i||j===(i+1)%p.length||i===(j+1)%p.length)continue;if(intersects(a,b,p[j],p[(j+1)%p.length]))return false;}}return true;}
let tested=0;
for(const joint of ['dovetail','puzzle','none']){
 const L=edgePoints([200,0],[200,150],[1,0],joint!=='none','male',joint,7,24);
 const R=edgePoints([0,150],[0,0],[-1,0],joint!=='none','female',joint,7,24).map(p=>[p[0]+200,p[1]]);
 assert.equal(L.length,R.length,joint+' edge count mismatch');
 assert.ok(L.every((p,i)=>close(p,R[R.length-1-i])),joint+' horizontal mating profiles mismatch');
 const top=edgePoints([0,150],[200,150],[0,1],joint!=='none','male',joint,7,24);
 const bottom=edgePoints([200,0],[0,0],[0,-1],joint!=='none','female',joint,7,24).map(p=>[p[0],p[1]+150]);
 assert.equal(top.length,bottom.length,joint+' vertical edge count mismatch');
 assert.ok(top.every((p,i)=>close(p,bottom[bottom.length-1-i])),joint+' vertical mating profiles mismatch');
 for(const style of ['rounded','square'])for(const [cols,rows] of [[1,1],[2,1],[1,2],[2,2],[3,2]])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const p=panelOutline(col,row,cols,rows,220,160,style,joint,7,24,9);
  assert.ok(p.length>=4,'too few points for '+style+'/'+joint);
  assert.ok(p.every(v=>Number.isFinite(v[0])&&Number.isFinite(v[1])),'nonfinite vertex');
  assert.ok(p.every((v,i)=>!close(v,p[(i+1)%p.length])),'duplicate neighbor/close vertex for '+style+'/'+joint);
  assert.ok(Math.abs(area(p))>100,'near-zero area for '+style+'/'+joint);
  assert.ok(simple(p),'self-intersecting outline for '+style+'/'+joint);
  tested++;
 }
}
assert.ok(app.includes('function unionCenterlineChannelsByLetter'));
assert.ok(app.includes("artCenterX=(b.minX+b.maxX)/2"));
assert.ok(app.includes("font.charToGlyph(ch)"));
assert.ok(app.includes("function beginLetterPointer"));
assert.ok(app.includes("function alignSelectedLetters"));
assert.ok(app.includes("g.translate(0,0,-thickness-.01)"));
assert.ok(app.includes("function addRearWireRoutes"));
console.log('LEDSign geometry smoke tests passed:',tested,'panel outlines plus horizontal/vertical mating profiles for dovetail, puzzle and flat seams.');
