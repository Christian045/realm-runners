import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';

const input={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false
};
function setup(type='slime',tower=false){
 const g=new Game(defaultProgress(),input);
 if(tower)g.setTower(true);
 g.start('warrior',84);
 const p=g.player,radius=type==='brute'?22:17;
 const e={x:p.x+p.radius+radius+8,y:p.y,hp:180,maxHp:180,radius,
  homeRoom:0,type,damage:11,speed:95,cooldown:0,windup:0,
  flash:0,elapsed:0,elite:false,spawnIndex:0,specialCooldown:999,
  knock:{x:0,y:0},eliteShot:99,moveX:0,moveY:0};
 g.enemies=[e];
 return {g,p,e};
}
function frames(g,n=120){for(let i=0;i<n&&g.mode==='playing';i++)g.update(1/60)}
test('stationary player is hit by a normal melee enemy stopped at its pursuit distance',()=>{
 const {g,p,e}=setup('slime');
 const startHp=p.hp;
 // +8 px beyond both radii: the old +3 px contact threshold could never reach.
 assert.equal(Math.round(e.x-p.x),p.radius+e.radius+8);
 frames(g,9);
 assert.equal(p.hp,startHp,'a warned melee attack cannot deal immediate damage');
 assert.ok(e.windup>0,'an attack must be queued even while both actors are still');
 frames(g,31);
 assert.ok(p.hp<startHp,'melee must land without the player moving');
 assert.ok(e.cooldown>0&&e.cooldown<2,'the melee swing uses an actual attack cooldown');
});
test('multiple attacks continue as long as a player stands still instead of stalling indefinitely',()=>{
 const {g,p}=setup('goblin'),hp=p.hp;
 frames(g,220);
 assert.ok(hp-p.hp>=22,'at least two separate swings should connect in 3.7 seconds');
});
test('tower melee enemies attack standing players even with special skills on cooldown',()=>{
 for(const type of ['wraith','brute','sentinel']){
  const {g,p}=setup(type,true),hp=p.hp;
  frames(g,65);
  assert.ok(p.hp<hp,type+' must attack at its stopping distance');
 }
});
test('moving out of reach during telegraph avoids a melee hit',()=>{
 const {g,p,e}=setup('slime'),hp=p.hp;
 frames(g,2);
 assert.ok(e.windup>0);
 p.x-=190;
 frames(g,22);
 assert.equal(p.hp,hp,'retreating before the strike must avoid damage');
});
test('melee attacks cannot hit through blocking walls',()=>{
 const {g,p,e}=setup('slime'),hp=p.hp;
 // If line of sight is blocked, an enemy may neither begin nor land a swing.
 const blocked=g.dungeon.isBlocked.bind(g.dungeon);
 g.dungeon.isBlocked=()=>true;
 frames(g,65);
 assert.equal(p.hp,hp);
 assert.ok(!(e.windup>0));
 g.dungeon.isBlocked=blocked;
});
test('ranged attack windup continues to function against a stationary target',()=>{
 const {g,p,e}=setup('archer');
 e.radius=15;e.x=p.x+175;
 const hp=p.hp;
 frames(g,220);
 assert.ok(p.hp<hp,'archers must still fire projectiles toward idle players');
});
