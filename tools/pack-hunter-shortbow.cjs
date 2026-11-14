// Optional import: node tools/pack-hunter-shortbow.cjs /path/W.png /path/N.png
// Complete-body resampling only. The checked-in native 96px sources rebuild
// the opt-in W/E/N experiment independently from the released hunter artwork.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate}=require('./pack-hunter-original.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/heroes/hunter/shortbow-preview-0732');
const original=path.resolve(root,'../original-073');
const clips=['idle','walk','attack','special','dash','hurt','death'];
const names=['S','SW','W','NW','N'];
function hoodCentre(cell){
 const d=cell.c.getContext('2d').getImageData(0,0,cell.c.width,cell.c.height).data;
 let sum=0,n=0;
 for(let y=cell.t;y<cell.t+(cell.b-cell.t)*.45;y++)for(let x=cell.l;x<=cell.r;x++){
  const i=(y*cell.c.width+x)*4,r=d[i],g=d[i+1],b=d[i+2];
  if(d[i+3]&&g>r*.75&&g<r*1.15&&g>b*1.3){sum+=x;n++;}
 }
 return n?sum/n:cell.cx;
}
(async()=>{
 let anchors=JSON.parse(fs.readFileSync(path.join(root,'anchors.json')));
 if(process.argv[2])for(const [index,row] of [2,4].entries()){
  const image=await loadImage(process.argv[index+2]);
  const cells=clips.map((_,clip)=>Array.from({length:8},(_,frame)=>isolate(image,frame,clip)));
  // North needs two extra pixels above the raised arrow, using one fixed scale.
  const scale=(row===4?70:72)/(cells[0][0].b-cells[0][0].t+1),records=[];
  for(let clip=0;clip<7;clip++)for(let frame=0;frame<8;frame++){
   const ready=clip===0||clip>=2&&clip<=5&&(frame===0||frame===7)||clip===6&&frame===0;
   const c=ready?cells[0][0]:cells[clip][clip===6&&frame===7?6:frame];
   const w=Math.round((c.r-c.l+1)*scale),h=Math.round((c.b-c.t+1)*scale);
   const cx=clip===6&&frame>=3?(c.l+c.r)/2:clip>=4&&!ready?c.feetX:hoodCentre(c);
   records.push({clip,frame,c,w,h,x:Math.round(48+(c.l-cx)*scale),y:88-h});
  }
  const upright=records.filter(r=>r.clip!==6),min=Math.min(...upright.map(r=>r.x)),max=Math.max(...upright.map(r=>r.x+r.w));
  if(max-min>92)throw Error('Weapon exceeds complete facing width: '+names[row]+' '+[min,max]);
  const shift=min<2?2-min:max>94?94-max:0;anchors[row]=[48+shift,88];
  const native=createCanvas(768,672),g=native.getContext('2d');g.imageSmoothingEnabled=false;
  for(const r of records){
   const x=r.clip===6?Math.max(2,Math.min(94-r.w,r.x+shift)):r.x+shift;
   if(x<1||x+r.w>95||r.y<1)throw Error('Clipped shortbow cell '+names[row]+'/'+r.clip+'/'+r.frame+' '+[x,r.y,r.w,r.h]);
   const tile=createCanvas(96,96),t=tile.getContext('2d');t.imageSmoothingEnabled=false;
   t.drawImage(r.c.c,r.c.l,r.c.t,r.c.r-r.c.l+1,r.c.b-r.c.t+1,x,r.y,r.w,r.h);
   // Nearest-neighbour reduction can drop a single thin source-sole pixel.
   // Align the rendered WHOLE sprite, without separating or extending feet.
   const d=t.getImageData(0,0,96,96).data;let bottom=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(d[(y*96+x)*4+3])bottom=y;
   g.drawImage(tile,r.frame*96,r.clip*96+87-bottom);
  }
  fs.writeFileSync(path.join(root,'source-'+names[row]+'.png'),native.toBuffer('image/png'));
 }
 anchors[6]=[95-anchors[2][0],88];
 for(let clip=0;clip<7;clip++){
  const sheet=createCanvas(768,768),g=sheet.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(await loadImage(path.join(original,clips[clip]+'.png')),0,0);
  for(const row of [2,4]){
   const native=await loadImage(path.join(root,'source-'+names[row]+'.png'));
   g.clearRect(0,row*96,768,96);g.drawImage(native,0,clip*96,768,96,0,row*96,768,96);
  }
  g.clearRect(0,576,768,96);g.save();g.translate(768,576);g.scale(-1,1);
  for(let frame=0;frame<8;frame++)g.drawImage(sheet,frame*96,192,96,96,(7-frame)*96,0,96,96);
  g.restore();fs.writeFileSync(path.join(root,clips[clip]+'.png'),sheet.toBuffer('image/png'));
 }
 fs.writeFileSync(path.join(root,'anchors.json'),JSON.stringify(anchors)+'\n');
 console.log('Packed opt-in shortbow W/E/N; other facings copied unchanged. Anchors: '+JSON.stringify(anchors));
})().catch(error=>{console.error(error);process.exitCode=1;});
