import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {KNIGHT_SHEET_CELL,KNIGHT_SHEET_ANCHOR,KNIGHT_SHEET_FRAMES,knightFinalFrame} from '../src/knight-final.js';
import {KNIGHT_CLIPS,beginKnightAction,advanceKnightAction} from '../src/knight-animation.js';

const base=new URL('../assets/knight/v045/',import.meta.url);
const hash=(data)=>{
 let h=2166136261;
 for(let i=0;i<data.length;i+=4)if(data[i+3]>30){
  h=Math.imul(h^data[i],16777619);
  h=Math.imul(h^data[i+1],16777619);
  h=Math.imul(h^(i>>>2),16777619);
 }
 return h>>>0;
};
test('new original knight atlas contains only full transparent cells with a common floor',async()=>{
 assert.deepEqual(KNIGHT_SHEET_ANCHOR,{x:72,y:118});
 let checked=0;
 for(const [clip,frames] of Object.entries(KNIGHT_SHEET_FRAMES)){
  const png=await readFile(new URL(clip+'.png',base));
  const img=await loadImage(png);
  assert.equal(img.width,144*frames);assert.equal(img.height,144*8);
  const canvas=createCanvas(144,144),ctx=canvas.getContext('2d');
  for(let facing=0;facing<8;facing++){
   const variants=new Set(),feet=new Set();
   for(let f=0;f<frames;f++){
    ctx.clearRect(0,0,144,144);
    ctx.drawImage(img,f*144,facing*144,144,144,0,0,144,144);
    const full=ctx.getImageData(0,0,144,144).data;
    let visible=0,edge=0,sole=0;
    for(let y=0;y<144;y++)for(let x=0;x<144;x++){
     const i=(y*144+x)*4;
     if(full[i+3]>60){
      visible++;
      if(x===0||y===0||x===143||y===143)edge++;
      if(y>=119&&y<=133&&x>=28&&x<=115)sole++;
     }
    }
    assert.ok(visible>=400,clip+' '+facing+' '+f+' nearly invisible');
    assert.equal(edge,0,clip+' '+facing+' '+f+' cut at sprite border');
    assert.ok(sole>=12,clip+' '+facing+' '+f+' has no grounded legs');
    variants.add(hash(full));feet.add(hash(ctx.getImageData(42,108,63,27).data));checked++;
   }
   if(clip==='walk')assert.ok(feet.size>=5,clip+' '+facing+' stationary feet');
   if(clip.startsWith('attack'))assert.ok(variants.size>=5,clip+' '+facing+' has no animated combat');
  }
 }
 assert.equal(checked,8*(6+8+8+8+10));
});
test('new illustrated knight keeps all directions and gameplay hit timings',()=>{
 for(let row=0;row<8;row++)for(const clip of ['idle','walk','attack1','attack2','attack3']){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'warrior',hp:100,direction,moving:clip==='walk',walkDistance:29,knightWalkDistance:29};
  if(clip.startsWith('attack'))p.knightAction={clip,elapsed:clip==='attack1'?.375:.5,duration:1,direction};
  const x=knightFinalFrame(p,.3);
  assert.equal(x.row,row);
  assert.ok(x.index>=0&&x.index<KNIGHT_SHEET_FRAMES[x.clip]);
 }
 for(const clip of ['attack1','attack2','attack3']){
  const p={kind:'warrior',direction:{x:0,y:1}};
  beginKnightAction(p,clip,1);
  let at=null;
  advanceKnightAction(p,1,action=>{at=action.elapsed});
  assert.equal(at,KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames);
 }
});
