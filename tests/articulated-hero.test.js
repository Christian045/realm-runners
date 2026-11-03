import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ArticulatedHeroAtlas,RIG_KINDS,articulatedPose,articulatedSockets,articulatedShot,rigFacing} from '../src/articulated-hero.js';
const clips=['idle','walk','attack1','attack2','attack3','special','hurt','dash','death'];
const atlases=new Map();
for(const kind of RIG_KINDS){
 const atlas=Object.create(ArticulatedHeroAtlas.prototype);
 Object.assign(atlas,{kind,ready:true,manifest:JSON.parse(fs.readFileSync(new URL(`../assets/rigs/${kind}/parts.json`,import.meta.url))),image:await loadImage(new URL(`../assets/rigs/${kind}/parts.png`,import.meta.url).pathname)});atlases.set(kind,atlas);
}
export function actor(kind,clip,row,t){
 const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
 const p={kind,x:128,y:128,hp:100,direction,moving:clip==='walk',walkDistance:t*72,heroMoveDirection:direction,knightMoveDirection:direction};
 if(clip==='death'){p.hp=0;p.heroDeathElapsed=t*1.04;p.knightDeathElapsed=t*1.04;}
 else if(!['idle','walk'].includes(clip))p[kind==='warrior'?'knightAction':'heroAction']={clip:kind!=='warrior'&&clip.startsWith('attack')?'attack':clip,duration:1,elapsed:t,direction};
 return p;
}
test('all six painted atlases contain eight independent views and 64 valid parts',()=>{
 for(const [kind,a] of atlases){
  assert.equal(a.manifest.frames.length,8,kind);const torso=new Set();
  for(let row=0;row<8;row++){assert.equal(a.manifest.frames[row].length,8);torso.add(JSON.stringify(a.manifest.frames[row][0]));assert.equal(rigFacing(actor(kind,'idle',row,0).direction),row);
   for(const f of a.manifest.frames[row]){assert.ok(f.w>0&&f.h>0);assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=a.image.width&&f.y+f.h<=a.image.height);}
  }assert.equal(torso.size,8);
 }
});
test('6912 rendered poses are visible, unclipped and reuse their directional model',()=>{
 const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');let count=0;
 for(const [kind,a] of atlases)for(let row=0;row<8;row++)for(const clip of clips){
  const unique=new Set();
  for(let frame=0;frame<16;frame++){
   const t=frame/15,p=actor(kind,clip,row,t);ctx.clearRect(0,0,256,256);
   const original=ctx.drawImage.bind(ctx),sources=[];ctx.drawImage=(image,...args)=>{assert.equal(image,a.image);sources.push(args.slice(0,4));return original(image,...args);};
   a.draw(ctx,p,t*1.6);ctx.drawImage=original;
   const torso=a.manifest.frames[row][0];assert.ok(sources.some(f=>JSON.stringify(f)===JSON.stringify([torso.x,torso.y,torso.w,torso.h])));
   const data=ctx.getImageData(0,0,256,256).data;let pixels=0;let hash=2166136261;
   for(let i=3;i<data.length;i+=4){if(data[i]){pixels++;const x=(i>>2)%256,y=Math.floor((i>>2)/256);assert.ok(x>1&&x<254&&y>1&&y<254,`${kind} ${row} ${clip} clipped`);}hash=Math.imul(hash^data[i],16777619);}
   assert.ok(pixels>400,`${kind} ${row} ${clip} missing`);unique.add(hash);count++;
  }
  if(['walk','attack1','special','death'].includes(clip))assert.ok(unique.size>=6,`${kind} ${row} ${clip} frozen: ${unique.size}`);
 }
 assert.equal(count,6912);
});
test('projectiles and render sockets agree at the exact release in every view',()=>{
 for(const kind of RIG_KINDS.filter(k=>k!=='warrior'))for(let row=0;row<8;row++)for(const clip of ['attack','special']){
  const p=actor(kind,clip,row,.5),s=articulatedSockets(p,articulatedPose(p)),shot=articulatedShot(p);
  assert.equal(shot.x,p.x+s.tip.x);assert.equal(shot.y,p.y+s.tip.y);assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-10);
 }
});
