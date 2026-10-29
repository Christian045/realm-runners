import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {generateDungeon} from '../src/dungeon.js';
import {towerStage} from '../src/tower.js';
import {towerEncounterPlan,towerRoomDamage,towerRoomSpeed,towerEnemyWindup,towerEnemyRecovery,
 towerFirstHazard,towerBossRequiredAttacks,canProgressTowerBoss} from '../src/difficulty-director.js';
import {createTowerBossState,applyTowerBossDamage,beginTowerAttack,executeTowerAttack} from '../src/tower-boss.js';
import {swordPose,drawWarriorSword} from '../src/weapon-visuals.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
function towerGame(seed=2026,floor=6){
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('warrior',seed);
 g.floorDepth=floor;
 g.dungeon=generateDungeon(seed,{tower:true,biome:towerStage(floor).biome,floor});
 g.player.x=g.dungeon.start.x;g.player.y=g.dungeon.start.y;
 return g;
}
test('the real sixth floor has at least five initial enemies and a second wave',()=>{
 const easy=towerEncounterPlan(1,'combat',.4),hard=towerEncounterPlan(6,'combat',.4);
 assert.ok(easy.initial<=3);
 assert.ok(hard.initial>=5,JSON.stringify(hard));
 assert.ok(hard.reinforcements>=2);
 assert.equal(towerEncounterPlan(6,'boss',.9).initial,1);
 assert.equal(towerEncounterPlan(6,'boss',.9).reinforcements,0);
 assert.ok(towerRoomDamage(6)>1.30);
 assert.ok(towerRoomSpeed(6)>1);
 assert.ok(towerEnemyWindup(6)>=.43);
 assert.ok(towerEnemyRecovery(6,true)>1);
 assert.ok(towerFirstHazard(6)<3.8);
});
test('actual sixth-floor combat starts with a diverse front line and a ranged threat',()=>{
 const g=towerGame(),room=g.dungeon.rooms.find(r=>r.type==='combat');
 g.player.x=room.cx;g.player.y=room.cy;room.visited=true;room.cleared=false;
 g.spawnRoom(room);
 assert.ok(g.enemies.length>=5);
 assert.ok(g.enemies.some(e=>['scout','hexer','archer','cultist'].includes(e.type)));
 assert.ok(g.enemies.every(e=>e.hp>0&&e.speed>0));
 assert.ok(g.enemies.every(e=>e.damage>0));
 assert.ok(room.reinforcements>=2);
 assert.ok(g.stageHazardClock<4);
});
test('clearing the first wave cannot immediately clear a late-stage room',()=>{
 const g=towerGame(37),room=g.dungeon.rooms.find(r=>r.type==='combat');
 g.player.x=room.cx;g.player.y=room.cy;room.visited=true;room.cleared=false;
 g.spawnRoom(room);
 const first=g.enemies.length;
 for(const e of g.enemies)e.hp=0;
 g.update(1/60);
 assert.ok(!room.cleared,'room stays locked while reinforcements approach');
 assert.ok(room.reinforcements>0);
 for(let n=0;n<70&&room.reinforcements>0;n++)g.update(1/60);
 assert.equal(room.reinforcements,0);
 assert.ok(g.enemies.some(e=>e.hp>0),'reinforcements must really spawn');
 assert.ok(g.enemies.some(e=>e.spawnIndex>=8));
 for(const e of g.enemies)e.hp=0;
 g.update(1/60);
 assert.ok(room.cleared,'room opens after all reinforcements die');
 assert.ok(g.clearCount>0);
});
test('room reinforcement never mutates walls, room count or door graph',()=>{
 for(const floor of [1,4,6,9,10]){
  const g=towerGame(200+floor,floor),initial=g.dungeon.tiles.slice();
  const rooms=g.dungeon.rooms.length,room=g.dungeon.rooms.find(r=>r.type==='combat');
  g.player.x=room.cx;g.player.y=room.cy;room.visited=true;g.spawnRoom(room);
  g.spawnReinforcements(room);
  assert.deepEqual(g.dungeon.tiles,initial);
  assert.equal(g.dungeon.rooms.length,rooms);
  assert.equal(rooms,7);
  assert.ok(g.enemies.every(e=>g.dungeon.canMove(e.x,e.y,Math.min(13,e.radius))));
 }
});
test('stage six tower boss performs real telegraphed attacks before both phases may end',()=>{
 const g=towerGame(481,6);
 const room=g.dungeon.rooms[g.dungeon.bossId],s=createTowerBossState(6);
 const e={type:'boss',x:room.cx,y:room.cy,homeRoom:room.id,radius:38,
  hp:1800,maxHp:1800,speed:90,damage:25,flash:0,knock:{x:0,y:0},cooldown:0,boss:s};
 g.enemies=[e];g.player.x=room.cx-200;g.player.y=room.cy;
 assert.equal(towerBossRequiredAttacks(6,1),3);
 assert.equal(towerBossRequiredAttacks(6,2),6);
 applyTowerBossDamage(g,e,9000);
 assert.ok(e.hp>e.maxHp*.55,'first phase cannot be bypassed before attacks');
 assert.ok(!canProgressTowerBoss(e));assert.ok(e.boss.gateActive);
 for(let i=0;i<3;i++){
  assert.ok(beginTowerAttack(g,e));
  executeTowerAttack(g,e);e.cooldown=0;
  // A charge is a full animation; finish it before the next forced test action.
  e.boss.charge=null;
 }
 assert.ok(canProgressTowerBoss(e));
 applyTowerBossDamage(g,e,9000);
 assert.equal(e.boss.phase,2);
 assert.ok(e.boss.transition>0);
 e.boss.transition=0;
 applyTowerBossDamage(g,e,9000);
 assert.equal(e.hp,1,'phase two cannot end before enough patterns');
 assert.ok(e.boss.gateActive);
 for(let i=3;i<6;i++){
  assert.ok(beginTowerAttack(g,e));
  executeTowerAttack(g,e);e.cooldown=0;
  // A charge is a full animation; finish it before the next forced test action.
  e.boss.charge=null;
 }
 assert.ok(canProgressTowerBoss(e));
 applyTowerBossDamage(g,e,9000);
 assert.equal(e.hp,0,'eventual victory remains possible');
});
test('sovereign phase transitions remain exempt from the new tower action gate',()=>{
 const g=towerGame(23,10);
 const e={type:'boss',x:g.player.x,y:g.player.y,homeRoom:g.dungeon.bossId,
  maxHp:3200,hp:3200,boss:createTowerBossState(10)};
 assert.ok(canProgressTowerBoss(e));
 applyTowerBossDamage(g,e,1e6);
 assert.equal(e.boss.phase,2);
});
test('warrior now visibly holds a sword in all directions; 3-hit combo alters its pose',()=>{
 const p={kind:'warrior',x:400,y:250,direction:{x:1,y:0},comboStep:1,attackTimer:0};
 const idle=swordPose(p);assert.ok(Number.isFinite(idle.angle));
 p.direction={x:0,y:-1};assert.notEqual(swordPose(p).angle,idle.angle);
 p.direction={x:1,y:0};p.attackTimer=.17;
 const first=swordPose(p);assert.ok(first.active);
 p.comboStep=2;const second=swordPose(p);
 assert.notEqual(first.angle,second.angle);
 p.comboStep=3;const third=swordPose(p);assert.ok(third.scale>1);
 const calls=[];
 const ctx={save(){},restore(){},translate(){},rotate(){},scale(){},
  fillRect(x,y,w,h){calls.push({type:'rect',w,h})},
  beginPath(){},moveTo(){},lineTo(){calls.push({type:'blade'})},
  closePath(){},fill(){}};
 drawWarriorSword(ctx,p);
 assert.ok(calls.some(c=>c.type==='rect'&&c.h>=16),'proportionate sword guard exists');
 assert.ok(calls.filter(c=>c.type==='blade').length>=7,'sword outline is drawn');
});
