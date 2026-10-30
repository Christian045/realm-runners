// Production packing for the five ranged classes; requires offline Sharp only.
const sharp=require('sharp'),fs=require('node:fs/promises');
const {read,extract,bodyBounds,bodyHeight,bodyCenter}=require('./atlas-packing.cjs');
function rowBounds(src,rows){
 const counts=[];
 for(let y=0;y<src.h;y++){
  let n=0;for(let x=0;x<src.w;x++)if(src.data[(y*src.w+x)*4+3]>30)n++;
  counts.push(n);
 }
 const bounds=[0];
 for(let row=1;row<rows;row++){
  const guess=row*src.h/rows,range=src.h/rows*.42;
  let best=Math.round(guess),score=Infinity;
  for(let y=Math.max(bounds.at(-1)+30,Math.floor(guess-range));y<Math.min(src.h-20,guess+range);y++){
   const value=counts[y]*100+Math.abs(y-guess);
   if(value<score){best=y;score=value;}
  }
  bounds.push(best);
 }
 return [...bounds,src.h];
}
(async()=>{
 const specs=JSON.parse(await fs.readFile(process.argv[2],'utf8')),CELL=144;
 for(const [kind,spec] of Object.entries(specs)){
  const dir='assets/heroes/'+kind;await fs.mkdir(dir,{recursive:true});
  const manifest={version:'0.28.0',columns:6,clips:['idle','walk','attack','special','dash','hurt','death'],frames:{}};
  let preview=[];
  for(const face of ['down','right','up','left']){
   if(!spec[face])continue;
   const cfg=typeof spec[face]==='string'?{file:spec[face]}:spec[face],src=await read(cfg.file);
   const count=(cfg.rows||7)*6,frames=extract(src,count,cfg.bounds||rowBounds(src,cfg.rows||7),6);
   let rows=Array.from({length:count/6},(_,r)=>frames.slice(r*6,r*6+6));
   if(cfg.extra){const extra=await read(cfg.extra.file);rows.splice(cfg.extra.clip,0,extract(extra,6,cfg.extra.bounds||[0,extra.h],6));}
   if(rows.length!==7)throw new Error('Missing clip '+kind+':'+face);
   for(const [r,order] of Object.entries(cfg.order||{})){const original=rows[r];rows[r]=order.map(i=>original[i]);}
   const scale=68/rows[0].map(bodyHeight).sort((a,b)=>a-b)[3],composite=[],metadata=[];
   for(let row=0;row<7;row++)for(let col=0;col<6;col++){
    const f=rows[row][col],w=Math.round(f.w*scale),h=Math.round(f.h*scale);
    if(w>CELL-4||h>CELL-4)throw new Error('Frame too large '+kind+':'+face+':'+row+':'+col+' '+w+'x'+h);
    const x=col*CELL+Math.floor((CELL-w)/2),y=row*CELL+Math.floor((CELL-h)/2),anchorX=Math.round(bodyCenter(f)*scale),anchorY=Math.round(bodyBounds(f).bottom*scale)-8;
    const png=await sharp(f.raw,{raw:{width:f.w,height:f.h,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
    composite.push({input:png,left:x,top:y});metadata.push({x,y,w,h,anchorX,anchorY,...(cfg.mirror?{flipX:true}:{})});
    if(face==='down'&&row===0)preview.push({input:png,left:col*96+48-anchorX,top:80-anchorY});
   }
   await sharp({create:{width:CELL*6,height:CELL*7,channels:4,background:'#00000000'}}).composite(composite).png({palette:true,colours:256,dither:0,compressionLevel:9,effort:10}).toFile(dir+'/'+face+'.png');
   manifest.frames[face]=metadata;
   console.log('PACKED',kind,face,42);
  }
  await sharp({create:{width:96*6,height:96,channels:4,background:'#00000000'}}).composite(preview).png({palette:true,colours:256,dither:0,compressionLevel:9,effort:10}).toFile(dir+'/preview.png');
  await fs.writeFile(dir+'/atlas.json',JSON.stringify(manifest));
 }
})();
