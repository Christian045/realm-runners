import {knightProductionEnabled,loadKnightProductionSheets,KNIGHT_PRODUCTION_SCALE} from './knight-production.js?v=0.58.1';
import {knightPose,KNIGHT_CLIPS} from './knight-animation.js?v=0.58.1';
import {rigFacing} from './articulated-hero.js?v=0.40.0';
import {knightPreviewActionFrame,knightPreviewPresentationFrame,knightBreathingRect} from './knight-preview-motion.js?v=0.58.1';
import {KNIGHT_REBORN_FRAME_COUNTS,createKnightRebornSheets} from './knight-reborn.js?v=0.49.0';
import {loadKnightNorthReviewSheets,KNIGHT_NORTH_051} from './knight-north-051.js?v=0.53.1';
import {loadKnightSideReviewSheets,KNIGHT_SIDE_053} from './knight-side-053.js?v=0.53.1';

// The default renderer uses the unified 0.54 illustrated set.
// Earlier directional studies remain available through their historical flags.
export const KNIGHT_SHEET_CELL=144;
export const KNIGHT_SHEET_ANCHOR=Object.freeze({x:72,y:118});
export const KNIGHT_SHEET_FRAMES=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10
});
export const KNIGHT_SHEET_ROWS=8;
const allFrames=KNIGHT_REBORN_FRAME_COUNTS;
const clipFor=clip=>Object.hasOwn(allFrames,clip)?clip:'idle';
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

export function knightFinalFrame(p,time=0,fullPreview=false){
 const pose=knightPose(p,time);
 const clip=clipFor(pose.clip),count=allFrames[clip];
 // Impact remains fixed to the gameplay's action-local hit clock, including
 // the ten-frame finisher whose contact is frame five.
 // The action animator reports capped progress after one loop. Use the
 // unbounded gait phase and absolute idle clock to prevent frozen motion.
 const idleDuration=KNIGHT_CLIPS.idle.duration;
 const idlePhase=((time%idleDuration)+idleDuration)%idleDuration;
 const idleIndex=Math.floor(idlePhase/idleDuration*count);
 // Review-only wind-up, contact and follow-through timings. Combat hit
 // clocks and the stable default artwork remain untouched.
 const previewIndex=fullPreview?knightPreviewActionFrame(clip,pose.progress):null;
 const index=previewIndex!==null?previewIndex:
  clip==='walk'?pose.frame%count:
  clip==='idle'?idleIndex:
  clamp(Math.floor(pose.progress*count),0,count-1);
 return {clip,row:rigFacing(pose.direction),index,count,pose};
}

// Legacy diagnostic helper. Production does not read or normalize old sprites.
// The earlier walking sheet contains a drastically undersized first frame in
// some facings. Normalize it to the measured reference body *once at load*,
// not by stretching a character on every draw. The other seven distinct gait
// frames, including their alternating greaves, remain untouched.
export function prepareKnightWalkSheet(image,canvasFactory=null){
 if(!image||!canvasFactory&&typeof document==='undefined')return image;
 const canvas=()=>canvasFactory?canvasFactory():document.createElement('canvas');
 const source=canvas(),out=canvas(),cell=KNIGHT_SHEET_CELL;
 source.width=out.width=cell*8;source.height=out.height=cell*8;
 const ctx=source.getContext('2d',{willReadFrequently:true}),g=out.getContext('2d');
 if(!ctx||!g)return image;
 ctx.imageSmoothingEnabled=false;g.imageSmoothingEnabled=false;
 ctx.drawImage(image,0,0);
 // Each cell is transparent. Count alpha pixels to locate the full body,
 // including both boots, without using a sword tip to calculate body height.
 const bounds=(row,index)=>{
  const data=ctx.getImageData(index*cell,row*cell,cell,cell).data;
  let left=cell,top=cell,right=-1,bottom=-1;
  for(let y=20;y<cell;y++)for(let x=20;x<cell-12;x++){
   if(data[(y*cell+x)*4+3]<70)continue;
   if(x<left)left=x;if(x>right)right=x;
   if(y<top)top=y;if(y>bottom)bottom=y;
  }
  return right<left?null:{left,top,right,bottom,w:right-left+1,h:bottom-top+1,center:(left+right)/2};
 };
 const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 for(let row=0;row<KNIGHT_SHEET_ROWS;row++){
  const reference=Array.from({length:7},(_,i)=>bounds(row,i+1)).filter(Boolean);
  if(!reference.length){g.drawImage(image,0,row*cell,8*cell,cell,0,row*cell,8*cell,cell);continue;}
  const height=median(reference.map(b=>b.h)),
    floor=median(reference.map(b=>b.bottom)),
    center=median(reference.map(b=>b.center));
  for(let frame=0;frame<8;frame++){
   const b=bounds(row,frame);
   if(!b)continue;
   // A small first frame breaks gait continuity; reframe it to match the
   // exact head/boot dimensions of adjacent hand-painted gait cells.
   const scale=frame===0&&b.h<height*.87?
    Math.min(1.6,height/b.h):1;
   const dx=frame===0?center-b.center*scale:
    Math.max(-3,Math.min(3,center-b.center));
   const dy=frame===0?floor-b.bottom*scale:0;
   g.drawImage(image,frame*cell,row*cell,cell,cell,
    frame*cell+Math.round(dx),row*cell+Math.round(dy),cell*scale,cell*scale);
  }
 }
 return out;
}


// Illustrated knight art, extracted from the approved style direction.
// The 73 individual South action poses are real raster art. The seven other
// directions currently have their own painted base silhouettes, but NOT
// unique action-frame sequences: do not describe this as 584 finished poses.
export const KNIGHT_PAINTED_050=Object.freeze({
 source:'assets/knight/painted-050/',
 southFrames:73,distinctFacingIllustrations:8,
 fullyAnimatedFacings:['S'],
 incompleteFacings:['SW','W','NW','N','NE','E','SE']
});
const PAINTED_COUNTS=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 recovery:6,special:8,dash:6,hurt:5,death:8
});
// The release clocks in 0.49 hit at frames 3/4/4/3. Place the
// photographed contact pose at those SAME frames, without moving damage events.
const PAINTED_FRAME_ORDER=Object.freeze({
 attack1:[0,1,2,4,5,6,7,7],
 attack3:[0,1,2,3,5,6,7,8,9,9],
 special:[0,1,2,4,5,6,7,7],
 dash:[0,1,2,3,4,5,5,5],
 hurt:[0,1,2,3,4,4]
});
async function loadPaintedKnightSheets(factory){
 const names=[...Object.keys(PAINTED_COUNTS),'facings'];
 const images=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.decoding='async';
  image.onload=()=>resolve([name,image]);
  image.onerror=()=>reject(new Error('Illustrated knight asset missing: '+name));
  image.src=new URL('../assets/knight/painted-050/'+name+'.png?v=0.50.0',import.meta.url).href;
 })));
 const originals=Object.fromEntries(images),out={};
 const facings=originals.facings;
 if((facings.naturalWidth||facings.width)!==72*8||
    (facings.naturalHeight||facings.height)!==72)
  throw new Error('The eight knight facing portraits have an invalid size');
 for(const [clip,count] of Object.entries(KNIGHT_REBORN_FRAME_COUNTS)){
  const picture=originals[clip],sourceFrames=PAINTED_COUNTS[clip];
  if((picture.naturalWidth||picture.width)!==72*sourceFrames||
     (picture.naturalHeight||picture.height)!==72)
   throw new Error('Illustrated knight '+clip+' has wrong frame dimensions');
  const sheet=factory();
  sheet.width=count*72;sheet.height=8*72;
  const ctx=sheet.getContext('2d');
  if(!ctx)throw new Error('Knight illustrated sprite canvas unavailable');
  ctx.imageSmoothingEnabled=false;
  for(let frame=0;frame<count;frame++){
   const index=PAINTED_FRAME_ORDER[clip]?.[frame]??Math.min(sourceFrames-1,frame);
   // Paint the complete South body/frame, not individual rotated rectangles.
   ctx.drawImage(picture,index*72,0,72,72,frame*72,0,72,72);
   // All remaining headings stay visually consistent with their own authored
   // directional portrait. A later art pass must replace these static cells.
   for(let direction=1;direction<8;direction++)
    ctx.drawImage(facings,direction*72,0,72,72,
     frame*72,direction*72,72,72);
  }
  out[clip]=sheet;
 }
 return out;
}

export class KnightFinalAtlas {
 constructor(canvasFactory=null){
  this.images={};this.frames=new Map();this.imageReady=false;
  this.ready=false;this.failed=false;
  this.canvasFactory=canvasFactory;
  this.presentationStates=new WeakMap();
  this.loading=this.load();
 }
 async load(){
  const factory=this.canvasFactory||(()=>{
   if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(1,1);
   if(typeof document!=='undefined')return document.createElement('canvas');
   throw new Error('No drawing surface for the new knight');
  });
  try{
   const params=typeof window!=='undefined'?new URLSearchParams(window.location.search):null;
   const allDirectionsPreview=params?.has('previewKnight053');
   const production=knightProductionEnabled(params);
   const northPreview=params?.has('previewKnightUp')||allDirectionsPreview;
   const preview=params?.has('previewPaintedKnight')||northPreview;
   if(production&&typeof Image!=='undefined'){
    this.images=await loadKnightProductionSheets();
    this.production=true;this.reviewScale=KNIGHT_PRODUCTION_SCALE;
   }else if(northPreview&&typeof Image!=='undefined'){
    const base=await loadPaintedKnightSheets(factory);
    const north=await loadKnightNorthReviewSheets(factory,base);
    this.images=allDirectionsPreview?
     await loadKnightSideReviewSheets(factory,north):north;
    this.reviewScale=allDirectionsPreview?
     KNIGHT_SIDE_053.previewScale:KNIGHT_NORTH_051.previewScale;
    this.completePreview=Boolean(allDirectionsPreview);
   }else this.images=preview&&typeof Image!=='undefined'?
    await loadPaintedKnightSheets(factory):createKnightRebornSheets(factory);
   this.imageReady=true;this.ready=true;
  }catch(error){
   this.failed=true;
   this.production=false;this.completePreview=false;this.reviewScale=1;
   this.images=createKnightRebornSheets(factory);
   this.ready=true;
   console.warn('Knight atlas unavailable; using built-in frames',error);
  }
 }
 frame(row,clip,index){
  clip=clipFor(clip);
  if(!this.ready)return null;
  const count=allFrames[clip];
  row=clamp(Math.floor(row),0,7);
  index=clamp(Math.floor(index),0,count-1);
  const key=clip+':'+row+':'+index;
  if(this.frames.has(key))return this.frames.get(key);
  const canvas=this.canvasFactory?this.canvasFactory():
   typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(144,144):
   document.createElement('canvas');
  canvas.width=canvas.height=144;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  const cell=KNIGHT_SHEET_CELL;
  g.drawImage(this.images[clip],index*72,row*72,72,72,0,0,cell,cell);
  if(this.frames.size>=16)this.frames.delete(this.frames.keys().next().value);
  this.frames.set(key,canvas);
  return canvas;
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const fullPreview=Boolean(this.completePreview||this.production);
  let presentation=knightFinalFrame(p,time,fullPreview);
  if(fullPreview&&!Number.isFinite(p.knightPreviewProgress)){
   let state=this.presentationStates.get(p);
   if(!state){state={};this.presentationStates.set(p,state);}
   presentation=knightPreviewPresentationFrame(p,time,presentation,state,this.production?88:undefined);
  }
  const {clip,row,index}=presentation,c=KNIGHT_SHEET_CELL;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  const scale=this.reviewScale||1;
  let rect={x:Math.round(p.x-KNIGHT_SHEET_ANCHOR.x*scale),
   y:Math.round(p.y-KNIGHT_SHEET_ANCHOR.y*scale),
   width:Math.round(c*scale),height:Math.round(c*scale)};
  if(this.production&&clip==='idle'){
   rect=knightBreathingRect(rect.x,rect.y,rect.width,rect.height,
    presentation.idleSeconds??time);
  }
  ctx.drawImage(this.images[clip],index*72,row*72,72,72,
   rect.x,rect.y,rect.width,rect.height);
  ctx.restore();
  return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  if(this.production){
   const scale=Math.min((width-4)/52,(height-4)/52);
   ctx.clearRect(0,0,width,height);ctx.save();ctx.imageSmoothingEnabled=false;
   ctx.drawImage(this.images.idle,(Math.floor(time*4)%6)*72,0,72,72,
    Math.round(width/2-36*scale),Math.round(height-2-61*scale),
    Math.round(72*scale),Math.round(72*scale));
   ctx.restore();return true;
  }
  const c=KNIGHT_SHEET_CELL,scale=Math.min(width/64,height/74)*(this.reviewScale||1);
  ctx.clearRect(0,0,width,height);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.images.idle,(Math.floor(time*4)%6)*72,0,72,72,
   Math.round(width*.5-72*scale),
   Math.round(height*.86-118*scale),144*scale,144*scale);
  ctx.restore();return true;
 }
}
let singleton=null;
export const getKnightFinal=()=>singleton??(singleton=new KnightFinalAtlas());
