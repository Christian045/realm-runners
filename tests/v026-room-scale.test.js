import test from 'node:test';
import assert from 'node:assert/strict';
import {TILE,ENEMY_DATA} from '../src/data.js';
import {generateDungeon,ROOM_W,ROOM_H,ROOM_SHAPES,SPECIAL_ROOMS} from '../src/dungeon.js?v=0.26.0';
import {findSpawnPosition} from '../src/navigation.js?v=0.26.0';
import {Game} from '../src/game.js?v=0.26.0';
import {defaultProgress} from '../src/progression.js';

const idle={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};
const area=(d,r)=>{
 let count=0;
 for(let y=r.gy*ROOM_H+1;y<r.gy*ROOM_H+ROOM_H-1;y++)
  for(let x=r.gx*ROOM_W+1;x<r.gx*ROOM_W+ROOM_W-1;x++)
   if(d.tileAt(x,y)===0)count++;
 return count;
};
test('four regular combat chambers have distinctly small, elongated, irregular and large areas',()=>{
 const shapes=new Set();
 for(let seed=1;seed<=120;seed++){
  const dungeon=generateDungeon(seed);
  const combats=dungeon.rooms.filter(r=>r.type==='combat')
   .sort((a,b)=>a.encounterTier-b.encounterTier||a.id-b.id);
  assert.equal(combats.length,4);
  assert.equal(new Set(combats.map(r=>r.shape)).size,4,'distinct silhouettes seed '+seed);
  assert.equal(combats[0].shape,'compact','small first combat seed '+seed);
  assert.equal(combats[3].shape,'great','large late combat seed '+seed);
  const sizes=combats.map(r=>area(dungeon,r));
  assert.ok(Math.max(...sizes)-Math.min(...sizes)>=20,'size contrast seed '+seed);
  assert.ok(sizes[0]<=65,'small chamber seed '+seed);
  assert.ok(sizes[3]>=105,'grand battle arena seed '+seed);
  for(const r of combats)shapes.add(r.shape);
  for(const type of SPECIAL_ROOMS)
   assert.equal(dungeon.rooms.filter(r=>r.type===type).length,1);
 }
 assert.ok(shapes.size>=ROOM_SHAPES.length-1,'room generator should expose many silhouettes');
});
test('every room remains physically connected through open doorways',()=>{
 for(let seed=1;seed<=120;seed++)for(const tower of [false,true]){
  const d=generateDungeon(seed,tower?{tower:true,floor:5,biome:'crypt'}:{});
  const x0=Math.floor(d.start.x/TILE),y0=Math.floor(d.start.y/TILE);
  const queue=[[x0,y0]],seen=new Set();
  for(let i=0;i<queue.length;i++){
   const [x,y]=queue[i],id=y*d.width+x;
   if(seen.has(id)||d.tileAt(x,y)!==0)continue;
   seen.add(id);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const xx=x+dx,yy=y+dy;
    if(xx>=0&&xx<d.width&&yy>=0&&yy<d.height)queue.push([xx,yy]);
   }
  }
  for(const r of d.rooms){
   assert.ok(seen.has(Math.floor(r.cy/TILE)*d.width+Math.floor(r.cx/TILE)),
    'unreachable room '+r.id+' seed '+seed);
   assert.ok(d.canMove(r.cx,r.cy,14,false),'blocked center seed '+seed);
  }
  for(const gate of d.gates)
   assert.ok(d.canMove(gate.x,gate.y,12,false),'blocked doorway seed '+seed);
 }
});
test('bosses always spawn exactly at the centre in normal and tower modes',()=>{
 for(let seed=1;seed<=30;seed++)for(const tower of [false,true]){
  const g=new Game(defaultProgress(),idle);
  if(tower)g.setTower(true);
  g.start('warrior',seed);
  const r=g.dungeon.rooms[g.dungeon.bossId];
  assert.equal(r.shape,'great');
  assert.ok(g.dungeon.canMove(r.cx,r.cy,ENEMY_DATA.boss.radius,true));
  g.player.x=r.cx;g.player.y=r.cy+145;r.visited=true;
  g.spawnRoom(r);
  const boss=g.enemies.find(e=>e.type==='boss');
  assert.ok(boss,'missing boss seed '+seed);
  assert.equal(boss.x,r.cx,'horizontal boss centering seed '+seed);
  assert.equal(boss.y,r.cy,'vertical boss centering seed '+seed);
 }
});
test('small fighting chambers fit enemies without collisions or accidental overlaps',()=>{
 for(let seed=1;seed<=110;seed++){
  const d=generateDungeon(seed),room=d.rooms.find(r=>r.type==='combat'&&r.shape==='compact');
  const occupied=[],player={x:room.cx+15,y:room.cy-110,radius:14};
  const offsets=[[-145,-90],[145,90],[0,110],[90,0],[-90,0],[0,-110],[130,-90],[-130,90]];
  for(const [ox,oy] of offsets){
   const point=findSpawnPosition(d,room,room.cx+ox,room.cy+oy,16,player,occupied);
   assert.ok(d.canMove(point.x,point.y,16,true),'enemy embedded in wall seed '+seed);
   for(const other of occupied)
    assert.ok(Math.hypot(other.x-point.x,other.y-point.y)>=24,
     'overlapping spawn seed '+seed);
   occupied.push({...point,hp:50,radius:16});
  }
 }
});
test('trap mechanisms and room landmarks remain functional in irregular spaces',()=>{
 for(let seed=1;seed<=100;seed++){
  const d=generateDungeon(seed);
  const trap=d.rooms.find(r=>r.type==='trap');
  const sites=[[-100,15],[100,-15],[0,105]].filter(([dx,dy])=>
   d.canMove(trap.cx+dx,trap.cy+dy,18));
  assert.ok(sites.length>=2,'trap zones must fit in room seed '+seed);
  assert.equal(d.rooms[d.bossId].shape,'great');
 }
});
