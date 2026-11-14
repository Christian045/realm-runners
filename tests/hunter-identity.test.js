import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HunterIdentityAtlas,hunterIdentityEnabled,hunterIdentityShot,HUNTER_IDENTITY_SOCKETS} from '../src/hunter-identity.js';
import {heroShot} from '../src/hero-aim.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
const root=new URL('../assets/heroes/hunter/',import.meta.url);
const idle=await loadImage(await readFile(new URL('identity-idle-0733/idle.png',root)));
const walk=await loadImage(await readFile(new URL('identity-locomotion-0734/walk.png',root)));
const requested=[],atlas=new HunterIdentityAtlas(async clip=>{requested.push(clip);return clip==='idle'?idle:walk;});await atlas.loading;
const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
function draw(p){const c=createCanvas(200,200),g=c.getContext('2d');assert.equal(atlas.draw(g,{kind:'hunter',x:100,y:100,hp:100,...p}),true);return g.getImageData(0,0,200,200).data;}
test('approved hunter is the browser default and loads only the two approved sheets',()=>{
 assert.equal(hunterIdentityEnabled(new URLSearchParams()),true);
 for(const query of ['originalHunter=1','hunterShortbow=1','legacyHeroArt=1','oldHunterArt=1'])assert.equal(hunterIdentityEnabled(new URLSearchParams(query)),false);
 assert.equal(atlas.ready,true);assert.equal(atlas.identity,true);assert.deepEqual(requested.sort(),['idle','walk']);
});
test('all eight idle poses and 64 walk frames are drawn unchanged in production',()=>{
 for(let row=0;row<8;row++)for(let frame=-1;frame<8;frame++){
  const d=direction(row),g=createCanvas(200,200).getContext('2d');
  g.drawImage(frame<0?idle:walk,frame<0?row*96:frame*96,frame<0?0:row*96,96,96,52,12,96,96);
  assert.deepEqual(draw({direction:d,heroMoveDirection:d,moving:frame>=0,hunterWalkDistance:Math.max(0,frame)*12+.001}),g.getImageData(0,0,200,200).data);
 }
});
test('attack, volley and hurt retain exactly the new identity; dash uses its actual walk frames',()=>{
 for(let row=0;row<8;row++){
  const d=direction(row),reference=draw({direction:d});
  for(const clip of ['attack','special','hurt'])for(const elapsed of [0,.49,.51,1])
   assert.deepEqual(draw({direction:d,moving:true,heroAction:{clip,elapsed,duration:1,direction:d}}),reference);
  for(let frame=0;frame<8;frame++)assert.deepEqual(
   draw({direction:d,heroAction:{clip:'dash',elapsed:(frame+.01)/8,duration:1,direction:d}}),
   draw({direction:d,heroMoveDirection:d,moving:true,hunterWalkDistance:(frame+.01)*12}));
  const corpse=draw({direction:d,hp:0,heroDeathElapsed:1.04,heroDeathDirection:d});
  let bottom=-1,opaque=0;for(let p=0;p<200*200;p++)if(corpse[p*4+3]){bottom=Math.floor(p/200);opaque++;}
  assert.ok(opaque>400);assert.ok(bottom>=98&&bottom<=100,'fall lost floor contact '+row);
 }
});
test('new release sockets touch the actual held bow and both attacks fire once from that position',()=>{
 const before=globalThis.location;globalThis.location={search:''};
 try{
  for(let row=0;row<8;row++){
   const g=createCanvas(96,96).getContext('2d');g.drawImage(idle,row*96,0,96,96,0,0,96,96);
   for(const point of Object.values(HUNTER_IDENTITY_SOCKETS[row]))assert.equal(g.getImageData(...point,1,1).data[3],255,'detached socket '+row);
   for(const clip of ['attack','special']){
    const input={movement:()=>({x:0,y:0}),aiming:()=>direction(row),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
    const game=new Game(defaultProgress(),input);game.start('hunter',42);game.player.direction=direction(row);
    if(clip==='attack')game.attack();else game.ability();
    const action=game.player.heroAction,shot=hunterIdentityShot(game.player,action);
    assert.deepEqual(heroShot(game.player,action),shot);
    game.updateHeroAction(action.duration*.499);assert.equal(game.projectiles.length,0);
    game.updateHeroAction(action.duration*.451);assert.equal(game.projectiles.length,clip==='attack'?1:7);
    for(const projectile of game.projectiles){assert.equal(projectile.x,shot.x);assert.equal(projectile.y-projectile.visualHeight,shot.y);}
    game.updateHeroAction(action.duration);assert.equal(game.projectiles.length,clip==='attack'?1:7);
   }
  }
 }finally{if(before===undefined)delete globalThis.location;else globalThis.location=before;}
});
