import {rigWalkFeet,RIG_WALK_STRIDE} from './rig-walk.js?v=0.40.0';
import {combatChoreography,rotateCombatPoint} from './combat-choreography.js?v=0.40.0';
// Directional painted parts with stable anatomical anchors. Only limbs and the
// weapon articulate; attack states never rotate or replace the whole character.
export const RIG_KINDS=['warrior','mage','summoner','hunter','glasscannon','alchemist'];
export const RIG_ROWS=['S','SW','W','NW','N','NE','E','SE'];
const readyKinds=new Set();
export const heroRigReady=kind=>readyKinds.has(kind);
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const unit=d=>{const n=Math.hypot(d?.x||0,d?.y||0);return n?{x:d.x/n,y:d.y/n}:{x:0,y:1}};
export const rigFacing=d=>(Math.round((Math.atan2(d?.y??1,d?.x??0)-Math.PI/2)/(Math.PI/4))+8)%8;
export function articulatedPose(p,time=0){
 const action=p.kind==='warrior'?p.knightAction:p.heroAction;
 let clip=action?.clip||((p.hurtTimer||0)>0?'hurt':p.moving?'walk':'idle');
 let progress=action?clamp(action.elapsed/action.duration):clip==='hurt'?clamp(1-p.hurtTimer/.34):(time%1.6)/1.6;
 if(p.hp<=0){clip='death';progress=clamp((p.knightDeathElapsed??p.heroDeathElapsed??0)/1.04);}
 const direction=unit(action?.direction||(clip==='walk'?(p.heroMoveDirection||p.knightMoveDirection):null)||p.direction),row=rigFacing(direction);
 const face={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
 const phase=((p.walkDistance||0)/RIG_WALK_STRIDE)%1;
 return {clip,progress,direction,face,row,action,phase,moving:p.moving&&clip!=='dash'&&clip!=='death',time};
}
export function articulatedSockets(p,pose=articulatedPose(p)){
 const {clip,progress:t,direction:d,face:f}=pose;
 const motion=combatChoreography(p.kind,clip,t,d);
 const attacking=/attack|special|cast/.test(clip);
 const hit=motion.hit;
 const amount=motion.active?motion.extend:
  attacking?(t<hit?ease(t/hit):1-ease((t-.65)/.35)):0;
 // Summoner uses the visible right sleeve as its dominant casting hand in
 // every state, so the palm can actually extend outside the robe silhouette.
 const side={x:-f.y,y:f.x*.55},handedness=p.kind==='summoner'?-1:1;
 const shoulderBase={x:side.x*12*handedness,y:-43+side.y*12*handedness};
 const otherBase={x:-shoulderBase.x,y:-43-(shoulderBase.y+43)};
 let wrist={x:shoulderBase.x+side.x*2,y:shoulderBase.y+23};
 let other={x:otherBase.x,y:otherBase.y+26},angle=-Math.PI/2,reach=0;
 if(p.kind==='warrior'){
  const swordOffset=motion.active?motion.sword:.85;
  angle=Math.atan2(d.y,d.x)+swordOffset;
  const extra=motion.active?motion.handSide:0;
  wrist={x:shoulderBase.x+d.x*(7+amount*9)+side.x*(2+extra),
   y:shoulderBase.y+12+d.y*(5+amount*9)-(motion.active?motion.lift:0)};
  other={x:otherBase.x-d.x*(3+motion.impact*3),y:otherBase.y+22+motion.wind*3};
  reach=36;
 }else if(['hunter','glasscannon'].includes(p.kind)){
  wrist={x:0,y:-38};angle=Math.atan2(d.y,d.x);
  if(pose.action?.target)angle=Math.atan2(pose.action.target.y-p.y-wrist.y,pose.action.target.x-p.x-wrist.x);
  const recoil=p.kind==='glasscannon'&&attacking&&t>.5?4*Math.sin(clamp((t-.5)/.2)*Math.PI):0;
  wrist.x-=Math.cos(angle)*recoil;wrist.y-=Math.sin(angle)*recoil;reach=p.kind==='hunter'?24:38.94;
 }else if(p.kind==='mage'){
  if(motion.active){
   const frontBias=clamp((d.y-.75)*4);
   wrist={x:shoulderBase.x+d.x*amount*13+side.x*(3+motion.handSide-8*amount*frontBias),
    y:shoulderBase.y+17-amount*9+d.y*amount*5-motion.lift};
   other={x:otherBase.x-d.x*(3+motion.wind*5),y:otherBase.y+24-motion.wind*7-motion.impact*4};
   angle=motion.staff;
  }else{
   wrist={x:shoulderBase.x+d.x*amount*12,y:shoulderBase.y+17-amount*7};
   angle=-Math.PI/2+d.x*amount*.8;
  }
  reach=39.36;
 }else if(p.kind==='summoner'){
  if(motion.active){
   // Present the palm in front of the chest when facing the camera.
   // Keeping it at the left hip concealed the actual casting gesture.
   wrist={x:shoulderBase.x+d.x*(3+amount*23)-side.x*11*amount,
    y:shoulderBase.y+15+d.y*(3+amount*19)-amount*14-motion.lift};
   other={x:otherBase.x-d.x*(4+amount*7),y:otherBase.y+24-motion.wind*7};
  }else{
   wrist={x:shoulderBase.x+d.x*(4+amount*20),y:shoulderBase.y+17+d.y*amount*15-amount*7};
  }
 }else{
  wrist={x:shoulderBase.x+d.x*mix(-10,20,amount),y:shoulderBase.y+mix(-7,16,amount)};
 }
 // All casting/muzzle coordinates use the same waist pivot as the torso art.
 const map=motion.active?pt=>rotateCombatPoint(pt,motion):pt=>pt;
 const shoulder=map(shoulderBase),offShoulder=map(otherBase),hand=map(wrist),offHand=map(other);
 angle+=motion.roll;
 const tip={x:hand.x+Math.cos(angle)*reach,y:hand.y+Math.sin(angle)*reach};
 const target=pose.action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const aim=unit({x:target.x-p.x-tip.x,y:target.y-p.y-tip.y});
 return {shoulder,offShoulder,hand,offHand,tip,angle,aim,reach,amount,hit,motion};
}
export function articulatedShot(p,action=p.heroAction){
 const pose=articulatedPose({...p,heroAction:action}),s=articulatedSockets(p,pose);
 return {x:p.x+s.tip.x,y:p.y+s.tip.y,mount:{x:p.x+s.hand.x,y:p.y+s.hand.y},aim:s.aim,
  angle:Math.atan2(s.aim.y,s.aim.x),reach:s.reach,
  face:Math.abs(pose.direction.x)>Math.abs(pose.direction.y)?pose.direction.x<0?'left':'right':pose.direction.y<0?'up':'down'};
}
// Two bones meet at a solved elbow; neither texture is stretched to bridge gaps.
export function elbowFor(shoulder,hand,upper=15,lower=16,bend=1){
 const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,distance=Math.hypot(dx,dy)||.001;
 const distanceClamped=Math.max(Math.abs(upper-lower)+.001,Math.min(upper+lower-.001,distance));
 const a=Math.atan2(dy,dx),offset=Math.acos(Math.max(-1,Math.min(1,(upper*upper+distanceClamped*distanceClamped-lower*lower)/(2*upper*distanceClamped))));
 return {x:shoulder.x+Math.cos(a+bend*offset)*upper,y:shoulder.y+Math.sin(a+bend*offset)*upper};
}
export class ArticulatedHeroAtlas{
 constructor(kind){this.kind=kind;this.ready=false;this.loading=this.load();}
 async load(){
  try{
   const root=new URL('../assets/rigs/'+this.kind+'/',import.meta.url),r=await fetch(new URL('parts.json?v=1',root));
   if(!r.ok)return;this.manifest=await r.json();const im=new Image();im.decoding='async';
   await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=new URL('parts.png?v=1',root).href});
   await im.decode?.();this.image=im;this.ready=true;readyKinds.add(this.kind);
  }catch(error){console.warn('Directional rig unavailable for '+this.kind,error);}
 }
 draw(ctx,p,time=0){
  if(!this.ready)return false;
  const pose=articulatedPose(p,time),s=articulatedSockets(p,pose),frames=this.manifest.frames[pose.row];
  const t=pose.progress,death=pose.clip==='death'?ease(t):0,hurt=pose.clip==='hurt'?Math.sin(t*Math.PI):0;
  const recoil=pose.clip==='dash'?6*Math.sin(t*Math.PI):0,bodyX=-hurt*pose.direction.x*3,bodyY=death*19+recoil+(s.motion.active?0:Math.sin(time*Math.PI*2/1.6)*.8);
  const collapseAngle=death*Math.PI/2*(pose.face.x<0?-1:1);
  const bodyPoint=point=>{const x=point.x,y=point.y+25;return {x:bodyX+x*Math.cos(collapseAngle)-y*Math.sin(collapseAngle),y:-25+bodyY+x*Math.sin(collapseAngle)+y*Math.cos(collapseAngle)};};
  const shoulder=death?bodyPoint(s.shoulder):{x:s.shoulder.x+bodyX,y:s.shoulder.y+bodyY};
  let hand=death?{x:shoulder.x-8,y:mix(shoulder.y+16,4,death)}:{x:s.hand.x+bodyX,y:s.hand.y+bodyY};
  if(p.kind==='hunter'&&!death)hand={x:hand.x+Math.cos(s.angle)*(18-12*s.amount),y:hand.y+Math.sin(s.angle)*(18-12*s.amount)};
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha=.65;
  const part=(column,x,y,height,pivot=.5,angle=0,width=null)=>{
   const f=frames[column],h=height,w=width??f.w/f.h*h;
   ctx.save();ctx.translate(Math.round(x),Math.round(y));if(angle)ctx.rotate(angle);
   ctx.drawImage(this.image,f.x,f.y,f.w,f.h,-w*pivot,-1,w,h);ctx.restore();
  };
  const bone=(col,from,to)=>{
   if(col===3&&this.manifest.forearmReverse){[from,to]=[to,from];}
   const length=Math.hypot(to.x-from.x,to.y-from.y);
   part(col,from.x,from.y,length+3,.5,Math.atan2(to.y-from.y,to.x-from.x)-Math.PI/2);
  };
  const move=unit(p.heroMoveDirection||p.knightMoveDirection||pose.direction);
  const legSprite=(column,hip,foot)=>{
   const f=frames[column],bootSource=Math.max(7,Math.round(f.h*.24)),upperSource=f.h-bootSource;
   const bootHeight=8,ankle={x:foot.x,y:foot.y-bootHeight};
   const distance=Math.hypot(ankle.x-hip.x,ankle.y-hip.y);
   const width=Math.max(10,Math.min(17,f.w/f.h*28));
   // The former one-piece leg rotated and stretched the boot with the shin,
   // giving walking characters pointed, floating or disappearing feet.
   ctx.save();ctx.translate(Math.round(hip.x),Math.round(hip.y));
   ctx.rotate(Math.atan2(ankle.y-hip.y,ankle.x-hip.x)-Math.PI/2);
   ctx.drawImage(this.image,f.x,f.y,f.w,upperSource,-width/2,0,width,distance+2);
   ctx.restore();
   // Boots retain their true silhouette, height and vertical world orientation.
   ctx.drawImage(this.image,f.x,f.y+upperSource,f.w,bootSource,
    Math.round(foot.x-width/2),Math.round(foot.y-bootHeight),width,bootHeight);
  };
  const legs=rigWalkFeet(p.walkDistance||0,move,pose.moving,p.gaitBlend??1)
   .map(leg=>({...leg,col:5+leg.index,x:leg.side*(Math.abs(pose.face.x)>.9?3:6)}))
   .sort((a,b)=>a.dy-b.dy);
  for(const leg of legs){
   const hip={x:leg.x+bodyX,y:-21+bodyY*.35};
   const foot={x:leg.x+leg.dx+death*leg.x*.7,y:5+leg.dy};
   legSprite(leg.col,hip,foot);
  }
  // Cloth hangs over the hip connection, never over the planted boot region.
  const cloth=pose.moving?Math.sin(pose.phase*Math.PI*2-1)*1.2:Math.sin(time*2)*.3;
  part(1,bodyX+s.motion.dx*.25+cloth,-28+bodyY*.7+s.motion.dy*.2,15);
  const offShoulder=death?bodyPoint(s.offShoulder):{x:s.offShoulder.x+bodyX,y:s.offShoulder.y+bodyY};
  let offHand=death?{x:offShoulder.x,y:mix(offShoulder.y+26,3,death)}:
   {x:s.offHand.x+bodyX,y:s.offHand.y+bodyY};
  if(!death&&['hunter','glasscannon'].includes(p.kind)){const grip=p.kind==='hunter'?24:16;offHand={x:hand.x+Math.cos(s.angle)*grip,y:hand.y+Math.sin(s.angle)*grip+3};}
  if(!s.motion.active&&pose.clip==='special'&&['mage','summoner'].includes(p.kind))
   offHand={x:offShoulder.x-pose.direction.x*15,y:offShoulder.y-9*s.amount};
  const arm=()=>{const elbow=elbowFor(shoulder,hand,15,16,pose.face.x<0?-1:1);bone(2,shoulder,elbow);bone(3,elbow,hand);};
  const offArm=()=>bone(4,offShoulder,offHand);
  const weapon=()=>{
   if(p.kind==='summoner')return;
   if(p.kind==='hunter'){
    const f=frames[7],height=40,width=f.w/f.h*height,draw=t<.5?s.amount:0;
    ctx.save();ctx.translate(s.hand.x,s.hand.y);ctx.rotate(s.angle);
    ctx.drawImage(this.image,f.x,f.y,f.w,f.h,24-width/2,-20,width,height);
    ctx.strokeStyle='#d9d1b3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,-18);ctx.lineTo(20-12*draw,0);ctx.lineTo(20,18);ctx.stroke();
    if(t<.5||!/attack|special/.test(pose.clip)){ctx.strokeStyle='#c3a875';ctx.beginPath();ctx.moveTo(5-12*draw,0);ctx.lineTo(25,0);ctx.stroke();ctx.fillStyle='#dce4d3';ctx.fillRect(24,-1,4,2);}
    ctx.restore();return;
   }
   if(p.kind==='alchemist'&&/attack|special/.test(pose.clip)&&t>=.5)return;
   const f=frames[7],width=p.kind==='warrior'?44:p.kind==='mage'?48:p.kind==='hunter'?36:p.kind==='glasscannon'?59:pose.clip==='special'?17:13;
   const grip=p.kind==='glasscannon'?.34:p.kind==='hunter'?.2:p.kind==='alchemist'?.5:.18;
   ctx.save();ctx.translate(Math.round(hand.x),Math.round(hand.y));ctx.rotate(s.angle);
   const height=f.h/f.w*width;ctx.drawImage(this.image,f.x,f.y,f.w,f.h,-width*grip,-height/2,width,height);ctx.restore();
  };
  const attackTrail=()=>{
   if(p.kind!=='warrior'||!s.motion.active||Math.abs(t-s.hit)>.19)return;
   const previous=articulatedSockets(p,{...pose,progress:Math.max(0,t-.075)});
   const strength=Math.max(0,1-Math.abs(t-s.hit)/.19);
   // Only a short glint follows the real blade tip. The old long curve
   // looked like a second bent sword next to the actual weapon.
   const delta={x:s.tip.x-previous.tip.x,y:s.tip.y-previous.tip.y};
   const distance=Math.hypot(delta.x,delta.y),length=Math.min(9,distance*.25);
   if(distance<.5)return;
   ctx.save();ctx.globalAlpha*=strength*.55;
   ctx.strokeStyle='#e8c17a';ctx.lineWidth=2;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(s.tip.x,s.tip.y);
   ctx.lineTo(s.tip.x-delta.x/distance*length,s.tip.y-delta.y/distance*length);
   ctx.stroke();ctx.restore();
  };
  // The overhead blade passes *above* the cape while winding up and landing,
  // so do not hide that entire action behind the rear-view torso texture.
  const back=pose.face.y<-.25&&!(p.kind==='warrior'&&pose.clip==='attack3');
  offArm();if(back){arm();attackTrail();weapon();}
  // Waist-driven torso weight transfer; the helmet/armor is not replaced
  // between wind-up, weapon contact and recovery frames.
  ctx.save();ctx.translate(bodyX+s.motion.dx,-25+bodyY+s.motion.dy);
  ctx.rotate(collapseAngle+s.motion.roll);part(0,0,-45,45);ctx.restore();
  if(!back){arm();attackTrail();weapon();}
  if(['mage','summoner'].includes(p.kind)&&s.motion.active){
   // Charging grows at the weapon crystal or extended palm, not at the
   // character's chest. This is the very same origin used by projectiles.
   const x=Math.round(s.tip.x),y=Math.round(s.tip.y);
   const radius=2+Math.round(s.amount*5),color=p.kind==='mage'?'#9cdeff':'#a0efce';
   ctx.save();ctx.globalAlpha*=.35+.65*Math.max(s.amount,s.motion.wind*.5);
   ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#efffff';ctx.fillRect(x-1,y-1,3,3);
   if(s.motion.impact>.25){
    const glow=Math.round(4+s.motion.impact*7);ctx.beginPath();ctx.moveTo(x-glow,y);ctx.lineTo(x+glow,y);
    ctx.moveTo(x,y-glow);ctx.lineTo(x,y+glow);ctx.stroke();
   }ctx.restore();
  }
  ctx.restore();return true;
 }
}

const atlasCache=new Map();
export function getHeroRig(kind){
 if(typeof location!=='undefined'&&new URLSearchParams(location.search).has('legacyHeroArt'))return null;
 if(!atlasCache.has(kind))atlasCache.set(kind,new ArticulatedHeroAtlas(kind));
 return atlasCache.get(kind);
}
export function previewHeroRig(ctx,rig,width,height,time){
 if(!rig?.ready)return false;
 ctx.clearRect(0,0,width,height);ctx.save();
 const scale=Math.min(width/110,height/86);ctx.translate(width/2,height*.87);ctx.scale(scale,scale);
 rig.draw(ctx,{kind:rig.kind,x:0,y:0,hp:1,direction:{x:0,y:1}},time);ctx.restore();return true;
}
