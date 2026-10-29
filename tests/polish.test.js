import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,ROOM_LAYOUTS} from '../src/dungeon.js';
import {defaultProgress,normalizeProgress,saveProgress,loadProgress} from '../src/progression.js';
import {Game} from '../src/game.js';
import {generateItem,equipItem} from '../src/loot.js';
import {AFFIX_IDS,equippedAffixes,onDash} from '../src/affixes.js';
import {CHALLENGES,ACHIEVEMENTS,challengeUnlocked,awardAchievements} from '../src/motivation.js';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
test('fourteen room layouts remain deterministic, connected, and collision-safe',()=>{
 assert.ok(ROOM_LAYOUTS.length>=14);
 const layouts=new Set();
 for(let seed=1;seed<150;seed++){
  const a=generateDungeon(seed),b=generateDungeon(seed);
  assert.deepEqual(a.rooms.map(r=>[r.layout,r.type,r.eventKind]),b.rooms.map(r=>[r.layout,r.type,r.eventKind]));
  for(const room of a.rooms){
   layouts.add(room.layout);
   assert.ok(a.canMove(room.cx,room.cy,14),'center blocked: '+seed+','+room.id);
   for(const neighbor of room.links)assert.ok(a.rooms[neighbor].links.includes(room.id));
  }
  assert.equal(a.rooms.filter(r=>r.type==='event').length,1);
 }
 assert.ok(layouts.size>=14);
});
test('rare and legendary loot can have one of fifteen real passive effects',()=>{
 assert.ok(AFFIX_IDS.length>=15);
 for(const rarityRoll of [0,.25,.8]){
  const seq=[.4,rarityRoll,.5,.3];let index=0;
  const item=generateItem(()=>seq[index++%seq.length],4,'warrior',true);
  assert.ok(item.affix&&AFFIX_IDS.includes(item.affix));
  assert.ok(item.name.length>5);
 }
});
test('equipped crit-heal triggers on a critical hit without changing old items',()=>{
 const g=new Game(defaultProgress(),input);g.start('warrior',91);
 const item={id:'testfx',slot:'charm',rarity:'rare',stats:{},classes:null,affix:'critHeal'};
 g.player.inventory.push(item);assert.equal(equipItem(g.player,item),true);
 assert.ok(equippedAffixes(g.player).has('critHeal'));
 const e={type:'slime',x:g.player.x+50,y:g.player.y,hp:180,maxHp:180,radius:16,knock:{x:0,y:0},flash:0};
 g.enemies.push(e);g.player.hp=g.player.maxHp-16;g.player.crit=1;
 g.hitEnemy(e,10,{x:1,y:0});
 assert.equal(g.player.hp,g.player.maxHp-12);
 assert.ok(g.shake>0);
 assert.ok(g.hitstop>0);
 assert.ok(e.hp<180);
});
test('dash nova can damage several enemies without recursive procs',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',42);
 const item={id:'dashfx',slot:'charm',rarity:'epic',stats:{},classes:null,affix:'dashNova'};
 g.player.inventory.push(item);equipItem(g.player,item);
 const x=g.player.x,y=g.player.y;
 const e={type:'slime',x:x+50,y,hp:100,maxHp:100,radius:15,knock:{x:0,y:0},flash:0};
 g.enemies.push(e);onDash(g);assert.ok(e.hp<100);
});
test('all new challenge modes are gated by meaningful existing progress',()=>{
 const p=defaultProgress();
 assert.deepEqual(Object.keys(CHALLENGES),['normal','frenzy','glass','nightmare']);
 assert.equal(challengeUnlocked(p,'glass'),false);
 p.runs=2;p.bossKills=3;
 for(const id of Object.keys(CHALLENGES))assert.equal(challengeUnlocked(p,id),true);
 const g=new Game(p,input);
 assert.equal(g.setChallenge('glass'),true);
 g.start('warrior',11);
 assert.ok(g.player.maxHp<145);
 assert.ok(g.player.damage>24);
});
test('achievements are permanent, pay out only once and survive reload',()=>{
 const p=defaultProgress();p.runs=5;p.bossKills=3;p.itemsFound=12;p.eliteKills=8;p.deepestFloor=3;
 const first=awardAchievements(p);assert.equal(first.length,ACHIEVEMENTS.length);
 const gold=p.gold;assert.deepEqual(awardAchievements(p),[]);assert.equal(p.gold,gold);
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 saveProgress(p,storage);const reloaded=loadProgress(storage);
 assert.equal(reloaded.gold,gold);assert.ok(reloaded.achievements.deep);
 assert.equal(normalizeProgress({}).deepestFloor,1);
});
test('forge and trial event choices are playable and optional',()=>{
 for(let seed=1;seed<=8;seed++){
  const g=new Game(defaultProgress(),input);g.start('hunter',seed);
  const room=g.dungeon.rooms.find(r=>r.type==='event');assert.ok(room);
  g.player.x=room.cx;g.player.y=room.cy;g.entrance(room);
  assert.equal(g.mode,'event');
  if(room.eventKind==='forge'){
   assert.ok(g.chooseEvent('reforge'));assert.ok(g.loot.some(e=>e.type==='gear'));
  }else{
   const clearedBefore=g.clearCount;
   assert.ok(g.chooseEvent('challenge'));assert.equal(room.type,'combat');
   assert.ok(g.enemies.some(e=>e.hp>0));assert.equal(g.clearCount,clearedBefore-1);
  }
  assert.equal(g.mode,'playing');
 }
});
test('endless mode unlocks on boss win, keeps gear and increases floor depth',()=>{
 const p=defaultProgress(),g=new Game(p,input);
 assert.equal(g.setEndless(true),false);
 p.bossKills=1;assert.equal(g.setEndless(true),true);
 g.start('mage',12);
 const item={id:'keep',slot:'charm',rarity:'rare',stats:{},classes:null,affix:'poison'};
 g.player.inventory.push(item);equipItem(g.player,item);
 g.runCoins=100;g.finish(true);
 assert.equal(g.mode,'playing');assert.equal(g.floorDepth,2);
 assert.equal(g.player.equipment.charm.id,'keep');
 assert.equal(g.runCoins,100);
 assert.equal(g.progress.deepestFloor,2);
 g.finish(false);assert.equal(g.mode,'dead');
 assert.ok(g.earnedGold>0);
});
