const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
(async()=>{
 const im=await loadImage('assets/heroes/mage/side-0591/source.png');
 const out=createCanvas(576,96),g=out.getContext('2d');g.imageSmoothingEnabled=false;
 const cells=[];
 for(let n=0;n<6;n++){
  const c=createCanvas(Math.ceil(im.width/6),im.height),ctx=c.getContext('2d');
  ctx.drawImage(im,n*im.width/6,0,im.width/6,im.height,0,0,c.width,c.height);
  const p=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0,sx=0,sy=0,count=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const i=(y*c.width+x)*4,d=p.data;if(d[i+3]<160){d[i+3]=0;continue;}d[i+3]=255;
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   if(d[i+1]>140&&d[i+2]>150&&d[i+1]-d[i]>40){sx+=x;sy+=y;count++;}
  }
  ctx.putImageData(p,0,0);cells.push({c,x0,y0,x1,y1,cx:sx/count,cy:sy/count});
 }
 const scale=72/(cells[0].y1-cells[0].y0+1),sockets=[];
 for(let n=0;n<6;n++){
  const c=cells[n],left=Math.round(21+(c.x0-c.cx)*scale),top=Math.round(24+(c.y0-c.cy)*scale);
  const w=Math.round((c.x1-c.x0+1)*scale),h=Math.round((c.y1-c.y0+1)*scale);
  if(left<0||top<0||left+w>96||top+h>90)throw Error(JSON.stringify({n,left,top,w,h,cx:c.cx,cy:c.cy})) ;
  g.drawImage(c.c,c.x0,c.y0,c.x1-c.x0+1,c.y1-c.y0+1,n*96+left,top,w,h);
  const d=g.getImageData(n*96,0,96,96).data;let best=Infinity,tip;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;if(d[i+3]&&d[i+1]>140&&d[i+2]>150&&d[i+1]-d[i]>40){const dist=Math.hypot(x-21,y-24);if(dist<best){best=dist;tip=[x-48,y-88];}}}
  sockets.push(tip);
 }
 fs.writeFileSync('assets/heroes/mage/side-0591/walk.png',out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-side-sockets.js','// Crystal pixels in the six side walk frames.\nexport const MAGE_SIDE_SOCKETS='+JSON.stringify(sockets)+';\n');
})();
