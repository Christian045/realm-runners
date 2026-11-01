import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawRobedWalk,ROBED_WALK_ROWS,robedWalkFrame} from '../src/robed-walk.js';
import {HeroSpriteAtlas} from '../src/hero-sprites.js';
import {heroPose} from '../src/hero-animation.js';

const directions={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
for(const kind of ['mage','summoner']){
 test(kind+' matches idle model to walk in all four facings, without animated stepping at rest',()=>{
  const sheet={};
  for(const [face,direction] of Object.entries(directions)){
   const p={kind,x:80,y:105,hp:100,moving:false,direction,robedWalkDistance:157};
   const pose=heroPose(p,123);
   assert.equal(pose.clip,'idle');
   const calls=[],ctx={drawImage(...args){calls.push(args);}};
   assert.ok(drawRobedWalk(ctx,p,pose,sheet));
   assert.deepEqual(calls,[[sheet,0,ROBED_WALK_ROWS[face]*96,96,96,32,26,96,96]]);
   // Idle remains the same image and grounded position over time.
   const later=heroPose(p,124.2);
   const second=[];
   assert.ok(drawRobedWalk({drawImage(...args){second.push(args);}},p,later,sheet));
   assert.deepEqual(second,calls);
   p.moving=true;p.heroMoveDirection=direction;p.robedWalkDistance=0;
   const walk=heroPose(p,125);
   const walkCalls=[];
   assert.ok(drawRobedWalk({drawImage(...args){walkCalls.push(args);}},p,walk,sheet));
   assert.deepEqual(walkCalls,calls,'first walking frame matches idle design and feet');
   p.robedWalkDistance=90;
   assert.equal(robedWalkFrame(p),3);
  }
 });
 test(kind+' falls back to original idle sheet when new robe atlas is unavailable',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/heroes/'+kind+'/atlas.json',import.meta.url),'utf8'));
  const atlas=Object.create(HeroSpriteAtlas.prototype);
  const old={};
  atlas.ready=true;atlas.kind=kind;atlas.manifest={...manifest,aimRig:null};
  atlas.images={down:old,right:old,left:old,up:old};
  const p={kind,hp:100,invulnerable:0,x:75,y:100,moving:false,direction:directions.down};
  const images=[];
  const ctx={save(){},restore(){},drawImage(img){images.push(img);},imageSmoothingEnabled:false};
  assert.ok(atlas.draw(ctx,p,0));
  assert.strictEqual(images[0],old);
 });
 test(kind+' menu preview shows same resting model as gameplay',()=>{
  const sprite={naturalWidth:768,naturalHeight:384};
  const atlas=Object.create(HeroSpriteAtlas.prototype);
  atlas.previews={[kind]:sprite};
  const calls=[],ctx={clearRect(){},drawImage(...args){calls.push(args);},imageSmoothingEnabled:false};
  assert.ok(atlas.preview(ctx,kind,32,36,5));
  assert.equal(calls.length,1);
  assert.strictEqual(calls[0][0],sprite);
  assert.deepEqual(calls[0].slice(1,5),[0,0,96,96]);
 });
}
test('the new idle renderer does not replace other classes or combat animations',()=>{
 const img={},ctx={drawImage(){throw Error('unexpected new robe frame');}};
 for(const kind of ['hunter','warrior','glasscannon','alchemist'])
  assert.equal(drawRobedWalk(ctx,{kind,x:0,y:0},{clip:'idle',face:'down',frame:0},img),false);
 for(const clip of ['attack','special','hurt','dash','death'])
  assert.equal(drawRobedWalk(ctx,{kind:'mage',x:0,y:0},{clip,face:'down',frame:0},img),false);
});
