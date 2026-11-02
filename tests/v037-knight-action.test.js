import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawKnightAction,knightActionFrame,KNIGHT_ACTION_FACES,KNIGHT_ACTION_CLIPS} from '../src/knight-action-sprites.js';
import {KnightSpriteAtlas} from '../src/knight-sprites.js';
import {knightPose,beginKnightAction,KNIGHT_CLIPS,advanceKnightAction} from '../src/knight-animation.js';
const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
for(const clip of KNIGHT_ACTION_CLIPS){
 test(clip+' production file is a complete 8x4 transparent atlas',()=>{
  const b=readFileSync(new URL('../assets/knight/'+clip+'-v037.png',import.meta.url));
  assert.equal(b.subarray(1,4).toString(),'PNG');
  assert.equal(b.readUInt32BE(16),768);assert.equal(b.readUInt32BE(20),384);
  assert.ok(b.length>50000);
 });
}
test('idle has eight time-keyed poses in all directions, without walk clock',()=>{
 for(const [face,d] of Object.entries(dirs)){
  const used=new Set(),p={kind:'warrior',hp:100,direction:d,moving:false,
    knightWalkDistance:134};
  for(let i=0;i<8;i++){
   const pose=knightPose(p,i*1.6/8+.01);
   assert.equal(pose.clip,'idle');assert.equal(pose.face,face);
   assert.equal(knightActionFrame(pose),i);
   used.add(pose.frame);
  }
  assert.equal(used.size,8);
 }
});
test('three combo attacks use distinct authored sheets, 8 frames and original hit events',()=>{
 for(const [face,d] of Object.entries(dirs))for(const clip of ['attack1','attack2','attack3']){
  const p={kind:'warrior',x:120,y:130,hp:100,direction:d};
  const sheet={clip},images={[clip]:sheet},frames=new Set(),xs=new Set();
  beginKnightAction(p,clip,.8,d);
  for(let i=0;i<8;i++){
   p.knightAction.elapsed=(i+.02)*.1;
   const pose=knightPose(p),draws=[];
   const ctx={drawImage(...args){draws.push(args);}};
   assert.ok(drawKnightAction(ctx,p,pose,images));
   assert.equal(draws.length,1);
   assert.strictEqual(draws[0][0],sheet);
   assert.deepEqual(draws[0].slice(1,5),[i*96,KNIGHT_ACTION_FACES[face]*96,96,96]);
   assert.equal(draws[0][5],72);
   assert.deepEqual(draws[0].slice(7),[96,96]);
   xs.add(draws[0][6]);frames.add(pose.frame);
  }
  assert.equal(frames.size,8);
  assert.equal(xs.size,1,'feet must not bounce across sword swing');
  let damage=0;const action=beginKnightAction(p,clip,.8,d);
  const t=.8*KNIGHT_CLIPS[clip].hitFrame/8;
  advanceKnightAction(p,t-.0001,()=>damage++);assert.equal(damage,0);
  advanceKnightAction(p,.0001,()=>damage++);assert.equal(damage,1);
  advanceKnightAction(p,1,()=>damage++);assert.equal(damage,1);
 }
});
test('knight atlas draws dedicated action when present and keeps old walk untouched',()=>{
 const image={};
 const manifest=JSON.parse(readFileSync(new URL('../assets/knight/atlas.json',import.meta.url),'utf8'));
 const atlas=Object.create(KnightSpriteAtlas.prototype);
 atlas.ready=true;atlas.manifest=manifest;atlas.images={down:{},right:{},up:{},left:{},walk:{},
  idle:image,attack1:{},attack2:{},attack3:{}};
 const p={kind:'warrior',hp:100,x:100,y:100,direction:dirs.down,invulnerable:0};
 const ctx={calls:[],save(){},restore(){},rotate(){},translate(){},drawImage(...a){this.calls.push(a);},imageSmoothingEnabled:false};
 for(const clip of KNIGHT_ACTION_CLIPS){
  p.moving=false;p.knightAction=null;
  if(clip!=='idle')beginKnightAction(p,clip,.6,dirs.down);
  ctx.calls=[];assert.equal(atlas.draw(ctx,p,.2),true);
  assert.equal(ctx.calls.length,1);
  assert.strictEqual(ctx.calls[0][0],atlas.images[clip],clip);
 }
 ctx.calls=[];p.knightAction=null;p.moving=true;p.knightMoveDirection=dirs.down;p.knightWalkDistance=0;
 atlas.draw(ctx,p,.2);assert.strictEqual(ctx.calls[0][0],atlas.images.walk);
});
test('missing action PNG falls back safely without breaking player drawing',()=>{
 const atlas=Object.create(KnightSpriteAtlas.prototype);
 const manifest=JSON.parse(readFileSync(new URL('../assets/knight/atlas.json',import.meta.url),'utf8'));
 atlas.ready=true;atlas.manifest=manifest;
 atlas.images={down:{},right:{},up:{},left:{},walk:{}};
 const p={kind:'warrior',hp:100,x:80,y:100,direction:dirs.down,invulnerable:0};
 const ctx={calls:[],save(){},restore(){},translate(){},rotate(){},drawImage(...a){this.calls.push(a);},imageSmoothingEnabled:false};
 beginKnightAction(p,'attack1',.6);
 assert.ok(atlas.draw(ctx,p,0));
 assert.strictEqual(ctx.calls[0][0],atlas.images.walk);
});
test('non-knight actions never use new knight assets',()=>{
 const ctx={drawImage(){throw Error('wrong sprite')}};
 const p={kind:'warrior',x:0,y:0};
 for(const clip of ['walk','special','dash','hurt','death']){
  assert.equal(drawKnightAction(ctx,p,{clip,face:'right',frame:2},{[clip]:{}}),false);
 }
});
