const {createCanvas,loadImage}=require('@napi-rs/canvas');const fs=require('node:fs');
(async()=>{
 const root='assets/heroes/mage/complete-062';
 const [source,old]=await Promise.all([loadImage(`${root}/source.png`),loadImage('assets/heroes/mage/production-058/atlas.png')]);
 const out=createCanvas(1536,768),g=out.getContext('2d');g.imageSmoothingEnabled=false;
 const mapping=[0,null,null,null,null,1,2,3,1,2,3,4,5,3,6,7];
 for(let row=0;row<5;row++){
  const cells=[];
  for(let col=0;col<8;col++){
   const c=createCanvas(Math.ceil(source.width/8),Math.ceil(source.height/5)),ctx=c.getContext('2d');
   ctx.drawImage(source,col*source.width/8,row*source.height/5,source.width/8,source.height/5,0,0,c.width,c.height);
   const p=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0,hx=0,hn=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,d=p.data;if(d[i+3]<170){d[i+3]=0;continue;}d[i+3]=255;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    if(y<c.height*.65&&d[i+2]>d[i+1]*1.15&&d[i]>d[i+1]*1.1){hx+=x;hn++;}
   }
   if(!hn)throw Error('Missing body '+row+'/'+col);ctx.putImageData(p,0,0);cells.push({c,x0,y0,x1,y1,anchor:hx/hn});
  }
  const scale=68/(cells[0].y1-cells[0].y0+1);
  for(let col=0;col<16;col++){
   if(mapping[col]===null){const scale=row===0||row===4?68/72:1;g.drawImage(old,col*96,row*96,96,96,col*96+48-48*scale,row*96+88-88*scale,96*scale,96*scale);continue;}
   const cell=cells[mapping[col]],fit=Math.min(scale,90/(cell.x1-cell.x0+1),84/(cell.y1-cell.y0+1));
   const w=Math.round((cell.x1-cell.x0+1)*fit),h=Math.round((cell.y1-cell.y0+1)*fit);
   const left=Math.max(2,Math.min(94-w,Math.round(48+(cell.x0-cell.anchor)*fit))),top=88-h;
   g.drawImage(cell.c,cell.x0,cell.y0,cell.x1-cell.x0+1,cell.y1-cell.y0+1,col*96+left,row*96+top,w,h);
  }
 }
 // North walking holds the staff on screen-right; preserve that hand in actions.
 for(let col=0;col<16;col++)if(mapping[col]!==null){
  const cell=createCanvas(96,96);cell.getContext('2d').drawImage(out,col*96,4*96,96,96,0,0,96,96);
  g.clearRect(col*96,4*96,96,96);g.save();g.translate(col*96+96,4*96);g.scale(-1,1);g.drawImage(cell,0,0);g.restore();
 }
 for(let row=5;row<8;row++)for(let col=0;col<16;col++){
  g.save();g.translate(col*96+96,row*96);g.scale(-1,1);g.drawImage(out,col*96,(8-row)*96,96,96,0,0,96,96);g.restore();
 }
 const sockets=[];
 for(let row=0;row<8;row++){
  sockets[row]=[];
  for(let col=0;col<16;col++){
   const d=g.getImageData(col*96,row*96,96,96).data,set=new Set();
   for(let p=0;p<96*96;p++){const i=p*4;if(d[i+3]>128&&d[i+1]>120&&d[i+2]>130&&d[i+1]-d[i]>35&&d[i+2]-d[i]>35)set.add(p);}
   let crystal=[];while(set.size){const q=[set.values().next().value];set.delete(q[0]);for(let n=0;n<q.length;n++){const p=q[n],x=p%96,y=Math.floor(p/96);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<96&&ny>=0&&ny<96&&set.delete(ny*96+nx))q.push(ny*96+nx);}if(q.length>crystal.length)crystal=q;}
   if(!crystal.length)throw Error('Missing crystal '+row+'/'+col);
   const x=crystal.reduce((s,p)=>s+p%96,0)/crystal.length,y=crystal.reduce((s,p)=>s+Math.floor(p/96),0)/crystal.length;
   const center=crystal.sort((a,b)=>Math.hypot(a%96-x,Math.floor(a/96)-y)-Math.hypot(b%96-x,Math.floor(b/96)-y))[0];
   sockets[row][col]=[center%96-48,Math.floor(center/96)-88];
  }
 }
 fs.writeFileSync(`${root}/atlas.png`,out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-sockets.js','// Crystal pixels in the complete compact mage atlas.\nexport const MAGE_SOCKETS='+JSON.stringify(sockets)+';\n');
})();
