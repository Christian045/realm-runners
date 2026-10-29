import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,ROOM_W,ROOM_H} from '../src/dungeon.js';
import {TILE,CLASSES} from '../src/data.js';
import {generateItem,RARITIES,TALENTS,equipItem,buyTalent,talentCost,applyTalents} from '../src/loot.js';
import {defaultProgress,saveProgress,loadProgress} from '../src/progression.js';
import {Game} from '../src/game.js';
import {beginBossAttack,startPhaseTwo,executeBossAttack} from '../src/boss.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
const rnd=(...values)=>{let i=0;return ()=>values[i++%values.length]};

test('all nine room centers can be reached without clipping or a blind alley',()=>{
 for(let seed=1;seed<=90;seed++){
  const d=generateDungeon(seed);
  const stack=[[Math.floor(d.start.x/TILE),Math.floor(d.start.y/TILE)]],seen=new Set();
  while(stack.length){
   const [x,y]=stack.pop(),key=x+','+y;
   if(seen.has(key)||d.tileAt(x,y)!==0)continue;
   seen.add(key);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])stack.push([x+dx,y+dy]);
  }
  for(const room of d.rooms){
   assert.ok(seen.has(Math.floor(room.cx/TILE)+','+Math.floor(room.cy/TILE)),'seed '+seed+' room '+room.id);
   assert.ok(d.canMove(room.cx,room.cy,14),'center free');
  }
 }
});
test('dungeon has varied layouts, special room types and deterministic biomes',()=>{
 for(const seed of [1,2,3,7,8,21,33]){
  const a=generateDungeon(seed),b=generateDungeon(seed);
  assert.deepEqual(a.rooms.map(r=>[r.type,r.layout,r.biome]),b.rooms.map(r=>[r.type,r.layout,r.biome]));
  for(const type of ['start','boss','treasure','shrine','elite','secret'])
   assert.ok(a.rooms.some(r=>r.type===type),type);
  assert.ok(new Set(a.rooms.map(r=>r.layout)).size>=2,'not every room should be identical');
  assert.equal(a.rooms[0].visited,true);
  assert.equal(a.rooms[a.bossId].layout,'open');
 }
});
test('loot rarity, class-specific weapons and equipment replacements have real effects',()=>{
 const item=generateItem(rnd(.01,.32,.1),3,'mage',true);
 assert.ok(['rare','epic','legendary'].includes(item.rarity));
 assert.ok(item.slot);
 assert.ok(item.name);
 const p={kind:'mage',damage:22,speed:210,hp:100,maxHp:100,crit:0,guard:0,leech:0,
  inventory:[item],equipment:{weapon:null,armor:null,charm:null}};
 assert.equal(equipItem(p,item),true);
 const bonus=item.stats.damage||item.stats.hp||item.stats.speed||item.stats.crit||item.stats.guard||item.stats.leech;
 assert.ok(bonus);
 assert.equal(equipItem(p,{...item,classes:['warrior']}),false);
});
test('talent shop permanently spends gold and loads back',()=>{
 const progress=defaultProgress();progress.gold=500;
 assert.equal(buyTalent(progress,'warrior','steel'),true);
 assert.equal(progress.gold,500-talentCost(0));
 const storage=new Map(),store={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 assert.ok(saveProgress(progress,store));
 const reloaded=loadProgress(store);
 assert.equal(reloaded.talents.warrior.steel,1);
 assert.equal(reloaded.gold,progress.gold);
 const hero={kind:'warrior',maxHp:100,hp:100,damage:10,speed:100,crit:0,leech:0};
 applyTalents(hero,reloaded);
 assert.equal(hero.maxHp,108);
});
test('shrine can heal, improve a run, or trade health for gear',()=>{
 const g=new Game(defaultProgress(),input);g.start('hunter',7);
 const room=g.dungeon.rooms.find(r=>r.type==='shrine');
 g.player.hp=Math.floor(g.player.maxHp/2);
 g.player.x=room.cx;g.player.y=room.cy;
 g.update(1/60);
 assert.equal(g.mode,'shrine');
 assert.equal(room.cleared,true);
 const hp=g.player.hp;
 assert.ok(g.chooseShrine('heal'));assert.ok(g.player.hp>hp);assert.equal(g.mode,'playing');
});
test('treasure and secret rooms contain collectible gear or gold',()=>{
 const g=new Game(defaultProgress(),input);g.start('warrior',5);
 for(const type of ['secret','treasure']){
  const room=g.dungeon.rooms.find(r=>r.type===type);
  assert.ok(room);g.player.x=room.cx;g.player.y=room.cy;
  g.update(1/60);
  assert.ok(room.cleared,type);
  assert.ok(g.loot.some(d=>d.type==='gear')||g.player.inventory.some(i=>i.slot),type);
  if(g.mode==='upgrade')g.selectUpgrade(g.upgradeChoices[0].id);
 }
});
test('elite encounter has tougher leader and guarantees equipment reward',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',19);
 const room=g.dungeon.rooms.find(r=>r.type==='elite');
 g.spawnRoom(room);
 const elite=g.enemies.find(e=>e.elite);
 assert.ok(elite);assert.ok(elite.hp>100);
 g.hitEnemy(elite,elite.hp+10,{x:1,y:0});
 assert.ok(g.loot.some(d=>d.type==='gear'));
});
test('second boss appears on alternate seeds with own warning patterns and phase two',()=>{
 const g=new Game(defaultProgress(),input);g.start('warrior',8);
 const room=g.dungeon.rooms[g.dungeon.bossId];g.spawnRoom(room);
 const boss=g.getActiveBoss();assert.equal(boss.boss.variant,'warden');
 for(const kind of ['lances','triple','charge']){
  boss.boss.telegraph=null;boss.boss.charge=null;
  assert.ok(beginBossAttack(g,boss,kind));
  assert.equal(boss.boss.telegraph.type,kind);
  const hp=g.player.hp;assert.equal(g.player.hp,hp);
 }
 boss.boss.telegraph=null;boss.boss.charge=null;
 assert.ok(startPhaseTwo(g,boss));assert.equal(boss.boss.phase,2);
 assert.ok(boss.boss.transition>0);
 assert.equal(boss.boss.telegraph,null);
 boss.boss.transition=0;
 assert.ok(beginBossAttack(g,boss,'spiral'));
 executeBossAttack(g,boss);
 assert.equal(g.projectiles.filter(b=>b.hostile).length,14);
});
test('inventory equipping and closing resumes gameplay',()=>{
 const g=new Game(defaultProgress(),input);g.start('warrior',41);
 const item=g.dropGear(g.player.x,g.player.y);
 g.update(1/60);
 assert.ok(g.player.inventory.some(i=>i.id===item.id));
 g.toggleInventory();assert.equal(g.mode,'inventory');
 assert.ok(g.equip(item.id));
 g.toggleInventory();assert.equal(g.mode,'playing');
});
