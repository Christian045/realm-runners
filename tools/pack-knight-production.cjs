// Import eight 8x6 illustration grids and pack fixed-size runtime cells.
// Usage: node tools/pack-knight-production.cjs /path/to/source-map.json
// The map contains S, SW, W, NW, N, NE, E, SE absolute input PNG paths.
// With no argument, rebuild the runtime atlases from checked-in source cells.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../assets/knight/production-054');
const directions=['S','SW','W','NW','N','NE','E','SE'];
const size=72;
const sequences={
 idle:[0,1,2,3,2,1],
 walk:[8,9,10,11,12,13,14,15],
 attack1:[16,17,18,19,20,21,22,23],
 attack2:[24,25,26,27,28,29,30,31],
 attack3:[32,33,34,35,35,36,37,38,39,0],
 recovery:[23,23,0,1,1,0],
 special:[17,18,19,19,19,20,21,23],
 dash:[40,41,42,42,42,41,43,0],
 hurt:[0,4,5,5,6,0],
 death:[0,44,44,45,45,46,47,47]
};
function isolatedCell(image,column,row){
 const left=Math.round(column*image.width/8),top=Math.round(row*image.height/6);
 const width=Math.round((column+1)*image.width/8)-left;
 const height=Math.round((row+1)*image.height/6)-top;
 const cell=createCanvas(width,height),ctx=cell.getContext('2d');
 ctx.drawImage(image,-left,-top);
 const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;
 const visited=new Uint8Array(width*height);
 let largest=[];
 for(let start=0;start<visited.length;start++){
  if(visited[start]||data[start*4+3]<128)continue;
  const component=[start];visited[start]=1;
  for(let index=0;index<component.length;index++){
   const current=component[index],x=current%width,y=Math.floor(current/width);
   for(const next of [x>0?current-1:-1,x<width-1?current+1:-1,
    y>0?current-width:-1,y<height-1?current+width:-1]){
    if(next<0||visited[next]||data[next*4+3]<128)continue;
    visited[next]=1;component.push(next);
   }
  }
  if(component.length>largest.length)largest=component;
 }
 if(largest.length<width*height*.04)throw Error('Missing source sprite '+column+','+row);
 visited.fill(0);
 let minX=width,minY=height,maxX=0,maxY=0;
 for(const pixel of largest){
  visited[pixel]=1;
  minX=Math.min(minX,pixel%width);maxX=Math.max(maxX,pixel%width);
  minY=Math.min(minY,Math.floor(pixel/width));maxY=Math.max(maxY,Math.floor(pixel/width));
 }
 for(let pixel=0;pixel<visited.length;pixel++)data[pixel*4+3]=visited[pixel]?255:0;
 ctx.putImageData(pixels,0,0);
 return {cell,minX,minY,maxX,maxY};
}
async function importSource(file,direction){
 const image=await loadImage(file);
 const cells=Array.from({length:48},(_,index)=>isolatedCell(image,index%8,Math.floor(index/8)));
 // A single uniform scale per facing preserves sword length and crouch height.
 const heights=cells.slice(0,4).map(c=>c.maxY-c.minY+1).sort((a,b)=>a-b);
 const scale=46/((heights[1]+heights[2])/2);
 const idle=cells[0],data=idle.cell.getContext('2d').getImageData(0,0,idle.cell.width,idle.cell.height).data;
 let sumX=0,count=0;
 for(let y=idle.maxY-16;y<=idle.maxY;y++)for(let x=0;x<idle.cell.width;x++){
  if(data[(y*idle.cell.width+x)*4+3]){sumX+=x;count++;}
 }
 const anchorX=sumX/count;
 const source=createCanvas(8*size,6*size),g=source.getContext('2d');
 g.imageSmoothingEnabled=false;
 for(const [index,entry] of cells.entries()){
  const x=index%8*size,y=Math.floor(index/8)*size;
  g.save();g.beginPath();g.rect(x+2,y+2,68,68);g.clip();
  const width=entry.maxX-entry.minX+1,height=entry.maxY-entry.minY+1;
  const outWidth=Math.round(width*scale),outHeight=Math.round(height*scale);
  let left=Math.round(36+(entry.minX-anchorX)*scale);
  const top=61-outHeight;
  const fittedLeft=Math.max(3,Math.min(69-outWidth,left));
  if(index<44&&Math.abs(fittedLeft-left)>3)throw Error('Unaligned source '+direction+'/'+index);
  left=fittedLeft;
  if(left<2||left+outWidth>70||top<2)throw Error('Source exceeds padded cell '+direction+'/'+index+' '+[left,top,outWidth,outHeight]);
  g.drawImage(entry.cell,entry.minX,entry.minY,width,height,
   x+left,y+top,outWidth,outHeight);
  g.restore();
 }
 fs.writeFileSync(path.join(root,'source-'+direction+'.png'),source.toBuffer('image/png'));
}
async function main(){
 fs.mkdirSync(root,{recursive:true});
 if(process.argv[2]){
  const inputs=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  for(const direction of directions)await importSource(inputs[direction],direction);
 }
 const sources=await Promise.all(directions.map(d=>loadImage(path.join(root,'source-'+d+'.png'))));
 for(const [clip,sequence] of Object.entries(sequences)){
  const sheet=createCanvas(sequence.length*size,8*size),g=sheet.getContext('2d');
  g.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<sequence.length;frame++){
   // Whirlwind completes a full turn using the same eight authored facings.
   const source=sources[clip==='special'?(row+frame)%8:row];
   // South idle studies change torso orientation; splicing them onto fixed
   // legs makes the waist slide. Use the complete approved standing pose.
   const index=clip==='idle'&&row===0?0:
    clip==='dash'&&row===1&&sequence[frame]===42?41:sequence[frame];
   g.drawImage(source,index%8*size,Math.floor(index/8)*size,size,size,frame*size,row*size,size,size);
   if(clip==='idle'&&row!==0){
    // Breath stays above the knees; the planted boots use one shared pose.
    g.clearRect(frame*size,row*size+48,size,24);
    g.drawImage(source,0,48,size,24,frame*size,row*size+48,size,24);
   }
  }
  fs.writeFileSync(path.join(root,clip+'.png'),sheet.toBuffer('image/png'));
 }
 console.log('Packed 608 cells, eight facings, ten clips.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
