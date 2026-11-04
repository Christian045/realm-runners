// Complete authored knight poses for the optional pixel-art knight.
// One source model per facing, one root and one shared pose clock.
// Legs, torso, arms, grip and blade are rasterized together into a cached
// complete frame; there are no runtime boot or sword overlays.
const INK='#1b1e27',DARK='#354154',SHADOW='#293649',STEEL='#738597',
 LIGHT='#b1bcc7',HILITE='#e0e4df',CLOTH='#263e66',CLOTH_LIGHT='#416391',
 GOLD='#bc8544',GOLD_LIGHT='#e8b96d',BOOT='#342a27',BOOT_LIT='#846347';
const FOOT_Y=5;
// The eight *intact* portraits in source row 0 are the only source art.
// The broken labels, partial blades and cropped warriors in rows 2–4 are
// deliberately never sampled.
const FACE_SOURCE=Object.freeze([
 {column:0,foot:69},{column:1,foot:65},{column:2,foot:69},
 {column:3,foot:69},{column:4,foot:62},{column:5,foot:69},
 {column:6,foot:69},{column:1,foot:65,mirror:true}
]);
const q=v=>Math.round(v);
const paint=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(q(x),q(y),q(w),q(h))};
const polygon=(c,color,points)=>{
 c.fillStyle=color;c.beginPath();
 for(let i=0;i<points.length;i++){const p=points[i];if(!i)c.moveTo(q(p[0]),q(p[1]));else c.lineTo(q(p[0]),q(p[1]));}
 c.closePath();c.fill();
};
const segment=(c,color,a,b,width)=>{
 const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)));
 for(let i=0;i<=steps;i++){const t=i/steps;paint(c,color,a.x+dx*t-width/2,a.y+dy*t-width/2,width,width)}
};
// Every leg is authored from the hip through the shin to a planted/lifted
// foot. A lifted foot moves upward only as its knee bends; torso and hips
// share the same pose, not an independent eight-frame loop.
const WALK=Object.freeze([
 [[-9,5],[6,5],0,0],
 [[-11,3],[7,5],-1,-1],
 [[-12,1],[8,5],-1,-1],
 [[-10,3],[9,5],0,0],
 [[-7,5],[10,5],0,0],
 [[-6,5],[11,3],1,-1],
 [[-6,5],[12,1],1,-1],
 [[-8,5],[10,3],0,0]
]);
const A1=Object.freeze([
 [-16,-19,-1.9,0,0,0],[-19,-26,-2.2,-1,-1,-1],
 [-22,-31,-2.6,-2,-1,-1],[-26,-25,-.25,2,3,0],
 [-25,-21,.35,3,3,0],[-21,-20,.85,2,1,0],
 [-18,-20,.2,0,0,0],[-16,-19,-1.9,0,0,0]
]);
const A2=Object.freeze([
 [-16,-19,1.8,0,0,0],[-22,-17,1.65,1,0,0],
 [-25,-21,1.2,2,0,-1],[-23,-25,.5,1,-1,-1],
 [-17,-31,-.15,-3,-3,0],[-13,-27,-1.15,-2,-1,0],
 [-16,-21,-1.6,0,0,0],[-16,-19,1.8,0,0,0]
]);
const A3=Object.freeze([
 [-16,-19,-1.4,0,0,0],[-15,-30,-1.3,-1,0,-1],
 [-12,-39,-1.1,-2,-1,-2],[-11,-41,-.9,-2,-2,-2],
 [-25,-23,0.0,4,4,0],[-27,-19,.45,3,2,0],
 [-21,-20,-.7,1,0,0],[-16,-19,-1.4,0,0,0]
]);
const SPECIAL=Object.freeze([
 [-16,-19,-1.8,0,0,0],[-18,-29,-2.3,-1,-1,-1],
 [-20,-31,-1.7,-2,-2,-1],[-25,-24,-.25,3,3,0],
 [-20,-21,.7,3,2,0],[-17,-20,1.2,2,1,0],
 [-16,-19,-1.3,0,0,0],[-16,-19,-1.8,0,0,0]
]);
export const KNIGHT_INTEGRATED_ATTACKS=Object.freeze({attack1:A1,attack2:A2,attack3:A3,special:SPECIAL});
export const KNIGHT_INTEGRATED_WALK=WALK;
// Coordinates are *world space relative to the player's shadow root*.
// Sword.grip and hand are the SAME object. No copied weapon sheet or
// detached blade position is involved.
export function knightIntegratedPose(row,clip,frame){
 if(!Number.isInteger(row)||row<0||row>7)throw new RangeError('Knight facing must be 0..7');
 if(!Number.isInteger(frame)||frame<0||frame>7)throw new RangeError('Knight frame must be 0..7');
 const attack=KNIGHT_INTEGRATED_ATTACKS[clip];
 const side=row>=3&&row<=6?1:-1;
 let bodyX=0,bodyY=0,torsoTilt=0,feet=[[-8,FOOT_Y],[7,FOOT_Y]];
 let wrist={x:side*16,y:-19};
 let aim=row===0?.8:row===4?-1.5:Math.PI/2+row*Math.PI/4;
 if(attack){
  const [wx,wy,offset,lean,lunge,bob]=attack[frame];
  bodyX=q(lean*.55);bodyY=bob;torsoTilt=lean*.035;
  const s=Math.sign(lunge);
  feet=[[-8-s*Math.max(0,lunge),FOOT_Y],[7+Math.max(0,-lunge),FOOT_Y]];
  wrist={x:side*(-wx)+bodyX,y:wy+bodyY};
  // Front: slash across the body. Rear and sides: wind up / release in
  // the real facing direction. Overhead wind-ups point UP, always.
  const face=Math.atan2(Math.sin(Math.PI/2+row*Math.PI/4),Math.cos(Math.PI/2+row*Math.PI/4));
  if(clip==='attack3'&&frame>=1&&frame<=3)aim=-Math.PI/2+side*.12;
  else aim=face+offset*(side===1?-1:1);
 }else if(clip==='walk'){
  const [l,r,shift,bob]=WALK[frame];
  feet=[l,r];bodyX=shift;bodyY=bob;torsoTilt=shift*.028;
  wrist={x:side*(16+Math.round(Math.sin(frame*Math.PI/4)*2))+bodyX,y:-18+bodyY};
 }else if(clip==='dash'){
  bodyX=[0,1,3,5,5,3,1,0][frame];bodyY=-2;
  feet=[[-8,FOOT_Y],[7,FOOT_Y]];wrist={x:side*18+bodyX,y:-19};
 }else if(clip==='hurt'){
  bodyX=[0,-1,-3,-3,-2,-1,0,0][frame];bodyY=-1;
  wrist={x:side*16+bodyX,y:-19};
 }else if(clip==='idle'){
  bodyY=[0,0,0,-1,-1,0,0,0][frame];
  wrist={x:side*16,y:-19+bodyY};
 }
 const shoulder={x:side*11+bodyX,y:-31+bodyY},
  elbow={x:q(shoulder.x*.58+wrist.x*.42+side*3),y:q(shoulder.y*.52+wrist.y*.48-2)},
  grip={x:wrist.x,y:wrist.y};
 const blade={angle:aim,length:clip==='attack3'?27:25,
   grip,tip:{x:grip.x+Math.cos(aim)*32,y:grip.y+Math.sin(aim)*32}};
 return {row,clip,frame,side,bodyX,bodyY,torsoTilt,
  hip:{x:bodyX,y:-9+bodyY},
  feet:feet.map(([x,y])=>({x,y})),shoulder,elbow,hand:grip,blade,
  impact:Boolean(attack)&&frame===(clip==='attack1'||clip==='special'?3:4)};
}
export function paintIntegratedKnight(c,image,row,clip,frame){
 const pose=knightIntegratedPose(row,clip,frame),base=FACE_SOURCE[row];
 const sourceFoot=base.foot,bodyTop=FOOT_Y-sourceFoot+pose.bodyY;
 // Blue cape stays attached at both shoulders and sways with the hips.
 // On rear views it covers the upper thighs only, never the boot silhouettes.
 const capeSway=clip==='walk'?(frame-3.5)*.28:(pose.bodyX*.45);
 polygon(c,INK,[[-12+pose.bodyX,-33+pose.bodyY],[12+pose.bodyX,-33+pose.bodyY],
  [14+pose.bodyX+capeSway,-11+pose.bodyY],[-14+pose.bodyX+capeSway,-11+pose.bodyY]]);
 polygon(c,CLOTH,[[-10+pose.bodyX,-31+pose.bodyY],[10+pose.bodyX,-31+pose.bodyY],
  [10+pose.bodyX+capeSway,-11+pose.bodyY],[-10+pose.bodyX+capeSway,-11+pose.bodyY]]);
 paint(c,CLOTH_LIGHT,-8+pose.bodyX,-29+pose.bodyY,3,12);
 // BOTH greaves are part of this one sprite: hips, knees, ankle and boot
 // are connected. Walk phases have alternating planted and lifted soles.
 for(let i=0;i<2;i++){
  const f=pose.feet[i],hip={x:pose.hip.x+(i?5:-5),y:pose.hip.y},
   knee={x:q(hip.x*.55+f.x*.45),y:q((hip.y+f.y-4)/2)},
   ankle={x:f.x,y:f.y-4};
  segment(c,INK,hip,knee,9);
  segment(c,DARK,hip,knee,6);
  segment(c,INK,knee,ankle,8);
  segment(c,STEEL,knee,ankle,5);
  segment(c,LIGHT,{x:knee.x,y:knee.y+1},{x:ankle.x,y:ankle.y-1},2);
  paint(c,INK,f.x-5,f.y-4,11,6);
  paint(c,BOOT,f.x-4,f.y-3,9,4);
  paint(c,BOOT_LIT,f.x-3,f.y-3,5,2);
  paint(c,GOLD,f.x-3,f.y-5,7,2);
 }
 // The intact source picture supplies the detailed helmet and breastplate.
 // Cut off the source's old stationary arms and feet. Render its helmet and
 // its central breastplate in TWO crops that share the same torso transform.
 // This is not a separate animated overlay: everything is painted into one
 // cached frame, and the discarded source strips never become visible.
 const upperY=41,cutY=sourceFoot-10,sourceX=base.column*96;
 c.save();
 c.translate(q(pose.bodyX),0);
 if(base.mirror)c.scale(-1,1);
 // upper frame: original helmets and shoulder plates, never cropped blades
 c.drawImage(image,sourceX,0,96,upperY,-48,bodyTop,96,upperY);
 // centre frame: armor, belt and cape, without the original stationary limbs
 const centreX=39,centreWidth=19;
 c.drawImage(image,sourceX+centreX,upperY,centreWidth,cutY-upperY,
   centreX-48,bodyTop+upperY,centreWidth,cutY-upperY);
 c.restore();
 // Repaint the waist belt across the hip-to-torso join.
 paint(c,INK,pose.bodyX-9,-15+pose.bodyY,18,5);
 paint(c,GOLD,pose.bodyX-8,-14+pose.bodyY,16,2);
 paint(c,GOLD_LIGHT,pose.bodyX-1,-14+pose.bodyY,3,3);
 // The shield is borne by the OPPOSITE arm; it is never the sword hand.
 const shieldSide=-pose.side,shieldShoulder={x:shieldSide*12+pose.bodyX,y:-31+pose.bodyY};
 const shieldHand={x:shieldSide*18+pose.bodyX,y:-17+pose.bodyY};
 segment(c,INK,shieldShoulder,shieldHand,8);
 segment(c,DARK,shieldShoulder,shieldHand,5);
 paint(c,STEEL,shieldShoulder.x-3,shieldShoulder.y-4,7,5);
 polygon(c,INK,[[shieldHand.x-6,shieldHand.y-7],[shieldHand.x+6,shieldHand.y-7],
  [shieldHand.x+5,shieldHand.y+9],[shieldHand.x,shieldHand.y+13],
  [shieldHand.x-5,shieldHand.y+9]]);
 polygon(c,GOLD,[[shieldHand.x-4,shieldHand.y-5],[shieldHand.x+4,shieldHand.y-5],
  [shieldHand.x+4,shieldHand.y+8],[shieldHand.x,shieldHand.y+11],
  [shieldHand.x-4,shieldHand.y+8]]);
 paint(c,CLOTH,shieldHand.x-3,shieldHand.y-4,7,11);
 paint(c,GOLD_LIGHT,shieldHand.x-1,shieldHand.y-1,3,5);
 // One connected sword arm: the plate starts at the torso, the cuff ends
 // at the wrist, and the sword grip is EXACTLY the center of the gauntlet.
 segment(c,INK,pose.shoulder,pose.elbow,10);
 segment(c,CLOTH,pose.shoulder,pose.elbow,7);
 segment(c,INK,pose.elbow,pose.hand,9);
 segment(c,STEEL,pose.elbow,pose.hand,6);
 segment(c,LIGHT,{x:pose.elbow.x+1,y:pose.elbow.y},
  {x:pose.hand.x,y:pose.hand.y},2);
 paint(c,INK,pose.shoulder.x-4,pose.shoulder.y-5,9,8);
 paint(c,STEEL,pose.shoulder.x-3,pose.shoulder.y-4,7,5);
 paint(c,GOLD,pose.shoulder.x-3,pose.shoulder.y,6,2);
 paint(c,INK,pose.hand.x-4,pose.hand.y-4,9,9);
 paint(c,GOLD,pose.hand.x-3,pose.hand.y-3,7,7);
 paint(c,STEEL,pose.hand.x-2,pose.hand.y-2,5,4);
 // Sword hilt and blade are drawn FROM the same wrist root; never compute
 // a separate, disconnected weapon origin or rotate a free-floating atlas.
 const {angle}=pose.blade,ux=Math.cos(angle),uy=Math.sin(angle),
   nx=-uy,ny=ux,{x:hx,y:hy}=pose.hand;
 const swordPoint=(d,w=0)=>({x:hx+ux*d+nx*w,y:hy+uy*d+ny*w});
 const bladeBase=swordPoint(8),bladeTip=swordPoint(32),middle=swordPoint(23);
 segment(c,INK,pose.hand,swordPoint(9),5);
 segment(c,GOLD,pose.hand,swordPoint(8),3);
 segment(c,GOLD_LIGHT,pose.hand,swordPoint(7),1);
 segment(c,GOLD,swordPoint(7,-5),swordPoint(7,5),3);
 polygon(c,INK,[
  [bladeBase.x+nx*-3,bladeBase.y+ny*-3],
  [middle.x+nx*-2,middle.y+ny*-2],
  [bladeTip.x,bladeTip.y],
  [middle.x+nx*2,middle.y+ny*2],
  [bladeBase.x+nx*3,bladeBase.y+ny*3]]);
 segment(c,STEEL,swordPoint(10,-1),swordPoint(28,-1),3);
 segment(c,HILITE,swordPoint(11,-1),swordPoint(26,-1),1);
 if(pose.impact){
  const tip=swordPoint(32);paint(c,HILITE,tip.x+nx*3,tip.y+ny*3,2,2);
 }
 // Hurt tint stays confined to the *whole frame*, not independent equipment.
 if(clip==='hurt'&&frame>0&&frame<5){
  c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=.15;
  paint(c,'#ec806a',-60,-72,120,85);c.restore();
 }
}
