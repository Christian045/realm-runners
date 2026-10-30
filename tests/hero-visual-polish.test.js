import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {swordPose,mageStaffPose,drawWarriorSword,drawMageStaff} from '../src/weapon-visuals.js';
import {Renderer} from '../src/render.js';
import {PixelTileAtlas} from '../src/tileset.js';

const actor=(kind,dir)=>({kind,x:100,y:100,radius:14,direction:dir,attackTimer:0,
 castTimer:0,comboStep:1,shield:0,dashTimer:0});

function fakeCtx(events=[]){
 return {save(){},restore(){},translate(x,y){events.push('weapon')},rotate(){},scale(){},
  fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}};
}

test('idle blade follows all four sprite facings with a compact hand anchor',()=>{
 const options=[{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
 for(const dir of options){
  const p=actor('warrior',dir),pose=swordPose(p);
  assert.ok(Math.abs(pose.x-p.x)<=19&&Math.abs(pose.y-p.y)<=13);
  assert.ok(Number.isFinite(pose.angle));
  p.attackTimer=.12;p.comboStep=3;
  assert.ok(swordPose(p).scale>1);
  drawWarriorSword(fakeCtx(),p);
 }
 const down=swordPose(actor('warrior',{x:0,y:1}));
 const left=swordPose(actor('warrior',{x:-1,y:0}));
 assert.notEqual(down.angle,left.angle);
});

test('mage staff stays near the gauntlet and is drawn once per frame',()=>{
 for(const dir of [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}]){
  const p=actor('mage',dir),pose=mageStaffPose(p);
  assert.ok(Math.abs(pose.x-p.x)<=19);
  assert.ok(Math.abs(pose.y-p.y)<=12);
  drawMageStaff(fakeCtx(),p);
 }
});

test('north-facing weapons draw behind the sprite; other facings draw in front',()=>{
 for(const kind of ['warrior','mage']){
  for(const [dir,north] of [[{x:0,y:-1},true],[{x:0,y:1},false],
   [{x:1,y:0},false],[{x:-1,y:0},false]]){
   const events=[],renderer={ctx:fakeCtx(events),shadow(){},
    sprites:{draw(){events.push('sprite');return true}}};
   Renderer.prototype.player.call(renderer,actor(kind,dir),0);
   assert.equal(events.filter(e=>e==='weapon').length,1);
   assert.deepEqual(events,north?['weapon','sprite']:['sprite','weapon']);
  }
 }
});

test('floor tiles have four different authored silhouettes, with static cached variants',()=>{
 const factory=()=>{
  const canvas={ops:[],width:24,height:24};
  const ctx={fillStyle:'',fillRect(x,y,w,h){canvas.ops.push([this.fillStyle,x,y,w,h])}};
  canvas.getContext=()=>ctx;
  return canvas;
 };
 const tiles=new PixelTileAtlas(factory);
 const frames=[0,1,2,3].map(n=>tiles.tile('sanctuary',0,n));
 assert.equal(new Set(frames.map(x=>JSON.stringify(x.ops))).size,4);
 assert.strictEqual(tiles.tile('sanctuary',0,2),frames[2]);
});

test('room labels stay in the menu and never overprint the playable floor',()=>{
 const atmosphere=readFileSync(new URL('../src/atmosphere.js',import.meta.url),'utf8');
 const render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
 assert.ok(!atmosphere.includes('fillText(th.name,cx,top+TILE*1.8)'));
 assert.ok(!render.includes("room.roomLabel||'KAMMER '"));
});
