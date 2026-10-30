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

test('all ranged release poses share a visible hand/muzzle with their projectile and effect in eight directions',async()=>{
 const {heroShot}=await import('../src/hero-aim.js');
 for(const kind of HERO_KINDS)for(let n=0;n<8;n++){
  const g=fresh(kind),p=g.player,a=n*Math.PI/4;p.direction={x:Math.cos(a),y:Math.sin(a)};
  g.attack();const shot=heroShot(p);g.updateHeroAction(p.heroAction.duration/2);
  const b=g.projectiles[0],effect=g.effects.find(e=>e.type==='hero-release');
  assert.ok(Math.abs(b.x-shot.x)<1e-8,kind+' emission x');
  assert.ok(Math.abs(b.y-(b.visualHeight||9)-shot.y)<1e-8,kind+' visible emission y');
  assert.ok(Math.abs(effect.x-shot.x)<1e-8&&Math.abs(effect.y-shot.y)<1e-8,kind+' effect');
  if(!b.flask){const speed=Math.hypot(b.vx,b.vy);assert.ok(Math.abs(b.vx/speed-shot.aim.x)<1e-8&&Math.abs(b.vy/speed-shot.aim.y)<1e-8);}
 }
});

test('mouse shots converge on the captured cursor from the muzzle even after moving during windup',()=>{
 for(const kind of ['glasscannon','hunter','mage','summoner'])for(let n=0;n<8;n++){
  let cursor;const g=fresh(kind,{mouse:{active:true},target:()=>cursor}),p=g.player,a=n*Math.PI/4;
  p.direction={x:Math.cos(a),y:Math.sin(a)};cursor={x:p.x+Math.cos(a)*220,y:p.y+Math.sin(a)*220-27};
  const selected={...cursor};g.attack();cursor={x:p.x-500,y:p.y+500};p.x+=12;p.y-=9;
  g.updateHeroAction(p.heroAction.duration/2);const b=g.projectiles[0];
  const dx=selected.x-b.x,dy=selected.y-(b.y-b.visualHeight),cross=dx*b.vy-dy*b.vx;
  assert.ok(Math.abs(cross)<1e-6,kind+' must follow exact cursor ray');
  assert.ok(dx*b.vx+dy*b.vy>0,kind+' must travel toward cursor');
 }
});

test('directional touch shots still hit floor hitboxes in all eight directions',()=>{
 for(const kind of ['glasscannon','hunter','mage','summoner'])for(let n=0;n<8;n++){
  const g=fresh(kind),p=g.player,a=n*Math.PI/4;p.direction={x:Math.cos(a),y:Math.sin(a)};
  const e={hp:230,maxHp:230,x:p.x+Math.cos(a)*180,y:p.y+Math.sin(a)*180,type:'slime',radius:18,knock:{x:0,y:0},homeRoom:0,elite:false,flash:0};
  g.enemies=[e];g.dungeon.isBlocked=()=>false;g.attack();g.updateHeroAction(1);
  for(let i=0;i<100&&e.hp===230;i++)g.updateProjectiles(1/120);
  assert.ok(e.hp<230,kind+' direction '+n+' still hits');
 }
});

test('hunter fan and multishot launch from the bow instead of the feet',async()=>{
 const {heroShot}=await import('../src/hero-aim.js');const g=fresh('hunter'),p=g.player;
 g.ability();const shot=heroShot(p);g.updateHeroAction(1);assert.equal(g.projectiles.length,7);
 for(const b of g.projectiles){assert.equal(b.x,shot.x);assert.equal(b.y-b.visualHeight,shot.y);}
});

test('rifle launch sweep hits point-blank foes and cannot skip a wall behind its muzzle',()=>{
 const g=fresh('glasscannon'),p=g.player;
 const e={hp:230,maxHp:230,x:p.x+20,y:p.y,type:'slime',radius:12,knock:{x:0,y:0},homeRoom:0,elite:false,flash:0};
 g.enemies=[e];g.dungeon.isBlocked=()=>false;g.attack();g.updateHeroAction(1);g.updateProjectiles(1/120);
 assert.ok(e.hp<230,'enemy before the muzzle still takes the shot');
 p.heroAction=null;g.enemies=[];g.attack();g.updateHeroAction(1);
 g.dungeon.isBlocked=x=>x>p.x+16&&x<p.x+40;
 g.updateProjectiles(1/120);assert.equal(g.projectiles.length,0,'barrel cannot bypass a blocking wall');
});
