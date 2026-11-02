import test from 'node:test';
import assert from 'node:assert/strict';
import {labSample,LAB_KINDS,LAB_DIRECTIONS,LAB_STATES} from '../src/animation-lab.js';

test('all six production actors sample every state in eight directions without touching saves',()=>{
 const original=globalThis.localStorage;
 globalThis.localStorage={getItem(){throw Error('preview reads save');},setItem(){throw Error('preview writes save');}};
 try{
  let samples=0;
  for(const kind of LAB_KINDS)for(const state of Object.keys(LAB_STATES))for(const direction of LAB_DIRECTIONS)for(const t of [0,.25,.375,.5,.75,1]){
   const {player,pose,shot}=labSample(kind,state,direction,t,true);
   assert.equal(player.kind,kind);assert.ok(Number.isInteger(pose.frame));assert.ok(pose.frame>=0&&pose.frame<(kind==='warrior'?8:6));
   assert.ok(['up','down','left','right'].includes(pose.face));
   if(shot)assert.ok([shot.x,shot.y,shot.aim.x,shot.aim.y].every(Number.isFinite));
   samples++;
  }
  assert.equal(samples,3168);
 }finally{globalThis.localStorage=original;}
});
test('attack phases use real clip event boundaries and combo identities',()=>{
 const d=LAB_DIRECTIONS[2];
 assert.equal(labSample('warrior','attack',d,.375).release,.375);
 assert.equal(labSample('warrior','attack2',d,.5).pose.clip,'attack2');
 assert.equal(labSample('warrior','attack3',d,.5).pose.clip,'attack3');
 for(const kind of LAB_KINDS.slice(1))assert.equal(labSample(kind,'attack3',d,.5).pose.clip,'attack');
 assert.equal(labSample('mage','cast',d,1).progress,.5);
 assert.equal(labSample('mage','recovery',d,0).progress,.65);
 assert.equal(labSample('mage','death',d,1).player.heroDeathElapsed,1.04);
});
test('preview actors do not share mutable direction or state',()=>{
 const d=LAB_DIRECTIONS[0],a=labSample('mage','attack',d,.1),b=labSample('mage','attack',d,.1);
 a.player.direction.x=99;a.player.heroAction.direction.y=99;
 assert.notEqual(b.player.direction.x,99);assert.notEqual(d.x,99);assert.notEqual(b.player.heroAction.direction.y,99);
 assert.throws(()=>labSample('invalid','idle',d,0),RangeError);
});
