import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {HERO_KINDS,HERO_CLIPS,beginHeroAction,advanceHeroAction,heroPose} from '../src/hero-animation.js';
import {HeroSpriteAtlas} from '../src/hero-sprites.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
function fresh(kind,custom={}){const g=new Game(defaultProgress(),{...input,...custom});g.start(kind,5);g.player.direction={x:1,y:0};return g;}
test('five class attacks release once on pose 3, lock aim and retain their own projectiles',()=>{
 for(const kind of HERO_KINDS){
  const g=fresh(kind),p=g.player;g.attack();
  assert.equal(g.projectiles.length,0,kind+' windup');
  const action=p.heroAction;g.attack();assert.strictEqual(p.heroAction,action);
  p.direction={x:-1,y:0};g.updateHeroAction(action.duration/2-.001);assert.equal(g.projectiles.length,0);
  g.updateHeroAction(.001);assert.equal(heroPose(p).frame,3);assert.equal(g.projectiles.length,1,kind);
  const projectile=g.projectiles[0];
  if(kind==='alchemist')assert.ok(projectile.flask&&projectile.targetX>p.x);
  else assert.ok(projectile.vx>0,'direction locked through release');
  if(kind==='glasscannon')assert.ok(projectile.rifle);
  if(kind==='mage')assert.ok(projectile.magicSplash);
  const count=g.projectiles.length;g.updateHeroAction(2);assert.equal(g.projectiles.length,count);
 }
});
test('all six frame poses are reachable with local clocks, including death and dash',()=>{
 const p={hp:100,direction:{x:0,y:-1}};
 for(const clip of ['attack','special','dash']){
  beginHeroAction(p,clip,.6);const frames=new Set();
  for(let n=0;n<6;n++){p.heroAction.elapsed=n*.1+.001;frames.add(heroPose(p,999).frame);}
  assert.equal(frames.size,6);assert.equal(heroPose(p).face,'up');
 }
 p.hp=0;p.heroDeathElapsed=9;assert.equal(heroPose(p).frame,5);assert.equal(heroPose(p).clip,'death');
});
test('special abilities preserve class cooldowns and release their effects once',()=>{
 for(const kind of HERO_KINDS){
  const g=fresh(kind);g.ability();const action=g.player.heroAction;
  assert.equal(action.clip,'special');assert.equal(g.projectiles.length,0);assert.ok(!g.giant);
  assert.equal(g.player.abilityCooldown,kind==='summoner'?14:kind==='alchemist'?10.5:7);
  g.updateHeroAction(action.duration/2);
  if(kind==='summoner')assert.equal(g.giant.kind,'giant');
  if(kind==='hunter')assert.equal(g.projectiles.length,7);
  if(kind==='alchemist')assert.ok(g.projectiles[0].large);
  if(kind==='glasscannon')assert.equal(g.player.shield,5);
  const effects=g.effects.length;g.updateHeroAction(2);assert.equal(g.effects.length,effects);
 }
});
test('alchemy target and recipe survive input cleanup during the throw animation',()=>{
 const g=fresh('alchemist'),p=g.player;
 g.alchemyThrowTarget={x:p.x+155,y:p.y+25};g.attack();
 const target={...p.heroAction.target};g.alchemyThrowTarget=null;p.direction={x:-1,y:0};
 g.updateHeroAction(1);assert.equal(g.projectiles[0].alchemy,'burn');
 assert.ok(Math.abs(g.projectiles[0].targetX-target.x)<1);
});
test('dash and real damage cancel a pending projectile; pause does not advance it',()=>{
 for(const kind of HERO_KINDS){
  const g=fresh(kind),p=g.player;g.attack();g.mode='paused';g.update(.03);assert.equal(p.heroAction.elapsed,0);
  g.mode='playing';beginHeroAction(p,'dash',.18,{x:0,y:1});g.updateHeroAction(1);assert.equal(g.projectiles.length,0);
  g.attack();p.invulnerable=0;g.hurt(4,{x:1,y:0});assert.equal(p.heroAction,null);assert.equal(heroPose(p).clip,'hurt');
  g.updateHeroAction(1);assert.equal(g.projectiles.length,0);
 }
});
test('late atlas requests cannot replace the newly selected hero and old textures are released',async()=>{
 const atlas=Object.create(HeroSpriteAtlas.prototype);Object.assign(atlas,{kind:null,ready:false,images:{},generation:0});
 const originalFetch=globalThis.fetch;let releaseMage;
 const mageWait=new Promise(resolve=>{releaseMage=resolve;});
 globalThis.fetch=async url=>({ok:true,json:async()=>({kind:String(url).includes('/mage/')?'mage':'hunter'})});
 atlas.loadImage=async url=>{if(url.href.includes('/mage/'))await mageWait;return {src:url.href};};
 try{
  atlas.select('mage');const oldLoading=atlas.loading;
  atlas.select('hunter');await atlas.loading;
  assert.equal(atlas.manifest.kind,'hunter');assert.ok(atlas.ready);
  releaseMage();await oldLoading;
  assert.equal(atlas.kind,'hunter');assert.equal(atlas.manifest.kind,'hunter');
  assert.ok(Object.values(atlas.images).every(image=>image.src.includes('/hunter/')));
  atlas.release();assert.equal(atlas.kind,null);assert.equal(atlas.ready,false);assert.deepEqual(atlas.images,{});
 }finally{globalThis.fetch=originalFetch;}
});
test('an alchemy throw released during dash is kept until the dodge finishes',()=>{
 let released=false;
 const g=fresh('alchemist',{consumeLobRelease:()=>{const value=released;released=false;return value;},lobTarget:p=>({x:p.x+150,y:p.y+20}),target:p=>({x:p.x+150,y:p.y+20})});
 beginHeroAction(g.player,'dash',.18,{x:0,y:1});g.player.dashTimer=.18;released=true;
 g.update(1/60);assert.ok(g.queuedAlchemyThrow);assert.equal(g.projectiles.length,0);
 for(let n=0;n<15&&g.player.heroAction?.clip!=='attack';n++)g.update(1/60);
 assert.equal(g.player.heroAction.clip,'attack');g.updateHeroAction(1);
 assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].flask,true);assert.equal(g.queuedAlchemyThrow,null);
});
