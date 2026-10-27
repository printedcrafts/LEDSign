import {buildMesh,exportBinarySTL,exportOBJ} from './geometry.js';
const $=id=>document.getElementById(id);
const canvas=$('viewport'),ctx=canvas.getContext('2d');
let mesh=null, yaw=-0.37,pitch=-0.28,zoom=1,drag=null,frame=0;
let customFontURL=null;
const ledNotes={none:'This version creates text and backing geometry, not LED channels or wiring holes.',ws2812b:'WS2812B: typically 5 V addressable LEDs. Strip dimensions vary; no channels or electrical features are generated.',ws2813:'WS2813: typically 5 V with backup data line. Confirm strip dimensions and power needs.',sk6812:'SK6812: typically 5 V; variants include RGBW. Confirm strip dimensions and wiring.',ws2815:'WS2815: typically 12 V addressable LEDs. Check polarity, supply ratings, and strip dimensions.'};
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function syncFields(){for(const [id,out] of [['width','widthOut'],['depth','depthOut'],['padding','paddingOut'],['plateDepth','plateDepthOut']])$(out).textContent=$(id).value+' mm';$('backingFields').hidden=!$('backing').checked;$('ledInfo').textContent=ledNotes[$('ledType').value];}
function styleFont(){const styles={sans:'900 140px Arial, Helvetica, sans-serif',serif:'bold 140px Georgia, serif',mono:'bold 140px "Courier New", monospace',rounded:'900 140px "Trebuchet MS", Verdana, sans-serif',custom:'140px "LEDSignCustom"'};return styles[$('fontStyle').value];}
async function rasterize(){
  const text=$('signText').value.trim().replace(/\s+/g,' ');
  if(!text)throw Error('Enter some text to generate your sign.');
  if($('fontStyle').value==='custom'&&!customFontURL)throw Error('Upload a font file first, or select a built-in style.');
  await document.fonts.ready;
  const measure=document.createElement('canvas').getContext('2d');measure.font=styleFont();
  const metrics=measure.measureText(text);
  const naturalWidth=Math.ceil(metrics.width+32),naturalHeight=190;
  const source=document.createElement('canvas');source.width=Math.max(2,naturalWidth);source.height=naturalHeight;
  const sc=source.getContext('2d',{willReadFrequently:true});sc.font=styleFont();sc.fillStyle='white';sc.textBaseline='alphabetic';sc.fillText(text,16,145);
  const data=sc.getImageData(0,0,source.width,source.height).data;
  let left=source.width,top=source.height,right=-1,bottom=-1;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(data[(y*source.width+x)*4+3]>=90){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Could not render that text in the selected font.');
  // Limit mesh size for a responsive browser and maintain aspect ratio.
  const cols=Math.max(8,Math.min(150,Math.ceil(right-left+1)));
  const rows=Math.max(1,Math.round((bottom-top+1)*cols/(right-left+1)));
  if(rows>145)throw Error('Text proportions are too tall. Please try another font.');
  const raster=document.createElement('canvas');raster.width=cols;raster.height=rows;
  const rc=raster.getContext('2d',{willReadFrequently:true});rc.imageSmoothingEnabled=true;rc.imageSmoothingQuality='high';
  rc.drawImage(source,left,top,right-left+1,bottom-top+1,0,0,cols,rows);
  const p=rc.getImageData(0,0,cols,rows).data,mask=new Uint8Array(cols*rows);
  for(let i=0;i<mask.length;i++)mask[i]=p[i*4+3]>100?1:0;
  if(!mask.some(v=>v))throw Error('The text raster was empty.');
  return {mask,cols,rows,pixelMM:Number($('width').value)/cols};
}
async function generate(){
  $('generate').disabled=true;status('Generating geometry…');
  try {
    // Yield a frame to show progress before the CPU-intensive build.
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const raster=await rasterize();
    const next=buildMesh(raster.mask,raster.cols,raster.rows,raster.pixelMM,Number($('depth').value),{enabled:$('backing').checked,padding:Number($('padding').value),thickness:Number($('plateDepth').value)});
    mesh=next;zoom=1;yaw=-0.37;pitch=-0.28;
    $('metricWidth').textContent=mesh.width.toFixed(1)+' mm';$('metricHeight').textContent=mesh.height.toFixed(1)+' mm';$('metricDepth').textContent=mesh.depth.toFixed(1)+' mm';$('metricFaces').textContent=mesh.triangles.toLocaleString();
    $('exportStl').disabled=false;$('exportObj').disabled=false;
    status(`3D model ready · ${mesh.triangles.toLocaleString()} triangles. Download an STL or OBJ file below.`);scheduleDraw();
  } catch(e){mesh=null;$('exportStl').disabled=true;$('exportObj').disabled=true;status(e.message||'Unable to generate sign.',true);scheduleDraw();}
  finally{$('generate').disabled=false;}
}
function download(blob,extension){const name=($('signText').value.trim().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,36)||'LEDSign')+'.'+extension;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportFile(kind){if(!mesh)return;try{download(kind==='stl'?exportBinarySTL(mesh):exportOBJ(mesh),kind);status(`${kind.toUpperCase()} download started. Verify model geometry and scale in your slicer.`);}catch(e){status('Export failed: '+e.message,true);}}
function transform(v){const [x,y,z]=v,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const tx=x*cy+z*sy,tz=-x*sy+z*cy;return [tx,y*cp-tz*sp,y*sp+tz*cp];}
function draw(){
  frame=0;const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#1a2b3d');gradient.addColorStop(1,'#0b1522');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const grid=28;ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;for(let x=w/2%grid;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=h/2%grid;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  if(!mesh){ctx.textAlign='center';ctx.fillStyle='#9ab0c4';ctx.font='600 16px system-ui';ctx.fillText('Your 3D model will appear here',w/2,h/2);return;}
  const scale=Math.min(w/(mesh.width+mesh.depth*2),h/(mesh.height+mesh.depth*3))*0.74*zoom;
  const project=p=>{const v=transform([p[0],p[1],p[2]-mesh.depth/2]);return [w/2+v[0]*scale,h/2-v[1]*scale,v[2]];};
  const faces=[];for(const q of mesh.quads){const n=transform(q.normal);if(n[2]<=0.02)continue;const corners=q.corners.map(project),depth=corners.reduce((s,v)=>s+v[2],0)/4;faces.push({corners,depth,n});}
  faces.sort((a,b)=>a.depth-b.depth);
  for(const f of faces){const l=Math.max(.32,Math.min(1,.55+.28*f.n[2]+.16*f.n[0]-.10*f.n[1]));ctx.fillStyle=`rgb(${Math.round(55*l)},${Math.round(228*l)},${Math.round(190*l)})`;ctx.beginPath();ctx.moveTo(f.corners[0][0],f.corners[0][1]);for(let i=1;i<4;i++)ctx.lineTo(f.corners[i][0],f.corners[i][1]);ctx.closePath();ctx.fill();}
}
function scheduleDraw(){if(!frame)frame=requestAnimationFrame(draw);}
function setupInteraction(){let start;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};yaw+=dx*.008;pitch=Math.max(-1.45,Math.min(1.45,pitch+dy*.008));scheduleDraw();});
  const end=()=>drag=null;canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(4,zoom*Math.exp(-e.deltaY*.001)));scheduleDraw();},{passive:false});
  $('resetView').addEventListener('click',()=>{yaw=-.37;pitch=-.28;zoom=1;scheduleDraw();});
  if('ResizeObserver'in window)new ResizeObserver(scheduleDraw).observe($('canvasWrap'));else window.addEventListener('resize',scheduleDraw);
}
for(const el of ['width','depth','padding','plateDepth','backing','ledType'])$(el).addEventListener('input',syncFields);
$('generate').addEventListener('click',generate);
$('exportStl').addEventListener('click',()=>exportFile('stl'));
$('exportObj').addEventListener('click',()=>exportFile('obj'));
$('fontFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>10*1024*1024){status('Font files must be smaller than 10 MB.',true);return;}try{const url=URL.createObjectURL(file);const font=new FontFace('LEDSignCustom',`url("${url}")`);await font.load();document.fonts.add(font);if(customFontURL)URL.revokeObjectURL(customFontURL);customFontURL=url;$('fontStyle').value='custom';$('fontFilename').textContent=file.name;status('Font loaded. Generate your sign to apply it.');}catch(err){status('Could not load this font. Try a standard TTF or OTF.',true);}});
syncFields();setupInteraction();scheduleDraw();generate();
