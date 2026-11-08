const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
const root='assets/heroes/mage/production-058';
(async()=>{
 const [old,back]=await Promise.all([loadImage('assets/heroes/mage/production-056/atlas.png'),loadImage(`${root}/source-back.png`)]);
 const out=createCanvas(1536,768),g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(old,0,0);
 for(let r=0;r<3;r++){
  const cells=[];
  for(let col=0;col<8;col++){
   const c=createCanvas(192,192),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
   ctx.save();if(r===1){ctx.translate(192,0);ctx.scale(-1,1);}
   ctx.drawImage(back,col*back.width/8,r*back.height/3,back.width/8,back.height/3,0,0,192,192);ctx.restore();
   const pixels=ctx.getImageData(0,0,192,192),d=pixels.data;let x0=192,y0=192,x1=0,y1=0,hx=0,hn=0;
   for(let y=0;y<192;y++)for(let x=0;x<192;x++){
    const i=(y*192+x)*4;if(d[i+3]<160){d[i+3]=0;continue;}d[i+3]=255;
    x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
    if(y<105&&d[i+2]>d[i+1]*1.25&&d[i]>d[i+1]*1.1){hx+=x;hn++;}
   }
   ctx.putImageData(pixels,0,0);cells.push({c,x0,y0,x1,y1,anchor:hn?hx/hn:96});
  }
  const scale=72/(cells[0].y1-cells[0].y0+1);
  for(let col=0;col<16;col++){
   const row=r+3;
   if(col>10){
    if(r>0){g.clearRect(col*96,row*96,96,96);g.save();g.translate(col*96+96,row*96);g.scale(-1,1);g.drawImage(old,col*96,(r===1?4:3)*96,96,96,0,0,96,96);g.restore();}
    continue;
   }
   const index=col<8?col:col-3,cell=cells[index];
   const dw=(cell.x1-cell.x0+1)*scale,dh=(cell.y1-cell.y0+1)*scale;
   const left=Math.round(48+(cell.x0-cell.anchor)*scale),top=Math.round(88-dh);
   if(left<0||left+dw>96||top<0)throw Error(`Back pose overflow ${r}/${col}`);
   g.clearRect(col*96,row*96,96,96);g.drawImage(cell.c,cell.x0,cell.y0,cell.x1-cell.x0+1,cell.y1-cell.y0+1,col*96+left,row*96+top,Math.round(dw),Math.round(dh));
  }
 }
 const sockets=[];
 for(let row=0;row<8;row++){
  sockets[row]=[];
  for(let col=0;col<16;col++){
   const d=g.getImageData(col*96,row*96,96,96).data,set=new Set();
   for(let p=0;p<96*96;p++){const i=p*4;if(d[i+3]>128&&d[i+1]>120&&d[i+2]>130&&d[i+1]-d[i]>35&&d[i+2]-d[i]>35)set.add(p);}
   let crystal=[];
   while(set.size){const q=[set.values().next().value];set.delete(q[0]);for(let n=0;n<q.length;n++){const p=q[n],x=p%96,y=Math.floor(p/96);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<96&&ny>=0&&ny<96&&set.delete(ny*96+nx))q.push(ny*96+nx);}if(q.length>crystal.length)crystal=q;}
   if(!crystal.length)throw Error(`No crystal ${row}/${col}`);
   const x=crystal.reduce((s,p)=>s+p%96,0)/crystal.length,y=crystal.reduce((s,p)=>s+Math.floor(p/96),0)/crystal.length;
   const center=crystal.sort((a,b)=>Math.hypot(a%96-x,Math.floor(a/96)-y)-Math.hypot(b%96-x,Math.floor(b/96)-y))[0];
   sockets[row][col]=[center%96-48,Math.floor(center/96)-88];
  }
 }
 fs.writeFileSync(`${root}/atlas.png`,out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-sockets.js','// Measured crystal pixels from pack-mage-back.cjs.\nexport const MAGE_SOCKETS='+JSON.stringify(sockets)+';\n');
})();
