import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KnightIllustratedAtlas,KNIGHT_PIXEL_ANCHOR} from '../src/knight-painted.js';
import {knightIntegratedPose,KNIGHT_INTEGRATED_ATTACKS,KNIGHT_INTEGRATED_WALK} from '../src/knight-integrated.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

async function atlas(){
 const a=new KnightIllustratedAtlas();
 a.canvasFactory=(w,h)=>createCanvas(w,h);
 a.image=await loadImage(await readFile(new URL('../assets/knight/painted-041.png',import.meta.url)));
 a.imageReady=true;a.frames.clear();
 return a;
}
function hash(data){
 let h=2166136261;
 for(let i=0;i<data.length;i+=4)if(data[i+3]>50){
  h=Math.imul(h^data[i],16777619);
  h=Math.imul(h^data[i+1],16777619);
  h=Math.imul(h^(i>>>2),16777619);
 }
 return h>>>0;
}
test('knight feet, shins, pelvis and sword grip share a coherent 8-view pose',()=>{
 const clips=['idle','walk','attack1','attack2','attack3','special','hurt','dash'];
 for(let row=0;row<8;row++)for(const clip of clips)for(let frame=0;frame<8;frame++){
  const p=knightIntegratedPose(row,clip,frame);
  assert.equal(p.feet.length,2);
  assert.ok(p.feet[0].x<p.feet[1].x,'crossed boots in '+row+' '+clip+' '+frame);
  assert.ok(p.feet.some(f=>f.y===5),'missing planted sole in '+row+' '+clip+' '+frame);
  assert.ok(p.feet.every(f=>f.y<=5&&f.y>=0),'boot sinks below floor in '+row+' '+clip+' '+frame);
  assert.strictEqual(p.hand,p.blade.grip,'grip detached from gauntlet');
  const toShoulder=Math.hypot(p.shoulder.x-p.elbow.x,p.shoulder.y-p.elbow.y);
  const toHand=Math.hypot(p.elbow.x-p.hand.x,p.elbow.y-p.hand.y);
  assert.ok(toShoulder<=27&&toHand<=27,'broken sword arm '+row+' '+clip+' '+frame);
  assert.ok(Math.abs(Math.hypot(p.blade.tip.x-p.hand.x,p.blade.tip.y-p.hand.y)-32)<1e-7);
 }
});
test('both boots alternate through eight genuine gait phases; torso and hip advance in the same cycle',()=>{
 assert.equal(KNIGHT_INTEGRATED_WALK.length,8);
 for(let row=0;row<8;row++){
  const p=Array.from({length:8},(_,i)=>knightIntegratedPose(row,'walk',i));
  const left=new Set(p.map(x=>x.feet[0].x+':'+x.feet[0].y));
  const right=new Set(p.map(x=>x.feet[1].x+':'+x.feet[1].y));
  assert.ok(left.size>=5&&right.size>=5,'the sprite has frozen feet');
  assert.ok(p.some(x=>x.feet[0].y<=1)&&p.some(x=>x.feet[1].y<=1),'both legs must swing');
  assert.ok(new Set(p.map(x=>x.bodyX+':'+x.bodyY)).size>=3,'upper body misses gait');
 }
});
test('three distinct grounded sword combos line up with existing game hit timestamps',()=>{
 for(const clip of ['attack1','attack2','attack3']){
  const spec=KNIGHT_CLIPS[clip];
  assert.equal(KNIGHT_INTEGRATED_ATTACKS[clip].length,8);
  for(let row=0;row<8;row++){
   const h=knightIntegratedPose(row,clip,spec.hitFrame);
   assert.ok(h.impact,clip+' missed its frame-'+spec.hitFrame+' impact');
   const path=Array.from({length:8},(_,frame)=>knightIntegratedPose(row,clip,frame));
   assert.ok(new Set(path.map(x=>Math.round(x.hand.x)+':'+Math.round(x.hand.y))).size>=5);
   assert.ok(new Set(path.map(x=>x.blade.angle.toFixed(3))).size>=6);
  }
 }
});
test('illustrated production frames have no missing character, cropped sword or frozen walk',async()=>{
 const a=await atlas();
 let count=0;
 for(let row=0;row<8;row++){
  for(const clip of ['idle','walk','attack1','attack2','attack3']){
   const hashes=new Set();
   for(let frame=0;frame<8;frame++){
    const tile=a.frame(row,clip,frame),g=tile.getContext('2d');
    const pixels=g.getImageData(0,0,128,128).data;
    const ground=g.getImageData(47,KNIGHT_PIXEL_ANCHOR.y-3,34,11).data;
    let sole=0,total=0;
    for(let i=3;i<ground.length;i+=4)if(ground[i]>90)sole++;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>90)total++;
    assert.ok(total>180,'full knight invisible '+row+' '+clip+' '+frame);
    assert.ok(sole>=12,'leg/sole detached from floor '+row+' '+clip+' '+frame);
    hashes.add(hash(pixels));count++;
   }
   if(clip!=='idle')assert.ok(hashes.size>=6,'no visible '+clip+' motion in view '+row);
  }
 }
 assert.equal(count,320);
});
