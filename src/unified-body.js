// Character identity stays fixed across every state. These are complete sprites
// sourced from the same player-specific atlas, not pasted-together limbs.
// Action timing is owned by knightPose / heroPose and never modified here.
export const FULL_BODY_ROWS=Object.freeze({down:0,right:1,up:2,left:3});
export const FULL_BODY_SIZE=96;
export const BODY_GROUND_Y=9;

// Production art foot baselines measured in each complete frame. Use a
// stable foot point so sword/cape/robe pixels cannot cause the body to hop.
// The knight's right frame 6 needed an explicit correction (previously +12px).
const FEET=Object.freeze({
 warrior:{
  down:[87,87,87,87,87,87,87,87],
  right:[88,88,88,88,88,88,88,88],
  up:[87,87,87,87,88,87,87,87],
  left:[88,88,87,88,87,87,88,88]},
 mage:{
  down:[89,89,89,89,89,89,88,90],
  right:[90,89,89,89,89,89,89,89],
  up:[89,89,89,89,88,89,89,90],
  left:[89,89,89,90,90,89,90,89]},
 summoner:{
  down:[90,90,90,90,90,90,90,90],
  right:[88,89,89,88,89,89,89,89],
  up:[89,88,89,89,89,88,89,89],
  left:[88,89,88,88,88,88,89,88]}
});

const KNIGHT_ATTACK=[0,1,2,3,4,3,1,0];
const KNIGHT_REVERSE=[0,7,6,5,4,5,7,0];
const KNIGHT_FINISH=[0,1,3,5,6,4,2,0];
const HERO_ATTACK=[0,1,2,3,2,0];
const HERO_SPECIAL=[0,1,3,5,3,0];

export function fullBodyFrame(kind,pose,walkFrame){
 if(pose.clip==='walk')return ((walkFrame%8)+8)%8;
 if(pose.clip==='idle'||pose.clip==='hurt'||pose.clip==='death')return 0;
 const stage=pose.frame|0;
 if(kind==='warrior'){
  if(pose.clip==='attack1')return KNIGHT_ATTACK[stage]??0;
  if(pose.clip==='attack2')return KNIGHT_REVERSE[stage]??0;
  if(pose.clip==='attack3'||pose.clip==='special')return KNIGHT_FINISH[stage]??0;
  if(pose.clip==='dash')return 2;
 }else{
  if(pose.clip==='attack')return HERO_ATTACK[stage]??0;
  if(pose.clip==='special')return HERO_SPECIAL[stage]??0;
  if(pose.clip==='dash')return 2;
 }
 return null;
}

function actionMotion(kind,pose){
 const attack=pose.clip.startsWith('attack'),special=pose.clip==='special';
 if(attack||special){
  const peak=pose.progress<=.5?pose.progress*2:(1-pose.progress)*2;
  return {forward:(kind==='warrior'?4:2)*peak,dy:kind==='warrior'?-2*peak:-1*peak,
   angle:(kind==='warrior'?.13:.055)*peak};
 }
 if(pose.clip==='hurt')return {forward:-3,dy:0,angle:-.06};
 if(pose.clip==='dash')return {forward:3,dy:-1,angle:.05};
 if(pose.clip==='death')return {forward:0,dy:0,angle:Math.max(0,Math.min(1,pose.progress))*1.20};
 return {forward:0,dy:0,angle:0};
}

// One image draw call for every action, always the same 96px model.
// Existing projectile origins, hit frames, damage, dashes and FX stay intact.
export function drawUnifiedBody(ctx,p,pose,image,kind,walkFrame=0){
 if(!image||!FEET[kind])return false;
 const row=FULL_BODY_ROWS[pose.face];
 if(row===undefined)return false;
 const frame=fullBodyFrame(kind,pose,walkFrame);
 if(frame===null)return false;
 const foot=FEET[kind][pose.face][frame]??88;
 const mx=pose.face==='left'?-1:pose.face==='right'?1:0;
 const my=pose.face==='up'?-1:pose.face==='down'?1:0;
 const motion=actionMotion(kind,pose);
 const dx= Math.round(p.x-48+mx*motion.forward),dy=Math.round(p.y-(foot-BODY_GROUND_Y)+my*motion.forward*.4+motion.dy);
 // Keep exact source and destination rectangles for idle/walk; transforms
 // are limited to action clips to avoid foot drift while standing/walking.
 const animate=pose.clip!=='idle'&&pose.clip!=='walk'&&
  typeof ctx.save==='function'&&typeof ctx.restore==='function'&&
  typeof ctx.translate==='function'&&typeof ctx.rotate==='function';
 if(animate){
  ctx.save();
  const sign=pose.face==='left'?-1:1;
  ctx.translate(p.x+mx*motion.forward,p.y+my*motion.forward*.4+motion.dy);
  ctx.rotate(motion.angle*sign);
  if(pose.clip==='death')ctx.globalAlpha=(ctx.globalAlpha??1)*(.96-.22*Math.max(0,Math.min(1,pose.progress)));
  ctx.drawImage(image,frame*96,row*96,96,96,-48,-(foot-BODY_GROUND_Y),96,96);
  ctx.restore();
 }else{
  ctx.drawImage(image,frame*96,row*96,96,96,dx,dy,96,96);
 }
 return true;
}
