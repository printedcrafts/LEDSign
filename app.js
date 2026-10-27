"use strict";
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const PROFILES={neon6:{w:6,h:12,bend:30},neon8:{w:8,h:16,bend:40},neon10:{w:10,h:20,bend:50},cob8:{w:8,h:3,bend:12}};
let uploadedFont=null;let lines=[],shapes=[],selected=-1,customFont=null,uploadBusy=false,zoom=1,scene=null,downloadBlob=null;let fontPreviewOnly=false,traceMessage='';
function sourceText(){return $('text').value.slice(0,28)||'Neon';}
function status(t,bad=false){$('notice').textContent=t;$('notice').className=bad?'messages error':'messages';}
function createGrid(w,h,fill=0){return {w,h,data:new Uint8Array(w*h).fill(fill)};}
const idx=(g,x,y)=>y*g.w+x;
function dilate(g,r){const out=createGrid(g.w,g.h), rad=Math.max(0,Math.ceil(r)), offsets=[];for(let y=-rad;y<=rad;y++)for(let x=-rad;x<=rad;x++)if(x*x+y*y<=r*r+.25)offsets.push([x,y]);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(g.data[idx(g,x,y)])for(const [dx,dy] of offsets){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<g.w&&yy<g.h)out.data[idx(g,xx,yy)]=1;}return out;}
function count(g){let total=0;for(const value of g.data)total+=value;return total;}
function skeletonize(input){const g=createGrid(input.w,input.h);g.data.set(input.data);const {w,h}=g;let changed=true,iterations=0;while(changed&&iterations++<75){changed=false;for(let phase=0;phase<2;phase++){const remove=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!g.data[i])continue;const n=[g.data[i-w],g.data[i-w+1],g.data[i+1],g.data[i+w+1],g.data[i+w],g.data[i+w-1],g.data[i-1],g.data[i-w-1]];const s=n.reduce((a,b)=>a+b,0);if(s<2||s>6)continue;let transitions=0;for(let k=0;k<8;k++)if(!n[k]&&n[(k+1)%8])transitions++;if(transitions!==1)continue;if(phase===0?(n[0]*n[2]*n[4]||n[2]*n[4]*n[6]):(n[0]*n[2]*n[6]||n[0]*n[4]*n[6]))continue;remove.push(i);}for(const i of remove)g.data[i]=0;if(remove.length)changed=true;}}return g;}

const glyph={
 a:'M8 67 Q25 20 48 37 Q64 55 45 72 Q21 96 10 70 Q5 48 26 40 M49 37 Q43 79 66 66',
 b:'M8 4 Q8 50 8 75 Q10 86 18 74 M10 60 Q34 24 52 43 Q70 66 43 79 Q25 86 14 69',
 c:'M58 43 Q34 24 13 48 Q-5 78 26 79 Q47 79 62 66',
 d:'M58 8 Q56 52 56 70 Q57 82 69 68 M55 46 Q38 25 18 46 Q-4 76 26 81 Q41 82 54 61',
 e:'M10 61 Q62 66 55 43 Q50 25 25 42 Q-3 60 18 77 Q39 87 65 65',
 f:'M10 75 Q34 49 47 22 Q57 -3 40 5 Q24 8 21 42 L18 97 Q17 116 2 119 M3 49 L53 46',
 g:'M60 39 Q37 20 17 44 Q-5 78 26 79 Q45 77 58 51 M60 37 Q59 71 54 95 Q50 118 24 118 Q8 117 3 108',
 h:'M8 5 Q10 33 8 78 M8 61 Q34 22 47 42 Q55 52 54 72 Q54 79 67 68',
 i:'M19 39 Q16 57 17 74 Q18 82 33 66 M19 17 L20 19',
 j:'M35 40 Q29 62 27 95 Q25 115 8 116 Q-2 113 1 107 M37 17 L38 19',
 k:'M10 6 L10 79 M55 39 Q30 52 11 61 M27 56 Q41 79 61 70',
 l:'M15 5 Q10 35 13 69 Q14 85 34 68',
 m:'M7 43 L8 77 Q13 53 25 43 Q38 29 43 46 Q47 57 42 78 Q55 51 67 42 Q85 29 89 48 Q92 61 85 76 Q94 82 105 67',
 n:'M8 43 L8 77 Q20 52 34 42 Q50 32 53 49 Q55 61 51 76 Q62 80 72 66',
 o:'M48 36 Q28 29 14 47 Q-2 69 18 78 Q42 89 53 61 Q60 44 48 36',
 p:'M9 42 L4 117 M9 66 Q27 30 47 42 Q67 56 48 77 Q32 91 9 69',
 q:'M58 40 Q39 25 18 44 Q-4 75 24 79 Q45 78 58 51 M58 40 L57 115',
 r:'M9 43 L9 79 Q17 51 37 41 Q46 37 53 45',
 s:'M55 40 Q33 28 17 45 Q9 56 30 62 Q62 69 40 78 Q20 86 5 73',
 t:'M30 15 Q23 56 24 74 Q26 88 50 68 M7 47 L56 45',
 u:'M9 42 Q3 68 13 77 Q27 88 45 49 M45 40 Q37 75 55 77 Q63 79 70 67',
 v:'M7 43 Q8 75 22 80 Q39 83 58 41',
 w:'M6 44 Q8 77 22 79 Q32 80 39 59 Q39 80 53 80 Q70 80 83 40',
 x:'M9 43 Q31 62 58 79 M59 40 Q35 55 9 79',
 y:'M7 42 Q10 76 23 77 Q39 80 57 42 M57 42 Q49 89 37 110 Q26 129 7 113',
 z:'M7 44 Q33 39 59 43 Q33 64 10 78 Q36 78 62 75',
 ' ':'', '-':'M6 61 L44 59', '.':'M16 77 L18 79', '!':'M18 9 L17 64 M17 77 L18 79', '?':'M7 25 Q18 2 40 14 Q61 30 35 49 Q19 61 21 64 M21 77 L22 79', '&':'M57 30 Q50 6 31 12 Q9 17 25 43 Q67 87 44 80 Q5 79 12 60 Q23 39 65 41'
};
const caps={A:'M5 81 Q26 22 45 6 Q56 35 66 81 M16 54 Q41 49 62 53',B:'M12 10 L11 81 Q68 90 69 61 Q68 46 15 46 Q70 52 63 25 Q59 5 12 10',C:'M64 25 Q46 0 24 17 Q-2 39 16 68 Q36 98 68 65',D:'M12 10 L12 80 Q75 92 76 44 Q75 3 12 10',E:'M62 11 L11 11 L12 80 L64 80 M12 46 L51 45',F:'M12 81 L12 11 L65 11 M12 46 L55 46',G:'M69 24 Q44 -2 22 18 Q0 41 18 69 Q36 94 70 67 L70 49 L45 49',H:'M12 10 L12 81 M65 10 L65 81 M12 46 L65 46',I:'M23 10 L23 81',J:'M49 10 L48 65 Q45 91 14 75',K:'M12 10 L12 81 M65 10 L12 55 M29 44 L68 81',L:'M12 10 L12 80 L65 80',M:'M8 81 L10 10 L40 53 L70 10 L73 81',N:'M12 81 L12 11 L68 81 L68 10',O:'M39 8 Q9 7 9 43 Q9 83 39 83 Q71 83 71 44 Q71 8 39 8',P:'M12 81 L12 10 Q65 4 65 33 Q65 55 12 52',Q:'M39 8 Q9 7 9 43 Q9 83 39 83 Q71 83 71 44 Q71 8 39 8 M49 69 L75 90',R:'M12 81 L12 10 Q65 4 65 33 Q65 54 12 52 M42 52 L70 81',S:'M64 20 Q39 0 19 17 Q4 33 37 46 Q77 63 55 76 Q31 89 9 68',T:'M6 12 L73 12 M39 12 L39 81',U:'M10 10 L10 59 Q10 86 38 83 Q66 81 66 57 L66 10',V:'M8 10 L39 81 L70 10',W:'M5 10 L20 81 L40 42 L60 81 L77 10',X:'M10 10 L70 81 M70 10 L10 81',Y:'M7 10 L38 46 L70 10 M38 46 L38 81',Z:'M10 10 L70 10 L10 81 L70 81'};

function draftPaths(){const text=sourceText(), paths=[];let x=0;for(const letter of text){const raw=/\s/.test(letter)?'':(caps[letter]??glyph[letter.toLowerCase()]??glyph.o);if(!raw){x+=47;continue;}const sections=raw.match(/M[^M]+/g)||[];for(const section of sections){const svg=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('d',section);try{const len=svg.getTotalLength(),pts=[];for(let d=0;d<=len;d+=Math.max(7,len/16)){const pt=svg.getPointAtLength(Math.min(d,len));pts.push({x:pt.x+x,y:pt.y});}const end=svg.getPointAtLength(len);pts.push({x:end.x+x,y:end.y});if(pts.length>=2)paths.push(pts);}catch(err){console.error('Invalid letter vector',letter,err);}}x+=letter==='m'||letter==='w'?106:letter==='i'||letter==='l'?42:78;}if(!paths.length)throw Error('No usable characters.');return paths;}
function normalizePaths(paths){const points=paths.flat();const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));const spanX=Math.max(1,maxX-minX),scale=+$('width').value/spanX;const desiredMargin=15;return paths.map(path=>path.map(pt=>({x:(pt.x-minX)*scale+desiredMargin,y:(pt.y-minY)*scale+desiredMargin})));}

function pathsFromUploadedFont(){
  const text=sourceText();
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Canvas 2D unavailable in this browser.');
  const family='LEDSignUploaded';
  const px=100;
  ctx.font=`${px}px "${family}"`;
  const measure=ctx.measureText(text);
  const scale=Math.min(1,300/Math.max(1,measure.width+24));
  const w=Math.max(40,Math.min(320,Math.ceil(measure.width*scale+30)));
  const h=Math.max(36,Math.ceil(145*scale+20));
  canvas.width=w;canvas.height=h;
  ctx.font=`${px*scale}px "${family}"`;
  ctx.textBaseline='alphabetic';ctx.fillStyle='white';
  ctx.fillText(text,12,118*scale+8);
  const rgba=ctx.getImageData(0,0,w,h).data;
  const mask=createGrid(w,h);
  for(let k=0;k<mask.data.length;k++)mask.data[k]=rgba[4*k+3]>115?1:0;
  const ink=count(mask);
  if(ink<10)throw Error('The uploaded font produced no visible pixels. Check the text and font file.');
  const sk=skeletonize(mask);
  const paths=traceSkeleton(sk);
  if(!paths.length)throw Error('Font rendered but no continuous centerline paths were extracted.');
  return paths;
}
function traceSkeleton(g){
  const {w,h}=g, mark=g.data;
  const offsets=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  function around(i){const x=i%w,y=Math.floor(i/w),out=[];for(const [dx,dy] of offsets){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&mark[yy*w+xx])out.push(yy*w+xx);}return out;}
  const nbr=new Map();for(let i=0;i<mark.length;i++)if(mark[i])nbr.set(i,around(i));
  const used=new Set(),paths=[];const key=(a,b)=>a<b?a+':'+b:b+':'+a;
  const pos=i=>({x:i%w,y:Math.floor(i/w)});
  function walk(a,b){let previous=a,current=b,pts=[pos(a),pos(b)];used.add(key(a,b));let steps=0;while(steps++<mark.length){const n=(nbr.get(current)||[]).filter(k=>k!==previous&&!used.has(key(current,k)));if(n.length!==1)break;const next=n[0];used.add(key(current,next));pts.push(pos(next));previous=current;current=next;if(current===a)break;}if(pts.length>1){const sampled=pts.filter((_,i)=>i===0||i===pts.length-1||i%3===0);paths.push(sampled);}}
  for(const [i,n] of nbr)if(n.length!==2)for(const j of n)if(!used.has(key(i,j)))walk(i,j);
  for(const [i,n] of nbr)for(const j of n)if(!used.has(key(i,j)))walk(i,j);
  if(!paths.length)throw Error('Font has no traceable strokes. Choose another font.');
  return paths.filter(p=>p.length>=2).slice(0,280);
}
async function uploadFont(file){
  if(!file)return;
  if(!/\.(ttf|otf)$/i.test(file.name))throw Error('Choose a .ttf or .otf font file.');
  if(file.size>12*1024*1024)throw Error('Font exceeds the 12 MB maximum.');
  uploadBusy=true;status('Reading font '+file.name+'…');
  try{
    const buffer=await file.arrayBuffer();
    const face=new FontFace('LEDSignUploaded',buffer);
    await face.load();
    if(uploadedFont)document.fonts.delete(uploadedFont);
    document.fonts.add(face);uploadedFont=face;
    $('font').value='custom';
    uploadBusy=false;customFont=true;fontPreviewOnly=true;lines=[];downloadBlob=null;$('download').disabled=true;
    // Render the actual uploaded font first, before computational tracing.
    view();status('Font loaded: '+file.name+'. Preview ready; tracing printable paths…');
    await new Promise(resolve=>setTimeout(resolve,30));
    buildLines();
  }finally{uploadBusy=false;}
}


// Smooth, sampled polyline geometry in physical millimetres.
function smooth(points){if(points.length<3)return points.map(p=>({...p}));const out=[];for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(p2.x-p1.x,p2.y-p1.y)/2));for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;const xy=key=>.5*((2*p1[key])+(-p0[key]+p2[key])*t+(2*p0[key]-5*p1[key]+4*p2[key]-p3[key])*t2+(-p0[key]+3*p1[key]-3*p2[key]+p3[key])*t3);out.push({x:xy('x'),y:xy('y')});}}out.push({...points.at(-1)});return out;}
function shapePaths(){return shapes.map(s=>{const p=[];const n=s.kind==='line'?2:Math.max(32,Math.ceil(Math.max(s.w,s.h)/3)),count=s.kind==='arc'?n: n;for(let i=0;i<count;i++){let x,y,t=i/(count-1);if(s.kind==='line'){x=(t-.5)*s.w;y=0;}else if(s.kind==='rectangle'){const d=t*4;const a=Math.floor(d)%4,u=d-a;const edges=[[-.5+u,-.5],[.5,-.5+u],[.5-u,.5],[-.5,.5-u]];[x,y]=edges[a];x*=s.w;y*=s.h;}else{const ang=(s.kind==='arc'?Math.PI*(1-t):2*Math.PI*t);x=Math.cos(ang)*s.w*.5;y=Math.sin(ang)*s.h*.5;}p.push({x:s.x+x,y:s.y+y});}if(s.kind==='circle'||s.kind==='ellipse'||s.kind==='rectangle')p.push({...p[0]});return p;});}
function allPaths(){return [...lines,...shapePaths()].filter(p=>p.length>1);}
function range(){if(fontPreviewOnly&&uploadedFont&&$('font').value==='custom'){const c=document.createElement('canvas').getContext('2d');c.font='100px LEDSignUploaded';const tw=c.measureText(sourceText()).width||100;return {minX:0,minY:0,maxX:+$('width').value,maxY:Math.max(50,100*(+$('width').value)/tw),w:+$('width').value,h:Math.max(50,100*(+$('width').value)/tw)};}const pts=allPaths().flat();if(!pts.length)return {minX:0,minY:0,maxX:450,maxY:150,w:450,h:150};const minX=Math.min(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxX=Math.max(...pts.map(p=>p.x)),maxY=Math.max(...pts.map(p=>p.y));return {minX,minY,maxX,maxY,w:maxX-minX,h:maxY-minY};}
function opts(){const p=PROFILES[$('led').value],clearance=+$('clearance').value,wall=+$('wall').value;return {inner:p.w+2*clearance,outer:p.w+2*clearance+2*wall,floor:+$('floor').value,height:+$('channelHeight').value,pad:+$('padding').value,backingHeight:+$('plate').value,p};}
function labels(){for(const id of ['width','glow','clearance','wall','floor','channelHeight','padding','plate'])$(id+'O').textContent=$(id).value+(id==='glow'?'%':' mm');const o=opts();$('profile').textContent=`Opening ${o.inner.toFixed(1)} mm · outside ${o.outer.toFixed(1)} mm · nominal LED ${o.p.w}×${o.p.h} mm · manufacturer minimum bend radius must be checked (example ${o.p.bend} mm).`;}
function svg(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function dpath(pts){return 'M'+pts.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L');}
function view(){labels();const g=$('content');g.replaceChildren();const r=range(),o=opts(),margin=35,fit=Math.min(820/Math.max(80,r.w+o.outer+margin),475/Math.max(80,r.h+o.outer+margin)),scale=fit*zoom,tx=450-(r.minX+r.w/2)*scale,ty=280-(r.minY+r.h/2)*scale;scene={tx,ty,scale};const root=svg('g',{transform:`translate(${tx} ${ty}) scale(${scale})`},g);const color='#eddaff';for(const [i,path] of allPaths().entries()){const d=dpath(smooth(path));svg('path',{d,stroke:'#82769b','stroke-width':o.outer+2,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:'#181726','stroke-width':o.inner,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:color,'stroke-width':Math.max(1,o.p.w*.8),fill:'none',opacity:(+$('glow').value/100)*.7,filter:'url(#glowfilter)','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:color,'stroke-width':Math.max(1,o.p.w*.65),fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);}
if(fontPreviewOnly && uploadedFont && $('font').value==='custom'){const text=sourceText();const maxwidth=Math.max(1,+$('width').value);const c=document.createElement('canvas').getContext('2d');c.font='100px LEDSignUploaded';const em=Math.max(1,c.measureText(text).width);const fontSize=100*maxwidth/em;svg('text',{x:r.minX+15,y:r.minY+fontSize,'font-family':'LEDSignUploaded','font-size':fontSize,fill:'#eadaff',stroke:'#ab88df','stroke-width':Math.max(.5,fontSize*.02)},root).textContent=text;}
shapes.forEach((s,i)=>{const x=s.x+s.w/2,y=s.y+s.h/2;if(selected===i){svg('rect',{x:s.x-s.w/2,y:s.y-s.h/2,width:s.w,height:s.h,stroke:'#84ffe1','stroke-width':1.3/scale*6,fill:'none','stroke-dasharray':`${5/scale*6} ${3/scale*6}`},root);svg('circle',{cx:x,cy:y,r:7/scale,fill:'#84ffe1','data-resize':i},root);}const p=svg('path',{d:dpath(shapePaths()[i]),fill:'none',stroke:'transparent','stroke-width':Math.max(18/scale,o.outer),'data-shape':i,'stroke-linecap':'round'},root);p.style.cursor='move';});const totalW=r.w+o.outer,totalH=r.h+o.outer; $('dimensions').textContent=`${totalW.toFixed(1)} × ${totalH.toFixed(1)} mm | ${(totalW/25.4).toFixed(2)} × ${(totalH/25.4).toFixed(2)} in`; $('pathcount').textContent=allPaths().length;const bx=+$('bedW').value,by=+$('bedH').value;$('bedstate').textContent=r.w+o.outer<=bx&&r.h+o.outer<=by?'Fits':'Oversized';}
function buildLines(){try{if($('font').value==='custom'){if(!uploadedFont){fontPreviewOnly=false;throw Error('Upload a TTF or OTF font first.');}fontPreviewOnly=true;view();const traced=pathsFromUploadedFont();lines=normalizePaths(traced);fontPreviewOnly=false;traceMessage='';}else{fontPreviewOnly=false;lines=normalizePaths(draftPaths());}invalidate();status('Lettering paths updated. Ready for STL generation.');}catch(e){if($('font').value==='custom'&&uploadedFont){fontPreviewOnly=true;traceMessage=e.message;view();status('Font preview works, but printable tracing failed: '+e.message,true);}else status(e.message,true);}}
function invalidate(){downloadBlob=null;$('download').disabled=true;view();}
function orient(a,b){return a[0]*b[1]-a[1]*b[0];}
function capTriangles(poly){const ids=poly.map((_,i)=>i),tri=[];let area=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];area+=orient(a,b);}const sign=Math.sign(area)||1;for(let loop=0;ids.length>3&&loop<100;loop++){let found=false;for(let i=0;i<ids.length;i++){const A=ids[(i+ids.length-1)%ids.length],B=ids[i],C=ids[(i+1)%ids.length],a=poly[A],b=poly[B],c=poly[C];if(orient([b[0]-a[0],b[1]-a[1]],[c[0]-b[0],c[1]-b[1]])*sign<1e-8)continue;let inside=false;for(const j of ids){if([A,B,C].includes(j))continue;const p=poly[j];const f=(u,v,w)=>orient([v[0]-u[0],v[1]-u[1]],[w[0]-u[0],w[1]-u[1]])*sign; if(f(a,b,p)>0&&f(b,c,p)>0&&f(c,a,p)>0){inside=true;break;}}if(inside)continue;tri.push([A,B,C]);ids.splice(i,1);found=true;break;}if(!found)throw Error('Could not triangulate end cap.');}if(ids.length===3)tri.push([...ids]);return tri;}
function swept(points,profile){const pts=smooth(points).filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>.15);if(pts.length<2)throw Error('Path too short');const sections=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;sections.push(profile.map(([u,z])=>[pts[i].x+nx*u,pts[i].y+ny*u,z]));}const triangles=[];const add=(a,b,c)=>{if(Math.hypot(...a.map((v,i)=>v-b[i]))<1e-7)return;triangles.push([a,b,c]);};const n=profile.length;for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){const k=(j+1)%n;add(sections[i][j],sections[i+1][j],sections[i+1][k]);add(sections[i][j],sections[i+1][k],sections[i][k]);}const caps=capTriangles(profile);for(const [a,b,c]of caps){add(sections[0][c],sections[0][b],sections[0][a]);const e=sections.at(-1);add(e[a],e[b],e[c]);}return triangles;}
function channelProfile(o){return [[-o.outer/2,0],[o.outer/2,0],[o.outer/2,o.height],[o.inner/2,o.height],[o.inner/2,o.floor],[-o.inner/2,o.floor],[-o.inner/2,o.height],[-o.outer/2,o.height]];}
function solidProfile(width,height){return [[-width/2,0],[width/2,0],[width/2,height],[-width/2,height]];}
function stlBinary(tris){const bytes=new ArrayBuffer(84+tris.length*50),v=new DataView(bytes);v.setUint32(80,tris.length,true);let offset=84;for(const t of tris){const [a,b,c]=t,A=b.map((x,i)=>x-a[i]),B=c.map((x,i)=>x-a[i]),N=[A[1]*B[2]-A[2]*B[1],A[2]*B[0]-A[0]*B[2],A[0]*B[1]-A[1]*B[0]],l=Math.hypot(...N)||1;for(const x of N)v.setFloat32(offset,(x/l)||0,true),offset+=4;for(const vertex of t)for(const x of vertex)v.setFloat32(offset,x,true),offset+=4;v.setUint16(offset,0,true);offset+=2;}return new Uint8Array(bytes);}
function crc32(bytes){let c=~0;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return(~c)>>>0;}
function zip(files){
 const enc=new TextEncoder(), local=[],central=[];let offset=0;
 const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
 for(const [name,content] of files){
  const fn=enc.encode(name), b=typeof content==='string'?enc.encode(content):content, crc=crc32(b);
  const header=new Uint8Array([80,75,3,4,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(b.length),...u32(b.length),...u16(fn.length),...u16(0),...fn]);
  local.push(header,b);
  const directory=new Uint8Array([80,75,1,2,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(b.length),...u32(b.length),...u16(fn.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...fn]);
  central.push(directory);offset+=header.length+b.length;
 }
 const size=central.reduce((n,b)=>n+b.length,0), end=new Uint8Array([80,75,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(size),...u32(offset),...u16(0)]);
 return new Blob([...local,...central,end],{type:'application/zip'});
}
function nextFrame(){return new Promise(resolve=>setTimeout(resolve,0));}
function clipSegment(a,b,x0,y0,x1,y1){
 let t0=0,t1=1,dx=b.x-a.x,dy=b.y-a.y;
 for(const [p,q] of [[-dx,a.x-x0],[dx,x1-a.x],[-dy,a.y-y0],[dy,y1-a.y]]){
  if(Math.abs(p)<1e-10){if(q<0)return null;continue;}
  const t=q/p;if(p<0){if(t>t1)return null;t0=Math.max(t0,t);}else{if(t<t0)return null;t1=Math.min(t1,t);}
 }
 if(t1-t0<1e-6)return null;
 return [{x:a.x+dx*t0,y:a.y+dy*t0},{x:a.x+dx*t1,y:a.y+dy*t1}];
}
function clipPath(path,rect){const pieces=[];let current=[];
 function push(){if(current.length>1)pieces.push(current);current=[];}
 for(let i=1;i<path.length;i++){
  const segment=clipSegment(path[i-1],path[i],...rect);
  if(!segment){push();continue;}
  if(current.length&&Math.hypot(current.at(-1).x-segment[0].x,current.at(-1).y-segment[0].y)>.02)push();
  if(!current.length)current.push(segment[0]);current.push(segment[1]);
 }push();return pieces;
}
function splitForBed(paths,bx,by,extent){
 const pts=paths.flat();if(!pts.length)return [];
 const left=Math.min(...pts.map(v=>v.x)),right=Math.max(...pts.map(v=>v.x)),top=Math.min(...pts.map(v=>v.y)),bottom=Math.max(...pts.map(v=>v.y));
 const w=bx-2*extent,h=by-2*extent;if(w<=5||h<=5)throw Error('Selected bed is too small for the channel/support width.');
 const cols=Math.max(1,Math.ceil((right-left)/w)),rows=Math.max(1,Math.ceil((bottom-top)/h));if(cols*rows>120)throw Error('Too many print tiles; increase build plate or reduce sign dimensions.');
 const pieces=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const x0=left+x*w,y0=top+y*h, rect=[x0,y0,x0+w,y0+h];
  for(const path of paths)for(const segment of clipPath(smooth(path),rect)){
   if(segment.length>1)pieces.push({path:segment.map(p=>({x:p.x-x0+extent,y:p.y-y0+extent})),tileX:x+1,tileY:y+1});
  }
 }return {pieces,cols,rows};
}
async function generate(){if(fontPreviewOnly){status('Cannot generate STL: '+(traceMessage||'font centerline extraction did not complete')+'. Please review the font or edit the vector paths.',true);return;}
 try{
  if(!lines.length)throw Error('No lettering paths');
  const o=opts(),bx=+$('bedW').value,by=+$('bedH').value;
  if(!Number.isFinite(bx)||!Number.isFinite(by)||bx<50||by<50)throw Error('Enter valid build plate dimensions.');
  if(o.height<=o.floor)throw Error('Channel height must exceed floor thickness.');
  const extent=Math.max(o.outer/2,(o.outer+2*o.pad)/2)+2;
  const split=splitForBed(allPaths(),bx,by,extent),files=[],pieces=split.pieces;
  if(!pieces.length)throw Error('Nothing to export.');
  $('generate').disabled=true;status(`Preparing ${pieces.length} printable path sections…`);await nextFrame();
  for(let i=0;i<pieces.length;i++){
   const {path,tileX,tileY}=pieces[i],name=`tile-${tileX}-${tileY}-stroke-${String(i+1).padStart(3,'0')}`;
   const channel=swept(path,channelProfile(o));
   files.push([`channels/${name}.stl`,stlBinary(channel)]);
   if($('backing').checked)files.push([`supports/${name}.stl`,stlBinary(swept(path,solidProfile(o.outer+2*o.pad,o.backingHeight)))]);
   if(i%3===0){status(`Generating ${i+1} / ${pieces.length} printable sections…`);await nextFrame();}
  }
  const note=`LEDSign STL parts; units millimeters.\nBuild plate ${bx} x ${by} mm; ${split.cols} columns x ${split.rows} rows.\nEach file is a separate path piece positioned within its print tile.\nSegments have flat unjoined ends: NO snap locks or dovetails. Use a mounting panel or a separately designed positive locking mechanism.\nDo not print until slicer checks verify bounding dimensions, manifold geometry, intersections, and LED fit.\nOutput channels are U-shaped, not manufacturer validated.\n`;
  files.push(['README-PRINTING.txt',note]);
  downloadBlob=zip(files);$('download').disabled=false;
  status(`Generated ${files.length-1} STL models; ${split.cols} x ${split.rows} build-bed tiles. Download and inspect in your slicer. No locking joints included.`);
 }catch(e){status('Generation failed: '+e.message,true);}finally{$('generate').disabled=false;}
}
function download(){if(!downloadBlob)return;const url=URL.createObjectURL(downloadBlob),a=document.createElement('a');a.href=url;a.download='LEDSign-printable-channels.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
let pointer=null;
function world(e){const svg=$('preview'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=svg.getScreenCTM();if(!m)return {x:0,y:0};const v=pt.matrixTransform(m.inverse());return {x:(v.x-scene.tx)/scene.scale,y:(v.y-scene.ty)/scene.scale};}
function alignSelected(axis){
 if(selected<0||!shapes[selected]){status('Select a shape by clicking or dragging it first.',true);return;}
 const pts=lines.flat();if(!pts.length)return;
 const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
 const s=shapes[selected];
 if(axis==='left')s.x=minX+s.w/2;
 if(axis==='right')s.x=maxX-s.w/2;
 if(axis==='center')s.x=(minX+maxX)/2;
 if(axis==='top')s.y=minY+s.h/2;
 if(axis==='bottom')s.y=maxY-s.h/2;
 if(axis==='middle')s.y=(minY+maxY)/2;
 invalidate();
}
function wire(){for(const id of ['text','width'])$(id).addEventListener('input',buildLines);for(const id of ['led','glow','clearance','wall','floor','channelHeight','padding','plate'])$(id).addEventListener('input',invalidate);$('font').addEventListener('change',buildLines);$('fontFile').addEventListener('change',async e=>{try{await uploadFont(e.target.files[0]);customFont=true;}catch(err){status('Font loading error: '+err.message,true);}});$('addShape').onclick=()=>{const s=+$('shapeSize').value||120,r=range();shapes.push({kind:$('shapeType').value,x:r.minX+r.w/2,y:r.minY+r.h/2,w:s,h:s});selected=shapes.length-1;invalidate();};document.querySelectorAll('[data-align]').forEach(b=>b.addEventListener('click',()=>alignSelected(b.dataset.align)));$('removeShape').onclick=()=>{if(selected>=0){shapes.splice(selected,1);selected=-1;invalidate();}};$('fit').onclick=()=>{zoom=1;view();};$('zoomIn').onclick=()=>{zoom=Math.min(5,zoom*1.25);view();};$('zoomOut').onclick=()=>{zoom=Math.max(.2,zoom/1.25);view();};$('preview').addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.2,Math.min(5,zoom*(e.deltaY<0?1.12:.89)));view();},{passive:false});$('preview').addEventListener('pointerdown',e=>{const target=e.target,idx=target.getAttribute('data-shape')??target.getAttribute('data-resize');if(idx===null)return;selected=+idx;pointer={start:world(e),shape:{...shapes[selected]},resize:target.hasAttribute('data-resize')};$('preview').setPointerCapture(e.pointerId);view();});$('preview').addEventListener('pointermove',e=>{if(!pointer||selected<0)return;const v=world(e),s=shapes[selected],dx=v.x-pointer.start.x,dy=v.y-pointer.start.y;if(pointer.resize){s.w=Math.max(15,pointer.shape.w+2*dx);s.h=Math.max(15,pointer.shape.h+2*dy);}else{s.x=pointer.shape.x+dx;s.y=pointer.shape.y+dy;}invalidate();});$('preview').addEventListener('pointerup',()=>pointer=null);$('preview').addEventListener('pointercancel',()=>pointer=null);$('generate').onclick=generate;$('download').onclick=download;$('printer').onchange=()=>{if($('printer').value!=='custom'){const [x,y]=$('printer').value.split(',');$('bedW').value=x;$('bedH').value=y;}invalidate();};for(const id of ['bedW','bedH'])$(id).addEventListener('input',invalidate);}
window.addEventListener('error',e=>status(`Application error: ${e.message}`,true));
wire();buildLines();
