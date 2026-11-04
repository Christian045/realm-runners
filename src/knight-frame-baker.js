// Alpha 0.47 — one coherent, baked, shield-free knight per direction.
// Every output cell is a COMPLETE pixel image, composited once at load time.
// The live renderer never turns a standalone sword, shield, boot or arm.
export const KNIGHT_BAKED_CELL=144;
export const KNIGHT_BAKED_FRAMES=Object.freeze({idle:6,walk:8,attack1:8,attack2:8,attack3:10});
export const KNIGHT_CONTACT=Object.freeze({attack1:3,attack2:4,attack3:5});
const CELL=KNIGHT_BAKED_CELL;
const COLORS=Object.freeze({
 outline:'#19232e',shadow:'#23364d',sleeve:'#355574',plate:'#71899d',
 steel:'#9baeba',shine:'#e0e8e9',gold:'#c79145',bright:'#f0c57c',
 leather:'#4f3428',edge:'#0e202d'
});
// Sword arm is deliberately the opposite side from the old baked-in shield.
// All coordinates are local to the shared 144x144 artwork cell.
const ANCHORS=Object.freeze([
 {sx:57,sy:86,hx:56,hy:102,ox:92,oy:101,osx:88,osy:86,side:-1},
 {sx:58,sy:89,hx:54,hy:104,ox:88,oy:103,osx:86,osy:89,side:-1},
 {sx:61,sy:90,hx:58,hy:105,ox:86,oy:103,osx:84,osy:90,side:-1},
 {sx:58,sy:89,hx:57,hy:104,ox:89,oy:103,osx:86,osy:90,side:-1},
 {sx:57,sy:87,hx:55,hy:104,ox:90,oy:103,osx:87,osy:86,side:-1},
 {sx:88,sy:89,hx:90,hy:104,ox:56,oy:104,osx:59,osy:89,side:1},
 {sx:87,sy:90,hx:92,hy:104,ox:57,oy:104,osx:60,osy:90,side:1},
 {sx:88,sy:88,hx:92,hy:103,ox:56,oy:103,osx:59,osy:87,side:1}
]);
const SWING=Object.freeze({
 attack1:[0,-.22,-.78,-1.53,-2.24,-2.48,-1.12,0],
 attack2:[0,.32,.92,1.56,2.23,2.62,1.07,0]
});
const ATTACK_REACH=Object.freeze({
 attack1:[0,-1,1,7,9,5,2,0],
 attack2:[0,-1,1,4,8,6,2,0],
 attack3:[0,-2,-3,-3,4,10,8,4,1,0]
});
const ATTACK_LEAN=Object.freeze({
 attack1:[0,-1,-2,2,3,2,1,0],
 attack2:[0,1,2,-1,-3,-2,-1,0],
 attack3:[0,-1,-2,-2,1,3,3,2,1,0]
});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const round=Math.round;
function pixelLine(c,x0,y0,x1,y1,width,color){
 c.fillStyle=color;
 const steps=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1));
 const half=Math.floor(width/2);
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  c.fillRect(round(x0+(x1-x0)*t)-half,round(y0+(y1-y0)*t)-half,width,width);
 }
}
function polygon(c,color,points){
 c.fillStyle=color;c.beginPath();
 points.forEach(([x,y],i)=>{if(i)c.lineTo(round(x),round(y));else c.moveTo(round(x),round(y))});
 c.closePath();c.fill();
}
function handPose(clip,row,frame){
 const a=ANCHORS[row],heading=Math.PI/2+row*Math.PI/4;
 const idleAngle=a.side<0?-2.47:-.67;
 if(!Object.hasOwn(ATTACK_REACH,clip))
  return {hand:{x:a.hx,y:a.hy},shoulder:{x:a.sx,y:a.sy},
   angle:idleAngle,lean:0,contact:false,step:0};
 const reach=ATTACK_REACH[clip][frame]??0;
 const lean=ATTACK_LEAN[clip][frame]??0;
 const lift=clip==='attack3'&&frame>=1&&frame<=3?9:
  frame===1||frame===2?4:0;
 const hand={
  x:round(a.hx+Math.cos(heading)*reach+lean*.3+a.side*(lift?1:0)),
  y:round(a.hy+Math.sin(heading)*reach-lift)
 };
 const shoulder={x:a.sx+round(lean*.6),y:a.sy+(clip==='attack3'&&lift?-2:0)};
 const distance=Math.hypot(hand.x-shoulder.x,hand.y-shoulder.y);
 // A wrist never leaves the forearm on a thrust or overhead strike.
 if(distance>21){
  hand.x=round(shoulder.x+(hand.x-shoulder.x)*21/distance);
  hand.y=round(shoulder.y+(hand.y-shoulder.y)*21/distance);
 }
 let angle;
 if(clip==='attack3'){
  angle=[
   idleAngle,
   -Math.PI/2+a.side*.16,
   -Math.PI/2+a.side*.08,
   -Math.PI/2,
   heading-.70,heading,heading+.45,heading+.70,
   idleAngle+.22,idleAngle
  ][frame];
 }else{
  // Clockwise and counter-clockwise are physically different attack paths.
  angle=idleAngle+(SWING[clip][frame]??0)*(a.side<0?1:-1);
 }
 return {hand,shoulder,angle,lean,contact:frame===KNIGHT_CONTACT[clip],step:frame};
}
export function knightBakedPose(clip,row,frame){
 if(!Number.isInteger(row)||row<0||row>7)throw new RangeError('Invalid knight facing');
 const count=KNIGHT_BAKED_FRAMES[clip];
 if(!count||!Number.isInteger(frame)||frame<0||frame>=count)throw new RangeError('Invalid knight frame');
 return handPose(clip,row,frame);
}
function drawSword(c,hand,angle,impact){
 // A single 39px tempered-steel arming sword, held by one gauntlet.
 // The guard and tang start at the EXACT hand position.
 c.save();c.translate(hand.x,hand.y);c.rotate(angle);
 c.fillStyle=COLORS.outline;c.fillRect(-7,-4,14,8);
 c.fillStyle=COLORS.leather;c.fillRect(-6,-2,13,4);
 c.fillStyle=COLORS.gold;c.fillRect(-7,-3,2,6);
 c.fillStyle=COLORS.bright;c.fillRect(-5,-2,6,1);
 c.fillStyle=COLORS.edge;c.fillRect(6,-7,5,14);
 c.fillStyle=COLORS.gold;c.fillRect(7,-6,3,12);
 c.fillStyle=COLORS.bright;c.fillRect(8,-5,1,10);
 polygon(c,COLORS.edge,[[10,-3],[30,-3],[43,0],[30,3],[10,3]]);
 polygon(c,COLORS.steel,[[11,-2],[30,-2],[40,0],[30,2],[11,2]]);
 polygon(c,COLORS.shine,[[12,-2],[29,-2],[39,-1],[12,-1]]);
 polygon(c,COLORS.plate,[[12,1],[28,1],[37,0],[30,2],[12,2]]);
 if(impact){
  // Small glint exactly on the sword tip; not a disconnected full-screen halo.
  c.fillStyle=COLORS.bright;c.fillRect(41,-2,3,3);
  c.fillStyle=COLORS.shine;c.fillRect(44,0,2,2);
 }
 c.restore();
}
function drawArm(c,shoulder,hand,side){
 const elbow={x:round(shoulder.x*.48+hand.x*.52+side*2),
  y:round(shoulder.y*.48+hand.y*.52-2)};
 pixelLine(c,shoulder.x,shoulder.y,elbow.x,elbow.y,9,COLORS.outline);
 pixelLine(c,shoulder.x,shoulder.y,elbow.x,elbow.y,6,COLORS.sleeve);
 pixelLine(c,elbow.x,elbow.y,hand.x,hand.y,8,COLORS.outline);
 pixelLine(c,elbow.x,elbow.y,hand.x,hand.y,5,COLORS.plate);
 pixelLine(c,elbow.x+side,elbow.y,hand.x+side,hand.y,2,COLORS.steel);
 c.fillStyle=COLORS.outline;c.fillRect(shoulder.x-5,shoulder.y-5,10,10);
 c.fillStyle=COLORS.plate;c.fillRect(shoulder.x-4,shoulder.y-4,8,7);
 c.fillStyle=COLORS.gold;c.fillRect(shoulder.x-4,shoulder.y+2,8,2);
 c.fillStyle=COLORS.outline;c.fillRect(hand.x-4,hand.y-4,9,9);
 c.fillStyle=COLORS.gold;c.fillRect(hand.x-3,hand.y-3,7,7);
 c.fillStyle=COLORS.steel;c.fillRect(hand.x-2,hand.y-2,5,4);
}
function removeOldEquipment(c,row){
 const a=ANCHORS[row];
 // Remove the original hard-coded shield in the front and diagonal poses.
 // These pixels get a clean unarmed gauntlet instead. Other directions only
 // contain small vambraces and must retain their painted cape silhouettes.
 if(row===0)c.clearRect(88,86,19,28);
 else if(row===1)c.clearRect(86,91,14,21);
 else if(row===7)c.clearRect(49,91,14,21);
 // Erase the static weapon-side cuff before drawing a real connected arm.
 // Keep the detailed pauldron and the entire torso/helmet intact.
 c.clearRect(a.hx-5,a.hy-7,11,16);
}
function drawFreeArm(c,row){
 const a=ANCHORS[row];
 const offShoulder={x:a.osx,y:a.osy},offHand={x:a.ox,y:a.oy};
 drawArm(c,offShoulder,offHand,-a.side);
}
function drawBootReinforcement(c,row,frame){
 // Only at walk/strike poses: two distinct greaves with independent
 // stride phase. Existing authored lower-body art supplies the detail.
 const width=(row===2||row===6)?9:7;
 for(let leg=0;leg<2;leg++){
  const phase=(frame/8+leg*.5)*Math.PI*2;
  const lift=Math.max(0,Math.sin(phase));
  const x=round((leg?81:64)+(row===2?-1:row===6?1:0)*Math.sin(phase)*4);
  const y=round(120-lift*3);
  c.fillStyle=COLORS.outline;c.fillRect(x-width/2,y-2,width,5);
  c.fillStyle=COLORS.leather;c.fillRect(x-width/2+1,y-1,width-2,3);
  c.fillStyle=COLORS.plate;c.fillRect(x-width/2+2,y-3,Math.max(2,width-4),2);
 }
}
function renderCell(c,source,clip,row,frame){
 const a=ANCHORS[row],pose=handPose(clip,row,frame);
 const idleFrame=clip==='idle'?frame%6:0;
 const isMoving=clip==='walk',isAttack=clip.startsWith('attack');
 const upperShift=isAttack?round(pose.lean*.65):0;
 if(clip==='idle'){
  c.drawImage(source.idle,idleFrame*CELL,row*CELL,CELL,CELL,0,0,CELL,CELL);
 }else{
  // The painted head, torso and belt are from ONE model in every state.
  // Only the below-waist authored greaves are copied from the gait sheet.
  // The former full-body walk frames jumped in size and switched silhouettes.
  const seam=108,footFrame=isMoving?(frame===0?4:frame):
   isAttack&&pose.step>=2&&pose.step<=6?(pose.step%7)+1:4;
  c.drawImage(source.idle,0,row*CELL,CELL,seam,upperShift,0,CELL,seam);
  c.drawImage(source.walk,footFrame*CELL,row*CELL+seam,
   CELL,CELL-seam,0,seam,CELL,CELL-seam);
  if(isMoving)drawBootReinforcement(c,row,frame);
 }
 removeOldEquipment(c,row);
 drawFreeArm(c,row);
 drawArm(c,pose.shoulder,pose.hand,a.side);
 drawSword(c,pose.hand,pose.angle,pose.contact);
}
export function bakeKnightFrames(source,makeCanvas){
 if(!source?.idle||!source?.walk||typeof makeCanvas!=='function')
  throw new Error('Missing knight source art or canvas factory');
 const result={};
 for(const [clip,count] of Object.entries(KNIGHT_BAKED_FRAMES)){
  const atlas=makeCanvas();atlas.width=CELL*count;atlas.height=CELL*8;
  const sheet=atlas.getContext('2d');sheet.imageSmoothingEnabled=false;
  const tile=makeCanvas();tile.width=tile.height=CELL;
  const g=tile.getContext('2d');g.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
   g.clearRect(0,0,CELL,CELL);
   renderCell(g,source,clip,row,frame);
   sheet.drawImage(tile,frame*CELL,row*CELL);
  }
  result[clip]=atlas;
 }
 return result;
}