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
 const root='assets/heroes/mage/unified-065';
 const actions=await cells(`${root}/source-actions.png`,8,5);
 const walk=await loadImage('assets/heroes/mage/walk-064/walk.png');
 const out=createCanvas(1536,768),g=out.getContext('2d');g.imageSmoothingEnabled=false;
 const mapping=[0,null,null,null,null,1,2,3,1,2,3,4,5,3,6,7];
 for(let row=0;row<5;row++){
  const neutral=actions[row][0],scale=72/(neutral.y1-neutral.y0+1);
  for(let col=0;col<16;col++){
   if(mapping[col]===null)g.drawImage(walk,(col-1)*2*96,row*96,96,96,col*96,row*96,96,96);
   else put(g,actions[row][row===4&&mapping[col]===5?3:mapping[col]],col,row,scale);
  }
 }
 // Back-facing actions keep the same screen-right staff hand as walking.
 for(let col=0;col<16;col++)if(mapping[col]!==null){
  const tile=createCanvas(96,96);tile.getContext('2d').drawImage(out,col*96,384,96,96,0,0,96,96);
  g.clearRect(col*96,384,96,96);g.save();g.translate(col*96+96,384);g.scale(-1,1);g.drawImage(tile,0,0);g.restore();
 }
 mirror(out,16);
 fs.writeFileSync(`${root}/atlas.png`,out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-sockets.js','// Measured unified mage action crystals.\nexport const MAGE_SOCKETS='+JSON.stringify(sockets(out,16))+';\n');
})();
