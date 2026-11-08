import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {magePose,mageShot,MageProductionAtlas} from '../src/mage-production.js';
import {MAGE_SOCKETS} from '../src/mage-sockets.js';
import {advanceHeroAction} from '../src/hero-animation.js';
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
