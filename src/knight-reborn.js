// Realm Runners 0.48 — Knight Reborn
// An original 72px pixel-art figure. No pixels from any pre-0.48 knight sheet
// are copied or rescaled. Every facing and animation is painted as an intact
// 144px character frame once, then blitted in the actual dungeon renderer.
export const KNIGHT_REBORN_SIZE=144;
export const KNIGHT_REBORN_FRAME_COUNTS=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 special:8,dash:8,hurt:6,death:8
});
export const KNIGHT_REBORN_HITS=Object.freeze({attack1:3,attack2:4,attack3:5,special:3});
export const KNIGHT_REBORN_FACINGS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
const P={
 ink:'#141c29',deep:'#26364b',shadow:'#354d65',iron:'#698398',
 steel:'#9fb8c8',light:'#d1e0e5',shine:'#f1f1e9',
 goldDark:'#76502a',gold:'#c59850',goldBright:'#f1d68b',
 navy:'#172b54',blue:'#31529a',blueLight:'#5273b6',
 clothShadow:'#12284a',boot:'#45372f',leather:'#6f5141',skin:'#a98260',
 black:'#101823',white:'#e6eee9',hit:'#f9eac0'
};
const C=72,TWO_PI=Math.PI*2;
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
const q=Math.round;
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(q(x),q(y),Math.max(1,q(w)),Math.max(1,q(h)));}
function poly(c,color,points){
 c.fillStyle=color;c.beginPath();
 points.forEach(([x,y],i)=>i?c.lineTo(q(x),q(y)):c.moveTo(q(x),q(y)));
 c.closePath();c.fill();
}
function line(c,color,x0,y0,x1,y1,thickness=1){
 const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*1.4));
 for(let i=0;i<=n;i++){
  const t=i/n;
  rect(c,color,q(x0+(x1-x0)*t)-Math.floor(thickness/2),
   q(y0+(y1-y0)*t)-Math.floor(thickness/2),thickness,thickness);
 }
}
// The anatomical right arm holds the only weapon. The left arm is bare.
// Front view: right hand on the left side of the image. Back view reverses it.
const rightHandFacing=row>=3&&row<=6?1:-1;
const backView=row=>row>=3&&row<=5;
const sideView=row=>row===2||row===6;
const footGround=60;
const easing=t=>t*t*(3-2*t);
const phaseTables=Object.freeze({
 attack1:[-2.15,-2.55,-1.92,-.64,.20,.39,-.94,-2.15],
 attack2:[-2.15,-.78,.10,1.14,2.25,1.24,-.38,-2.15],
 attack3:[-2.15,-1.66,-1.48,-1.39,-1.13,-.18,.72,.53,-.48,-2.15],
 special:[-2.15,-1.20,-.28,.67,1.67,2.58,3.51,4.13]
});
const handTravel=Object.freeze({
 attack1:[0,-1,0,4,6,3,1,0],
 attack2:[0,-1,0,2,5,4,1,0],
 attack3:[0,0,0,1,2,5,5,3,1,0],
 special:[0,1,3,5,4,2,1,0]
});
const handLift=Object.freeze({
 attack1:[0,-3,-3,0,1,1,0,0],
 attack2:[0,1,2,1,0,0,0,0],
 attack3:[0,-4,-8,-10,-7,-2,1,1,0,0],
 special:[0,-2,-3,0,1,0,-1,0]
});
export function knightRebornPose(row,clip,frame){
 if(!Number.isInteger(row)||row<0||row>7)throw new RangeError('Knight direction must be 0..7');
 const count=KNIGHT_REBORN_FRAME_COUNTS[clip];
 if(!count||!Number.isInteger(frame)||frame<0||frame>=count)
  throw new RangeError('Invalid knight animation frame');
 const facing=rightHandFacing(row);
 const walking=clip==='walk'||clip==='dash';
 const stride=walking?(frame/8)*TWO_PI:0;
 const attack=clip.startsWith('attack')||clip==='special';
 const reach=attack?handTravel[clip][frame]:0;
 const rise=attack?handLift[clip][frame]:0;
 const bob=walking?([0,-1,-2,-1,0,-1,-2,-1][frame]):clip==='idle'?(frame===2||frame===3?-1:0):0;
 const lunge=attack&&frame>=2&&frame<=5?(frame===4||frame===5?2:1):0;
 const recoil=clip==='hurt'?(frame===1||frame===2?-2:0):0;
 const torsoX=facing*lunge+recoil;
 const torsoY=bob;
 const shoulder={x:36+facing*11+torsoX,y:38+torsoY};
 const hand={
  x:36+facing*(14+reach)+torsoX,
  y:47+torsoY+rise
 };
 const angleBase=-2.15;
 const rawAngle=attack?phaseTables[clip][frame]:angleBase+(walking?Math.sin(stride)*.08:0);
 const angle=facing===1?Math.PI-rawAngle:rawAngle;
 const legs=[0,1].map(i=>{
  const swing=walking?Math.sin(stride+i*Math.PI):0;
  const lift=walking?Math.max(0,swing)*4:0;
  const step=walking?Math.cos(stride+i*Math.PI)*4:0;
  const attackStep=attack&&i===0&&frame>=2&&frame<=6?(frame<=4?2:1):0;
  return {
   hipX:36+(i?6:-6)+torsoX,
   hipY:48+torsoY,
   kneeX:36+(i?6:-6)+q(step*.58)+torsoX,
   kneeY:54+torsoY,
   footX:36+(i?7:-7)+q(step)+facing*attackStep+torsoX,
   footY:footGround-q(lift),
   lift:q(lift)
  };
 });
 return {row,clip,frame,facing,walking,attack,bob,torsoX,torsoY,
  shoulder,hand,angle,legs,contact:KNIGHT_REBORN_HITS[clip]===frame};
}
function cape(c,p){
 const x=p.torsoX,y=p.torsoY,back=backView(p.row),side=sideView(p.row);
 // Royal blue split cape, tethered behind the actual pauldrons.
 const sway=p.walking?Math.sin(p.frame*Math.PI/4)*2:
   p.attack?-p.facing*Math.min(3,Math.abs(p.torsoX)):0;
 if(side){
  const tail=p.row===2?1:-1;
  poly(c,P.ink,[[36+x,35+y],[38+x,35+y],[42+x+tail*2,54+y],[37+x+tail*5+sway,59],[32+x+tail*2,55]]);
  poly(c,P.blue,[[35+x,37+y],[38+x,38+y],[40+x+tail,54+y],[38+x+tail*4+sway,57],[34+x+tail,55]]);
  line(c,P.blueLight,37+x,40+y,38+x+tail*3+sway,56,1);
 }else{
  poly(c,P.ink,[[25+x,36+y],[47+x,36+y],[50+x+sway,55],[46+x+sway,59],
   [37+x+sway,57],[27+x+sway,60],[22+x+sway,55]]);
  poly(c,P.navy,[[27+x,38+y],[45+x,38+y],[47+x+sway,55],
   [43+x+sway,57],[36+x+sway,55],[29+x+sway,58],[25+x+sway,54]]);
  poly(c,P.blue,[[28+x,39+y],[44+x,40+y],[44+x+sway,54],
   [39+x+sway,56],[35+x+sway,53],[30+x+sway,56],[27+x+sway,53]]);
  if(back){
   rect(c,P.blueLight,33+x,41+y,2,12);
   rect(c,P.gold,34+x,44+y,4,2);
   rect(c,P.goldDark,31+x+sway,55,10,1);
  }
 }
}
function legs(c,p){
 const order=p.row>=3&&p.row<=5?[0,1]:[1,0];
 for(const index of order){
  const leg=p.legs[index],x=leg.footX,y=leg.footY;
  // Knee, shin and boot are one connected pose. A lifted foot is not a
  // separate piece sitting on the unshifted floor.
  poly(c,P.ink,[[leg.hipX-4,leg.hipY-1],[leg.hipX+4,leg.hipY-1],
   [leg.kneeX+4,leg.kneeY],[x+4,y],[x-4,y],[leg.kneeX-4,leg.kneeY]]);
  poly(c,P.shadow,[[leg.hipX-3,leg.hipY],[leg.hipX+3,leg.hipY],
   [leg.kneeX+3,leg.kneeY],[x+2,y-3],[x-2,y-3],[leg.kneeX-3,leg.kneeY]]);
  poly(c,P.iron,[[leg.kneeX-3,leg.kneeY-1],[leg.kneeX+3,leg.kneeY-1],
   [x+2,y-4],[x-2,y-4]]);
  rect(c,P.steel,leg.kneeX-2,leg.kneeY,2,3);
  rect(c,P.gold,leg.kneeX-3,leg.kneeY-1,6,1);
  rect(c,P.ink,x-5,y-2,10,4);
  rect(c,P.boot,x-4,y-2,8,3);
  rect(c,P.iron,x-3,y-3,6,2);
  rect(c,P.steel,x-1,y-3,2,1);
  rect(c,P.black,x-5,y+1,10,1);
 }
}
function body(c,p){
 const x=p.torsoX,y=p.torsoY,back=backView(p.row),side=sideView(p.row);
 const narrow=side?2:0;
 // Chain-mail silhouette and steel chestplate.
 poly(c,P.ink,[[27+narrow+x,35+y],[45-narrow+x,35+y],
  [47-narrow+x,47+y],[43+x,51+y],[29+x,51+y],[25+narrow+x,47+y]]);
 poly(c,P.deep,[[28+narrow+x,37+y],[44-narrow+x,37+y],
  [45-narrow+x,46+y],[40+x,49+y],[31+x,49+y],[27+narrow+x,46+y]]);
 poly(c,back?P.blue:P.iron,[[29+narrow+x,38+y],[43-narrow+x,38+y],
  [44-narrow+x,45+y],[38+x,48+y],[32+x,48+y],[28+narrow+x,45+y]]);
 if(back){
  poly(c,P.blueLight,[[33+x,39+y],[39+x,39+y],[38+x,47+y],[34+x,47+y]]);
  rect(c,P.gold,35+x,42+y,2,4);
  rect(c,P.goldBright,35+x,42+y,1,3);
 }else{
  poly(c,P.steel,[[31+narrow+x,38+y],[41-narrow+x,38+y],
   [40-narrow+x,43+y],[36+x,45+y],[32+narrow+x,43+y]]);
  line(c,P.light,31+x,39+y,35+x,42+y,1);
  line(c,P.shadow,41+x,39+y,37+x,44+y,1);
  rect(c,P.goldDark,34+x,41+y,5,5);
  rect(c,P.gold,35+x,41+y,3,4);
  rect(c,P.goldBright,36+x,42+y,1,2);
  rect(c,P.blue,33+x,45+y,6,4);
 }
 rect(c,P.ink,28+x,48+y,17,3);
 rect(c,P.leather,29+x,48+y,15,2);
 rect(c,P.gold,34+x,48+y,4,3);
 rect(c,P.goldBright,35+x,48+y,2,1);
 // Tunic tail is compact; greaves remain visible from behind.
 if(!back){
  poly(c,P.ink,[[33+x,50+y],[40+x,50+y],[42+x,55+y],[36+x,56+y],[30+x,55+y]]);
  poly(c,P.blue,[[33+x,50+y],[40+x,50+y],[40+x,54+y],[36+x,55+y],[32+x,54+y]]);
  rect(c,P.gold,36+x,52+y,1,3);
 }
}
function helmet(c,p){
 const x=p.torsoX,y=p.torsoY,back=backView(p.row),side=sideView(p.row);
 const shift=side?(p.row===2?-2:2):0;
 // Fixed-width helm. Every animation keeps the exact same silhouette.
 poly(c,P.ink,[[30+x+shift,24+y],[33+x+shift,22+y],[39+x+shift,22+y],
  [43+x+shift,25+y],[44+x+shift,33+y],[41+x+shift,36+y],[31+x+shift,36+y],[28+x+shift,33+y]]);
 poly(c,P.shadow,[[31+x+shift,25+y],[34+x+shift,23+y],[39+x+shift,23+y],
  [42+x+shift,26+y],[42+x+shift,32+y],[39+x+shift,35+y],[32+x+shift,35+y],[30+x+shift,32+y]]);
 poly(c,P.steel,[[31+x+shift,26+y],[34+x+shift,23+y],[38+x+shift,23+y],
  [41+x+shift,25+y],[41+x+shift,31+y],[39+x+shift,33+y],[32+x+shift,33+y],[31+x+shift,31+y]]);
 rect(c,P.light,34+x+shift,24+y,5,2);
 rect(c,P.shine,35+x+shift,23+y,2,1);
 if(back){
  rect(c,P.deep,34+x+shift,26+y,3,8);
  rect(c,P.iron,35+x+shift,24+y,1,9);
  rect(c,P.gold,31+x+shift,33+y,11,2);
  rect(c,P.goldBright,34+x+shift,33+y,4,1);
 }else{
  // A dark T-shaped eyeslit, not a shield or floating white face.
  rect(c,P.black,31+x+shift,29+y,11,3);
  rect(c,P.black,35+x+shift,29+y,3,6);
  rect(c,P.shine,32+x+shift,29+y,3,1);
  rect(c,P.steel,39+x+shift,30+y,2,1);
  rect(c,P.iron,34+x+shift,32+y,1,3);
  rect(c,P.gold,31+x+shift,34+y,11,1);
 }
 if(side){
  rect(c,P.ink,(p.row===2?29:41)+x+shift,30+y,2,3);
  rect(c,P.iron,35+x+shift,24+y,1,9);
 }
 rect(c,P.ink,33+x+shift,21+y,7,2);
 rect(c,P.light,35+x+shift,21+y,3,1);
 rect(c,P.gold,35+x+shift,20+y,3,1);
}
function arm(c,shoulder,hand,gloveSide){
 const elbow={
  x:q(shoulder.x*.62+hand.x*.38+gloveSide*.9),
  y:q(shoulder.y*.45+hand.y*.55)
 };
 line(c,P.ink,shoulder.x,shoulder.y,elbow.x,elbow.y,7);
 line(c,P.shadow,shoulder.x,shoulder.y,elbow.x,elbow.y,5);
 line(c,P.iron,shoulder.x,shoulder.y,elbow.x,elbow.y,3);
 line(c,P.ink,elbow.x,elbow.y,hand.x,hand.y,6);
 line(c,P.steel,elbow.x,elbow.y,hand.x,hand.y,4);
 rect(c,P.ink,shoulder.x-5,shoulder.y-4,10,8);
 rect(c,P.iron,shoulder.x-4,shoulder.y-4,8,6);
 rect(c,P.steel,shoulder.x-3,shoulder.y-3,6,3);
 rect(c,P.gold,shoulder.x-4,shoulder.y+2,8,2);
 rect(c,P.ink,hand.x-3,hand.y-3,7,7);
 rect(c,P.iron,hand.x-2,hand.y-3,5,5);
 rect(c,P.steel,hand.x-2,hand.y-2,3,2);
 rect(c,P.gold,hand.x-2,hand.y+2,5,1);
}
function weapon(c,p){
 const h=p.hand,unit=[Math.cos(p.angle),Math.sin(p.angle)];
 const normal=[-unit[1],unit[0]];
 const point=(at,across=0)=>[
  h.x+unit[0]*at+normal[0]*across,
  h.y+unit[1]*at+normal[1]*across
 ];
 // Short dark leather hilt, knuckle guard, and restrained bright steel.
 const [pomL,pomR]=[point(-4,-2),point(-4,2)];
 poly(c,P.ink,[pomL,point(-2,-3),point(-1,3),pomR]);
 line(c,P.goldDark,...point(-4),...point(6),4);
 line(c,P.leather,...point(-3),...point(5),2);
 line(c,P.goldBright,...point(-4),...point(-2),2);
 line(c,P.ink,...point(5,-5),...point(5,5),3);
 line(c,P.gold,...point(5,-4),...point(5,4),2);
 poly(c,P.ink,[point(7,-3),point(19,-3),point(24,0),point(19,3),point(7,3)]);
 poly(c,P.steel,[point(8,-2),point(18,-2),point(22,0),point(18,2),point(8,2)]);
 poly(c,P.light,[point(9,-2),point(18,-2),point(22,-.5),point(9,-.5)]);
 line(c,P.shadow,...point(9,2),...point(18,2),1);
 if(p.contact){
  rect(c,P.shine,...point(24),2,2);
  rect(c,P.goldBright,...point(25,1),2,2);
 }
}
function paintOne(c,row,clip,frame){
 const p=knightRebornPose(row,clip,frame),back=backView(row);
 c.clearRect(0,0,C,C);c.imageSmoothingEnabled=false;
 const fall=clip==='death'?easing(frame/7):0;
 c.save();
 if(fall>0){
  // Whole-body fall about the hip. No sprite disappears between frames.
  c.translate(36,51);c.rotate(-p.facing*fall*1.25);
  c.scale(1,1-fall*.16);c.translate(-36,-51);
 }
 cape(c,p);legs(c,p);
 // Arms sit behind the mail in rear view, in front in frontal view.
 const off={
  shoulder:{x:36-p.facing*11+p.torsoX,y:38+p.torsoY},
  hand:{x:36-p.facing*15+p.torsoX,y:47+p.torsoY}
 };
 if(back){arm(c,off.shoulder,off.hand,-p.facing);
  arm(c,p.shoulder,p.hand,p.facing);weapon(c,p);}
 body(c,p);
 if(!back){arm(c,off.shoulder,off.hand,-p.facing);
  arm(c,p.shoulder,p.hand,p.facing);weapon(c,p);}
 helmet(c,p);
 if(clip==='hurt'&&(frame===1||frame===2)){
  rect(c,P.goldBright,33+p.torsoX,41+p.torsoY,6,2);
  rect(c,P.hit,39+p.torsoX,38+p.torsoY,2,2);
 }
 c.restore();
 return p;
}
export function createKnightRebornSheets(makeCanvas){
 if(typeof makeCanvas!=='function')throw new TypeError('Canvas factory required');
 const sheets={},tile=makeCanvas();tile.width=tile.height=C;
 const small=tile.getContext('2d',{willReadFrequently:false});
 if(!small)throw new Error('Cannot draw knight art');
 for(const [clip,count] of Object.entries(KNIGHT_REBORN_FRAME_COUNTS)){
  const atlas=makeCanvas();atlas.width=144*count;atlas.height=144*8;
  const out=atlas.getContext('2d');out.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
   paintOne(small,row,clip,frame);
   out.drawImage(tile,0,0,C,C,frame*144,row*144,144,144);
  }
  sheets[clip]=atlas;
 }
 return sheets;
}
export function renderKnightRebornFrame(c,row,clip,frame){
 if(!c)throw new TypeError('Rendering context required');
 if(row<0||row>7)throw new RangeError('Knight row out of bounds');
 const count=KNIGHT_REBORN_FRAME_COUNTS[clip];
 if(!count||frame<0||frame>=count)throw new RangeError('Knight frame out of bounds');
 c.save();c.imageSmoothingEnabled=false;
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(C,C):
  document.createElement('canvas');
 canvas.width=canvas.height=C;
 paintOne(canvas.getContext('2d'),row,clip,frame);
 c.drawImage(canvas,0,0,C,C,0,0,144,144);
 c.restore();
}