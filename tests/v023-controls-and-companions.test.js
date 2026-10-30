import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSES} from '../src/data.js';
import {Game} from '../src/game.js?v=0.23.0';
import {Input} from '../src/input.js?v=0.23.0';
import {defaultProgress} from '../src/progression.js';
import {drawCrystalRifle} from '../src/weapon-visuals.js';

const idle={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};
const fresh=(kind,seed=37)=>{
 const g=new Game(defaultProgress(),idle);g.start(kind,seed);return g;
};
test('all six heroes have exactly 100 base HP; glass cannon rifle balances damage against HP loss',()=>{
 for(const [kind,config] of Object.entries(CLASSES)){
  assert.equal(config.hp,100,'base HP config for '+kind);
  const g=fresh(kind);
  assert.equal(g.player.hp,100,'starting HP for '+kind);
  assert.equal(g.player.maxHp,100,'starting max HP for '+kind);
 }
 const g=fresh('glasscannon');
 g.player.direction={x:1,y:0};
 g.attack();
 const shot=g.projectiles.at(-1);
 assert.equal(shot.rifle,true);
 assert.equal(shot.magic,false);
 assert.ok(shot.vx>=1000);
 assert.equal(g.player.attackDelay,.46);
 assert.equal(g.player.damage,35);
 g.hurt(8,{x:1,y:0});
 assert.equal(g.player.maxHp,93,'taking damage sacrifices max HP');
});

test('party regroups beyond combat gates and all three summons attack the new room',()=>{
 for(const seed of [1,3,19,55,117,221,511,909]){
  for(const type of ['bat','imp','spirit']){
   const g=fresh('summoner',seed),room=g.dungeon.rooms.find(r=>r.type==='boss');
   const companion=g.servant;
   companion.kind=type;
   g.player.x=room.cx;g.player.y=room.cy;room.visited=true;
   assert.equal(g.regroupCompanion(companion,room),true,'regroup seed '+seed);
   assert.equal(g.dungeon.roomAt(companion.x,companion.y)?.id,room.id);
   let damage=0;
   g.enemies=[{hp:350,maxHp:350,x:room.cx+70,y:room.cy,type:'slime',radius:17}];
   g.hitEnemy=(e,amount)=>{damage+=amount;e.hp=Math.max(0,e.hp-amount)};
   for(let n=0;n<90;n++)g.updateServant(1/60);
   assert.equal(g.dungeon.roomAt(companion.x,companion.y)?.id,room.id);
   if(type==='bat')assert.ok(damage>0,'bat should bite in room seed '+seed);
   else assert.ok(g.projectiles.length>0,'ranged summon shoots seed '+seed);
  }
 }
});

function fakeControl(){
 const listeners=new Map();
 return {listeners,style:{setProperty(){}},addEventListener(type,callback){
  if(!listeners.has(type))listeners.set(type,[]);
  listeners.get(type).push(callback);
 },dispatch(type,payload={}){
  for(const callback of listeners.get(type)||[])callback({
   preventDefault(){},pointerId:1,pointerType:'touch',
   clientX:800,clientY:470,type,...payload
  });
 },getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),
 setPointerCapture(){},width:960,height:540};
}
test('touch tap throws once and hold-drag targets a precise location; PC mouse release is queued',()=>{
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 const attack=fakeControl(),canvas=fakeControl(),stick=fakeControl();
 const dash=fakeControl(),ability=fakeControl(),win=fakeControl(),doc=fakeControl();
 globalThis.window=win;
 globalThis.document={...doc,querySelector:sel=>({
  '#attackTouch':attack,'#joystick':stick,'#dashTouch':dash,'#abilityTouch':ability
 })[sel]};
 try{
  const input=new Input(canvas);
  attack.dispatch('pointerdown');
  attack.dispatch('pointerup');
  assert.equal(input.consumeLobRelease(),true,'one quick tap queues one throw');
  assert.equal(input.consumeLobRelease(),false);
  attack.dispatch('pointerdown');
  attack.dispatch('pointermove',{clientX:650,clientY:370});
  const point=input.lobTarget({x:400,y:260},{x:0,y:0,scale:1},260);
  assert.ok(point.x<400&&point.y<260,'dragging up-left moves landing point up-left');
  assert.equal(input.consumeLobRelease(),false,'holding must not throw before release');
  attack.dispatch('pointerup',{clientX:650,clientY:370});
  assert.equal(input.consumeLobRelease(),true);
  input.clearLobAim();
  input.mouse.active=true;input.mouse.x=600;input.mouse.y=200;
  const target=input.lobTarget({x:400,y:200},{x:0,y:0,scale:1},260);
  assert.deepEqual(target,{x:600,y:200},'PC aims exactly at the cursor');
  canvas.dispatch('pointerdown',{pointerType:'mouse',clientX:600,clientY:200,button:0});
  win.dispatch('pointerup',{pointerType:'mouse'});
  assert.equal(input.consumeLobRelease(),true,'releasing mouse queues a single throw');
 }finally{
  if(oldDocument===undefined)delete globalThis.document;
  else globalThis.document=oldDocument;
  if(oldWindow===undefined)delete globalThis.window;
  else globalThis.window=oldWindow;
 }
});
test('crystal rifle renders with a visible muzzle flash without borrowing mage staff',()=>{
 const calls=[],ctx={
  save(){},restore(){},translate(){},rotate(){},scale(){},
  fillRect(...p){calls.push(p)},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){}
 };
 drawCrystalRifle(ctx,{kind:'glasscannon',x:100,y:100,direction:{x:1,y:0},attackTimer:.17});
 assert.ok(calls.length>=12,'rifle receiver, stock, long barrel and flash');
});

test('alchemist holds a visible target, throws exactly once on release and cancels without throwing',()=>{
 let held=true,released=false;
 const actionInput={
  ...idle,
  attacking:()=>held,
  lobTarget:(p)=>({x:p.x+150,y:p.y+20}),
  target:(p)=>({x:p.x+150,y:p.y+20}),
  consumeLobRelease:()=>{const result=released;released=false;return result},
  clearLobAim:()=>{}
 };
 const g=new Game(defaultProgress(),actionInput);g.start('alchemist',172);
 g.update(1/60);
 assert.equal(g.alchemyAiming,true);
 assert.equal(g.projectiles.length,0,'no flask may leave the hand before release');
 held=false;released=true;
 g.update(1/60);
 assert.equal(g.projectiles.length,1,'one flask flies on release');
 assert.equal(g.projectiles[0].flask,true);
 g.update(1/60);
 assert.equal(g.projectiles.length,1,'the released shot is not repeated');
 const cancel=new Game(defaultProgress(),actionInput);
 held=true;released=false;cancel.start('alchemist',173);cancel.update(1/60);
 held=false;cancel.update(1/60);
 assert.equal(cancel.projectiles.length,0,'cancelled touch or lost focus must not shoot');
});
