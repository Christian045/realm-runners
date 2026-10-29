import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress,normalizeProgress,saveProgress,loadProgress} from '../src/progression.js';
import {generateDungeon} from '../src/dungeon.js';
import {createTowerBossState,beginTowerAttack,executeTowerAttack,applyTowerBossDamage,updateTowerBoss} from '../src/tower-boss.js';
import {TOWER_LENGTH,towerStage,towerTransitionOptions} from '../src/tower.js';
import {TOWER_RELICS,nextTowerRelic,grantTowerRelic,afterTowerRelicHit,towerRelicSave,towerRelicDamage,towerRelicFloor} from '../src/tower-relics.js';
import {updateTowerEnemy,towerEnemyDamage,towerRoomHazard} from '../src/tower-enemies.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
const fresh=(seed=123)=>{const g=new Game(defaultProgress(),input);g.setTower(true);g.start('warrior',seed);return g};
const monster=(game,type,offset=185)=>({x:game.player.x+offset,y:game.player.y,type,
 hp:180,maxHp:180,radius:18,speed:120,damage:19,homeRoom:0,
 elite:false,elapsed:0,flash:0,cooldown:0,windup:0,knock:{x:0,y:0},
 specialCooldown:0,spawnIndex:0});
test('ten-stage tower length stays exactly seven rooms, preserving prior design',()=>{
 const g=fresh();
 for(let n=1;n<=TOWER_LENGTH;n++){
  const d=generateDungeon(n*100,{tower:true,biome:towerStage(n).biome});
  assert.equal(d.rooms.length,7,'stage '+n);
  assert.equal(d.rooms.filter(r=>r.type==='boss').length,1);
 }
 assert.equal(g.dungeon.rooms.length,7);
});
test('sovereign phase attacks differ substantially and include avoidable soulbeam and spiralwall',()=>{
 const g=fresh(),e={type:'boss',x:g.player.x+150,y:g.player.y,homeRoom:0,radius:44,
  damage:26, hp:1500,maxHp:1500,cooldown:0,flash:0,knock:{x:0,y:0},
  boss:createTowerBossState(10)};
 assert.equal(e.boss.phase,1);
 let types=[];
 for(let i=0;i<4;i++){beginTowerAttack(g,e);types.push(e.boss.telegraph.type);e.boss.telegraph=null;}
 assert.deepEqual(types,['mark','cross','dash','fan']);
 applyTowerBossDamage(g,e,800);
 assert.equal(e.boss.phase,2);e.boss.transition=0;
 types=[];
 for(let i=0;i<5;i++){beginTowerAttack(g,e);types.push(e.boss.telegraph.type);e.boss.telegraph=null;}
 assert.deepEqual(types,['meteor','orbit','summon','lances','soulbeam']);
 applyTowerBossDamage(g,e,1000);
 assert.equal(e.boss.phase,3);e.boss.transition=0;
 types=[];
 for(let i=0;i<6;i++){beginTowerAttack(g,e);types.push(e.boss.telegraph.type);e.boss.telegraph=null;}
 assert.deepEqual(types,['eclipse','spiralwall','soulbeam','dash','meteor','summon']);
 for(const t of ['soulbeam','spiralwall']){
  assert.ok(beginTowerAttack(g,e,t));
  const before=g.player.hp,bullets=g.projectiles.length;
  assert.ok(e.boss.telegraph.time>.6);
  assert.equal(g.player.hp,before);
  executeTowerAttack(g,e);
  assert.ok(g.projectiles.length>bullets,'telegraphed attack fires projectiles');
  assert.equal(g.player.hp,before,'no instant hit');
 }
});
test('phase three ambient arena attacks are explicitly delayed',()=>{
 const g=fresh();
 const e={type:'boss',x:g.player.x+160,y:g.player.y,homeRoom:0,radius:44,
   damage:25,speed:90,cooldown:15,hp:700,maxHp:2000,
   flash:0,boss:createTowerBossState(10)};
 e.boss.phase=3;e.boss.arenaClock=.01;
 const hp=g.player.hp;
 updateTowerBoss(g,e,.03);
 assert.ok(g.hazards.some(h=>h.time>=1.2&&h.source==='tower'));
 assert.equal(g.player.hp,hp);
});
test('wraiths teleport only after a visible warning to a walkable position',()=>{
 const g=fresh(13),e=monster(g,'wraith');
 g.enemies.push(e);
 assert.equal(updateTowerEnemy(g,e,.016),true);
 assert.equal(e.special?.kind,'teleport');
 assert.ok(e.special.time>.5);
 assert.ok(g.dungeon.canMove(e.special.x,e.special.y,18,true));
 const prev=e.x;
 updateTowerEnemy(g,e,.8);
 assert.notEqual(e.x,prev);
 assert.equal(e.special,null);
});
test('brutes telegraph charge, cultists telegraph rituals, sentinels guard',()=>{
 const g=fresh(),brute=monster(g,'brute');
 assert.equal(updateTowerEnemy(g,brute,.016),true);
 assert.equal(brute.special.kind,'charge');
 assert.ok(brute.special.time>.7);
 updateTowerEnemy(g,brute,.8);assert.equal(brute.special.kind,'surge');
 const cultist=monster(g,'cultist',130);
 assert.equal(updateTowerEnemy(g,cultist,.016),true);
 assert.ok(g.hazards.some(h=>h.source==='enemy'&&h.time>=1));
 const guard=monster(g,'sentinel');
 updateTowerEnemy(g,guard,.016);
 assert.ok(guard.guardTime>2);
 assert.ok(towerEnemyDamage(guard,100,{x:1,y:0})<100);
});
test('environmental traps have a readable delay and do not add or remove rooms',()=>{
 const g=fresh(901);const e=monster(g,'brute');
 g.enemies=[e];
 g.player.x=g.dungeon.rooms[g.dungeon.bossId].cx;
 g.player.y=g.dungeon.rooms[g.dungeon.bossId].cy;
 g.stageHazardClock=0;
 towerRoomHazard(g,.016);
 assert.ok(g.hazards.some(h=>h.time>=1.1&&h.color));
 assert.equal(g.dungeon.rooms.length,7);
});
test('six tower relics are unique, available as a fourth stage reward and retain synergy',()=>{
 const g=fresh();
 assert.equal(TOWER_RELICS.length,6);
 assert.equal(new Set(TOWER_RELICS.map(r=>r.id)).size,6);
 assert.equal(towerTransitionOptions().length,4);
 assert.equal(nextTowerRelic(g).id,'storm');
 for(let n=0;n<6;n++){
  const relic=grantTowerRelic(g);
  assert.ok(relic);assert.equal(g.towerRelics.length,n+1);
 }
 assert.equal(grantTowerRelic(g),false);
 assert.equal(g.player.shield,22);
 assert.ok(towerRelicDamage(g,{burn:1,poison:1},100)>100);
});
test('storm relic chains every fourth hit and never recursively triggers more relic hits',()=>{
 const g=fresh(),a=monster(g,'wraith',60),b=monster(g,'brute',115);
 g.enemies=[a,b];g.towerRelics=['storm'];g.towerRelicHits=3;
 const hp=b.hp;
 afterTowerRelicHit(g,a,20);
 assert.equal(g.towerRelicHits,4);
 assert.ok(b.hp<hp);
 assert.equal(g.towerRelicHits,4);
});
test('phoenix relic prevents death exactly once, then defeat is still possible',()=>{
 const g=fresh();g.towerRelics=['phoenix'];g.player.hp=10;
 g.player.invulnerable=0;g.hurt(100,{x:1,y:0});
 assert.equal(g.mode,'playing');assert.ok(g.player.hp>0);
 assert.equal(g.towerPhoenixUsed,true);
 g.player.invulnerable=0;g.hurt(g.player.maxHp+500,{x:1,y:0});
 assert.equal(g.mode,'dead');
});
test('stage bests and full clear time are stored and a later slower run cannot overwrite fastest',()=>{
 const p=defaultProgress(),g=new Game(p,input);g.setTower(true);g.start('warrior',888);
 for(let floor=1;floor<=10;floor++){
  g.time+=47+floor;
  g.finish(true);
  if(floor<10)g.chooseTowerReward('recover');
 }
 assert.equal(g.mode,'victory');assert.equal(p.towerWins,1);
 assert.ok(p.towerBestTime>0);assert.ok(g.towerNewRecord);
 for(let i=1;i<=10;i++)assert.ok(p.towerStageRecords[i]>=1);
 const best=p.towerBestTime;
 g.start('warrior',889);g.time=best+100;
 for(let floor=1;floor<=10;floor++){
  g.time+=80;g.finish(true);
  if(floor<10)g.chooseTowerReward('power');
 }
 assert.equal(g.mode,'victory');assert.equal(p.towerBestTime,best);
 assert.equal(g.towerNewRecord,false);
 const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 assert.ok(saveProgress(p,storage));
 const recovered=loadProgress(storage);
 assert.equal(recovered.towerBestTime,best);
 assert.ok(recovered.towerStageRecords[10]);
 assert.equal(recovered.towerWins,2);
 assert.equal(normalizeProgress({}).towerBestTime,0);
});
test('normal and endless modes retain their existing number of rooms and settings',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',131);
 assert.equal(g.tower,false);
 assert.equal(g.dungeon.rooms.length,13);
 assert.equal(g.towerRelics.length,0);
});
