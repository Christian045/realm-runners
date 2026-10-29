import { TILE, clamp, distance } from './data.js?v=0.21.0';
import { ROOM_W, ROOM_H } from './dungeon.js?v=0.21.0';
import {drawWardenWarnings} from './warden.js?v=0.15.0';
import {drawTowerBossWarnings} from './tower-boss.js?v=0.18.0';
import {drawTowerEnvironment} from './tower-visuals.js';

const THEMES={
 sanctuary:{floor:'#3f6853',accent:'#afd9a3',glow:'#98e8b1',name:'HEILIGTUM'},
 crypt:{floor:'#536065',accent:'#c9d9d4',glow:'#79bad6',name:'GRUFT'},
 fungal:{floor:'#3d6250',accent:'#9be7a4',glow:'#8cf1ae',name:'PILZGROTTE'},
 flooded:{floor:'#41616c',accent:'#9fdce0',glow:'#69a6ca',name:'VERSUNKENE HALLE'},
 reliquary:{floor:'#77654c',accent:'#f0d59c',glow:'#f7b95d',name:'RELIQUIENKAMMER'},
 throne:{floor:'#72445b',accent:'#f2a5b6',glow:'#ef6e92',name:'THRON DES KÖNIGS'}
};
export function roomTheme(room){return THEMES[room?.theme]||THEMES.crypt}
const noise=(seed,n)=>{let a=(Math.imul((seed^n)>>>0, 2246822519)+3266489917)>>>0;a^=a>>>13;return (Math.imul(a,3266489917)>>>0)/4294967295};
const rect=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
function circle(ctx,x,y,r,color,line=2){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=line;ctx.stroke()}
function renderSigil(ctx,x,y,r,accent,time=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*.3)*.025);
 circle(ctx,0,0,r,accent+'8b',3);circle(ctx,0,0,r*.77,accent+'66',2);
 ctx.strokeStyle=accent+'aa';ctx.lineWidth=2;ctx.beginPath();
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3-Math.PI/2;
  const px=Math.cos(a)*r*.7,py=Math.sin(a)*r*.7;
  if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
 }ctx.closePath();ctx.stroke();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  rect(ctx,accent+'88',Math.cos(a)*r-2,Math.sin(a)*r-2,4,4);
 }
 ctx.restore();
}
function drawCobweb(ctx,x,y,mirror=false){
 ctx.save();ctx.translate(x,y);if(mirror)ctx.scale(-1,1);
 ctx.strokeStyle='#bcd6b855';ctx.lineWidth=1;
 for(let i=0;i<4;i++){
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(45-i*8,12+i*13);ctx.stroke();
 }
 for(let k=1;k<=3;k++){
  ctx.beginPath();ctx.moveTo(43-k*10,5);ctx.quadraticCurveTo(21-k*5,18+k*7,3,38+k*6);ctx.stroke();
 }
 ctx.restore();
}
function drawMushroom(ctx,x,y,size,color){
 rect(ctx,'#c9b4a0',x-3,y-2,size*.3,size*.66);
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y-4,size*.63,size*.37,0,Math.PI,Math.PI*2);ctx.fill();
 rect(ctx,'#f9d9bd',x-5,y-9,5,3);
}
function drawChest(ctx,x,y,opened=false){
 rect(ctx,'#0c2528',x-26,y-10,52,38);
 rect(ctx,'#a17a4f',x-22,y-16,44,27);
 rect(ctx,'#4b342a',x-19,y-12,38,8);
 rect(ctx,'#c29e61',x-22,y+1,44,6);
 rect(ctx,'#f5d68a',x-4,y-7,8,16);
 if(opened)rect(ctx,'#74a281',x-16,y-14,32,7);
}
function light(ctx,x,y,r,color,alpha=1){
 const g=ctx.createRadialGradient(x,y,1,x,y,r);
 g.addColorStop(0,color+'66');g.addColorStop(.25,color+'30');g.addColorStop(1,color+'00');
 ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.globalAlpha=1;
}
function torch(ctx,x,y,time,seed,warm=true){
 const flicker=2*Math.sin(time*8+seed*1.4)+1.3*Math.sin(time*17+seed);
 rect(ctx,'#13262a',x-10,y+3,20,23);
 rect(ctx,'#718078',x-7,y,14,14);rect(ctx,'#b2a287',x-5,y+2,10,5);
 ctx.fillStyle=warm?'#f3b765':'#94efd0';ctx.beginPath();
 ctx.moveTo(x-6,y+3);ctx.quadraticCurveTo(x-5,y-15+flicker,x+2,y-18+flicker);
 ctx.quadraticCurveTo(x+12,y-5,x+6,y+3);ctx.fill();
 rect(ctx,warm?'#ffe4a2':'#d0ffde',x-2,y-7+flicker*.5,4,9);
}
export function drawDungeonAtmosphere(ctx,game){
 const d=game.dungeon,cam=game.camera,time=game.time;
 const cw=cam.w,ch=cam.h;
 ctx.save();
 // Distinct floors and static dressing per room, all seeded and independent of FPS.
 for(const room of d.rooms){
  const left=room.gx*ROOM_W*TILE,top=room.gy*ROOM_H*TILE;
  const right=left+ROOM_W*TILE,bottom=top+ROOM_H*TILE;
  if(right<cam.x-100||left>cam.x+cw+100||bottom<cam.y-100||top>cam.y+ch+100)continue;
  const th=roomTheme(room),cx=room.cx,cy=room.cy;
  const interiorX=left+2*TILE,interiorY=top+2*TILE;
  const interiorW=(ROOM_W-4)*TILE,interiorH=(ROOM_H-4)*TILE;
  // Glyphs, irregular tiled borders, and overgrown paths.
  ctx.strokeStyle=th.accent+'55';ctx.lineWidth=2;
  ctx.strokeRect(left+2.15*TILE,top+1.9*TILE,(ROOM_W-4.3)*TILE,(ROOM_H-3.8)*TILE);
  for(let i=0;i<22;i++){
   const v=noise(d.seed+room.id*149,i),w=noise(d.seed+room.id*137,i+91);
   const x=interiorX+v*interiorW,y=interiorY+w*interiorH;
   if(Math.hypot(x-cx,y-cy)<70)continue;
   if(room.theme==='fungal'){
    if(i%4===0)drawMushroom(ctx,x,y,14+(i%3)*3,i%2?'#84c7a4':'#c4b1dd');
    else{rect(ctx,'#2e765d99',x,y,15,4);rect(ctx,'#4b9169a8',x+5,y-5,3,11)}
   }else if(room.theme==='flooded'){
    ctx.strokeStyle='#81bbcc55';ctx.beginPath();ctx.ellipse(x,y,18+(i%4)*4,6,0,0,Math.PI*2);ctx.stroke();
    if(i%6===0){rect(ctx,'#9bddd388',x-2,y,4,7);rect(ctx,'#70acb388',x+3,y-3,3,9)}
   }else if(room.theme==='throne'){
    if(i%4===0){rect(ctx,'#4d2b4088',x-5,y-5,18,13);rect(ctx,'#97587555',x,y,6,6)}
   }else{
    rect(ctx,i%4===0?th.accent+'55':'#7c85804d',x,y,3+i%5,2);
    if(i%7===0){ctx.strokeStyle='#7f969166';ctx.beginPath();ctx.moveTo(x-10,y-8);ctx.lineTo(x+5,y+3);ctx.lineTo(x+11,y-2);ctx.stroke()}
   }
  }
  if(room.type==='start'){
   // Subtle spawn medallion, not a giant targeting circle around the hero.
   ctx.save();ctx.globalAlpha=.31;renderSigil(ctx,cx,cy,43,'#a6e5b5');ctx.restore();
   for(const dx of [-175,175]){rect(ctx,'#607d6b',cx+dx-14,cy-22,28,44);rect(ctx,'#cad5b3',cx+dx-17,cy-25,34,8)}
  }
  if(room.type==='treasure'||room.type==='secret'){
   renderSigil(ctx,cx,cy,75,'#f4c780',time);
   drawChest(ctx,cx,cy-12,room.cleared);
   for(let i=0;i<6;i++)rect(ctx,'#d7ad6a',cx-69+i*24,cy+66+(i%2)*7,8,5);
  }
  if(room.type==='event'){
   renderSigil(ctx,cx,cy,92,room.eventKind==='forge'?'#f6b87c':'#be9cf2',time);
   if(room.eventKind==='forge'){
    rect(ctx,'#303b40',cx-28,cy-10,56,34);
    rect(ctx,'#8c9a91',cx-35,cy-19,70,15);
    rect(ctx,'#d68c58',cx-22,cy-28,44,6);
    for(const dx of [-80,80]){rect(ctx,'#543b34',cx+dx-10,cy+42,20,20);rect(ctx,'#ffba75',cx+dx-7,cy+36,14,9)}
   }else{
    rect(ctx,'#383650',cx-34,cy-18,68,40);
    rect(ctx,'#8e79b6',cx-24,cy-28,48,11);
    rect(ctx,'#c6a6fa',cx-6,cy-44,12,18);
   }
  }
  if(room.type==='library'){
   // Shelves stay at the chamber sides; the center and door spines stay clear.
   for(const dx of [-215,185])for(const dy of [-95,95]){
    rect(ctx,'#221d20',cx+dx,cy+dy,30,72);
    rect(ctx,'#7b5e46',cx+dx+2,cy+dy+3,26,65);
    for(let k=0;k<5;k++){
     rect(ctx,k%2?'#92a6bb':'#ae896a',cx+dx+4+k*5,cy+dy+8,3,19);
     rect(ctx,k%2?'#a8c792':'#d4b077',cx+dx+4+k*5,cy+dy+40,3,19);
    }
   }
   renderSigil(ctx,cx,cy,78,'#bcb1ed',time);
   rect(ctx,'#6e5b4a',cx-35,cy+25,70,22);
   rect(ctx,'#e2d1b1',cx-23,cy+14,46,27);
   rect(ctx,'#9884b3',cx-3,cy+19,6,18);
  }
  if(room.type==='camp'){
   renderSigil(ctx,cx,cy,84,'#acd9a1',time);
   rect(ctx,'#5d5549',cx-64,cy+39,128,17);
   rect(ctx,'#806f54',cx-60,cy+44,120,5);
   rect(ctx,'#f0b96e',cx-11,cy+6,21,25);
   rect(ctx,'#e7d08c',cx-5,cy-7,10,22);
   for(const dx of [-100,100]){
    rect(ctx,'#6b6052',cx+dx-25,cy-39,50,48);
    rect(ctx,'#a58b72',cx+dx-20,cy-43,40,13);
   }
  }
  if(room.type==='vault'){
   renderSigil(ctx,cx,cy,110,'#f6d18d',time);
   rect(ctx,'#312f37',cx-59,cy-43,118,86);
   rect(ctx,'#a48967',cx-55,cy-40,110,80);
   rect(ctx,'#dfc487',cx-48,cy-34,96,67);
   rect(ctx,'#54463b',cx-32,cy-22,64,43);
   rect(ctx,'#f1dca2',cx-8,cy-16,16,25);
   rect(ctx,'#413f38',cx-4,cy-10,8,11);
  }
  if(room.type==='trap'){
   for(const dx of [-104,104,0]){
    const dy=dx===0?105:dx<0?15:-15;
    ctx.strokeStyle='#f0a47a88';ctx.lineWidth=3;ctx.beginPath();
    ctx.arc(cx+dx,cy+dy,45,0,Math.PI*2);ctx.stroke();
    rect(ctx,'#e4b38466',cx+dx-5,cy+dy-5,10,10);
   }
  }
  if(room.type==='shrine'){
   renderSigil(ctx,cx,cy,92,'#8fe8d0',time);
   rect(ctx,'#456962',cx-24,cy-27,48,55);
   rect(ctx,'#a8e2c2',cx-13,cy-40,26,26);
   rect(ctx,'#f4e8bd',cx-6,cy-29,12,14);
  }
  if(room.type==='elite'){
   renderSigil(ctx,cx,cy,105,'#edb276',time);
   for(const dx of [-180,180]){
    rect(ctx,'#4d463a',cx+dx-13,cy-66,26,132);
    rect(ctx,'#ce9c68',cx+dx-9,cy-69,18,12);
   }
  }
  if(room.type==='boss'){
   const pulse=.5+.5*Math.sin(time*1.5);
   renderSigil(ctx,cx,cy,150,'#ee839a',time);
   renderSigil(ctx,cx,cy,102,'#ffb2c3',time);
   // Four broken obelisks and a scarlet throne dais.
   for(const dx of [-205,205])for(const dy of [-130,130]){
    rect(ctx,'#351c30',cx+dx-15,cy+dy-11,30,22);
    rect(ctx,'#86566a',cx+dx-10,cy+dy-22,20,27);
    rect(ctx,'#cd8e9f',cx+dx-7,cy+dy-24,14,6);
   }
   ctx.globalAlpha=.13+pulse*.1;rect(ctx,'#df5471',cx-210,cy-30,420,60);ctx.globalAlpha=1;
  }
  if(room.theme==='crypt'){drawCobweb(ctx,left+TILE+3,top+TILE+3);drawCobweb(ctx,right-TILE-3,bottom-TILE-56,true)}
  // Room layout has a coherent architectural silhouette instead of random floating props.
  if(room.layout==='longhall'||room.layout==='arcade'){
   const stone=room.biome==='flooded'?'#5c8290':room.biome==='fungal'?'#4d765d':'#6b7476';
   for(const dx of [-245,245]){rect(ctx,stone+'aa',cx+dx-7,cy-130,14,260);
    rect(ctx,'#091e26b0',cx+dx-10,cy+126,20,7)}
  }
  if(room.layout==='vault'||room.layout==='tombs'){
   for(const dx of [-170,170])for(const dy of [-100,100]){
    rect(ctx,'#1b2d3288',cx+dx-22,cy+dy-17,44,34);
    rect(ctx,'#8c989458',cx+dx-17,cy+dy-17,34,5);
   }
  }
  if(room.theme==='reliquary')for(const dx of [-175,175])drawChest(ctx,cx+dx,cy-95,room.cleared);
  // The v0.14 wall lanterns are rendered by visual-world.js, anchored
  // to blocked masonry tiles. Do not paint an unrelated second set here.
  // A room's floor glyph hints at the tactics inside without obscuring
  // hazards. Decorative ink stays at room edges, not the dodge corridor.
  if(room.type==='combat'){
   const tone=room.encounterStyle==='ambush'?'#d98ba3':
    room.encounterStyle==='ranged'?'#b3d49f':
    room.encounterStyle==='arcane'?'#c1a6e7':
    room.encounterStyle==='fortified'?'#9fc3d6':'#c5b59b';
   ctx.save();ctx.globalAlpha=.31;ctx.strokeStyle=tone;ctx.lineWidth=3;
   const span=room.encounterStyle==='ranged'?172:room.encounterStyle==='fortified'?130:92;
   for(const sign of [-1,1]){
    const y=cy+sign*155;
    ctx.beginPath();ctx.moveTo(cx-span,y);ctx.lineTo(cx+span,y);ctx.stroke();
    for(const offset of [-span,span])rect(ctx,tone,cx+offset-4,y-4,8,8);
   }
   if(room.encounterStyle==='arcane'){
    ctx.beginPath();ctx.arc(cx-187,cy,29,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(cx+187,cy,29,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
  // Room labels are rendered once in render.js. Repeating the biome name
  // here would put both strings on exactly the same baseline.
 }
 // Gentle ambient falloff; dynamic torches and character bounce light are
 // drawn separately by the viewport-capped v0.14 lighting pass.
 ctx.fillStyle='#06111b20';ctx.fillRect(cam.x,cam.y,cw,ch);
 // Low-density motes, bounded and reproducible, do not affect collisions.
 for(const room of d.rooms){
  if(Math.abs(room.cx-(cam.x+cw/2))>cw/2+300||Math.abs(room.cy-(cam.y+ch/2))>ch/2+300)continue;
  const th=roomTheme(room);
  for(let i=0;i<7;i++){
   const rx=noise(d.seed+room.id*71,i+7),ry=noise(d.seed+room.id*17,i+88);
   const x=room.cx+(rx-.5)*440+Math.sin(time*.4+i)*13;
   const y=room.cy+(ry-.5)*295+Math.cos(time*.5+i*1.7)*11;
   if(d.isBlocked(x,y))continue;
   ctx.globalAlpha=.23+.22*(.5+.5*Math.sin(time*2+i*3));
   rect(ctx,th.glow,x,y,2+(i%2),2+(i%2));
  }
 }
 ctx.globalAlpha=1;ctx.restore();
 drawTowerEnvironment(ctx,game);
}
export function drawBossWarnings(ctx,game){
 const boss=game.getActiveBoss?.();
 if(!boss)return;
 if(boss.boss?.variant==='warden'){drawWardenWarnings(ctx,game,boss);return}
 if(['tower','sovereign'].includes(boss.boss?.variant)){drawTowerBossWarnings(ctx,game,boss);return}
 const state=boss.boss;
 if(state.exposed>0){
  ctx.save();ctx.globalAlpha=Math.min(.7,state.exposed)*.55;
  ctx.strokeStyle='#a6edc6';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(boss.x,boss.y,boss.radius+20,0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
 if(state.transition>0){
  ctx.save();ctx.globalAlpha=.2+.15*Math.sin(game.time*18);
  circle(ctx,boss.x,boss.y,85+(1.65-state.transition)*45,'#ffc3d1',10);
  ctx.restore();return;
 }
 const t=state.telegraph;
 if(!t)return;
 const fraction=clamp(t.time/t.duration,0,1);
 ctx.save();
 const pulse=.22+.12*Math.sin(game.time*20);
 if(t.type==='slam'){
  ctx.globalAlpha=.2+(1-fraction)*.23;
  ctx.fillStyle='#fa5266';ctx.beginPath();ctx.arc(t.target.x,t.target.y,t.radius,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;circle(ctx,t.target.x,t.target.y,t.radius,'#ffd3c4',3);
  circle(ctx,t.target.x,t.target.y,Math.max(5,t.radius*fraction),'#ff748b',4);
 }else if(t.type==='fracture'){
  ctx.globalAlpha=.26+(1-fraction)*.22;
  ctx.fillStyle='#f07aa2';ctx.strokeStyle='#ffd2db';
  for(const dx of [-115,115]){
   ctx.beginPath();ctx.arc(t.target.x+dx,t.target.y,56,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
 }else if(t.type==='charge'){
  const length=480;
  ctx.translate(t.x,t.y);ctx.rotate(Math.atan2(t.dir.y,t.dir.x));
  ctx.fillStyle='#ee4a6a';ctx.globalAlpha=pulse;
  ctx.fillRect(0,-46,length,92);
  ctx.globalAlpha=.86;ctx.strokeStyle='#ffbec5';ctx.lineWidth=3;ctx.setLineDash([15,10]);
  for(const y of [-46,46]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(length,y);ctx.stroke()}
  ctx.setLineDash([]);
 }else if(t.type==='volley'){
  const a=Math.atan2(t.dir.y,t.dir.x),arc=state.phase===2?.48:.44;
  ctx.fillStyle='#f45f7b';ctx.globalAlpha=pulse+(1-fraction)*.12;
  ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.arc(t.x,t.y,270,a-arc,a+arc);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffc9d2';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.stroke();
 }else if(t.type==='nova'){
  ctx.globalAlpha=.18+(1-fraction)*.2;ctx.fillStyle='#d073ee';
  ctx.beginPath();ctx.arc(t.x,t.y,165,0,2*Math.PI);ctx.fill();
  ctx.globalAlpha=.95;circle(ctx,t.x,t.y,165,'#f1b9ff',3);
 }else if(t.type==='summon'){
  for(const dx of [-115,115]){
   ctx.globalAlpha=pulse;ctx.fillStyle='#a56ddd';
   ctx.beginPath();ctx.arc(t.x+dx,t.y,40,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=.9;circle(ctx,t.x+dx,t.y,40,'#d5b1ff',3);
  }
 }
 ctx.restore();
}
export function drawVignette(ctx,game,canvas){
 const w=canvas.width,h=canvas.height;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 const g=ctx.createRadialGradient(w*.5,h*.49,Math.min(w,h)*.19,w*.5,h*.5,Math.max(w,h)*.72);
 g.addColorStop(0,'#00000000');g.addColorStop(.62,'#05101a08');g.addColorStop(1,'#02090d99');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 if(game.getActiveBoss?.()?.boss.phase===2){
  ctx.fillStyle='#a21c3410';ctx.fillRect(0,0,w,h);
 }
 ctx.restore();
}
