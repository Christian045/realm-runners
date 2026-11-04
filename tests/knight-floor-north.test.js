import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {
 KnightIllustratedAtlas,KNIGHT_SOURCE_FOOT_Y,KNIGHT_GROUND_OFFSET,
 KNIGHT_REAR_ATTACK_ANGLES,KNIGHT_PIXEL_ANCHOR,knightFramePlacement,knightSourceCenterCorrection
} from '../src/knight-painted.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

async function illustrated(){
 const atlas=new KnightIllustratedAtlas();
 atlas.canvasFactory=(w,h)=>createCanvas(w,h);
 atlas.image=await loadImage(await readFile(new URL('../assets/knight/painted-041.png',import.meta.url)));
 atlas.imageReady=true;atlas.frames.clear();
 return atlas;
}
function signature(canvas,rect=null){
 const c=canvas.getContext('2d');
 const {data}=rect?c.getImageData(...rect):c.getImageData(0,0,128,128);
 let sum=2166136261;
 for(let i=0;i<data.length;i+=4)if(data[i+3]>80){
  sum=Math.imul(sum^data[i],16777619);
  sum=Math.imul(sum^data[i+1],16777619);
  sum=Math.imul(sum^data[i+2],16777619);
  sum=Math.imul(sum^(i>>>2),16777619);
 }
 return sum>>>0;
}
test('all source boot lines are placed on one stable world ground baseline',()=>{
 assert.equal(KNIGHT_GROUND_OFFSET,5);
 for(let row=0;row<KNIGHT_SOURCE_FOOT_Y.length;row++)for(let col=0;col<8;col++){
  const p=knightFramePlacement(row,col);
  assert.equal(p.y+KNIGHT_SOURCE_FOOT_Y[row][col],5);
  assert.equal(p.x,-48);
 }
});
test('lateral pose corrections center attacks without moving their planted feet',()=>{
 assert.equal(knightSourceCenterCorrection(2,3),12);
 assert.equal(knightSourceCenterCorrection(2,3,true),-12);
 assert.equal(knightSourceCenterCorrection(1,0),5);
 assert.equal(knightSourceCenterCorrection(1,7),-6);
 assert.equal(knightSourceCenterCorrection(0,0),0);
});
test('illustrated knight retains visible boots with fixed floor contact in every facing and attack frame',async()=>{
 const atlas=await illustrated();
 const clips=['idle','walk','attack1','attack2','attack3'];
 let total=0;
 for(let row=0;row<8;row++)for(const clip of clips)for(let frame=0;frame<8;frame++){
  const canvas=atlas.frame(row,clip,frame),ctx=canvas.getContext('2d');
  const data=ctx.getImageData(39,KNIGHT_PIXEL_ANCHOR.y-4,51,12).data;
  let planted=0;
  for(let i=3;i<data.length;i+=4)if(data[i]>96)planted++;
  assert.ok(planted>=3,clip+' row '+row+' frame '+frame+' does not touch painted boot baseline');
  const full=ctx.getImageData(0,0,128,128).data;
  let visible=0;
  for(let i=3;i<full.length;i+=4)if(full[i]>96)visible++;
  assert.ok(visible>=100,clip+' row '+row+' frame '+frame+' is invisible');
  total++;
 }
 assert.equal(total,320);
});
test('north, northeast and northwest have eight distinct rear sword and shoulder poses for each combo',async()=>{
 const atlas=await illustrated();
 for(const row of [3,4,5]){
  const idle=signature(atlas.frame(row,'idle',0));
  for(const clip of ['attack1','attack2','attack3']){
   const poses=new Set();
   const handRegion=new Set();
   for(let frame=0;frame<8;frame++){
    const img=atlas.frame(row,clip,frame);
    const hash=signature(img),hand=signature(img,[63,39,40,43]);
    poses.add(hash);handRegion.add(hand);
   }
   assert.ok(poses.size>=7,'rear '+row+' '+clip+' animation uses a frozen body or sword');
   assert.ok(handRegion.size>=6,'rear '+row+' '+clip+' shoulder/gauntlet does not animate');
   assert.notEqual(signature(atlas.frame(row,clip,KNIGHT_CLIPS[clip].hitFrame)),idle,'northward attack matches idle');
   assert.equal(KNIGHT_REAR_ATTACK_ANGLES[clip].length,8);
  }
 }
});
