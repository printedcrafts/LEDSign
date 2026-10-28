"use strict";
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const PROFILES={neon6:{w:6,h:12,bend:30},neon8:{w:8,h:16,bend:40},neon10:{w:10,h:20,bend:50},cob8:{w:8,h:3,bend:12}};
let uploadedFont=null;let lines=[],shapes=[],selected=-1,customFont=null,uploadBusy=false,zoom=1,scene=null,downloadBlob=null;let fontPreviewOnly=false,traceMessage='';
let manualMode=false, drawing=false, draftLed=[];let letterTransforms={},transformText='';let wireRoutes=[],wireDraft=[],wireMode='',selectedWireRoute=-1;
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

function draftPaths(){
  const text=sourceText(),paths=[];let x=0,charIndex=0;
  for(const letter of text){
    const raw=/\s/.test(letter)?'':(caps[letter]??glyph[letter.toLowerCase()]??glyph.o);
    if(!raw){x+=47;charIndex++;continue;}
    const sections=raw.match(/M[^M]+/g)||[];
    for(const section of sections){
      const pathEl=document.createElementNS('http://www.w3.org/2000/svg','path');
      pathEl.setAttribute('d',section);
      try{
        const len=pathEl.getTotalLength(),pts=[];
        for(let d=0;d<=len;d+=Math.max(5,len/22)){
          const pt=pathEl.getPointAtLength(Math.min(d,len));pts.push({x:pt.x+x,y:pt.y});
        }
        const end=pathEl.getPointAtLength(len);pts.push({x:end.x+x,y:end.y});
        if(pts.length>=2){pts.charIndex=charIndex;paths.push(pts);}
      }catch(err){console.error('Invalid letter vector',letter,err);}
    }
    x+=letter==='m'||letter==='w'?106:letter==='i'||letter==='l'?42:78;
    charIndex++;
  }
  if(!paths.length)throw Error('No usable characters.');
  return paths;
}
function normalizePaths(paths){
 if(!paths.length)throw Error('No centerline paths were generated for this text.');
 const points=paths.flat();if(!points.length)throw Error('No centerline points were generated.');
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const spanX=Math.max(1,maxX-minX),target=Math.max(100,+$('width').value||400),count=Math.max(1,Array.from(sourceText()).length),spacing=+$('letterSpacing').value||0;
 const usable=target-spacing*(count-1);if(usable<20)throw Error('Letter spacing is too large for the target lettering width.');
 const scale=usable/spanX,margin=15;
 return paths.map(path=>{
  const idx=Number.isFinite(path.charIndex)?path.charIndex:null,transform=idx===null?{dx:0,dy:0}:(letterTransforms[idx]||{dx:0,dy:0}),offset=idx===null?0:idx*spacing;
  const result=path.map(pt=>({x:(pt.x-minX)*scale+margin+offset+(transform.dx||0),y:(pt.y-minY)*scale+margin+(transform.dy||0)}));
  if(idx!==null){result.charIndex=idx;result.charValue=path.charValue??Array.from(sourceText())[idx];}
  return result;
 });
}

// Signature-font conversion: first try centerlines, then bounded contours.
// The fallback is deliberately explicit: a glyph outline is NOT an LED centerline.
function contourFallback(mask){
  const {w,h,data}=mask, visited=new Uint8Array(w*h), paths=[];
  const solid=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&data[y*w+x];
  // Build directed perimeter edges for all filled pixels. Interior edges cancel.
  const edges=new Map();
  const add=(a,b)=>{let k=a.join(',');if(!edges.has(k))edges.set(k,[]);edges.get(k).push(b);};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(solid(x,y)){
    if(!solid(x,y-1))add([x,y],[x+1,y]);
    if(!solid(x+1,y))add([x+1,y],[x+1,y+1]);
    if(!solid(x,y+1))add([x+1,y+1],[x,y+1]);
    if(!solid(x-1,y))add([x,y+1],[x,y]);
  }
  const pop=k=>{const q=edges.get(k);if(!q||!q.length)return null;const v=q.pop();if(!q.length)edges.delete(k);return v;};
  let guard=0;
  while(edges.size&&guard++<w*h*4){
    const startKey=edges.keys().next().value;
    let current=startKey.split(',').map(Number), start=current.join(','),path=[{x:current[0],y:current[1]}];
    for(let n=0;n<w*h*4;n++){
      const next=pop(current.join(','));if(!next)break;
      current=next;path.push({x:current[0],y:current[1]});
      if(current.join(',')===start)break;
    }
    // Ignore speckle, keep connected visible glyph contours.
    if(path.length>=12){
      const simplified=[];
      for(let i=0;i<path.length-1;i++){
        const prev=path[(i-1+path.length-1)%(path.length-1)],now=path[i],next=path[(i+1)%(path.length-1)];
        const cross=(now.x-prev.x)*(next.y-now.y)-(now.y-prev.y)*(next.x-now.x);
        if(Math.abs(cross)>0.01)simplified.push(now);
      }
      if(simplified.length>=3){
        // Sample large contours; retain closed loops.
        const stride=Math.max(1,Math.ceil(simplified.length/240));
        const pts=simplified.filter((_,i)=>i%stride===0);
        if(pts.length>=3){pts.push({...pts[0]});paths.push(pts);}
      }
    }
  }
  return paths.sort((a,b)=>b.length-a.length).slice(0,90);
}

// Closed-loop smoothing. Keep the glyph contours recognizable while reducing
// stair steps from canvas sampling. Chaikin corner cutting cannot invent branches.
function smoothContourLoop(path){
  let a=path.slice(0,-1);
  if(a.length<4)return path;
  for(let pass=0;pass<2;pass++){
    const b=[];
    for(let i=0;i<a.length;i++){
      const p=a[i],q=a[(i+1)%a.length];
      b.push({x:p.x*.75+q.x*.25,y:p.y*.75+q.y*.25});
      b.push({x:p.x*.25+q.x*.75,y:p.y*.25+q.y*.75});
    }
    a=b;
  }
  const step=Math.max(1,Math.ceil(a.length/800));
  a=a.filter((_,i)=>i%step===0);
  a.push({...a[0]});
  return a;
}

function pathsFromUploadedFont(){
 const text=sourceText(),chars=Array.from(text),px=100,family='LEDSignUploaded',measureCanvas=document.createElement('canvas'),measureCtx=measureCanvas.getContext('2d');
 if(!measureCtx)throw Error('Canvas 2D unavailable in this browser.');
 measureCtx.font=px+'px "'+family+'"';
 const naturalWidth=measureCtx.measureText(text).width,scale=Math.min(1,680/Math.max(1,naturalWidth)),paths=[];let cursor=0;
 for(let ci=0;ci<chars.length;ci++){
  const char=chars[ci],w=Math.max(36,Math.min(200,Math.ceil(measureCtx.measureText(char).width*scale+38))),h=Math.max(64,Math.min(240,Math.ceil(150*scale+40)));
  if(char===' '){cursor+=Math.max(20,measureCtx.measureText(char).width*scale);continue;}
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas 2D unavailable in this browser.');
  ctx.font=(px*scale)+'px "'+family+'"';ctx.textBaseline='alphabetic';ctx.fillStyle='white';const originX=16,baseline=120*scale+15;ctx.fillText(char,originX,baseline);
  const rgba=ctx.getImageData(0,0,w,h).data,mask=createGrid(w,h);for(let k=0;k<mask.data.length;k++)mask.data[k]=rgba[4*k+3]>90?1:0;
  if(count(mask)>4){const skeleton=skeletonize(mask),traced=traceSkeleton(skeleton);for(const p of traced){let len=0;for(let i=1;i<p.length;i++)len+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);if(len<4)continue;const path=p.map(v=>({x:v.x-originX+cursor,y:v.y}));path.charIndex=ci;path.charValue=char;paths.push(path);}}
  cursor+=measureCtx.measureText(char).width*scale+4;
 }
 if(!paths.length)throw Error('No centerline paths could be traced. Try a bolder, simpler font.');
 traceMessage='Per-character centerline extraction: inspect script-letter joins and tight branch junctions before printing.';
 return paths;
}
function traceSkeleton(g){
  // Trace the thinned bitmap as a graph. Ignore diagonal links when an
  // orthogonal neighbour already connects those pixels; this avoids false
  // branches at ordinary 45-degree corners.
  const {w,h}=g,mark=g.data;
  const offsets=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  function around(i){
    const x=i%w,y=Math.floor(i/w),out=[];
    for(const [dx,dy] of offsets){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h||!mark[yy*w+xx])continue;
      if(dx!==0&&dy!==0&&(mark[y*w+xx]||mark[yy*w+x]))continue;
      out.push(yy*w+xx);
    }
    return out;
  }
  const nbr=new Map();
  for(let i=0;i<mark.length;i++)if(mark[i])nbr.set(i,around(i));
  const used=new Set(),paths=[],key=(a,b)=>a<b?a+':'+b:b+':'+a,pos=i=>({x:i%w,y:Math.floor(i/w)});
  function walk(a,b){
    let previous=a,current=b,pts=[pos(a),pos(b)];
    used.add(key(a,b));
    let steps=0;
    while(steps++<mark.length){
      const n=(nbr.get(current)||[]).filter(k=>k!==previous&&!used.has(key(current,k)));
      if(n.length!==1)break;
      const next=n[0];used.add(key(current,next));pts.push(pos(next));
      previous=current;current=next;
      if(current===a)break;
    }
    if(pts.length>1){
      const sampled=pts.filter((_,i)=>i===0||i===pts.length-1||i%3===0);
      paths.push(sampled);
    }
  }
  for(const [i,n] of nbr)if(n.length!==2)for(const j of n)if(!used.has(key(i,j)))walk(i,j);
  for(const [i,n] of nbr)for(const j of n)if(!used.has(key(i,j)))walk(i,j);
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
    // Automatic centerline extraction is the default; manual routing is an
    // explicit override for places where the traced font needs correction.
    manualMode=false;drawing=false;draftLed=[];customFont=true;
    lines=[];downloadBlob=null;$('download').disabled=true;
    await document.fonts.ready;
    buildLines();
    status('Font loaded: '+file.name+'. Automatically traced the centerline. Review joins; use manual routing only for corrections.');
  }finally{uploadBusy=false;}
}
function smooth(points){
 if(points.length<3)return points.map(p=>({...p}));
 const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<.2,closed=points.length>3&&near(points[0],points[points.length-1]),src=closed?points.slice(0,-1):points.map(p=>({...p}));
 if(src.length<3)return points.map(p=>({...p}));
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 function rdp(list,tol){if(list.length<=2)return list.map(p=>({...p}));const keep=new Uint8Array(list.length);keep[0]=keep[list.length-1]=1;const stack=[[0,list.length-1]];while(stack.length){const [a,b]=stack.pop();let far=tol,ix=-1;for(let i=a+1;i<b;i++){const d=distance(list[i],list[a],list[b]);if(d>far){far=d;ix=i;}}if(ix>=0){keep[ix]=1;stack.push([a,ix],[ix,b]);}}return list.filter((_,i)=>keep[i]).map(p=>({...p}));}
 let reduced;if(!closed)reduced=rdp(src,1.35);
 else{let far=1,max=0;for(let i=1;i<src.length;i++){const d=Math.hypot(src[i].x-src[0].x,src[i].y-src[0].y);if(d>max){max=d;far=i;}}const arc=(a,b)=>{const out=[src[a]];let i=a;while(i!==b&&out.length<=src.length+1){i=(i+1)%src.length;out.push(src[i]);}return out;};const a=rdp(arc(0,far),1.35),b=rdp(arc(far,0),1.35);reduced=a.concat(b.slice(1,-1));}
 let pts=reduced;for(let pass=0;pass<3;pass++){if(closed){const next=[];for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];next.push({x:.75*p.x+.25*q.x,y:.75*p.y+.25*q.y},{x:.25*p.x+.75*q.x,y:.25*p.y+.75*q.y});}pts=next;}else{const next=[{...pts[0]}];for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];next.push({x:.75*p.x+.25*q.x,y:.75*p.y+.25*q.y},{x:.25*p.x+.75*q.x,y:.25*p.y+.75*q.y});}next.push({...pts.at(-1)});pts=next;}}
 const out=[],step=2.5,nseg=closed?pts.length:pts.length-1;for(let i=0;i<nseg;i++){const a=pts[i],b=pts[(i+1)%pts.length],len=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(len/step));for(let k=0;k<n;k++){const t=k/n;out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}
 if(closed){if(out.length)out.push({...out[0]});}else out.push({...pts.at(-1)});return out;
}
function shapePaths(){return shapes.map(s=>{const p=[];const n=s.kind==='line'?2:Math.max(32,Math.ceil(Math.max(s.w,s.h)/3)),count=s.kind==='arc'?n: n;for(let i=0;i<count;i++){let x,y,t=i/(count-1);if(s.kind==='line'){x=(t-.5)*s.w;y=0;}else if(s.kind==='rectangle'){const d=t*4;const a=Math.floor(d)%4,u=d-a;const edges=[[-.5+u,-.5],[.5,-.5+u],[.5-u,.5],[-.5,.5-u]];[x,y]=edges[a];x*=s.w;y*=s.h;}else{const ang=(s.kind==='arc'?Math.PI*(1-t):2*Math.PI*t);x=Math.cos(ang)*s.w*.5;y=Math.sin(ang)*s.h*.5;}p.push({x:s.x+x,y:s.y+y});}if(s.kind==='circle'||s.kind==='ellipse'||s.kind==='rectangle')p.push({...p[0]});return p;});}
function allPaths(){return [...lines,...shapePaths()].filter(p=>p.length>1);}
function range(){if(manualMode&&uploadedFont&&$('font').value==='custom'){const c=document.createElement('canvas').getContext('2d');c.font='100px LEDSignUploaded';const tw=c.measureText(sourceText()).width||100;return {minX:0,minY:0,maxX:+$('width').value,maxY:Math.max(50,100*(+$('width').value)/tw),w:+$('width').value,h:Math.max(50,100*(+$('width').value)/tw)};}const pts=allPaths().flat();if(!pts.length)return {minX:0,minY:0,maxX:450,maxY:150,w:450,h:150};const minX=Math.min(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxX=Math.max(...pts.map(p=>p.x)),maxY=Math.max(...pts.map(p=>p.y));return {minX,minY,maxX,maxY,w:maxX-minX,h:maxY-minY};}
function opts(){const p=PROFILES[$('led').value],clearance=+$('clearance').value,wall=+$('wall').value;return {inner:p.w+2*clearance,outer:p.w+2*clearance+2*wall,floor:+$('floor').value,height:+$('channelHeight').value,pad:+$('padding').value,backingHeight:+$('plate').value,backing:$('backing').checked,mountStyle:$('mountStyle').value,p};}
function labels(){
 for(const id of ['width','glow','clearance','wall','floor','channelHeight','padding','plate'])$(id+'O').textContent=$(id).value+(id==='glow'?'%':' mm');
 $('letterSpacingO').textContent=(+$('letterSpacing').value||0).toFixed(1)+' mm';
 const chars=Array.from(sourceText()),from=$('letterFrom'),to=$('letterTo');
 from.max=to.max=String(chars.length);
 from.value=String(Math.min(chars.length,Math.max(1,+from.value||1)));
 to.value=String(Math.min(chars.length,Math.max(+from.value||1,+to.value||1)));
 $('pairStatus').textContent='Click a character to select it; Shift-click another to select a range. Use the arrow buttons to move the selection, or align it with the whole word.';
 const legend=$('letterLegend');legend.replaceChildren();
 chars.forEach((c,i)=>{
  const b=document.createElement('button');b.type='button';b.className='letter-select';b.textContent=(i+1)+':'+(c===' '?'␠':c);b.title='Select character '+(i+1);
  const active=i>=+from.value-1&&i<=+to.value-1;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  b.onclick=e=>{
   const n=i+1;
   if(e.shiftKey){const a=+$('letterFrom').value||n,z=+$('letterTo').value||a;$('letterFrom').value=Math.min(a,n);$('letterTo').value=Math.max(z,n);}
   else{$('letterFrom').value=n;$('letterTo').value=n;}
   labels();
  };
  legend.append(b);
 });
 const o=opts();$('profile').textContent='Opening '+o.inner.toFixed(1)+' mm · outside '+o.outer.toFixed(1)+' mm · nominal LED '+o.p.w+'×'+o.p.h+' mm · minimum bend radius to verify (example '+o.p.bend+' mm).';
}
function svg(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function dpath(pts){return 'M'+pts.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L');}
function wirePointToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return {x:a.x+t*dx,y:a.y+t*dy};}
function nearestLedPoint(p){let best=null,dist=Infinity;for(const path of allPaths())for(let i=1;i<path.length;i++){const q=wirePointToSegment(p,path[i-1],path[i]),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<dist){dist=d;best=q;}}return best;}
function addWirePoint(p){if(wireMode==='start'){wireDraft=[nearestLedPoint(p)];wireMode='end';}else if(wireMode==='waypoint'){if(!wireDraft.length){status('Mark a start point first.',true);return;}wireDraft.push(p);wireMode='end';}else if(wireMode==='end'){if(!wireDraft.length){wireMode='start';return;}const endpoint=nearestLedPoint(p);if(Math.hypot(endpoint.x-wireDraft[0].x,endpoint.y-wireDraft[0].y)<1)throw Error('Wire route is too short');wireRoutes.push([...wireDraft,endpoint]);wireDraft=[];wireMode='';selectedWireRoute=wireRoutes.length-1;}updateWireUI();invalidate();}
function updateWireUI(){const el=$('routeStatus');if(!el)return;el.textContent=wireMode==='start'?'Click near the END of the first LED stroke.':wireMode==='end'?'Click near the START of the next LED stroke, or add a waypoint.':wireMode==='waypoint'?'Click anywhere to place a rear-wire waypoint.':`${wireRoutes.length} completed rear cable route(s). Start a new route to add another.`;for(const [id,mode] of [['routeStart','start'],['routeEnd','end'],['routeWaypoint','waypoint']])$(id).setAttribute('aria-pressed',String(wireMode===mode));}
function drawWireRoutes(root){const rr=[...wireRoutes,...(wireDraft.length?[wireDraft]:[])];for(const [i,route] of rr.entries()){if(route.length>1)svg('path',{d:dpath(route),fill:'none',stroke:'#6af5d2','stroke-width':3/scene.scale,'stroke-dasharray':`${11/scene.scale} ${7/scene.scale}`,'data-wire':i},root);for(const [k,p] of route.entries()){svg('circle',{cx:p.x,cy:p.y,r:7/scene.scale,fill:k===0?'#ffd27d':'#6af5d2',stroke:'#132b2a','stroke-width':2/scene.scale},root);}}}
function rearRacewayProfile(width,wall,depth){const outer=width+wall*2;return [[-outer/2,0],[-width/2,0],[-width/2,depth-wall],[width/2,depth-wall],[width/2,0],[outer/2,0],[outer/2,depth],[-outer/2,depth]];}
function view(){labels();const g=$('content');g.replaceChildren();const r=range(),o=opts(),margin=35,fit=Math.min(820/Math.max(80,r.w+o.outer+margin),475/Math.max(80,r.h+o.outer+margin)),scale=fit*zoom,tx=450-(r.minX+r.w/2)*scale,ty=280-(r.minY+r.h/2)*scale;scene={tx,ty,scale};const root=svg('g',{transform:`translate(${tx} ${ty}) scale(${scale})`},g);svg('line',{x1:r.minX-12,y1:r.minY+r.h/2,x2:r.minX+r.w+12,y2:r.minY+r.h/2,stroke:'#ff4358','stroke-width':1.5/scale,'stroke-dasharray':`${8/scale} ${5/scale}`,opacity:.9,'pointer-events':'none'},root);const color='#eddaff';if(manualMode&&uploadedFont&&$('font').value==='custom'){const text=sourceText(),maxwidth=Math.max(1,+$('width').value),c=document.createElement('canvas').getContext('2d');c.font='100px LEDSignUploaded';const em=Math.max(1,c.measureText(text).width),fs=100*maxwidth/em;svg('text',{x:r.minX+15,y:r.minY+fs,'font-family':'LEDSignUploaded','font-size':fs,fill:'#c6b7de',opacity:0.28},root).textContent=text;}for(const [i,path] of allPaths().entries()){const d=dpath(path);svg('path',{d,stroke:'#82769b','stroke-width':o.outer+2,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:'#181726','stroke-width':o.inner,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:color,'stroke-width':Math.max(1,o.p.w*.8),fill:'none',opacity:(+$('glow').value/100)*.7,filter:'url(#glowfilter)','stroke-linecap':'round','stroke-linejoin':'round'},root);svg('path',{d,stroke:color,'stroke-width':Math.max(1,o.p.w*.65),fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},root);}
if(draftLed.length){svg('path',{d:dpath(draftLed),fill:'none',stroke:'#63ffdf','stroke-width':3/scale,'stroke-dasharray':`${9/scale} ${5/scale}`},root);for(const p of draftLed)svg('circle',{cx:p.x,cy:p.y,r:5/scale,fill:'#67ffd5'},root);} drawWireRoutes(root);shapes.forEach((s,i)=>{const x=s.x+s.w/2,y=s.y+s.h/2;if(selected===i){svg('rect',{x:s.x-s.w/2,y:s.y-s.h/2,width:s.w,height:s.h,stroke:'#84ffe1','stroke-width':1.3/scale*6,fill:'none','stroke-dasharray':`${5/scale*6} ${3/scale*6}`},root);svg('circle',{cx:x,cy:y,r:7/scale,fill:'#84ffe1','data-resize':i},root);}const p=svg('path',{d:dpath(shapePaths()[i]),fill:'none',stroke:'transparent','stroke-width':Math.max(18/scale,o.outer),'data-shape':i,'stroke-linecap':'round'},root);p.style.cursor='move';});const totalW=r.w+o.outer,totalH=r.h+o.outer; $('dimensions').textContent=`${totalW.toFixed(1)} × ${totalH.toFixed(1)} mm | ${(totalW/25.4).toFixed(2)} × ${(totalH/25.4).toFixed(2)} in`; $('pathcount').textContent=allPaths().length;const bx=+$('bedW').value,by=+$('bedH').value;$('bedstate').textContent=r.w+o.outer<=bx&&r.h+o.outer<=by?'Fits':'Oversized';}
function buildLines(){try{if($('font').value==='custom'&&manualMode){fontPreviewOnly=false;invalidate();status('Manual LED routing active. Use Draw LED path and click along the font strokes.');return;}if($('font').value==='custom'){if(!uploadedFont){fontPreviewOnly=false;throw Error('Upload a TTF or OTF font first.');}fontPreviewOnly=true;view();const traced=pathsFromUploadedFont();lines=normalizePaths(traced);fontPreviewOnly=false;}else{fontPreviewOnly=false;lines=normalizePaths(draftPaths());}invalidate();status('Lettering paths updated. Ready for STL generation. '+(traceMessage||''), Boolean(traceMessage&&traceMessage.startsWith('Outline')));}catch(e){if($('font').value==='custom'&&uploadedFont){fontPreviewOnly=true;traceMessage=e.message;view();status('Font preview works, but printable tracing failed: '+e.message,true);}else status(e.message,true);}}
function invalidate(){downloadBlob=null;$('download').disabled=true;view();}
function orient(a,b){return a[0]*b[1]-a[1]*b[0];}
function capTriangles(poly){const ids=poly.map((_,i)=>i),tri=[];let area=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];area+=orient(a,b);}const sign=Math.sign(area)||1;for(let loop=0;ids.length>3&&loop<100;loop++){let found=false;for(let i=0;i<ids.length;i++){const A=ids[(i+ids.length-1)%ids.length],B=ids[i],C=ids[(i+1)%ids.length],a=poly[A],b=poly[B],c=poly[C];if(orient([b[0]-a[0],b[1]-a[1]],[c[0]-b[0],c[1]-b[1]])*sign<1e-8)continue;let inside=false;for(const j of ids){if([A,B,C].includes(j))continue;const p=poly[j];const f=(u,v,w)=>orient([v[0]-u[0],v[1]-u[1]],[w[0]-u[0],w[1]-u[1]])*sign; if(f(a,b,p)>=-1e-9&&f(b,c,p)>=-1e-9&&f(c,a,p)>=-1e-9){inside=true;break;}}if(inside)continue;tri.push([A,B,C]);ids.splice(i,1);found=true;break;}if(!found)throw Error('Could not triangulate end cap.');}if(ids.length===3)tri.push([...ids]);return tri;}
function swept(points,profile,capEnds={start:true,end:true}){
  const isClosed=points.length>3&&Math.hypot(points[0].x-points.at(-1).x,points[0].y-points.at(-1).y)<.2;
  let pts=smooth(points).filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>.15);
  if(isClosed&&pts.length>2&&Math.hypot(pts[0].x-pts.at(-1).x,pts[0].y-pts.at(-1).y)<.2)pts=pts.slice(0,-1);
  if(pts.length<2)throw Error('Path too short');
  const sections=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[isClosed?(i-1+pts.length)%pts.length:Math.max(0,i-1)];
    const b=pts[isClosed?(i+1)%pts.length:Math.min(pts.length-1,i+1)];
    const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    sections.push(profile.map(([u,z])=>[pts[i].x+nx*u,pts[i].y+ny*u,z]));
  }
  const triangles=[];
  const add=(a,b,c)=>{if(Math.hypot(...a.map((v,i)=>v-b[i]))<1e-7)return;triangles.push([a,b,c]);};
  const n=profile.length,links=isClosed?sections.length:sections.length-1;
  for(let i=0;i<links;i++){
    const next=(i+1)%sections.length;
    for(let j=0;j<n;j++){
      const k=(j+1)%n;
      add(sections[i][j],sections[next][j],sections[next][k]);
      add(sections[i][j],sections[next][k],sections[i][k]);
    }
  }
  // Open paths need caps; closed loops connect the last section back to the
  // first without caps so the tube wall is continuous around the letter.
  if(!isClosed){
    const caps=capTriangles(profile);
    if(capEnds.start!==false)for(const [a,b,c]of caps)add(sections[0][c],sections[0][b],sections[0][a]);
    if(capEnds.end!==false){const e=sections.at(-1);for(const [a,b,c]of caps)add(e[a],e[b],e[c]);}
  }
  return triangles;
}
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
  const pts=paths.flat();if(!pts.length)return {pieces:[],cols:0,rows:0,left:0,top:0,tileW:bx-2*extent,tileH:by-2*extent,extent};
  const left=Math.min(...pts.map(v=>v.x)),right=Math.max(...pts.map(v=>v.x)),top=Math.min(...pts.map(v=>v.y)),bottom=Math.max(...pts.map(v=>v.y));
  const w=bx-2*extent,h=by-2*extent;if(w<=5||h<=5)throw Error('Selected bed is too small for the channel/backplane width.');
  const cols=Math.max(1,Math.ceil((right-left)/w)),rows=Math.max(1,Math.ceil((bottom-top)/h));if(cols*rows>120)throw Error('Too many print tiles; increase build plate or reduce sign dimensions.');
  const pieces=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const x0=left+x*w,y0=top+y*h,rect=[x0,y0,x0+w,y0+h];
    for(let pi=0;pi<paths.length;pi++){
      const path=paths[pi];let segmentIdx=0;
      for(const segment of clipPath(path,rect)){
        if(segment.length>1)pieces.push({path:segment.map(p=>({x:p.x-x0+extent,y:p.y-y0+extent})),tileX:x+1,tileY:y+1,strokeIndex:pi+1,segmentIndex:++segmentIdx});
      }
    }
  }
  return {pieces,cols,rows,left,top,tileW:w,tileH:h,extent};
}

function edgePoints(start,end,outward,enabled,gender,joint,depth,rootWidth){
 const dx=end[0]-start[0],dy=end[1]-start[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,point=t=>[start[0]+ux*t,start[1]+uy*t];
 if(!enabled||len<rootWidth+16)return [start,end];
 const root=Math.min(rootWidth,len*.34),t0=(len-root)/2,t1=t0+root,flare=joint==='dovetail'?Math.min(4,root*.18):Math.min(3,root*.14),sign=gender==='male'?1:-1,nx=outward[0]*sign,ny=outward[1]*sign,off=(t,d)=>{const p=point(t);return [p[0]+nx*d,p[1]+ny*d];};
 if(joint==='puzzle')return [start,point(t0),off(t0,depth*.45),off(t0-flare,depth*.45),off(t0-flare,depth),off(t1+flare,depth),off(t1+flare,depth*.45),off(t1,depth*.45),point(t1),end];
 return [start,point(t0),off(t0-flare,depth),off(t1+flare,depth),point(t1),end];
}
function tileOutline(col,row,cols,rows,w,h,joint,depth,rootWidth){
 const p=(col+row)%2,edges=[{a:[0,0],b:[w,0],n:[0,-1],has:row>0,male:p===0},{a:[w,0],b:[w,h],n:[1,0],has:col<cols-1,male:p===0},{a:[w,h],b:[0,h],n:[0,1],has:row<rows-1,male:p===0},{a:[0,h],b:[0,0],n:[-1,0],has:col>0,male:p===0}],poly=[];
 for(const e of edges){const pts=edgePoints(e.a,e.b,e.n,e.has,e.male?'male':'female',joint,depth,rootWidth);poly.push(...pts.slice(0,-1));}return poly;
}
function splitForBackplane(paths,bedW,bedH,tileW,tileH,margin){
 const depth=+$('jointDepth').value||8,joint=$('jointStyle').value;
 if(tileW<100||tileH<100)throw Error('Backplane tiles must be at least 100 × 100 mm.');
 if(depth<5||depth>15)throw Error('Connector depth must be between 5 and 15 mm.');
 if(tileW+depth+2>bedW||tileH+depth+2>bedH)throw Error('Backplane tile plus connector must fit the selected printer bed. Reduce tile size or choose a larger bed.');
 const pts=paths.flat();if(!pts.length)throw Error('No centerline paths to tile.');
 const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y)),spanX=maxX-minX,spanY=maxY-minY;
 const cols=Math.max(1,Math.ceil((spanX+2*margin)/tileW)),rows=Math.max(1,Math.ceil((spanY+2*margin)/tileH));if(cols*rows>120)throw Error('More than 120 backplane tiles required; increase tile size or reduce sign width.');
 const left=minX-(cols*tileW-spanX)/2,top=minY-(rows*tileH-spanY)/2,pieces=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x0=left+col*tileW,y0=top+row*tileH,rect=[x0,y0,x0+tileW,y0+tileH];for(let pi=0;pi<paths.length;pi++){
   let seg=0;
   for(const path of clipPath(paths[pi],rect))if(path.length>1){
    const atBoundary=p=>Math.abs(p.x-x0)<.02||Math.abs(p.x-(x0+tileW))<.02||Math.abs(p.y-y0)<.02||Math.abs(p.y-(y0+tileH))<.02;
    pieces.push({path:path.map(p=>({x:p.x-x0,y:p.y-y0})),tileX:col+1,tileY:row+1,strokeIndex:pi+1,segmentIndex:++seg,openStart:atBoundary(path[0]),openEnd:atBoundary(path.at(-1))});
   }
  }}
 return {pieces,cols,rows,left,top,tileW,tileH,extent:0,backplane:true,joint,depth};
}
const PART_ID_STROKES={'0':[[0,0,3.8,0],[3.8,0,3.8,5],[3.8,5,0,5],[0,5,0,0]],'1':[[2,0,2,5],[.5,4.8,2,5]],'2':[[0,0,3.8,0],[3.8,0,3.8,2.4],[3.8,2.4,0,2.6],[0,2.6,0,5],[0,5,3.8,5]],'3':[[0,0,3.8,0],[3.8,0,3.8,5],[0,2.5,3.8,2.5],[0,5,3.8,5]],'4':[[0,0,0,2.5],[0,2.5,3.8,2.5],[3.8,0,3.8,5]],'5':[[3.8,0,0,0],[0,0,0,2.5],[0,2.5,3.8,2.5],[3.8,2.5,3.8,5],[3.8,5,0,5]],'6':[[3.8,0,0,0],[0,0,0,5],[0,2.5,3.8,2.5],[3.8,2.5,3.8,5],[3.8,5,0,5]],'7':[[0,0,3.8,0],[3.8,0,1,5]],'8':[[0,0,3.8,0],[3.8,0,3.8,5],[3.8,5,0,5],[0,5,0,0],[0,2.5,3.8,2.5]],'9':[[3.8,5,3.8,0],[3.8,0,0,0],[0,0,0,2.5],[0,2.5,3.8,2.5]],'T':[[0,0,3.8,0],[1.9,0,1.9,5]],'-':[[.5,2.5,3.2,2.5]]};
function tileLabelTriangles(name,z0){const out=[],prof=solidProfile(.9,.75),sx=7,sy=7,step=5;for(let i=0;i<name.length;i++)for(const [x1,y1,x2,y2]of PART_ID_STROKES[name[i]]||[]){const p=[{x:sx+i*step+x1,y:sy+y1},{x:sx+i*step+x2,y:sy+y2}];for(const t of swept(p,prof))out.push(t.map(v=>[v[0],v[1],v[2]+z0]));}return out;}
function buildModelData(){
 if(!allPaths().length)buildLines();
 const o=opts(),bedW=+$('bedW').value,bedH=+$('bedH').value,paths=allPaths();if(!paths.length)throw Error('No centerline paths are ready. Enter text or upload a font, then wait for the 2D preview to generate.');if(o.height<=o.floor)throw Error('Channel height must exceed floor thickness.');if(o.mountStyle!=='none'&&!o.backing)throw Error('Mount accessories require the backplane.');
 if(o.backing){
  const tw=+$('backplaneW').value,th=+$('backplaneH').value,reach=o.mountStyle==='eyelets'?41:o.mountStyle==='posts'?32:o.mountStyle==='keyholes'?35:0,margin=Math.max(o.outer/2+5,reach+6);
  if(!Number.isFinite(tw)||!Number.isFinite(th))throw Error('Enter valid backplane tile dimensions.');
  const split=splitForBackplane(paths,bedW,bedH,tw,th,margin),parts=[],mounts=[],anchors=o.mountStyle==='none'?[]:mountAnchors(paths,o.mountStyle==='posts'?4:2),panelProfile={...o,backing:false};
  if(+$('jointWidth').value<16||+$('jointWidth').value>40)throw Error('Connector width must be between 16 and 40 mm.');
  for(let row=0;row<split.rows;row++)for(let col=0;col<split.cols;col++){
   const id='T'+String(row+1).padStart(2,'0')+'-'+String(col+1).padStart(2,'0'),panelTriangles=extrudedPolygon(tileOutline(col,row,split.cols,split.rows,tw,th,split.joint,split.depth,+$('jointWidth').value||24),0,o.backingHeight),channelTriangles=[];
   for(const p of split.pieces.filter(p=>p.tileX===col+1&&p.tileY===row+1)){const ch=swept(p.path,channelProfile(panelProfile),{start:!p.openStart,end:!p.openEnd});channelTriangles.push(...ch.map(t=>t.map(v=>[v[0],v[1],v[2]+o.backingHeight-.05])));}
   const labelTriangles=$('embossIds').checked?tileLabelTriangles(id,o.backingHeight-.05):[];
   parts.push({name:id,triangles:[...panelTriangles,...channelTriangles,...labelTriangles],meshes:[{name:id+' backplane',triangles:panelTriangles,color:row%2?'#8d9bad':'#a9b5c6'},{name:id+' channels',triangles:channelTriangles,color:'#4e5e77'},...(labelTriangles.length?[{name:id+' embossed ID',triangles:labelTriangles,color:'#d1b0ff'}]:[])],color:row%2?'#8d9bad':'#a9b5c6',dx:col*tw,dy:row*th,tileX:col+1,tileY:row+1});
  }
  for(let i=0;i<anchors.length;i++){const a=anchors[i],loc=tileForMount(a,split),anchor={...a,x:loc.x,y:loc.y};for(const part of mountPartsFor(o.mountStyle,anchor))mounts.push({name:part.suffix+'-'+(i+1),triangles:part.triangles,color:'#d6a663',dx:(loc.tileX-1)*tw,dy:(loc.tileY-1)*th,tileX:loc.tileX,tileY:loc.tileY});}
  return {o,paths,split,parts,mounts,anchors,bedW,bedH,backplane:true};
 }
 const extent=Math.max(o.outer/2,5)+3,split=splitForBed(paths,bedW,bedH,extent),parts=[];for(const p of split.pieces)parts.push({name:'stroke-'+String(p.strokeIndex).padStart(3,'0')+'-'+p.tileX+'-'+p.tileY,triangles:swept(p.path,channelProfile({...o,backing:false})),color:'#a9b5c6',dx:(p.tileX-1)*split.tileW,dy:(p.tileY-1)*split.tileH,tileX:p.tileX,tileY:p.tileY});
 return {o,paths,split,parts,mounts:[],anchors:[],bedW,bedH,backplane:false};
}
function polygonArea(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
function extrudedPolygon(raw,z0,z1){
 let p=raw.map(q=>[q[0],q[1]]);if(p.length>2&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-5)p.pop();
 if(p.length<3)throw Error('Mounting outline is too small.');if(polygonArea(p)<0)p.reverse();
 const caps=capTriangles(p),tri=[],v=(i,z)=>[p[i][0],p[i][1],z];
 for(const [a,b,c]of caps)tri.push([v(a,z1),v(b,z1),v(c,z1)],[v(c,z0),v(b,z0),v(a,z0)]);
 for(let i=0;i<p.length;i++){const j=(i+1)%p.length;tri.push([v(i,z0),v(j,z0),v(j,z1)],[v(i,z0),v(j,z1),v(i,z1)]);}return tri;
}
function rotatedRectTriangles(cx,cy,width,height,theta,z0,z1){const c=Math.cos(theta),s=Math.sin(theta),pts=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);return extrudedPolygon(pts,z0,z1);}
function ringTriangles(cx,cy,outerR,innerR,z0,z1,n=40){
 const tri=[],pt=(r,i,z)=>[cx+r*Math.cos(i*2*Math.PI/n),cy+r*Math.sin(i*2*Math.PI/n),z];
 for(let i=0;i<n;i++){const j=(i+1)%n,ol0=pt(outerR,i,z0),ol1=pt(outerR,j,z0),oh0=pt(outerR,i,z1),oh1=pt(outerR,j,z1),il0=pt(innerR,i,z0),il1=pt(innerR,j,z0),ih0=pt(innerR,i,z1),ih1=pt(innerR,j,z1);tri.push([oh0,oh1,ih1],[oh0,ih1,ih0],[ol1,ol0,il0],[ol1,il0,il1],[ol0,ol1,oh1],[ol0,oh1,oh0],[il1,il0,ih0],[il1,ih0,ih1]);}return tri;
}
function keyholeTabTriangles(cx,cy,theta,z0,z1){
 const w=26,h=32,slot=2.15,r=4.35,circleY=6,reach=Math.sqrt(r*r-slot*slot),start=Math.atan2(-reach,slot),end=Math.PI-start,poly=[[-w/2,-h/2],[-w/2,h/2],[w/2,h/2],[w/2,-h/2],[slot,-h/2],[slot,circleY-reach]];
 for(let i=1;i<=30;i++){const a=start+(end-start)*i/30;poly.push([r*Math.cos(a),circleY+r*Math.sin(a)]);}poly.push([-slot,-h/2]);
 const c=Math.cos(theta),s=Math.sin(theta),pts=poly.map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);return extrudedPolygon(pts,z0,z1);
}
function mountAnchors(paths,count){
 const pts=paths.flat();if(!pts.length)return [];const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y)),cx=(minX+maxX)/2,cy=(minY+maxY)/2,w=maxX-minX,h=maxY-minY;
 const targets=count===2?[[minX+w*.16,minY+h*.25],[maxX-w*.16,minY+h*.25]]:[[minX+w*.13,minY+h*.2],[maxX-w*.13,minY+h*.2],[minX+w*.13,maxY-h*.2],[maxX-w*.13,maxY-h*.2]],results=[];
 for(const target of targets){let best=null,dist=Infinity;for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],q=wirePointToSegment({x:target[0],y:target[1]},a,b),d=Math.hypot(q.x-target[0],q.y-target[1]);if(d<dist){dist=d;const len=Math.hypot(b.x-a.x,b.y-a.y)||1;best={x:q.x,y:q.y,tx:(b.x-a.x)/len,ty:(b.y-a.y)/len};}}
  if(!best)continue;let nx=best.x-cx,ny=best.y-cy,nl=Math.hypot(nx,ny);if(nl<1e-6){nx=-best.ty;ny=best.tx;nl=1;}nx/=nl;ny/=nl;if(results.every(q=>Math.hypot(q.x-best.x,q.y-best.y)>22))results.push({...best,nx,ny});
 }return results;
}
function tileForMount(anchor,split){const col=Math.max(0,Math.min(split.cols-1,Math.floor((anchor.x-split.left)/split.tileW))),row=Math.max(0,Math.min(split.rows-1,Math.floor((anchor.y-split.top)/split.tileH))),x0=split.left+col*split.tileW,y0=split.top+row*split.tileH;return {tileX:col+1,tileY:row+1,x:anchor.x-x0+split.extent,y:anchor.y-y0+split.extent};}
function mountPartsFor(style,a){
 const theta=Math.atan2(a.ny,a.nx)-Math.PI/2,dx=a.nx,dy=a.ny;
 if(style==='keyholes')return [{suffix:'keyhole-tab',triangles:keyholeTabTriangles(a.x+dx*19,a.y+dy*19,theta,-3,0)}];
 if(style==='eyelets'){
  // The narrow tab overlaps only the lower annular material of the eyelet;
  // it stops at the hole's lower tangent so it does not span the hole itself.
  // These shells are emitted together for slicer union into one bracket part.
  const tab=rotatedRectTriangles(a.x+dx*12.5,a.y+dy*12.5,3,25,theta,-4,0);
  const ring=ringTriangles(a.x+dx*28,a.y+dy*28,7,3,-4,0,40);
  return [{suffix:'eyelet-bracket',triangles:tab.concat(ring)}];
}
 if(style==='posts')return [{suffix:'post-tab',triangles:rotatedRectTriangles(a.x+dx*12,a.y+dy*12,10,25,theta,-4,0)},{suffix:'wall-standoff',triangles:ringTriangles(a.x+dx*25,a.y+dy*25,6.5,2.4,-15,-4,40)}];
 return [];
}
function assemblyGuideSVG(split,bx,by,anchors,style){
 const cell=220,gap=24,top=70,width=gap+split.cols*(cell+gap),height=top+split.rows*(cell+gap)+22,fit=Math.min((cell-24)/bx,(cell-24)/by),palette=['#35cfe5','#b99af7','#8ce5b5','#ffbd72','#fb8dbd','#9eafd3'];
 const out=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#fff"/>','<text x="24" y="30" font-family="Arial" font-size="22" font-weight="700" fill="#151827">LEDSign Assembly Map</text>','<text x="24" y="51" font-family="Arial" font-size="12" fill="#4c5367">Bed '+bx+' × '+by+' mm · '+split.cols+' columns × '+split.rows+' rows · mounting: '+style+'</text>'];
 for(let row=0;row<split.rows;row++)for(let col=0;col<split.cols;col++){const ox=gap+col*(cell+gap),oy=top+row*(cell+gap),label='T'+String(row+1).padStart(2,'0')+'-'+String(col+1).padStart(2,'0');out.push('<rect x="'+ox+'" y="'+oy+'" width="'+cell+'" height="'+cell+'" rx="8" fill="#f8f9fc" stroke="#aeb5c3" stroke-width="1.5"/>','<text x="'+(ox+8)+'" y="'+(oy+15)+'" font-family="Arial" font-size="11" font-weight="700" fill="#41495f">'+label+'</text>');
  for(const p of split.pieces.filter(q=>q.tileX===col+1&&q.tileY===row+1)){const d='M'+p.path.map(v=>(ox+12+v.x*fit).toFixed(2)+' '+(oy+22+v.y*fit).toFixed(2)).join(' L');out.push('<path d="'+d+'" fill="none" stroke="'+palette[(p.strokeIndex-1)%palette.length]+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');}
  for(const a of anchors){const m=tileForMount(a,split);if(m.tileX===col+1&&m.tileY===row+1)out.push('<circle cx="'+(ox+12+(m.x+a.nx*(style==='eyelets'?34:style==='posts'?25:19))*fit)+'" cy="'+(oy+22+(m.y+a.ny*20)*fit)+'" r="4.5" fill="#ed9b33" stroke="#8c5511"/>');}
 }
 out.push('<text x="24" y="'+(height-12)+'" font-family="Arial" font-size="10" fill="#555c6f">Channel and backing flange are one swept part when integrated mode is enabled. Flat tile joints require bonding.</text>','</svg>');return out.join('');
}
function crossSectionSVG(o){
 return '<svg xmlns="http://www.w3.org/2000/svg" width="940" height="390" viewBox="0 0 940 390"><rect width="940" height="390" fill="#fff"/><text x="28" y="34" font-family="Arial" font-size="22" font-weight="700" fill="#151827">Channel / backplane connection</text><text x="28" y="57" font-family="Arial" font-size="12" fill="#50586d">'+(o.backing?'Integrated profile: channel walls, floor and backplane are one swept cross-section.':'Channel-only mode: no backplane flange.')+'</text><rect x="250" y="240" width="440" height="32" rx="2" fill="#9da8b8" stroke="#343b4b" stroke-width="2"/><rect x="350" y="150" width="42" height="90" fill="#3e4554" stroke="#202531" stroke-width="2"/><rect x="548" y="150" width="42" height="90" fill="#3e4554" stroke="#202531" stroke-width="2"/><rect x="392" y="220" width="156" height="20" fill="#3e4554" stroke="#202531" stroke-width="2"/><rect x="400" y="175" width="140" height="40" rx="8" fill="#36d8e8" stroke="#138a98" stroke-width="2"/><path d="M350 140 L350 126 L590 126 L590 140" stroke="#bb9af7" stroke-width="4" fill="none"/><text x="470" y="112" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#7150a8">LED flex sits inside channel</text><path d="M612 172 L710 142 L780 142" stroke="#424a5b" stroke-width="1.5" fill="none"/><text x="790" y="146" font-family="Arial" font-size="13" fill="#202638">Channel wall</text><path d="M500 230 L500 302 L660 302" stroke="#424a5b" stroke-width="1.5" fill="none"/><text x="670" y="306" font-family="Arial" font-size="13" fill="#202638">Floor '+o.floor+' mm</text><path d="M650 255 L725 330 L780 330" stroke="#424a5b" stroke-width="1.5" fill="none"/><text x="790" y="334" font-family="Arial" font-size="13" fill="#202638">Backplane '+(o.backing?o.backingHeight+' mm':'off')+'</text><text x="28" y="360" font-family="Arial" font-size="12" fill="#50586d">Schematic only—not to scale. Mount accessories are separate STLs; verify clearances.</text></svg>';
}
function buildGuideText(o,bx,by,split,paths){
 const mounting=o.mountStyle==='none'?'No mounting accessories were generated.':o.mountStyle==='keyholes'?'Keyway hanger tabs are separate STLs. Align tabs to orange marks and attach to the backplane underside. Confirm screw and anchor fit; this is not a load-rated fastener.':o.mountStyle==='eyelets'?'Eyelet brackets are separate STL parts. Attach to the backplane and check ring/chain fit and actual hanging load.':'Wall standoff posts and tabs are separate STL parts. Attach to the rear; the sign panel has no automatically drilled screw holes.';
 return ['PRINTEDCRAFTS LEDSign — BUILD / ASSEMBLY GUIDE','Units: millimetres','Selected printer bed: '+bx+' × '+by+' mm','Backplane tiles: '+(split.backplane?split.cols+' columns × '+split.rows+' rows, nominal '+split.tileW+' × '+split.tileH+' mm.':'not enabled.'),'Centerline path count: '+paths.length,'','CONTENTS','- backplanes/: tile assembly STL with panel, channel geometry and optional embossed ID. Slicer preview should merge the intersecting shells into one body.','- mounts/: optional separate mounting accessories. Attach after fit-check.','- rear-wire-raceways/: separate open-back raceways if routes were added.','- ASSEMBLY-GUIDE.svg: tile map with colour-coded paths and mounting marks. T01-01 is row 1, column 1.','- CHANNEL-CROSS-SECTION.svg: channel/backplane schematic.','','ASSEMBLY','1. Arrange tiles by row/column in ASSEMBLY-GUIDE.svg. Dovetail/puzzle edges are complementary; dry-fit every joint before bonding.','2. Print tiles flat on the plain backplane side. Tiles are at least 100 × 100 mm; connector overhang must fit the selected printer bed.','3. Each tile STL has a plate and channel geometry that overlaps the plate top by 0.05 mm to help the slicer fuse them. Confirm the slicer shows one connected body.','4. Align adjoining tiles and verify channel ends meet at seams. Do not hang a sign relying only on small butt joints.','5. Embossed tile IDs, if enabled, are raised single-line strokes near one corner of each tile.','6. Mount accessories are separate STLs; attach them to strong panel areas and check real screws/chains and load path.','7. Rear wire raceways are separate pieces; feed-through holes are not automatically modelled. Use insulated wire and strain relief.','8. Check the LED minimum bend radius and cut marks. No diffuser cap is generated by this version.','','MOUNTING — '+o.mountStyle.toUpperCase(),mounting,'','QUALITY CONTROL','- Inspect each STL for non-manifold edges, self-intersections and printer-bed clearance.','- Check actual LED opening, branch joins, tile joint fit, and mount hardware in a slicer.','- Font skeleton smoothing is heuristic; script fonts and branches may need manual correction.','- Use suitable wall anchors, insulation, strain relief, heat management and a rated power supply. This is experimental, not electrical/structural certification.'].join('\n');
}
async function generate(){
 if(fontPreviewOnly){status('Cannot generate STL: '+(traceMessage||'font centerline extraction did not complete')+'. Review the font and paths.',true);return;}
 try{
  const model=buildModelData(),{o,paths,split,parts,mounts,anchors,bedW,bedH,backplane}=model,files=[];
  $('generate').disabled=true;status('Preparing smoothed model and interlocking tiles…');await nextFrame();
  if(backplane){for(let i=0;i<parts.length;i++){const p=parts[i];files.push(['backplanes/tile-'+p.name.toLowerCase()+'-assembly.stl',stlBinary(p.triangles)]);if(i%2===0){status('Building tile '+(i+1)+' / '+parts.length+'…');await nextFrame();}}}
  else for(const p of parts)files.push(['channels/'+p.name+'.stl',stlBinary(p.triangles)]);
  for(const m of mounts)files.push(['mounts/'+m.name+'.stl',stlBinary(m.triangles)]);
  const wireWidth=+$('wireWidth').value,wireWall=+$('wireWall').value,wireDepth=+$('wireDepth').value;
  if(wireRoutes.length&&(!Number.isFinite(wireWidth)||wireWidth<1||!Number.isFinite(wireWall)||wireWall<1||!Number.isFinite(wireDepth)||wireDepth<=wireWall))throw Error('Rear raceway dimensions are invalid. Depth must exceed wall thickness.');
  if(wireDraft.length)throw Error('Finish or undo the unfinished rear wire route before exporting.');
  if(wireRoutes.length){const ws=splitForBed(wireRoutes,bedW,bedH,(wireWidth+wireWall*2)/2+3);for(let i=0;i<ws.pieces.length;i++){const p=ws.pieces[i],name='route-'+String(i+1).padStart(3,'0')+'-tile-'+p.tileX+'-'+p.tileY;files.push(['rear-wire-raceways/'+name+'.stl',stlBinary(swept(p.path,rearRacewayProfile(wireWidth,wireWall,wireDepth)))]);}}
  files.push(['README-PRINTING.txt',buildGuideText(o,bedW,bedH,split,paths)]);files.push(['ASSEMBLY-GUIDE.svg',assemblyGuideSVG(split,split.tileW||bedW,split.tileH||bedH,anchors,o.mountStyle)]);files.push(['CHANNEL-CROSS-SECTION.svg',crossSectionSVG(o)]);
  downloadBlob=zip(files);$('download').disabled=false;const count=files.filter(f=>f[0].toLowerCase().endsWith('.stl')).length;status('Generated '+count+' STL part(s) and 3 guide files. '+(backplane?split.cols+' × '+split.rows+' interlocking backplane tiles, each at least 100 × 100 mm.':'Channel-only export.')+' Inspect in a slicer before printing.');
 }catch(e){status('Generation failed: '+e.message,true);}finally{$('generate').disabled=false;}
}
window.LEDSignGet3DModel=()=>buildModelData();
function download(){if(!downloadBlob)return;const url=URL.createObjectURL(downloadBlob),a=document.createElement('a');a.href=url;a.download='LEDSign-printable-channels.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
let pointer=null;
function world(e){const svg=$('preview'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=svg.getScreenCTM();if(!m)return {x:0,y:0};const v=pt.matrixTransform(m.inverse());return {x:(v.x-scene.tx)/scene.scale,y:(v.y-scene.ty)/scene.scale};}
function selectedCharRange(){const n=Array.from(sourceText()).length,a=Math.max(1,Math.min(n,+$('letterFrom').value||1)),b=Math.max(a,Math.min(n,+$('letterTo').value||a));return {start:a-1,end:b-1};}
function moveSelectedLetters(dx,dy){
 const {start,end}=selectedCharRange();
 for(let i=start;i<=end;i++){const key=String(i);letterTransforms[key] ||= {dx:0,dy:0};letterTransforms[key].dx+=dx;letterTransforms[key].dy+=dy;}
 if(!manualMode)buildLines();else invalidate();
}
function boundsForPaths(paths){
 const points=paths.flat();if(!points.length)return null;const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys),cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2};
}
function alignSelectedLetters(axis){
 const {start,end}=selectedCharRange(),selectedPaths=lines.filter(p=>Number.isFinite(p.charIndex)&&p.charIndex>=start&&p.charIndex<=end),selectedBounds=boundsForPaths(selectedPaths),allBounds=boundsForPaths(lines);
 if(!selectedBounds||!allBounds){status('Generate lettering paths before aligning letters.',true);return;}
 let dx=0,dy=0;if(axis==='left')dx=allBounds.minX-selectedBounds.minX;if(axis==='right')dx=allBounds.maxX-selectedBounds.maxX;if(axis==='center')dx=allBounds.cx-selectedBounds.cx;
 if(axis==='top')dy=allBounds.minY-selectedBounds.minY;if(axis==='bottom')dy=allBounds.maxY-selectedBounds.maxY;if(axis==='middle')dy=allBounds.cy-selectedBounds.cy;
 moveSelectedLetters(dx,dy);status('Aligned selected characters '+(start+1)+'–'+(end+1)+' '+axis+'.');
}
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
function wire(){for(const [id,mode] of [['routeStart','start'],['routeEnd','end'],['routeWaypoint','waypoint']])$(id).onclick=()=>{if(mode==='waypoint'&&!wireDraft.length){status('Set route Start first.',true);return;}if(mode==='end'&&!wireDraft.length){status('Set route Start first.',true);return;}wireMode=mode;updateWireUI();};$('routeUndo').onclick=()=>{if(wireDraft.length)wireDraft.pop();else if(wireRoutes.length)wireDraft=wireRoutes.pop().slice(0,-1);wireMode=wireDraft.length?'end':'start';updateWireUI();invalidate();};$('routeDelete').onclick=()=>{if(wireRoutes.length)wireRoutes.splice(selectedWireRoute>=0?selectedWireRoute:wireRoutes.length-1,1);selectedWireRoute=-1;updateWireUI();invalidate();};$('routeClear').onclick=()=>{wireRoutes=[];wireDraft=[];wireMode='';selectedWireRoute=-1;updateWireUI();invalidate();};for(const id of ['wireWidth','wireWall','wireDepth'])$(id).addEventListener('input',invalidate);$('preview').addEventListener('click',e=>{if(drawing){if(e.target.hasAttribute('data-shape')||e.target.hasAttribute('data-resize'))return;draftLed.push(world(e));invalidate();status(`Routing section ${lines.length+1}: ${draftLed.length} points. Click Finish section when complete.`);return;}if(!wireMode)return;try{addWirePoint(world(e));}catch(err){status(err.message,true);}});for(const id of ['text','width'])$(id).addEventListener('input',()=>{if(id==='text'&&sourceText()!==transformText){letterTransforms={};transformText=sourceText();$('letterFrom').value=1;$('letterTo').value=1;}if(manualMode&&lines.length){lines=[];draftLed=[];drawing=false;status('Font dimensions changed; previous LED routes cleared to prevent scaling mismatch.');}buildLines();});for(const id of ['led','glow','clearance','wall','floor','channelHeight','padding','plate'])$(id).addEventListener('input',invalidate);$('font').addEventListener('change',()=>{letterTransforms={};manualMode=false;lines=[];draftLed=[];drawing=false;buildLines();});$('fontFile').addEventListener('change',async e=>{try{await uploadFont(e.target.files[0]);customFont=true;}catch(err){status('Font loading error: '+err.message,true);}});$('addShape').onclick=()=>{const s=+$('shapeSize').value||120,r=range();shapes.push({kind:$('shapeType').value,x:r.minX+r.w/2,y:r.minY+r.h/2,w:s,h:s});selected=shapes.length-1;invalidate();};document.querySelectorAll('[data-align]').forEach(b=>b.addEventListener('click',()=>alignSelected(b.dataset.align)));$('removeShape').onclick=()=>{if(selected>=0){shapes.splice(selected,1);selected=-1;invalidate();}};$('fit').onclick=()=>{zoom=1;view();};$('zoomIn').onclick=()=>{zoom=Math.min(5,zoom*1.25);view();};$('zoomOut').onclick=()=>{zoom=Math.max(.2,zoom/1.25);view();};$('preview').addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.2,Math.min(5,zoom*(e.deltaY<0?1.12:.89)));view();},{passive:false});$('preview').addEventListener('pointerdown',e=>{const target=e.target,idx=target.getAttribute('data-shape')??target.getAttribute('data-resize');if(idx===null)return;selected=+idx;pointer={start:world(e),shape:{...shapes[selected]},resize:target.hasAttribute('data-resize')};$('preview').setPointerCapture(e.pointerId);view();});$('preview').addEventListener('pointermove',e=>{if(!pointer||selected<0)return;const v=world(e),s=shapes[selected],dx=v.x-pointer.start.x,dy=v.y-pointer.start.y;if(pointer.resize){s.w=Math.max(15,pointer.shape.w+2*dx);s.h=Math.max(15,pointer.shape.h+2*dy);}else{s.x=pointer.shape.x+dx;s.y=pointer.shape.y+dy;}invalidate();});$('preview').addEventListener('pointerup',()=>pointer=null);$('preview').addEventListener('pointercancel',()=>pointer=null);$('letterSpacing').addEventListener('input',()=>{letterTransforms={};if(!manualMode)buildLines();});
for(const id of ['letterFrom','letterTo'])$(id).addEventListener('input',()=>labels());
for(const [id,dx,dy]of [['moveLetterLeft',-1,0],['moveLetterRight',1,0],['moveLetterUp',0,-1],['moveLetterDown',0,1]])$(id).addEventListener('click',()=>moveSelectedLetters(dx*(+$('moveStep').value||1),dy*(+$('moveStep').value||1)));
for(const b of document.querySelectorAll('[data-letter-align]'))b.addEventListener('click',()=>alignSelectedLetters(b.dataset.letterAlign));$('autoTrace').onclick=()=>{if(!uploadedFont||$('font').value!=='custom'){status('Upload a TTF/OTF font first to auto-trace its centerline.',true);return;}manualMode=false;drawing=false;draftLed=[];buildLines();};$('manualBegin').onclick=()=>{if(!uploadedFont||$('font').value!=='custom'){status('Upload a font first.',true);return;}if(!manualMode){manualMode=true;lines=[];draftLed=[];invalidate();}drawing=true;wireMode='';status('Manual correction mode: click the center of each intended LED stroke. Finish each disconnected section separately.');};$('manualFinish').onclick=()=>{if(draftLed.length>=2){lines.push(draftLed.slice());draftLed=[];drawing=false;fontPreviewOnly=false;invalidate();status(`${lines.length} LED section(s) ready for STL. Add another section as needed.`);}else status('Select at least two centerline points before finishing.',true);};$('manualUndo').onclick=()=>{draftLed.pop();invalidate();};$('manualClear').onclick=()=>{lines=[];draftLed=[];drawing=false;invalidate();status('LED paths cleared. Font remains as a reference.');};$('generate').onclick=generate;$('download').onclick=download;$('printer').onchange=()=>{if($('printer').value!=='custom'){const [x,y]=$('printer').value.split(',');$('bedW').value=x;$('bedH').value=y;}invalidate();};for(const id of ['bedW','bedH'])$(id).addEventListener('input',invalidate);}
window.addEventListener('error',e=>status(`Application error: ${e.message}`,true));
transformText=sourceText();wire();buildLines();updateWireUI();
