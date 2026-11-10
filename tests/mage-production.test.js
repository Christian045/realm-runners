import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {magePose,mageShot,MageProductionAtlas,MAGE_REST_FRAMES,getMageProduction as localMageProduction} from '../src/mage-production.js';
import {MAGE_SOCKETS} from '../src/mage-sockets.js';
import {advanceHeroAction} from '../src/hero-animation.js';
import {getMageProduction} from '../src/mage-production.js?v=0.66.2';
import {Game} from '../src/game.js?v=0.66.2';
import {defaultProgress} from '../src/progression.js';
const image=await loadImage(new URL('../assets/heroes/mage/knight-style-063/atlas.png',import.meta.url).pathname);
const atlas=Object.assign(Object.create(MageProductionAtlas.prototype),{ready:true,image});
test('all 128 mage cells are populated and each measured socket lies on its cyan crystal',()=>{
 const c=createCanvas(1536,768),g=c.getContext('2d');g.drawImage(image,0,0);
 for(let row=0;row<8;row++)for(let f=0;f<16;f++){
  const data=g.getImageData(f*96,row*96,96,96).data;
  assert.ok(data.filter((v,i)=>i%4===3&&v>128).length>600);
  const [x,y]=MAGE_SOCKETS[row][f],i=(Math.round(y+88)*96+Math.round(x+48))*4;
  assert.ok(data[i+3]>128,`${row}/${f} missing socket`);
 }
});
test('release clock and rendered staff agree in all eight directions including long frames',()=>{
 for(let row=0;row<8;row++)for(const clip of ['attack','special']){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'mage',x:128,y:128,hp:100,direction,heroAction:{clip,elapsed:0,duration:.54,direction}};
  let releases=0;advanceHeroAction(p,.54,a=>{
   releases++;assert.equal(magePose(p,0,a).frame,clip==='attack'?6:9);
   const c=createCanvas(256,256),g=c.getContext('2d');atlas.draw(g,p,0);
   const shot=mageShot(p,a),pixel=g.getImageData(Math.round(shot.x),Math.round(shot.y),1,1).data;
   assert.ok(pixel[3]>128);assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-8);
  });assert.equal(releases,1);
 }
});
test('walking advances alternating whole-body strides by distance and death remains collapsed',()=>{
 const p={hp:100,direction:{x:0,y:1},moving:true};
 assert.deepEqual([0,18,36,54,72].map(walkDistance=>magePose({...p,walkDistance}).frame),[1,2,3,4,1]);
 assert.equal(magePose({...p,hp:0,heroDeathElapsed:4}).frame,15);
 for(const clip of ['attack','special'])assert.equal(magePose({...p,heroAction:{clip,elapsed:1,duration:1,direction:p.direction}}).frame,0);
});
test('production mage shots start at the crystal and hit close and distant aimed targets',async()=>{
 // Use the production image and socket implementation, rather than the unloaded legacy fallback.
 const warn=console.warn;console.warn=()=>{};let production;
 try{production=getMageProduction();await production.loading;}finally{console.warn=warn;}
 Object.assign(production,{ready:true,image});
 const input={mouse:{active:false},movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const mouse of [false,true])for(let row=0;row<8;row++)for(const range of [40,180]){
  const g=new Game(defaultProgress(),input);g.start('mage',721);
  const p=g.player,angle=Math.PI/2+row*Math.PI/4,d={x:Math.cos(angle),y:Math.sin(angle)};
  p.direction=d;p.crit=0;g.dungeon.isBlocked=()=>false;
  const enemy={type:'mushroom',x:p.x+d.x*range,y:p.y+d.y*range,hp:1000,maxHp:1000,radius:19,flash:0,knock:{x:0,y:0},homeRoom:0,damage:10};
  g.enemies=[enemy];input.mouse.active=mouse;input.target=()=>({x:enemy.x,y:enemy.y-27});
  g.beginHeroAttack();const action=p.heroAction;
  action.elapsed=action.duration*.5;const expected=mageShot(p,action);action.elapsed=0;
  g.updateHeroAction(action.duration*.5);const b=g.projectiles[0];
  assert.ok(b,`release ${row}`);assert.ok(Math.abs(b.x-expected.x)<1e-7);assert.ok(Math.abs(b.y-b.visualHeight-expected.y)<1e-7);
  assert.ok(b.spellColor);assert.equal(b.magicSplash,true);
  for(let i=0;i<100&&enemy.hp===1000;i++)g.updateProjectiles(1/60);
  assert.ok(enemy.hp<1000,`${mouse?'mouse':'touch'} row ${row} range ${range}`);
 }
 production.ready=false;
});
test('aiming exactly at the crystal still produces a unit flight direction',()=>{
 const p={kind:'mage',x:128,y:128,hp:100,direction:{x:1,y:0},heroAction:{clip:'attack',elapsed:.5,duration:1,direction:{x:1,y:0}}};
 const tip=mageShot(p);p.heroAction.target={x:tip.x,y:tip.y};
 assert.deepEqual(mageShot(p).aim,{x:1,y:0});
});
test('turning right reflects the complete matching pose and its crystal together',()=>{
 for(const [row,sourceRow] of [[6,2],[7,1]])for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'mage',x:128,y:128,hp:clip==='death'?0:100,heroDeathElapsed:.6,direction,moving:clip==='walk',walkDistance:36};
  if(!['idle','walk','death'].includes(clip))p.heroAction={clip,elapsed:.5,duration:1,direction};
  const pose=magePose(p);assert.equal(pose.sourceRow,sourceRow);assert.equal(pose.mirrored,true);
  const original=MAGE_SOCKETS[sourceRow][pose.frame],shot=mageShot(p);
  assert.equal(shot.x,p.x-original[0]-1);assert.equal(shot.y,p.y+original[1]);
  const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');atlas.draw(ctx,p,0);
  assert.ok(ctx.getImageData(Math.round(shot.x),Math.round(shot.y),1,1).data[3]>128,`${row}/${clip}`);
 }
});
test('all three back directions have distinct connected lower-body strides on both sides',()=>{
 const canvas=createCanvas(1536,768),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
 for(const row of [3,4,5]){
  const angle=Math.PI/2+row*Math.PI/4,pose=magePose({hp:100,direction:{x:Math.cos(angle),y:Math.sin(angle)},moving:true,walkDistance:0});
  assert.equal(pose.sourceRow,row);assert.equal(pose.mirrored,false);
  for(const left of [26,48]){
   const steps=[1,2,3,4].map(frame=>ctx.getImageData(frame*96+left,row*96+64,22,24).data);
   for(let i=0;i<4;i++){
    const next=steps[(i+1)%4];let changed=0;
    for(let p=0;p<next.length;p+=4)if(Math.abs(steps[i][p+3]-next[p+3])>128)changed++;
    assert.ok(changed>8,`static lower body row ${row}, side ${left}, step ${i}: ${changed}`);
   }
  }
  for(const frame of [1,2,3,4]){
   const data=ctx.getImageData(frame*96+30,row*96+48,36,40).data;
   for(let y=0;y<29;y++)assert.ok(Array.from({length:36},(_,x)=>data[(y*36+x)*4+3]).some(a=>a>128),`severed waist row ${row} frame ${frame} y ${y}`);
  }
 }
});

test('death keeps its recorded facing even when movement or aim changes',()=>{
 const p={hp:0,heroDeathElapsed:.7,direction:{x:1,y:0},heroMoveDirection:{x:0,y:1},heroDeathDirection:{x:0,y:-1}};
 assert.equal(magePose(p).row,4);
 p.direction={x:-1,y:0};assert.equal(magePose(p).row,4);
});
test('mirrored sockets sample the exact reflected crystal pixel in every frame',()=>{
 const source=createCanvas(1536,768),sg=source.getContext('2d');sg.drawImage(image,0,0);
 for(const row of [6,7])for(const [clip,elapsed] of [['idle',0],['walk',0],['attack',.2],['attack',.5],['special',.5],['dash',.2],['hurt',.2],['death',.7]]){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={x:128,y:128,hp:clip==='death'?0:100,heroDeathElapsed:elapsed,direction,moving:clip==='walk',walkDistance:36};
  if(!['idle','walk','death'].includes(clip))p.heroAction={clip,elapsed,duration:1,direction};
  const pose=magePose(p),[x,y]=MAGE_SOCKETS[pose.sourceRow][pose.frame];
  const expected=sg.getImageData(pose.frame*96+x+48,pose.sourceRow*96+y+88,1,1).data;
  const c=createCanvas(256,256),g=c.getContext('2d');atlas.draw(g,p,0);const shot=mageShot(p);
  const actual=g.getImageData(shot.x,shot.y,1,1).data;
  if(clip==='special')assert.equal(actual[3],expected[3]); // The charge glow colours the crystal.
  else assert.deepEqual(actual,expected,`${row}/${clip}/${elapsed}`);
 }
});

test('knight-style mage renders all eight walk phases in eight directions from measured crystals',async()=>{
 const walkImage=await loadImage(new URL('../assets/heroes/mage/walk-0661/walk.png',import.meta.url).pathname);
 const production=localMageProduction();Object.assign(production,{ready:true,image,walkImage});
 const render=Object.assign(Object.create(MageProductionAtlas.prototype),{ready:true,image,walkImage});
 try{
  for(let row=0;row<8;row++)for(let frame=0;frame<8;frame++){
   const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
   const p={kind:'mage',x:128,y:128,hp:100,direction,moving:true,mageWalkDistance:frame*12};assert.equal(magePose(p).walkFrame,frame);
   const c=createCanvas(256,256),g=c.getContext('2d');render.draw(g,p,0);const shot=mageShot(p),pixel=g.getImageData(shot.x,shot.y,1,1).data;
   assert.ok(pixel[3]>128&&pixel[1]>120&&pixel[2]>130,`crystal ${row}/${frame}`);
   let pixels=0;for(const value of g.getImageData(64,32,128,112).data.filter((v,i)=>i%4===3))if(value>128)pixels++;assert.ok(pixels>600);
  }
 }finally{production.ready=false;delete production.walkImage;}
});

test('mage and knight share the actual-distance walk cadence in every direction',async()=>{
 const {advanceLocomotion}=await import('../src/locomotion.js');
 const {knightPose}=await import('../src/knight-animation.js');
 for(const [x,y] of [[1,0],[0,1],[Math.SQRT1_2,Math.SQRT1_2]]){
  const mage={kind:'mage',x:0,y:0,hp:100,direction:{x,y}},knight={...mage,kind:'warrior'};
  for(let step=0;step<16;step++){
   for(const p of [mage,knight]){const oldX=p.x,oldY=p.y;p.x+=x*6;p.y+=y*6;advanceLocomotion(p,oldX,oldY,false,1/60);}
   assert.equal(magePose(mage).walkFrame,knightPose(knight).frame);
  }
  const distance=mage.mageWalkDistance;advanceLocomotion(mage,mage.x,mage.y,false,1/60);assert.equal(mage.mageWalkDistance,distance);assert.equal(mage.moving,false);
 }
});

test('stopping restores the selected stocky neutral mage instead of freezing a raised walk foot',async()=>{
 const walkImage=await loadImage(new URL('../assets/heroes/mage/walk-0661/walk.png',import.meta.url).pathname);
 const render=Object.assign(Object.create(MageProductionAtlas.prototype),{ready:true,image,walkImage});
 const neutral=Object.assign(Object.create(MageProductionAtlas.prototype),{ready:true,image,walkImage});
 for(let row=0;row<8;row++)for(const distance of [0,12,36,60,84]){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'mage',x:128,y:128,hp:100,direction,mageWalkDistance:distance};
  const actual=createCanvas(256,256),expected=createCanvas(256,256);
  render.draw(actual.getContext('2d'),p,0);neutral.draw(expected.getContext('2d'),{...p,mageWalkDistance:0},0);
  assert.deepEqual(actual.getContext('2d').getImageData(0,0,256,256).data,expected.getContext('2d').getImageData(0,0,256,256).data,`frozen walk pose on stop: ${row}/${distance}`);
 }
});

test('resting and attack recovery use the same directional body with both boots planted',async()=>{
 const walk=await loadImage(new URL('../assets/heroes/mage/walk-0661/walk.png',import.meta.url).pathname);
 const canvas=createCanvas(768,768),ctx=canvas.getContext('2d');ctx.drawImage(walk,0,0);
 for(let row=0;row<8;row++){
  const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
  const p={hp:100,direction};
  const pose=magePose(p),frame=pose.motionFrame;
  assert.equal(frame,MAGE_REST_FRAMES[pose.sourceRow]);
  const data=ctx.getImageData(frame*96,pose.sourceRow*96,96,96).data;
  // Exclude the staff, and inspect the soles on both sides of the body.
  for(const [left,right] of [[35,47],[49,64]]){
   let lowest=-1;
   for(let y=76;y<96;y++)for(let x=left;x<=right;x++)if(data[(y*96+x)*4+3]>128)lowest=y;
   assert.ok(lowest>=86&&lowest<=87,`raised resting boot: ${row}/${left}: ${lowest}`);
  }
  for(const clip of ['attack','special'])for(const elapsed of [0,.95]){
   const recovery=magePose({...p,heroAction:{clip,elapsed,duration:1,direction}});
   assert.equal(recovery.motionFrame,frame,`body switch in ${row}/${clip}/${elapsed}`);
  }
 }
});

test('front and back walking swap the visible planted boot halfway through the cycle',async()=>{
 const walk=await loadImage(new URL('../assets/heroes/mage/walk-0661/walk.png',import.meta.url).pathname);
 const canvas=createCanvas(walk.width,walk.height),ctx=canvas.getContext('2d');ctx.drawImage(walk,0,0);
 for(const row of [0,4]){
  const contacts=[0,4].map(frame=>{
   const data=ctx.getImageData(frame*96,row*96,96,96).data;
   let lowest=-1;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]>128)lowest=y;
   assert.equal(lowest,87,'the support boot stays on the ground');
   let sum=0,count=0;
   for(let y=lowest-2;y<=lowest;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]>128){sum+=x;count++;}
   assert.ok(count>8);return sum/count;
  });
  assert.ok(contacts[1]-contacts[0]>6,`row ${row} repeats the same leading boot: ${contacts}`);
 }
});
