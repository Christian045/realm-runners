import {heroPose} from './hero-animation.js?v=0.75.1';
import {WALK_STRIDE} from './locomotion.js?v=0.75.0';

const cell=96, sole=88, hip=69;
const turn=d=>Math.round(Math.atan2(d.x,d.y)/(Math.PI/4));
const sign=x=>x<0?-1:1;
const clamp=x=>Math.max(0,Math.min(1,x));

// Keep the illustrated barrel, release flash and gameplay ray on one transform.
export function rifleShot(p,action=p.heroAction){
 const d=action?.direction||p.direction||{x:0,y:1};
 const shoulder=Math.abs(d.x)<.38&&d.y<0?18:0;
 const mount={x:p.x+shoulder,y:p.y-27};
 const dx=action?.target? action.target.x-mount.x:d.x;
 const dy=action?.target? action.target.y-mount.y:d.y;
 const distance=Math.hypot(dx,dy);
 const aim=distance>.001?{x:dx/distance,y:dy/distance}:d;
 const progress=clamp((action?.elapsed||0)/(action?.duration||1));
 const recoil=action?.clip==='attack'&&progress>.5?Math.sin((progress-.5)*2*Math.PI)*4:0;
 const reach=35-8*Math.abs(aim.y)-recoil-(action?.clip==='dash'?5:0);
 return {mount,aim,reach,x:mount.x+aim.x*reach,y:mount.y+aim.y*reach,
  angle:Math.atan2(aim.y,aim.x),face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}

function polygon(c,color,points){
 c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);
 for(const point of points.slice(1))c.lineTo(...point);
 c.closePath();c.fill();
}
function weapon(c,p,shot,pose){
 const {aim,reach}=shot;
 c.save();c.translate(shot.mount.x-p.x,shot.mount.y-p.y);
 c.rotate(shot.angle);c.scale(1,aim.x<0?-1:1);
 c.translate(reach,0);
 // Local x=0 is the open muzzle. The stock, gloves and forestock move together.
 polygon(c,'#33251f',[[-46,1],[-34,-2],[-29,-2],[-28,1],[-33,4],[-45,10],[-47,8]]);
 polygon(c,'#995e37',[[-45,3],[-32,-1],[-30,1],[-44,8]]);
 c.fillStyle='#302d37';c.fillRect(-33,-2.2,33,4);
 c.fillStyle='#b8aca4';c.fillRect(-33,-1.8,33,1);
 polygon(c,'#935934',[[-32,0],[-12,0],[-13,2.7],[-31,4]]);
 c.fillStyle='#dfad69';c.fillRect(-14,-1.8,1.4,4.6);
 c.fillStyle='#413638';c.fillRect(-3,-3.2,1.5,2);
 for(const x of [-32,-18]){
  c.fillStyle='#4b3934';c.beginPath();c.ellipse(x,3,3.8,3.1,-.4,0,Math.PI*2);c.fill();
  c.fillStyle='#cb956a';c.beginPath();c.ellipse(x+1,1.4,2.4,1.6,-.4,0,Math.PI*2);c.fill();
 }
 if(pose.clip==='special'){
  c.fillStyle='rgba(224,167,255,'+Math.sin(pose.progress*Math.PI)+')';c.fillRect(-14,-3,2.4,6);
 }
 c.restore();
}

export class GlassRifleman{
 constructor(){
  this.ready=false;
  if(typeof Image==='undefined')return;
  this.image=new Image();
  this.loading=new Promise(resolve=>{
   this.image.onload=()=>{this.ready=this.image.naturalWidth===5*cell;resolve();};
   this.image.onerror=()=>resolve();
  });
  this.image.src=new URL('../assets/heroes/glasscannon/rifleman/body.png',import.meta.url).href;
 }
 draw(c,p,time=0){
  if(!this.ready)return false;
  const pose=heroPose(p,time),motion=p.heroMoveDirection||pose.direction;
  const shot=rifleShot(p,p.heroAction||{direction:pose.direction});
  const facing=turn(shot.aim), moving=p.moving&&!['dash','death'].includes(pose.clip);
  const phase=(p.walkDistance||0)/WALK_STRIDE*2*Math.PI;
  const stride=moving?Math.sin(phase):0;
  const lower=moving?turn(motion):facing;
  const part=(view,x,y,w,h,dx,dy,dw=w,dh=h)=>{
   c.save();if(view<0)c.scale(-1,1);
   c.drawImage(this.image,Math.abs(view)*cell+x,y,w,h,dx,dy,dw,dh);c.restore();
  };
  c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;
  if(pose.clip==='death'){c.rotate(sign(shot.aim.x)*1.47*pose.progress);c.scale(1,1-.2*pose.progress);}
  if(pose.clip==='hurt')c.rotate(.11*Math.sin(Math.PI*pose.progress)*sign(shot.aim.x));
  if(pose.clip==='dash')c.transform(1,0,-.15*pose.direction.x,1,0,0);
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)c.globalAlpha*=.66;
  // In repose the rifle crosses the chest. Raise it onto the ray before release.
  const attacking=['attack','special'].includes(pose.clip);
  const weight=attacking?clamp(pose.progress/.34):0;
  const handed=Math.abs(shot.aim.x)<.05?1:sign(shot.aim.x);
  const carry=Math.atan2(-.24,handed);
  const delta=Math.atan2(Math.sin(shot.angle-carry),Math.cos(shot.angle-carry));
  const angle=carry+weight*delta;
  const drawn={...shot,angle,aim:{x:Math.cos(angle),y:Math.sin(angle)}};
  const behind=shot.aim.y<-.40;
  if(behind)weapon(c,p,drawn,pose);
  // A swing foot lifts while the other stays planted. Both meet the torso under the belt.
  for(const side of [-1,1]){
   const swing=stride*side, lift=Math.max(0,swing)*2.8;
   const x=side<0?0:48,travel=swing*Math.abs(motion.x)*2.7;
   part(lower,x,hip,48,sole-hip,x-48+travel,hip-sole-1,48,sole-hip+1-lift);
  }
  const breath=pose.clip==='idle'?.45*Math.sin(time*3):0;
  const bob=breath-Math.abs(stride)*1.1;
  part(facing,0,0,96,hip+1,-48,-sole+bob,96,hip+1-bob);
  if(!behind)weapon(c,p,drawn,pose);
  c.restore();return true;
 }
 preview(c,w,h,time){
  if(!this.ready)return false;
  c.clearRect(0,0,w,h);c.save();c.translate(w*.46,h*.90);
  const scale=Math.min(w/96,h/86);c.scale(scale,scale);
  this.draw(c,{x:0,y:0,hp:1,direction:{x:.96,y:.28}},time);c.restore();return true;
 }
}
let model;
export const riflemanEnabled=()=>typeof location==='undefined'||!new URLSearchParams(location.search).has('legacyHeroArt');
export const getGlassRifleman=()=>riflemanEnabled()?(model??=new GlassRifleman()):null;
