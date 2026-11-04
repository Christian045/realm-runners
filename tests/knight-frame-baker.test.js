import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {bakeKnightFrames,KNIGHT_BAKED_CELL,KNIGHT_BAKED_FRAMES,KNIGHT_CONTACT,knightBakedPose} from '../src/knight-frame-baker.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

const sourceBase=new URL('../assets/knight/v045/',import.meta.url);
const source={
 idle:await loadImage(await readFile(new URL('idle.png',sourceBase))),
 walk:await loadImage(await readFile(new URL('walk.png',sourceBase)))
};
const art=bakeKnightFrames(source,()=>createCanvas(1,1));
const context=createCanvas(144,144).getContext('2d');
function framePixels(sheet,row,frame){
 context.clearRect(0,0,144,144);
 context.drawImage(sheet,frame*144,row*144,144,144,0,0,144,144);
 return context.getImageData(0,0,144,144).data;
}
const alphaAt=(data,x,y)=>data[(Math.round(y)*144+Math.round(x))*4+3]||0;
const nearAlpha=(data,x,y)=>{
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)
  if(x+dx>0&&x+dx<144&&y+dy>0&&y+dy<144&&alphaAt(data,x+dx,y+dy)>80)return true;
 return false;
};
test('all 320 complete frames are baked with the same pixels and without clipping',()=>{
 let checked=0;
 for(const [clip,count] of Object.entries(KNIGHT_BAKED_FRAMES)){
  assert.equal(art[clip].width,KNIGHT_BAKED_CELL*count);
  assert.equal(art[clip].height,KNIGHT_BAKED_CELL*8);
  for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
   const pixels=framePixels(art[clip],row,frame);
   let painted=0,edge=0,boots=0;
   for(let y=0;y<144;y++)for(let x=0;x<144;x++){
    const a=alphaAt(pixels,x,y);if(a<=60)continue;
    painted++;
    if(x===0||x===143||y===0||y===143)edge++;
    if(y>=118&&y<=130&&x>=35&&x<=108)boots++;
   }
   assert.ok(painted>350,clip+'/'+row+'/'+frame+' missing body');
   assert.equal(edge,0,clip+'/'+row+'/'+frame+' clipped sword');
   assert.ok(boots>=10,clip+'/'+row+'/'+frame+' vanished boots');
   checked++;
  }
 }
 assert.equal(checked,320);
});
test('blade originates at exactly the moving sword gauntlet in every attack direction',()=>{
 for(const [clip,contact] of Object.entries(KNIGHT_CONTACT)){
  for(let row=0;row<8;row++){
   const fists=new Set(),bladeAngles=new Set();
   for(let frame=0;frame<KNIGHT_BAKED_FRAMES[clip];frame++){
    const pose=knightBakedPose(clip,row,frame);
    const pixels=framePixels(art[clip],row,frame);
    fists.add(pose.hand.x+':'+pose.hand.y);
    bladeAngles.add(pose.angle.toFixed(2));
    assert.ok(Math.hypot(pose.hand.x-pose.shoulder.x,pose.hand.y-pose.shoulder.y)<=21.5,'separated arm');
    assert.ok(nearAlpha(pixels,pose.hand.x,pose.hand.y),clip+' '+row+' '+frame+' empty fist');
    assert.ok(nearAlpha(pixels,pose.hand.x+Math.cos(pose.angle)*42,
     pose.hand.y+Math.sin(pose.angle)*42),clip+' '+row+' '+frame+' disconnected sword tip');
    assert.equal(pose.contact,frame===contact);
   }
   assert.ok(fists.size>=3,clip+'/'+row+' no hand animation');
   assert.ok(bladeAngles.size>=5,clip+'/'+row+' sword is frozen');
  }
  assert.equal(Math.floor((KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames)*KNIGHT_BAKED_FRAMES[clip]),contact);
 }
});
test('idle, walking and three combo attacks share the same full-body atlas dimensions',()=>{
 const count=Object.values(KNIGHT_BAKED_FRAMES).reduce((a,b)=>a+b,0);
 assert.equal(count,40);
 for(let row=0;row<8;row++){
  const idle=knightBakedPose('idle',row,0);
  for(const clip of Object.keys(KNIGHT_BAKED_FRAMES)){
   const first=knightBakedPose(clip,row,0);
   assert.equal(first.hand.x,idle.hand.x);
   assert.equal(first.hand.y,idle.hand.y);
  }
 }
 // The large baked-in front-view shield is gone; there is no old prop to
 // fight the new weapon drawn into the opposite gauntlet.
 for(let frame=0;frame<6;frame++){
  const pixels=framePixels(art.idle,0,frame);
  assert.equal(alphaAt(pixels,105,101),0,'old front shield edge survived');
 }
});
