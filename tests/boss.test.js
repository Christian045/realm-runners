import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { generateDungeon } from '../src/dungeon.js';
import { defaultProgress } from '../src/progression.js';
import { beginBossAttack,executeBossAttack,updateBoss,startPhaseTwo,PHASE_TWO_AT,isBossInvulnerable } from '../src/boss.js';
import { roomTheme } from '../src/atmosphere.js';
const input={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false
};
function setup(seed=99){
 const game=new Game(defaultProgress(),input);game.start('warrior',seed);
 const room=game.dungeon.rooms[game.dungeon.bossId];
 game.player.x=room.cx;game.player.y=room.cy+110;
 room.visited=true;game.spawnRoom(room);
 const boss=game.getActiveBoss();
 assert.ok(boss);return {game,boss,room};
}
test('all rooms have seed-stable visual themes without affecting tile topology',()=>{
 for(let seed=1;seed<=70;seed++){
  const a=generateDungeon(seed),b=generateDungeon(seed);
  assert.deepEqual(a.rooms.map(r=>r.theme),b.rooms.map(r=>r.theme));
  assert.deepEqual(Array.from(a.tiles),Array.from(b.tiles));
  assert.equal(a.rooms[0].theme,'sanctuary');
  assert.equal(a.rooms[a.bossId].theme,'throne');
  for(const room of a.rooms)assert.ok(roomTheme(room).floor);
 }
});
test('boss phase one cycles telegraphed attacks without instant damage',()=>{
 const {game,boss}=setup();
 assert.equal(boss.boss.phase,1);
 for(const expected of ['volley','slam','charge']){
  boss.boss.telegraph=null;boss.boss.charge=null;
  const hp=game.player.hp;
  assert.ok(beginBossAttack(game,boss));
  assert.equal(boss.boss.telegraph.type,expected);
  assert.equal(game.player.hp,hp,'telegraph must not cause damage');
 }
});
test('boss enters invulnerable phase two at exactly 55 percent and exposes warning',()=>{
 const {game,boss}=setup();
 const threshold=Math.ceil(boss.maxHp*PHASE_TWO_AT);
 for(let i=0;i<12&&boss.boss.phase===1;i++)
  game.hitEnemy(boss,boss.maxHp,{x:1,y:0});
 assert.equal(boss.hp,threshold);
 assert.equal(boss.boss.phase,2);
 assert.ok(isBossInvulnerable(boss));
 assert.equal(boss.boss.transition>0,true);
 const hp=boss.hp;game.hitEnemy(boss,200,{x:1,y:0});assert.equal(boss.hp,hp);
 game.projectiles.push({hostile:true,life:10,x:0,y:0});
 assert.equal(startPhaseTwo(game,boss),false,'transition must run only once');
 updateBoss(game,boss,1.7);
 assert.equal(isBossInvulnerable(boss),false);
});
test('slam attack locks its target, warns, then damages only targets that remain inside',()=>{
 const {game,boss}=setup();
 const p=game.player;const hp=p.hp;
 assert.ok(beginBossAttack(game,boss,'slam'));
 const saved={...boss.boss.telegraph.target};
 const r=boss.boss.telegraph.radius;
 assert.ok(r>50);
 p.x=saved.x+r+65;p.y=saved.y;
 boss.boss.telegraph.time=.001;
 updateBoss(game,boss,.01);
 assert.equal(game.player.hp,hp,'dodge outside impact radius must be safe');
 p.x=saved.x;p.y=saved.y;p.invulnerable=0;
 beginBossAttack(game,boss,'slam');
 boss.boss.telegraph.time=.001;
 updateBoss(game,boss,.01);
 assert.ok(game.player.hp<hp,'standing in impact radius must hurt');
});
test('phase two supports fan, nova, charge and summons with visible cast times',()=>{
 const {game,boss}=setup();
 startPhaseTwo(game,boss);boss.boss.transition=0;
 for(const type of ['volley','nova','charge','slam','summon']){
  boss.boss.telegraph=null;boss.boss.charge=null;
  assert.equal(beginBossAttack(game,boss,type),true);
  assert.equal(boss.boss.telegraph.type,type);
  assert.ok(boss.boss.telegraph.duration>=.6);
  if(type==='nova'){
   const n=game.projectiles.length;
   executeBossAttack(game,boss);
   assert.equal(game.projectiles.length-n,14);
  }else if(type==='volley'){
   const n=game.projectiles.length;
   executeBossAttack(game,boss);
   assert.equal(game.projectiles.length-n,7);
  }else executeBossAttack(game,boss);
  if(type==='charge')assert.ok(boss.boss.charge);
  if(type==='summon')assert.ok(game.enemies.some(e=>e.type!=='boss'&&e.hp>0));
 }
});
test('charge is bounded in time and collision-aware',()=>{
 const {game,boss}=setup(100);
 assert.ok(beginBossAttack(game,boss,'charge'));
 executeBossAttack(game,boss);assert.ok(boss.boss.charge);
 for(let i=0;i<45&&boss.boss.charge;i++)updateBoss(game,boss,1/60);
 assert.equal(boss.boss.charge,null);
 assert.ok(game.dungeon.canMove(boss.x,boss.y,boss.radius,true));
});
test('boss defeat clears summons and projectiles, then awards victory',()=>{
 const {game,boss,room}=setup(33);
 startPhaseTwo(game,boss);boss.boss.transition=0;
 beginBossAttack(game,boss,'summon');
 executeBossAttack(game,boss);
 assert.ok(game.enemies.some(e=>e!==boss&&e.hp>0));
 game.projectiles.push({hostile:true,x:boss.x,y:boss.y,vx:0,vy:0,life:3,radius:5,damage:10});
 boss.hp=40;
 game.hitEnemy(boss,1000,{x:1,y:0});
 assert.equal(boss.hp,0);
 assert.ok(game.enemies.every(e=>e===boss||e.hp===0));
 assert.equal(game.projectiles.filter(p=>p.hostile).length,0);
 game.update(1/60);
 assert.equal(game.mode,'playing','defeating a boss keeps the floor explorable');
 assert.equal(room.cleared,true);
 assert.ok(game.exitPortal,'a portal spawns in the cleared boss chamber');
 game.player.x=game.exitPortal.x+150;game.player.y=game.exitPortal.y;
 game.update(1/60);
 assert.equal(game.exitPortal.ready,true);
 game.player.x=game.exitPortal.x;game.player.y=game.exitPortal.y;
 for(let i=0;i<100&&game.mode==='playing';i++)game.update(1/60);
 assert.equal(game.mode,'victory','entering the portal ends the normal run');
 assert.equal(game.progress.bossKills,1);
});
