import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,seeded,ROOM_COLS,ROOM_ROWS} from '../src/dungeon.js';
import {CLASSES,chooseUpgrades,normalized} from '../src/data.js';
import {defaultProgress,normalizeProgress,loadProgress,saveProgress,buyPermanent,upgradeCost,SAVE_KEY,OLD_SAVE_KEY} from '../src/progression.js';
import {Game} from '../src/game.js';

test('all dungeon rooms are reachable and boss is not the starting room',()=>{
 for(let seed=1;seed<150;seed++){
  const d=generateDungeon(seed);
  assert.equal(d.rooms.length,ROOM_COLS*ROOM_ROWS);
  assert.notEqual(d.bossId,0);
  const queue=[0],seen=new Set(queue);
  while(queue.length)for(const next of d.rooms[queue.shift()].links)if(!seen.has(next)){seen.add(next);queue.push(next)}
  assert.equal(seen.size,9,'seed '+seed);
  for(const r of d.rooms){
   assert.equal(d.tileAt(Math.floor(r.cx/48),Math.floor(r.cy/48)),0);
   assert.ok(d.canMove(r.cx,r.cy,14),'room center must be walkable');
   for(const n of r.links)assert.ok(d.rooms[n].links.includes(r.id),'links must be reciprocal');
  }
 }
});
test('seeded generation is deterministic',()=>{
 const a=generateDungeon(12345),b=generateDungeon(12345);
 assert.deepEqual(Array.from(a.tiles),Array.from(b.tiles));
 assert.deepEqual(a.rooms.map(r=>r.links),b.rooms.map(r=>r.links));
 assert.deepEqual(a.rooms.map(r=>r.type),b.rooms.map(r=>r.type));
 assert.deepEqual(seeded(5)(),seeded(5)());
});
test('normalization and upgrades have stable properties',()=>{
 assert.deepEqual(normalized(0,0),{x:0,y:0});
 for(const kind of ['warrior','hunter','mage'])assert.ok(CLASSES[kind].damage>0);
 const upgrades=chooseUpgrades(seeded(3),3);
 assert.equal(upgrades.length,3);
 assert.equal(new Set(upgrades.map(u=>u.id)).size,3);
});
test('persistent progress imports safely without deleting old saves',()=>{
 const map=new Map([[OLD_SAVE_KEY,JSON.stringify({class:'mage',gold:999,stars:[3,3]})]]);
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const p=loadProgress(storage);
 assert.equal(p.selectedClass,'mage');assert.equal(p.gold,250);
 assert.ok(saveProgress(p,storage));
 assert.ok(map.has(OLD_SAVE_KEY));
 assert.equal(JSON.parse(map.get(SAVE_KEY)).selectedClass,'mage');
 assert.equal(normalizeProgress({selectedClass:'invalid',gold:-4,upgrades:{strength:800}}).upgrades.strength,5);
});
test('permanent upgrades cost gold and cap at level five',()=>{
 const p=defaultProgress();p.gold=1000;
 assert.equal(upgradeCost(p,'strength'),40);
 for(let i=0;i<5;i++)assert.equal(buyPermanent(p,'strength'),true);
 assert.equal(buyPermanent(p,'strength'),false);
 assert.equal(p.upgrades.strength,5);
 assert.equal(buyPermanent(p,'unknown'),false);
});
const fakeInput={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};
test('new runs initialize all three classes, dungeon and old save-independent state',()=>{
 for(const kind of Object.keys(CLASSES)){
  const game=new Game(defaultProgress(),fakeInput);
  game.start(kind,99);
  assert.equal(game.mode,'playing');
  assert.equal(game.player.kind,kind);
  assert.ok(game.player.maxHp>0);
  assert.equal(game.dungeon.rooms.length,9);
  game.update(1/60);
  assert.equal(game.mode,'playing');
 }
});
test('melee attacks deal directional damage',()=>{
 const game=new Game(defaultProgress(),fakeInput);game.start('warrior',5);
 const p=game.player;
 const e={x:p.x+40,y:p.y,hp:100,maxHp:100,radius:17,type:'slime',knock:{x:0,y:0},flash:0};
 game.enemies=[e];p.direction={x:1,y:0};game.attack();
 assert.ok(e.hp<100);
 const old=e.hp;p.attackCooldown=0;p.direction={x:-1,y:0};game.attack();
 assert.equal(e.hp,old);
});
test('entering a new room spawns enemies and clearing it unlocks a path',()=>{
 const game=new Game(defaultProgress(),fakeInput);game.start('hunter',83);
 const room=game.dungeon.rooms.find(r=>r.type==='combat');
 assert.ok(room);
 game.player.x=room.cx;game.player.y=room.cy;
 game.update(1/60);
 assert.ok(room.visited);
 assert.ok(game.enemies.length>=3);
 assert.ok(!room.cleared);
 for(const enemy of game.enemies)enemy.hp=0;
 game.update(1/60);
 assert.ok(room.cleared);
 assert.equal(game.clearCount,1);
});
test('room upgrades apply to the run without modifying permanent stats',()=>{
 const progress=defaultProgress(),game=new Game(progress,fakeInput);
 game.start('mage',7);game.offerUpgrades();
 assert.equal(game.mode,'upgrade');
 game.selectUpgrade(game.upgradeChoices[0].id);
 assert.equal(game.mode,'playing');
 assert.equal(game.player.upgradeIds.length,1);
 assert.equal(progress.upgrades.strength,0);
});
test('losing a run awards persistent gold and preserves the old save key',()=>{
 const progress=defaultProgress(),game=new Game(progress,fakeInput);
 game.start('warrior',7);game.runCoins=100;game.finish(false);
 assert.equal(game.mode,'dead');assert.equal(progress.gold,65);assert.equal(progress.runs,1);
});
