import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function extract(start,end){const i=app.indexOf(start),j=app.indexOf(end,i);assert.ok(i>=0&&j>i,'could not find '+start);return app.slice(i,j);}
const geometry=new Function(extract('function edgePoints(','function shapeFromPoints(')+'return {edgePoints,panelOutline,backplaneSilhouette,silhouetteTileOutline,fitSilhouette};')();
const skeletonNeighbors=new Function(extract('function skeletonNeighbors(','function normalizeSvg(')+'return skeletonNeighbors;')();
const {edgePoints,panelOutline,backplaneSilhouette,silhouetteTileOutline,fitSilhouette}=geometry;
const cleanSkeleton=new Function(extract('function skeletonNeighbors(','function normalizeSvg(')+'return cleanSkeleton;')();
const {hull,roundOffsetConvex}=new Function(extract('function hull(','function edgePoints(')+'return {hull,roundOffsetConvex};')();
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

// Assert the edges emitted by full neighboring tile outlines—not just edgePoints in isolation—mate in both grid directions.
function pointsOnVerticalSeam(poly,xMin=199.999,xMax=208.001){return poly.filter(p=>p[1]>10&&p[1]<140&&p[0]>=xMin&&p[0]<=xMax);}
function pointsOnHorizontalSeam(poly,yMin=149.999,yMax=158.001){return poly.filter(p=>p[0]>10&&p[0]<210&&p[1]>=yMin&&p[1]<=yMax);}
for(const joint of ['dovetail','puzzle','none']){
 for(const style of ['rounded','square']){
  const left=panelOutline(0,0,2,1,200,150,style,joint,7,24,9);
  const right=panelOutline(1,0,2,1,200,150,style,joint,7,24,9).map(p=>[p[0]+200,p[1]]);
  const ls=pointsOnVerticalSeam(left),rs=pointsOnVerticalSeam(right);
  assert.equal(ls.length,rs.length,joint+'/'+style+' left-right seam vertex count mismatch');
  assert.ok(ls.every((p,i)=>close(p,rs[rs.length-1-i])),joint+'/'+style+' left-right tile seam mismatch');
  const top=panelOutline(0,0,1,2,220,150,style,joint,7,24,9);
  const bottom=panelOutline(0,1,1,2,220,150,style,joint,7,24,9).map(p=>[p[0],p[1]+150]);
  const ts=pointsOnHorizontalSeam(top,149.999,158.001),bs=pointsOnHorizontalSeam(bottom,149.999,158.001);
  assert.equal(ts.length,bs.length,joint+'/'+style+' top-bottom seam vertex count mismatch');
  assert.ok(ts.every((p,i)=>close(p,bs[bs.length-1-i])),joint+'/'+style+' top-bottom tile seam mismatch');
  tested+=2;
 }
}

assert.ok(app.includes('function channelGeometry'),'line-mode channels must be built from 2D offset bands so joints stay open');
assert.ok(app.includes("artCenterX=(b.minX+b.maxX)/2"));
assert.ok(app.includes("font.charToGlyph(ch)"));
assert.ok(app.includes("function beginLetterPointer"));
assert.ok(app.includes("function alignSelectedLetters"));
assert.ok(app.includes("g.translate(0,0,-thickness-.01)"));
assert.ok(app.includes("function addRearWireRoutes"));
assert.ok(app.includes("wireChannelCutter(route,thick)"),"drawn routes must be cut into backplane tiles");
assert.ok(app.includes("new THREE.Path();hole.absarc(h.x-x0,h.y-y0,3.2"),"eyelet holes should be built directly into tile extrusion to preserve preview generation");
assert.ok(app.includes("function eyeletHoleCutter"),"eyelet openings must be subtracted through the backplane");
assert.ok(app.includes("performance.now()-eyeletDragEnd<350"),"moving eyelets must not create accidental rear-wire points");
assert.ok(app.includes("function addTileIdPreview"),"recessed tile IDs must be visible on the rear preview");
assert.ok(app.includes("function refreshRearGhost"),"rear wiring mode must show ghosted lettering and channels");
assert.ok(app.includes("userData:{kind:'mount',mountType:'eyelet',eyeletIndex}"),"eyelets must retain independent identity for drag editing");
assert.ok(app.includes("function dimensionMm"),"target width/height input-unit conversion must be available");
assert.ok(app.includes("function rescaleSourceToTarget"),"changing overall size must rescale existing artwork paths");
assert.ok(app.includes("lineSpacing"),"multiline typography must use line spacing");
assert.ok(app.includes("backplaneSilhouette(style"),"silhouette styles must reach backplane generation");

for(const style of ['ellipse','shield','hexagon']){
 for(const [cols,rows] of [[1,1],[2,1],[1,2],[2,2],[3,2]]){
  const totalW=440,totalH=320,tw=totalW/cols,th=totalH/rows,H=backplaneSilhouette(style,0,0,totalW,totalH);
  assert.ok(H.length>=6,style+' silhouette should contain a polygon');
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x0=-totalW/2+col*tw,y0=-totalH/2+row*th;
   const local=silhouetteTileOutline(H,[x0,y0,x0+tw,y0+th],col,row,cols,rows,tw,th,'dovetail',7,24);
   if(local.length<3)continue;
   const p=local.map(v=>[v[0]+x0,v[1]+y0]),ar=area(p);
   assert.ok(p.length>=4,style+' tile should have >=4 vertices');
   assert.ok(p.every(v=>Number.isFinite(v[0])&&Number.isFinite(v[1])),style+' tile should have finite vertices');
   assert.ok(p.every((v,i)=>!close(v,p[(i+1)%p.length])),style+' tile should not have duplicate adjacent vertices');
   assert.ok(Math.abs(ar)>10,style+' tile should have nonzero polygon area');
   assert.ok(simple(p),style+' tile outline should not self-intersect');
   tested++;
  }
 }
}

function samePointMultiset(a,b){if(a.length!==b.length)return false;const remaining=b.map(p=>p.slice());for(const p of a){const i=remaining.findIndex(q=>close(p,q));if(i<0)return false;remaining.splice(i,1);}return remaining.length===0;}
for(const style of ['ellipse','shield','hexagon'])for(const joint of ['dovetail','puzzle','none'])for(const [cols,rows] of [[2,1],[1,2],[2,2],[3,2]]){
 const totalW=440,totalH=320,tw=totalW/cols,th=totalH/rows,H=backplaneSilhouette(style,0,0,totalW,totalH),tiles=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x0=-totalW/2+col*tw,y0=-totalH/2+row*th,local=silhouetteTileOutline(H,[x0,y0,x0+tw,y0+th],col,row,cols,rows,tw,th,joint,7,24);tiles.push({col,row,x0,y0,tw,th,p:local.map(v=>[v[0]+x0,v[1]+y0])});}
 const xOffsets=joint==='puzzle'?[0,3.15,7]:joint==='none'?[0]:[0,7],yOffsets=xOffsets;
 for(let row=0;row<rows;row++)for(let col=0;col<cols-1;col++){
  const left=tiles.find(t=>t.col===col&&t.row===row),right=tiles.find(t=>t.col===col+1&&t.row===row),x=left.x0+left.tw,y1=left.y0+1,y2=left.y0+left.th-1;
  const inProfile=xv=>xOffsets.some(d=>Math.abs(xv-(x+d))<1e-5);
  const l=left.p.filter(p=>inProfile(p[0])&&p[1]>y1&&p[1]<y2),r=right.p.filter(p=>inProfile(p[0])&&p[1]>y1&&p[1]<y2);
  assert.ok(samePointMultiset(l,r),style+'/'+joint+' vertical silhouette seam does not mate ('+cols+'x'+rows+')');tested++;
 }
 for(let row=0;row<rows-1;row++)for(let col=0;col<cols;col++){
  const top=tiles.find(t=>t.col===col&&t.row===row),bottom=tiles.find(t=>t.col===col&&t.row===row+1),y=top.y0+top.th,x1=top.x0+1,x2=top.x0+top.tw-1;
  const inProfile=yv=>yOffsets.some(d=>Math.abs(yv-(y+d))<1e-5);
  const t=top.p.filter(p=>inProfile(p[1])&&p[0]>x1&&p[0]<x2),b=bottom.p.filter(p=>inProfile(p[1])&&p[0]>x1&&p[0]<x2);
  assert.ok(samePointMultiset(t,b),style+'/'+joint+' horizontal silhouette seam does not mate ('+cols+'x'+rows+')');tested++;
 }
}

// Tile corners: only true outer corners may be rounded. Seam corners must stay square, or tiles get slanted edges and the plate is not symmetric.
for(const style of ['rounded','square'])for(const joint of ['dovetail','none'])for(const [cols,rows] of [[2,1],[1,2],[2,2],[3,2]])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
 const w=210,h=150,p=panelOutline(col,row,cols,rows,w,h,style,joint,7,24,9);
 for(const [x,y,outer] of [[0,0,row===0&&col===0],[w,0,row===0&&col===cols-1],[w,h,row===rows-1&&col===cols-1],[0,h,row===rows-1&&col===0]]){
  const sharp=p.some(v=>close(v,[x,y]));
  assert.equal(sharp,!(outer&&style==='rounded'),style+'/'+joint+' tile '+col+','+row+' corner '+x+','+y+(sharp?' should be rounded':' must be a square seam corner'));
 }
 tested++;
}
for(const style of ['rounded','square']){const L=panelOutline(0,0,2,1,200,150,style,'none',7,24,9),R=panelOutline(1,0,2,1,200,150,style,'none',7,24,9).map(v=>[200-v[0],v[1]]);assert.ok(samePointMultiset(L,R),style+' 2x1 tiles must be mirror images');tested++;}

// Contour plate keeps a constant margin; silhouette plates contain the artwork plus margin and stay mirror-symmetric about its centre.
const artPts=[[-120,-30],[110,-25],[120,35],[-40,60],[-115,42],[0,0],[60,10]].map(([x,y])=>({x,y})),H0=hull(artPts),ring=roundOffsetConvex(H0,24);
const segDist=(q,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dy);};
assert.ok(ring.every(q=>Math.abs(Math.min(...H0.map((a,i)=>segDist(q,a,H0[(i+1)%H0.length])))-24)<1e-6),'contour plate must keep the margin constant all the way around');
const bbox=pts=>({x0:Math.min(...pts.map(p=>p[0])),x1:Math.max(...pts.map(p=>p[0])),y0:Math.min(...pts.map(p=>p[1])),y1:Math.max(...pts.map(p=>p[1]))}),hb=bbox(H0),rb=bbox(ring);
assert.ok(Math.abs(hb.x0-rb.x0-24)<.05&&Math.abs(rb.x1-hb.x1-24)<.05&&Math.abs(hb.y0-rb.y0-24)<.05&&Math.abs(rb.y1-hb.y1-24)<.05,'contour margin must be equal on all four sides');
const insideConvex=(P,q)=>{const s=Math.sign(area(P));return P.every((a,i)=>{const b=P[(i+1)%P.length];return s*((b[0]-a[0])*(q[1]-a[1])-(b[1]-a[1])*(q[0]-a[0]))>=-1e-6;});};
for(const style of ['ellipse','shield','hexagon']){const c=[(hb.x0+hb.x1)/2,(hb.y0+hb.y1)/2],S=fitSilhouette(backplaneSilhouette(style,c[0],c[1],rb.x1-rb.x0,rb.y1-rb.y0),c,ring);
 assert.ok(ring.every(q=>insideConvex(S,q)),style+' plate must contain the artwork plus margin');
 assert.ok(samePointMultiset(S,S.map(v=>[2*c[0]-v[0],v[1]])),style+' plate must be mirror-symmetric about the artwork centre');tested+=2;}

// Skeleton cleanup: thinning spurs are pruned, straight strokes run through junctions, corners and loops stay one route.
const pix=(a,b)=>{const n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));return Array.from({length:n+1},(_,i)=>[Math.round(a[0]+(b[0]-a[0])*i/n),Math.round(a[1]+(b[1]-a[1])*i/n)]);},r8=()=>8;
// A short real arm (t crossbar) that reaches well past the junction circle must survive pruning.
let tRoutes=cleanSkeleton([pix([30,40],[30,5]),pix([30,40],[30,90]),pix([30,40],[12,40]),pix([30,40],[50,40])],()=>8);
assert.equal(tRoutes.length,2,'t crossbar arms must be kept and joined straight through the stem');
let routes=cleanSkeleton([pix([50,50],[50,10]),pix([50,50],[50,100]),pix([50,50],[90,50]),pix([50,100],[46,104]),pix([50,100],[54,104])],r8);
assert.equal(routes.length,2,'fork spurs must be pruned and the stem must run straight through the junction');
const stem=routes.find(r=>Math.abs(r.pts[0][0]-r.pts.at(-1)[0])<2),arm=routes.find(r=>r!==stem);
assert.ok(stem&&Math.abs(Math.abs(stem.pts[0][1]-stem.pts.at(-1)[1])-90)<1.5,'stem must keep its full length');
assert.ok(arm&&arm.pts.some(p=>Math.hypot(p[0]-50,p[1]-50)<1e-9),'arm must stay attached at the junction');
routes=cleanSkeleton([pix([20,80],[20,10]),pix([20,80],[80,80]),pix([20,80],[16,84])],r8);
assert.equal(routes.length,1,'corner spur must be pruned so an L is one continuous route');
assert.ok(routes[0].pts.every(p=>p.every(Number.isFinite)),'routes must be finite');
routes=cleanSkeleton([[...pix([10,10],[40,10]),...pix([40,10],[40,40]).slice(1),...pix([40,40],[10,40]).slice(1),...pix([10,40],[10,10]).slice(1)]],r8);
assert.ok(routes.length===1&&routes[0].closed,'a loop must stay one closed route');
tested+=3;

// Alignment and wire snapping helpers.
const {unionBox,alignDeltas}=new Function(extract('function unionBox(','function alignSelectedLetters(')+'return {unionBox,alignDeltas};')();
const Bx=(x0,x1,y0,y1)=>({minX:x0,maxX:x1,minY:y0,maxY:y1}),frame=Bx(0,100,0,50),one=[Bx(120,140,10,70)];
for(const [mode,want] of [['top',[0,-20]],['bottom',[0,-10]],['middle',[0,-15]],['left',[-120,0]],['right',[-40,0]],['center',[0,0]]])assert.deepEqual(alignDeltas(mode,one,frame)[0],want,mode+' alignment');
const uneven=[Bx(120,140,10,20),Bx(160,180,30,60)];assert.deepEqual(alignDeltas('center',uneven,frame),[[0,20],[0,-10]],'center must align each selected glyph on the selection centerline while preserving x positions');
assert.deepEqual(alignDeltas('slope45',[Bx(0,20,0,40),Bx(40,60,0,40),Bx(80,100,10,50)],null),[[0,0],[0,40],[0,70]],'45° incline must put letter centres on a rising 45° line from the leftmost letter');
assert.deepEqual(unionBox([Bx(0,1,2,3),Bx(-1,0,5,6)]),Bx(-1,1,2,6),'unionBox');
const {snapWirePoint}=new Function(extract('function snapWirePoint(','function refreshWireUI(')+'return {snapWirePoint};')();
const wireProfiles=new Function(extract('function wireChannelDimensions(','function wireChannelCutter(')+'return {wireChannelDimensions,wireGrooveProfile,wireGuardProfile};')();
const dims=wireProfiles.wireChannelDimensions(3),groove=wireProfiles.wireGrooveProfile(dims),guard=wireProfiles.wireGuardProfile(dims);
assert.ok(Math.abs((3-dims.depth)-.8)<1e-9,'rear channel must preserve at least 0.8 mm of front skin');
assert.ok(groove[0][0]===-3.5&&groove[1][0]===3.5,'dovetail groove mouth must match the configured opening width');
assert.ok(Math.abs(groove[2][0])>Math.abs(groove[1][0]),'dovetail groove must widen below the rear opening');
assert.ok(Math.abs(guard[0][0])>Math.abs(groove[0][0]),'guard cap must overlap the rear opening');
assert.ok(Math.abs(guard[4][0])<Math.abs(groove[2][0]),'guard dovetail head must fit inside the undercut cavity');
assert.ok(app.includes("function addWireChannelGuards"),"optional printable channel guards must be generated");
assert.ok(app.includes("function exportChannelGuardsSTL"),"channel guards need an independent STL export");
const snapped=snapWirePoint({x:0,y:0},{x:10,y:9});assert.ok(Math.abs(snapped.x-snapped.y)<1e-9&&Math.abs(Math.hypot(snapped.x,snapped.y)-Math.hypot(10,9))<1e-9,'Shift must snap a wire segment to 45° and keep its length');
assert.ok(app.includes('if(fitOnBuild){fitCamera();fitOnBuild=false;}'),'rebuilds must not re-fit the camera');
assert.ok(app.includes('function placeLineChannels'),'overlapping letters must be joined on every build');
tested+=10;

const diagonalOnly=Uint8Array.from([1,0,0,1]);
assert.deepEqual(skeletonNeighbors(diagonalOnly,2,2,0),[3],'isolated diagonal skeleton link should remain connected');
const redundantDiagonal=Uint8Array.from([1,1,0,1]);
assert.deepEqual(skeletonNeighbors(redundantDiagonal,2,2,0),[1],'redundant diagonal link should be suppressed');
assert.ok([...`0123456789`].every(d=>app.includes(`'${d}':[`)),'all numeric tile ID characters must have engraving stencils');
console.log('LEDSign geometry smoke tests passed:',tested,'panel, silhouette, connector and adjacent-tile seam cases.');
