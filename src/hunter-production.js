import {HUNTER_SIZE,HUNTER_SCALE,HUNTER_FOOT,HUNTER_ROWS,HUNTER_COUNTS,
 hunterFacing,hunterBowLayout,bakeHunterSheets} from './hunter-pixel-art.js?v=0.69.0';
const clamp=n=>Math.max(0,Math.min(1,n));
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
  clip==='idle'?Math.floor(((((time%1.8)+1.8)%1.8)/1.8)*count):
  Math.min(count-1,Math.floor(progress*count));
 frame=Math.min(count-1,Math.max(0,frame));
 return {clip,row,frame,count,progress,direction};
}
const unit=(dx,dy,d)=>{
 const len=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 return len>1e-8?{x:dx/len,y:dy/len}:{x:d.x/fallback,y:d.y/fallback};
};
// The actual painted broadhead pixel is the gameplay emission position.
// Both regular shots and the seven-arrow volley use this shared geometry.
export function hunterProductionShot(p,action=p.heroAction){
 const pose=hunterPose(p,0,action),bow=hunterBowLayout(pose.row,pose.clip,pose.frame);
 const x=Math.round(p.x+(bow.tip.x-HUNTER_FOOT.x)*HUNTER_SCALE);
 const y=Math.round(p.y+(bow.tip.y-HUNTER_FOOT.y)*HUNTER_SCALE);
 const mx=Math.round(p.x+(bow.grip.x-HUNTER_FOOT.x)*HUNTER_SCALE);
 const my=Math.round(p.y+(bow.grip.y-HUNTER_FOOT.y)*HUNTER_SCALE);
 const d=pose.direction,target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const aim=unit(target.x-x,target.y-y,d);
 return {x,y,mount:{x:mx,y:my},aim,angle:Math.atan2(aim.y,aim.x),
  reach:Math.hypot(x-mx,y-my),
  face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}
export class HunterProductionAtlas{
 constructor(canvasFactory){
  this.ready=false;this.failed=false;this.sheets={};
  this.canvasFactory=canvasFactory||(()=>{
   if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(1,1);
   if(typeof document!=='undefined')return document.createElement('canvas');
   throw Error('No hunter drawing surface');
  });
  this.loading=this.load();
 }
 async load(){
  try{
   this.sheets=bakeHunterSheets(this.canvasFactory);
   this.ready=true;
  }catch(error){
   this.failed=true;
   console.warn('Jäger pixel atlas unavailable; retaining old fallback',error);
  }
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const pose=hunterPose(p,time),sheet=this.sheets[pose.clip],cell=HUNTER_SIZE;
  if(!sheet)return false;
  const x=Math.round(p.x-HUNTER_FOOT.x*HUNTER_SCALE);
  const y=Math.round(p.y-HUNTER_FOOT.y*HUNTER_SCALE);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  ctx.drawImage(sheet,pose.frame*cell,pose.row*cell,cell,cell,
   x,y,cell*HUNTER_SCALE,cell*HUNTER_SCALE);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);
  const scale=Math.min((width-2)/52,(height-2)/58);
  const sheet=this.sheets.idle,frame=Math.floor((((time%1.8)+1.8)%1.8)/1.8*6);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet,frame*72,0,72,72,
   Math.round(width/2-36*scale),Math.round(height-2-60*scale),
   72*scale,72*scale);
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
