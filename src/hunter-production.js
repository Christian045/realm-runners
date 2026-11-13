import {HUNTER_CELL,HUNTER_ANCHOR,HUNTER_COUNTS,HUNTER_ROWS,
 HUNTER_BOW_HINTS,hunterFacing,hunterIllustratedCell,hunterSocketFromPixels} from './hunter-illustrated.js?v=0.70.0';
const clamp=n=>Math.max(0,Math.min(1,n));
export const HUNTER_PRODUCTION_VERSION='0.70.0';
export const HUNTER_SCALE=1;
export const hunterProductionEnabled=(params=typeof location!=='undefined'?new URLSearchParams(location.search):null)=>
 !params?.has('legacyHeroArt')&&!params?.has('oldHunterArt');
export function hunterPose(p,time=0,action=p.heroAction){
 let clip=action?.clip||(p.hurtTimer>0?'hurt':p.moving?'walk':'idle');
 let progress=action?clamp((action.elapsed||0)/Math.max(.001,action.duration||1)):0;
 if(p.hp<=0){clip='death';progress=clamp((p.heroDeathElapsed||0)/1.04);}
 else if(clip==='hurt')progress=clamp(1-(p.hurtTimer||0)/.34);
 const direction=(clip==='death'?p.heroDeathDirection:action?.direction)||
  (clip==='walk'?p.heroMoveDirection:null)||p.direction||{x:0,y:1};
 const row=hunterFacing(direction),count=HUNTER_COUNTS[clip]||HUNTER_COUNTS.idle;
 let frame=clip==='walk'?
  Math.floor(((((p.walkDistance||0)%72)+72)%72)/72*count):
  clip==='idle'?Math.floor(((((time%1.5)+1.5)%1.5)/1.5)*count):
  Math.min(count-1,Math.floor(progress*count));
 frame=Math.min(count-1,Math.max(0,frame));
 return {clip,row,frame,count,progress,direction};
}
const unit=(dx,dy,d)=>{
 const len=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 return len>1e-8?{x:dx/len,y:dy/len}:{x:d.x/fallback,y:d.y/fallback};
};
// The release socket is located on the *painted* bow. The fallback hint is
// used only before the illustrated sheets finish loading in the browser or
// when headless gameplay tests run without any DOM drawing surface.
export function hunterProductionShot(p,action=p.heroAction,atlas=singleton){
 const pose=hunterPose(p,0,action),clip=pose.clip==='special'?'special':'attack';
 const tip=atlas?.ready?atlas.sockets[clip]?.[pose.row]:null;
 const [hx,hy]=tip?[tip.x,tip.y]:HUNTER_BOW_HINTS[pose.row];
 const x=Math.round(p.x+(hx-HUNTER_ANCHOR.x)*HUNTER_SCALE),
  y=Math.round(p.y+(hy-HUNTER_ANCHOR.y)*HUNTER_SCALE);
 const d=pose.direction,target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const aim=unit(target.x-x,target.y-y,d);
 const mount={x:x-Math.round(aim.x*8),y:y-Math.round(aim.y*8)};
 return {x,y,mount,aim,angle:Math.atan2(aim.y,aim.x),
  reach:Math.hypot(x-mount.x,y-mount.y),
  face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}
async function loadIllustratedSources(){
 const base=new URL('../assets/heroes/hunter/',import.meta.url);
 const manifestResponse=await fetch(new URL('atlas.json?v=0.29.0',base));
 if(!manifestResponse.ok)throw Error('Hunter illustrated manifest unavailable');
 const manifest=await manifestResponse.json(),images={};
 await Promise.all(['down','left','up','right'].map(async face=>{
  const img=new Image();img.decoding='async';
  await new Promise((resolve,reject)=>{
   img.onload=resolve;img.onerror=()=>reject(Error('Hunter illustration missing: '+face));
   img.src=new URL(face+'.png?v=0.28.0',base).href;
  });
  await img.decode?.();
  if(img.naturalWidth!==864||img.naturalHeight!==1008)
   throw Error('Invalid hunter illustration dimensions '+face);
  images[face]=img;
 }));
 return {manifest,images};
}
export class HunterProductionAtlas{
 constructor(canvasFactory=null,sourceLoader=loadIllustratedSources){
  this.ready=false;this.failed=false;this.sockets={};this.manifest=null;this.images=null;
  this.canvasFactory=canvasFactory||(()=>{
   if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(1,1);
   if(typeof document!=='undefined')return document.createElement('canvas');
   throw Error('No hunter drawing surface');
  });
  this.sourceLoader=sourceLoader;
  this.loading=this.load();
 }
 async load(){
  try{
   const {manifest,images}=await this.sourceLoader();
   this.manifest=manifest;this.images=images;
   // Only a single 120px scratch cell is needed to measure the real
   // painted bow. Do not retain 7 giant redundant atlas copies in RAM:
   // WebKit/mobile can exhaust its graphics process when changing class.
   const scratch=this.canvasFactory();scratch.width=HUNTER_CELL;scratch.height=HUNTER_CELL;
   const ctx=scratch.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('Hunter socket canvas unavailable');
   for(const clip of ['attack','special']){
    this.sockets[clip]=[];
    for(let row=0;row<8;row++){
     ctx.clearRect(0,0,HUNTER_CELL,HUNTER_CELL);
     hunterIllustratedCell(ctx,manifest,images,row,clip,3);
     this.sockets[clip][row]=hunterSocketFromPixels(
      ctx.getImageData(0,0,HUNTER_CELL,HUNTER_CELL).data,HUNTER_BOW_HINTS[row]);
    }
   }
   this.ready=true;
  }catch(error){
   this.failed=true;
   console.warn('High-detail hunter art unavailable; retaining legacy fallback',error);
  }
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const pose=hunterPose(p,time);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  ctx.translate(Math.round(p.x-HUNTER_ANCHOR.x*HUNTER_SCALE),
   Math.round(p.y-HUNTER_ANCHOR.y*HUNTER_SCALE));
  if(HUNTER_SCALE!==1)ctx.scale(HUNTER_SCALE,HUNTER_SCALE);
  hunterIllustratedCell(ctx,this.manifest,this.images,pose.row,pose.clip,pose.frame);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);
  const scale=Math.min((width-6)/90,(height-4)/82);
  const frame=Math.floor(((((time%1.5)+1.5)%1.5)/1.5)*6);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(width/2-HUNTER_ANCHOR.x*scale),
   Math.round(height*.9-HUNTER_ANCHOR.y*scale));
  ctx.scale(scale,scale);
  hunterIllustratedCell(ctx,this.manifest,this.images,0,'idle',frame);
  ctx.restore();return true;
 }
}
let singleton;
export function getHunterProduction(){
 if(!hunterProductionEnabled()||
  typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return null;
 return singleton??=new HunterProductionAtlas();
}
export {HUNTER_COUNTS,HUNTER_ROWS};
