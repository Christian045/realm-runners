import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {magePose,mageShot,MageProductionAtlas} from '../src/mage-production.js';
import {MAGE_SOCKETS} from '../src/mage-sockets.js';
import {advanceHeroAction} from '../src/hero-animation.js';
import {getMageProduction} from '../src/mage-production.js?v=0.57.0';
import {Game} from '../src/game.js?v=0.57.0';
import {defaultProgress} from '../src/progression.js';
const image=await loadImage(new URL('../assets/heroes/mage/production-056/atlas.png',import.meta.url).pathname);
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
test('turning right and back reflects the complete matching pose and its crystal together',()=>{
 for(const [row,sourceRow] of [[4,4],[5,3],[6,2],[7,1]])for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
  const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
  const p={kind:'mage',x:128,y:128,hp:clip==='death'?0:100,heroDeathElapsed:.6,direction,moving:clip==='walk',walkDistance:36};
  if(!['idle','walk','death'].includes(clip))p.heroAction={clip,elapsed:.5,duration:1,direction};
  const pose=magePose(p);assert.equal(pose.sourceRow,sourceRow);assert.equal(pose.mirrored,true);
  const original=MAGE_SOCKETS[sourceRow][pose.frame],shot=mageShot(p);
  assert.equal(shot.x,p.x-original[0]);assert.equal(shot.y,p.y+original[1]);
  const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');atlas.draw(ctx,p,0);
  assert.ok(ctx.getImageData(Math.round(shot.x),Math.round(shot.y),1,1).data[3]>128,`${row}/${clip}`);
 }
});
