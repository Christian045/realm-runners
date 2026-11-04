import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KNIGHT_SHEET_CELL,KNIGHT_SHEET_FRAMES,KNIGHT_SHEET_ANCHOR,knightFinalFrame,prepareKnightWalkSheet} from '../src/knight-final.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

const root=new URL('../assets/knight/v045/',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('poses.json',root),'utf8'));
const near=(a,b,epsilon=1)=>Math.abs(a-b)<=epsilon;
test('the V045 full-body knight atlas shares one eight-direction design and planted sole',async()=>{
 assert.equal(metadata.version,45);
 assert.equal(metadata.cell,144);
 assert.equal(metadata.ground,123);
 assert.deepEqual(KNIGHT_SHEET_ANCHOR,{x:72,y:118});
 assert.deepEqual(metadata.directions,['S','SW','W','NW','N','NE','E','SE']);
 for(const [clip,count] of Object.entries(KNIGHT_SHEET_FRAMES)){
  assert.equal(metadata.frames[clip].length,8);
  const image=await loadImage(await readFile(new URL(clip+'.png',root)));
  assert.equal(image.width,count*144);assert.equal(image.height,8*144);
  const canvas=createCanvas(144,144),g=canvas.getContext('2d');
  for(let row=0;row<8;row++){
   assert.equal(metadata.frames[clip][row].length,count);
   let contacts=0;
   for(let frame=0;frame<count;frame++){
    g.clearRect(0,0,144,144);g.drawImage(image,frame*144,row*144,144,144,0,0,144,144);
    const pixels=g.getImageData(0,0,144,144).data;
    let painted=0,soles=0,edges=0;
    for(let y=0;y<144;y++)for(let x=0;x<144;x++){
     const alpha=pixels[(y*144+x)*4+3];
     if(alpha>80){
      painted++;
      if(y===0||x===0||x===143||y===143)edges++;
      if(y>=119&&y<=126&&x>=35&&x<=111)soles++;
     }
    }
    assert.ok(painted>=350,clip+' '+row+' '+frame+' incomplete body');
    assert.equal(edges,0,clip+' '+row+' '+frame+' clipped sword/body');
    assert.ok(soles>=8,clip+' '+row+' '+frame+' missing boots');
    contacts++;
   }
   assert.equal(contacts,count);
  }
 }
});
test('sword and gauntlet share one pixel position; no detached giant blade',()=>{
 for(const clip of ['attack1','attack2','attack3']){
  for(let row=0;row<8;row++){
   const poses=metadata.frames[clip][row],wristPositions=new Set();
   for(let frame=0;frame<poses.length;frame++){
    const p=poses[frame];
    assert.deepEqual(p.grip,p.hand,clip+' '+row+' '+frame+' floating hilt');
    assert.ok(Math.hypot(p.hand[0]-p.shoulder[0],p.hand[1]-p.shoulder[1])<=19,
      clip+' '+row+' '+frame+' separated forearm');
    assert.ok(near(Math.hypot(p.tip[0]-p.grip[0],p.tip[1]-p.grip[1]),30,2),
      clip+' '+row+' '+frame+' oversized sword or detached blade');
    wristPositions.add(p.hand.join(':'));
   }
   assert.ok(wristPositions.size>=4,clip+' '+row+' wrist lacks animation');
  }
 }
});
test('knight finisher impact frame uses existing combat trigger for every direction',()=>{
 const frameAt=(clip,row)=>{
  const c=KNIGHT_CLIPS[clip],elapsed=c.hitFrame/c.frames,angle=Math.PI/2+row*Math.PI/4;
  const direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'warrior',hp:100,direction,knightAction:{clip,duration:1,elapsed,direction}};
  return knightFinalFrame(p,0);
 };
 for(let row=0;row<8;row++){
  assert.equal(frameAt('attack1',row).index,3);
  assert.equal(frameAt('attack2',row).index,4);
  assert.equal(frameAt('attack3',row).index,5);
 }
});

test('walk frames normalize the oversized stance change without clipping or losing boots',async()=>{
 const original=await loadImage(await readFile(new URL('walk.png',root)));
 const result=prepareKnightWalkSheet(original,()=>createCanvas(1,1));
 assert.equal(result.width,144*8);assert.equal(result.height,144*8);
 const sample=(sheet,row,frame)=>{
  const canvas=createCanvas(144,144),ctx=canvas.getContext('2d');
  ctx.drawImage(sheet,frame*144,row*144,144,144,0,0,144,144);
  const pixels=ctx.getImageData(0,0,144,144).data;
  let top=144,bottom=-1,edges=0,boots=0;
  for(let y=0;y<144;y++)for(let x=0;x<144;x++){
   const a=pixels[(y*144+x)*4+3];
   if(a<70)continue;
   top=Math.min(y,top);bottom=Math.max(y,bottom);
   if(x===0||x===143||y===0||y===143)edges++;
   if(y>=116&&y<=130&&x>=35&&x<=110)boots++;
  }
  return {height:bottom-top+1,edges,boots};
 };
 for(let row=0;row<8;row++){
  const old=sample(original,row,0),fixed=sample(result,row,0);
  const samples=Array.from({length:7},(_,i)=>sample(result,row,i+1));
  const median=samples.map(p=>p.height).sort((a,b)=>a-b)[3];
  assert.ok(fixed.height>=old.height,row+' lost pixels from the first frame');
  assert.ok(fixed.height>=median*.75,row+' initial stance still shrinks abruptly');
  assert.equal(fixed.edges,0,row+' enlarged sprite clipped');
  assert.ok(fixed.boots>=5,row+' boot pixels lost');
 }
});
