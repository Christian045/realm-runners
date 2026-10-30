// Offline limb-atlas packing; browser has no Sharp/image processing dependency.
// Usage: node tools/pack-locomotion.cjs steel.png leather.png brass.png
const sharp=require('sharp'),fs=require('node:fs/promises');
const {read,extract}=require('./atlas-packing.cjs');
const {bladePolygon}=require('./knight-blade.cjs');
const styles=['steel','leather','brass'],faces=['down','right','up'];
function axis(f,from,to){let sum=0,n=0;for(let y=Math.floor(f.h*from);y<Math.ceil(f.h*to);y++)for(let x=0;x<f.w;x++)if(f.raw[(y*f.w+x)*4+3]>60){sum+=x;n++;}return n?sum/n:f.w/2;}
(async()=>{
 await fs.mkdir('assets/locomotion',{recursive:true});const kits={};
 for(let k=0;k<3;k++){
  const src=await read(process.argv[k+2]),frames=extract(src,24,[0,Math.round(src.h/3),Math.round(src.h*2/3),src.h],8),layers=[],meta={};
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
   const f=frames[row*8+col],scale=48/Math.max(...frames.map(x=>x.h)),w=Math.max(2,Math.round(f.w*scale)),h=Math.round(f.h*scale),x=col*64+Math.floor((64-w)/2),y=row*64;
   const png=await sharp(f.raw,{raw:{width:f.w,height:f.h,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();layers.push({input:png,left:x,top:y});
   (meta[faces[row]]??=[]).push({x,y,w,h,anchorX:+(axis(f,0,.08)*scale).toFixed(2),footX:+(axis(f,.88,1)*scale).toFixed(2)});
  }
  await sharp({create:{width:512,height:192,channels:4,background:'#00000000'}}).composite(layers).png({palette:true,colours:128,dither:0,compressionLevel:9,effort:10}).toFile('assets/locomotion/'+styles[k]+'.png');kits[styles[k]]=meta;
 }
 for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
  const dir=kind==='warrior'?'assets/knight':'assets/heroes/'+kind,style=kind==='warrior'?'steel':kind==='glasscannon'?'brass':'leather',a=JSON.parse(await fs.readFile(dir+'/atlas.json','utf8')),cols=kind==='warrior'?8:6;
  a.version='0.29.0';
  a.locomotion={file:(kind==='warrior'?'../':'../../')+'locomotion/'+style+'.png',frames:kits[style]};
  for(const face of ['down','right','up','left']){
   const {data,info}=await sharp(dir+'/'+face+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(kind==='warrior')for(const f of a.frames[face].slice(cols,cols*6)){const blade=bladePolygon(data,info.width,f);if(blade)f.blade=blade;else delete f.blade;}
   for(const f of a.frames[face].slice(cols,cols*2)){
    const centers=[];
    for(let y=Math.round(f.h*.16);y<f.h*.32;y++){
     let start=-1,best=[];
     for(let x=0;x<=f.w;x++){
      const opaque=x<f.w&&data[((f.y+y)*info.width+f.x+x)*4+3]>60;
      if(opaque&&start<0)start=x;
      if(!opaque&&start>=0){if(x-start>(best[1]||0)-(best[0]||0))best=[start,x];start=-1;}
     }
     if(best.length)centers.push((best[0]+best[1])/2);
    }
    centers.sort((a,b)=>a-b);f.walkRootX=+(centers[Math.floor(centers.length/2)]||f.anchorX).toFixed(2);
   }
  }
  if(kind==='warrior'){
   // Two short foreshortened blades join the gauntlet's steel pixels.
   // Reviewed UV polygons keep them separate from the replaced legs.
   a.frames.down[20].blade=[[50,34],[75,44],[73,49],[49,40]];
   a.frames.down[25].blade=[[0,32],[17,20],[21,24],[3,37]];
  }
  await fs.writeFile(dir+'/atlas.json',JSON.stringify(a));
 }
})();
