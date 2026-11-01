import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawUnifiedBody,fullBodyFrame,FULL_BODY_ROWS} from '../src/unified-body.js';
import {KnightSpriteAtlas} from '../src/knight-sprites.js';
import {HeroSpriteAtlas} from '../src/hero-sprites.js';
import {knightPose,beginKnightAction} from '../src/knight-animation.js';
import {heroPose,beginHeroAction} from '../src/hero-animation.js';

const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
const modern=['warrior','mage','summoner'];
const kinds=[...modern,'hunter','glasscannon','alchemist'];
const clips=k=>k==='warrior'?
 ['idle','walk','attack1','attack2','attack3','special','dash','hurt','death']:
 ['idle','walk','attack','special','dash','hurt','death'];

function mock(kind,modernArt=true){
 const knight=kind==='warrior';
 const manifest=JSON.parse(readFileSync(new URL(knight?'../assets/knight/atlas.json':'../assets/heroes/'+kind+'/atlas.json',import.meta.url),'utf8'));
 const a=Object.create((knight?KnightSpriteAtlas:HeroSpriteAtlas).prototype);
 const body={model:kind};
 a.ready=true;a.kind=kind;a.manifest={...manifest,aimRig:null};
 a.images={down:{kind},right:{kind},up:{kind},left:{kind}};
 if(modernArt&&modern.includes(kind))a.images.walk=body;
 return {a,body};
}
function actor(kind,d,clip){
 const p={kind,x:100,y:112,hp:100,invulnerable:0,moving:false,direction:d,
   heroMoveDirection:d,knightMoveDirection:d,walkDistance:0,robedWalkDistance:0,knightWalkDistance:0};
 if(clip==='walk')p.moving=true;
 else if(clip==='hurt')p.hurtTimer=.18;
 else if(clip==='death'){p.hp=0;p.knightDeathElapsed=.65;p.heroDeathElapsed=.65;}
 else if(clip!=='idle'){
  if(kind==='warrior'){beginKnightAction(p,clip,.6);p.knightAction.elapsed=.3;}
  else{beginHeroAction(p,clip,.6);p.heroAction.elapsed=.3;}
 }
 return p;
}
function mockContext(){
 const ops=[];
 const ctx={ops,save(){},restore(){},translate(){},rotate(){},scale(){},globalAlpha:1,
  drawImage(...args){ops.push(args);},imageSmoothingEnabled:false};
 return ctx;
}
test('every class keeps a single complete sprite model across all states and facings',()=>{
 for(const kind of kinds){
  const {a,body}=mock(kind);
  for(const direction of Object.values(dirs)){
   for(const clip of clips(kind)){
    const ctx=mockContext(),p=actor(kind,direction,clip);
    assert.equal(a.draw(ctx,p,1),true);
    assert.equal(ctx.ops.length,1,kind+' '+clip+' should draw one body, not detached parts');
    assert.strictEqual(ctx.ops[0][0],modern.includes(kind)?body:a.images[
      Object.keys(dirs).find(face=>dirs[face]===direction)],kind+' '+clip+' switched its appearance');
   }
  }
 }
});
test('all new character images retain the same model when attack or dash begins',()=>{
 for(const kind of modern)for(const [face,d] of Object.entries(dirs)){
  const sheet={};
  const standing=actor(kind,d,'idle'),running=actor(kind,d,'walk');
  const output1=mockContext(),output2=mockContext();
  const pose=k=>kind==='warrior'?knightPose(k):heroPose(k);
  assert.ok(drawUnifiedBody(output1,standing,pose(standing),sheet,kind,0));
  assert.ok(drawUnifiedBody(output2,running,pose(running),sheet,kind,0));
  assert.deepEqual(output1.ops,output2.ops,'standing frame and first walking frame must match '+kind+' '+face);
  for(const clip of clips(kind).filter(c=>!['idle','walk'].includes(c))){
   const p=actor(kind,d,clip),canvas=mockContext();
   assert.ok(drawUnifiedBody(canvas,p,pose(p),sheet,kind,0));
   assert.strictEqual(canvas.ops[0][0],sheet,kind+' '+clip);
  }
 }
});
test('full-body renderer uses a grounded pivot even for a wide-offset knight boot',()=>{
 const sheet={},p={kind:'warrior',x:80,y:103};
 for(let i=0;i<8;i++){
  const calls=mockContext();
  drawUnifiedBody(calls,p,{clip:'walk',face:'right',frame:i,progress:i/8},sheet,'warrior',i);
  assert.deepEqual(calls.ops[0],[sheet,i*96,FULL_BODY_ROWS.right*96,96,96,32,24,96,96]);
 }
});
test('death and hit graphics do not modify the underlying gameplay state',()=>{
 for(const kind of modern){
  const p=actor(kind,dirs.right,'death'),previous=JSON.stringify(p),ctx=mockContext();
  const pose=kind==='warrior'?knightPose(p):heroPose(p);
  drawUnifiedBody(ctx,p,pose,{},kind,0);
  assert.equal(JSON.stringify(p),previous);
  assert.equal(ctx.ops.length,1);
 }
});
test('if modern images are absent, all six classes can still render original art',()=>{
 for(const kind of kinds){
  const {a}=mock(kind,false);
  for(const clip of clips(kind)){
   const ctx=mockContext(),p=actor(kind,dirs.down,clip);
   assert.equal(a.draw(ctx,p,1),true);
   assert.strictEqual(ctx.ops[0][0],a.images.down);
  }
 }
});
