import { ENEMY_DATA, TILE, distance, normalized } from './data.js?v=0.15.0';
import { ROOM_W,ROOM_H } from './dungeon.js';
export function createWardenState(){return {variant:'warden',phase:1,transition:0,attackIndex:0,telegraph:null,charge:null,invulnerable:false}}
const first=['lances','triple','charge'],second=['lances','sweep','spiral','charge','triple','summon','cage'];
export function startWardenPhaseTwo(game,e){
 if(e.boss.phase!==1)return false;
 const s=e.boss;s.phase=2;s.transition=1.05;s.telegraph=null;s.charge=null;s.attackIndex=0;
 e.cooldown=.19;game.projectiles=game.projectiles.filter(p=>!p.hostile);
 game.createEffect('ring',e.x,e.y,'#8bd8ff',1.5,145);
 game.createEffect('text',e.x,e.y-95,'PHASE II · DER WÄCHTER ERWACHT','#97c5ff',1.5);
 game.notify();return true;
}
export function beginWardenAttack(game,e,forced=null){
 const s=e.boss;if(s.transition>0||s.telegraph||s.charge)return false;
 const order=s.phase===2?second:first;
 const type=forced||order[s.attackIndex%order.length];
 if(![...first,'spiral','summon','sweep','cage'].includes(type))return false;
 const dir=normalized(game.player.x-e.x,game.player.y-e.y);
 const room=game.dungeon.rooms[e.homeRoom];
 const x=Math.max(room.gx*ROOM_W*TILE+100,Math.min((room.gx+1)*ROOM_W*TILE-100,game.player.x));
 const y=Math.max(room.gy*ROOM_H*TILE+90,Math.min((room.gy+1)*ROOM_H*TILE-90,game.player.y));
 const duration=s.phase===2?.60:.70;
 // Cage points are clamped toward the room center so all four rune zones
 // fit on traversable tiles even when the player hugs the boss-room wall.
 const target=type==='cage'?{
  x:Math.max(room.cx-70,Math.min(room.cx+70,x)),
  y:Math.max(room.cy-60,Math.min(room.cy+60,y))
 }:{x,y};
 s.telegraph={type,time:duration,duration,dir,x:e.x,y:e.y,target,angle:Math.atan2(dir.y,dir.x)};
 s.attackIndex++;e.cooldown=99;game.notify();return true;
}
function hitLine(p,cx,cy,angle,width,length){
 const dx=p.x-cx,dy=p.y-cy;
 const along=dx*Math.cos(angle)+dy*Math.sin(angle),side=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle));
 return Math.abs(along)<length&&side<width+p.radius;
}
export function executeWardenAttack(game,e){
 const t=e.boss.telegraph;if(!t)return;
 const s=e.boss;s.telegraph=null;e.cooldown=s.phase===2?.51:.65;
 s.exposed=['sweep','triple','charge'].includes(t.type)?1.0:.46;
 const p=game.player;
 if(t.type==='lances'){
  // Four directions, anchored to the locked position displayed beforehand.
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2+t.angle;
   if(hitLine(p,t.x,t.y,angle,24,315))game.hurt(e.damage*1.4,{x:0,y:0});
   game.createEffect('slash',t.x,t.y,'#97c6ff',.33,270,angle);
  }
 }else if(t.type==='triple'){
  const targets=[t.target,{x:t.target.x-94,y:t.target.y+44},{x:t.target.x+94,y:t.target.y-44}];
  for(const q of targets){
   game.createEffect('ring',q.x,q.y,'#97b8ff',.5,48);
   if(distance(p,q)<p.radius+47)game.hurt(e.damage*1.35,{x:0,y:0});
  }
 }else if(t.type==='spiral'){
  for(let i=0;i<14;i++){
   const a=t.angle+i*2*Math.PI/14;
   game.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},e.damage*.8,false,true,280);
  }
  game.createEffect('ring',e.x,e.y,'#a4a1ff',.5,145);
 }else if(t.type==='charge'){
  s.charge={dir:t.dir,time:s.phase===2?.55:.46};
 }else if(t.type==='sweep'){
  for(const offset of [-108,108])game.hazards.push({
   x:t.target.x+offset,y:t.target.y,radius:55,time:.72,maxTime:.72,
   damage:Math.round(e.damage*1.25),source:'warden',color:'#8dcff6'});
  game.createEffect('ring',t.target.x,t.target.y,'#a6edfd',.6,72);
 }else if(t.type==='cage'){
  // Four directional rune blasts, but the center and diagonal corridors stay safe.
  for(const [dx,dy] of [[-111,0],[111,0],[0,-111],[0,111]]){
   const x=t.target.x+dx,y=t.target.y+dy;
   if(!game.dungeon.canMove(x,y,14,true))continue;
   game.hazards.push({x,y,radius:42,time:.82,maxTime:.82,
    damage:Math.round(e.damage*1.16),color:'#8fc8ff',source:'warden-cage'});
   game.createEffect('ring',x,y,'#9ed6ff',.82,42);
  }
 }else if(t.type==='summon'){
  const room=game.dungeon.rooms[e.homeRoom];
  for(const [ox,oy] of [[-115,0],[115,0]]){
   const x=room.cx+ox,y=room.cy+oy;
   if(!game.dungeon.canMove(x,y,18,true))continue;
   const spec=ENEMY_DATA.goblin;
   game.enemies.push({x,y,homeRoom:e.homeRoom,type:'goblin',elite:true,radius:spec.radius,
    hp:spec.hp*2,maxHp:spec.hp*2,speed:spec.speed*1.12,damage:spec.damage*1.3,
    cooldown:.6,windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0}});
   game.createEffect('ring',x,y,'#92c8ff',.6,42);
  }
 }
}
export function updateWarden(game,e,dt){
 const s=e.boss;
 e.elapsed+=dt;e.flash=Math.max(0,e.flash-dt);
 s.exposed=Math.max(0,(s.exposed||0)-dt);
 if(e.hp/e.maxHp<=.55&&s.phase===1)startWardenPhaseTwo(game,e);
 if(s.transition>0){s.transition=Math.max(0,s.transition-dt);return}
 if(s.telegraph){s.telegraph.time-=dt;if(s.telegraph.time<=0)executeWardenAttack(game,e);return}
 if(s.charge){
  const amount=(s.phase===2?700:575)*dt;
  const before={x:e.x,y:e.y};
  game.move(e,s.charge.dir.x*amount,s.charge.dir.y*amount);
  if(distance(e,game.player)<e.radius+game.player.radius+5)
   game.hurt(e.damage*1.5,s.charge.dir);
  s.charge.time-=dt;
  if(s.charge.time<=0||distance(e,before)<amount*.2)s.charge=null;
  return;
 }
 e.cooldown-=dt;
 const dir=normalized(game.player.x-e.x,game.player.y-e.y);
 if(distance(e,game.player)>150)game.move(e,dir.x*e.speed*dt,dir.y*e.speed*dt);
 if(distance(e,game.player)<e.radius+game.player.radius+5)game.hurt(e.damage,dir);
 if(e.cooldown<=0)beginWardenAttack(game,e);
}
export function drawWardenWarnings(ctx,game,boss){
 const s=boss.boss;if(s.transition>0){
  ctx.save();ctx.globalAlpha=.4+.2*Math.sin(game.time*13);ctx.strokeStyle='#90d8ff';ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(boss.x,boss.y,95+Math.sin(game.time*8)*15,0,Math.PI*2);ctx.stroke();ctx.restore();return;
 }
 if(s.exposed>0){
  ctx.save();ctx.globalAlpha=Math.min(.7,s.exposed)*.65;
  ctx.strokeStyle='#a3f6cd';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(boss.x,boss.y,boss.radius+22,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 const t=s.telegraph;if(!t)return;
 const fraction=Math.max(0,t.time/t.duration);
 ctx.save();ctx.globalAlpha=.25+(1-fraction)*.2;
 ctx.strokeStyle='#b3dbff';ctx.fillStyle='#6e9aff';ctx.lineWidth=3;
 if(t.type==='lances'){
  ctx.translate(t.x,t.y);ctx.rotate(t.angle);
  for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(0,-24,310,48);ctx.strokeRect(0,-24,310,48)}
 }else if(t.type==='triple'){
  for(const q of [t.target,{x:t.target.x-94,y:t.target.y+44},{x:t.target.x+94,y:t.target.y-44}]){
   ctx.beginPath();ctx.arc(q.x,q.y,48,0,2*Math.PI);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(q.x,q.y,48*fraction,0,2*Math.PI);ctx.stroke();
  }
 }else if(t.type==='sweep'){
  for(const offset of [-108,108]){
   ctx.beginPath();ctx.arc(t.target.x+offset,t.target.y,55,0,Math.PI*2);
   ctx.fill();ctx.stroke();
  }
 }else if(t.type==='charge'){
  ctx.translate(t.x,t.y);ctx.rotate(t.angle);ctx.fillRect(0,-46,485,92);ctx.strokeRect(0,-46,485,92);
 }else if(t.type==='spiral'){
  ctx.beginPath();ctx.arc(t.x,t.y,160,0,2*Math.PI);ctx.fill();ctx.stroke();
 }else if(t.type==='cage'){
  for(const [dx,dy] of [[-111,0],[111,0],[0,-111],[0,111]]){
   ctx.beginPath();ctx.arc(t.target.x+dx,t.target.y+dy,42,0,2*Math.PI);
   ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(t.target.x+dx,t.target.y+dy,42*fraction,0,2*Math.PI);ctx.stroke();
  }
 }else if(t.type==='summon'){
  for(const dx of [-115,115]){
   ctx.beginPath();ctx.arc(t.x+dx,t.y,42,0,2*Math.PI);ctx.fill();ctx.stroke();
  }
 }
 ctx.restore();
}
