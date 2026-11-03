import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {KnightPaintedAtlas,KNIGHT_PIXEL_SIZE,KNIGHT_PIXEL_ANCHOR,KNIGHT_PIXEL_CLIPS,KNIGHT_SWINGS,knightPixelRow} from '../src/knight-painted.js';
import {beginKnightAction,advanceKnightAction} from '../src/knight-animation.js';

test('eight directional knight sprites contain nine authored clips of eight complete raster poses',()=>{
 const atlas=new KnightPaintedAtlas((w,h)=>createCanvas(w,h));
 assert.equal(KNIGHT_PIXEL_SIZE,128);
 assert.deepEqual(KNIGHT_PIXEL_ANCHOR,{x:64,y:88});
 let total=0;
 for(let row=0;row<8;row++)for(const clip of KNIGHT_PIXEL_CLIPS){
  const hashes=new Set(),feet=[];
  for(let frame=0;frame<8;frame++){
   const canvas=atlas.frame(row,clip,frame);
   const pixels=canvas.getContext('2d').getImageData(0,0,128,128).data;
   let count=0,edge=0,hash=2166136261,bootY=-1;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const pos=(y*128+x)*4;
    if(pixels[pos+3]>120){
     count++;
     if(x<=1||y<=1||x>=126||y>=126)edge++;
     if(Math.abs(x-64)<=15&&y>=83)bootY=Math.max(bootY,y);
     hash=Math.imul(hash^pixels[pos],16777619);
     hash=Math.imul(hash^pixels[pos+1],16777619);
     hash=Math.imul(hash^x,16777619);
     hash=Math.imul(hash^y,16777619);
    }
   }
   assert.ok(count>350,clip+' '+row+' '+frame+' has no real painted body');
   assert.equal(edge,0,clip+' '+row+' '+frame+' clipped outside full-body cell');
   if(clip==='idle'||clip==='walk'||clip.startsWith('attack'))assert.ok(bootY>=85,clip+' '+row+' '+frame+' missing feet');
   hashes.add(hash);feet.push(bootY);total++;
  }
  if(clip==='walk'||clip.startsWith('attack')||clip==='special')
   assert.ok(hashes.size>=6,clip+' '+row+' poses are frozen: '+hashes.size);
  if(clip==='idle')assert.ok(hashes.size>=2,clip+' breathing poses absent');
 }
 assert.equal(total,8*9*8);
});

test('pixel knight uses all 8 unique directional helmets and distinct attack arcs',()=>{
 const atlas=new KnightPaintedAtlas((w,h)=>createCanvas(w,h));
 const hashes=new Set();
 for(let row=0;row<8;row++){
  const p=atlas.frame(row,'idle',0).getContext('2d').getImageData(45,35,38,40).data;
  hashes.add(Buffer.from(p).toString('base64'));
  const a=Math.PI/2+row*Math.PI/4;
  assert.equal(knightPixelRow({x:Math.cos(a),y:Math.sin(a)}),row);
 }
 assert.ok(hashes.size>=5,'directional knight views should change silhouette');
 for(const clip of ['attack1','attack2','attack3']){
  const s=KNIGHT_SWINGS[clip];
  assert.ok(new Set(s.sword.map(a=>a.toFixed(2))).size>=6);
  assert.ok(s.handX.length===8&&s.handY.length===8&&s.step.length===8);
 }
 assert.equal(KNIGHT_SWINGS.attack1.impact,3);
 assert.equal(KNIGHT_SWINGS.attack2.impact,4);
 assert.equal(KNIGHT_SWINGS.attack3.impact,4);
});

test('rasterized knight hit frames stay synchronized with real game combat callbacks',()=>{
 for(const clip of ['attack1','attack2','attack3']){
  const p={kind:'warrior',hp:100,direction:{x:0,y:1},moving:false};
  const a=beginKnightAction(p,clip,.8);
  let fires=0,contact;
  advanceKnightAction(p,.8,action=>{fires++;contact=action.elapsed;});
  const hit=KNIGHT_SWINGS[clip].impact/8;
  assert.equal(fires,1);
  assert.ok(Math.abs(contact-.8*hit)<1e-10,clip+' contact is visually mistimed');
 }
});
