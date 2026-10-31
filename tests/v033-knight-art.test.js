import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KNIGHT_WALK_CELL,KNIGHT_WALK_FRAMES,KNIGHT_WALK_ROWS,drawKnightWalk} from '../src/knight-walk.js';
import {KnightSpriteAtlas} from '../src/knight-sprites.js';
import {knightPose} from '../src/knight-animation.js';
import {WALK_STRIDE} from '../src/locomotion.js';

const faces={down:{x:0,y:1},up:{x:0,y:-1},left:{x:-1,y:0},right:{x:1,y:0}};
test('production knight PNG contains a complete 8x4 atlas with transparency',()=>{
 const bytes=readFileSync(new URL('../assets/knight/walk-32.png',import.meta.url));
 assert.equal(bytes.subarray(1,4).toString(),'PNG');
 assert.equal(bytes.readUInt32BE(16),KNIGHT_WALK_CELL*KNIGHT_WALK_FRAMES);
 assert.equal(bytes.readUInt32BE(20),KNIGHT_WALK_CELL*4);
 assert.ok(bytes.length>20000,'atlas should contain detailed individually authored poses');
 assert.equal(Object.keys(KNIGHT_WALK_ROWS).length,4);
});
test('all 32 complete walking frames are drawn with the correct grounded pivot',()=>{
 const image={},seen=new Set();
 for(const [face,direction] of Object.entries(faces))
  for(let i=0;i<8;i++){
   const p={kind:'warrior',x:120,y:110,hp:100,direction,moving:true,
    knightMoveDirection:direction,walkDistance:i*WALK_STRIDE/8};
   const pose=knightPose(p),calls=[];
   const ctx={drawImage(...args){calls.push(args);}};
   const pivots={[face]:Array(8).fill(69)};
   assert.equal(drawKnightWalk(ctx,p,pose,image,pivots),true);
   assert.equal(calls.length,1);
   assert.deepEqual(calls[0],[image,i*80,KNIGHT_WALK_ROWS[face]*80,80,80,80,41,80,80]);
   seen.add(face+':'+calls[0][1]);
  }
 assert.equal(seen.size,32);
});
test('only the walk clip uses the new sheet; actions still use original knight frames',()=>{
 const image={};
 for(const clip of ['idle','attack1','attack2','attack3','special','dash','hurt','death'])
  assert.equal(drawKnightWalk({drawImage(){throw Error('Invalid new walk rendering during action');}},
   {x:0,y:0},{clip,face:'down',frame:0},image),false);
 const manifest=JSON.parse(readFileSync(new URL('../assets/knight/atlas.json',import.meta.url),'utf8'));
 const knight=Object.create(KnightSpriteAtlas.prototype);
 knight.ready=true;knight.manifest=manifest;
 knight.images={walk:image,down:{},up:{},left:{},right:{}};
 knight.newWalkPivots=Object.fromEntries(Object.keys(faces).map(face=>[face,Array(8).fill(69)]));
 const p={kind:'warrior',x:120,y:110,hp:100,invulnerable:0,
  direction:faces.down,moving:true,knightMoveDirection:faces.down,walkDistance:0};
 const ctx={save(){},restore(){},drawImage(...args){this.calls.push(args);},calls:[],imageSmoothingEnabled:false};
 knight.draw(ctx,p,0);assert.equal(ctx.calls.length,1);assert.strictEqual(ctx.calls[0][0],image);
 ctx.calls=[];p.moving=false;p.knightAction={clip:'attack1',elapsed:0,duration:.8,direction:faces.down};
 knight.draw(ctx,p,0);assert.equal(ctx.calls.length,1);assert.strictEqual(ctx.calls[0][0],knight.images.down);
});
