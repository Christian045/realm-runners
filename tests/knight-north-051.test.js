import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KNIGHT_NORTH_051,knightNorth051DirectionRow,knightNorth051Impact} from '../src/knight-north-051.js';

const base=new URL('../assets/knight/north-051/',import.meta.url);
const clips={attack1:8,attack2:8,attack3:10,special:8,recovery:6};
function snapshot(image,f,row){
 const c=createCanvas(72,72),ctx=c.getContext('2d');
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,72*f,72*row,72,72,0,0,72,72);
 const a=ctx.getImageData(0,0,72,72).data;
 let n=0,edge=0,boots=0,hash=2166136261;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++){
  const i=(y*72+x)*4;
  if(a[i+3]>65){
   n++;
   if(x===0||y===0||x===71||y===71)edge++;
   if(y>=55&&y<=61&&x>=22&&x<=50)boots++;
   hash=Math.imul(hash^(a[i]+7*a[i+1]+13*a[i+2]+31*x+59*y),16777619);
  }
 }
 return {n,edge,boots,hash:hash>>>0};
}
test('0.51 sprites contain full transparent North/NW/NE attack cells, not placeholders',async()=>{
 assert.equal(KNIGHT_NORTH_051.completeAllDirections,false);
 assert.deepEqual(KNIGHT_NORTH_051.rows,[3,4,5]);
 let checked=0;
 for(const [clip,frames] of Object.entries(clips)){
  const image=await loadImage(await readFile(new URL(clip+'-up.png',base)));
  assert.equal(image.width,frames*72);
  assert.equal(image.height,576);
  for(const row of [3,4,5]){
   const hashes=new Set();
   for(let f=0;f<frames;f++){
    const s=snapshot(image,f,row);
    assert.ok(s.n>580,clip+' row '+row+' frame '+f+' incomplete');
    assert.equal(s.edge,0,clip+' row '+row+' frame '+f+' clipped');
    assert.ok(s.boots>=10,clip+' row '+row+' frame '+f+' missing grounded feet');
    hashes.add(s.hash);checked++;
   }
   assert.ok(hashes.size>=frames-1,clip+' row '+row+' has frozen attack poses');
  }
 }
 assert.equal(checked,3*(8+8+10+8+6));
});
test('direction portraits actually differ for eight facings',async()=>{
 const im=await loadImage(await readFile(new URL('facings-v051.png',base)));
 assert.equal(im.width,576);
 assert.equal(im.height,72);
 const hashes=new Set();
 for(let row=0;row<8;row++){
  const c=createCanvas(72,72),ctx=c.getContext('2d');
  ctx.drawImage(im,row*72,0,72,72,0,0,72,72);
  const data=ctx.getImageData(0,0,72,72).data;
  const count=data.filter((v,i)=>i%4===3&&v>65).length;
  assert.ok(count>=500,'empty direction '+row);
  let h=0;
  for(let i=0;i<data.length;i++)h=Math.imul(h^data[i],16777619);
  hashes.add(h>>>0);
 }
 assert.equal(hashes.size,8);
});
test('all northern sword sparks follow visible forward sword tips, preserving hit clocks',()=>{
 const player={x:100,y:200};
 const aims=[
  [{x:-1,y:-1},3], [{x:0,y:-1},4], [{x:1,y:-1},5]
 ];
 const hits={attack1:3,attack2:4,attack3:5,special:3};
 for(const [direction,row] of aims){
  assert.equal(knightNorth051DirectionRow(direction),row);
  for(const [clip,frame] of Object.entries(hits)){
   const actual=knightNorth051Impact(player,direction,clip,true);
   assert.ok(actual);
   assert.equal(actual.row,row);
   assert.equal(actual.clip,clip);
   assert.ok(actual.y<player.y-60,clip+' '+row+' sword impact is not up');
   assert.ok(Math.abs(actual.x-player.x)<70,clip+' '+row+' tip is detached');
   assert.equal(knightNorth051Impact(player,direction,clip,false),null);
   assert.ok(frame>=3&&frame<=5);
  }
 }
 assert.equal(knightNorth051Impact(player,{x:0,y:1},'attack1',true),null);
});
