const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
(async()=>{
 const root='assets/heroes/mage/compact-061',im=await loadImage(`${root}/source.png`);
 const out=createCanvas(576,288),g=out.getContext('2d');g.imageSmoothingEnabled=false;const sockets=[];
 for(let row=0;row<3;row++){
  const cells=[];sockets[row]=[];
  for(let n=0;n<6;n++){
   const c=createCanvas(Math.ceil(im.width/6),Math.ceil(im.height/3)),ctx=c.getContext('2d');
   ctx.drawImage(im,n*im.width/6,row*im.height/3,im.width/6,im.height/3,0,0,c.width,c.height);
   const p=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0,sx=0,count=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,d=p.data;if(d[i+3]<160){d[i+3]=0;continue;}d[i+3]=255;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    if(d[i+1]>140&&d[i+2]>150&&d[i+1]-d[i]>40){sx+=x;count++;}
   }
   if(!count)throw Error('No crystal');ctx.putImageData(p,0,0);cells.push({c,x0,y0,x1,y1,cx:sx/count});
  }
  const scale=68/Math.max(...cells.map(c=>c.y1-c.y0+1));
  for(let n=0;n<6;n++){
   const c=cells[n],left=Math.round(([25,27,30][row])+(c.x0-c.cx)*scale);
   const w=Math.round((c.x1-c.x0+1)*scale),h=Math.round((c.y1-c.y0+1)*scale),top=88-h;
   if(left<0||top<0||left+w>96)throw Error('Cell overflow '+row+'/'+n);
   g.drawImage(c.c,c.x0,c.y0,c.x1-c.x0+1,c.y1-c.y0+1,n*96+left,row*96+top,w,h);
   const d=g.getImageData(n*96,row*96,96,96).data;let sx=0,sy=0,count=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;if(d[i+3]&&d[i+1]>140&&d[i+2]>150&&d[i+1]-d[i]>40){sx+=x;sy+=y;count++;}}
   let best=Infinity,tip;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;if(d[i+3]&&d[i+1]>140&&d[i+2]>150&&d[i+1]-d[i]>40){const dist=Math.hypot(x-sx/count,y-sy/count);if(dist<best){best=dist;tip=[x-48,y-88];}}}
   sockets[row][n]=tip;
  }
 }
 const side=createCanvas(576,96),diagonal=createCanvas(576,192);
 side.getContext('2d').drawImage(out,0,0,576,96,0,0,576,96);
 diagonal.getContext('2d').drawImage(out,0,96,576,192,0,0,576,192);
 fs.writeFileSync(`${root}/side.png`,side.toBuffer('image/png'));
 fs.writeFileSync(`${root}/diagonal.png`,diagonal.toBuffer('image/png'));
 fs.writeFileSync('src/mage-side-sockets.js','// Measured compact side walk crystal pixels.\nexport const MAGE_SIDE_SOCKETS='+JSON.stringify(sockets[0])+';\n');
 fs.writeFileSync('src/mage-diagonal-sockets.js','// Measured compact diagonal walk crystal pixels.\nexport const MAGE_DIAGONAL_SOCKETS='+JSON.stringify(sockets.slice(1))+';\n');
})();
