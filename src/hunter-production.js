import {HUNTER_ANCHORS} from './hunter-anchors.js?v=0.73.1';
import {HUNTER_SOCKETS} from './hunter-sockets.js?v=0.73.1';
import {hunterShortbowPreviewEnabled,SHORTBOW_ANCHORS,SHORTBOW_SOCKETS} from './hunter-shortbow.js?v=0.73.2';

// Original whole-body artwork. No mage images, palette conversion or runtime limbs.
export const HUNTER_PRODUCTION_VERSION='0.73.1';
export const HUNTER_CELL=96;
export const HUNTER_ANCHOR=Object.freeze({x:48,y:88});
export const HUNTER_SCALE=1;
export const hunterAnchor=(row,shortbow=hunterShortbowPreviewEnabled())=>{const a=(shortbow?SHORTBOW_ANCHORS:HUNTER_ANCHORS)[row];return {x:a[0],y:a[1]};};
export const HUNTER_ROWS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
export const HUNTER_COUNTS=Object.freeze({idle:8,walk:8,attack:8,special:8,dash:8,hurt:8,death:8});
export const HUNTER_STRIDE=96;
export const hunterFacing=d=>((Math.round((Math.atan2(d?.y??1,d?.x??0)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
const clamp=n=>Math.max(0,Math.min(1,n));
export const hunterProductionEnabled=(params=typeof location!=='undefined'?new URLSearchParams(location.search):null)=>
 !params?.has('legacyHeroArt')&&!params?.has('oldHunterArt');

export function hunterPose(p,time=0,action=p.heroAction){
 let clip=action?.clip||(p.hurtTimer>0?'hurt':p.moving?'walk':'idle');
 if(!Object.hasOwn(HUNTER_COUNTS,clip))clip='idle';
 let progress=action?clamp((action.elapsed||0)/Math.max(.001,action.duration||1)):0;
 if(p.hp<=0){clip='death';progress=clamp((p.heroDeathElapsed||0)/1.04);}
 else if(clip==='hurt'&&!action)progress=clamp(1-(p.hurtTimer||0)/.34);
 const direction=(clip==='death'?p.heroDeathDirection:action?.direction)||
  (clip==='walk'?p.heroMoveDirection:null)||p.direction||{x:0,y:1};
 const row=hunterFacing(direction),count=HUNTER_COUNTS[clip];
 const phase=clip==='walk'?((((p.hunterWalkDistance??p.walkDistance??0)%HUNTER_STRIDE)+HUNTER_STRIDE)%HUNTER_STRIDE)/HUNTER_STRIDE:
  clip==='idle'?(((time%2.4)+2.4)%2.4)/2.4:progress;
 return {clip,row,frame:Math.min(count-1,Math.floor(phase*count)),count,progress,direction};
}

// Authored arrow-tip and bow-grip measurements in the final 96px sheets.
// At release (1/2) the arrow leaves the last drawn tip (full-draw column 3).
export function hunterProductionShot(p,action=p.heroAction,shortbow=hunterShortbowPreviewEnabled()){
 const pose=hunterPose(p,0,action),anchor=hunterAnchor(pose.row,shortbow);
 const clip=pose.clip==='special'?'special':'attack';
 const socket=(shortbow?SHORTBOW_SOCKETS[clip][pose.row]:null)||HUNTER_SOCKETS[clip][pose.row];
 const x=Math.round(p.x)+socket.tip[0]-anchor.x;
 const y=Math.round(p.y)+socket.tip[1]-anchor.y;
 const mount={x:Math.round(p.x)+socket.grip[0]-anchor.x,
  y:Math.round(p.y)+socket.grip[1]-anchor.y};
 const d=pose.direction,target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const dx=target.x-x,dy=target.y-y,length=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 const aim=length>1e-8?{x:dx/length,y:dy/length}:{x:d.x/fallback,y:d.y/fallback};
 return {x,y,mount,aim,angle:Math.atan2(aim.y,aim.x),reach:Math.hypot(x-mount.x,y-mount.y),
  face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}

async function loadSheet(clip,shortbow){
 const image=new Image();image.decoding='async';
 if(shortbow)image.crossOrigin='anonymous';
 await new Promise((resolve,reject)=>{
  image.onload=resolve;image.onerror=()=>reject(Error('Missing original Jäger sheet: '+clip));
  const folder=shortbow?'shortbow-preview-0732':'original-073';
  image.src=new URL('../assets/heroes/hunter/'+folder+'/'+clip+'.png?v='+HUNTER_PRODUCTION_VERSION,import.meta.url).href;
 });
 await image.decode?.();return image;
}
export class HunterProductionAtlas{
 constructor(imageLoader,shortbow=hunterShortbowPreviewEnabled()){this.shortbow=shortbow;this.ready=false;this.failed=false;this.sheets={};this.loading=this.load(imageLoader||((clip)=>loadSheet(clip,shortbow)));}
 async load(imageLoader){
  try{
   const sheets=await Promise.all(Object.entries(HUNTER_COUNTS).map(async([clip,count])=>{
    const image=await imageLoader(clip);
    if(image.width!==count*HUNTER_CELL||image.height!==HUNTER_ROWS.length*HUNTER_CELL)
     throw Error('Invalid original Jäger sheet dimensions: '+clip);
    return [clip,image];
   }));
   this.sheets=Object.fromEntries(sheets);this.ready=true;
  }catch(error){this.failed=true;console.warn('Original Jäger artwork unavailable; retaining fallback',error);}
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const pose=hunterPose(p,time),anchor=hunterAnchor(pose.row,this.shortbow);
  const stretch=pose.clip==='idle'?1+(1-Math.cos(time*Math.PI*2/2.8))*.0045:1;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  ctx.drawImage(this.sheets[pose.clip],pose.frame*HUNTER_CELL,pose.row*HUNTER_CELL,HUNTER_CELL,HUNTER_CELL,
   Math.round(p.x)-anchor.x,Math.round(p.y)-anchor.y*stretch,HUNTER_CELL,HUNTER_CELL*stretch);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);
  const scale=Math.min(width/100,height/100);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(width/2,height*.9);ctx.scale(scale,scale);
  this.draw(ctx,{kind:'hunter',x:0,y:0,hp:100,direction:{x:0,y:1}},time);
  ctx.restore();return true;
 }
}
let singleton;
export function getHunterProduction(){
 if(!hunterProductionEnabled()||typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return null;
 return singleton??=new HunterProductionAtlas();
}
