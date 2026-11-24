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

// The rightmost point of the painted crystal is the release anchor.
function drawFocus(ctx, player, shot, pose, image) {
 ctx.save();
 ctx.translate(shot.mount.x - player.x, shot.mount.y - player.y);
 ctx.rotate(shot.angle);
 ctx.scale(1, shot.hand);
 ctx.translate(shot.reach, 0);
 // The stock recedes in the front and back views while the tip stays on the release point.
 const depth = 1 - .34 * Math.sin(shot.angle) ** 2;
 const length = 48 * depth;
 ctx.drawImage(image, -length, -3.9, length, 10);

 // Rear hand wraps the leather grip. Front hand cups the wood below the brass socket.
 for (const [x, y] of [[-34 * depth, 4.8], [-18 * depth, 2.6]]) {
  const sleeve = ctx.createLinearGradient(0, y, 0, y + 7);
  sleeve.addColorStop(0, '#826045');
  sleeve.addColorStop(1, '#493830');
  ctx.fillStyle = sleeve;
  ctx.beginPath();
  ctx.ellipse(x - 1.3, y + 2, 4.3, 4.7, -.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#493831';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.7, 3.4, -.4, 0, Math.PI * 2);
  ctx.fill();
  const fingers = ctx.createLinearGradient(0, y - 3, 0, y + 2);
  fingers.addColorStop(0, '#d6a477');
  fingers.addColorStop(1, '#98694b');
  ctx.fillStyle = fingers;
  ctx.beginPath();
  ctx.ellipse(x + .8, y - .6, 2.7, 2.4, -.4, 0, Math.PI * 2);
  ctx.fill();
 }
 if (pose.clip === 'special') {
  ctx.globalAlpha *= .65 * Math.sin(pose.progress * Math.PI);
  const center = -6 * depth;
  const glint = ctx.createRadialGradient(center, 0, 0, center, 0, 6);
  glint.addColorStop(0, '#fff2ff');
  glint.addColorStop(1, 'rgba(221,176,249,0)');
  ctx.fillStyle = glint;
  ctx.fillRect(center - 6, -6, 12, 12);
 }
 ctx.restore();
}

export class GlassRifleman{
 constructor(){
  this.ready=false;
  if(typeof Image==='undefined')return;
  this.image = new Image();
  this.focus = new Image();
  this.image.src = new URL('../assets/heroes/glasscannon/rifleman/body-carbine.png', import.meta.url).href;
  this.focus.src = new URL('../assets/heroes/glasscannon/rifleman/amethyst-focus.png', import.meta.url).href;
  this.loading = Promise.all([this.image.decode(), this.focus.decode()]).then(() => {
   this.ready = this.image.naturalWidth === 5 * cell * atlasScale && this.focus.naturalWidth === 240;
  }).catch(() => { this.ready = false; });
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
  if(behind)drawFocus(c,p,shot,pose,this.focus);
  // A swing foot lifts while the other stays planted. Both meet the torso under the belt.
  for(const side of [-1,1]){
   const swing=stride*side, lift=Math.max(0,swing)*2.8;
   const x=side<0?0:48,travel=swing*Math.abs(motion.x)*2.7;
   part(lower,x,hip,48,sole-hip,x-48+travel,hip-sole-1,48,sole-hip+1-lift);
  }
  const breath=pose.clip==='idle'?.45*Math.sin(time*3):0;
  const bob=breath-Math.abs(stride)*1.1;
  part(facing,0,0,96,hip+1,-48,-sole+bob,96,hip+1-bob);
  if(!behind)drawFocus(c,p,shot,pose,this.focus);
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
