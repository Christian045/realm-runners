import {paintIntegratedKnight,knightIntegratedPose} from './knight-integrated.js?v=0.43.0';
// Original compact pixel-art knight. A complete 128x128 padded raster frame is
// composed ONCE per state/direction/frame and cached as a sprite. Gameplay
// never rotates or stretches a limb, a head, a boot or a sword texture.
// The eight facings and three strike silhouettes share one coherent model.
import {knightPose} from './knight-animation.js?v=0.31.0';
import {rigFacing} from './articulated-hero.js?v=0.40.0';

export const KNIGHT_PIXEL_SIZE=128;
export const KNIGHT_PIXEL_ANCHOR=Object.freeze({x:64,y:88});
export const KNIGHT_PIXEL_CLIPS=Object.freeze(['idle','walk','attack1','attack2','attack3','special','dash','hurt','death']);
const PAL=Object.freeze({
 ink:'#151923',back:'#25232d',cape:'#253e6a',capeShade:'#172946',
 cloth:'#23476d',clothLight:'#365e91',steelDark:'#354659',
 steel:'#687e90',steelLight:'#acb9c2',silver:'#d6d9d5',
 goldDark:'#80502a',gold:'#bd8744',goldLight:'#e7b86c',
 visor:'#101724',skin:'#ae7c62',boot:'#332b2b',
 bootLit:'#775137',shield:'#293749',shieldRim:'#c18a44',
 spark:'#f3efe0',slash:'#badce4'
});
const WR=KNIGHT_PIXEL_SIZE;

// The old version drew *every* 96px source cell at y=-77. Yet its painted
// boot lines vary from y=62 to y=83: the idle knight floated 8–15px above
// the shadow, while some attacks sank below it. These are source-foot pixels
// (not bounding boxes of sword arcs). Every baked frame now lands at y=+5,
// just above the renderer's shadow at player.y+10.
export const KNIGHT_SOURCE_FOOT_Y=Object.freeze([
 Object.freeze([69,65,69,69,62,69,69,69]),
 Object.freeze([73,73,71,70,69,73,73,73]),
 Object.freeze([75,75,75,77,75,75,76,75]),
 Object.freeze([83,83,83,83,84,83,82,82]),
 Object.freeze([76,76,76,76,76,76,76,76]),
 Object.freeze([76,76,77,77,76,76,76,76])
]);
export const KNIGHT_GROUND_OFFSET=5;

// The illustrated attack1 sprites were also authored 7–12px left of the
// actual player root. Do not move the boots toward a detached torso: align
// the *whole* source pose back to the player center, then paint planted boots.
// The side-walk source strip drifts horizontally during its eight frames.
export function knightSourceCenterCorrection(sourceRow,frame,mirrored=false){
 let x=0;
 if(sourceRow===2)x=[7,9,11,12,12,11,10,8][frame]||0;
 else if(sourceRow===1)x=[5,5,4,3,0,-2,-4,-6][frame]||0;
 return mirrored?-x:x;
}
export function knightFramePlacement(row,column,mirror=false){
 const foot=KNIGHT_SOURCE_FOOT_Y[row]?.[column];
 if(!Number.isFinite(foot))throw new RangeError('Unknown knight art cell');
 return {x:-48,y:KNIGHT_GROUND_OFFSET-foot,mirror};
}
// Rear-view animation was absent from the generated source sheet. These
// three authored eight-frame arcs raise, contact and recover in different
// directions, including the north-facing 3/8 or 4/8 damage event.
export const KNIGHT_REAR_ATTACK_ANGLES=Object.freeze({
 attack1:Object.freeze([-.65,-1.15,-1.7,-2.45,-3.25,-3.7,-4.1,-.65]),
 attack2:Object.freeze([-2.55,-2.1,-1.4,-.65,-.08,.36,.72,-2.55]),
 attack3:Object.freeze([-.4,-1.15,-1.45,-1.65,1.22,1.48,2.1,-.4]),
 special:Object.freeze([-1,-1.65,-2.5,-3.25,-4,-4.85,-5.5,-1])
});
const quant=(v)=>Math.round(v);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function knightPixelRow(d){return rigFacing(d||{x:0,y:1});}
export function knightPixelFrame(p,time=0){
 const pose=knightPose(p,time);
 return {clip:KNIGHT_PIXEL_CLIPS.includes(pose.clip)?pose.clip:'idle',
  frame:pose.frame%8,row:knightPixelRow(pose.direction)};
}
// Frame poses are authored as 8 distinct silhouettes. The physical hit event
// stays at KnightAnimation hitFrame 3/8 (1st), 4/8 (2nd/3rd).
export const KNIGHT_SWINGS=Object.freeze({
 attack1:{
  lean:[0,-1,-2,2,3,1,0,0],height:[0,0,-1,-1,0,0,0,0],
  sword:[-1.28,-1.90,-2.42,-.48,.29,.73,.84,-1.28],
  handX:[11,9,6,15,20,17,13,11],handY:[-27,-26,-25,-24,-23,-25,-27,-27],
  step:[0,-1,-2,3,3,1,0,0],impact:3},
 attack2:{
  lean:[0,1,2,-1,-3,-1,0,0],height:[0,0,-1,-2,-1,0,0,0],
  sword:[.75,1.35,1.90,1.33,-.52,-1.40,-1.09,.75],
  handX:[11,14,18,10,3,8,11,11],handY:[-27,-26,-27,-24,-22,-24,-26,-27],
  step:[0,1,2,-2,-3,-1,0,0],impact:4},
 attack3:{
  lean:[0,-1,-2,-1,4,3,1,0],height:[0,-1,-3,-4,1,1,0,0],
  sword:[-.95,-1.60,-2.10,-2.35,.04,.65,.95,-.95],
  handX:[11,9,6,4,19,16,11,11],handY:[-27,-34,-41,-43,-20,-24,-27,-27],
  step:[0,0,-1,-2,4,2,0,0],impact:4},
 special:{
  lean:[0,-1,-2,1,2,1,0,0],height:[0,-1,-2,-2,-1,0,0,0],
  sword:[-1.6,-2.3,-.6,.35,1.5,2.8,3.6,-1.6],
  handX:[10,9,13,17,16,14,12,11],handY:[-27,-30,-27,-24,-22,-27,-29,-27],
  step:[0,-1,-2,2,2,1,0,0],impact:3}
});
const WALK=Object.freeze([
 [-3,0,0,2],[-2,1,-2,1],[0,1,-3,0],[2,0,-2,0],
 [3,0,0,2],[2,1,2,1],[0,1,3,0],[-2,0,2,0]
]);

const rect=(c,color,x,y,w,h)=>{
 c.fillStyle=color;c.fillRect(quant(x),quant(y),quant(w),quant(h));
};
const poly=(c,color,points)=>{
 c.fillStyle=color;c.beginPath();
 for(let i=0;i<points.length;i++){let [x,y]=points[i];if(i===0)c.moveTo(quant(x),quant(y));else c.lineTo(quant(x),quant(y));}
 c.closePath();c.fill();
};
const dot=(c,color,x,y)=>rect(c,color,x,y,1,1);
const segment=(c,color,ax,ay,bx,by,w)=>{
 const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)));
 for(let i=0;i<=steps;i++){const t=i/steps;rect(c,color,ax+(bx-ax)*t-w/2,ay+(by-ay)*t-w/2,w,w);}
};
const drawBlade=(c,hx,hy,angle,frame,impact)=>{
 // Deliberate pixel-stepped sword drawn into the complete sprite, not
 // a detached, rotated PNG on top of the character.
 const dir={x:Math.cos(angle),y:Math.sin(angle)},
  side={x:-dir.y,y:dir.x},p=(distance,width)=>[
   hx+dir.x*distance+side.x*width,hy+dir.y*distance+side.y*width
  ];
 segment(c,PAL.ink,hx,hy,...p(9,0),5);
 segment(c,PAL.goldDark,hx,hy,...p(7,0),3);
 segment(c,PAL.goldLight,hx,hy,...p(6,0),2);
 segment(c,PAL.goldDark,...p(7,-5),...p(7,5),3);
 segment(c,PAL.goldLight,...p(7,-4),...p(7,4),1);
 poly(c,PAL.ink,[p(9,-4),p(24,-3),p(33,0),p(24,3),p(9,4)]);
 poly(c,PAL.steel,[p(10,-3),p(25,-2),p(32,0),p(25,1),p(10,2)]);
 poly(c,PAL.silver,[p(11,-2),p(25,-1),p(30,-1),p(22,0),p(11,0)]);
 if(impact){
  const glint=p(33,0);
  dot(c,PAL.spark,...[glint[0]+2,glint[1]]);
  dot(c,PAL.spark,...[glint[0]+4,glint[1]-2]);
  dot(c,PAL.slash,...[glint[0]+1,glint[1]-3]);
 }
};
function drawFullKnight(c,row,clip,frame){
 const back=row>=3&&row<=5,side=row===2||row===6,
  west=row===1||row===2||row===3,
  dAngle=Math.PI/2+row*Math.PI/4,
  face={x:Math.cos(dAngle),y:Math.sin(dAngle)};
 let stance=0,lean=0,raise=0,frontFoot=0,rearFoot=0,
  handX=11,handY=-27,bladeAngle=-1.15,impact=false;
 if(clip==='walk'){
  const w=WALK[frame];frontFoot=w[0];rearFoot=w[2];
  lean=(frame===2||frame===6)?1:0;raise=(frame===1||frame===5)?-1:0;
 }
 if(KNIGHT_SWINGS[clip]){
  const s=KNIGHT_SWINGS[clip];
  lean=s.lean[frame];raise=s.height[frame];stance=s.step[frame];
  handX=s.handX[frame];handY=s.handY[frame];bladeAngle=s.sword[frame];
  impact=frame===s.impact||frame===s.impact+1;
 }
 if(clip==='dash'){lean=[0,2,5,7,7,4,2,0][frame];raise=-2;}
 if(clip==='hurt'){lean=[0,-2,-4,-3,-2,-1,0,0][frame];raise=-1;}
 if(clip==='idle'){raise=frame===3?-1:0;}
 if(clip==='death'){
  if(frame>=4){
   const x=-15+frame, y=-6;
   poly(c,PAL.ink,[[x-16,y-11],[x+20,y-12],[x+30,y-5],[x+28,y+3],[x-14,y+3]]);
   poly(c,PAL.capeShade,[[x-13,y-10],[x+19,y-10],[x+28,y-4],[x+26,y+1],[x-12,y+1]]);
   rect(c,PAL.cape,x-9,y-9,26,8);
   rect(c,PAL.steelDark,x-3,y-14,27,12);
   rect(c,PAL.steel,x+2,y-15,18,9);
   rect(c,PAL.steelLight,x+5,y-14,9,2);
   rect(c,PAL.gold,x+5,y-12,9,2);
   rect(c,PAL.goldDark,x+2,y-5,22,3);
   rect(c,PAL.boot,x-12,y-2,11,4);rect(c,PAL.boot,x+21,y-2,11,4);
   return;
  }
  lean=-frame*3;raise=frame*4;
 }
 const isAttack=Boolean(KNIGHT_SWINGS[clip]);
 const facingX=side?(row===2?-1:1):0;
 // The root is fixed at (0,0), which is the floor contact for every frame.
 const bodyX=quant(lean*.55+facingX),bodyY=raise;
 const legL=bodyX-6+frontFoot+stance*.38;
 const legR=bodyX+4+rearFoot-stance*.38;
 const leftLift=clip==='walk'?[0,0,2,2,0,0,0,0][frame]:0;
 const rightLift=clip==='walk'?[0,0,0,0,0,0,2,2][frame]:0;
 // Boots and trouser legs are different complete pixel silhouettes per frame.
 rect(c,PAL.ink,legL-1,-13+bodyY,7,13-leftLift);
 rect(c,PAL.boot,legL-2,-5-leftLift,10,5);
 rect(c,PAL.bootLit,legL,-5-leftLift,6,2);
 rect(c,PAL.ink,legR-1,-13+bodyY,7,13-rightLift);
 rect(c,PAL.boot,legR-1,-5-rightLift,10,5);
 rect(c,PAL.bootLit,legR,-5-rightLift,6,2);
 rect(c,PAL.steelDark,legL,-12+bodyY,5,8);
 rect(c,PAL.steelDark,legR,-12+bodyY,5,8);
 rect(c,PAL.steel,legL+1,-10+bodyY,2,4);
 rect(c,PAL.steel,legR+1,-10+bodyY,2,4);
 // Blue travel cape is a single silhouette, with one trailing tip.
 const capeSway=clip==='walk'?[0,1,1,0,-1,-1,0,1][frame]:isAttack?clamp(-lean,-4,4):0;
 poly(c,PAL.ink,[
  [bodyX-12,-32+bodyY],[bodyX+12,-32+bodyY],[bodyX+15+capeSway,-12+bodyY],
  [bodyX+11+capeSway,-5+bodyY],[bodyX-10+capeSway,-5+bodyY],[bodyX-16+capeSway,-11+bodyY]
 ]);
 poly(c,PAL.cape,[
  [bodyX-10,-30+bodyY],[bodyX+10,-30+bodyY],[bodyX+12+capeSway,-9+bodyY],
  [bodyX+4,-11+bodyY],[bodyX-10+capeSway,-8+bodyY]
 ]);
 rect(c,PAL.capeShade,bodyX-10+capeSway,-14+bodyY,5,7);
 if(!back){
  // Heavy armored breastplate, sculpted with compact asymmetric highlights.
  poly(c,PAL.ink,[[bodyX-12,-32+bodyY],[bodyX+11,-32+bodyY],
   [bodyX+10,-13+bodyY],[bodyX-9,-13+bodyY]]);
  poly(c,PAL.cloth,[[bodyX-10,-31+bodyY],[bodyX+9,-31+bodyY],
   [bodyX+7,-15+bodyY],[bodyX-7,-15+bodyY]]);
  rect(c,PAL.clothLight,bodyX-6,-29+bodyY,11,3);
  rect(c,PAL.steel,bodyX-8,-26+bodyY,16,8);
  rect(c,PAL.steelDark,bodyX-7,-20+bodyY,14,4);
  rect(c,PAL.steelLight,bodyX-5,-25+bodyY,8,2);
  rect(c,PAL.goldDark,bodyX-10,-15+bodyY,20,4);
  rect(c,PAL.gold,bodyX-7,-15+bodyY,14,2);
  rect(c,PAL.goldLight,bodyX-1,-22+bodyY,2,7);
 }else{
  rect(c,PAL.capeShade,bodyX-9,-29+bodyY,18,17);
  rect(c,PAL.cape,bodyX-8,-28+bodyY,16,13);
  rect(c,PAL.capeShade,bodyX-2,-29+bodyY,3,17);
  rect(c,PAL.goldDark,bodyX-10,-30+bodyY,20,3);
  rect(c,PAL.gold,bodyX-7,-30+bodyY,14,1);
 }
 // A shield and one solid gauntlet keep the silhouette readable.
 const shieldX=bodyX-14+(side?facingX*2:0),
  shieldY=-27+bodyY;
 rect(c,PAL.ink,shieldX-6,shieldY-9,11,19);
 rect(c,PAL.shieldRim,shieldX-4,shieldY-7,8,15);
 rect(c,PAL.shield,shieldX-3,shieldY-6,6,13);
 rect(c,PAL.goldLight,shieldX-1,shieldY-3,2,6);
 if(isAttack){handX+=stance*.4;handY+=raise*.3;}
 handX+=bodyX;handY+=bodyY;
 // The sword hand enters the pose through a solid armored sleeve; there
 // is no stretched limb image, mesh, skeletal transform, or 3D rotation.
 segment(c,PAL.ink,bodyX+9,-28+bodyY,handX-2,handY,8);
 segment(c,PAL.cloth,bodyX+9,-28+bodyY,handX-2,handY,5);
 rect(c,PAL.gold,quant(handX)-4,quant(handY)-4,7,7);
 rect(c,PAL.steel,quant(handX)-3,quant(handY)-3,5,4);
 // Head is redrawn as coherent pixels in every directional silhouette.
 const neckY=-36+bodyY+(clip==='attack3'&&frame===4?1:0);
 rect(c,PAL.ink,bodyX-8,neckY-14,16,16);
 rect(c,PAL.steel,bodyX-7,neckY-14,14,12);
 rect(c,PAL.steelLight,bodyX-5,neckY-14,9,3);
 rect(c,PAL.silver,bodyX-4,neckY-13,6,2);
 rect(c,PAL.goldDark,bodyX-8,neckY-4,16,3);
 rect(c,PAL.gold,bodyX-6,neckY-4,12,2);
 if(!back){
  rect(c,PAL.visor,bodyX-5+facingX*2,neckY-7,10,4);
  rect(c,PAL.steelLight,bodyX+facingX*2,neckY-7,2,4);
  rect(c,PAL.goldLight,bodyX-5,neckY-3,10,1);
 }else{
  rect(c,PAL.steelDark,bodyX-5,neckY-9,10,7);
  rect(c,PAL.steelLight,bodyX-2,neckY-11,4,7);
  rect(c,PAL.goldDark,bodyX-7,neckY-1,14,2);
 }
 // Exact raised sword positions are frame-authored; only directional
 // playback changes the screen angle when the entire sprite is baked.
 const swordWorldAngle=isAttack?(dAngle-Math.PI/2+bladeAngle):
   (west?-2.25:-.92)+((back)?-.1:0);
 drawBlade(c,handX,handY,swordWorldAngle,frame,impact);
 if(clip==='hurt'&&frame>=1&&frame<=3){
  dot(c,'#f7aaa0',bodyX+6,neckY-15);
  dot(c,'#ffdfbb',bodyX+10,neckY-18);
 }
}
export class KnightPaintedAtlas {
 constructor(canvasFactory=null){this.frames=new Map();this.ready=true;this.canvasFactory=canvasFactory;}
 frame(row,clip,frame){
  const key=row+':'+clip+':'+frame;
  if(this.frames.has(key))return this.frames.get(key);
  const canvas=this.canvasFactory?this.canvasFactory(WR,WR):
   typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(WR,WR):document.createElement('canvas');
  canvas.width=WR;canvas.height=WR;
  const g=canvas.getContext('2d',{alpha:true});g.imageSmoothingEnabled=false;
  g.translate(KNIGHT_PIXEL_ANCHOR.x,KNIGHT_PIXEL_ANCHOR.y);
  drawFullKnight(g,row,clip,frame);
  this.frames.set(key,canvas);return canvas;
 }
 draw(ctx,p,time=0){
  if(!ctx?.drawImage)return false;
  const {row,clip,frame}=knightPixelFrame(p,time);
  const canvas=this.frame(row,clip,frame);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  ctx.drawImage(canvas,quant(p.x-KNIGHT_PIXEL_ANCHOR.x),quant(p.y-KNIGHT_PIXEL_ANCHOR.y));
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  const c=this.frame(0,'idle',Math.floor(time*5)%8);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  const scale=Math.min(width/50,height/51);
  ctx.drawImage(c,quant(width/2-KNIGHT_PIXEL_ANCHOR.x*scale),
   quant(height*.9-KNIGHT_PIXEL_ANCHOR.y*scale),WR*scale,WR*scale);
  return true;
 }
}
// A separately generated, original image atlas supplies the finished
// painted armour/helmet/cape. Source material is new Realm Runners artwork,
// not extracted Hammerwatch assets. It contains full body states rather than
// a live skeletal or mesh rig. The procedural renderer above is a fallback.
export class KnightIllustratedAtlas extends KnightPaintedAtlas {
 constructor(){
  super();
  this.image=null;
  this.imageReady=false;
  this.loading=this.loadImage();
 }
 async loadImage(){
  if(typeof Image==='undefined')return;
  try{
   const image=new Image();image.decoding='async';
   await new Promise((resolve,reject)=>{
    image.onload=resolve;image.onerror=reject;
    image.src=new URL('../assets/knight/painted-041.png?v=0.43.0',import.meta.url).href;
   });
   if(image.decode)await image.decode();
   if(image.width!==768||image.height!==576)throw Error('Knight art atlas dimensions changed');
   this.image=image;this.imageReady=true;this.frames.clear();
  }catch(e){console.warn('New knight artwork unavailable; using first-pass pixel frames.',e);}
 }
 frame(row,clip,frame){
  if(!this.imageReady)return super.frame(row,clip,frame);
  const key=row+':'+clip+':'+frame;
  if(this.frames.has(key))return this.frames.get(key);
  const sheet=this.canvasFactory?this.canvasFactory(WR,WR):
   typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(WR,WR):document.createElement('canvas');
  sheet.width=WR;sheet.height=WR;
  const c=sheet.getContext('2d',{alpha:true});c.imageSmoothingEnabled=false;
  c.translate(KNIGHT_PIXEL_ANCHOR.x,KNIGHT_PIXEL_ANCHOR.y);
  if(clip==='death'&&frame>=3){
   // Entire complete sprite falls together; unlike the removed overlays
   // the greaves and blade are part of the same transform.
   c.save();c.translate(0,-4);c.rotate(Math.min(1,(frame-2)/5)*Math.PI*.46);
   paintIntegratedKnight(c,this.image,row,'idle',frame);
   c.restore();
  }else{
   paintIntegratedKnight(c,this.image,row,clip==='death'?'idle':clip,frame);
  }
  this.frames.set(key,sheet);
  return sheet;
 }
}
let single=null;
export const getKnightPainted=()=>single??(single=typeof Image!=='undefined'?new KnightIllustratedAtlas():new KnightPaintedAtlas());
