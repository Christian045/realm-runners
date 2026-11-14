import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HunterLocomotionAtlas,hunterLocomotionPose,advanceHunterLocomotion,HUNTER_STRIDE} from '../src/hunter-locomotion.js';
import {CLASSES} from '../src/data.js';
import packer from '../tools/pack-hunter-locomotion.cjs';
const idleBytes=await readFile(new URL('../assets/heroes/hunter/identity-idle-0733/idle.png',import.meta.url));
const idle=await loadImage(idleBytes),walk=await loadImage(await readFile(new URL('../assets/heroes/hunter/identity-locomotion-0734/walk.png',import.meta.url)));
const atlas=new HunterLocomotionAtlas(async clip=>clip==='idle'?idle:walk);await atlas.loading;
const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
test('source isolation preserves a held bow crossing nominal columns without importing a neighbour fragment',()=>{
 const source=createCanvas(920,400),g=source.getContext('2d');
 for(let row=0;row<2;row++)for(let col=0;col<9;col++){
  g.fillStyle='#74512d';g.fillRect(col*100+10,row*200+40,50,120);
  g.fillStyle='#d6c6a2';g.fillRect(col*100+60,row*200+100,45,4);
 }
 const rows=packer.sourceFigures(source);
 assert.deepEqual(rows.map(row=>row.length),[9,9]);
 for(let row=0;row<2;row++)for(let col=0;col<9;col++){
  const figure=rows[row][col];
  assert.deepEqual(figure.sourceBounds,[col*100+10,row*200+40,95,120]);
  const data=figure.c.getContext('2d').getImageData(0,0,95,120).data;
  assert.equal(data.filter((_,i)=>i%4===3&&data[i]===255).length,6180);
  assert.equal(data[(60*95+94)*4+3],255,'far bow tip must survive');
 }
});
function pixels(row,frame=-1){
 const g=createCanvas(96,96).getContext('2d'),d=direction(row);
 assert.equal(atlas.draw(g,{kind:'hunter',hp:100,x:48,y:88,direction:d,heroMoveDirection:d,moving:frame>=0,hunterWalkDistance:Math.max(0,frame)*12+.001}),true);
 return g.getImageData(0,0,96,96).data;
}
test('approved eight-view idle asset stays byte-identical and is drawn without resizing in every facing',()=>{
 assert.equal(createHash('sha1').update('blob '+idleBytes.length+'\0').update(idleBytes).digest('hex'),'a3065a65473d7468533aed14ff5072713e725e31');
 assert.equal(atlas.ready,true);assert.equal(atlas.failed,false);
 for(let row=0;row<8;row++){
  const g=createCanvas(96,96).getContext('2d');g.drawImage(idle,row*96,0,96,96,0,0,96,96);
  assert.deepEqual(pixels(row),g.getImageData(0,0,96,96).data);
 }
});
test('64 authored walk cells have opaque interiors, transparent padding, planted soles and eight different lower-body phases',()=>{
 assert.equal(walk.width,768);assert.equal(walk.height,768);
 for(let row=0;row<8;row++){
  const phases=new Set(),tops=[];
  for(let frame=0;frame<8;frame++){
   const d=pixels(row,frame);let left=96,right=-1,top=96,bottom=-1,count=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const alpha=d[(y*96+x)*4+3];assert.ok(alpha===0||alpha===255,'matte '+row+'/'+frame);
    if(alpha){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
   }
   assert.ok(count>400);assert.ok(left>=1&&right<=94&&top>=13&&top<=19,'clipping or size '+row+'/'+frame);
   assert.equal(bottom,87,'sole left floor '+row+'/'+frame);tops.push(top);
   phases.add(Buffer.from(d.slice(65*96*4)).toString('base64'));
  }
  assert.equal(phases.size,8,'repeated lower body '+row);
  assert.ok(Math.max(...tops)-Math.min(...tops)<=4,'excessive body bob '+row);
 }
});
test('actual movement uses all eight phases at the same speed/stride in cardinal and diagonal directions',()=>{
 assert.equal(HUNTER_STRIDE,96);
 for(let row=0;row<8;row++){
  const d=direction(row),p={kind:'hunter',x:0,y:0,hp:100,direction:d};const frames=new Set();
  for(let step=0;step<8;step++){
   advanceHunterLocomotion(p,d,12/CLASSES.hunter.speed);frames.add(hunterLocomotionPose(p).frame);
  }
  assert.equal(frames.size,8);assert.ok(Math.abs(Math.hypot(p.x,p.y)-96)<1e-7);
  assert.equal(hunterLocomotionPose(p).row,row);
  const before=p.hunterWalkDistance;advanceHunterLocomotion(p,{x:0,y:0},1/60);
  assert.equal(hunterLocomotionPose(p).clip,'idle');assert.equal(p.hunterWalkDistance,before);
 }
 const p={kind:'hunter',x:0,y:0,hp:100};advanceHunterLocomotion(p,{x:1,y:1},1);
 assert.ok(Math.abs(Math.hypot(p.x,p.y)-CLASSES.hunter.speed)<1e-7,'diagonal speed boost');
});
test('stopping, facing changes and resuming keep one root and the original ready pose',()=>{
 const p={kind:'hunter',x:0,y:0,hp:100,direction:direction(2)};
 advanceHunterLocomotion(p,direction(2),18/CLASSES.hunter.speed);const distance=p.hunterWalkDistance;
 advanceHunterLocomotion(p,{x:0,y:0},1/60);assert.equal(hunterLocomotionPose(p).clip,'idle');
 p.direction=direction(4);assert.equal(hunterLocomotionPose(p).row,4);
 advanceHunterLocomotion(p,direction(4),12/CLASSES.hunter.speed);
 assert.ok(Math.abs(p.hunterWalkDistance-distance-12)<1e-7);assert.equal(hunterLocomotionPose(p).row,4);
});
test('unfinished combat states and failed/invalid loads never substitute older hunter artwork',async()=>{
 const g=createCanvas(96,96).getContext('2d'),base={kind:'hunter',x:48,y:88,hp:100};
 for(const p of [{...base,hp:0},{...base,hurtTimer:.2},{...base,heroAction:{clip:'attack'}}])assert.equal(atlas.draw(g,p),false);
 for(const loader of [async()=>{throw Error('offline');},async()=>({width:1,height:1})]){
  const bad=new HunterLocomotionAtlas(loader);await bad.loading;
  assert.equal(bad.ready,false);assert.equal(bad.failed,true);assert.equal(bad.draw(g,base),false);
 }
});
