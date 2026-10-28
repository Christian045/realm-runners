import { TILE, clamp, distance } from './data.js';
import { ROOM_W, ROOM_H } from './dungeon.js';

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
   renderSigil(ctx,cx,cy,76,'#a6e5b5');
   for(const dx of [-175,175]){rect(ctx,'#607d6b',cx+dx-14,cy-22,28,44);rect(ctx,'#cad5b3',cx+dx-17,cy-25,34,8)}
  }
  if(room.type==='treasure'){
   renderSigil(ctx,cx,cy,75,'#f4c780',time);
   drawChest(ctx,cx,cy-12,room.cleared);
   for(let i=0;i<6;i++)rect(ctx,'#d7ad6a',cx-69+i*24,cy+66+(i%2)*7,8,5);
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
  if(room.theme==='reliquary')for(const dx of [-175,175])drawChest(ctx,cx+dx,cy-95,room.cleared);
  // Wall torches are decoration only, not extra collision obstacles.
  const warm=room.type==='boss'||room.theme==='reliquary';
  for(let i=0;i<4;i++){
   const tx=cx+(i%2?198:-198),ty=cy+(i<2?-148:148);
   torch(ctx,tx,ty,time,i+room.id*8,warm);
  }
  ctx.font='bold 13px monospace';ctx.textAlign='center';
  ctx.fillStyle=th.accent+'8c';ctx.fillText(th.name,cx,top+TILE*1.8);
 }
 // Subtle tint over the stone, then additive pools of warm/cold light.
 ctx.fillStyle='#06161b2e';ctx.fillRect(cam.x,cam.y,cw,ch);
 ctx.save();ctx.globalCompositeOperation='screen';
 for(const room of d.rooms){
  const left=room.gx*ROOM_W*TILE,top=room.gy*ROOM_H*TILE;
  if(left+ROOM_W*TILE<cam.x-180||left>cam.x+cw+180||top+ROOM_H*TILE<cam.y-180||top>cam.y+ch+180)continue;
  const warm=room.type==='boss'||room.theme==='reliquary';
  for(let i=0;i<4;i++){
   const x=room.cx+(i%2?198:-198),y=room.cy+(i<2?-148:148);
   const flicker=.91+.09*Math.sin(time*11+i*5+room.id);
   light(ctx,x,y,155,warm?'#f5a457':'#6bc8b1',flicker*.75);
  }
 }
 light(ctx,game.player.x,game.player.y,230,'#82b4ba',.65);
 ctx.restore();
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
}
export function drawBossWarnings(ctx,game){
 const boss=game.getActiveBoss?.();
 if(!boss)return;
 const state=boss.boss;
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
