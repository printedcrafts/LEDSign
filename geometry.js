// LEDSign: dependency-free, millimetre-grid geometry engine.
export const PROFILES = Object.freeze({
  neon6:{name:'6 mm top-bend neon flex',kind:'top',strip:6,stripDepth:12,clearance:.45,wall:2.0,floor:2.4,opening:'top',bend:30,voltage:'12/24 V (product dependent)'},
  neon8:{name:'8 mm top-bend neon flex',kind:'top',strip:8,stripDepth:16,clearance:.5,wall:2.2,floor:2.5,opening:'top',bend:40,voltage:'12/24 V (product dependent)'},
  neon10:{name:'10 mm top-bend neon flex',kind:'top',strip:10,stripDepth:20,clearance:.6,wall:2.5,floor:3,opening:'top',bend:50,voltage:'12/24 V (product dependent)'},
  side6:{name:'6 mm side-bend neon flex',kind:'side',strip:6,stripDepth:12,clearance:.5,wall:2.2,floor:2.4,opening:'side',bend:25,voltage:'12/24 V (product dependent)'},
  ws2812:{name:'WS2812B bare LED tape · 10 mm PCB',kind:'bare',strip:10,stripDepth:3,clearance:.6,wall:2,floor:2,opening:'top + diffuser recommended',bend:10,voltage:'5 V'},
  cob8:{name:'8 mm COB LED tape · no neon jacket',kind:'bare',strip:8,stripDepth:3,clearance:.6,wall:2,floor:2,opening:'top + diffuser recommended',bend:10,voltage:'product dependent'}
});
export function defaults(profileId){const p=PROFILES[profileId]||PROFILES.neon8;return {...p,inside:p.strip+2*p.clearance,outside:p.strip+2*p.clearance+2*p.wall,channelHeight:p.stripDepth+p.floor};}
export function createGrid(w,h,fill=0){return {w,h,data:new Uint8Array(w*h).fill(fill)};}
const idx=(g,x,y)=>y*g.w+x;
export function dilate(g,r){const out=createGrid(g.w,g.h), rad=Math.max(0,Math.ceil(r)), offsets=[];for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++)if(x*x+y*y<=r*r+.25)offsets.push([x,y]);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(g.data[idx(g,x,y)])for(const [dx,dy] of offsets){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<g.w&&yy<g.h)out.data[idx(g,xx,yy)]=1;}return out;}
export function skeletonize(input){const g=createGrid(input.w,input.h);g.data.set(input.data);const {w,h}=g;let changed=true,iterations=0;while(changed&&iterations++<150){changed=false;for(let phase=0;phase<2;phase++){const remove=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!g.data[i])continue;const n=[g.data[i-w],g.data[i-w+1],g.data[i+1],g.data[i+w+1],g.data[i+w],g.data[i+w-1],g.data[i-1],g.data[i-w-1]];const s=n.reduce((a,b)=>a+b,0);if(s<2||s>6)continue;let transitions=0;for(let k=0;k<8;k++)if(!n[k]&&n[(k+1)%8])transitions++;if(transitions!==1)continue;if(phase===0?(n[0]*n[2]*n[4]||n[2]*n[4]*n[6]):(n[0]*n[2]*n[6]||n[0]*n[4]*n[6]))continue;remove.push(i);}for(const i of remove)g.data[i]=0;if(remove.length)changed=true;}}return g;}
export function subtract(a,b){if(a.w!==b.w||a.h!==b.h)throw Error('Grid dimensions mismatch');const o=createGrid(a.w,a.h);for(let i=0;i<o.data.length;i++)o.data[i]=a.data[i]&&!b.data[i]?1:0;return o;}
export function union(a,b){const o=createGrid(a.w,a.h);for(let i=0;i<o.data.length;i++)o.data[i]=a.data[i]||b.data[i]?1:0;return o;}
export function count(g){let n=0;for(const p of g.data)n+=p;return n;}
export function components(g){const seen=new Uint8Array(g.data.length);const parts=[];for(let i=0;i<g.data.length;i++){if(!g.data[i]||seen[i])continue;const queue=[i];seen[i]=1;let n=0;for(let j=0;j<queue.length;j++){const a=queue[j],x=a%g.w,y=(a/g.w)|0;n++;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=g.w||yy>=g.h)continue;const k=yy*g.w+xx;if(g.data[k]&&!seen[k]){seen[k]=1;queue.push(k);}}}parts.push(n);}return parts.sort((a,b)=>b-a);}
// One surface per externally exposed voxel side. 3D units are millimetres.
export function meshLayers(layers,cell=1){if(!layers.length)throw Error('No geometry layers');const tris=[];const grid=layers[0].grid;const {w,h}=grid;for(const l of layers)if(l.grid.w!==w||l.grid.h!==h)throw Error('Mismatched grid size');const minZ=Math.min(...layers.map(l=>l.z0)),maxZ=Math.max(...layers.map(l=>l.z1));const occupied=(x,y,z)=>{if(x<0||y<0||x>=w||y>=h)return false;return layers.some(l=>z>=l.z0-1e-7&&z<l.z1-1e-7&&l.grid.data[y*w+x]);};const tri=(a,b,c)=>tris.push([a,b,c]);const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d)};const add=(x,y,z0,z1)=>{const x0=x*cell,x1=(x+1)*cell,y0=y*cell,y1=(y+1)*cell; // outward winding
if(!occupied(x-1,y,(z0+z1)/2))quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]);
if(!occupied(x+1,y,(z0+z1)/2))quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]);
if(!occupied(x,y-1,(z0+z1)/2))quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]);
if(!occupied(x,y+1,(z0+z1)/2))quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]);
};
// Top/bottom exposed surfaces need exact adjoining layer evaluation.
for(const l of layers){for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(l.grid.data[y*w+x]){const x0=x*cell,x1=(x+1)*cell,y0=y*cell,y1=(y+1)*cell;add(x,y,l.z0,l.z1);if(!occupied(x,y,l.z0-1e-5))quad([x0,y0,l.z0],[x0,y1,l.z0],[x1,y1,l.z0],[x1,y0,l.z0]);if(!occupied(x,y,l.z1+1e-5))quad([x0,y0,l.z1],[x1,y0,l.z1],[x1,y1,l.z1],[x0,y1,l.z1]);}}
return {triangles:tris,width:w*cell,height:h*cell,depth:maxZ-minZ};}
export function stl(mesh,name='LEDSign'){let str=`solid ${name}\n`;for(const t of mesh.triangles){const [a,b,c]=t,ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],len=Math.hypot(...cross)||1;str+=`facet normal ${cross.map(v=>(v/len).toFixed(6)).join(' ')}\n outer loop\n`;for(const p of t)str+=`  vertex ${p.map(n=>n.toFixed(3)).join(' ')}\n`;str+=' endloop\nendfacet\n';}return str+'endsolid '+name+'\n';}
export function gridSvgPath(g,cell){let p='';for(let y=0;y<g.h;y++){let x=0;while(x<g.w){if(!g.data[y*g.w+x]){x++;continue;}let end=x+1;while(end<g.w&&g.data[y*g.w+end])end++;p+=`M${(x*cell).toFixed(2)} ${(y*cell).toFixed(2)}h${((end-x)*cell).toFixed(2)}v${cell}h-${((end-x)*cell).toFixed(2)}z`;x=end;}}return p;}
export function generateMeshes(path,opts){const {cell,inside,outside,floor,channelHeight,backingPadding,backingThickness,backing}=opts;const outer=dilate(path,outside/(2*cell)),inner=dilate(path,inside/(2*cell)),walls=subtract(outer,inner),plate=backing?dilate(outer,backingPadding/cell):null;
// Separate bodies: channel starts at z=0; backing occupies negative z. A U-shaped open-top channel.
const channel=meshLayers([{grid:outer,z0:0,z1:floor},{grid:walls,z0:floor,z1:channelHeight}],cell);
const base=plate?meshLayers([{grid:plate,z0:-backingThickness,z1:0}],cell):null;
return {outer,inner,walls,plate,channel,base,components:components(outer),baseComponents:plate?components(plate):[],cell};}
