// Pack the authored neutral poses and eight whole-body walk phases together.
// This only crops/scales source art: no runtime limbs or frozen walk-frame idle.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../assets/heroes/mage/locomotion-067');
const CELL=96,SOLE=88,COLUMNS=9;

async function cells(file,columns,rows){
 const image=await loadImage(path.join(ROOT,file)),result=[];
 for(let row=0;row<rows;row++){
  result[row]=[];
  for(let col=0;col<columns;col++){
   const x0=Math.round(col*image.width/columns),x1=Math.round((col+1)*image.width/columns);
   const y0=Math.round(row*image.height/rows),y1=Math.round((row+1)*image.height/rows);
   const canvas=createCanvas(x1-x0,y1-y0),g=canvas.getContext('2d');
   g.drawImage(image,x0,y0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
   const pixels=g.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
   for(let i=3;i<d.length;i+=4)d[i]=d[i]>=170?255:0;
   // Discard isolated antialiasing flecks without cutting out the staff/hand.
   const seen=new Uint8Array(canvas.width*canvas.height),groups=[];
   for(let start=0;start<seen.length;start++)if(!seen[start]&&d[start*4+3]){
    const q=[start];seen[start]=1;
    for(let n=0;n<q.length;n++){
     const p=q[n],x=p%canvas.width,y=Math.floor(p/canvas.width);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=x+dx,ny=y+dy,next=ny*canvas.width+nx;
      if(nx>=0&&nx<canvas.width&&ny>=0&&ny<canvas.height&&!seen[next]&&d[next*4+3]){seen[next]=1;q.push(next);}
     }
    }
    groups.push(q);
   }
   const largest=Math.max(...groups.map(group=>group.length));
   if(!Number.isFinite(largest))throw Error(`Empty source ${file}/${row}/${col}`);
   for(const group of groups)if(group.length<largest*.03)for(const p of group)d[p*4+3]=0;
   let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(d[(y*canvas.width+x)*4+3]){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   }
   // Anchor on the hood, not on the swinging robe or the off-centre staff.
   let mass=0,center=0;
   for(let y=top;y<top+(bottom-top+1)*.42;y++)for(let x=left;x<=right;x++){
    const i=(y*canvas.width+x)*4;
    if(d[i+3]&&d[i+2]>d[i+1]*1.15&&d[i]>d[i+1]*1.1){center+=x;mass++;}
   }
   if(!mass)throw Error(`Missing hood ${file}/${row}/${col}`);
   g.putImageData(pixels,0,0);
   result[row][col]={canvas,left,top,width:right-left+1,height:bottom-top+1,center:center/mass};
  }
 }
 return result;
}

function put(g,cell,column,row,scale){
 const width=Math.round(cell.width*scale),height=Math.round(cell.height*scale);
 const left=Math.round(CELL/2+(cell.left-cell.center)*scale),top=SOLE-height;
 if(left<2||left+width>CELL-2||top<2)throw Error(`Source exceeds cell: ${row}/${column}`);
 g.drawImage(cell.canvas,cell.left,cell.top,cell.width,cell.height,column*CELL+left,row*CELL+top,width,height);
}

function measureCrystals(canvas){
 const g=canvas.getContext('2d'),sockets=[];
 for(let row=0;row<8;row++){
  sockets[row]=[];
  for(let col=0;col<COLUMNS;col++){
   const d=g.getImageData(col*CELL,row*CELL,CELL,CELL).data,set=new Set();
   for(let p=0;p<CELL*CELL;p++){
    const i=p*4;
    if(d[i+3]>128&&d[i+1]>120&&d[i+2]>130&&d[i+1]-d[i]>35&&d[i+2]-d[i]>35)set.add(p);
   }
   let crystal=[];
   while(set.size){
    const q=[set.values().next().value];set.delete(q[0]);
    for(let n=0;n<q.length;n++){
     const p=q[n],x=p%CELL,y=Math.floor(p/CELL);
     for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<CELL&&ny>=0&&ny<CELL&&set.delete(ny*CELL+nx))q.push(ny*CELL+nx);
    }
    if(q.length>crystal.length)crystal=q;
   }
   if(!crystal.length)throw Error(`Missing crystal ${row}/${col}`);
   const x=crystal.reduce((sum,p)=>sum+p%CELL,0)/crystal.length,y=crystal.reduce((sum,p)=>sum+Math.floor(p/CELL),0)/crystal.length;
   const center=crystal.reduce((best,p)=>Math.hypot(p%CELL-x,Math.floor(p/CELL)-y)<Math.hypot(best%CELL-x,Math.floor(best/CELL)-y)?p:best);
   sockets[row][col]=[center%CELL-CELL/2,Math.floor(center/CELL)-SOLE];
  }
 }
 return sockets;
}

(async()=>{
 const [walk,idle,front,back]=await Promise.all([
  cells('source-walk.png',8,5),cells('source-idle.png',5,1),
  cells('source-front.png',4,2),cells('source-back.png',4,2)
 ]);
 // Keep the explicit left/right contact studies in the cardinal views.
 walk[0]=front.flat();walk[4]=back.flat();
 const output=createCanvas(COLUMNS*CELL,8*CELL),g=output.getContext('2d');g.imageSmoothingEnabled=false;
 for(let row=0;row<5;row++){
  put(g,idle[0][row],0,row,72/idle[0][row].height);
  const scale=72/walk[row][0].height;
  for(let frame=0;frame<8;frame++)put(g,walk[row][frame],frame+1,row,scale);
 }
 for(let row=5;row<8;row++)for(let column=0;column<COLUMNS;column++){
  g.save();g.translate((column+1)*CELL,row*CELL);g.scale(-1,1);
  g.drawImage(output,column*CELL,(8-row)*CELL,CELL,CELL,0,0,CELL,CELL);g.restore();
 }
 fs.writeFileSync(path.join(ROOT,'locomotion.png'),output.toBuffer('image/png'));
 fs.writeFileSync(path.resolve(__dirname,'../src/mage-locomotion-sockets.js'),
  '// Measured cyan crystal centres: column 0 = authored idle, 1–8 = walk.\n'+
  'export const MAGE_LOCOMOTION_SOCKETS='+JSON.stringify(measureCrystals(output))+';\n');
 console.log('Packed mage: 8 directions × (dedicated idle + 8 whole-body walk phases).');
})().catch(error=>{console.error(error);process.exitCode=1;});
