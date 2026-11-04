import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KNIGHT_PAINTED_050,KNIGHT_SHEET_ANCHOR,knightFinalFrame} from '../src/knight-final.js';

const clips={idle:6,walk:8,attack1:8,attack2:8,attack3:10,recovery:6,special:8,dash:6,hurt:5,death:8};
const folder=new URL('../assets/knight/painted-050/',import.meta.url);
const tile=createCanvas(72,72),ctx=tile.getContext('2d');
function visible(image,frame){
 ctx.clearRect(0,0,72,72);
 ctx.drawImage(image,frame*72,0,72,72,0,0,72,72);
 const data=ctx.getImageData(0,0,72,72).data;
 let count=0;
 for(let i=3;i<data.length;i+=4)if(data[i]>60)count++;
 return count;
}
test('illustrated PNG pipeline contains 73 real south animation poses',async()=>{
 assert.equal(KNIGHT_PAINTED_050.southFrames,73);
 assert.deepEqual(KNIGHT_SHEET_ANCHOR,{x:72,y:118});
 let count=0;
 for(const [clip,frames] of Object.entries(clips)){
  const image=await loadImage(await readFile(new URL(clip+'.png',folder)));
  assert.equal(image.width,72*frames,clip+' wrong width');
  assert.equal(image.height,72,clip+' wrong height');
  for(let frame=0;frame<frames;frame++){
   assert.ok(visible(image,frame)>=300,clip+' '+frame+' missing artwork');
   count++;
  }
 }
 assert.equal(count,73);
});
test('eight actual orientation portraits are individually visible and distinct',async()=>{
 const image=await loadImage(await readFile(new URL('facings.png',folder)));
 assert.equal(image.width,576);assert.equal(image.height,72);
 const hashes=new Set();
 for(let row=0;row<8;row++){
  assert.ok(visible(image,row)>600,'direction '+row+' missing');
  ctx.clearRect(0,0,72,72);
  ctx.drawImage(image,row*72,0,72,72,0,0,72,72);
  const data=ctx.getImageData(0,0,72,72).data;
  let hash=2166136261;
  for(let i=0;i<data.length;i+=16)hash=Math.imul(hash^data[i]^data[i+3],16777619);
  hashes.add(hash>>>0);
 }
 assert.equal(hashes.size,8);
});
test('production sprite renderer uses PNGs and maintains the gameplay clock contract',async()=>{
 const source=await readFile(new URL('../src/knight-final.js',import.meta.url),'utf8');
 assert.match(source,/loadPaintedKnightSheets\(factory\)/);
 assert.match(source,/assets\/knight\/painted-050/);
 assert.match(source,/new Image\(/);
 assert.deepEqual(KNIGHT_PAINTED_050.fullyAnimatedFacings,['S']);
 assert.equal(KNIGHT_PAINTED_050.incompleteFacings.length,7);
 const p={hp:100,moving:false,direction:{x:0,y:1},kind:'warrior',
  knightAction:{clip:'attack1',elapsed:3/8,duration:1,direction:{x:0,y:1}}};
 const frame=knightFinalFrame(p,0);
 assert.equal(frame.row,0);
 assert.equal(frame.index,3);
});
