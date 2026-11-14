import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HunterProductionAtlas,HUNTER_CELL,HUNTER_COUNTS,HUNTER_ROWS,
 HUNTER_ANCHOR,hunterAnchor,hunterFacing,hunterPose,hunterProductionShot,hunterProductionEnabled} from '../src/hunter-production.js';
import {HUNTER_SOCKETS} from '../src/hunter-sockets.js';
import {heroShot} from '../src/hero-aim.js';
import {Renderer} from '../src/render.js';
import {advanceLocomotion} from '../src/locomotion.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
const folder=new URL('../assets/heroes/hunter/original-073/',import.meta.url);
const requested=[];
const loader=async clip=>{requested.push(clip);return loadImage(await readFile(new URL(clip+'.png',folder)));};
const atlas=new HunterProductionAtlas(loader);await atlas.loading;
const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
function sample(row,clip,frame){
 const g=createCanvas(96,96).getContext('2d');
 g.drawImage(atlas.sheets[clip],frame*96,row*96,96,96,0,0,96,96);
 return g.getImageData(0,0,96,96).data;
}
function bounds(d){
 let left=96,top=96,right=-1,bottom=-1,count=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(d[(y*96+x)*4+3]>128){
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;
 }
 return {left,top,right,bottom,count};
}
test('original Jäger loads seven independent, complete 96px atlases atomically',()=>{
 assert.equal(atlas.ready,true);assert.equal(atlas.failed,false);
 assert.equal(HUNTER_CELL,96);assert.deepEqual(HUNTER_ANCHOR,{x:48,y:88});
 assert.deepEqual(requested.sort(),Object.keys(HUNTER_COUNTS).sort());
 for(const clip of Object.keys(HUNTER_COUNTS)){
  assert.equal(atlas.sheets[clip].width,768);assert.equal(atlas.sheets[clip].height,768);
 }
 assert.equal(HUNTER_ROWS.length,8);
});
test('448 real cells are populated, transparent, opaque inside and padded against clipping',()=>{
 let count=0;
 for(const clip of Object.keys(HUNTER_COUNTS))for(let row=0;row<8;row++)for(let frame=0;frame<8;frame++){
  const d=sample(row,clip,frame),b=bounds(d),label=clip+'/'+row+'/'+frame;
  assert.ok(b.count>400,'missing body '+label+JSON.stringify(b));
  assert.ok(b.left>=1&&b.right<=94&&b.top>=1&&b.bottom<=94,'cell clips '+label+JSON.stringify(b));
  for(let i=3;i<d.length;i+=4)assert.ok(d[i]===0||d[i]===255,'non-canonical alpha '+label);
  count++;
 }
 assert.equal(count,448);
});
test('every facing has eight distinct boot/leg phases, planted soles and a common ready pose',()=>{
 for(let row=0;row<8;row++){
  const boots=new Set();
  for(let frame=0;frame<8;frame++){
   const data=sample(row,'walk',frame),b=bounds(data);
   assert.equal(b.bottom,87,'walk sole moved '+row+'/'+frame);
   boots.add(Buffer.from(data.slice(64*96*4,88*96*4)).toString('base64'));
  }
  assert.equal(boots.size,8,'walking repeats a lower-body phase '+row);
  const idle=sample(row,'idle',0);
  for(const clip of ['attack','special','dash','hurt']){
   assert.deepEqual(sample(row,clip,0),idle,'entry changes model '+clip+'/'+row);
   assert.deepEqual(sample(row,clip,7),idle,'recovery changes model '+clip+'/'+row);
  }
  assert.deepEqual(sample(row,'death',6),sample(row,'death',7),'death does not settle '+row);
 }
});
test('facing, movement-distance clock and action endpoints select valid cells without changing root',()=>{
 for(let row=0;row<8;row++){
  const d=direction(row),p={kind:'hunter',x:100,y:100,hp:100,direction:d,moving:true,heroMoveDirection:d};
  assert.equal(hunterFacing(d),row);
  for(let frame=0;frame<8;frame++)assert.equal(hunterPose({...p,walkDistance:frame*12}).frame,frame);
  assert.equal(hunterPose({...p,walkDistance:96}).frame,0);
  assert.equal(hunterPose({...p,walkDistance:-12}).frame,7);
  for(const clip of ['attack','special','dash','hurt']){
   const a={clip,elapsed:.5,duration:1,direction:d};
   assert.equal(hunterPose(p,0,a).frame,4);
   assert.equal(hunterPose(p,0,{...a,elapsed:1}).frame,7);
  }
  assert.equal(hunterPose({...p,hp:0,heroDeathElapsed:10,heroDeathDirection:d}).frame,7);
 }
});
test('measured full-draw arrow tips and bow hands touch the authored art in all eight directions',()=>{
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const data=sample(row,clip,3),s=HUNTER_SOCKETS[clip][row],d=direction(row);
  for(const point of [s.tip,s.grip]){
   assert.ok(point.every(n=>Number.isInteger(n)&&n>=0&&n<96));
   assert.equal(data[(point[1]*96+point[0])*4+3],255,'detached '+clip+'/'+row+'/'+point);
  }
  const p={kind:'hunter',x:128.2,y:136.2,hp:100,direction:d,heroAction:{clip,elapsed:.5,duration:1,direction:d}};
  const shot=hunterProductionShot(p);
  const root=hunterAnchor(row);
  assert.equal(shot.x,128+s.tip[0]-root.x);assert.equal(shot.y,136+s.tip[1]-root.y);
  assert.deepEqual(heroShot(p),shot);
  assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-8);
 }
});
test('normal arrow and seven-arrow volley fire once, precisely at release, including a long frame',()=>{
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const clip of ['attack','special'])for(let row=0;row<8;row++)for(const longFrame of [false,true]){
  const game=new Game(defaultProgress(),input);game.start('hunter',42);game.player.direction=direction(row);
  if(clip==='attack')game.attack();else game.ability();
  const a=game.player.heroAction,shot=heroShot(game.player,{...a,elapsed:a.duration/2});
  if(!longFrame){game.updateHeroAction(a.duration*.499);assert.equal(game.projectiles.length,0);game.updateHeroAction(a.duration*.001);}
  else game.updateHeroAction(a.duration*.95);
  assert.equal(game.projectiles.length,clip==='attack'?1:7);
  for(const projectile of game.projectiles){assert.equal(projectile.x,shot.x);assert.equal(projectile.y-projectile.visualHeight,shot.y);}
  game.updateHeroAction(a.duration);assert.equal(game.projectiles.length,clip==='attack'?1:7);
 }
});
test('menu and world draw the same sheets; legacy flags and failed loads retain their fallback',async()=>{
 assert.equal(hunterProductionEnabled(new URLSearchParams()),true);
 for(const flag of ['legacyHeroArt','oldHunterArt'])assert.equal(hunterProductionEnabled(new URLSearchParams(flag+'=1')),false);
 const c=createCanvas(200,200),g=c.getContext('2d');
 assert.equal(atlas.preview(g,200,200,0),true);
 assert.ok(g.getImageData(0,0,200,200).data.some((v,i)=>i%4===3&&v===255));
 const warning=console.warn;console.warn=()=>{};
 try{
  for(const bad of [async()=>{throw Error('network');},async()=>({width:1,height:1})]){
   const broken=new HunterProductionAtlas(bad);await broken.loading;
   assert.equal(broken.ready,false);assert.equal(broken.failed,true);assert.deepEqual(broken.sheets,{});
   assert.equal(broken.draw(g,{kind:'hunter',hp:100},0),false);
  }
 }finally{console.warn=warning;}
});

// Legacy heroes use a y+10 shadow; the new hunter's root is at his soles.
test('the production hunter shadow touches the same sole line as the mage',()=>{
 for(const kind of ['hunter','mage']){
  const ellipses=[],ctx={save(){},restore(){},beginPath(){},fill(){},ellipse(...a){ellipses.push(a);}};
  const heroes={ready:true,kind,[kind]:{ready:true},draw(){}};
  Renderer.prototype.player.call({ctx,heroes,shadow(){throw Error('legacy floating shadow');}},
   {kind,x:100,y:100,radius:17,hp:100,shield:0,direction:{x:0,y:1}},0);
  assert.equal(ellipses.length,1);assert.deepEqual(ellipses[0].slice(0,4),[100,101,kind==='hunter'?21:19,4]);
 }
});

test('actual movement gives the hunter all eight phases without the legacy 72-unit reset',()=>{
 for(let row=0;row<8;row++){
  const d=direction(row),p={kind:'hunter',x:0,y:0,hp:100,direction:d};
  const frames=[];
  for(let step=0;step<8;step++){
   const x=p.x,y=p.y;p.x+=d.x*12;p.y+=d.y*12;
   advanceLocomotion(p,x,y,false,1/60);
   frames.push(hunterPose(p).frame);
  }
  assert.equal(new Set(frames).size,8,'skips phases in direction '+row);
  assert.ok(Math.abs(p.hunterWalkDistance)<1e-8||Math.abs(p.hunterWalkDistance-96)<1e-8);
 }
});
