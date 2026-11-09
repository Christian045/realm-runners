const {createCanvas,loadImage}=require('@napi-rs/canvas');const fs=require('node:fs');
async function cells(path,columns,rows){
 const source=await loadImage(path),out=[];
 for(let row=0;row<rows;row++){
  out[row]=[];
  for(let col=0;col<columns;col++){
   const c=createCanvas(Math.ceil(source.width/columns),Math.ceil(source.height/rows)),ctx=c.getContext('2d');
   ctx.drawImage(source,col*source.width/columns,row*source.height/rows,source.width/columns,source.height/rows,0,0,c.width,c.height);
   const p=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0,hx=0,hn=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,d=p.data;if(d[i+3]<170){d[i+3]=0;continue;}d[i+3]=255;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    if(y<c.height*.65&&d[i+2]>d[i+1]*1.15&&d[i]>d[i+1]*1.1){hx+=x;hn++;}
   }
   const seen=new Uint8Array(c.width*c.height),groups=[];
   for(let start=0;start<seen.length;start++)if(!seen[start]&&p.data[start*4+3]){
    const q=[start];seen[start]=1;
    for(let n=0;n<q.length;n++){const a=q[n],x=a%c.width,y=Math.floor(a/c.width);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,b=ny*c.width+nx;
      if(nx>=0&&nx<c.width&&ny>=0&&ny<c.height&&!seen[b]&&p.data[b*4+3]){seen[b]=1;q.push(b);}
     }
    }groups.push(q);
   }
   const largest=Math.max(...groups.map(a=>a.length));
   for(const group of groups)if(group.length<largest*.03)for(const a of group)p.data[a*4+3]=0;
   x0=c.width;y0=c.height;x1=0;y1=0;hx=0;hn=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,d=p.data;if(!d[i+3])continue;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    if(y<c.height*.65&&d[i+2]>d[i+1]*1.15&&d[i]>d[i+1]*1.1){hx+=x;hn++;}
   }
   if(!hn)throw Error('Missing body '+row+'/'+col);ctx.putImageData(p,0,0);out[row][col]={c,x0,y0,x1,y1,anchor:hx/hn};
  }
 }
 return out;
}
function put(g,cell,col,row,scale){
 const fit=Math.min(scale,90/(cell.x1-cell.x0+1),84/(cell.y1-cell.y0+1));
 const w=Math.round((cell.x1-cell.x0+1)*fit),h=Math.round((cell.y1-cell.y0+1)*fit);
 const left=Math.max(2,Math.min(94-w,Math.round(48+(cell.x0-cell.anchor)*fit))),top=88-h;
 g.drawImage(cell.c,cell.x0,cell.y0,cell.x1-cell.x0+1,cell.y1-cell.y0+1,col*96+left,row*96+top,w,h);
}
function mirror(canvas,cols){const g=canvas.getContext('2d');for(let row=5;row<8;row++)for(let col=0;col<cols;col++){g.save();g.translate(col*96+96,row*96);g.scale(-1,1);g.drawImage(canvas,col*96,(8-row)*96,96,96,0,0,96,96);g.restore();}}
function sockets(canvas,cols){
 const g=canvas.getContext('2d'),s=[];
 for(let row=0;row<8;row++){
  s[row]=[];
  for(let col=0;col<cols;col++){
   const d=g.getImageData(col*96,row*96,96,96).data,set=new Set();
   for(let p=0;p<96*96;p++){const i=p*4;if(d[i+3]>128&&d[i+1]>120&&d[i+2]>130&&d[i+1]-d[i]>35&&d[i+2]-d[i]>35)set.add(p);}
   let crystal=[];while(set.size){const q=[set.values().next().value];set.delete(q[0]);for(let n=0;n<q.length;n++){const p=q[n],x=p%96,y=Math.floor(p/96);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<96&&ny>=0&&ny<96&&set.delete(ny*96+nx))q.push(ny*96+nx);}if(q.length>crystal.length)crystal=q;}
   if(!crystal.length){if(col!==14)throw Error('Missing crystal '+row+'/'+col);
    // During collapse the crystal can be occluded; no projectile is emitted.
    for(let p=0;p<96*96;p++)if(d[p*4+3]>128)crystal.push(p);
   }
   const x=crystal.reduce((s,p)=>s+p%96,0)/crystal.length,y=crystal.reduce((s,p)=>s+Math.floor(p/96),0)/crystal.length;
   const center=crystal.sort((a,b)=>Math.hypot(a%96-x,Math.floor(a/96)-y)-Math.hypot(b%96-x,Math.floor(b/96)-y))[0];s[row][col]=[center%96-48,Math.floor(center/96)-88];
  }
 }return s;
}
(async()=>{
 const root='assets/heroes/mage/walk-066',walk=await cells(`${root}/source-walk.png`,8,5);
 const out=createCanvas(768,768),g=out.getContext('2d');g.imageSmoothingEnabled=false;
 for(let row=0;row<5;row++){
  const first=walk[row][0],scale=72/(first.y1-first.y0+1);
  for(let col=0;col<8;col++)put(g,walk[row][col],col,row,scale);
 }
 mirror(out,8);
 fs.writeFileSync(`${root}/walk.png`,out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-walk-sockets.js','// Measured eight-phase mage walk crystals.\nexport const MAGE_WALK_SOCKETS='+JSON.stringify(sockets(out,8))+';\n');
})();
