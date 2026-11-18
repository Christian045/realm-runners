import {heroPose,heroFacing} from './hero-animation.js?v=0.75.1';
import {WALK_STRIDE} from './locomotion.js?v=0.75.0';

const cell=96, atlasScale=3, sole=88, hip=69;
const turn=d=>Math.round(Math.atan2(d.x,d.y)/(Math.PI/4));
const clamp=x=>Math.max(0,Math.min(1,x));

// The same five views as the body atlas, mirrored for the three left views.
const rifleViews = [
 {carry: -12, fire: 90, shoulder: 0, reach: 23},
 {carry: 10, fire: 45, shoulder: 0, reach: 24.5},
 {carry: -12, fire: 0, shoulder: 0, reach: 28},
 {carry: -32, fire: -45, shoulder: 9, reach: 24.5},
 {carry: -65, fire: -90, shoulder: 18, reach: 23}
];

function riflePose(player, direction, clip, progress) {
 const row = turn(direction);
 // North is one view even when the cursor crosses the vertical centerline.
 const facing = Math.abs(row) === 4 ? 4 : row;
 const view = rifleViews[Math.abs(facing)];
 const hand = facing < 0 ? -1 : 1;
 const firing = clip === 'attack' || clip === 'special';
 const raised = firing ? Math.min(clamp(progress / .32), clamp((1 - progress) / .32)) : 0;
 const degrees = view.carry + raised * (view.fire - view.carry);
 const angle = (hand === 1 ? degrees : 180 - degrees) * Math.PI / 180;
 const kick = clip === 'attack' && progress > .5 ? 4 * Math.sin((progress - .5) * 2 * Math.PI) : 0;
 const reach = view.reach - kick - (clip === 'dash' ? 5 : 0);
 const mount = {x: player.x + hand * view.shoulder, y: player.y - 32};
 return {facing, hand, angle, reach, mount,
  x: mount.x + reach * Math.cos(angle), y: mount.y + reach * Math.sin(angle)};
}

export function rifleShot(player, action = player.heroAction) {
 const pose = heroPose(player);
 const direction = action?.direction ?? pose.direction ?? {x: 0, y: 1};
 const clip = action?.clip ?? pose.clip;
 const progress = action?.duration ? clamp(action.elapsed / action.duration) : pose.progress;
 const muzzle = riflePose(player, direction, clip, progress);
 // As with the hunter, the pose sets the origin and the selected target sets the trajectory.
 const dx = action?.target ? action.target.x - muzzle.x : direction.x;
 const dy = action?.target ? action.target.y - muzzle.y : direction.y;
 const length = Math.hypot(dx, dy);
 const aim = length > .001 ? {x: dx / length, y: dy / length}
  : {x: Math.cos(muzzle.angle), y: Math.sin(muzzle.angle)};
 return {x: muzzle.x, y: muzzle.y, mount: muzzle.mount, reach: muzzle.reach,
  aim, angle: muzzle.angle, face: heroFacing(direction)};
}

function polygon(c,color,points){
 c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);
 for(const point of points.slice(1))c.lineTo(...point);
 c.closePath();c.fill();
}
// The painted body and this articulated carbine share one logical 96px cell.
// x=0 remains the muzzle tip in every pose, so release VFX need no guessed offsets.
function weapon(c,p,shot,pose){
 const {reach}=shot;
 c.save();c.translate(shot.mount.x-p.x,shot.mount.y-p.y);
 c.rotate(shot.angle);c.scale(1,shot.hand);c.translate(reach,0);
 const shaded=(top,bottom,y0,y1)=>{const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;};
 // Rounded walnut stock, thicker forestock, subdued metal and brass highlights.
 polygon(c,'#493127',[[-39,-1],[-29,-3],[-24,-1],[-25,4],[-36,9],[-40,7]]);
 polygon(c,shaded('#b77b48','#67412e',0,8),[[-38,0],[-29,-2],[-26,0],[-28,4],[-37,7]]);
 polygon(c,'#393139',[[-29,-5],[-8,-5],[-2,-4],[-2,4],[-27,5],[-31,2]]);
 polygon(c,shaded('#8a8186','#47434c',-5,4),[[-28,-4],[-9,-4],[-3,-3],[-3,3],[-27,4],[-30,1]]);
 polygon(c,shaded('#b87b46','#76442c',0,7),[[-25,0],[-10,0],[-9,5],[-25,7]]);
 c.fillStyle=shaded('#80777e','#39363f',-5,4);c.fillRect(-16,-5,15,9);
 c.fillStyle='#aaa0a0';c.fillRect(-15,-4,13,.8);
 c.fillStyle=shaded('#d0a45c','#836034',-6,5);c.fillRect(-12,-6,3,11);
 // Open muzzle ends precisely on the shared ray endpoint.
 c.fillStyle='#61575d';c.beginPath();c.ellipse(-1,0,1,5,0,0,Math.PI*2);c.fill();
 c.fillStyle='#24212a';c.beginPath();c.ellipse(-.45,0,.45,3.4,0,0,Math.PI*2);c.fill();
 polygon(c,'#51484c',[[-6,-5],[-5,-7],[-3,-7],[-2,-5]]);
 // Trigger guard stays visible between the grip hand and support hand.
 c.strokeStyle='#bd9553';c.lineWidth=1.5;c.beginPath();c.ellipse(-27,6,3.6,3,0,0,Math.PI*2);c.stroke();
 polygon(c,'#b69a64',[[-27,-4],[-24,-6],[-21,-4],[-22,-1],[-26,-1]]);
 polygon(c,'#9c71bc',[[-26,-4],[-24,-5],[-22,-4],[-23,-2],[-25,-2]]);
 c.fillStyle='#e4c6f0';c.fillRect(-24.5,-4.3,1.7,1.1);
 // Sleeves and rounded fingerless gloves attach to the stock, never drift from it.
 for(const [x,y] of [[-31,7],[-15,7]]){
  c.fillStyle=shaded('#80624b','#443731',3,13);c.beginPath();c.ellipse(x-1,y+2,4.5,5,-.45,0,Math.PI*2);c.fill();
  c.fillStyle='#4e3b33';c.beginPath();c.ellipse(x,y,4,3.8,-.4,0,Math.PI*2);c.fill();
  c.fillStyle=shaded('#d4a075','#996c4c',y-3,y+2);c.beginPath();c.ellipse(x+1,y-1,2.8,2.7,-.4,0,Math.PI*2);c.fill();
  c.strokeStyle='#9d7050';c.lineWidth=.5;c.beginPath();c.moveTo(x+.4,y-2);c.lineTo(x+1,y);c.moveTo(x+1.8,y-2);c.lineTo(x+2.3,y);c.stroke();
 }
 if(pose.clip==='special'){
  const glow=Math.sin(pose.progress*Math.PI);
  c.fillStyle='rgba(208,148,255,'+glow*.8+')';c.beginPath();c.ellipse(-24,-3,3.2,2.5,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}

export class GlassRifleman{
 constructor(){
  this.ready=false;
  if(typeof Image==='undefined')return;
  this.image=new Image();
  this.loading=new Promise(resolve=>{
   this.image.onload=()=>{this.ready=this.image.naturalWidth===5*cell*atlasScale;resolve();};
   this.image.onerror=()=>resolve();
  });
  this.image.src=new URL('../assets/heroes/glasscannon/rifleman/body-carbine.png',import.meta.url).href;
 }
 draw(c,p,time=0){
  if(!this.ready)return false;
  const pose=heroPose(p,time),motion=p.heroMoveDirection||pose.direction;
  const shot=riflePose(p,pose.direction,pose.clip,pose.progress);
  const facing=shot.facing, moving=p.moving&&!['dash','death'].includes(pose.clip);
  const phase=(p.walkDistance||0)/WALK_STRIDE*2*Math.PI;
  const stride=moving?Math.sin(phase):0;
  const lower=moving?turn(motion):facing;
  const part=(view,x,y,w,h,dx,dy,dw=w,dh=h)=>{
   c.save();if(view<0)c.scale(-1,1);
   c.drawImage(this.image,(Math.abs(view)*cell+x)*atlasScale,y*atlasScale,w*atlasScale,h*atlasScale,dx,dy,dw,dh);c.restore();
  };
  c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;
  if(pose.clip==='death'){c.rotate(shot.hand*1.47*pose.progress);c.scale(1,1-.2*pose.progress);}
  if(pose.clip==='hurt')c.rotate(.11*Math.sin(Math.PI*pose.progress)*shot.hand);
  if(pose.clip==='dash')c.transform(1,0,-.15*pose.direction.x,1,0,0);
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)c.globalAlpha*=.66;
  const behind = Math.abs(facing) >= 3;
  if(behind)weapon(c,p,shot,pose);
  // A swing foot lifts while the other stays planted. Both meet the torso under the belt.
  for(const side of [-1,1]){
   const swing=stride*side, lift=Math.max(0,swing)*2.8;
   const x=side<0?0:48,travel=swing*Math.abs(motion.x)*2.7;
   part(lower,x,hip,48,sole-hip,x-48+travel,hip-sole-1,48,sole-hip+1-lift);
  }
  const breath=pose.clip==='idle'?.45*Math.sin(time*3):0;
  const bob=breath-Math.abs(stride)*1.1;
  part(facing,0,0,96,hip+1,-48,-sole+bob,96,hip+1-bob);
  if(!behind)weapon(c,p,shot,pose);
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
