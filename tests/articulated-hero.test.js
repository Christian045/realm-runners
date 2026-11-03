import {rigWalkFeet,RIG_WALK_STRIDE} from '../src/rig-walk.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ArticulatedHeroAtlas,RIG_KINDS,articulatedPose,articulatedSockets,articulatedShot,rigFacing} from '../src/articulated-hero.js';
import {COMBAT_HITS,combatContact,combatChoreography,rotateCombatPoint} from '../src/combat-choreography.js';
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

test('grounded gait takes one complete left/right step per real locomotion stride',()=>{
 assert.equal(RIG_WALK_STRIDE,72);
 for(let row=0;row<8;row++){
  const angle=Math.PI/2+row*Math.PI/4,d={x:Math.cos(angle),y:Math.sin(angle)};
  for(const t of [0,.125,.25,.375,.5,.625,.75,.875]){
   const feet=rigWalkFeet(t*RIG_WALK_STRIDE,d,true);
   assert.equal(feet.length,2);
   assert.equal(feet.filter(f=>f.airborne).length,1,'one planted foot at every phase');
   assert.ok(feet.every(f=>f.lift>=-1e-10&&f.lift<=5.001),'only the swing foot rises');
   assert.ok(feet.every(f=>Number.isFinite(f.dx)&&Number.isFinite(f.dy)));
   const repeat=rigWalkFeet((t+1)*RIG_WALK_STRIDE,d,true);
   feet.forEach((foot,i)=>{
    assert.ok(Math.abs(foot.dx-repeat[i].dx)<1e-9);
    assert.ok(Math.abs(foot.dy-repeat[i].dy)<1e-9);
   });
  }
  assert.ok(rigWalkFeet(0,d,false).every(f=>f.dx===0&&f.dy===0&&f.lift===0),'stopped actors plant both boots');
 }
});

test('three distinct contact-timed combat performances agree in all eight directions',()=>{
 const actions={warrior:['attack1','attack2','attack3'],mage:['attack','special'],summoner:['attack','special']};
 for(const [kind,clips] of Object.entries(actions))for(const clip of clips)for(let row=0;row<8;row++){
  const hit=combatContact(kind,clip),angle=Math.PI/2+row*Math.PI/4;
  const d={x:Math.cos(angle),y:Math.sin(angle)};
  const wind=kind==='warrior'&&clip==='attack3'?.28:kind==='warrior'?hit*.52:kind==='summoner'?.20:.24;
  const anticipation=combatChoreography(kind,clip,wind,d);
  const contact=combatChoreography(kind,clip,hit,d);
  const recovered=combatChoreography(kind,clip,1,d);
  assert.equal(contact.hit,hit,kind+' '+clip);
  assert.ok(Math.abs(anticipation.roll)>=.05,kind+' needs visible wind-up torso '+row);
  assert.ok(Math.abs(contact.roll)>=.04,kind+' needs contact weight '+row);
  assert.ok(contact.extend>.999,kind+' palm/weapon is not extended at hit');
  assert.ok(contact.impact>.999,kind+' impact marker must align with damage');
  assert.ok(Math.abs(recovered.roll)<1e-9,kind+' torso does not recover');
  assert.ok(Math.abs(recovered.dx)<1e-9);assert.ok(Math.abs(recovered.dy)<1e-9);
  const pivot=rotateCombatPoint({x:0,y:-25},contact);
  assert.ok(Math.abs(pivot.x-contact.dx)<1e-8);
  assert.ok(Math.abs(pivot.y+25-contact.dy)<1e-8);
  const p=actor(kind,clip,row,hit),socket=articulatedSockets(p,articulatedPose(p));
  assert.equal(socket.hit,hit);
  assert.ok(Math.abs(socket.motion.roll-contact.roll)<1e-10);
  assert.ok(Math.hypot(socket.hand.x-socket.shoulder.x,socket.hand.y-socket.shoulder.y)<34,
   kind+' shoulder disconnected from wrist at hit in '+row);
  if(kind==='warrior'){
   assert.ok(socket.reach>=35,clip+' sword missing');
   assert.ok(Math.hypot(socket.tip.x-socket.hand.x,socket.tip.y-socket.hand.y)>35);
  }else{
   const shot=articulatedShot(p);
   assert.ok(Math.abs(shot.x-p.x-socket.tip.x)<1e-9,kind+' emission x detached '+row);
   assert.ok(Math.abs(shot.y-p.y-socket.tip.y)<1e-9,kind+' emission y detached '+row);
   assert.ok(Math.abs(shot.mount.x-p.x-socket.hand.x)<1e-9);
   assert.ok(Math.abs(shot.mount.y-p.y-socket.hand.y)<1e-9);
   if(kind==='mage')assert.ok(Math.abs(contact.staff+Math.PI/2)>.1,'staff did not cast');
   if(kind==='summoner')assert.equal(socket.reach,0,'summoner must emit from palm');
  }
 }
 // Combo arcs must be meaningfully different, not one swing replayed 3x.
 const d={x:0,y:1},at=0.25;
 const swings=['attack1','attack2','attack3'].map(clip=>combatChoreography('warrior',clip,at,d).sword);
 assert.ok(new Set(swings.map(x=>x.toFixed(2))).size===3,'warrior combos use same sword silhouette');
});

test('camera-facing casts keep crystal clear of hood and palm outside robe, overhead finisher lifts blade',()=>{
 const mage=actor('mage','attack',0,.5),m=articulatedSockets(mage,articulatedPose(mage));
 assert.ok(m.tip.x>15&&m.tip.y< -30,'mage crystal should sit beside hood, not over face or boots');
 const summoner=actor('summoner','attack',0,.5),c=articulatedSockets(summoner,articulatedPose(summoner));
 assert.ok(c.hand.x>15,'summoner palm should extend visibly to camera-right of robe');
 const overhead=combatChoreography('warrior','attack3',.28,{x:0,y:1});
 assert.ok(overhead.sword< -2,'overhead wind-up should point sword above shoulder');
});
