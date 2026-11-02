import test from 'node:test';
import assert from 'node:assert/strict';
import {beginHeroAction,advanceHeroAction} from '../src/hero-animation.js';
import {beginKnightAction,advanceKnightAction} from '../src/knight-animation.js';
import {heroShot} from '../src/hero-aim.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';

test('release socket is invariant under frame partitioning, including a frame longer than the action',()=>{
 for(let direction=0;direction<8;direction++){
  const angle=direction*Math.PI/4,shots=[];
  for(const chunks of [[.6],Array(60).fill(.01),[.11,.23,.26]]){
   const p={kind:'summoner',x:100,y:100,hp:100,direction:{x:Math.cos(angle),y:Math.sin(angle)}};
   beginHeroAction(p,'attack',.6);let releases=0;
   for(const dt of chunks)advanceHeroAction(p,dt,a=>{releases++;assert.equal(a.elapsed,.3);shots.push(heroShot(p,a));});
   assert.equal(releases,1);assert.equal(p.heroAction,null);
  }
  assert.deepEqual(shots[0],shots[1]);assert.deepEqual(shots[0],shots[2]);
 }
});
test('knight callbacks see the hit pose, and replacement actions survive',()=>{
 const p={direction:{x:1,y:0}};beginKnightAction(p,'attack1',.8);
 let replacement;
 advanceKnightAction(p,1,a=>{assert.ok(Math.abs(a.elapsed-.3)<1e-10);replacement=beginKnightAction(p,'attack2',.8);});
 assert.strictEqual(p.knightAction,replacement);assert.equal(replacement.elapsed,0);
});
test('touch casts hit near aimed enemies in eight directions without pulling toward off-axis enemies',()=>{
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const kind of ['mage','summoner'])for(let i=0;i<8;i++){
  const g=new Game(defaultProgress(),input);g.start(kind,721);const p=g.player,a=i*Math.PI/4,d={x:Math.cos(a),y:Math.sin(a)};
  p.direction=d;p.crit=0;g.dungeon.isBlocked=()=>false;
  const enemy=(x,y)=>({type:'mushroom',x,y,hp:1000,maxHp:1000,radius:19,flash:0,knock:{x:0,y:0},homeRoom:0,damage:10});
  const target=enemy(p.x+d.x*40,p.y+d.y*40),off=enemy(p.x-d.y*50,p.y+d.x*50);
  g.enemies=[off,target];g.attack();assert.deepEqual(p.heroAction.target,{x:target.x,y:target.y-27});g.updateHeroAction(1);
  for(let j=0;j<25&&target.hp===1000;j++)g.updateProjectiles(.016);
  assert.ok(target.hp<1000,kind+' direction '+i);
 }
});
