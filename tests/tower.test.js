import test from 'node:test';
import assert from 'node:assert/strict';
import {TOWER_STAGES,TOWER_LENGTH,towerStage,towerFloorSeed,towerTransitionOptions} from '../src/tower.js';
import {Game} from '../src/game.js';
import {generateDungeon} from '../src/dungeon.js';
import {ENEMY_DATA} from '../src/data.js';
import {defaultProgress,normalizeProgress,saveProgress,loadProgress} from '../src/progression.js';
import {createTowerBossState,beginTowerAttack,executeTowerAttack,applyTowerBossDamage,updateTowerBoss} from '../src/tower-boss.js';
import {PixelSpriteAtlas,SPRITE_KINDS,spriteIdentity} from '../src/sprites.js';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
test('all ten tower stages have distinct bosses, themes, encounters and telegraphed attacks',()=>{
 assert.equal(TOWER_STAGES.length,10);
 assert.equal(new Set(TOWER_STAGES.map(s=>s.boss)).size,10);
 assert.equal(new Set(TOWER_STAGES.map(s=>s.roster.join('/'))).size,10);
 assert.equal(new Set(TOWER_STAGES.map(s=>s.signature.join('/'))).size,10);
 for(let i=1;i<=10;i++){
  const stage=towerStage(i);
  assert.equal(stage.floor,i);
  assert.ok(stage.roster.every(type=>ENEMY_DATA[type]));
  assert.ok(stage.signature.length>=3);
  const dungeon=generateDungeon(towerFloorSeed(314,i),{tower:true,biome:stage.biome});
  assert.equal(dungeon.rooms.length,7);
  assert.ok(dungeon.rooms.every(room=>room.biome===stage.biome));
  assert.equal(dungeon.rooms.filter(room=>room.type==='boss').length,1);
  assert.ok(dungeon.rooms.some(room=>room.type==='shrine'));
  assert.ok(dungeon.rooms.some(room=>room.type==='treasure'));
  assert.ok(dungeon.rooms.some(room=>room.type==='elite'));
 }
});
test('tower option is independent, available from the menu, and exclusive to endless',()=>{
 const p=defaultProgress(),g=new Game(p,input);
 assert.ok(g.setTower(true));assert.equal(g.tower,true);
 assert.equal(g.endless,false);
 g.start('hunter',52);
 assert.equal(g.dungeon.rooms.length,7);
 assert.equal(g.getHud().tower,true);
 assert.equal(g.getHud().floor,1);
 assert.equal(g.setTower(false),false,'cannot switch modes mid-run');
 const g2=new Game({...p,bossKills:1},input);
 assert.ok(g2.setTower(true));assert.ok(g2.setEndless(true));
 assert.equal(g2.tower,false);assert.equal(g2.endless,true);
});
test('floor completion selects one of three rewards, keeps gear and moves to the next floor',()=>{
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('warrior',12345);
 const relic={id:'test',slot:'weapon',rarity:'rare',stats:{},affix:null};
 g.player.inventory.push(relic);g.player.equipment.weapon=relic;
 g.runCoins=40;
 g.finish(true);
 assert.equal(g.mode,'stageclear');
 assert.equal(g.floorDepth,1);
 assert.ok(towerTransitionOptions().length===4);
 const originalDamage=g.player.damage;
 assert.ok(g.chooseTowerReward('power'));
 assert.equal(g.mode,'playing');assert.equal(g.floorDepth,2);
 assert.equal(g.player.equipment.weapon.id,'test');
 assert.equal(g.runCoins>40,true);
 assert.ok(g.player.damage>originalDamage);
 assert.equal(g.progress.bossKills,1);
 assert.ok(g.progress.towerBest>=1);
});
test('relic and healing are distinct between-stage rewards',()=>{
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('mage',987);
 g.player.hp=10;
 g.finish(true);g.chooseTowerReward('recover');
 assert.ok(g.player.hp>10);assert.equal(g.floorDepth,2);
 g.finish(true);g.chooseTowerReward('relic');
 assert.equal(g.floorDepth,3);
 assert.ok(g.loot.some(e=>e.type==='gear'));
});
test('nine stage victories do not finish the run; only the tenth unlocks final victory and achievements',()=>{
 const p=defaultProgress(),g=new Game(p,input);g.setTower(true);g.start('mage',3903);
 for(let floor=1;floor<10;floor++){
  assert.equal(g.floorDepth,floor);
  const bossRoom=g.dungeon.rooms[g.dungeon.bossId];g.spawnRoom(bossRoom);
  const boss=g.getActiveBoss();
  assert.ok(boss);
  assert.equal(boss.boss.name,towerStage(floor).boss);
  assert.equal(boss.boss.variant,'tower');
  for(const e of g.enemies)e.hp=0;
  g.finish(true);
  assert.equal(g.mode,'stageclear');
  assert.equal(p.towerWins,0);
  assert.ok(g.chooseTowerReward('power'));
  assert.equal(g.mode,'playing');
 }
 assert.equal(g.floorDepth,10);
 const bossRoom=g.dungeon.rooms[g.dungeon.bossId];g.spawnRoom(bossRoom);
 const boss=g.getActiveBoss();assert.ok(boss);
 assert.equal(boss.boss.variant,'sovereign');
 g.finish(true);
 assert.equal(g.mode,'victory');
 assert.equal(p.towerWins,1);
 assert.equal(p.towerBest,10);
 assert.equal(p.bossKills,10);
 assert.equal(p.runs,1);
 assert.ok(p.achievements.towerConqueror);
 assert.ok(g.earnedGold>=550);
});
test('tower mode defeat awards partial persistent progress without inventing a win',()=>{
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('hunter',250);
 g.finish(true);g.chooseTowerReward('power');
 g.finish(true);g.chooseTowerReward('power');
 g.finish(false);
 assert.equal(g.mode,'dead');
 assert.equal(g.progress.towerBest,2);
 assert.equal(g.progress.towerWins,0);
 assert.equal(g.progress.runs,1);
});
test('final sovereign has three non-skippable phases at 55% and 30% hp',()=>{
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('warrior',111);
 g.floorDepth=10;
 const room=g.dungeon.rooms[g.dungeon.bossId];
 g.spawnRoom(room);
 const boss=g.getActiveBoss();
 assert.equal(boss.boss.variant,'sovereign');
 const first=Math.ceil(boss.maxHp*.55),second=Math.ceil(boss.maxHp*.30);
 applyTowerBossDamage(g,boss,boss.maxHp);
 assert.equal(boss.hp,first);assert.equal(boss.boss.phase,2);
 assert.ok(boss.boss.transition>0);
 boss.boss.transition=0;
 applyTowerBossDamage(g,boss,boss.maxHp);
 assert.equal(boss.hp,second);assert.equal(boss.boss.phase,3);
 boss.boss.transition=0;
 applyTowerBossDamage(g,boss,boss.maxHp);
 assert.equal(boss.hp,0);assert.equal(boss.boss.phase,3);
});
test('each tower boss attack is forewarned and no instant damage is dealt at telegraph start',()=>{
 const g=new Game(defaultProgress(),input);g.setTower(true);g.start('warrior',2040);
 for(let floor=1;floor<=10;floor++){
  g.floorDepth=floor;g.enemies=[];g.hazards=[];g.projectiles=[];
  const room=g.dungeon.rooms[g.dungeon.bossId];g.spawnRoom(room);
  const e=g.getActiveBoss(),hp=g.player.hp;
  assert.ok(beginTowerAttack(g,e));
  assert.equal(g.player.hp,hp);
  assert.ok(e.boss.telegraph.time>.4);
  const type=e.boss.telegraph.type;
  executeTowerAttack(g,e);
  assert.ok(e.boss.telegraph===null);
  if(['meteor','mark','eclipse'].includes(type))
   assert.ok(g.hazards.length>0,'marked attack needs visible delayed hazards');
  assert.equal(g.player.hp,hp,'no attack causes instant invisible damage');
 }
});
test('sovereign and all new floor enemies have dedicated pixel-art sprite identities',()=>{
 for(const type of ['wraith','sentinel','cultist','brute','sovereign',...Array.from({length:9},(_,i)=>'tower'+(i+1))])
  assert.ok(SPRITE_KINDS.includes(type),type);
 assert.equal(spriteIdentity({type:'boss',boss:createTowerBossState(10)}),'sovereign');
 assert.equal(spriteIdentity({type:'boss',boss:createTowerBossState(7)}),'tower7');
 const makeCanvas=()=>({width:0,height:0,getContext:()=>({
  fillRect(){},save(){},restore(){},translate(){},scale(){},
  globalCompositeOperation:'source-over'
 })});
 const atlas=new PixelSpriteAtlas(makeCanvas);
 for(const type of ['wraith','sentinel','cultist','brute','sovereign','tower3']){
  assert.ok(atlas.frame(type,'idle',0,'down'));
 }
});
test('old saves stay compatible and new tower progress survives serialization',()=>{
 const p=normalizeProgress({gold:22,runs:8});
 assert.equal(p.towerBest,0);assert.equal(p.towerWins,0);
 p.towerBest=7;p.towerWins=1;
 const map=new Map(),store={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null};
 assert.ok(saveProgress(p,store));
 const reloaded=loadProgress(store);
 assert.equal(reloaded.towerBest,7);
 assert.equal(reloaded.towerWins,1);
 assert.equal(reloaded.gold,22);
});
