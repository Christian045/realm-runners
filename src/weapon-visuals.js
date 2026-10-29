// Compact pixel weapons aligned to the actual 32x36 character sprite (scaled 1.62x).
// The handedness follows the same four-direction facing logic as sprites.js.
export function weaponFacing(direction={x:0,y:1}){
 const x=Number(direction?.x)||0,y=Number(direction?.y)||0;
 return Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
}
const SWORD_ANCHORS={
 right:{x:18,y:-7,angle:.48},
 left:{x:-18,y:-7,angle:Math.PI-.48},
 up:{x:17,y:-12,angle:-1.38},
 down:{x:18,y:-7,angle:1.18}
};
export function swordPose(player){
 const face=weaponFacing(player?.direction);
 const anchor=SWORD_ANCHORS[face];
 const active=(player?.attackTimer||0)>0;
 const step=player?.comboStep||1;
 const remaining=Math.min(1,Math.max(0,(player?.attackTimer||0)/.18));
 const progress=1-remaining;
 // Three readable slashes; the second reverses direction.
 const sweep=step===2?.75-1.42*progress:-.76+1.42*progress;
 const angle=anchor.angle+(active?sweep:0);
 return {
  face,angle,active,step,progress,scale:step===3&&active?1.10:1,
  x:(player?.x||0)+anchor.x,
  y:(player?.y||0)+anchor.y-(active?5:0)
 };
}
export function drawWarriorSword(ctx,player){
 if(player?.kind!=='warrior')return;
 const pose=swordPose(player);
 ctx.save();
 ctx.translate(Math.round(pose.x),Math.round(pose.y));
 ctx.rotate(pose.angle);
 ctx.scale(pose.scale,pose.scale);
 // Grip intersects the metal gauntlet instead of floating outside the hero.
 ctx.fillStyle='#192936';ctx.fillRect(-8,-4,15,8);
 ctx.fillStyle='#845d40';ctx.fillRect(-5,-2,11,4);
 ctx.fillStyle='#dfbb79';ctx.fillRect(-8,-3,3,6);
 // Short brass guard, matching the sprite's gold armour trim.
 ctx.fillStyle='#182b37';ctx.fillRect(5,-9,6,18);
 ctx.fillStyle='#cead73';ctx.fillRect(7,-7,3,14);
 // Tapered steel sword: 31 world px from guard to tip, not a giant overlay.
 ctx.fillStyle='#152b3a';ctx.beginPath();
 ctx.moveTo(11,-4);ctx.lineTo(31,-4);ctx.lineTo(42,0);
 ctx.lineTo(31,4);ctx.lineTo(11,4);ctx.closePath();ctx.fill();
 ctx.fillStyle='#7798aa';ctx.beginPath();
 ctx.moveTo(12,-3);ctx.lineTo(30,-3);ctx.lineTo(39,0);
 ctx.lineTo(30,1);ctx.lineTo(12,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#dcebf0';ctx.beginPath();
 ctx.moveTo(13,-3);ctx.lineTo(29,-3);ctx.lineTo(37,-1);
 ctx.lineTo(13,-1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#416173';ctx.fillRect(13,2,18,1);
 if(pose.active){
  ctx.globalAlpha=.6;
  ctx.fillStyle=pose.step===3?'#f7ce81':'#b2dce9';
  ctx.fillRect(19,-5,13,2);
 }
 ctx.restore();
}
export function mageStaffPose(player){
 const face=weaponFacing(player?.direction);
 const anchor={
  right:{x:18,y:-8,tilt:-.16},
  left:{x:-18,y:-8,tilt:.16},
  up:{x:17,y:-11,tilt:.08},
  down:{x:18,y:-7,tilt:-.08}
 }[face];
 const casting=(player?.castTimer||0)>0||(player?.attackTimer||0)>0;
 return {face,casting,x:(player?.x||0)+anchor.x,y:(player?.y||0)+anchor.y-(casting?4:0),angle:anchor.tilt+(casting?-.12:0)};
}
export function drawMageStaff(ctx,player){
 if(player?.kind!=='mage')return;
 const pose=mageStaffPose(player);
 ctx.save();
 ctx.translate(Math.round(pose.x),Math.round(pose.y));
 ctx.rotate(pose.angle);
 // Staff is upright and held through the fist; crystal is not oversized.
 ctx.fillStyle='#221c38';ctx.fillRect(-3,-26,7,40);
 ctx.fillStyle='#80613e';ctx.fillRect(-1,-24,3,36);
 ctx.fillStyle='#c6a16d';ctx.fillRect(0,-17,1,19);
 ctx.fillStyle='#473962';ctx.fillRect(-5,-29,11,8);
 ctx.fillStyle='#aa89c8';ctx.fillRect(-3,-31,7,8);
 ctx.fillStyle='#e4d9ff';ctx.fillRect(-2,-31,4,4);
 ctx.fillStyle='#9bdde4';ctx.fillRect(0,-29,2,3);
 if(pose.casting){
  ctx.fillStyle='#e5c9ff';ctx.fillRect(-5,-34,3,3);
  ctx.fillStyle='#bba9ee';ctx.fillRect(5,-31,3,3);
 }
 ctx.restore();
}
