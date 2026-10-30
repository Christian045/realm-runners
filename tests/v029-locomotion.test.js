import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {advanceLocomotion,locomotionFrame,legPoses,WALK_STRIDE} from '../src/locomotion.js';
import {heroPose} from '../src/hero-animation.js';
import {knightPose} from '../src/knight-animation.js';
const kinds=['warrior','hunter','mage','glasscannon','summoner','alchemist'];
function scene(kind){const input={movement:()=>({x:1,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};const g=new Game(defaultProgress(),input);g.start(kind,5);g.enemies=[];return g;}

test('each leg completes eight different phases and the support foot alternates',()=>{
 for(const face of ['down','right','up','left']){
  const visited=[new Set(),new Set()],supports=[];
  for(let frame=0;frame<8;frame++){
   const legs=legPoses({walkDistance:frame*WALK_STRIDE/8},{face,direction:{x:1,y:0}});
   legs.forEach((p,i)=>visited[i].add(p.frame));assert.equal((legs[1].frame-legs[0].frame+8)%8,4);
   assert.ok(Math.max(...legs.map(l=>l.hipY+l.height))>=6,'one foot stays on the ground plane');
   supports.push(legs[0].height>legs[1].height?0:1);
  }
  assert.equal(visited[0].size,8);assert.equal(visited[1].size,8);assert.notEqual(supports[0],supports[4]);
 }
});

test('all six classes advance gait by real distance, and stop against walls or stun',()=>{
 for(const kind of kinds){
  const g=scene(kind),p=g.player,from={x:p.x,y:p.y};g.update(1/60);
  assert.ok(p.moving,kind);assert.ok(Math.abs(p.walkDistance-Math.hypot(p.x-from.x,p.y-from.y))<1e-6);
  const phase=p.walkDistance;g.dungeon.canMove=()=>false;g.update(1/60);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
  g.dungeon.canMove=()=>true;p.statuses={stun:1};g.update(1/60);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
 }
});

test('sliding follows actual movement direction; slower travel advances fewer frames',()=>{
 const p={x:20,y:10,walkDistance:0};advanceLocomotion(p,20,0);
 assert.deepEqual(p.heroMoveDirection,{x:0,y:1});assert.equal(p.walkDistance,10);
 const a={x:5,y:0,walkDistance:0},b={x:10,y:0,walkDistance:0};advanceLocomotion(a,0,0);advanceLocomotion(b,0,0);
 assert.equal(a.walkDistance*2,b.walkDistance);
 const before=p.walkDistance;advanceLocomotion(p,0,0,true);assert.equal(p.moving,false);assert.equal(p.walkDistance,before);
 assert.equal(locomotionFrame({walkDistance:WALK_STRIDE/8,heroMoveDirection:{x:-1,y:0}},{x:1,y:0}),7,'backpedal reverses the step order');
});

test('pause, idle and dash freeze stepping; moving attacks keep their independent clocks',()=>{
 for(const kind of kinds){
  const g=scene(kind),p=g.player;g.attack();const action=p.knightAction||p.heroAction,clock=action.elapsed;
  g.update(.02);assert.ok(p.walkDistance>0);assert.ok(action.elapsed>clock);assert.match((kind==='warrior'?knightPose(p):heroPose(p)).clip,/attack/);
  const phase=p.walkDistance,elapsed=action.elapsed;g.mode='paused';g.update(.02);assert.equal(p.walkDistance,phase);assert.equal(action.elapsed,elapsed);
  g.mode='playing';g.input.movement=()=>({x:0,y:0});g.update(.02);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
  g.input.consumeDash=()=>true;g.update(.02);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
 }
});
