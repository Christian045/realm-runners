import {getMageProduction} from './mage-production.js?v=0.67.1';
import {HUNTER_STYLE_CELL,HUNTER_STYLE_ANCHOR,HUNTER_STYLE_COUNTS,
 HUNTER_STYLE_FACINGS,hunterStyleFacing,hunterMageBowLayout,
 recolorMagierToHunter,hunterStyledSample} from './hunter-magestyle.js?v=0.71.0';
const clamp=n=>Math.max(0,Math.min(1,n));
export const HUNTER_PRODUCTION_VERSION='0.71.0';
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
 const row=hunterStyleFacing(direction),count=HUNTER_STYLE_COUNTS[clip]||HUNTER_STYLE_COUNTS.idle;
 let frame=clip==='walk'?Math.floor(((((p.walkDistance||0)%96)+96)%96)/96*count):
  clip==='idle'?Math.floor(((((time%1.5)+1.5)%1.5)/1.5)*count):
  Math.min(count-1,Math.floor(progress*count));
 frame=Math.min(count-1,Math.max(0,frame));
 return {clip,row,frame,count,progress,direction};
}
const unit=(dx,dy,d)=>{
 const len=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 return len>1e-8?{x:dx/len,y:dy/len}:{x:d.x/fallback,y:d.y/fallback};
};
// Same integer pixel point in the fully painted bow and physics. Movement
// and all eight facings use the same body orientation and mirrored socket.
export function hunterProductionShot(p,action=p.heroAction){
 const pose=hunterPose(p,0,action);
 const bow=hunterMageBowLayout(pose.row,pose.clip,pose.frame);
 const x=Math.round(p.x)+(bow.tip.x-HUNTER_STYLE_ANCHOR.x);
 const y=Math.round(p.y)+(bow.tip.y-HUNTER_STYLE_ANCHOR.y);
 const mount={x:Math.round(p.x)+(bow.grip.x-HUNTER_STYLE_ANCHOR.x),
  y:Math.round(p.y)+(bow.grip.y-HUNTER_STYLE_ANCHOR.y)};
 const d=pose.direction,target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const aim=unit(target.x-x,target.y-y,d);
 return {x,y,mount,aim,angle:Math.atan2(aim.y,aim.x),reach:Math.hypot(x-mount.x,y-mount.y),
  face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}
async function loadMageBase(){
 const mage=getMageProduction();
 if(!mage)throw Error('Mage reference disabled');
 await mage.loading;
 if(!mage.ready)throw Error('Mage original 96px artwork missing');
 return {image:mage.image,locomotionImage:mage.locomotionImage};
}
export class HunterProductionAtlas{
 constructor(canvasFactory=null,sourceLoader=loadMageBase){
  this.ready=false;this.failed=false;this.action=null;this.walk=null;
  this.canvasFactory=canvasFactory||(()=>{
   if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(1,1);
   if(typeof document!=='undefined')return document.createElement('canvas');
   throw Error('Hunter drawing surface unavailable');
  });
  this.sourceLoader=sourceLoader;
  this.loading=this.load();
 }
 async load(){
  try{
   const {image,locomotionImage}=await this.sourceLoader();
   if(image.width!==1536||image.height!==768||
      locomotionImage.width!==864||locomotionImage.height!==768)
    throw Error('Production Magier source dimensions must be 96px 16×8 and 9×8');
   this.action=recolorMagierToHunter(image,this.canvasFactory);
   this.walk=recolorMagierToHunter(locomotionImage,this.canvasFactory);
   this.ready=true;
  }catch(error){
   this.failed=true;console.warn('Ranger/Magier style atlas unavailable; retaining safe fallback',error);
  }
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const pose=hunterPose(p,time);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  ctx.translate(Math.round(p.x)-HUNTER_STYLE_ANCHOR.x,Math.round(p.y)-HUNTER_STYLE_ANCHOR.y);
  hunterStyledSample(ctx,this.action,this.walk,pose.row,pose.clip,pose.frame);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);
  const scale=Math.min((width-4)/72,(height-4)/82);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(width/2-HUNTER_STYLE_ANCHOR.x*scale),
   Math.round(height*.9-HUNTER_STYLE_ANCHOR.y*scale));
  ctx.scale(scale,scale);
  const frame=Math.floor(((((time%1.5)+1.5)%1.5)/1.5)*6);
  hunterStyledSample(ctx,this.action,this.walk,0,'idle',frame);
  ctx.restore();return true;
 }
}
let singleton;
export function getHunterProduction(){
 if(!hunterProductionEnabled()||
  typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')return null;
 return singleton??=new HunterProductionAtlas();
}
export {HUNTER_STYLE_COUNTS as HUNTER_COUNTS,HUNTER_STYLE_FACINGS as HUNTER_ROWS};
