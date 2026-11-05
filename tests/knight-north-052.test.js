import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {KNIGHT_NORTH_052,KNIGHT_NORTH_051} from '../src/knight-north-051.js';
import {knightFinalFrame} from '../src/knight-final.js';

const frameCounts={idle:6,walk:8,hurt:6,dash:8,death:8};
const root=new URL('../assets/knight/north-052/',import.meta.url);
const canvas=createCanvas(72,72),g=canvas.getContext('2d');
function sample(image,row,index){
 g.clearRect(0,0,72,72);g.imageSmoothingEnabled=false;
 g.drawImage(image,index*72,row*72,72,72,0,0,72,72);
 const data=g.getImageData(0,0,72,72).data;
 let opaque=0,edge=0,feet=0,hash=2166136261,legsHash=2166136261;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++){
  const i=(y*72+x)*4;
  if(data[i+3]>60){
   opaque++;
   if(x===0||x===71||y===0||y===71)edge++;
   if(x>=20&&x<=55&&y>=51&&y<=65)feet++;
  }
  const n=(data[i]<<16)|(data[i+1]<<8)|data[i+2]|(data[i+3]<<24);
  hash=Math.imul(hash^n,16777619);
  if(y>=45&&y<=65&&x>=20&&x<=55)legsHash=Math.imul(legsHash^n,16777619);
 }
 const alpha=g.getImageData(0,0,72,72).data;
 let top=72,bottom=-1;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++)
  if(alpha[(y*72+x)*4+3]>60){top=Math.min(top,y);bottom=Math.max(bottom,y)}
 return {opaque,edge,feet,hash:hash>>>0,legsHash:legsHash>>>0,top,bottom};
}
test('three upper facings now contain ten complete clip families, but no false global release',()=>{
 assert.strictEqual(KNIGHT_NORTH_052,KNIGHT_NORTH_051);
 assert.equal(KNIGHT_NORTH_052.completeUpperDirections,true);
 assert.equal(KNIGHT_NORTH_052.completeAllDirections,false);
 assert.equal(KNIGHT_NORTH_052.completedCells,228);
 assert.equal(KNIGHT_NORTH_052.framesPerUpperDirection,76);
 assert.equal(KNIGHT_NORTH_052.animatedClips.length,10);
 assert.deepEqual(KNIGHT_NORTH_052.rows,[3,4,5]);
 assert.equal(KNIGHT_NORTH_052.previewScale,.9);
});
test('all 108 new sprites stay inside their cells and keep painted armour and contact feet',async()=>{
 let frames=0;
 for(const [clip,count] of Object.entries(frameCounts)){
  const image=await loadImage(await readFile(new URL(clip+'-up.png',root)));
  assert.equal(image.width,72*count,clip+' wrong atlas width');
  assert.equal(image.height,576,clip+' wrong atlas height');
  for(const row of [3,4,5]){
   const hashes=new Set(),legs=new Set();
   let final=null;
   for(let i=0;i<count;i++){
    const x=sample(image,row,i);
    assert.ok(x.opaque>=450,clip+' row '+row+' frame '+i+' missing armour pixels');
    assert.equal(x.edge,0,clip+' row '+row+' frame '+i+' is cut off');
    assert.ok(x.feet>=10,clip+' row '+row+' frame '+i+' missing planted feet');
    hashes.add(x.hash);legs.add(x.legsHash);final=x;frames++;
   }
   const minimum={idle:4,walk:8,hurt:5,dash:7,death:8}[clip];
   assert.ok(hashes.size>=minimum,clip+' row '+row+' frozen or recycled frames: '+hashes.size);
   if(clip==='walk')assert.equal(legs.size,8,'both greaves are motionless in '+row);
   if(clip==='dash')assert.ok(legs.size>=7,'dash did not push off in '+row);
   if(clip==='idle')assert.equal(legs.size,1,'idle feet are sliding in '+row);
   if(clip==='death')assert.ok(final.top>=33,'death does not fall to the ground in '+row);
  }
 }
 assert.equal(frames,108);
});
test('new motion art is actually loaded only in the optional north preview',async()=>{
 const source=await readFile(new URL('../src/knight-final.js',import.meta.url),'utf8');
 const importer=await readFile(new URL('../src/knight-north-051.js',import.meta.url),'utf8');
 assert.match(source,/has\('previewKnightUp'\)/);
 assert.match(source,/createKnightRebornSheets\(factory\)/);
 assert.match(importer,/north-052/);
 assert.match(importer,/newMotion\.has\(key\)/);
 assert.match(importer,/loadKnightNorthReviewSheets/);
 const generator=await readFile(new URL('../tools/generate-knight-north-motion-052.py',import.meta.url),'utf8');
 assert.match(generator,/def split_layers/);
 assert.match(generator,/def death_pose/);
});

test('long standing and distance-based walking continue looping rather than freezing',()=>{
 const knight={kind:'warrior',hp:100,hurtTimer:0,direction:{x:0,y:-1},moving:false};
 const idle=new Set([2,2.3,2.6,2.9,3.2,3.5].map(t=>knightFinalFrame(knight,t).index));
 assert.ok(idle.size>=4,'idle stops breathing after first clock cycle');
 knight.moving=true;
 knight.knightMoveDirection={x:0,y:-1};
 const walk=new Set();
 for(let step=0;step<16;step++){
  knight.knightWalkDistance=step*12;
  const pose=knightFinalFrame(knight,5);
  assert.equal(pose.row,4);
  walk.add(pose.index);
 }
 assert.equal(walk.size,8,'gait must keep alternating both feet after the first stride');
});
