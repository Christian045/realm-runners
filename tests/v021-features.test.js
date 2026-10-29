import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js?v=0.21.0';
import {CLASSES,ENEMY_DATA} from '../src/data.js';
import {defaultProgress,saveProgress,loadProgress} from '../src/progression.js';
import {generateDungeon} from '../src/dungeon.js';
import {generateItem,equipItem,RARITIES} from '../src/loot.js';
import {SPECIALIZATIONS} from '../src/specializations.js';
import {ENCOUNTER_ROLES} from '../src/encounter-enemies.js';
import {SPRITE_KINDS} from '../src/sprites.js';
import {CHALLENGES,ACHIEVEMENTS,awardAchievements} from '../src/motivation.js';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
const fresh=(kind='warrior',seed=37)=>{const g=new Game(defaultProgress(),input);g.start(kind,seed);return g};

test('all six classes exist, start at 100 base HP and have dedicated sprites and talents',()=>{
 for(const kind of Object.keys(CLASSES)){
  const g=fresh(kind);
  assert.equal(g.player.maxHp,100,'base HP '+kind);
  assert.equal(g.player.hp,100);
  assert.ok(SPRITE_KINDS.includes(kind));
  assert.ok(SPECIALIZATIONS[kind]?.length>=1);
 }
});
test('victory is postponed until the player deliberately enters the boss portal',()=>{
 const g=fresh(),bossRoom=g.dungeon.rooms.find(r=>r.type==='boss');
 g.player.x=bossRoom.cx;g.player.y=bossRoom.cy;g.entrance(bossRoom);
 assert.ok(g.enemies.some(e=>e.type==='boss'));
 for(const e of g.enemies)e.hp=0;
 g.update(1/60);
 assert.equal(g.mode,'playing');
 assert.ok(g.exitPortal);
 assert.ok(bossRoom.cleared);
 g.player.x=g.exitPortal.x+145;g.player.y=g.exitPortal.y;
 g.update(1/60);
 assert.equal(g.exitPortal.ready,true);
 g.player.x=g.exitPortal.x;g.player.y=g.exitPortal.y;
 for(let frame=0;frame<120&&g.mode==='playing';frame++)g.update(1/60);
 assert.equal(g.mode,'victory');
 assert.equal(g.progress.bossKills,1);
});
test('shops are deterministic, sell three pieces and charge run gold once',()=>{
 const a=generateDungeon(310),b=generateDungeon(310);
 assert.deepEqual(a.rooms.map(r=>r.type),b.rooms.map(r=>r.type));
 assert.equal(a.rooms.filter(r=>r.type==='shop').length,1);
 const g=fresh('hunter',310),room=g.dungeon.rooms.find(r=>r.type==='shop');
 g.player.x=room.cx;g.player.y=room.cy;g.entrance(room);
 assert.equal(g.mode,'shop');assert.equal(g.shopStock.length,3);
 g.runCoins=999;
 const before=g.runCoins;
 assert.equal(g.chooseShop('0'),true);
 assert.equal(g.chooseShop('0'),false,'purchases cannot duplicate the same item');
 assert.ok(g.runCoins<before);
 assert.equal(g.player.inventory.length,1);
 assert.equal(g.chooseShop('leave'),true);
 assert.equal(g.mode,'playing');
});
test('mythic drops cannot appear outside boss loot',()=>{
 const zero=()=>0;
 for(const kind of Object.keys(CLASSES)){
  assert.notEqual(generateItem(zero,4,kind,true).rarity,'mythic');
  assert.equal(generateItem(zero,4,kind,true,true).rarity,'mythic');
 }
 assert.ok(RARITIES.mythic);
});
test('six equipment slots include two distinct rings and an amulet',()=>{
 const g=fresh('warrior');
 const equipment=['weapon','armor','charm','amulet','ring1','ring2'];
 assert.deepEqual(Object.keys(g.player.equipment),equipment);
 const item={id:'ring',slot:'ring2',rarity:'rare',stats:{hp:6},classes:null};
 g.player.inventory.push(item);
 assert.equal(equipItem(g.player,item),true);
 assert.equal(g.player.equipment.ring2.id,'ring');
});
test('explosive elites telegraph for less than half a second',()=>{
 const g=fresh(),e={type:'goblin',hp:0,elite:true,eliteMod:'volatile',x:g.player.x+70,
  y:g.player.y,radius:17,maxHp:80,damage:12,homeRoom:0};
 g.killEnemy(e);
 const h=g.hazards.at(-1);
 assert.equal(h.time,.48);
 assert.ok(h.radius>=100);
});
test('no-hit challenge ends on first actual damage; glass cannon risks max health',()=>{
 assert.ok(CHALLENGES.nohit);
 const g=new Game(defaultProgress(),input);g.setChallenge('nohit');g.start('mage',8);
 g.hurt(4,{x:0,y:1});
 assert.equal(g.mode,'dead');
 assert.equal(g.progress.noHitWins,0);
 const glass=fresh('glasscannon');const damage=glass.player.damage;
 glass.hurt(7,{x:1,y:0});
 assert.ok(glass.player.maxHp<100&&glass.player.damage>damage);
});
test('summoner picks one of three servants and alchemist cycles potion effects',()=>{
 const g=new Game(defaultProgress(),input);
 assert.equal(g.setServant('spirit'),true);
 g.start('summoner',21);
 assert.equal(g.servant.kind,'spirit');
 g.update(1/60);
 assert.ok(Number.isFinite(g.servant.x));
 const a=fresh('alchemist');a.attack();
 assert.equal(a.projectiles.at(-1).alchemy,'burn');
 a.attack();assert.equal(a.projectiles.at(-1).alchemy,'poison');
});
test('magician and archer have distinct three-way style choices',()=>{
 assert.ok(SPECIALIZATIONS.mage.some(x=>x.id==='pyromancer'));
 assert.ok(SPECIALIZATIONS.mage.some(x=>x.id==='cryomancer'));
 assert.ok(SPECIALIZATIONS.mage.some(x=>x.id==='standard'));
 assert.ok(SPECIALIZATIONS.hunter.some(x=>x.id==='ranger'));
 assert.ok(SPECIALIZATIONS.hunter.some(x=>x.id==='marksman'));
});
test('new enemy roles and large achievement goals are saved',()=>{
 for(const kind of ['burrower','chanter']){
  assert.ok(ENEMY_DATA[kind]&&ENCOUNTER_ROLES[kind]);
 }
 const progress=defaultProgress();
 progress.runs=1000;progress.bossKills=100;progress.noHitWins=1;
 progress.statistics.damageDealt=10000;
 awardAchievements(progress);
 for(const id of ['thousandRuns','damage10k','boss100','noHitWin'])
  assert.equal(progress.achievements[id],true);
 const storage={value:'',getItem(){return this.value||null},setItem(k,v){this.value=v}};
 assert.ok(saveProgress(progress,storage));
 for(const id of ['thousandRuns','damage10k','boss100','noHitWin'])
  assert.equal(loadProgress(storage).achievements[id],true);
});


test('normal runs feature four actual combat chambers alongside all curated rooms',()=>{
 for(let seed=1;seed<=80;seed++){
  const d=generateDungeon(seed);
  assert.equal(d.rooms.length,16,'normal dungeon room count seed '+seed);
  assert.equal(d.rooms.filter(room=>room.type==='combat').length,4,
   'normal dungeon must not consist mostly of passive special rooms');
  assert.equal(d.rooms.filter(room=>room.type==='shop').length,1);
  assert.equal(d.rooms.filter(room=>room.type==='boss').length,1);
  assert.equal(d.rooms.filter(room=>room.type==='start').length,1);
 }
 const tower=generateDungeon(51,{tower:true,biome:'crypt',floor:6});
 assert.equal(tower.rooms.length,7,'ten-stage tower room density stays unchanged');
});

test('warden and slime-king boss kills appear under their distinct names in stats',()=>{
 const g=fresh();
 const root={hp:0,maxHp:100,type:'boss',x:g.player.x+30,y:g.player.y+30,
  radius:38,homeRoom:0,elite:false};
 g.killEnemy({...root,boss:{variant:'warden'}});
 g.killEnemy({...root,boss:{variant:'slimeking'}});
 assert.equal(g.progress.statistics.bosses['DER RUNENWÄCHTER'],1);
 assert.equal(g.progress.statistics.bosses['DER SCHLEIMKÖNIG'],1);
 assert.equal(g.progress.statistics.kills.boss,2);
});

test('no-hit remains lethal even when a phoenix resurrection relic is equipped',()=>{
 const g=new Game(defaultProgress(),input);
 g.setChallenge('nohit');g.setTower(true);g.start('warrior',111);
 g.towerRelics=['phoenix'];g.player.hp=10;g.player.invulnerable=0;
 g.hurt(100,{x:1,y:0});
 assert.equal(g.mode,'dead','no-hit death cannot be overridden by phoenix');
 assert.equal(g.towerPhoenixUsed,false);
 assert.equal(g.progress.noHitWins,0);
});
