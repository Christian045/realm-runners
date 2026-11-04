import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {KNIGHT_SHEET_CELL,KNIGHT_SHEET_FRAMES,KNIGHT_SHEET_ANCHOR} from '../src/knight-final.js';

const clips=['idle','walk','attack1','attack2','attack3'];
const folder=new URL('../assets/knight/v045/',import.meta.url);
const cell=KNIGHT_SHEET_CELL;
let imageCache=null;
async function images(){
 if(imageCache)return imageCache;
 const loaded=await Promise.all(clips.map(async clip=>[clip,await loadImage(await readFile(new URL(clip+'.png',folder)))]));
 imageCache=Object.fromEntries(loaded);return imageCache;
}
function pixels(sheet,row,frame,region=[0,0,144,144]){
 const c=createCanvas(region[2],region[3]),g=c.getContext('2d');
 g.imageSmoothingEnabled=false;
 g.drawImage(sheet,frame*cell+region[0],row*cell+region[1],region[2],region[3],
  0,0,region[2],region[3]);
 return g.getImageData(0,0,region[2],region[3]).data;
}
function agreement(target,source){
 let matched=0,total=0;
 for(let i=0;i<target.length;i+=4){
  if(source[i+3]>140){
   total++;
   if(source[i]===target[i]&&source[i+1]===target[i+1]&&
      source[i+2]===target[i+2]&&source[i+3]===target[i+3])matched++;
  }
 }
 return total?matched/total:0;
}

test('all 8 knight facings preserve their original helmet identity through every combat frame',async()=>{
 const art=await images();
 let checked=0;
 for(let row=0;row<8;row++){
  const candidates=[];
  for(const name of ['idle','walk'])for(let frame=0;frame<KNIGHT_SHEET_FRAMES[name];frame++)
   candidates.push(pixels(art[name],row,frame,[55,47,38,41]));
  for(const clip of ['attack1','attack2','attack3'])for(let frame=0;frame<KNIGHT_SHEET_FRAMES[clip];frame++){
   const head=pixels(art[clip],row,frame,[55,47,38,41]);
   const match=Math.max(...candidates.map(c=>agreement(head,c)));
   assert.ok(match>.79,`${clip} frame ${frame}, direction ${row}: head/armor switches to a different facing (${match.toFixed(2)})`);
   checked++;
  }
 }
 assert.equal(checked,8*(8+8+10));
});

test('all original knight attack frames contain a short attached blade, never a huge disconnected white crescent',async()=>{
 const art=await images();
 const poses=JSON.parse(await readFile(new URL('poses.json',folder),'utf8'));
 assert.equal(poses.version,45);
 assert.deepEqual(KNIGHT_SHEET_ANCHOR,{x:72,y:118});
 let count=0;
 for(const clip of ['attack1','attack2','attack3'])for(let row=0;row<8;row++){
  for(let frame=0;frame<KNIGHT_SHEET_FRAMES[clip];frame++){
   const p=poses.frames[clip][row][frame];
   assert.deepEqual(p.hand,p.grip,`${clip} ${row}/${frame} sword grip floating beside gauntlet`);
   const reach=Math.hypot(p.hand[0]-p.shoulder[0],p.hand[1]-p.shoulder[1]);
   assert.ok(reach<=19,'Disconnected sword arm '+clip+' '+row+'/'+frame);
   const blade=Math.hypot(p.tip[0]-p.grip[0],p.tip[1]-p.grip[1]);
   assert.ok(blade>=28&&blade<=32,'Invalid short blade length '+clip);
   const full=pixels(art[clip],row,frame);
   const x=p.hand[0],y=p.hand[1];
   assert.ok(x>=5&&x<=138&&y>=5&&y<=138);
   let glove=0;
   for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<=x+3;xx++)
    if(full[(yy*144+xx)*4+3]>120)glove++;
   assert.ok(glove>=15,'Visible hand lost its weapon '+clip+' '+row+'/'+frame);
   let brightOutside=0;
   for(let yy=0;yy<144;yy++)for(let xx=0;xx<144;xx++){
    if(xx>=52&&xx<=99&&yy>=43&&yy<=94)continue;
    const i=(yy*144+xx)*4;
    if(full[i+3]>140&&full[i]>160&&full[i+1]>160&&full[i+2]>160)
     brightOutside++;
   }
   assert.ok(brightOutside<110,'Oversized detached white attack arc '+clip+' '+row+'/'+frame);
   count++;
  }
 }
 assert.equal(count,8*(8+8+10));
});

test('walking is made of complete frames with independently alternating feet and one common floor',async()=>{
 const art=await images(),poses=JSON.parse(await readFile(new URL('poses.json',folder),'utf8'));
 assert.equal(poses.ground,123);
 const sheet=art.walk,canvas=createCanvas(144,144),g=canvas.getContext('2d');
 for(let row=0;row<8;row++){
  const steps=new Set(),heads=new Set();
  for(let frame=0;frame<8;frame++){
   g.clearRect(0,0,144,144);
   g.drawImage(sheet,frame*144,row*144,144,144,0,0,144,144);
   const ground=g.getImageData(36,112,72,17).data;
   let solePixels=0,hash=2166136261;
   for(let i=0;i<ground.length;i+=4){
    if(ground[i+3]>70)solePixels++;
    hash=Math.imul(hash^ground[i+3],16777619)^ground[i];
   }
   assert.ok(solePixels>=12,'Missing foot-ground contact '+row+'/'+frame);
   steps.add(hash>>>0);
   const head=g.getImageData(55,47,38,41).data;
   let signature=0;
   for(let i=0;i<head.length;i+=40)signature=Math.imul(signature^head[i+3],16777619)^head[i];
   heads.add(signature>>>0);
  }
  assert.ok(steps.size>=5,'Boots are frozen in walk direction '+row);
  assert.ok(heads.size>=2,'Upper body is completely frozen during walk '+row);
 }
});
