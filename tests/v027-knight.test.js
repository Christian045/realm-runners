import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {KNIGHT_CLIPS,beginKnightAction,advanceKnightAction,knightPose} from '../src/knight-animation.js';
import {Renderer} from '../src/render.js';

const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false};
function scene(){
 const g=new Game(defaultProgress(),{...input});g.start('warrior',5);
 g.player.crit=0;g.player.direction={x:1,y:0};
 const p=g.player,e={x:p.x+40,y:p.y,hp:1000,maxHp:1000,radius:17,type:'slime',knock:{x:0,y:0},flash:0};
 g.enemies=[e];return {g,p,e};
}
test('every action exposes eight local frames, independent of the global render clock',()=>{
 const p={hp:100,direction:{x:1,y:0}};
 for(const clip of ['attack1','attack2','attack3','special','dash']){
  beginKnightAction(p,clip,.8);
  assert.equal(knightPose(p,900).frame,0);
  const frames=new Set();
  for(let i=0;i<8;i++){p.knightAction.elapsed=i*.1+.001;frames.add(knightPose(p,900).frame);}
  assert.equal(frames.size,8,clip);
 }
});
test('contact occurs on the exact rendered hit frame and fires only once, including skipped ticks',()=>{
 for(const clip of ['attack1','attack2','attack3','special']){
  const p={hp:100,direction:{x:1,y:0}},a=beginKnightAction(p,clip,.8);
  const hitTime=.8*KNIGHT_CLIPS[clip].hitFrame/8;let hits=0;
  advanceKnightAction(p,hitTime-.001,()=>hits++);assert.equal(hits,0);
  advanceKnightAction(p,.001,()=>hits++);assert.equal(hits,1);
  assert.equal(knightPose(p).frame,KNIGHT_CLIPS[clip].hitFrame);
  advanceKnightAction(p,2,()=>hits++);assert.equal(hits,1);assert.equal(p.knightAction,null);
  beginKnightAction(p,clip,.8);advanceKnightAction(p,2,()=>hits++);assert.equal(hits,2);
 }
});
test('melee windup does no damage; moving outside the arc before contact avoids the hit',()=>{
 const {g,p,e}=scene();g.attack();assert.equal(e.hp,1000);
 const hitAt=p.knightAction.duration*3/8;
 g.updateKnightAction(hitAt-.001);assert.equal(e.hp,1000);
 e.x=p.x-40;g.updateKnightAction(.002);assert.equal(e.hp,1000);
});
test('aim is locked for the swing, repeated input cannot restart it, combo bonuses remain',()=>{
 const {g,p,e}=scene(),damage=[];
 for(let n=1;n<=3;n++){
  p.direction={x:1,y:0};const before=e.hp;g.attack();
  const action=p.knightAction;g.attack();assert.strictEqual(action,p.knightAction);
  p.direction={x:-1,y:0};g.updateKnightAction(1);damage.push(before-e.hp);
  assert.equal(p.comboStep,n);
 }
 assert.ok(damage[0]>0&&damage[1]>damage[0]&&damage[2]>damage[1]);
});
test('a dash cancels an uncommitted sword hit and never applies it later',()=>{
 const {g,p,e}=scene();g.attack();beginKnightAction(p,'dash',.18,{x:0,y:-1});
 g.updateKnightAction(.2);assert.equal(e.hp,1000);assert.equal(p.knightAction,null);
});
test('whirlwind damages once at contact, respects walls, and keeps its original total multiplier',()=>{
 const {g,p,e}=scene();g.ability();assert.equal(e.hp,1000);
 g.updateKnightAction(.23);assert.equal(e.hp,1000);
 g.updateKnightAction(.02);assert.equal(1000-e.hp,Math.round(p.damage*1.9));
 const hp=e.hp;g.updateKnightAction(1);assert.equal(e.hp,hp);
 const wall=scene();wall.g.dungeon.tileAt=()=>1;wall.g.ability();wall.g.updateKnightAction(1);
 assert.equal(wall.e.hp,1000);
});
test('death reaches and holds the last frame; pausing does not advance an attack',()=>{
 const {g,p}=scene();g.attack();g.mode='paused';const elapsed=p.knightAction.elapsed;
 g.update(.034);assert.equal(p.knightAction.elapsed,elapsed);
 p.hp=0;p.knightDeathElapsed=5;assert.equal(knightPose(p).frame,7);
 assert.equal(knightPose(p).clip,'death');
});
test('new knight renderer draws its atlas once and never adds the legacy sword',()=>{
 const {p}=scene();let draws=0;
 const renderer={ctx:{},shadow(){},knight:{ready:true,draw(){draws++}},
  sprites:{draw(){throw new Error('Legacy sprite drawn over knight')}}};
 Renderer.prototype.player.call(renderer,p,0);assert.equal(draws,1);
});

test('a real hit interrupts an uncommitted normal swing and exposes the hurt pose',()=>{
 const {g,p,e}=scene();g.attack();p.invulnerable=0;g.hurt(5,{x:1,y:0});
 assert.equal(p.knightAction,null);assert.equal(knightPose(p).clip,'hurt');
 g.updateKnightAction(1);assert.equal(e.hp,1000);
});
