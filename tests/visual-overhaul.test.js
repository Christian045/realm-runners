import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon} from '../src/dungeon.js';
import {visibleTiles,wallEdges,roomDressings,lightingSources} from '../src/visual-world.js';
import {impactStyle,IMPACT_PALETTE} from '../src/visual-impact.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {PixelSpriteAtlas} from '../src/sprites.js';
import {PixelTileAtlas} from '../src/tileset.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
test('decorations are deterministic, wall mounted, outside combat core, and do not change geometry',()=>{
 for(const seed of [1,7,19,83,410]){
  const d=generateDungeon(seed),original=Array.from(d.tiles);
  for(const r of d.rooms){
   const props=roomDressings(d,r);
   assert.deepEqual(props,roomDressings(d,r));
   assert.ok(props.filter(p=>p.kind!=='groundmark').length<=9);
   assert.ok(props.filter(p=>p.kind==='groundmark').length<=4);
   for(const p of props){
    const tx=Math.floor(p.x/48),ty=Math.floor(p.y/48);
    if(p.kind==='fixture'){
     assert.equal(d.tileAt(tx,ty),1,'wall sconces must be mounted to masonry');
     assert.ok([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>d.tileAt(tx+dx,ty+dy)===0));
    }else{
     assert.equal(d.tileAt(tx,ty),0,'floor dressing can never float on blocked tiles');
     if(p.kind!=='groundmark')assert.ok(Math.abs(tx-(r.gx*15+7))>=4||Math.abs(ty-(r.gy*11+5))>=4);
    }
   }
  }
  assert.deepEqual(Array.from(d.tiles),original);
 }
});
test('wall occlusion follows actual neighbors and clips to the viewport',()=>{
 const d=generateDungeon(56),room=d.rooms[0];
 const tx=room.gx*15+7,ty=room.gy*11+5;
 assert.deepEqual(wallEdges(d,tx,ty),{north:false,south:false,west:false,east:false});
 assert.equal(wallEdges(d,0,0),null);
 const clip=visibleTiles(d,{x:0,y:0,w:350,h:300});
 assert.ok(clip.x0>=0&&clip.y0>=0&&clip.x1<d.width&&clip.y1<d.height);
});
test('mobile lighting has a strict viewport light limit and remains stable',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',903);
 const room=g.dungeon.rooms[0];
 for(const r of g.dungeon.rooms)r.discovered=true;
 g.camera={x:room.cx-190,y:room.cy-170,w:480,h:320};
 const lights=lightingSources(g);
 assert.ok(lights.length<=9,'max seven room lights plus player');
 assert.ok(lights.every(x=>x.radius<=230&&x.strength<=.4));
 assert.deepEqual(lights,lightingSources(g));
});
test('six themed masonry palettes remain cached and include substantial pixel detail',()=>{
 const calls=[],ctx={fillRect(...a){calls.push(a)},save(){},restore(){},translate(){},scale(){},drawImage(){},fillStyle:'',imageSmoothingEnabled:false};
 const atlas=new PixelTileAtlas(()=>({width:0,height:0,getContext:()=>ctx}));
 for(const theme of ['crypt','fungal','flooded','sanctuary','reliquary','throne']){
  const wall=atlas.tile(theme,1,3),floor=atlas.tile(theme,0,3),pillar=atlas.tile(theme,2,3);
  assert.ok(wall&&floor&&pillar);
  assert.strictEqual(atlas.tile(theme,1,3),wall);
 }
 assert.ok(calls.length>200,'cached walls, pillars and restrained floor slabs must contain authored detail');
});
test('class effects have distinctive palettes and heavier finisher silhouettes',()=>{
 for(const kind of ['warrior','hunter','mage']){
  const normal=impactStyle(kind,false,false),heavy=impactStyle(kind,true,true);
  assert.ok(heavy.count>normal.count);
  assert.ok(heavy.radius>normal.radius);
  assert.equal(normal.core,IMPACT_PALETTE[kind].core);
 }
 assert.notEqual(impactStyle('mage').edge,impactStyle('warrior').edge);
});
test('the third warrior swing generates a special readable impact without instant boss kills',()=>{
 const g=new Game(defaultProgress(),input);g.start('warrior',22);
 const p=g.player;const e={type:'slime',x:p.x+48,y:p.y,hp:550,maxHp:550,radius:18,flash:0,knock:{x:0,y:0},homeRoom:0};
 g.enemies=[e];p.direction={x:1,y:0};
 for(let i=0;i<3;i++){g.attack();g.updateKnightAction(1);}
 const impacts=g.effects.filter(x=>x.type==='impact');
 assert.equal(impacts.length,3);
 assert.ok(impacts.at(-1).finisher);
 assert.ok(e.knock.x>=280);
 assert.ok(impacts.every(x=>x.life>0&&x.kind==='warrior'));
});
test('mage collisions create magical impact and trail particle cues',()=>{
 const g=new Game(defaultProgress(),input);g.start('mage',23);
 const p=g.player;
 const e={type:'mushroom',x:p.x+90,y:p.y,hp:1000,maxHp:1000,radius:18,flash:0,knock:{x:0,y:0},homeRoom:0};
 g.enemies=[e];p.direction={x:1,y:0};
 g.attack();
 for(let i=0;i<10;i++)g.updateProjectiles(.016);
 assert.ok(g.effects.some(x=>x.type==='ember'));
 assert.ok(g.effects.some(x=>x.type==='impact'&&x.kind==='mage'));
 assert.ok(g.effects.some(x=>x.type==='ring'));
});
