import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js?v=0.25.0';
import {defaultProgress} from '../src/progression.js';
import {separateEnemies,flankVector,lockEnemyAim,meleeArcContains} from '../src/combat-tactics.js?v=0.25.0';
import {beginBossAttack,executeBossAttack,startPhaseTwo} from '../src/boss.js?v=0.25.0';
import {beginWardenAttack,executeWardenAttack,startWardenPhaseTwo} from '../src/warden.js?v=0.25.0';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
const fresh=(seed=31)=>{const g=new Game(defaultProgress(),input);g.start('warrior',seed);return g};
const bossRoom=(seed)=>{
 const game=fresh(seed),room=game.dungeon.rooms[game.dungeon.bossId];
 game.player.x=room.cx;game.player.y=room.cy+100;room.visited=true;
 game.spawnRoom(room);
 return {game,room,boss:game.getActiveBoss()};
};

test('enemy formations separate rather than standing on identical tiles',()=>{
 const e={x:0,y:0,radius:17,type:'goblin',homeRoom:1,spawnIndex:0};
 const ally={x:14,y:0,radius:17,type:'goblin',hp:55,homeRoom:1};
 const g={enemies:[e,ally]};
 const vector=separateEnemies(g,e,{x:0,y:1});
 assert.ok(vector.x<0,'frontline must spread away from its neighbour');
 assert.ok(vector.y>0,'frontline must continue moving toward the player');
 const lone=separateEnemies({enemies:[e]},e,{x:0,y:1});
 assert.deepEqual(lone,{x:0,y:1});
});

test('assassins and goblins flank while heavy shields hold their line',()=>{
 const p={x:200,y:0},base={x:1,y:0,clear:true};
 const assassin={x:0,y:0,type:'assassin',spawnIndex:0,homeRoom:1};
 const flank=flankVector(null,assassin,p,base,.016);
 assert.ok(Math.abs(flank.y)>.2);
 const shield=flankVector(null,{...assassin,type:'bulwark'},p,base,.016);
 assert.deepEqual(shield,base);
});

test('ranged and melee attacks lock aim when first warned',()=>{
 const e={x:10,y:10};
 assert.deepEqual(lockEnemyAim(e,{x:110,y:10}),{x:1,y:0});
 assert.equal(meleeArcContains(e,{x:42,y:10},e.lockedAim,45),true);
 assert.equal(meleeArcContains(e,{x:-22,y:10},e.lockedAim,45),false,
  'moving behind a winding-up melee enemy avoids damage');
});

test('actual enemy windup shoots in original direction, not at moving player',()=>{
 const g=fresh(43),room=g.dungeon.rooms.find(r=>r.type==='combat');
 g.player.x=room.cx+60;g.player.y=room.cy+60;
 const e={type:'archer',x:room.cx,y:room.cy,homeRoom:room.id,
  radius:16,hp:95,maxHp:95,speed:80,damage:9,elapsed:0,flash:0,
  cooldown:99,windup:.01,windupMax:.58,lockedAim:{x:1,y:0},
  knock:{x:0,y:0},attackTimer:0,castTimer:0,specialCooldown:3};
 g.enemies=[e];g.updateEnemies(.02);
 const shot=g.projectiles.at(-1);
 assert.ok(shot,'archer should fire after locked cast');
 assert.ok(shot.vx>0);
 assert.equal(shot.vy,0,'projectile must not follow the new player Y coordinate');
});

test('Slime King phase two echo is telegraphed and has staggered, avoidable impacts',()=>{
 const {game,boss,room}=bossRoom(31);
 assert.notEqual(boss.boss.variant,'warden','seed must select Slime King');
 startPhaseTwo(game,boss);boss.boss.transition=0;
 boss.boss.telegraph=null;boss.boss.charge=null;
 const hp=game.player.hp;
 assert.equal(beginBossAttack(game,boss,'echo'),true);
 const t=boss.boss.telegraph;
 assert.equal(t.type,'echo');
 assert.ok(t.duration>=.6);
 assert.equal(game.player.hp,hp,'warning has no instant damage');
 executeBossAttack(game,boss);
 assert.equal(game.player.hp,hp,'initial cast has no instant damage');
 const areas=game.hazards.filter(h=>h.source==='boss-echo');
 assert.equal(areas.length,3,'main and two side impacts should all be on walkable floor');
 assert.ok(areas[0].time<areas[1].time,'side strikes arrive later');
 assert.ok(areas.every(a=>game.dungeon.canMove(a.x,a.y,12,true)));
 game.player.x=room.cx+160;game.player.y=room.cy+155;
 game.player.invulnerable=0;game.updateHazards(1.05);
 assert.equal(game.player.hp,hp,'stepping into an unmarked safe region should avoid damage');
});

test('Rune Warden cage shows four target-locked hazards with an intentionally safe center',()=>{
 const {game,boss}=bossRoom(2);
 assert.equal(boss.boss.variant,'warden');
 startWardenPhaseTwo(game,boss);boss.boss.transition=0;
 const hp=game.player.hp;
 assert.equal(beginWardenAttack(game,boss,'cage'),true);
 const target={...boss.boss.telegraph.target};
 assert.ok(boss.boss.telegraph.duration>=.6);
 assert.equal(game.player.hp,hp,'no damage during warning');
 executeWardenAttack(game,boss);
 const traps=game.hazards.filter(h=>h.source==='warden-cage');
 assert.equal(traps.length,4);
 assert.ok(traps.every(h=>h.time>=.8&&h.radius<=42));
 game.player.x=target.x;game.player.y=target.y;
 game.player.invulnerable=0;game.updateHazards(.85);
 assert.equal(game.player.hp,hp,'center of cage must be safe');
});
