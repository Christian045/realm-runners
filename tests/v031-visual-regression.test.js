import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KnightSpriteAtlas} from '../src/knight-sprites.js';
import {HeroSpriteAtlas} from '../src/hero-sprites.js';
import {knightPose} from '../src/knight-animation.js';
import {heroPose} from '../src/hero-animation.js';
import {WALK_STRIDE} from '../src/locomotion.js';

const directions={
 down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}
};
function atlas(kind){
 const path=kind==='warrior'?'../assets/knight/atlas.json':'../assets/heroes/'+kind+'/atlas.json';
 const data=JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
 const instance=Object.create((kind==='warrior'?KnightSpriteAtlas:HeroSpriteAtlas).prototype);
 // Production manifests are used, but draw() does not need a browser or PNG decoder.
 instance.ready=true;instance.kind=kind;instance.manifest={...data,aimRig:null};
 instance.images=Object.fromEntries(Object.keys(directions).map(face=>[face,{face}]));
 return instance;
}
test('all six classes draw one intact authored frame in idle and walk, all facings',()=>{
 for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
  const s=atlas(kind);
  for(const [face,direction] of Object.entries(directions)){
   const clips=new Set();
   for(let i=0;i<8;i++){
    const p={kind,x:120,y:120,hp:100,invulnerable:0,moving:true,
     direction,heroMoveDirection:direction,knightMoveDirection:direction,
     walkDistance:WALK_STRIDE*i/8};
    const pose=kind==='warrior'?knightPose(p):heroPose(p);
    assert.equal(pose.clip,'walk');
    const frame=s.manifest.frames[face][pose.row*(kind==='warrior'?8:6)+pose.frame];
    const ops=[];
    const ctx={save(){},restore(){},drawImage(...args){ops.push(args);},imageSmoothingEnabled:false};
    assert.equal(s.draw(ctx,p,0),true);
    assert.equal(ops.length,1,kind+' '+face+' does not draw detached feet/body');
    const [img,sx,sy,sw,sh,dx,dy,dw,dh]=ops[0];
    assert.strictEqual(img,s.images[face]);
    assert.deepEqual([sx,sy,sw,sh],[frame.x,frame.y,frame.w,frame.h]);
    assert.deepEqual([dx,dy,dw,dh],
     [Math.round(p.x-(frame.walkRootX??frame.anchorX)),
      Math.round(p.y-frame.anchorY),frame.w,frame.h]);
    clips.add(sx+':'+sy);
   }
   assert.ok(clips.size>=6,kind+' '+face+' lacks authored walk frames');
  }
 }
});
test('idle renders without procedural body and leg overlap',()=>{
 for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
  const s=atlas(kind),direction={x:0,y:1};
  const p={kind,x:120,y:120,hp:100,invulnerable:0,moving:false,direction};
  let calls=0;const ctx={save(){},restore(){},drawImage(){calls++;},imageSmoothingEnabled:false};
  assert.equal(s.draw(ctx,p,0),true);
  assert.equal(calls,1,kind+' idle should be a single intact sprite');
 }
});
