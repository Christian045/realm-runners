// Original complete-body 72px pixel-art hunter. Each atlas cell is one
// authored full-figure pose, not rotated joints of the former hero rig.
// Facing rows: S, SW, W, NW, N, NE, E, SE. World foot anchor: (36, 60).
export const HUNTER_COUNTS=Object.freeze({idle:6,walk:8,attack:6,special:6,dash:6,hurt:6,death:8});
export const HUNTER_SIZE=72,HUNTER_SCALE=1.6,HUNTER_FOOT=Object.freeze({x:36,y:60});
export const HUNTER_ROWS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
const palette={
 ink:'#19252a',black:'#101b22',deep:'#25372e',cape:'#315d49',capeLight:'#45815b',
 forest:'#3c7652',forestLight:'#65a572',forestDark:'#244b3a',
 gold:'#d4b476',goldLight:'#f1d99b',leather:'#704b39',leatherLight:'#a27750',
 leatherDark:'#47302d',skin:'#e5b68b',skinLight:'#f5d5a7',skinShadow:'#b57c60',
 eyes:'#283037',pants:'#484b42',pantsLight:'#70705b',boots:'#48362f',
 bootsLight:'#805c43',bow:'#ae7340',bowLight:'#f0bf7a',string:'#f0e6c7',
 shaft:'#e8c78e',feather:'#add38d',silver:'#f0ebcc'
};
const P=palette,pi=Math.PI,clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),r=Math.round;
const dirs=[[0,1],[-Math.SQRT1_2,Math.SQRT1_2],[-1,0],
 [-Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[Math.SQRT1_2,-Math.SQRT1_2],
 [1,0],[Math.SQRT1_2,Math.SQRT1_2]];
export const hunterFacing=d=>(Math.round((Math.atan2(d?.y??1,d?.x??0)-pi/2)/(pi/4))+8)%8;
export const hunterDirection=row=>({x:dirs[(row+8)%8][0],y:dirs[(row+8)%8][1]});
const box=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(r(x),r(y),Math.max(1,r(w)),Math.max(1,r(h)));};
const polygon=(g,c,pts)=>{
 g.fillStyle=c;g.beginPath();g.moveTo(r(pts[0][0]),r(pts[0][1]));
 for(let i=1;i<pts.length;i++)g.lineTo(r(pts[i][0]),r(pts[i][1]));
 g.closePath();g.fill();
};
const line=(g,c,x0,y0,x1,y1,w=1)=>{
 x0=r(x0);y0=r(y0);x1=r(x1);y1=r(y1);
 let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
 for(;;){
  box(g,c,x0-Math.floor(w/2),y0-Math.floor(w/2),w,w);
  if(x0===x1&&y0===y1)break;
  let e=2*err;if(e>-dy){err-=dy;x0+=sx;}if(e<dx){err+=dx;y0+=sy;}
 }
};
const lean=(clip,f)=>clip==='attack'||clip==='special'?[0,-1,-2,2,1,0][f]:
 clip==='dash'?[0,-1,-2,-2,-1,0][f]:clip==='hurt'?[0,-2,-3,-2,-1,0][f]:0;
const shift=(row,clip,f)=>{
 const d=hunterDirection(row),v=lean(clip,f);return {x:r(d.x*v),y:r(d.y*v*.45)};
};
// The bow grip, arrowhead and nock are shared between rendering and physics.
// Attack/special: wind-up frames 1/2; exactly frame 3 releases the arrow.
export function hunterBowLayout(row,clip,frame){
 const d=hunterDirection(row),offset=shift(row,clip,frame);
 const grip={x:36+r(d.x*10)+offset.x,y:33+r(d.y*6)+offset.y};
 const tip={x:grip.x+r(d.x*12),y:grip.y+r(d.y*12)};
 const charging=(clip==='attack'||clip==='special')&&frame>=1&&frame<3;
 const released=(clip==='attack'||clip==='special')&&frame===3;
 const draw=charging?(frame===1?6:12):0;
 const nock={x:grip.x-r(d.x*(6+draw)),y:grip.y-r(d.y*(6+draw))};
 const perp={x:-d.y,y:d.x},ends=[{x:grip.x+r(perp.x*14),y:grip.y+r(perp.y*14)},
  {x:grip.x-r(perp.x*14),y:grip.y-r(perp.y*14)}];
 return {grip,tip,nock,perp,ends,d,charging,released,
  multi:clip==='special'&&charging,offset};
}
function legs(g,row,clip,f){
 const d=hunterDirection(row),walking=clip==='walk',phase=f*pi/4;
 for(const side of [-1,1]){
  const motion=phase+(side===-1?0:pi);
  const lift=walking?Math.max(0,Math.sin(motion))*3:0;
  const stride=walking?Math.cos(motion)*5:0;
  const x=r(36+side*(Math.abs(d.x)>.91?4:6)+d.x*stride);
  const k=r(36+side*6+d.x*stride*.35),bottom=60-r(lift);
  box(g,P.ink,k-5,40,10,14);box(g,P.pants,k-4,42,8,12);
  box(g,P.pantsLight,k+2,45,2,5);
  line(g,P.ink,k,49,x,bottom-6,10);line(g,P.pants,k,49,x,bottom-6,7);
  box(g,P.ink,x-6,bottom-7,12,8);box(g,P.boots,x-5,bottom-6,10,6);
  box(g,P.bootsLight,x-4,bottom-5,7,2);
  box(g,P.black,x-6,bottom,12,1);
 }
}
function cape(g,row,clip,f,offset){
 const d=hunterDirection(row),s=clip==='walk'?r(Math.sin(f*pi/4)*2):clip==='dash'?3:0;
 const x=offset.x,y=offset.y;
 polygon(g,P.ink,[[26+x,28+y],[46+x,28+y],[49+x,49],[48+x+s,54],
  [40+x,51],[36+x,55],[30+x,51],[23+x-s,54],[23+x,46]]);
 polygon(g,d.y<-.3?P.capeLight:P.cape,[[28+x,29+y],[44+x,29+y],
  [47+x,49],[45+x+s,52],[40+x,49],[36+x,52],[30+x,49],
  [26+x-s,52],[25+x,45]]);
 polygon(g,P.deep,[[27+x,30+y],[34+x,35+y],[32+x,47],[26+x,50]]);
 line(g,P.forestLight,44+x,32+y,44+x+s,47,1);
}
function quiver(g,row,off){
 const d=hunterDirection(row);
 if(d.y>=.3&&Math.abs(d.x)<.1)return;
 const s=d.x<-.25?1:-1,x=36+s*15+off.x,y=24+off.y;
 line(g,P.ink,x,y+18,x-s*3,y-2,9);
 line(g,P.leather,x,y+18,x-s*3,y-2,6);
 line(g,P.gold,x,y+4,x-s,y-1,1);
 for(let n=-1;n<=1;n++){
  const a=x+s*(n*3-2),b=y-4+(n%2)*2;
  line(g,P.shaft,a,b+11,a-s,b,1);
  box(g,P.feather,a-2,b-2,4,3);
 }
}
function torso(g,row,clip,f,off){
 const d=hunterDirection(row),front=d.y>=-.25;
 g.save();g.translate(off.x,off.y);
 polygon(g,P.ink,[[25,29],[30,26],[42,26],[47,29],[50,39],
  [46,44],[46,50],[26,50],[26,44],[22,39]]);
 polygon(g,P.leatherDark,[[27,29],[31,27],[41,27],[45,29],
  [46,45],[43,48],[29,48],[26,44]]);
 polygon(g,front?P.cape:P.forestDark,[[30,29],[42,29],[45,42],[27,42]]);
 polygon(g,P.forest,[[29,29],[43,29],[44,43],[28,43]]);
 polygon(g,P.forestLight,[[30,30],[33,30],[33,42],[29,42]]);
 polygon(g,P.deep,[[40,31],[43,30],[43,43],[40,44]]);
 if(front){line(g,P.leatherDark,28,31,43,44,5);line(g,P.leatherLight,28,31,43,44,2);}
 else{line(g,P.leatherDark,42,31,28,45,4);line(g,P.leatherLight,42,31,29,44,2);}
 box(g,P.leatherDark,26,43,20,6);box(g,P.gold,33,44,6,3);
 box(g,P.deep,35,44,2,3);
 box(g,P.ink,26,27,8,9);box(g,P.forestDark,27,28,6,7);
 box(g,P.ink,40,27,8,9);box(g,P.cape,41,28,6,7);
 if(Math.abs(d.x)>.8)box(g,P.leatherLight,d.x>0?43:27,34,3,7);
 if(clip==='hurt'&&f>=1&&f<=3)box(g,P.skinLight,28,34,3,2);
 g.restore();
}
function hood(g,row,clip,f,off){
 const d=hunterDirection(row),front=d.y>-.35,side=Math.abs(d.x)>.8;
 g.save();g.translate(off.x,off.y);
 polygon(g,P.ink,[[31,7],[39,7],[44,11],[47,16],[45,27],
  [41,30],[29,30],[26,24],[27,14]]);
 polygon(g,P.forestDark,[[32,8],[39,8],[44,13],[45,22],
  [41,28],[29,28],[28,20],[29,12]]);
 polygon(g,P.forest,[[32,8],[39,8],[42,11],[44,17],[41,24],[29,23],[29,15]]);
 polygon(g,P.forestLight,[[32,9],[36,8],[39,10],[33,12],[30,17],[28,19],[29,13]]);
 box(g,P.capeLight,28,23,6,5);
 if(front){
  const o=side?(d.x>0?2:-2):r(d.x*2);
  polygon(g,P.leatherDark,[[31+o,16],[41+o,16],[41+o,24],[37+o,27],[32+o,24]]);
  polygon(g,P.skin,[[32+o,17],[40+o,17],[41+o,23],[37+o,27],[33+o,23]]);
  box(g,P.skinLight,33+o,18,5,3);box(g,P.skinShadow,32+o,23,8,2);
  if(side)box(g,P.eyes,36+o+(d.x>0?2:-2),20,2,2);
  else{box(g,P.eyes,33+o,20,2,2);box(g,P.eyes,39+o,20,2,2);}
  box(g,P.skinShadow,36+o,23,2,2);
  if(clip==='idle'&&f===3)box(g,P.skin,33+o,20,3,2);
 }else{
  box(g,P.cape,32,15,10,11);box(g,P.capeLight,32,13,4,12);
  line(g,P.forestDark,41,14,42,24,2);
 }
 box(g,P.ink,31,27,10,3);box(g,P.gold,32,27,8,1);
 g.restore();
}
function bow(g,row,clip,f,b){
 const {grip,nock,ends,d,perp,charging,released,multi,offset}=b;
 const a={x:36+r(perp.x*9)+offset.x,y:31+r(perp.y*5)+offset.y};
 const z={x:36-r(perp.x*9)+offset.x,y:31-r(perp.y*5)+offset.y};
 line(g,P.ink,a.x,a.y,grip.x,grip.y,8);line(g,P.forest,a.x,a.y,grip.x,grip.y,5);
 line(g,P.ink,z.x,z.y,nock.x,nock.y,7);line(g,P.forestDark,z.x,z.y,nock.x,nock.y,5);
 const mid={x:grip.x+r(d.x*6),y:grip.y+r(d.y*6)};
 line(g,P.ink,ends[0].x,ends[0].y,mid.x,mid.y,5);
 line(g,P.ink,mid.x,mid.y,ends[1].x,ends[1].y,5);
 line(g,P.bow,ends[0].x,ends[0].y,mid.x,mid.y,3);
 line(g,P.bow,mid.x,mid.y,ends[1].x,ends[1].y,3);
 line(g,P.bowLight,ends[0].x,ends[0].y,mid.x,mid.y);
 line(g,P.bowLight,mid.x,mid.y,ends[1].x,ends[1].y);
 const point=charging?nock:{x:grip.x-r(d.x*3),y:grip.y-r(d.y*3)};
 line(g,P.string,ends[0].x,ends[0].y,point.x,point.y);
 line(g,P.string,point.x,point.y,ends[1].x,ends[1].y);
 box(g,P.ink,grip.x-3,grip.y-3,6,6);
 box(g,P.skin,grip.x-2,grip.y-2,4,4);
 box(g,P.skinLight,nock.x-2,nock.y-2,4,4);
 if(charging){
  for(const n of (multi?[-3,0,3]:[0])){
   const ox=r(perp.x*n),oy=r(perp.y*n);
   line(g,P.shaft,nock.x+ox,nock.y+oy,b.tip.x+ox,b.tip.y+oy,2);
   box(g,P.feather,nock.x+ox-2,nock.y+oy-2,4,4);
   box(g,P.goldLight,b.tip.x+ox-1,b.tip.y+oy-1,3,3);
  }
 }
 box(g,released?P.goldLight:P.bowLight,b.tip.x-1,b.tip.y-1,3,3);
 if(released){
  box(g,P.gold,b.tip.x+r(perp.x*4),b.tip.y+r(perp.y*4),2,2);
  box(g,P.gold,b.tip.x-r(perp.x*4),b.tip.y-r(perp.y*4),2,2);
 }
}
function death(g,row,f){
 const d=hunterDirection(row),side=d.x>=0?1:-1;
 if(f<2){
  legs(g,row,'idle',0);
  const offset={x:side*(f+1),y:4+f*6};
  cape(g,row,'hurt',0,offset);
  torso(g,row,'hurt',2,offset);
  hood(g,row,'hurt',2,offset);
  bow(g,row,'idle',0,hunterBowLayout(row,'idle',0));return;
 }
 const x=r(36+side*4),y=r(53+f/7*2),spread=r(f/7*5);
 polygon(g,P.ink,[[x-25-spread,y+4],[x-19,y-8],[x+12,y-10],
  [x+23+spread,y-3],[x+21,y+6],[x-20,y+8]]);
 polygon(g,P.cape,[[x-23-spread,y+3],[x-17,y-7],[x+14,y-7],
  [x+21,y+1],[x+17,y+4],[x-19,y+5]]);
 box(g,P.leatherDark,x-13,y-7,26,10);
 box(g,P.forest,x-10,y-9,18,10);
 box(g,P.forestLight,x-9,y-8,6,4);
 box(g,P.ink,x+12,y-6,13,11);
 box(g,P.boots,x+13,y-5,10,9);
 box(g,P.black,x+13,y+5,11,1);
 box(g,P.skin,x-16*side-2,y-6,5,6);
 line(g,P.bow,x-28,y-6,x-27+spread,y+7,3);
 box(g,P.gold,x-26+spread,y+7,3,2);
 box(g,P.black,x-11,y+7,23,1);
}
export function drawHunterFrame(g,row,clip,frame){
 if(!Object.hasOwn(HUNTER_COUNTS,clip))throw new RangeError('Unknown hunter clip '+clip);
 row=(row+8)%8;frame=clamp(Math.floor(frame),0,HUNTER_COUNTS[clip]-1);
 g.imageSmoothingEnabled=false;
 if(clip==='death'){death(g,row,frame);return;}
 const off=shift(row,clip,frame);
 legs(g,row,clip,frame);cape(g,row,clip,frame,off);
 quiver(g,row,off);torso(g,row,clip,frame,off);hood(g,row,clip,frame,off);
 bow(g,row,clip,frame,hunterBowLayout(row,clip,frame));
 if(clip==='dash'&&frame>=1&&frame<5){
  box(g,P.capeLight,19+frame,46,3,2);
  box(g,P.forestLight,16+frame,49,2,2);
 }
 if(clip==='hurt'&&frame>=1&&frame<4){
  box(g,P.skinLight,49,25,3,2);box(g,P.skinLight,53,22,2,2);
 }
 if(clip==='idle'){
  box(g,frame%3===0?P.forestLight:P.capeLight,35+r(hunterDirection(row).x*3),37,2,2);
  if(frame===2||frame===5)box(g,P.goldLight,37,45,2,1);
 }
}
export function bakeHunterSheets(canvasFactory){
 const result={};
 for(const [clip,count] of Object.entries(HUNTER_COUNTS)){
  const sheet=canvasFactory();sheet.width=72*count;sheet.height=72*8;
  const g=sheet.getContext('2d');if(!g)throw Error('Jäger canvas unavailable');
  g.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
   g.save();g.translate(frame*72,row*72);drawHunterFrame(g,row,clip,frame);g.restore();
  }
  result[clip]=sheet;
 }
 return result;
}
