import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {
 createKnightRebornSheets,knightRebornPose,KNIGHT_REBORN_FRAME_COUNTS,
 KNIGHT_REBORN_HITS
} from '../src/knight-reborn.js';
import {KNIGHT_SHEET_ANCHOR,knightFinalFrame} from '../src/knight-final.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

const count=Object.values(KNIGHT_REBORN_FRAME_COUNTS).reduce((n,x)=>n+x,0);
const atlas=createKnightRebornSheets(()=>createCanvas(1,1));
const tile=createCanvas(144,144),ctx=tile.getContext('2d');
function pixels(clip,row,frame){
 ctx.clearRect(0,0,144,144);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(atlas[clip],frame*72,row*72,72,72,0,0,144,144);
 return ctx.getImageData(0,0,144,144).data;
}
const opaque=(data,x,y)=>data[(Math.floor(y)*144+Math.floor(x))*4+3]||0;
const near=(data,x,y,r=4)=>{
 for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)
  if(x+a>=0&&x+a<144&&y+b>=0&&y+b<144&&opaque(data,x+a,y+b)>70)return true;
 return false;
};
test('all nine knight states are freshly redrawn in eight directions, not sourced from old PNGs',async()=>{
 assert.equal(count,70);
 assert.equal(KNIGHT_SHEET_ANCHOR.x,72);
 assert.equal(KNIGHT_SHEET_ANCHOR.y,118);
 const source=await readFile(new URL('../src/knight-final.js',import.meta.url),'utf8');
 assert.match(source,/createKnightRebornSheets/);
 assert.doesNotMatch(source,/assets\/knight\/v045/);
 for(const [clip,frames] of Object.entries(KNIGHT_REBORN_FRAME_COUNTS)){
  assert.equal(atlas[clip].width,72*frames);
  assert.equal(atlas[clip].height,576);
 }
});
test('all 560 fully drawn cells retain helmet, armor and boots with transparent margins',()=>{
 let checked=0;
 for(const [clip,frames] of Object.entries(KNIGHT_REBORN_FRAME_COUNTS))
  for(let row=0;row<8;row++)for(let f=0;f<frames;f++){
   const data=pixels(clip,row,f);
   let colored=0,edge=0,boots=0;
   for(let y=0;y<144;y++)for(let x=0;x<144;x++){
    const alpha=opaque(data,x,y);
    if(alpha>65){
     colored++;
     if(y===0||x===0||y===143||x===143)edge++;
     if(y>=115&&y<=125&&x>=20&&x<=124)boots++;
    }
   }
   assert.ok(colored>=520,clip+' row '+row+' frame '+f+' nearly empty');
   if(clip!=='death')assert.equal(edge,0,clip+' row '+row+' frame '+f+' clipped');
   if(clip!=='death')assert.ok(boots>=12,clip+' row '+row+' frame '+f+' ungrounded');
   checked++;
  }
 assert.equal(checked,560);
});
test('gait alternates both armored boots in every eight-way direction',()=>{
 for(let row=0;row<8;row++){
  const left=new Set(),right=new Set(),head=new Set();
  for(let f=0;f<8;f++){
   const p=knightRebornPose(row,'walk',f);
   left.add(p.legs[0].footX+':'+p.legs[0].footY);
   right.add(p.legs[1].footX+':'+p.legs[1].footY);
   head.add(p.torsoY);
   assert.ok(p.legs.every(l=>l.footY>=56&&l.footY<=60));
  }
  assert.ok(left.size>=5&&right.size>=5,'leg animation frozen in row '+row);
  assert.ok(head.size>=2,'head lacks subtle bob in row '+row);
 }
});
test('the single hand-gripped sword stays connected on every attack frame and hit event',()=>{
 for(const clip of ['attack1','attack2','attack3']){
  const angles=new Set();
  for(let row=0;row<8;row++)for(let f=0;f<KNIGHT_REBORN_FRAME_COUNTS[clip];f++){
   const p=knightRebornPose(row,clip,f),data=pixels(clip,row,f);
   assert.ok(Math.hypot(p.hand.x-p.shoulder.x,p.hand.y-p.shoulder.y)<25,'separated weapon arm');
   assert.ok(near(data,p.hand.x*2,p.hand.y*2),'floating grip');
   const tipX=(p.hand.x+Math.cos(p.angle)*22)*2;
   const tipY=(p.hand.y+Math.sin(p.angle)*22)*2;
   assert.ok(near(data,tipX,tipY,5),clip+' sword tip missing in direction '+row+' frame '+f);
   assert.equal(p.contact,f===KNIGHT_REBORN_HITS[clip]);
   if(row===0)angles.add(Math.round(p.angle*100));
  }
  assert.ok(angles.size>=6,'attack does not really swing: '+clip);
  assert.equal(Math.floor(KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames*
   KNIGHT_REBORN_FRAME_COUNTS[clip]),KNIGHT_REBORN_HITS[clip]);
 }
});
test('the five production combat clocks select correctly corresponding authored frames',()=>{
 const angleFor=row=>Math.PI/2+row*Math.PI/4;
 for(let row=0;row<8;row++){
  const direction={x:Math.cos(angleFor(row)),y:Math.sin(angleFor(row))};
  for(const clip of ['attack1','attack2','attack3']){
   const p={kind:'warrior',hp:100,direction,knightAction:{
    clip,direction,duration:1,elapsed:KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames
   }};
   const sampled=knightFinalFrame(p,0);
   assert.equal(sampled.row,row);
   assert.equal(sampled.index,KNIGHT_REBORN_HITS[clip]);
  }
 }
});

test('every one of the eight views is a genuinely different authored silhouette',()=>{
 const hashes=new Set();
 for(let row=0;row<8;row++){
  const d=pixels('idle',row,0),hash=Array.from({length:144*144},(_,n)=>n*4)
   .reduce((h,i)=>Math.imul(h^d[i],16777619)^d[i+3],2166136261)>>>0;
  hashes.add(hash);
 }
 assert.equal(hashes.size,8,'different directions accidentally reuse the same front/back portrait');
});

// CI art acceptance gallery: the image is emitted only in Actions, not in the
// game or developer console. It lets visual review check actual rendered
// gameplay frames (not an unrelated mock-up).
if(process.env.GITHUB_ACTIONS==='true'){
 const sheet=createCanvas(576,360),g=sheet.getContext('2d');
 g.imageSmoothingEnabled=false;
 const samples=[['idle',0],['walk',2],['attack1',3],['attack2',4],['attack3',5]];
 for(let i=0;i<samples.length;i++)for(let row=0;row<8;row++){
  const [clip,f]=samples[i];
  g.fillStyle='#111c26';g.fillRect(row*72,i*72,72,72);
  g.drawImage(atlas[clip],f*72,row*72,72,72,row*72,i*72,72,72);
 }
 console.log('KNIGHT_PREVIEW_BASE64='+sheet.toBuffer('image/png').toString('base64'));
}
