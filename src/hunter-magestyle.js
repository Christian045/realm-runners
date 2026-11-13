// Realm Runners Jäger 0.71: a sister character to the production Magier.
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
const WHITE=['#faf0c3','#e8c18b','#dcac6e'];
const SWATCH=Object.freeze({
 outline:'#251f23',shadow:'#392a28',leatherDark:'#49312d',leather:'#7c5338',
 leatherLight:'#ad8356',light:'#dfb47a',greenDark:'#214537',
 green:'#3f7954',greenLight:'#75ac7d',brass:'#cfad6b',
 gold:'#f0d49c',cord:'#d3c9a2',arrow:'#e8c992',
 feather:'#98c68a',skin:'#e7b993',skinDark:'#b97c60',
 boot:'#382c2c'
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
    const red=d[i],green=d[i+1],blue=d[i+2];
    const lum=.29*red+.33*green+.38*blue;
    // Dark fir-green velvet; fine painted fabric creases stay intact.
    d[i]=clamp(round(lum*.43+5),0,255);
    d[i+1]=clamp(round(lum*.87+14),0,255);
    d[i+2]=clamp(round(lum*.59+7),0,255);
   }
  }
 }
 g.putImageData(image,0,0);
 return canvas;
}
function hunterLeatherTorso(g,sourceRow,clip,frame){
 const front=sourceRow<=1||sourceRow===5;
 // Distinct short reinforced hunting jerkin over the mage's tunic; the hood,
 // exposed face and natural boots still come from the detailed original art.
 if(front){
  poly(g,C.outline,[[39,39],[43,37],[55,37],[60,41],[59,55],[54,60],[42,58],[37,52]]);
  poly(g,C.leatherDark,[[40,40],[44,38],[55,38],[58,42],[57,54],[53,58],[43,56],[39,51]]);
  poly(g,C.leather,[[42,40],[46,39],[55,39],[56,46],[54,54],[43,53],[40,49]]);
  line(g,C.leatherLight,44,40,42,50,2);
  line(g,C.light,55,40,55,44,1);
  line(g,C.shadow,43,40,55,54,5);
  line(g,C.leatherLight,44,41,55,53,2);
  px(g,C.brass,48,45,3,3);px(g,C.gold,49,45);
  px(g,C.leatherDark,41,57,14,4);
  px(g,C.brass,47,57,3,3);
  px(g,C.leather,41,61,6,4);px(g,C.leather,52,61,6,4);
  line(g,C.greenLight,40,49,41,54,1);
 }else{
  // Dedicated back silhouette retains the big shaded hood and shorter
  // green mantle; the crossed harness and quiver signal a ranger.
  line(g,C.leatherDark,41,39,56,53,5);
  line(g,C.leatherLight,41,39,55,52,2);
  line(g,C.leatherDark,56,39,42,54,4);
  line(g,C.leatherLight,55,40,43,53,1);
  px(g,C.brass,47,46,3,3);
 }
 if(clip==='hurt'&&frame>=1&&frame<=3){
  px(g,C.skin,57,47,2,2);
  px(g,C.brass,40,48,2,2);
 }
}
function hunterQuiver(g,sourceRow,clip,frame){
 // Draw on the body, not as a separately floating inventory attachment.
 // The leather case overlaps the shoulder/upper mantle in every direction.
 const back=sourceRow>=3&&sourceRow<=5;
 const x=back?59:62,y=31+(clip==='walk'&&frame%4===1?1:0);
 line(g,C.outline,x-1,y+20,x+3,y+1,11);
 line(g,C.leatherDark,x-1,y+20,x+3,y+1,8);
 line(g,C.leather,x-1,y+19,x+3,y+3,6);
 line(g,C.leatherLight,x,y+10,x+3,y+4,1);
 line(g,C.brass,x-5,y+15,x+4,y+12,2);
 for(let i=0;i<3;i++){
  const tx=x+i*3-3,ty=y+(i%2?2:0);
  line(g,C.outline,tx,ty+10,tx+2,ty-5,3);
  line(g,C.arrow,tx+1,ty+9,tx+2,ty-4,1);
  px(g,C.feather,tx,ty-7,3,3);
  px(g,C.gold,tx+1,ty-7,1,1);
 }
}
function hunterBootBands(g,sourceRow,clip,frame){
 // Distinct rugged boots visible below the hunter's short jerkin.
 const bob=clip==='walk'?Math.round(Math.sin(frame*Math.PI/4)):0;
 for(const x of sourceRow>=3?[43,54]:[42,55]){
  px(g,C.leatherDark,x-2,74+bob,5,3);
  px(g,C.leatherLight,x-1,74+bob,3,1);
 }
}
function bowBase(row,clip,frame){
 const sourceRow=hunterSourceRow(row);
 const [dx,dy]=DIRECTIONS[sourceRow],d={x:dx,y:dy};
 // Staff-hand placement is sampled from the actual Magier anatomy.
 const x0=48+MAGE_SOCKETS[sourceRow][0][0];
 const charging=(clip==='attack'||clip==='special')&&frame===1||(
  (clip==='attack'||clip==='special')&&frame===2);
 const shooting=(clip==='attack'||clip==='special')&&frame===3;
 const active=charging||shooting;
 const grip={
  x:clamp(round(x0+(active?(-d.x*2):0)),20,76),
  y:48+round(d.y*(active?2:0))
 };
 const dir=active?d:{x:0,y:-1};
 const perp={x:-dir.y,y:dir.x};
 const tip={
  x:clamp(round(grip.x+dir.x*(active?17:13)),5,91),
  y:clamp(round(grip.y+dir.y*(active?17:13)),7,88)
 };
 const nock={
  x:round(grip.x-dir.x*(charging?(frame===1?7:14):4)),
  y:round(grip.y-dir.y*(charging?(frame===1?7:14):4))
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
export function drawHunterMageOverlays(g,row,clip,frame){
 const sourceRow=hunterSourceRow(row);
 hunterLeatherTorso(g,sourceRow,clip,frame);
 hunterQuiver(g,sourceRow,clip,frame);
 hunterBootBands(g,sourceRow,clip,frame);
 drawHunterMageBow(g,row,clip,frame);
 if(clip==='idle'){
  // Breath accents do not move feet, face or robe geometry.
  px(g,frame%3===0?C.gold:C.brass,48,57,2,2);
  if(frame===3)px(g,C.greenDark,53,44,2,1);
 }
}
export function hunterStyledSample(g,source,walk,row,clip,frame){
 const sourceRow=hunterSourceRow(row),mirrored=hunterMirrored(row);
 g.save();g.imageSmoothingEnabled=false;
 if(mirrored){g.translate(96,0);g.scale(-1,1);}
 const sourceFrame=clip==='walk'?frame+1:hunterStyleActionSource(clip,frame);
 const image=clip==='walk'?walk:source;
 g.drawImage(image,sourceFrame*96,sourceRow*96,96,96,0,0,96,96);
 drawHunterMageOverlays(g,row,clip,frame);
 g.restore();
}
