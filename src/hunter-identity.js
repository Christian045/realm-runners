import {HunterLocomotionAtlas} from './hunter-locomotion.js?v=0.73.4';
import {hunterPose} from './hunter-motion.js?v=0.73.4';

export const HUNTER_IDENTITY_VERSION='0.73.4';
export const hunterIdentityEnabled=(params=typeof location==='undefined'?null:new URLSearchParams(location.search))=>
 Boolean(params)&&!['originalHunter','oldHunterArt','legacyHeroArt'].some(flag=>params.has(flag))&&params.get('hunterShortbow')!=='1';

// Measured on the actual approved low-carried shortbow, in native 96px cells.
export const HUNTER_IDENTITY_SOCKETS=Object.freeze([
 {grip:[65,69],tip:[69,64]}, {grip:[63,70],tip:[69,64]},
 {grip:[52,70],tip:[60,65]}, {grip:[37,71],tip:[45,65]},
 {grip:[31,70],tip:[27,65]}, {grip:[31,68],tip:[26,65]},
 {grip:[58,65],tip:[67,68]}, {grip:[61,66],tip:[68,69]}
]);
const bounds=[[23,16,74,87],[24,16,73,87],[34,16,72,87],[27,16,70,87],
 [23,16,69,87],[22,16,67,87],[26,16,69,87],[23,16,74,87]];

export function hunterIdentityShot(p,action=p.heroAction){
 const pose=hunterPose(p,0,action),socket=HUNTER_IDENTITY_SOCKETS[pose.row];
 const x=Math.round(p.x)+socket.tip[0]-48,y=Math.round(p.y)+socket.tip[1]-88;
 const mount={x:Math.round(p.x)+socket.grip[0]-48,y:Math.round(p.y)+socket.grip[1]-88};
 const d=pose.direction,target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const dx=target.x-x,dy=target.y-y,length=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 const aim=length>1e-8?{x:dx/length,y:dy/length}:{x:d.x/fallback,y:d.y/fallback};
 return {x,y,mount,aim,angle:Math.atan2(aim.y,aim.x),reach:Math.hypot(x-mount.x,y-mount.y),
  face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}

// Stand/walk are the approved artwork. Other actions retain the same identity
// until authored bow-draw/action sheets exist; never swap to the older model.
export class HunterIdentityAtlas{
 constructor(loader){this.art=new HunterLocomotionAtlas(loader);this.loading=this.art.loading;this.identity=true;this.pendingCombatAnimation=true;}
 get ready(){return this.art.ready;}
 get failed(){return this.art.failed;}
 get sheets(){return this.art.sheets;}
 draw(ctx,p,time=0){
  if(!this.ready)return false;
  const pose=hunterPose(p,time);
  ctx.save();
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  if(pose.clip==='death'){
   // A simple whole-body fall keeps the approved character and a grounded
   // silhouette; it is not presented as a newly authored death sprite set.
   const [l,t,r,b]=bounds[pose.row],cx=(l+r)/2,cy=(t+b)/2;
   const angle=Math.min(1,pose.progress/.65)*Math.PI/2;
   const bottom=(r-l)/2*Math.sin(angle)+(b-t)/2*Math.cos(angle);
   ctx.translate(Math.round(p.x)+cx-48,Math.round(p.y)-1-bottom);ctx.rotate(angle);
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(this.sheets.idle,pose.row*96,0,96,96,-cx,-cy,96,96);
  }else{
   const dash=pose.clip==='dash';
   this.art.draw(ctx,{...p,hp:Math.max(1,p.hp||1),heroAction:null,hurtTimer:0,
    direction:pose.direction,heroMoveDirection:pose.direction,
    moving:pose.clip==='walk'||dash,
    hunterWalkDistance:dash?pose.progress*96:p.hunterWalkDistance});
  }
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);ctx.save();ctx.imageSmoothingEnabled=false;
  const scale=Math.min(width/100,height/100);
  ctx.translate(width/2,height*.9);ctx.scale(scale,scale);
  this.draw(ctx,{kind:'hunter',x:0,y:0,hp:100,direction:{x:0,y:1}},time);
  ctx.restore();return true;
 }
}
