import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawRobedWalk,ROBED_WALK_ROWS,ROBED_WALK_STRIDE,robedWalkFrame,isRobedWalker} from '../src/robed-walk.js';
import {HeroSpriteAtlas} from '../src/hero-sprites.js';
import {advanceLocomotion} from '../src/locomotion.js';
import {heroPose,beginHeroAction} from '../src/hero-animation.js';
const directions={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
for(const kind of ['mage','summoner']){
 test(kind+' uses valid 768×384 transparent 32-frame walking sheet',()=>{
  const b=readFileSync(new URL('../assets/heroes/'+kind+'/walk-v035.png',import.meta.url));
  assert.equal(b.subarray(1,4).toString(),'PNG');
  assert.equal(b.readUInt32BE(16),768);assert.equal(b.readUInt32BE(20),384);
  assert.ok(b.length>40000);
 });
 test(kind+' draws all 32 whole-body walk frames with a stable ground root',()=>{
  const image={},seen=new Set();
  for(const [face,d] of Object.entries(directions))for(let i=0;i<8;i++){
   const actor={kind,hp:100,x:120,y:110,moving:true,direction:d,
    heroMoveDirection:d,robedWalkDistance:ROBED_WALK_STRIDE*i/8};
   const pose=heroPose(actor),calls=[],ctx={drawImage(...a){calls.push(a);}};
   assert.equal(pose.clip,'walk');
   assert.equal(robedWalkFrame(actor),i);
   assert.equal(drawRobedWalk(ctx,actor,pose,image),true);
   assert.strictEqual(calls[0][0],image);
   assert.deepEqual(calls[0].slice(1,5),[i*96,ROBED_WALK_ROWS[face]*96,96,96]);
   assert.equal(calls[0][5],72);assert.ok(Math.abs(calls[0][6]-31)<=3);
   seen.add(calls[0][1]+':'+calls[0][2]);
  }
  assert.equal(seen.size,32);
 });
 test(kind+' uses the new full-body model for all action clips',()=>{
  const source=JSON.parse(readFileSync(new URL('../assets/heroes/'+kind+'/atlas.json',import.meta.url),'utf8'));
  const image={},atlas=Object.create(HeroSpriteAtlas.prototype);
  atlas.ready=true;atlas.kind=kind;atlas.manifest={...source,aimRig:null};
  atlas.images={down:{},right:{},up:{},left:{},walk:image};
  const p={kind,x:120,y:110,hp:100,moving:false,direction:directions.down,invulnerable:0};
  const ctx={calls:[],save(){},restore(){},drawImage(...a){this.calls.push(a);},imageSmoothingEnabled:false};
  assert.ok(atlas.draw(ctx,p,0));assert.strictEqual(ctx.calls[0][0],image);
  ctx.calls=[];p.moving=true;p.heroMoveDirection=directions.down;p.robedWalkDistance=0;
  assert.ok(atlas.draw(ctx,p,0));assert.strictEqual(ctx.calls[0][0],image);
  ctx.calls=[];beginHeroAction(p,'attack',.6);
  assert.ok(atlas.draw(ctx,p,0));assert.strictEqual(ctx.calls[0][0],image);
  for(const clip of ['attack','special','dash','hurt','death']){
   const drawn=[];
   const canvas={save(){},restore(){},translate(){},rotate(){},
    drawImage(...args){drawn.push(args);}};
   assert.equal(drawRobedWalk(canvas,p,{face:'down',frame:0,clip,progress:.4},image),true);
   assert.equal(drawn.length,1);
   assert.strictEqual(drawn[0][0],image,clip+' swapped character art');
  }
 });
}
test('robed gait advances only on actual movement, and does not affect other classes',()=>{
 for(const kind of ['mage','summoner']){
  const p={kind,x:100,y:0,walkDistance:0};
  advanceLocomotion(p,0,0);assert.equal(p.robedWalkDistance,100);
  const previous=p.robedWalkDistance;
  advanceLocomotion(p,100,0);assert.equal(p.robedWalkDistance,previous);
  p.x=140;advanceLocomotion(p,100,0,true);assert.equal(p.robedWalkDistance,previous);
 }
 for(const kind of ['warrior','hunter','glasscannon','alchemist']){
  const p={kind,x:50,y:0,walkDistance:0};advanceLocomotion(p,0,0);
  assert.equal(p.robedWalkDistance,undefined);
 }
 assert.equal(isRobedWalker('mage'),true);assert.equal(isRobedWalker('summoner'),true);
 assert.equal(isRobedWalker('hunter'),false);
});
