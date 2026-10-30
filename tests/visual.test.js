import test from 'node:test';
import assert from 'node:assert/strict';
import {SPRITE_KINDS,ANIMATION_STATES,SPRITE_SIZE,PixelSpriteAtlas,animationState,facing,spriteIdentity} from '../src/sprites.js';
import {PixelTileAtlas,TILE_THEMES,tileTheme,tileVariant} from '../src/tileset.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';

const makeCanvas=()=>{
 const calls=[];
 const ctx={
  fillStyle:'#000',imageSmoothingEnabled:true,
  fillRect(...args){calls.push({color:this.fillStyle,args})},
  save(){},restore(){},translate(){},scale(){},
 };
 return {width:0,height:0,calls,getContext:()=>ctx};
};
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};

test('every character, enemy and boss renders several distinct authored pixel regions',()=>{
 const atlas=new PixelSpriteAtlas(makeCanvas);
 for(const kind of SPRITE_KINDS){
  const image=atlas.frame(kind,'idle',0,'down');
  assert.equal(image.width,SPRITE_SIZE.width);
  assert.equal(image.height,SPRITE_SIZE.height);
  assert.ok(image.calls.length>=8,kind);
  assert.ok(new Set(image.calls.map(c=>c.color)).size>=4,kind);
  assert.strictEqual(atlas.frame(kind,'idle',0,'down'),image,'same atlas frame must be cached');
 }
 assert.equal(atlas.cache.size,SPRITE_KINDS.length);
});
test('all sprite states and left/right directions render without changing pixel grid dimensions',()=>{
 const atlas=new PixelSpriteAtlas(makeCanvas);
 for(const state of ANIMATION_STATES){
  for(const dir of ['up','down','left','right']){
   const sprite=atlas.frame('warrior',state,2,dir);
   assert.equal(sprite.height,36);
   assert.ok(sprite.calls.length>8);
  }
 }
 assert.equal(facing({x:-.9,y:.1}),'left');
 assert.equal(facing({x:0,y:-1}),'up');
 assert.equal(spriteIdentity({type:'boss',boss:{variant:'warden'}}),'warden');
 assert.equal(spriteIdentity({type:'boss',boss:{phase:1}}),'slimeking');
});
test('animation states prioritize hit, dash and cast over basic walking',()=>{
 const p={hp:100,moving:true};
 assert.equal(animationState(p,true),'walk');
 p.attackTimer=.12;assert.equal(animationState(p,true),'attack');
 p.castTimer=.25;assert.equal(animationState(p,true),'cast');
 p.dashTimer=.15;assert.equal(animationState(p,true),'dash');
 p.hurtTimer=.2;assert.equal(animationState(p,true),'hurt');
 p.hp=0;assert.equal(animationState(p,true),'death');
});
test('biome tiles use themed sprites and deterministic seed variations with cache reuse',()=>{
 const atlas=new PixelTileAtlas(makeCanvas);
 for(const theme of Object.keys(TILE_THEMES)){
  for(const type of [0,1,2]){
   const tile=atlas.tile(theme,type,3);
   assert.ok(tile.calls.length>=6,theme+' '+type);
   assert.equal(tile.width,24);
   assert.strictEqual(atlas.tile(theme,type,3),tile);
  }
 }
 assert.equal(atlas.cache.size,Object.keys(TILE_THEMES).length*3);
 for(let x=1;x<30;x++)assert.equal(tileVariant(7,x,9),tileVariant(7,x,9));
 assert.equal(tileTheme({theme:'throne',biome:'crypt'}),'throne');
 assert.equal(tileTheme({theme:'unknown',biome:'flooded'}),'flooded');
});
test('rendering animation timers follow actual attacks, abilities and received hits',()=>{
 const g=new Game(defaultProgress(),input);
 g.start('warrior',123);
 assert.equal(g.player.attackTimer,0);
 g.attack();assert.ok(g.player.attackTimer>0);
 g.ability();assert.ok(g.player.castTimer>0);
 g.player.invulnerable=0;
 g.hurt(5,{x:1,y:0});
 assert.ok(g.player.hurtTimer>0);
 const e={type:'slime',x:g.player.x+55,y:g.player.y,hp:80,maxHp:80,radius:17,
  flash:0,knock:{x:0,y:0},homeRoom:0};
 g.enemies.push(e);
 g.hitEnemy(e,100,{x:1,y:0});
 assert.ok(g.effects.some(effect=>effect.type==='death'&&effect.kind==='slime'));
});
