import { ENEMY_DATA, TILE, distance, normalized } from './data.js';
import { ROOM_W, ROOM_H } from './dungeon.js';
import {startWardenPhaseTwo,beginWardenAttack,executeWardenAttack,updateWarden} from './warden.js?v=0.15.0';
import {triggerTowerPhase,beginTowerAttack,executeTowerAttack,updateTowerBoss} from './tower-boss.js?v=0.18.0';
import {normalBossWindup,normalBossRecovery} from './combat-balance.js?v=0.15.0';

export const PHASE_TWO_AT = .55;
const PHASE_ONE = Object.freeze(['volley','slam','charge']);
const PHASE_TWO = Object.freeze(['volley','fracture','nova','charge','slam','summon']);

// A separate, inspectable state machine. No invisible instant-hit boss abilities.
export function createBossState(){
 return {phase:1, attackIndex:0, telegraph:null, charge:null, transition:0,
  summoned:false, lastAttack:null, recovery:1.25};
}
export function isBossInvulnerable(boss){return boss.type==='boss'&&boss.boss?.transition>0}
export function startPhaseTwo(game,enemy){
 if(enemy.boss?.variant==='warden')return startWardenPhaseTwo(game,enemy);
 if(['tower','sovereign'].includes(enemy.boss?.variant))return triggerTowerPhase(game,enemy,2);
 const state=enemy.boss;
 if(!state||state.phase!==1)return false;
 state.phase=2;state.transition=1.06;state.telegraph=null;state.charge=null;
 state.attackIndex=0;state.recovery=.65;state.summoned=false;
 enemy.cooldown=.2;enemy.knock={x:0,y:0};
 // The transformation is a breather, not a surprise attack.
 game.projectiles=game.projectiles.filter(p=>!p.hostile);
 game.createEffect('ring',enemy.x,enemy.y,'#f7a0bc',1.4,135);
 game.createEffect('text',enemy.x,enemy.y-92,'PHASE II · DER ZORN ERWACHT','#ff9eab',1.65);
 game.notify();
 return true;
}
export function beginBossAttack(game,enemy,forcedType=null){
 if(enemy.boss?.variant==='warden')return beginWardenAttack(game,enemy,forcedType);
 if(['tower','sovereign'].includes(enemy.boss?.variant))return beginTowerAttack(game,enemy,forcedType);
 const s=enemy.boss;
 if(!s||s.transition>0||s.telegraph||s.charge)return false;
 const order=s.phase===2?PHASE_TWO:PHASE_ONE;
 const type=forcedType||order[s.attackIndex%order.length];
 if(!['volley','slam','charge','nova','summon','fracture'].includes(type))return false;
 s.attackIndex++;
 const p=game.player,dir=normalized(p.x-enemy.x,p.y-enemy.y);
 const duration=normalBossWindup(s.phase,type);
 const room=game.dungeon.rooms[enemy.homeRoom];
 const target={
  x:Math.max(room.gx*ROOM_W*TILE+90,Math.min((room.gx+1)*ROOM_W*TILE-90,p.x)),
  y:Math.max(room.gy*ROOM_H*TILE+90,Math.min((room.gy+1)*ROOM_H*TILE-90,p.y))
 };
 s.telegraph={type,time:duration,duration,dir,target,
  x:enemy.x,y:enemy.y,radius:s.phase===2?102:82};
 s.lastAttack=type;enemy.cooldown=99;
 game.notify();
 return true;
}
function spawnSpit(game,enemy,dir,offset=0,speed=300){
 const angle=Math.atan2(dir.y,dir.x)+offset;
 const aim={x:Math.cos(angle),y:Math.sin(angle)};
 game.spawnProjectile(enemy.x+aim.x*(enemy.radius+7),enemy.y+aim.y*(enemy.radius+7),
  aim,enemy.damage*(enemy.boss.phase===2?.95:.8),false,true,speed);
}
function summonAdds(game,boss){
 const s=boss.boss;
 if(s.summoned&&game.enemies.filter(e=>e.type!=='boss'&&e.hp>0).length>=3)return;
 const room=game.dungeon.rooms[boss.homeRoom];
 const spots=[[-115,-85],[115,85],[112,-85],[-112,85]];
 let count=0;
 for(const [dx,dy] of spots){
  if(count>= (s.phase===2?2:1))break;
  const x=room.cx+dx,y=room.cy+dy;
  if(!game.dungeon.canMove(x,y,19,true)||distance({x,y},game.player)<55)continue;
  const type=count%2?'mushroom':'slime',spec=ENEMY_DATA[type];
  game.enemies.push({x,y,homeRoom:room.id,type,radius:spec.radius,
   hp:Math.round(spec.hp*1.6),maxHp:Math.round(spec.hp*1.6),speed:spec.speed*1.3,
   damage:spec.damage,cooldown:.8,windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0}});
  game.createEffect('ring',x,y,'#b59bff',.55,35);
  count++;
 }
 s.summoned=true;
}
export function executeBossAttack(game,enemy){
 if(enemy.boss?.variant==='warden')return executeWardenAttack(game,enemy);
 if(['tower','sovereign'].includes(enemy.boss?.variant))return executeTowerAttack(game,enemy);
 const s=enemy.boss,t=s.telegraph;
 if(!t)return;
 s.telegraph=null;
 if(t.type==='volley'){
  const n=s.phase===2?7:5;
  for(let i=0;i<n;i++)spawnSpit(game,enemy,t.dir,(i-(n-1)/2)*(s.phase===2?.14:.18),s.phase===2?360:285);
  game.createEffect('burst',enemy.x,enemy.y,'#ffb7b2',.35,60);
 }else if(t.type==='slam'){
  // Locked target + visible countdown: dodge by moving or dashing out.
  const r=t.radius;
  game.createEffect('ring',t.target.x,t.target.y,'#ff8c94',.7,r);
  game.createEffect('burst',t.target.x,t.target.y,'#f8b9a0',.55,r);
  if(distance(game.player,t.target)<r+game.player.radius)game.hurt(enemy.damage*(s.phase===2?1.55:1.3),{x:0,y:0});
 }else if(t.type==='charge'){
  // The charge follows the previously displayed corridor, not a homing turn.
  s.charge={dir:t.dir,time:s.phase===2?.53:.44};
  game.createEffect('burst',enemy.x,enemy.y,'#f5a0b5',.3,65);
 }else if(t.type==='nova'){
  const n=14,base=Math.atan2(t.dir.y,t.dir.x);
  for(let i=0;i<n;i++)spawnSpit(game,enemy,t.dir,base-Math.atan2(t.dir.y,t.dir.x)+(i*2*Math.PI/n),285);
  game.createEffect('ring',enemy.x,enemy.y,'#c49aff',.65,110);
 }else if(t.type==='fracture'){
  // Two parallel delayed cracks; center lane stays safe until next pattern.
  for(const side of [-1,1])game.hazards.push({
   x:t.target.x+side*115,y:t.target.y,radius:56,
   time:.7,maxTime:.7,damage:Math.round(enemy.damage*1.22),
   color:'#ffa2c2',source:'boss'});
  game.createEffect('ring',t.target.x,t.target.y,'#f2a4c7',.55,76);
 }else if(t.type==='summon'){
  summonAdds(game,enemy);
 }
 s.exposed=['fracture','slam','charge'].includes(t.type)?1.0:.44;
 s.recovery=normalBossRecovery(s.phase);
 enemy.cooldown=s.recovery;
}
export function updateBoss(game,enemy,dt){
 if(enemy.boss?.variant==='warden')return updateWarden(game,enemy,dt);
 if(['tower','sovereign'].includes(enemy.boss?.variant))return updateTowerBoss(game,enemy,dt);
 const s=enemy.boss;
 if(!s)return;
 enemy.elapsed+=dt;enemy.flash=Math.max(0,enemy.flash-dt);
 s.exposed=Math.max(0,(s.exposed||0)-dt);
 if(s.phase===1&&enemy.hp/enemy.maxHp<=PHASE_TWO_AT){startPhaseTwo(game,enemy)}
 if(s.transition>0){
  s.transition=Math.max(0,s.transition-dt);
  enemy.cooldown=Math.max(.12,enemy.cooldown-dt);
  return;
 }
 if(s.telegraph){
  s.telegraph.time-=dt;
  if(s.telegraph.time<=0)executeBossAttack(game,enemy);
  return;
 }
 if(s.charge){
  const speed=s.phase===2?725:590,amount=speed*dt;
  const oldX=enemy.x,oldY=enemy.y;
  game.move(enemy,s.charge.dir.x*amount,s.charge.dir.y*amount);
  s.charge.time-=dt;
  if(distance(game.player,enemy)<game.player.radius+enemy.radius+6)
   game.hurt(enemy.damage*(s.phase===2?1.55:1.35),s.charge.dir);
  if(s.charge.time<=0||Math.hypot(enemy.x-oldX,enemy.y-oldY)<amount*.23)
   s.charge=null;
  return;
 }
 enemy.cooldown-=dt;
 const dir=normalized(game.player.x-enemy.x,game.player.y-enemy.y);
 const range=distance(game.player,enemy);
 if(range>enemy.radius+game.player.radius+100)
  game.move(enemy,dir.x*enemy.speed*dt*(s.phase===2?1.22:1),dir.y*enemy.speed*dt*(s.phase===2?1.22:1));
 if(range<enemy.radius+game.player.radius+5)game.hurt(enemy.damage,dir);
 if(enemy.cooldown<=0)beginBossAttack(game,enemy);
}
