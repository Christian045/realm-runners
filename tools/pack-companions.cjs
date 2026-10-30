// Offline packing of generated companion art. Sharp is not a game dependency.
// Usage: node tools/pack-companions.cjs /path/to/sources.json
const sharp=require('sharp'),fs=require('node:fs/promises');
function cleanCell(raw,w,h){
 const seen=new Uint8Array(w*h),parts=[];
 for(let pos=0;pos<w*h;pos++)if(!seen[pos]&&raw[pos*4+3]>25){
  const pixels=[pos];seen[pos]=1;let x0=w,y0=h,x1=0,y1=0;
  for(let j=0;j<pixels.length;j++){const p=pixels[j],x=p%w,y=Math.floor(p/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const dy of [-1,0,1])for(const dx of [-1,0,1]){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[n]&&raw[n*4+3]>25){seen[n]=1;pixels.push(n);}}
  }parts.push({pixels,x0,y0,x1,y1});
 }
 parts.sort((a,b)=>b.pixels.length-a.pixels.length);const main=parts[0];if(!main)return;
 const dist=new Uint16Array(w*h).fill(1000);for(const p of main.pixels)dist[p]=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;dist[i]=Math.min(dist[i],x?dist[i-1]+1:1000,y?dist[i-w]+1:1000,x&&y?dist[i-w-1]+1:1000);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;dist[i]=Math.min(dist[i],x<w-1?dist[i+1]+1:1000,y<h-1?dist[i+w]+1:1000,x<w-1&&y<h-1?dist[i+w+1]+1:1000);}
 for(const p of parts.slice(1)){
  const gap=Math.hypot(Math.max(0,main.x0-p.x1,p.x0-main.x1),Math.max(0,main.y0-p.y1,p.y0-main.y1));
  if(p.pixels.length<12||gap>8||!p.pixels.some(n=>dist[n]<=8))for(const n of p.pixels)raw[n*4+3]=0;
 }
}
function emission(f,kind,face,scale,anchorX,anchorY){
 let points=[];for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
  const i=(y*f.w+x)*4,[r,g,b,a]=f.raw.subarray(i,i+4);
  const light=kind==='imp'?r>210&&g>110&&b<120:b>180&&g>150&&r<155;
  if(a>120&&light&&(kind==='imp'||y+f.by<f.ch*.66))points.push({x,y});
 }
 if(!points.length)throw Error('No casting-hand pixels '+kind+':'+face);
 if(kind==='imp'){
  const pixels=new Set(points.map(p=>p.y*f.w+p.x)),groups=[];
  while(pixels.size){const first=pixels.values().next().value,q=[first];pixels.delete(first);for(let j=0;j<q.length;j++){const px=q[j]%f.w,py=Math.floor(q[j]/f.w);for(const dy of [-1,0,1])for(const dx of [-1,0,1]){const nx=px+dx,ny=py+dy,n=ny*f.w+nx;if(nx>=0&&nx<f.w&&ny>=0&&ny<f.h&&pixels.has(n)){pixels.delete(n);q.push(n);}}}groups.push(q);}
  groups.sort((a,b)=>b.length-a.length);points=groups[0].map(n=>({x:n%f.w,y:Math.floor(n/f.w)}));
  return [Math.round(points.reduce((n,p)=>n+p.x,0)/points.length*scale-anchorX),Math.round(points.reduce((n,p)=>n+p.y,0)/points.length*scale-anchorY)];
 }
 const axis=face==='up'?'y':'x',low=face==='left'||face==='up'||kind==='imp'&&face==='down';
 if(face==='up'&&kind==='spirit')points=points.filter(p=>p.x+f.bx<f.cw*.55);
 const edge=(low?Math.min:Math.max)(...points.map(p=>p[axis]));points=points.filter(p=>Math.abs(p[axis]-edge)<7);
 const x=points.reduce((n,p)=>n+p.x,0)/points.length,y=points.reduce((n,p)=>n+p.y,0)/points.length;
 return [Math.round(x*scale-anchorX),Math.round(y*scale-anchorY)];
}
async function cells(file,rows){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),result=[],bounds=[0];
 for(let row=1;row<rows;row++){
  const guess=row*info.height/rows,range=info.height/rows*.35;let best=Math.round(guess),score=Infinity;
  for(let y=Math.round(guess-range);y<guess+range;y++){let count=0;for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>30)count++;const value=count*100+Math.abs(y-guess);if(value<score){score=value;best=y;}}
  bounds.push(best);
 }bounds.push(info.height);
 for(let row=0;row<rows;row++)for(let col=0;col<6;col++){
  const x0=Math.round(col*info.width/6),x1=Math.round((col+1)*info.width/6),y0=bounds[row],y1=bounds[row+1],cw=x1-x0,ch=y1-y0;
  let bx=cw,by=ch,ex=-1,ey=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((y0+y)*info.width+x0+x)*4+3]>25){bx=Math.min(bx,x);by=Math.min(by,y);ex=Math.max(ex,x);ey=Math.max(ey,y);}
  if(ex<bx)throw Error('Empty source frame '+file+':'+row+':'+col);
  let w=ex-bx+1,h=ey-by+1,raw=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)data.copy(raw,y*w*4,((y0+by+y)*info.width+x0+bx)*4,((y0+by+y)*info.width+x0+ex+1)*4);
  cleanCell(raw,w,h);
  let tx=w,ty=h,ux=0,uy=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(raw[(y*w+x)*4+3]>25){tx=Math.min(tx,x);ty=Math.min(ty,y);ux=Math.max(ux,x);uy=Math.max(uy,y);}
  if(tx||ty||ux<w-1||uy<h-1){const nw=ux-tx+1,nh=uy-ty+1,nr=Buffer.alloc(nw*nh*4);for(let y=0;y<nh;y++)raw.copy(nr,y*nw*4,((y+ty)*w+tx)*4,((y+ty)*w+ux+1)*4);raw=nr;w=nw;h=nh;bx+=tx;by+=ty;}
  result.push({raw,w,h,bx,by,cw,ch,unitW:info.width/6});
 }return result;
}
function batPivot(f){
 let bottom=0;
 for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(Math.abs(x+f.bx-f.cw*.5)<f.cw*.14&&f.raw[(y*f.w+x)*4+3]>90)bottom=Math.max(bottom,y+f.by);
 return bottom-f.cw*.14;
}
(async()=>{
 const sources=JSON.parse(await fs.readFile(process.argv[2],'utf8')),emissions={},faces=['down','right','up','left'];
 for(const [kind,spec] of Object.entries(sources)){
  const motion=await cells(spec.motion,4),attack=await cells(spec.attack,4),arrival=await cells(spec.arrival,2),cell=kind==='giant'?160:112;
  const size=kind==='bat'?66:kind==='imp'?62:kind==='spirit'?68:110;
  const reference=kind==='bat'?Math.max(...motion.map(f=>f.w)):Math.max(...motion.map(f=>f.h));
  const baseScale=size/reference,hover={bat:25,imp:28,spirit:34,giant:54}[kind];
  const manifest={version:'0.30.0',emission:{},frames:{motion:{},attack:{},summon:[],vanish:[]}},layers=[],preview=[];
  const pivots=faces.map((face,row)=>{
   const strip=motion.slice(row*6,row*6+6),f=strip[0],ys=strip.map(batPivot).sort((a,b)=>a-b);
   return {x:f.cw*(kind==='bat'?(face==='right'?.55:face==='left'?.45:.5):.5),y:kind==='bat'?ys[3]:f.ch*.5};
  });
  for(let row=0;row<10;row++)for(let col=0;col<6;col++){
   const f=row<4?motion[row*6+col]:row<8?attack[(row-4)*6+col]:arrival[(row-8)*6+col];
   const scale=baseScale*motion[0].unitW/f.unitW,w=Math.round(f.w*scale),h=Math.round(f.h*scale);
   if(w>cell-4||h>cell-4)throw Error('Frame exceeds mobile-safe cell '+kind+':'+row+':'+col+' '+w+'x'+h);
   let pivot;if(row<8){const m=pivots[row%4];pivot={x:m.x*f.unitW/motion[0].unitW,y:m.y*f.unitW/motion[0].unitW};}
   else{const full=arrival[row===8?5:6];pivot={x:full.bx+full.w/2,y:kind==='bat'?batPivot(full):full.by+full.h/2};}
   const x=col*cell+Math.floor((cell-w)/2),y=row*cell+Math.floor((cell-h)/2),anchorX=Math.round((pivot.x-f.bx)*scale),anchorY=Math.round((pivot.y-f.by)*scale+hover);
   const png=await sharp(f.raw,{raw:{width:f.w,height:f.h,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();layers.push({input:png,left:x,top:y});
   const meta={x,y,w,h,anchorX,anchorY};
   if(row>=4&&row<8&&col===2&&(kind==='imp'||kind==='spirit'))manifest.emission[faces[row-4]]=emission(f,kind,faces[row-4],scale,anchorX,anchorY);
   if(row<4)(manifest.frames.motion[faces[row]]??=[]).push(meta);else if(row<8)(manifest.frames.attack[faces[row-4]]??=[]).push(meta);else manifest.frames[row===8?'summon':'vanish'].push(meta);
   if(row===0){const ps=kind==='giant'?.72:1,pw=Math.round(w*ps),ph=Math.round(h*ps),px=col*128+64-Math.round(anchorX*ps),py=100-Math.round(anchorY*ps);if(px<col*128||px+pw>(col+1)*128||py<0||py+ph>128)throw Error('Preview clipped '+kind);preview.push({input:ps===1?png:await sharp(png).resize(pw,ph,{kernel:'nearest'}).png().toBuffer(),left:px,top:py});}
  }
  const dir='assets/companions/'+kind;await fs.mkdir(dir,{recursive:true});
  await sharp({create:{width:cell*6,height:cell*10,channels:4,background:'#00000000'}}).composite(layers).png({palette:true,colours:256,dither:0,compressionLevel:9,effort:10}).toFile(dir+'/atlas.png');
  // Giant's menu thumbnail uses a smaller independently packed preview canvas.
  await sharp({create:{width:128*6,height:128,channels:4,background:'#00000000'}}).composite(preview).png({palette:true,colours:256,dither:0,compressionLevel:9,effort:10}).toFile(dir+'/preview.png');
  emissions[kind]=manifest.emission;
  await fs.writeFile(dir+'/atlas.json',JSON.stringify(manifest));console.log('PACKED',kind,'60 authored frames',manifest.emission);
 }
 await fs.writeFile('src/companion-emission.js','// Casting points sampled from the actual release-frame art by pack-companions.cjs.\nexport const COMPANION_EMISSION='+JSON.stringify(emissions)+';\n');
})();
