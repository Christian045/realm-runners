// The approved idle PNG is never rewritten. Each authored direction has an
// unchanged reference pose plus eight complete-body walk frames. One fixed
// source-to-game scale per direction, calibrated against that reference pose.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate}=require('./pack-hunter-original.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/heroes/hunter/identity-locomotion-0734');
const facings=['S','SW','W','NW','N','NE','E','SE'];
// Generated studies are evenly ordered, but their sprites are not confined to
// exact ninths of the canvas. A bow can cross that nominal boundary. Segment
// complete connected figures before cropping, so no neighbour's bow is imported
// and no part of the held bow is chopped off.
function sourceFigures(image){
 const canvas=createCanvas(image.width,image.height),g=canvas.getContext('2d');
 g.drawImage(image,0,0);const pixels=g.getImageData(0,0,image.width,image.height).data;
 const width=image.width,height=image.height,seen=new Uint8Array(width*height),rows=[[],[]];
 const visible=p=>{const k=p*4,r=pixels[k],gg=pixels[k+1],b=pixels[k+2],a=pixels[k+3];return a>=220&&!(a<250&&Math.min(r,gg,b)>155&&Math.max(r,gg,b)-Math.min(r,gg,b)<12);};
 for(let start=0;start<seen.length;start++){
  if(seen[start]||!visible(start))continue;
  const points=[start];seen[start]=1;let l=width,t=height,r=-1,b=-1;
  for(let next=0;next<points.length;next++){
   const p=points[next],x=p%width,y=Math.floor(p/width);
   l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy,k=ny*width+nx;
    if(nx>=0&&nx<width&&ny>=0&&ny<height&&!seen[k]&&visible(k)){seen[k]=1;points.push(k);}
   }
  }
  if(points.length<width*height*.005)continue;
  const c=createCanvas(r-l+1,b-t+1),cg=c.getContext('2d'),data=cg.createImageData(c.width,c.height);
  for(const p of points){const k=p*4,d=((Math.floor(p/width)-t)*c.width+p%width-l)*4;data.data.set(pixels.subarray(k,k+3),d);data.data[d+3]=255;}
  cg.putImageData(data,0,0);
  rows[(t+b)/2<height/2?0:1].push({c,l:0,t:0,r:c.width-1,b:c.height-1,sourceBounds:[l,t,r-l+1,b-t+1]});
 }
 for(const row of rows){row.sort((a,b)=>a.sourceBounds[0]-b.sourceBounds[0]);if(row.length!==9)throw Error('Expected nine separate complete source figures; found '+row.length);}
 return rows;
}
function hoodCentre(c){
 const d=c.c.getContext('2d').getImageData(0,0,c.c.width,c.c.height).data;let sum=0,n=0;
 for(let y=c.t;y<c.t+(c.b-c.t)*.37;y++)for(let x=c.l;x<=c.r;x++){
  const k=(y*c.c.width+x)*4,r=d[k],g=d[k+1],b=d[k+2];
  if(d[k+3]&&g>r*.75&&g<r*1.15&&g>b*1.3){sum+=x;n++;}
 }
 return n?sum/n:(c.l+c.r)/2;
}
if(require.main===module)(async()=>{
 const idle=await loadImage(path.join(root,'../identity-idle-0733/idle.png'));
 const sheet=createCanvas(768,768),g=sheet.getContext('2d');g.imageSmoothingEnabled=false;
 const rows=[];
 for(let pair=0;pair<4;pair++){
  const source=await loadImage(path.join(root,'source-'+pair+'.png'));
  const figures=sourceFigures(source);
  for(let local=0;local<2;local++){
   const row=pair*2+local,approved=isolate(idle,row,0,1,8);
   const reference=figures[local][0],scale=72/(reference.b-reference.t+1);
   const targetX=hoodCentre(approved),frames=[];
   for(let frame=0;frame<8;frame++){
    const c=figures[local][frame+1],w=Math.round((c.r-c.l+1)*scale),h=Math.round((c.b-c.t+1)*scale);
    const x=Math.round(targetX+(c.l-hoodCentre(c))*scale),y=88-h;
    if(x<1||x+w>95||y<1)throw Error('Clipped '+facings[row]+'/'+frame+' '+[x,y,w,h]);
    if(Math.abs(h-72)>3)throw Error('Body size changed '+facings[row]+'/'+frame+' '+h);
    const tile=createCanvas(96,96),t=tile.getContext('2d');t.imageSmoothingEnabled=false;
    t.drawImage(c.c,c.l,c.t,c.r-c.l+1,c.b-c.t+1,x,y,w,h);
    const d=t.getImageData(0,0,96,96).data;let bottom=0;
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(d[(y*96+x)*4+3])bottom=y;
    const shift=87-bottom;g.drawImage(tile,frame*96,row*96+shift);
    frames.push({frame,sourceColumn:frame+1,sourceBounds:c.sourceBounds,bounds:[x,y+shift,w,h]});
   }
   rows.push({direction:facings[row],source:'source-'+pair+'.png',sourceRow:local,referenceHeight:reference.b-reference.t+1,scale,targetHoodX:targetX,frames});
  }
 }
 fs.writeFileSync(path.join(root,'walk.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify({cell:96,anchor:[48,88],stride:96,sourceIsolation:'whole-connected-figure',approvedIdle:'../identity-idle-0733/idle.png',rows},null,2)+'\n');
 console.log('Packed 64 authored whole-body walk frames; approved idle remains untouched.');
})().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={sourceFigures};
