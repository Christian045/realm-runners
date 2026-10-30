// Offline production packing of layered aiming sprites. Requires Sharp.
// Usage: node tools/pack-aim-rigs.cjs glasscannon /path/to/source.png
const sharp=require('sharp'),fs=require('node:fs/promises');
const {read,extract,bodyHeight,bodyCenter}=require('./atlas-packing.cjs');
(async()=>{
 const [kind,file]=process.argv.slice(2),src=await read(file),cell=144;
 const bounds=[0];
 // Locate empty gutters near the expected five row boundaries.
 for(let r=1;r<5;r++){
  let best=Math.round(r*src.h/5),score=Infinity;
  for(let y=Math.round((r-.32)*src.h/5);y<(r+.32)*src.h/5;y++){
   let n=0;for(let x=0;x<src.w;x++)if(src.data[(y*src.w+x)*4+3]>30)n++;
   const s=n*100+Math.abs(y-r*src.h/5);if(s<score){best=y;score=s;}
  }bounds.push(best);
 }bounds.push(src.h);
 const frames=extract(src,30,bounds,6),scale=68/frames.slice(0,24).map(bodyHeight).sort((a,b)=>a-b)[12];
 const metadata={frames:{},weapons:[]},layers=[];
 for(let r=0;r<5;r++)for(let col=0;col<6;col++){
  const f=frames[r*6+col];let w,h,anchorX,anchorY;
  if(r<4){w=Math.round(f.w*scale);h=Math.round(f.h*scale);anchorX=Math.round(bodyCenter(f)*scale);anchorY=h-8;}
  else{
   // The weapon's grip is 14px from the stock/string hand; the emitting tip
   // shares its x coordinate with AIM_RIGS in src/hero-aim.js.
   if(kind==='glasscannon'){w=64;h=Math.round(f.h*w/f.w);anchorX=14;anchorY=Math.round(h*(col===3?.25:.43));}
   else{h=64;w=Math.round(f.w*h/f.h);anchorX=w-34;anchorY=Math.round(h*.50);}
  }
  const x=col*cell+Math.floor((cell-w)/2),y=r*cell+Math.floor((cell-h)/2);
  layers.push({input:await sharp(f.raw,{raw:{width:f.w,height:f.h,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:x,top:y});
  const entry={x,y,w,h,anchorX,anchorY};
  if(r<4)(metadata.frames[['down','right','up','left'][r]]??=[]).push(entry);else metadata.weapons.push(entry);
 }
 const dir='assets/heroes/'+kind;
 await sharp({create:{width:cell*6,height:cell*5,channels:4,background:'#00000000'}}).composite(layers).png({palette:true,colours:256,dither:0,compressionLevel:9,effort:10}).toFile(dir+'/aim.png');
 const manifest=JSON.parse(await fs.readFile(dir+'/atlas.json','utf8'));manifest.aimRig=metadata;await fs.writeFile(dir+'/atlas.json',JSON.stringify(manifest));
 console.log('Packed',kind,'30 layered poses',bounds);
})();
