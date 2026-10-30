import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {COMPANION_ATTACKS,beginCompanionAttack,advanceCompanion,companionPose,companionShot} from '../src/companion-animation.js';
import {CompanionSpriteAtlas} from '../src/companion-sprites.js';
function scene(kind='bat'){
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 const g=new Game(defaultProgress(),input);g.servantChoice=kind;g.start('summoner',5);const p=g.player,s=g.servant;s.x=p.x+20;s.y=p.y;
 const e={hp:1000,maxHp:1000,x:p.x+65,y:p.y,radius:18,type:'slime',knock:{x:0,y:0},homeRoom:0,flash:0};g.enemies=[e];return {g,p,s,e};
}
test('companion attacks release exactly once on authored frame 2, with fixed cooldown and locked target',()=>{
 for(const kind of ['bat','imp','spirit','giant']){
  const s={kind,x:0,y:0},e={x:120,y:0};const a=beginCompanionAttack(s,e),duration=COMPANION_ATTACKS[kind].duration;
  let hits=0;advanceCompanion(s,duration/3-.001,()=>hits++);assert.equal(hits,0);
  e.y=300;advanceCompanion(s,.001,()=>hits++);assert.equal(hits,1);assert.equal(companionPose(s).frame,2);assert.deepEqual(a.targetPoint,{x:120,y:0});
  advanceCompanion(s,10,()=>hits++);assert.equal(hits,1);assert.equal(s.companionAction,null);assert.equal(s.cooldown,COMPANION_ATTACKS[kind].cooldown);
 }
});
test('bat life steal occurs on bite contact and cannot heal a missed or dead target',()=>{
 const {g,p,s,e}=scene();p.hp=70;g.updateServant(.11);assert.equal(e.hp,1000);assert.equal(p.hp,70);
 g.updateServant(.01);assert.ok(e.hp<1000);assert.equal(p.hp,73);assert.equal(s.healClock,2.5);
 g.updateServant(.1);assert.equal(p.hp,73,'one heal per bite');
 const miss=scene();miss.p.hp=70;miss.g.updateServant(.05);miss.e.x+=300;miss.g.updateServant(.08);assert.equal(miss.p.hp,70);
 const dead=scene();dead.p.hp=70;dead.g.updateServant(.05);dead.e.hp=0;dead.g.updateServant(.08);assert.equal(dead.p.hp,70);
});
test('fire and ghost shots emerge from the casting hand and converge on the locked target',()=>{
 for(const kind of ['imp','spirit'])for(let n=0;n<8;n++){
  const {g,s,e}=scene(kind),angle=n*Math.PI/4;e.x=s.x+Math.cos(angle)*180;e.y=s.y+Math.sin(angle)*180;
  beginCompanionAttack(s,e);const a=s.companionAction,shot=companionShot(s);g.updateServant(a.duration/3);
  const b=g.projectiles[0];assert.equal(b.summonShot,kind);assert.equal(b.x,shot.x);assert.equal(b.y-b.visualHeight,shot.y);
  const dx=a.targetPoint.x-b.x,dy=a.targetPoint.y-b.y;assert.ok(Math.abs(dx*b.vy-dy*b.vx)<1e-6,'ground-plane ray matches hitbox');
  assert.equal(Math.round(Math.hypot(b.vx,b.vy)),kind==='imp'?560:430);
 }
});
test('golem slams a fixed impact point, expires at 3.8 seconds and leaves only a visual dissolve',()=>{
 const {g,p,s,e}=scene();g.ability();g.updateHeroAction(1);const giant=g.giant;giant.x=e.x-30;giant.y=e.y;
 g.updateServant(.05);const action=giant.companionAction;assert.equal(e.hp,1000);assert.equal(action.clip,'attack');
 const point={...action.targetPoint};g.updateServant(.13);assert.ok(e.hp<1000);assert.ok(g.effects.some(f=>f.type==='companion-impact'&&f.kind==='giant'&&f.x===point.x));
 giant.life=.01;g.updateServant(.02);assert.equal(g.giant,null);assert.strictEqual(g.servant,s);assert.ok(g.effects.some(f=>f.type==='companion-vanish'));
});
test('pause and hitstop freeze companion animation and pending attacks; regroup cancels a stale bite',()=>{
 const {g,s}=scene();g.updateServant(.05);const elapsed=s.companionAction.elapsed,time=s.visualTime;
 g.mode='paused';g.update(.03);assert.equal(s.visualTime,time);assert.equal(s.companionAction.elapsed,elapsed);
 g.mode='playing';g.hitstop=.2;g.update(.03);assert.equal(s.visualTime,time);
 const room=g.dungeon.roomAt(g.player.x,g.player.y);g.regroupCompanion(s,room);assert.equal(s.companionAction,null);
});
test('appearance and dissolve reach distinct six-frame states without changing companion gameplay',()=>{
 const s={kind:'spirit',appearanceElapsed:0};const frames=new Set();for(let n=0;n<6;n++){s.appearanceElapsed=n*.42/6+.0001;frames.add(companionPose(s).frame);assert.equal(companionPose(s).clip,'summon');}assert.equal(frames.size,6);
 s.vanishElapsed=10;assert.equal(companionPose(s).clip,'vanish');assert.equal(companionPose(s).frame,5);
});
test('changing companion selection cannot let an older asynchronous atlas overwrite it',async()=>{
 const atlas=new CompanionSpriteAtlas();atlas.previewLoading=Promise.resolve();const original=globalThis.fetch,resolvers={};
 globalThis.fetch=url=>new Promise(resolve=>{resolvers[url.pathname.match(/companions\/(\w+)/)[1]]=resolve;});atlas.loadImage=async()=>({width:672,height:1120});
 try{
  const first=atlas.select('bat');const second=atlas.select('imp');resolvers.imp({ok:true,json:async()=>({frames:{}})});await second;
  resolvers.bat({ok:true,json:async()=>({frames:{}})});await first;assert.ok(atlas.entries.imp);assert.equal(atlas.entries.bat,undefined);
  atlas.release();assert.equal(atlas.active,false);assert.deepEqual(atlas.entries,{});
 }finally{globalThis.fetch=original;}
});
test('a wall appearing during the windup blocks bites and spell releases',()=>{
 for(const kind of ['bat','imp','spirit']){
  const {g,s,e}=scene(kind);beginCompanionAttack(s,e);g.dungeon.isBlocked=()=>true;
  g.updateServant(COMPANION_ATTACKS[kind].duration/3);assert.equal(e.hp,1000);assert.equal(g.projectiles.length,0);assert.ok(!g.effects.some(f=>f.type==='companion-release'));
 }
});
