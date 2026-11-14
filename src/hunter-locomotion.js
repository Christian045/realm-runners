import {hunterPose,HUNTER_STRIDE} from './hunter-motion.js?v=0.73.4';
import {advanceLocomotion} from './locomotion.js?v=0.73.4';
import {CLASSES,normalized} from './data.js?v=0.23.0';

export {HUNTER_STRIDE};
export const HUNTER_LOCOMOTION_VERSION='0.73.4-trial';
export const HUNTER_LOCOMOTION_ANCHOR=Object.freeze({x:48,y:88});
export function hunterLocomotionPose(p){
 if(p.hp<=0||p.heroAction||p.hurtTimer>0)return null;
 const pose=hunterPose(p,0,null);
 return pose.clip==='idle'||pose.clip==='walk'?pose:null;
}
// Same class speed and actual-distance gait clock as the game. No diagonal boost.
export function advanceHunterLocomotion(p,movement,dt){
 const x=p.x,y=p.y,amount=Math.min(1,Math.hypot(movement.x,movement.y));
 const d=normalized(movement.x,movement.y),distance=CLASSES.hunter.speed*dt*amount;
 p.x+=d.x*distance;p.y+=d.y*distance;
 if(amount>.01)p.direction={...d};
 advanceLocomotion(p,x,y,false,dt);
 return Math.hypot(p.x-x,p.y-y);
}
async function loadSheet(clip){
 const image=new Image();image.decoding='async';image.crossOrigin='anonymous';
 const path=clip==='idle'?'identity-idle-0733/idle.png':'identity-locomotion-0734/walk.png';
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Hunter locomotion asset missing: '+clip));image.src=new URL('../assets/heroes/hunter/'+path,import.meta.url).href;});
 await image.decode?.();return image;
}
// Only idle/walk are provided by this work stage. The class never substitutes
// an old differently dressed hunter for an unavailable combat animation.
export class HunterLocomotionAtlas{
 constructor(loader=loadSheet){this.ready=false;this.failed=false;this.sheets={};this.loading=this.load(loader);}
 async load(loader){
  try{
   const [idle,walk]=await Promise.all([loader('idle'),loader('walk')]);
   if(idle.width!==768||idle.height!==96||walk.width!==768||walk.height!==768)throw Error('Invalid hunter locomotion atlas dimensions');
   this.sheets={idle,walk};this.ready=true;
  }catch(error){this.failed=true;this.error=error;}
 }
 draw(ctx,p){
  const pose=hunterLocomotionPose(p);if(!this.ready||!pose)return false;
  const walking=pose.clip==='walk',sx=(walking?pose.frame:pose.row)*96,sy=walking?pose.row*96:0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.sheets[pose.clip],sx,sy,96,96,Math.round(p.x)-48,Math.round(p.y)-88,96,96);
  ctx.restore();return true;
 }
}
