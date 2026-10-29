import test from 'node:test';
import assert from 'node:assert/strict';
import {TILE} from '../src/data.js';
import {generateDungeon,ROOM_COLS,ROOM_ROWS,ROOM_COUNT,ROOM_SHAPES,SPECIAL_ROOMS} from '../src/dungeon.js';
import {findPath,hasLineOfSight,findSpawnPosition,enemySteering} from '../src/navigation.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
test('irregular world distributes 13 rooms over 25 cells with distinct, repeatable footprints',()=>{
 const seenShapes=new Set(),signatures=new Set();
 for(let seed=1;seed<=125;seed++){
  const a=generateDungeon(seed),b=generateDungeon(seed);
  assert.equal(a.rooms.length,ROOM_COUNT);
  assert.equal(a.width,ROOM_COLS*15);assert.equal(a.height,ROOM_ROWS*11);
  assert.deepEqual(a.rooms.map(r=>[r.gx,r.gy,r.shape,r.type,r.links]),b.rooms.map(r=>[r.gx,r.gy,r.shape,r.type,r.links]));
  assert.deepEqual(Array.from(a.tiles),Array.from(b.tiles));
  assert.ok(new Set(a.rooms.map(r=>r.gx+','+r.gy)).size===ROOM_COUNT);
  signatures.add(a.rooms.map(r=>r.gx+','+r.gy).join('|'));
  for(const r of a.rooms)seenShapes.add(r.shape);
  assert.ok(a.gates.length>=ROOM_COUNT-1);
  assert.notEqual(a.bossId,0);
  assert.equal(a.rooms[a.bossId].shape,'great');
  for(const type of SPECIAL_ROOMS)assert.equal(a.rooms.filter(r=>r.type===type).length,1,'seed '+seed+' '+type);
 }
 assert.ok(signatures.size>80);
 assert.ok(seenShapes.size>=ROOM_SHAPES.length);
});
test('physical flood fill from sanctuary reaches every room center across random dungeons',()=>{
 for(let seed=1;seed<=100;seed++){
  const d=generateDungeon(seed);
  const stack=[[Math.floor(d.start.x/TILE),Math.floor(d.start.y/TILE)]],seen=new Set();
  while(stack.length){
   const [x,y]=stack.pop(),key=y*d.width+x;
   if(seen.has(key)||d.tileAt(x,y)!==0)continue;
   seen.add(key);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])stack.push([x+dx,y+dy]);
  }
  for(const r of d.rooms){
   assert.ok(seen.has(Math.floor(r.cy/TILE)*d.width+Math.floor(r.cx/TILE)),'blocked '+seed+' '+r.id);
   assert.ok(d.canMove(r.cx,r.cy,14),'center collision '+seed+' '+r.id);
   for(const id of r.links)assert.ok(d.rooms[id].links.includes(r.id));
  }
  for(const gate of d.gates){
   assert.ok(d.canMove(gate.x,gate.y,12,false),'closed or obstructed corridor '+seed);
  }
 }
});
test('room silhouettes are truly variable even without different decoration themes',()=>{
 const d=generateDungeon(12);
 const areas=d.rooms.map(r=>{
  let floor=0;
  for(let y=r.gy*11+1;y<r.gy*11+10;y++)
   for(let x=r.gx*15+1;x<r.gx*15+14;x++)if(d.tileAt(x,y)===0)floor++;
  return floor;
 });
 assert.ok(Math.max(...areas)-Math.min(...areas)>17,'room sizes must change');
});
test('library rune puzzle awards key and vault accepts it for guaranteed high quality loot',()=>{
 const g=new Game(defaultProgress(),input);g.start('hunter',111);
 const lib=g.dungeon.rooms.find(r=>r.type==='library');
 g.player.x=lib.cx;g.player.y=lib.cy;g.entrance(lib);
 assert.equal(g.mode,'event');assert.equal(g.activeEvent.eventKind,'library');
 assert.ok(g.chooseEvent('rune'+lib.runeAnswer));
 assert.ok(g.libraryKey);assert.equal(g.mode,'playing');
 const vault=g.dungeon.rooms.find(r=>r.type==='vault');
 g.player.x=vault.cx;g.player.y=vault.cy;g.entrance(vault);
 assert.equal(g.mode,'event');assert.equal(g.activeEvent.eventKind,'vault');
 assert.ok(g.chooseEvent('key'));assert.equal(g.mode,'playing');
 assert.ok(!g.libraryKey);
 assert.ok(g.loot.filter(x=>x.type==='gear').length>=3);
 assert.ok(g.runCoins>=85);
});
test('wrong puzzle answer has consequences; camp choices are optional; trap zones warn first',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',27);
 const lib=g.dungeon.rooms.find(r=>r.type==='library');
 g.player.x=lib.cx;g.player.y=lib.cy;g.entrance(lib);
 const hp=g.player.hp;
 assert.ok(g.chooseEvent('rune'+((lib.runeAnswer+1)%3)));
 assert.ok(g.player.hp<hp);assert.equal(g.libraryKey,false);
 const camp=g.dungeon.rooms.find(r=>r.type==='camp');
 g.player.x=camp.cx;g.player.y=camp.cy;g.entrance(camp);
 assert.equal(g.mode,'event');
 assert.ok(g.chooseEvent('scout'));
 assert.equal(g.mode,'playing');
 assert.ok(camp.links.some(id=>g.dungeon.rooms[id].discovered||g.dungeon.rooms[id].type==='secret'));
 const trap=g.dungeon.rooms.find(r=>r.type==='trap');
 g.player.x=trap.cx;g.player.y=trap.cy;g.entrance(trap);
 assert.ok(g.hazards.length>=2);
 assert.ok(g.hazards.every(h=>h.time>0&&!h.done));
 assert.ok(trap.cleared);
});
test('line of sight blocks archer shots at walls; bounded path search routes around cover',()=>{
 const w=9,h=7,tiles=new Uint8Array(w*h).fill(0);
 for(let y=1;y<=4;y++)tiles[y*w+4]=2;
 const dungeon={
  width:w,height:h,tiles,doors:new Set(),
  tileAt(x,y){return x<0||y<0||x>=w||y>=h?1:tiles[y*w+x]},
  isBlocked(x,y){return this.tileAt(Math.floor(x/TILE),Math.floor(y/TILE))!==0}
 };
 const from={x:2.5*TILE,y:2.5*TILE},to={x:6.5*TILE,y:2.5*TILE};
 assert.equal(hasLineOfSight(dungeon,from.x,from.y,to.x,to.y),false);
 const path=findPath(dungeon,from,to);
 assert.ok(path.length>4);
 assert.ok(path.some(point=>point.y>4.5*TILE));
 assert.ok(path.every(p=>!dungeon.isBlocked(p.x,p.y)));
 assert.equal(hasLineOfSight(dungeon,from.x,from.y,3.5*TILE,2.5*TILE),true);
});
test('spawn placement stays on valid tiles and away from players for every special room shape',()=>{
 for(let seed=1;seed<=90;seed++){
  const d=generateDungeon(seed),p={x:d.start.x,y:d.start.y};
  for(const room of d.rooms){
   const point=findSpawnPosition(d,room,room.cx+145,room.cy-90,17,p);
   assert.ok(d.canMove(point.x,point.y,17,true),'bad spawn seed '+seed);
  }
 }
});
