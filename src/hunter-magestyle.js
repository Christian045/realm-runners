// Realm Runners Jäger 0.72: distinctive ranger silhouette on the production Magier pixel-art foundation.
// Uses the SAME hand-painted 96px anatomy, material shading and eight facings,
// then changes clothing, silhouette, equipment and bow choreography.
// No legacy Jäger artwork and no 0.69 rectangle-built body is ever used.
import {MAGE_SOCKETS} from './mage-sockets.js?v=0.67.1';
const PI=Math.PI,round=Math.round,clamp=(n,l,h)=>Math.max(l,Math.min(n,h));
export const HUNTER_STYLE_CELL=96;
export const HUNTER_STYLE_ANCHOR=Object.freeze({x:48,y:88});
export const HUNTER_STYLE_COUNTS=Object.freeze({idle:6,walk:8,attack:6,special:6,dash:6,hurt:6,death:8});
export const HUNTER_STYLE_FACINGS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
const DIRECTIONS=[[0,1],[-Math.SQRT1_2,Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,-Math.SQRT1_2],
 [0,-1],[Math.SQRT1_2,-Math.SQRT1_2],[1,0],[Math.SQRT1_2,Math.SQRT1_2]];
export const hunterStyleFacing=d=>(round((Math.atan2(d?.y??1,d?.x??0)-PI/2)/(PI/4))+8)%8;
export const hunterSourceRow=row=>row>=6?8-row:row;
export const hunterMirrored=row=>row>=6;
export const hunterStyleActionSource=(clip,frame)=>{
 const a={
  idle:[0,0,0,0,0,0],
  attack:[0,5,5,6,7,0],
  special:[0,8,8,9,10,0],
  dash:[0,11,11,11,0,0],
  hurt:[0,12,12,13,0,0],
  death:[12,12,14,14,15,15,15,15]
 }[clip];
 if(!a)throw new RangeError('Unknown Jäger clip '+clip);
 return a[Math.min(a.length-1,Math.max(0,frame))];
};
const SWATCH=Object.freeze({
 outline:'#251f23',shadow:'#392a28',leatherDark:'#49312d',leather:'#7c5338',
 leatherLight:'#ad8356',light:'#dfb47a',greenDark:'#214537',
 green:'#3f7954',greenLight:'#75ac7d',brass:'#cfad6b',
 gold:'#f0d49c',cord:'#d3c9a2',arrow:'#e8c992',
 feather:'#98c68a',skin:'#e7b993',skinDark:'#b97c60',
 boot:'#382c2c',bark:'#382825',olive:'#4b633c',oliveLight:'#a0ac72',
 hoodRim:'#8cad78',cloakShadow:'#193b32',harness:'#ab8a5e'
});
const C=SWATCH;
const px=(g,c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(round(x),round(y),w,h);};
const poly=(g,c,points)=>{
 g.fillStyle=c;g.beginPath();g.moveTo(round(points[0][0]),round(points[0][1]));
 for(let i=1;i<points.length;i++)g.lineTo(round(points[i][0]),round(points[i][1]));
 g.closePath();g.fill();
};
// All lines remain pixel-exact and share the production mage's one-pixel
// highlights / contiguous edges. Avoid browser anti-alias and gradients.
const line=(g,c,x0,y0,x1,y1,w=1)=>{
 if(![x0,y0,x1,y1].every(Number.isFinite))throw new RangeError('Non-finite Jäger pixel line');
 x0=round(x0);y0=round(y0);x1=round(x1);y1=round(y1);
 const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
 let err=dx-dy;for(;;){
  px(g,c,x0-Math.floor(w/2),y0-Math.floor(w/2),w,w);
  if(x0===x1&&y0===y1)break;
  const e=err*2;if(e>-dy){err-=dy;x0+=sx;}if(e<dx){err+=dx;y0+=sy;}
 }
};
const magentaCloth=(d,i)=>{
 const red=d[i],green=d[i+1],blue=d[i+2];
 return d[i+3]>90&&blue>green*1.10&&red>green*1.07&&blue>red*.70&&Math.max(red,blue)-green>9;
};
const gem=(d,i)=>{
 const r=d[i],g=d[i+1],b=d[i+2];
 return g>r*1.23&&b>r*1.20&&b>g*.86&&Math.max(g,b)>86;
};
const darkStaff=(d,i)=>{
 const r=d[i],g=d[i+1],b=d[i+2];
 return r>g*.93&&r>b*1.08&&r<155&&g<115;
};
export function recolorMagierToHunter(source,makeCanvas){
 const w=source.width,h=source.height,canvas=makeCanvas();canvas.width=w;canvas.height=h;
 const g=canvas.getContext('2d',{willReadFrequently:true});if(!g)throw Error('No hunter palette canvas');
 g.drawImage(source,0,0);
 // Each pixel keeps its painted luminance and edge transparency. Forest
 // green is a material transformation, not a flat fill over the Magier art.
 const image=g.getImageData(0,0,w,h),d=image.data;
 for(let row=0;row<8;row++)for(let col=0;col<w/96;col++){
  const tip=MAGE_SOCKETS[row][Math.min(15,col)]??MAGE_SOCKETS[row][0];
  const staffX=48+tip[0],staffY=88+tip[1],left=tip[0]<0;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const i=((row*96+y)*w+col*96+x)*4;
   if(d[i+3]<10)continue;
   // Crystal and wooden shaft exist outside the painted silhouette.
   // Preserve sleeve/hood pixels, but eliminate the floating wand.
   const outer=left?x<34:x>63;
   const along=y>=staffY-7&&y<=Math.min(84,staffY+48);
   const close=Math.abs(x-staffX)<=6+(y>staffY+26?1:0);
   if(outer&&((along&&close&&(gem(d,i)||darkStaff(d,i)))||
      (Math.hypot(x-staffX,y-staffY)<8&&gem(d,i)))){
    d[i+3]=0;continue;
   }
   if(magentaCloth(d,i)){
    // Shorten the magier's lower robe to a hunter's thigh-length tunic.
    // Only remove CLOTH pixels, not the already illustrated leather boots,
    // skin or shaded trousers. Keep all prone death poses unchanged.
    const standing=source.width<1536||col<14;
    const hem=row<=1?67:row<=3?69:70;
    if(standing&&(y>=76||y>=hem&&(x<43||x>54))){
     d[i+3]=0;continue;
    }
    const red=d[i],green=d[i+1],blue=d[i+2];
    const lum=.29*red+.33*green+.38*blue;
    // Preserve original painted luminance: no flat green overlays.
    d[i]=clamp(round(lum*.43+5),0,255);
    d[i+1]=clamp(round(lum*.87+14),0,255);
    d[i+2]=clamp(round(lum*.59+7),0,255);
   }
  }
 }
 g.putImageData(image,0,0);
 return canvas;
}
function rangerBackdrop(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const rear=sourceRow>=3,phase=clip==='walk'?Math.sin(frame*Math.PI/4):0;
 const sway=round(phase*2)+(clip==='dash'&&frame>0&&frame<5?2:0);
 // Asymmetric shoulder mantle with a single short, pointed side flap.
 // Extending beyond the Mage's outline changes the silhouette, not just hue.
 poly(g,C.outline,[[56,32],[63,31],[68,39],[66,55],[64+sway,68],
  [58+sway,73],[56,62],[55,44]]);
 poly(g,rear?C.olive:C.greenDark,[[57,33],[62,33],[65,39],[63,56],
  [61+sway,68],[59+sway,69],[58,60],[57,43]]);
 poly(g,C.greenLight,[[60,34],[63,37],[62,49],[60,54],[60,43]]);
 line(g,C.cloakShadow,60,51,58+sway,65,2);
 // High quiver band and one projecting bundle of feather tips.
 poly(g,C.outline,[[62,28],[69,27],[74,35],[71,43],[65,43],[61,36]]);
 poly(g,C.leatherDark,[[63,29],[68,29],[72,35],[69,41],[66,41],[63,36]]);
 for(let i=0;i<3;i++){
  const fx=65+i*3+(i===1?1:0),fy=23+(i%2);
  line(g,C.outline,fx,fy+13,fx+1,fy-7,3);
  line(g,C.arrow,fx,fy+11,fx+1,fy-5,1);
  px(g,C.feather,fx-1,fy-7,3,3);
  px(g,C.gold,fx,fy-7);
 }
}
function rangerHood(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const front=sourceRow<=1,profile=sourceRow===2||sourceRow===5;
 // Widen the angular cowl *around*, not across, the existing painted face.
 poly(g,C.outline,[[38,15],[43,10],[53,10],[60,15],[62,24],
  [59,31],[55,34],[40,34],[35,29],[35,21]]);
 poly(g,C.greenDark,[[39,16],[44,12],[53,12],[58,17],[60,24],
  [57,30],[54,32],[41,32],[37,27],[37,21]]);
 poly(g,C.green,[[40,17],[44,13],[51,12],[54,16],[42,19]]);
 line(g,C.greenLight,40,16,46,13,2);
 px(g,C.oliveLight,41,16,2,1);
 if(front){
  // Leave a window for the original Mage's face/eyes; cut open the hood
  // by repainting it from the *already-coloured underlying* body image.
  // The opening is supplied through the foreground mask in the caller.
  poly(g,C.outline,[[39,18],[43,17],[54,17],[58,21],[57,24],[55,20],[43,20],[39,23]]);
  line(g,C.hoodRim,42,18,55,18,1);
  px(g,C.oliveLight,40,21,2,2);
  // A tiny brow/scar gives the ranger a different expression.
  px(g,C.skinDark,52,27,2,1);
 }else if(profile){
  line(g,C.hoodRim,39,21,36,29,2);
  px(g,C.oliveLight,37,26,2,2);
 }else{
  // The rear cowl has a reinforced leather nape seam and no visible face.
  line(g,C.leatherDark,44,23,55,29,3);
  line(g,C.leatherLight,45,23,54,28,1);
  px(g,C.brass,50,27,2,2);
 }
 // Leather throat clasp sits underneath the chin, never over the eyes.
 px(g,C.leatherDark,42,34,13,4);px(g,C.brass,47,35,3,2);
}
function rangerHoodFrame(g,sourceRow,clip,frame,sourceImage,sourceFrame){
 // Draw the original full-detail face back into the cowl opening so the
 // hat may change silhouette without overwriting the expressive eyes.
 rangerHood(g,sourceRow,clip,frame);
 if(sourceRow<=1&&!(clip==='death'&&frame>=2)){
  g.save();
  g.beginPath();g.rect(42,21,13,12);g.clip();
  g.drawImage(sourceImage,sourceFrame*96,sourceRow*96,96,96,0,0,96,96);
  g.restore();
  line(g,C.hoodRim,41,20,55,20,1);
 }
}
function rangerCoatTails(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const gait=clip==='walk'?round(Math.sin(frame*Math.PI/4)*2):0;
 // Short tunic edges; separate leaves reveal two fully drawn legs.
 poly(g,C.outline,[[38,57],[43,57],[43,65],[40-gait,70],[36-gait,68]]);
 poly(g,C.greenDark,[[39,58],[42,58],[42,65],[39-gait,68],[37-gait,67]]);
 poly(g,C.greenLight,[[40,59],[41,59],[40,65],[39-gait,67]]);
 poly(g,C.outline,[[54,57],[58,57],[61+gait,66],[59+gait,70],[55,68]]);
 poly(g,C.olive,[[55,58],[57,58],[59+gait,66],[58+gait,68],[55,66]]);
 px(g,C.leatherDark,43,59,12,4);
 px(g,C.leatherLight,43,59,12,1);
 px(g,C.brass,47,59,4,3);px(g,C.gold,48,59,2,1);
}
function rangerArmour(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const front=sourceRow<=1||sourceRow===5;
 const sway=clip==='walk'?round(Math.sin(frame*Math.PI/4)):0;
 if(front){
  // Bulky, asymmetrical wood-and-leather cuirass with cross belt.
  poly(g,C.outline,[[36,37],[41,35],[54,35],[63,38],
   [64,45],[60,55],[54,61],[40,60],[35,51]]);
  poly(g,C.leatherDark,[[38,39],[43,37],[54,37],[61,40],
   [61,46],[57,55],[53,59],[41,58],[38,50]]);
  poly(g,C.leather,[[40,40],[44,38],[53,38],[58,41],
   [58,50],[54,56],[43,56],[40,49]]);
  poly(g,C.leatherLight,[[41,40],[44,39],[45,45],[43,49],[41,48]]);
  line(g,C.harness,40,41,56,54,4);line(g,C.gold,41,41,55,53,1);
  line(g,C.bark,56,42,42,55,3);
  px(g,C.brass,47,47,4,4);px(g,C.gold,48,47,2,2);
  px(g,C.green,44,53,11,2);
  px(g,C.oliveLight,43,55,3,1);
 }else{
  // Back chest-straps are visible around the real arrow case.
  line(g,C.leatherDark,40,39,58,53,6);
  line(g,C.harness,41,40,57,52,3);
  line(g,C.leatherDark,59,39,43,54,5);
  line(g,C.leatherLight,57,41,44,54,2);
  px(g,C.brass,47,47,4,4);px(g,C.gold,48,47,2,2);
 }
 // Asymmetric right shoulder guard (unique outline even from behind).
 poly(g,C.outline,[[56,35],[62,32],[68,37],[69,44],[64,49],[58,46]]);
 poly(g,C.leatherDark,[[58,36],[62,34],[66,38],[67,43],[63,47],[59,45]]);
 poly(g,C.leather,[[59,37],[62,35],[65,39],[65,44],[62,45]]);
 line(g,C.leatherLight,60,37,64,39,2);
 px(g,C.brass,63,41,3,3);
 // Smaller left-side protection makes the stance less symmetrical.
 poly(g,C.outline,[[38,36],[34,38],[33,45],[38,49],[42,45]]);
 poly(g,C.olive,[[37,38],[35,40],[35,45],[38,47],[40,44]]);
 px(g,C.brass,35,42,2,2);
 // Hanging leather pouches and an attachment for spare bowstrings.
 px(g,C.outline,36+sway,58,8,9);
 px(g,C.leatherDark,37+sway,59,6,7);
 px(g,C.leather,38+sway,60,4,5);
 px(g,C.brass,39+sway,60,2,2);
 px(g,C.outline,56-sway,59,7,8);
 px(g,C.leatherDark,57-sway,60,5,6);
 px(g,C.gold,58-sway,61,2,1);
 if(clip==='hurt'&&frame>=1&&frame<=3){
  px(g,C.skin,58,48,3,2);
  px(g,C.gold,37,46,2,1);
 }
}
function rangerQuiver(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const back=sourceRow>=3&&sourceRow<=5;
 const sway=clip==='walk'?round(Math.sin(frame*Math.PI/4)):0;
 const x=(back?67:69)+sway,y=32;
 // Prominent leather cylinder, strapped ONTO the body (not floating).
 line(g,C.outline,x-2,y+19,x+2,y-2,12);
 line(g,C.leatherDark,x-2,y+19,x+2,y-2,9);
 line(g,C.leather,x-2,y+18,x+2,y,7);
 line(g,C.leatherLight,x-1,y+16,x+2,y+2,2);
 line(g,C.brass,x-6,y+12,x+4,y+9,3);
 for(let i=0;i<4;i++){
  const ax=x+i*3-6,ay=y-4+(i%2?1:0);
  line(g,C.arrow,ax,ay+10,ax+1,ay-6,1);
  px(g,C.feather,ax-1,ay-7,3,3);
  px(g,C.gold,ax,ay-7);
 }
}
function rangerBoots(g,sourceRow,clip,frame){
 if(clip==='death'&&frame>=2)return;
 const walk=clip==='walk';
 const xs=sourceRow>=3?[43,54]:[42,55];
 for(let i=0;i<2;i++){
  // Knee-high wrap and a reinforced shin guard. No movement of soles.
  const x=xs[i],lift=walk?round(Math.max(0,Math.sin(frame*Math.PI/4+i*Math.PI))):0;
  px(g,C.outline,x-3,71-lift,7,7);
  px(g,C.leatherDark,x-2,72-lift,5,5);
  px(g,C.leather,x-2,73-lift,4,3);
  px(g,C.harness,x-2,74-lift,4,1);
  px(g,C.brass,x,75-lift,1,1);
 }
}
function droppedBow(g,row,frame){
 const x=row<4?26:60,y=81+(frame>5?1:0);
 line(g,C.outline,x-9,y-1,x+10,y,4);
 line(g,C.leather,x-9,y-1,x+10,y,2);
 line(g,C.cord,x-9,y-1,x+10,y,1);
 px(g,C.brass,x+9,y-1,2,2);
}
function bowBase(row,clip,frame){
 const sourceRow=hunterSourceRow(row);
 const [dx,dy]=DIRECTIONS[sourceRow],d={x:dx,y:dy};
 // Staff-hand placement is sampled from the actual Magier anatomy.
 const x0=48+MAGE_SOCKETS[sourceRow][0][0];
 const charging=(clip==='attack'||clip==='special')&&(frame===1||frame===2);
 const shooting=(clip==='attack'||clip==='special')&&frame===3;
 const active=charging||shooting;
 const gait=clip==='walk'?round(Math.sin(frame*PI/4)):0;
 const grip={
  x:clamp(round(x0+(active?(-d.x*2):0)),20,76),
  y:48+gait+round(d.y*(active?2:0))
 };
 // Carry the bow upright in stand/walk; aim it forward only when firing.
 // This creates a recognisable ranger silhouette without a cross-body
 // horizontal bow intersecting the chest in the neutral stance.
 const dir=active?d:{x:1,y:0};
 const perp={x:-dir.y,y:dir.x};
 const tip={
  x:clamp(round(grip.x+dir.x*(active?17:13)),5,91),
  y:clamp(round(grip.y+dir.y*(active?17:13)),7,88)
 };
 const nock={
  x:round(grip.x-dir.x*(charging?(frame===1?7:clip==='special'?19:14):4)),
  y:round(grip.y-dir.y*(charging?(frame===1?7:clip==='special'?19:14):4))
 };
 const ends=[{x:round(grip.x+perp.x*19),y:round(grip.y+perp.y*19)},
  {x:round(grip.x-perp.x*19),y:round(grip.y-perp.y*19)}];
 return {grip,tip,nock,ends,dir,perp,charging,shooting,active,sourceRow};
}
// Socket matches a VISIBLE golden nock pixel. East directions mirror the
// whole frame along with weapon/arm; never mirror the gameplay physics twice.
export function hunterMageBowLayout(row,clip='attack',frame=3){
 const b=bowBase(row,clip,frame),mirror=hunterMirrored(row);
 const transform=p=>({x:mirror?95-p.x:p.x,y:p.y});
 return {...b,grip:transform(b.grip),tip:transform(b.tip),
  nock:transform(b.nock),ends:b.ends.map(transform)};
}
export function drawHunterMageBow(g,row,clip,frame){
 const b=bowBase(row,clip,frame);
 const {grip,tip,nock,dir,perp,ends}=b;
 // Move the leather-gloved grip hand from the torso; no detached arms.
 const shoulder={x:48+(grip.x<48?-11:11),y:44};
 line(g,C.outline,shoulder.x,shoulder.y,grip.x,grip.y,7);
 line(g,C.leatherDark,shoulder.x,shoulder.y,grip.x,grip.y,5);
 line(g,C.leather,shoulder.x,shoulder.y-1,grip.x,grip.y-1,3);
 const knot={x:round(grip.x+dir.x*5),y:round(grip.y+dir.y*5)};
 for(const end of ends){
  line(g,C.outline,end.x,end.y,knot.x,knot.y,6);
  line(g,C.leatherDark,end.x,end.y,knot.x,knot.y,4);
  line(g,C.leather,end.x,end.y,knot.x,knot.y,3);
  line(g,C.light,end.x,end.y,knot.x,knot.y,1);
  px(g,C.brass,end.x-1,end.y-1,3,3);
  px(g,C.gold,end.x,end.y);
 }
 // Bow-string snaps to the draw hand and is fully relaxed after contact.
 const stringPoint=b.charging?nock:{
  x:round(grip.x-dir.x*4),y:round(grip.y-dir.y*4)};
 line(g,C.cord,ends[0].x,ends[0].y,stringPoint.x,stringPoint.y,1);
 line(g,C.cord,stringPoint.x,stringPoint.y,ends[1].x,ends[1].y,1);
 px(g,C.outline,grip.x-3,grip.y-3,6,6);
 px(g,C.skinDark,grip.x-2,grip.y-2,4,4);
 px(g,C.skin,grip.x-1,grip.y-2,3,3);
 if(b.charging){
  // Opposite hand comes from the other shoulder and actually holds the nock.
  const other={x:48+(grip.x<48?10:-10),y:43};
  line(g,C.outline,other.x,other.y,nock.x,nock.y,7);
  line(g,C.leatherDark,other.x,other.y,nock.x,nock.y,5);
  line(g,C.skin,other.x,other.y,nock.x,nock.y,2);
  const offsets=clip==='special'?[-3,0,3]:[0];
  for(const offset of offsets){
   const ox=round(perp.x*offset),oy=round(perp.y*offset);
   line(g,C.outline,nock.x+ox,nock.y+oy,tip.x+ox,tip.y+oy,3);
   line(g,C.arrow,nock.x+ox,nock.y+oy,tip.x+ox,tip.y+oy,1);
   px(g,C.feather,nock.x+ox-2,nock.y+oy-2,3,3);
   px(g,C.gold,tip.x+ox-1,tip.y+oy-1,3,3);
  }
  px(g,C.skin,nock.x-2,nock.y-2,4,4);
 }
 if(b.shooting){
  px(g,C.brass,tip.x-2,tip.y-2,5,5);
  px(g,C.gold,tip.x-1,tip.y-1,3,3);
 }
 if(clip==='dash'&&frame>0&&frame<5){
  px(g,C.greenLight,grip.x+round(perp.x*5),grip.y+round(perp.y*5),2,2);
 }
}
// Draw extra clothing and weapon atop the recoloured Magier *as one pose*
// on the same 96×96 pixel grid. No independent world-scale limbs.
export function drawHunterMageOverlays(g,row,clip,frame,sourceImage,sourceFrame){
 const sourceRow=hunterSourceRow(row);
 if(clip==='death'&&frame>=2){
  droppedBow(g,row,frame);
  return;
 }
 rangerCoatTails(g,sourceRow,clip,frame);
 rangerArmour(g,sourceRow,clip,frame);
 rangerQuiver(g,sourceRow,clip,frame);
 rangerBoots(g,sourceRow,clip,frame);
 if(sourceImage)rangerHoodFrame(g,sourceRow,clip,frame,sourceImage,sourceFrame);
 else rangerHood(g,sourceRow,clip,frame);
 drawHunterMageBow(g,row,clip,frame);
 if(clip==='idle'){
  px(g,frame%3===0?C.gold:C.brass,48,57,2,2);
  if(frame===3)px(g,C.greenDark,53,44,2,1);
 }
}
export function hunterStyledSample(g,source,walk,row,clip,frame){
 const sourceRow=hunterSourceRow(row),mirrored=hunterMirrored(row);
 g.save();g.imageSmoothingEnabled=false;
 if(mirrored){g.translate(96,0);g.scale(-1,1);}
 const sourceFrame=clip==='walk'?frame+1:hunterStyleActionSource(clip,frame);
 // Reuse the EXACT settled Magier body for idle and all neutral recoveries,
 // rather than its earlier action-sheet neutral pose (which shifts the torso).
 const image=clip==='walk'||(sourceFrame===0&&clip!=='death')?walk:source;
 rangerBackdrop(g,sourceRow,clip,frame);
 g.drawImage(image,sourceFrame*96,sourceRow*96,96,96,0,0,96,96);
 drawHunterMageOverlays(g,row,clip,frame,image,sourceFrame);
 g.restore();
}
