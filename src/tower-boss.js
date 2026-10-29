import {distance,normalized} from './data.js';
import {TOWER_LENGTH,towerStage} from './tower.js';

export function createTowerBossState(floor){
 const stage=towerStage(floor);
 return {variant:floor===TOWER_LENGTH?'sovereign':'tower',name:stage.boss,
  floor,phase:1,transition:0,telegraph:null,charge:null,attackIndex:0,
  signature:stage.signature,color:stage.color,recovery:1.2};
}
export function triggerTowerPhase(game,e,newPhase){
 const s=e.boss;
 if(!s||s.transition>0||newPhase<=s.phase)return false;
 s.phase=newPhase;s.transition=newPhase===3?2.15:1.6;s.telegraph=null;s.charge=null;
 s.attackIndex=0;e.cooldown=s.transition+.6;
 game.projectiles=game.projectiles.filter(p=>!p.hostile);
 game.hazards=game.hazards.filter(h=>h.source!=='tower');
 game.createEffect('ring',e.x,e.y,s.color,1.2,newPhase===3?175:135);
 game.createEffect('text',e.x,e.y-100,newPhase===3?'PHASE III · FINSTERNIS ERWACHT':'PHASE II · MACHT ENTFESSELT',s.color,1.55);
 game.notify();return true;
}
export function applyTowerBossDamage(game,e,damage){
 const s=e.boss;
 if(s.transition>0)return;
 const p3=s.variant==='sovereign'&&s.phase===2;
 const threshold=p3?.3:s.phase===1?.55:0;
 const limit=Math.ceil(e.maxHp*threshold);
 if(threshold>0&&e.hp-damage<=limit){
  e.hp=limit;triggerTowerPhase(game,e,s.phase+1);
 }else e.hp=Math.max(0,e.hp-damage);
}
const aim=(x,y)=>normalized(x,y);
function shoot(game,e,angle,damageScale=.8,speed=290){
 const vector={x:Math.cos(angle),y:Math.sin(angle)};
 game.spawnProjectile(e.x+vector.x*(e.radius+7),e.y+vector.y*(e.radius+7),
  vector,e.damage*damageScale,false,true,speed);
}
export function beginTowerAttack(game,e,forced=null){
 const s=e.boss;
 if(s.transition>0||s.telegraph||s.charge||e.hp<=0)return false;
 const base=s.signature;
 const pool=s.variant==='sovereign'?
  (s.phase===1?['mark','cross','dash','fan']:
   s.phase===2?['meteor','orbit','summon','lances','soulbeam']:
    ['eclipse','spiralwall','soulbeam','dash','meteor','summon']):
  s.phase===1?base:[...base,'ring','cross'];
 const type=forced||pool[s.attackIndex%pool.length];
 if(!['fan','mark','ring','lances','dash','cross','meteor','orbit','summon','eclipse','soulbeam','spiralwall'].includes(type))return false;
 const p=game.player,dir=aim(p.x-e.x,p.y-e.y);
 const duration=Math.max(.66,(s.phase===3?.89:s.phase===2?.98:1.12)*
   (type==='meteor'||type==='eclipse'?1.25:1));
 s.telegraph={type,time:duration,duration,dir,target:{x:p.x,y:p.y},
  angle:Math.atan2(dir.y,dir.x)};
 s.attackIndex++;e.cooldown=99;game.notify();return true;
}
function summon(game,e){
 const s=e.boss,room=game.dungeon.rooms[e.homeRoom];
 const specs=game.currentTowerStage().roster;
 let spawned=0;
 for(const [dx,dy] of [[-120,-90],[120,90],[-120,90],[120,-90]]){
  if(spawned>= (s.phase===3?3:2))break;
  const x=room.cx+dx,y=room.cy+dy;
  if(!game.dungeon.canMove(x,y,19,true)||distance({x,y},game.player)<80)continue;
  const type=specs[(spawned+s.floor)%specs.length],data=game.enemySpec(type);
  game.enemies.push({x,y,type,homeRoom:e.homeRoom,radius:data.radius,
   hp:Math.round(data.hp*(1+s.floor*.12)),maxHp:Math.round(data.hp*(1+s.floor*.12)),
   speed:data.speed,damage:data.damage,cooldown:1.2,windup:0,flash:0,elapsed:0,
   knock:{x:0,y:0},elite:false,eliteShot:2,moving:false});
  game.createEffect('ring',x,y,s.color,.5,37);spawned++;
 }
}
function mark(game,x,y,r=70,time=.8,damage=24){
 game.hazards.push({x,y,radius:r,time,maxTime:time,damage,source:'tower'});
}
export function executeTowerAttack(game,e){
 const s=e.boss,t=s.telegraph;if(!t)return;
 s.telegraph=null;
 const a=t.angle,phase=s.phase,bonus=phase===3?1.18:1;
 switch(t.type){
  case 'fan':
   for(let k=-2;k<=2;k++)shoot(game,e,a+k*(phase>=2?.20:.24),.78*bonus,310);break;
  case 'lances':
   for(const delta of [-.26,0,.26])shoot(game,e,a+delta,.86*bonus,400);break;
  case 'ring':
   for(let i=0;i<14;i++){if(i%7===0)continue;
    shoot(game,e,a+i*2*Math.PI/14,.66*bonus,225)}
   break;
  case 'cross':
   for(let i=0;i<8;i++)shoot(game,e,i*Math.PI/4,.76*bonus,340);
   break;
  case 'orbit':
   for(let i=0;i<12;i++)shoot(game,e,a+i*Math.PI/6,.64*bonus,245+i*7);
   break;
  case 'mark':
   mark(game,t.target.x,t.target.y,74,.75,Math.round(e.damage*1.25));
   mark(game,t.target.x-105,t.target.y+50,46,1.1,Math.round(e.damage*.7));
   break;
  case 'meteor':
   for(const [i,dx,dy] of [[0,0,0],[1,-95,90],[2,110,-85]]){
    mark(game,t.target.x+dx,t.target.y+dy,i===0?78:58,.67+i*.2,Math.round(e.damage*1.05));
   }break;
  case 'dash':
   s.charge={dir:t.dir,time:.42,hit:false};
   break;
  case 'summon':summon(game,e);break;
  case 'soulbeam':
   for(const offset of [-.26,0,.26])for(let j=0;j<3;j++)
    shoot(game,e,a+offset+j*.015,.83*bonus,315+j*20);
   break;
  case 'spiralwall':
   for(let i=0;i<21;i++)if(i%7!==0)shoot(game,e,a+i*.30,.62*bonus,270+i*3);
   break;
  case 'eclipse':
   // Final boss signature: aimed meteor + spaced radial wave. Never instant damage.
   mark(game,t.target.x,t.target.y,85,.9,Math.round(e.damage*1.4));
   for(let i=0;i<18;i++)if(i%6!==0)shoot(game,e,a+i*Math.PI/9,.75,250);
   break;
 }
 s.recovery=Math.max(.64,1.60-phase*.20);
 e.cooldown=s.recovery;game.createEffect('ring',e.x,e.y,s.color,.32,66);
}
export function updateTowerBoss(game,e,dt){
 const s=e.boss;if(!s||e.hp<=0)return;
 e.flash=Math.max(0,e.flash-dt);
 if(s.transition>0){s.transition=Math.max(0,s.transition-dt);return}
 if(s.variant==='sovereign'&&s.phase===3){
  s.arenaClock=(s.arenaClock??5.0)-dt;
  if(s.arenaClock<=0){
   const p=game.player;mark(game,p.x,p.y,68,1.3,Math.round(e.damage*.85));
   s.arenaClock=6.0;
  }
 }
 if(s.telegraph){
  s.telegraph.time-=dt;
  if(s.telegraph.time<=0)executeTowerAttack(game,e);
  return;
 }
 if(s.charge){
  const old={x:e.x,y:e.y},speed=(s.phase===3?460:350)*dt;
  game.move(e,s.charge.dir.x*speed,s.charge.dir.y*speed);
  if(!s.charge.hit&&distance(e,game.player)<e.radius+game.player.radius+7){
   game.hurt(e.damage*1.15,s.charge.dir);s.charge.hit=true;
  }
  s.charge.time-=dt;
  if(s.charge.time<=0||distance(e,old)<speed*.1)s.charge=null;
  return;
 }
 const dir=aim(game.player.x-e.x,game.player.y-e.y),range=distance(e,game.player);
 if(range>185)game.move(e,dir.x*e.speed*dt,dir.y*e.speed*dt);
 if(range<e.radius+game.player.radius+4)game.hurt(e.damage,dir);
 e.cooldown-=dt;
 if(e.cooldown<=0)beginTowerAttack(game,e);
}
export function drawTowerBossWarnings(ctx,game,e){
 const s=e.boss,t=s.telegraph;
 if(s.transition>0){
  ctx.save();ctx.globalAlpha=.33;ctx.strokeStyle=s.color;ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(e.x,e.y,110+Math.sin(game.time*8)*15,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(!t)return;
 const f=1-t.time/t.duration;
 ctx.save();ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=3;
 ctx.globalAlpha=.19+f*.29;
 if(['fan','lances','dash','soulbeam'].includes(t.type)){
  const dir=t.dir,ang=Math.atan2(dir.y,dir.x);
  ctx.translate(e.x,e.y);ctx.rotate(ang);
  ctx.fillRect(0,-28,310,56);ctx.strokeRect(0,-28,310,56);
 }else if(['mark','meteor','eclipse'].includes(t.type)){
  const radius=t.type==='eclipse'?85:t.type==='mark'?74:78;
  ctx.beginPath();ctx.arc(t.target.x,t.target.y,radius,0,Math.PI*2);
  ctx.fill();ctx.stroke();
 }else if(['ring','cross','orbit','summon','spiralwall'].includes(t.type)){
  ctx.beginPath();ctx.arc(e.x,e.y,t.type==='summon'?145:125,0,Math.PI*2);
  ctx.fill();ctx.stroke();
 }
 ctx.restore();
}
