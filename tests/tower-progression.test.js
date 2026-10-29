import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {generateDungeon} from '../src/dungeon.js';
import {towerStage,TOWER_LENGTH} from '../src/tower.js';
import {createTowerBossState,applyTowerBossDamage} from '../src/tower-boss.js';
import {
 TOWER_FLOOR_CURVE,towerFloorProfile,towerEncounterPlan,towerRoomDamage,
 towerRoomSpeed,towerEnemyWindup,towerEnemyRecovery,towerFirstHazard,
 towerHazardInterval,towerDifficultySummary,towerBossRequiredAttacks,
 canProgressTowerBoss
} from '../src/difficulty-director.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
function setup(floor,seed=91){
 const g=new Game(defaultProgress(),input);
 g.setTower(true);g.start('warrior',seed);
 g.floorDepth=floor;g.dungeon=generateDungeon(seed,{tower:true,biome:towerStage(floor).biome,floor});
 g.player.x=g.dungeon.start.x;g.player.y=g.dungeon.start.y;
 return g;
}
test('every stage has an explicitly escalating enemy and attack profile',()=>{
 assert.equal(TOWER_FLOOR_CURVE.length,10);
 for(let floor=1;floor<=10;floor++){
  const p=towerFloorProfile(floor);
  assert.equal(p.floor,floor);assert.ok(p.tier.length>3);
  assert.ok(towerStage(floor).roster.includes(p.lead),'stage lead must belong to the enemy roster');
  assert.ok(p.initial>=2&&p.initial<=7);
  assert.ok(p.bonusChance>=0&&p.bonusChance<=1);
  assert.ok(p.waves>=0&&p.waves<=4);
  assert.ok(p.firstHazard>=2.1);
  assert.ok(p.hazardInterval>=4.4);
  assert.ok(p.meleeRecovery>=.82&&p.rangedRecovery>=1.15);
  assert.ok(p.windup>=.43,'telegraphed attacks retain a reaction window');
  assert.equal(towerRoomDamage(floor),p.damage);
  assert.equal(towerRoomSpeed(floor),p.speed);
  assert.equal(towerEnemyWindup(floor),p.windup);
  assert.equal(towerEnemyRecovery(floor),p.meleeRecovery);
  assert.equal(towerEnemyRecovery(floor,true),p.rangedRecovery);
  assert.equal(towerFirstHazard(floor),p.firstHazard);
  assert.equal(towerHazardInterval(floor),p.hazardInterval);
  assert.ok(towerDifficultySummary(floor).includes(p.tier.toUpperCase()));
  if(floor>1){
   const old=towerFloorProfile(floor-1);
   assert.ok(p.initial>=old.initial);
   assert.ok(p.waves>=old.waves);
   assert.ok(p.damage>old.damage);
   assert.ok(p.speed>old.speed);
   assert.ok(p.windup<old.windup);
   assert.ok(p.meleeRecovery<old.meleeRecovery);
   assert.ok(p.firstHazard<old.firstHazard);
  }
 }
 assert.ok(towerFloorProfile(10).damage>towerFloorProfile(6).damage);
});
test('tower room waves escalate progressively, but boss rooms never spawn reinforcements',()=>{
 for(let floor=1;floor<=10;floor++){
  const p=towerFloorProfile(floor);
  const low=towerEncounterPlan(floor,'combat',.99);
  const high=towerEncounterPlan(floor,'combat',0);
  assert.equal(low.initial,p.initial);
  assert.ok(high.initial>=low.initial);
  assert.ok(high.initial<=7);
  assert.equal(low.reinforcements,p.waves);
  assert.deepEqual(towerEncounterPlan(floor,'boss',0),{initial:1,reinforcements:0,delay:0});
  assert.ok(towerEncounterPlan(floor,'elite',0).initial>=low.initial);
 }
 assert.equal(towerEncounterPlan(1,'combat',.9).reinforcements,0);
 assert.equal(towerEncounterPlan(2,'combat',.9).reinforcements,0);
 assert.equal(towerEncounterPlan(3,'combat',.9).reinforcements,1);
 assert.equal(towerEncounterPlan(6,'combat',.9).reinforcements,2);
 assert.equal(towerEncounterPlan(10,'combat',.9).reinforcements,4);
});
test('all ten real towers spawn the intended enemy pressure while preserving seven rooms',()=>{
 for(let floor=1;floor<=10;floor++){
  const g=setup(floor,117+floor),room=g.dungeon.rooms.find(r=>r.type==='combat');
  assert.ok(room,'combat room on floor '+floor);
  assert.equal(g.dungeon.rooms.length,7);
  g.player.x=room.cx;g.player.y=room.cy;room.visited=true;
  g.spawnRoom(room);
  const plan=towerEncounterPlan(floor,'combat',.99);
  assert.ok(g.enemies.length>=plan.initial,'floor '+floor+' at least '+plan.initial+' enemies');
  assert.equal(g.enemies[0].type,towerFloorProfile(floor).lead,'each stage begins with its recognisable opponent');
  assert.equal(room.reinforcements,plan.reinforcements);
  assert.ok(g.enemies.every(e=>e.hp>0&&e.damage>0&&e.speed>0));
  assert.ok(g.stageHazardClock<=towerFirstHazard(floor)+.01);
  if(floor>=2&&floor!==3){
   assert.ok(g.enemies.some(e=>['scout','archer','hexer','cultist'].includes(e.type)),
    'floor '+floor+' must feature ranged pressure');
  }
  if(floor===3)assert.ok(g.enemies.some(e=>['sentinel','bulwark'].includes(e.type)));
 }
});
test('the first two floors are beginner-friendly; eight to ten are significantly tougher',()=>{
 const a=towerEncounterPlan(1,'combat',.99),b=towerEncounterPlan(2,'combat',.99),
  c=towerEncounterPlan(8,'combat',.99),d=towerEncounterPlan(10,'combat',.99);
 assert.ok(b.initial>a.initial);
 assert.ok(c.initial>=b.initial+3);
 assert.ok(d.reinforcements>=c.reinforcements+1);
 assert.ok(towerEnemyRecovery(9,true)<towerEnemyRecovery(2,true));
 assert.ok(towerFirstHazard(10)<towerFirstHazard(1)/3);
});
test('phase protection scales per stage, including newly protected stage 2 and 3',()=>{
 const expected=[[0,0],[1,2],[2,3],[2,4],[3,5],[3,6],[4,7],[4,8],[5,9],[0,0]];
 for(let floor=1;floor<=10;floor++){
  const [first,total]=expected[floor-1],variant=floor===10?'sovereign':'tower';
  assert.equal(towerBossRequiredAttacks(floor,1,variant),first);
  assert.equal(towerBossRequiredAttacks(floor,2,variant),total);
  const g=setup(floor);
  const s=createTowerBossState(floor),e={type:'boss',radius:38,homeRoom:g.dungeon.bossId,
   x:g.player.x,y:g.player.y,maxHp:2000,hp:2000,boss:s};
  assert.equal(canProgressTowerBoss(e),first===0);
  if(floor>=2&&floor<=9){
   applyTowerBossDamage(g,e,2000);
   assert.equal(s.phase,1,'floor '+floor+' must not skip its first attack patterns');
   assert.ok(s.gateActive);
   s.executedAttacks=first;
   assert.equal(canProgressTowerBoss(e),true);
   applyTowerBossDamage(g,e,2000);
   assert.equal(s.phase,2);
   s.transition=0;
   s.executedAttacks=total-1;
   applyTowerBossDamage(g,e,2000);
   assert.ok(e.hp>=1,'floor '+floor+' must not die too early');
   s.executedAttacks=total;
   applyTowerBossDamage(g,e,2000);
   assert.equal(e.hp,0,'floor '+floor+' remains beatable');
  }
 }
});
test('later elite battles gain reinforcements, while the entire floor graph is unchanged',()=>{
 const g=setup(9,221),elite=g.dungeon.rooms.find(r=>r.type==='elite');
 if(elite){
  const tiles=g.dungeon.tiles.slice();
  g.player.x=elite.cx;g.player.y=elite.cy;elite.visited=true;
  g.spawnRoom(elite);
  assert.equal(elite.reinforcements,1);
  assert.deepEqual(g.dungeon.tiles,tiles);
  assert.equal(g.dungeon.rooms.length,7);
 }
});
