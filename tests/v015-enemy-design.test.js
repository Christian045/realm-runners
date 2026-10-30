import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {ENEMY_DATA,distance} from '../src/data.js';
import {generateDungeon,ROOM_LAYOUTS,ROOM_SHAPES} from '../src/dungeon.js';
import {TOWER_STAGES} from '../src/tower.js';
import {beginBossAttack,executeBossAttack} from '../src/boss.js';
import {beginWardenAttack,executeWardenAttack,createWardenState} from '../src/warden.js';
import {beginTowerAttack,executeTowerAttack} from '../src/tower-boss.js';
import {ENCOUNTER_ROLES,encounterMitigation,updateEncounterEnemy,enemyRole} from '../src/encounter-enemies.js';
import {SPRITE_KINDS,PixelSpriteAtlas} from '../src/sprites.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false};
function game(seed=44,tower=false){
 const g=new Game(defaultProgress(),input);g.setTower(tower);g.start('warrior',seed);return g;
}
const mob=(g,type,d=135)=>{
 const p=g.player,s=ENEMY_DATA[type];
 return {type,x:p.x+d,y:p.y,hp:s.hp,maxHp:s.hp,damage:s.damage,
  speed:s.speed,radius:s.radius,elapsed:0,flash:0,knock:{x:0,y:0},
  cooldown:0,windup:0,guardTime:0,specialCooldown:0,spawnIndex:0,homeRoom:0};
};
test('four new roles have distinct stats and readable roles',()=>{
 assert.deepEqual(Object.keys(ENCOUNTER_ROLES),['assassin','scout','hexer','bulwark','burrower','chanter']);
 for(const type of Object.keys(ENCOUNTER_ROLES)){
  assert.ok(ENEMY_DATA[type].hp>0);
  assert.ok(ENEMY_DATA[type].damage>0);
  assert.ok(ENCOUNTER_ROLES[type].name);
  assert.equal(enemyRole(type),ENCOUNTER_ROLES[type].role);
 }
});
test('assassin warns before lunging; a stationary player cannot be hit instantly',()=>{
 const g=game(),e=mob(g,'assassin');g.enemies=[e];
 const hp=g.player.hp;
 assert.ok(updateEncounterEnemy(g,e,.016));
 assert.equal(e.special.kind,'assassin-windup');
 assert.ok(e.special.time>.5);
 assert.equal(g.player.hp,hp);
 updateEncounterEnemy(g,e,.7);
 assert.equal(e.special.kind,'assassin-dash');
 assert.equal(g.player.hp,hp);
});
test('scout double arrow is locked, telegraphed and never instant',()=>{
 const g=game(44),e=mob(g,'scout');g.enemies=[e];
 assert.ok(updateEncounterEnemy(g,e,.016));
 assert.equal(e.special.kind,'scout-volley');
 const before=g.projectiles.length,hp=g.player.hp;
 assert.ok(e.special.time>.6);assert.equal(before,0);
 updateEncounterEnemy(g,e,.75);
 assert.equal(g.projectiles.length,2);
 assert.equal(g.player.hp,hp);
 assert.ok(g.projectiles.every(b=>b.hostile));
});
test('hexer marks the player, then spawns delayed hazards',()=>{
 const g=game(),e=mob(g,'hexer');g.enemies=[e];
 const hp=g.player.hp;assert.ok(updateEncounterEnemy(g,e,.016));
 assert.equal(e.special.kind,'hexer-chant');
 assert.equal(g.hazards.length,0);
 updateEncounterEnemy(g,e,.51);
 assert.equal(g.hazards.length,1);
 assert.ok(g.hazards[0].time>=.6);
 assert.equal(g.player.hp,hp);
});
test('bulwark shield blocks frontally and bash has a readable windup',()=>{
 const g=game(),e=mob(g,'bulwark',63);g.enemies=[e];
 assert.ok(updateEncounterEnemy(g,e,.016));assert.equal(e.special.kind,'bulwark-bash');
 assert.ok(e.special.time>=.6);
 assert.equal(g.player.hp,g.player.maxHp);
 assert.ok(encounterMitigation({...e,moveX:-1,moveY:0},100,{x:1,y:0})<100);
 assert.equal(encounterMitigation({...e,guardTime:0},100,{x:1,y:0}),100);
});
test('generator produces tactical rooms without changing the original room counts or connectivity',()=>{
 assert.ok(ROOM_LAYOUTS.includes('bastion'));
 assert.ok(ROOM_LAYOUTS.includes('trident'));
 assert.ok(ROOM_SHAPES.includes('hourglass'));
 assert.ok(ROOM_SHAPES.includes('terrace'));
 const styles=new Set(),shapes=new Set();
 for(let seed=1;seed<=80;seed++){
  for(const tower of [false,true]){
   const d=generateDungeon(seed,{tower,floor:6});
   assert.equal(d.rooms.length,tower?7:16);
   assert.equal(d.rooms.filter(r=>r.type==='boss').length,1);
   for(const r of d.rooms){styles.add(r.encounterStyle);shapes.add(r.shape);
    assert.ok(d.canMove(r.cx,r.cy,12),'center must remain walkable');
    assert.ok(r.roomLabel);
   }
   const visited=new Set([0]),queue=[0];
   while(queue.length){const id=queue.shift();for(const next of d.rooms[id].links)
    if(!visited.has(next)){visited.add(next);queue.push(next)}}
   assert.equal(visited.size,d.rooms.length,'doors must remain connected');
  }
 }
 assert.equal(styles.size,5);assert.ok(shapes.has('hourglass')&&shapes.has('terrace'));
});
test('all tower rosters include the new tactical roles without losing their bosses',()=>{
 const roles=new Set();
 for(const t of TOWER_STAGES){
  for(const type of t.roster){assert.ok(ENEMY_DATA[type]);roles.add(type)}
  assert.ok(t.boss&&t.signature.length>=3);
 }
 for(const name of ['assassin','scout','hexer','bulwark'])assert.ok(roles.has(name));
 for(const name of ['burrower','chanter'])assert.ok(ENEMY_DATA[name]&&ENCOUNTER_ROLES[name]);
});
test('fresh generated combat chambers still damage an idle player',()=>{
 for(const tower of [false,true]){
  for(const seed of [5,27,91]){
   const g=game(seed,tower),room=g.dungeon.rooms.find(r=>r.type==='combat');
   g.player.x=room.cx;g.player.y=room.cy;g.entrance(room);
   const hp=g.player.hp;
   for(let frame=0;frame<800&&g.mode==='playing'&&g.player.hp===hp;frame++)g.update(1/60);
   assert.ok(g.player.hp<hp,'idle fight '+seed+' '+tower+' should damage the hero');
  }
 }
});
test('all new enemy sprites have authored, cached attack and cast frames',()=>{
 const draw=()=>{const colors=[];const ctx={fillStyle:'#000',save(){},restore(){},translate(){},scale(){},
 fillRect(){colors.push(this.fillStyle)}};return {width:0,height:0,colors,getContext:()=>ctx}};
 const atlas=new PixelSpriteAtlas(draw);
 for(const type of Object.keys(ENCOUNTER_ROLES)){
  assert.ok(SPRITE_KINDS.includes(type));
  for(const state of ['idle','walk','attack','cast','hurt']){
   const sprite=atlas.frame(type,state,1,'left');
   assert.ok(sprite.colors.length>=16,type+' '+state);
   assert.ok(new Set(sprite.colors).size>=5,type+' '+state);
   assert.strictEqual(atlas.frame(type,state,1,'left'),sprite);
  }
 }
});
test('slime ruler fracture telegraphs two delayed zones and a recovery opening',()=>{
 const g=game(45),room=g.dungeon.rooms[g.dungeon.bossId];
 g.player.x=room.cx;g.player.y=room.cy;g.spawnRoom(room);
 const boss=g.getActiveBoss();boss.boss.phase=2;boss.boss.transition=0;
 assert.ok(beginBossAttack(g,boss,'fracture'));
 assert.ok(boss.boss.telegraph.time>.5);
 const hp=g.player.hp;executeBossAttack(g,boss);
 assert.equal(g.hazards.length,2);assert.ok(g.hazards.every(h=>h.time>=.7));
 assert.ok(boss.boss.exposed>0);
 assert.equal(g.player.hp,hp);
});
test('warden crystal sweep has two delayed lanes with a central opening',()=>{
 const g=game(),room=g.dungeon.rooms[g.dungeon.bossId];
 g.player.x=room.cx;g.player.y=room.cy;g.spawnRoom(room);
 const boss=g.getActiveBoss();boss.boss=createWardenState();boss.boss.phase=2;
 assert.ok(beginWardenAttack(g,boss,'sweep'));assert.ok(boss.boss.telegraph.time>.5);
 const hp=g.player.hp;
 executeWardenAttack(g,boss);
 assert.equal(g.hazards.length,2);assert.equal(g.player.hp,hp);
 assert.ok(boss.boss.exposed>0);
});
test('tower ruler pincer warns before two flanking zones and keeps center safe',()=>{
 const g=game(123,true),room=g.dungeon.rooms[g.dungeon.bossId];
 g.floorDepth=4;g.player.x=room.cx;g.player.y=room.cy;g.spawnRoom(room);
 const boss=g.getActiveBoss();boss.boss.phase=2;boss.boss.transition=0;
 assert.ok(beginTowerAttack(g,boss,'pincer'));
 const hp=g.player.hp;const tgt=boss.boss.telegraph.target;
 assert.ok(boss.boss.telegraph.time>.5);
 executeTowerAttack(g,boss);
 assert.equal(g.hazards.length,2);assert.equal(g.player.hp,hp);
 assert.ok(g.hazards.every(h=>distance(h,tgt)>100));
 assert.ok(boss.boss.exposed>0);
});
