import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {beginKnightAction,advanceKnightAction,knightPose,KNIGHT_CLIPS} from '../src/knight-animation.js';
import {knightRebornPose,knightBladeTip,KNIGHT_REBORN_FRAME_COUNTS,KNIGHT_REBORN_HITS} from '../src/knight-reborn.js';

test('contact timings stay unchanged while each combo has a visible recovery',()=>{
 assert.equal(KNIGHT_REBORN_FRAME_COUNTS.recovery,6);
 for(const clip of ['attack1','attack2','attack3','special']){
  const direction={x:0,y:1},p={kind:'warrior',hp:100,direction,moving:false,hurtTimer:0};
  beginKnightAction(p,clip,0.8,direction);
  let fired=0;
  advanceKnightAction(p,0.8,()=>fired++);
  assert.equal(fired,1,clip+' hit more than once');
  assert.equal(p.knightAction,null);
  assert.ok(p.knightRecoveryTimer>0);
  assert.equal(knightPose(p,0).clip,'recovery');
  const at=knightPose(p,0).frame;
  advanceKnightAction(p,.07,()=>{});
  assert.equal(knightPose(p,0).clip,'recovery');
  assert.ok(knightPose(p,0).frame>at);
  advanceKnightAction(p,.20,()=>{});
  assert.equal(knightPose(p,0).clip,'idle');
  beginKnightAction(p,clip,0.8,direction);
  assert.equal(p.knightRecoveryTimer,0);
 }
});
test('active swings retain aim and walking resumes in movement direction after contact',()=>{
 const p={kind:'warrior',hp:100,direction:{x:1,y:0},moving:true,knightMoveDirection:{x:1,y:0},knightWalkDistance:80};
 beginKnightAction(p,'attack1',.5,{x:0,y:-1});
 assert.equal(knightPose(p,0).clip,'attack1');
 assert.deepEqual(knightPose(p,0).direction,{x:0,y:-1});
 advanceKnightAction(p,.5,()=>{});
 assert.equal(knightPose(p,0).clip,'walk');
 assert.deepEqual(knightPose(p,0).direction,{x:1,y:0});
 advanceKnightAction(p,.15,()=>{});
 assert.equal(knightPose(p,0).clip,'walk');
});
test('death bends separate joints without rotating the complete character sprite',async()=>{
 const source=await readFile(new URL('../src/knight-reborn.js',import.meta.url),'utf8');
 const painter=source.split('function paintOne(')[1].split('export function createKnightRebornSheets(')[0];
 assert.doesNotMatch(painter,/c\.rotate\(|c\.scale\(/);
 for(let row=0;row<8;row++){
  const drops=Array.from({length:8},(_,f)=>knightRebornPose(row,'death',f).torsoY);
  assert.ok(drops.every((v,i)=>i===0||v>=drops[i-1]));
  assert.ok(drops[7]>drops[0]+5);
  for(let f=0;f<8;f++)assert.equal(knightRebornPose(row,'death',f).legs.length,2);
 }
});
test('hit sparks stay at the actual weapon tip in all eight directions',()=>{
 for(let row=0;row<8;row++){
  const dir={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
  const p={x:75,y:88};
  for(const clip of ['attack1','attack2','attack3','special']){
   const tip=knightBladeTip(p,dir,clip),pose=knightRebornPose(row,clip,KNIGHT_REBORN_HITS[clip]);
   assert.equal(tip.row,row);
   assert.equal(tip.contact,KNIGHT_REBORN_HITS[clip]);
   assert.ok(Math.abs(tip.x-p.x)<85);
   assert.ok(Math.abs(tip.y-p.y)<85);
   assert.ok(Math.hypot(tip.x-p.x-(pose.hand.x*2-72),tip.y-p.y-(pose.hand.y*2-118))>30);
  }
 }
});
