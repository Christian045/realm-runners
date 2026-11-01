import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawKnightWalk,KNIGHT_WALK_FACES,KNIGHT_VISUAL_STRIDE} from '../src/knight-walk.js';
import {KnightSpriteAtlas} from '../src/knight-sprites.js';
import {knightPose,beginKnightAction} from '../src/knight-animation.js';
import {advanceLocomotion} from '../src/locomotion.js';

const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
test('sprite sheet has 32 cells at 96x96',()=>{
 const b=readFileSync(new URL('../assets/knight/walk-v034.png',import.meta.url));
 assert.equal(b.subarray(1,4).toString(),'PNG');
 assert.equal(b.readUInt32BE(16),768);
 assert.equal(b.readUInt32BE(20),384);
});
test('new atlas renders exactly one correctly indexed full-body image in all directions',()=>{
 const image={},seen=new Set();
 for(const [face,d] of Object.entries(dirs))for(let i=0;i<8;i++){
  const p={kind:'warrior',hp:100,x:100,y:100,moving:true,direction:d,
   knightMoveDirection:d,knightWalkDistance:KNIGHT_VISUAL_STRIDE*i/8};
  const pose=knightPose(p),calls=[],ctx={drawImage(...args){calls.push(args);}};
  assert.equal(pose.frame,i);assert.equal(pose.face,face);
  assert.equal(drawKnightWalk(ctx,p,pose,image),true);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].slice(0,6),[image,i*96,KNIGHT_WALK_FACES[face]*96,96,96,52]);
  assert.ok(Math.abs(calls[0][6]-22)<=1,'boot pivot should remain within 1px');
  assert.deepEqual(calls[0].slice(7),[96,96]);
  seen.add(calls[0][1]+':'+calls[0][2]);
 }
 assert.equal(seen.size,32);
});
test('knight steps only while actually moving and the other classes keep their gait',()=>{
 const p={kind:'warrior',x:100,y:0,walkDistance:0};
 advanceLocomotion(p,0,0);
 assert.equal(p.knightWalkDistance,100);
 const phase=p.knightWalkDistance;
 advanceLocomotion(p,100,0);assert.equal(p.knightWalkDistance,phase);
 p.x=200;advanceLocomotion(p,100,0,true);assert.equal(p.knightWalkDistance,phase);
 const hunter={kind:'hunter',x:10,y:0,walkDistance:0};
 advanceLocomotion(hunter,0,0);assert.equal(hunter.knightWalkDistance,undefined);
});
test('every knight state retains the same new character model',()=>{
 const img={};
 const manifest=JSON.parse(readFileSync(new URL('../assets/knight/atlas.json',import.meta.url),'utf8'));
 const a=Object.create(KnightSpriteAtlas.prototype);
 a.ready=true;a.manifest=manifest;a.images={down:{},up:{},right:{},left:{},walk:img};
 const p={kind:'warrior',hp:100,x:100,y:100,invulnerable:0,direction:dirs.down,moving:false};
 const ctx={calls:[],save(){},restore(){},translate(){},rotate(){},
  drawImage(...args){this.calls.push(args);},imageSmoothingEnabled:false};
 for(const clip of ['idle','walk','attack1','attack2','attack3','special','dash','hurt','death']){
  p.hp=100;p.hurtTimer=0;p.knightAction=null;p.moving=clip==='walk';
  p.knightMoveDirection=dirs.down;p.knightWalkDistance=0;
  if(clip==='hurt')p.hurtTimer=.2;
  else if(clip==='death'){p.hp=0;p.knightDeathElapsed=.4;}
  else if(!['idle','walk'].includes(clip))beginKnightAction(p,clip,.6);
  ctx.calls=[];a.draw(ctx,p,0);
  assert.equal(ctx.calls.length,1,clip);
  assert.strictEqual(ctx.calls[0][0],img,'art switches model in '+clip);
 }
 // If the new atlas is unavailable, the old complete sprites remain usable.
 delete a.images.walk;ctx.calls=[];p.hp=100;p.moving=false;p.knightAction=null;
 a.draw(ctx,p,0);assert.strictEqual(ctx.calls[0][0],a.images.down);
});
