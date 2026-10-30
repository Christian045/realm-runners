import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {CLASSES,ENEMY_DATA} from '../src/data.js';
import {defaultProgress} from '../src/progression.js';
import {BOSS_BALANCE,cappedBossDamage,towerWindup} from '../src/combat-balance.js';
import {beginTowerAttack,executeTowerAttack} from '../src/tower-boss.js';
import {generateDungeon} from '../src/dungeon.js';
import {towerStage} from '../src/tower.js';

const input=()=>({movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false});
function setup(tower=false,floor=1,kind='warrior'){
 const g=new Game(defaultProgress(),input());if(tower)g.setTower(true);
 g.start(kind,11);g.floorDepth=floor;
 const room=g.dungeon.rooms[g.dungeon.bossId];
 room.visited=true;g.player.x=room.cx;g.player.y=room.cy;
 g.spawnRoom(room);
 return {g,boss:g.getActiveBoss(),room};
}
test('fully upgraded warrior can no longer four-shot any boss variant',()=>{
 for(const [tower,floor] of [[false,1],[true,1],[true,5],[true,10]]){
  const {g,boss}=setup(tower,floor);
  g.player.damage=1500;g.player.crit=1;
  const fraction=boss.boss.variant==='sovereign'?BOSS_BALANCE.sovereignHitFraction:
    tower?BOSS_BALANCE.towerHitFraction:BOSS_BALANCE.normalHitFraction;
  for(let hit=1;hit<=4;hit++){
   g.hitEnemy(boss,9999,{x:1,y:0});
   assert.ok(boss.hp>0,'boss survived hit '+hit+' on stage '+floor);
  }
  assert.ok(boss.hp>=boss.maxHp*(1-4*fraction)-5);
  assert.equal(boss.deadHandled,undefined);
 }
});
test('boss warning begins while player remains completely still, before a fourth default sword swing',()=>{
 for(const [tower,floor] of [[false,1],[true,1],[true,7],[true,10]]){
  const {g,boss}=setup(tower,floor);g.player.invulnerable=20;
  assert.ok(boss.cooldown<=.2,'boss must begin with a short opening delay');
  for(let i=0;i<18;i++)g.update(1/60);
  assert.ok(boss.boss.telegraph,'the first warning must have begun within 0.3 seconds');
  assert.ok(boss.boss.telegraph.duration<=.85,'warning must be quick but readable');
  for(let i=0;i<65;i++)g.update(1/60);
  assert.ok(boss.boss.attackIndex>=1);
  assert.ok(g.mode==='playing');
 }
});
test('normal boss damage caps still allow phase transition and eventual victory',()=>{
 const {g,boss}=setup(false);
 for(let n=0;n<60&&boss.boss.phase===1;n++)g.hitEnemy(boss,1e5,{x:1,y:0});
 assert.equal(boss.boss.phase,2);
 const hp=boss.hp;
 g.hitEnemy(boss,1e5,{x:1,y:0});
 assert.equal(boss.hp,hp,'invulnerable during clearly telegraphed phase change');
 boss.boss.transition=0;
 for(let n=0;n<60&&boss.hp>0;n++)g.hitEnemy(boss,1e5,{x:1,y:0});
 assert.equal(boss.hp,0);
});
test('boss hit cap only affects bosses, never regular enemies',()=>{
 const normal={type:'slime',hp:40,maxHp:40};
 const boss={type:'boss',maxHp:1200,boss:{variant:'tower'}};
 assert.equal(cappedBossDamage(normal,500),500);
 assert.ok(cappedBossDamage(boss,500)<=102);
 assert.equal(cappedBossDamage(boss,10),10);
});
test('warrior gains a 3-hit combo with a readable stronger finisher',()=>{
 const g=new Game(defaultProgress(),input());g.start('warrior',4);
 const p=g.player,e={type:'slime',x:p.x+45,y:p.y,hp:1500,maxHp:1500,radius:18,
  knock:{x:0,y:0},flash:0,homeRoom:0};
 g.enemies=[e];p.direction={x:1,y:0};
 const changes=[];
 for(let i=0;i<3;i++){const before=e.hp;g.attack();g.updateHeroAction(1);g.updateKnightAction(1);changes.push(before-e.hp)}
 assert.deepEqual([1,2,3],[1,2,3].map((_,i)=>i+1));
 assert.equal(p.comboStep,3);
 assert.ok(changes[2]>changes[0],'finisher should do more damage');
 assert.ok(g.effects.some(e=>e.type==='ring'&&e.color==='#ffe29d'));
});
test('holding hunter attack charges a piercing precision shot while keeping normal taps',()=>{
 const inp=input();let held=false;inp.attacking=()=>held;
 const g=new Game(defaultProgress(),inp);g.start('hunter',55);
 g.player.hunterCharge=.92;held=true;
 g.update(1/60);g.updateHeroAction(1);
 const arrow=g.projectiles.find(x=>x.charged);
 assert.ok(arrow,'long press should fire a charged shot');
 assert.equal(arrow.pierce,3);assert.ok(arrow.damage>g.player.damage*2);
 held=false;g.update(1/60);
 assert.equal(g.player.hunterCharge,0);
});
test('repeated damage upgrades diminish and attack delay has a safe minimum',()=>{
 const g=new Game(defaultProgress(),input());g.start('warrior',10);
 const p=g.player;p.upgradeIds=[];
 for(let i=0;i<10;i++){g.mode='upgrade';g.upgradeChoices=[{id:'power'}];g.selectUpgrade('power')}
 assert.ok(p.damage<CLASSES.warrior.damage*4.5,'power upgrades must not double damage each few rooms');
 for(let i=0;i<15;i++){g.mode='upgrade';g.upgradeChoices=[{id:'fury'}];g.selectUpgrade('fury')}
 assert.ok(p.attackDelay>=CLASSES.warrior.cooldown*.58);
});
test('later tower floors keep seven rooms, but no longer guarantee a treasure chamber',()=>{
 for(let floor=1;floor<=10;floor++){
  const d=generateDungeon(floor*172,{tower:true,floor,biome:towerStage(floor).biome});
  assert.equal(d.rooms.length,7);
  assert.equal(d.rooms.filter(r=>r.type==='treasure').length,floor<4?1:0);
  assert.equal(d.rooms.filter(r=>r.type==='boss').length,1);
 }
 const normal=generateDungeon(123);assert.equal(normal.rooms.length,16);
});
test('final boss blade corridors are telegraphed and leave a central dodge lane',()=>{
 const {g,boss,room}=setup(true,10);
 boss.boss.phase=3;boss.boss.transition=0;
 assert.ok(beginTowerAttack(g,boss,'blades'));
 assert.ok(boss.boss.telegraph.time>.5);
 const hp=g.player.hp;
 executeTowerAttack(g,boss);
 assert.equal(g.hazards.length,14);
 assert.ok(g.hazards.every(h=>Math.abs(h.y-room.cy)>=40));
 assert.ok(g.hazards.every(h=>h.time>0));
 assert.equal(g.player.hp,hp);
});
