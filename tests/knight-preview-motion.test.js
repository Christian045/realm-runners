import test from 'node:test';
import assert from 'node:assert/strict';
import {knightPreviewActionFrame,knightPreviewPresentationFrame,
 KNIGHT_PREVIEW_FRAME_STARTS,KNIGHT_PREVIEW_STRIDE,KNIGHT_PREVIEW_SETTLE_SECONDS}
 from '../src/knight-preview-motion.js';
import {knightFinalFrame} from '../src/knight-final.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';
import {advanceLocomotion} from '../src/locomotion.js';

test('all eight facings preserve exact hit-event contact with independently paced sword paths',()=>{
 const contacts={attack1:3,attack2:4,attack3:5,special:3};
 for(const [clip,hitIndex] of Object.entries(contacts)){
  const starts=KNIGHT_PREVIEW_FRAME_STARTS[clip];
  const hit=KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames;
  assert.equal(starts[hitIndex],hit);
  assert.equal(knightPreviewActionFrame(clip,hit),hitIndex);
  assert.equal(knightPreviewActionFrame(clip,hit-1e-5),hitIndex-1);
  let previous=0;
  for(let i=0;i<=1000;i++){
   const frame=knightPreviewActionFrame(clip,i/1000);
   assert.ok(frame>=previous);previous=frame;
  }
  for(let row=0;row<8;row++){
   const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
   const p={kind:'warrior',hp:100,direction,moving:false,
    knightAction:{clip,elapsed:hit,duration:1,direction}};
   const f=knightFinalFrame(p,1,true);
   assert.equal(f.row,row);assert.equal(f.index,hitIndex);
  }
 }
 assert.notDeepEqual(KNIGHT_PREVIEW_FRAME_STARTS.attack1,KNIGHT_PREVIEW_FRAME_STARTS.attack2);
 assert.equal(knightPreviewActionFrame('walk',.5),null);
});

test('preview steps follow actual distance and settle to a planted foot on stopping',()=>{
 const p={kind:'warrior',hp:100,x:0,y:0,direction:{x:0,y:1},moving:false};
 const state={};
 p.y=14;advanceLocomotion(p,0,0,false,1/60);
 assert.equal(p.knightPreviewDistance,14);
 let frame=knightPreviewPresentationFrame(p,1,knightFinalFrame(p,1,true),state);
 assert.equal(frame.clip,'walk');assert.equal(frame.index,0);
 for(let step=1;step<=7;step++){
  const previousY=p.y;p.y+=KNIGHT_PREVIEW_STRIDE/8;
  advanceLocomotion(p,p.x,previousY,false,1/60);
  frame=knightPreviewPresentationFrame(p,1+step*.06,knightFinalFrame(p,1+step*.06,true),state);
  assert.equal(frame.index,step);
 }
 assert.equal(state.lastWalk.row,0);
 const before=p.knightPreviewDistance;
 advanceLocomotion(p,p.x,p.y,true,1/60);
 assert.equal(p.knightPreviewDistance,before,'no footstep advance during dash');
 frame=knightPreviewPresentationFrame(p,2,knightFinalFrame(p,2,true),state);
 assert.equal(frame.clip,'walk');assert.equal(frame.index,7);
 frame=knightPreviewPresentationFrame(p,2.09,knightFinalFrame(p,2.09,true),state);
 assert.equal(frame.index,0);
 frame=knightPreviewPresentationFrame(p,2+KNIGHT_PREVIEW_SETTLE_SECONDS+.005,
  knightFinalFrame(p,2.13,true),state);
 assert.equal(frame.clip,'idle');assert.equal(frame.index,0);
 const oldY=p.y;p.y+=15;advanceLocomotion(p,p.x,oldY,false,1/60);
 frame=knightPreviewPresentationFrame(p,2.2,knightFinalFrame(p,2.2,true),state);
 assert.equal(frame.index,0,'next walking cycle must begin in a stance pose');
});

test('default animation is untouched unless full preview is explicitly requested',()=>{
 const dir={x:0,y:1};
 const p={kind:'warrior',hp:100,direction:dir,moving:false,
  knightAction:{clip:'attack1',elapsed:.12,duration:1,direction:dir}};
 assert.equal(knightFinalFrame(p,.12).index,0);
 assert.equal(knightFinalFrame(p,.12,true).index,1);
});

test('brief stop/resume continues the step and turning cancels stale settling',()=>{
 const p={knightPreviewDistance:0},s={};
 const walk={clip:'walk',row:0,index:0},idle={clip:'idle',row:0,index:0};
 knightPreviewPresentationFrame(p,0,walk,s,88);
 p.knightPreviewDistance=22;
 assert.equal(knightPreviewPresentationFrame(p,.1,walk,s,88).index,2);
 knightPreviewPresentationFrame(p,.2,idle,s,88);
 const settling=knightPreviewPresentationFrame(p,.24,idle,s,88);
 p.knightPreviewDistance=25;
 assert.equal(knightPreviewPresentationFrame(p,.25,walk,s,88).index,settling.index);
 knightPreviewPresentationFrame(p,.3,idle,s,88);
 const turn=knightPreviewPresentationFrame(p,.31,{...idle,row:4},s,88);
 assert.equal(turn.clip,'idle');assert.equal(turn.row,4);
 p.knightPreviewDistance=0;
 assert.equal(knightPreviewPresentationFrame(p,.4,walk,s,88).index,0);
});

test('whole-body breathing keeps soles fixed with no horizontal drift',async()=>{
 const {knightBreathingRect}=await import('../src/knight-preview-motion.js');
 let min=Infinity,max=-Infinity;
 for(let i=0;i<=280;i++){
  const r=knightBreathingRect(42,13,115,115,i/100);
  assert.equal(r.x,42);assert.equal(r.width,115);
  assert.ok(Math.abs(r.y+r.height*61/72-(13+115*61/72))<1e-10);
  min=Math.min(min,r.height);max=Math.max(max,r.height);
 }
 assert.equal(min,115);assert.equal(max,117);
 assert.deepEqual(knightBreathingRect(42,13,115,115,0),knightBreathingRect(42,13,115,115,2.8));
});
