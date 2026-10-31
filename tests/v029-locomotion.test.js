import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {advanceLocomotion,locomotionFrame,legPoses,WALK_STRIDE} from '../src/locomotion.js';
import {heroPose} from '../src/hero-animation.js';
import {knightPose} from '../src/knight-animation.js';
const kinds=['warrior','hunter','mage','glasscannon','summoner','alchemist'];
function scene(kind){const input={movement:()=>({x:1,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};const g=new Game(defaultProgress(),input);g.start(kind,5);g.enemies=[];return g;}

test('each leg completes eight different phases and the support foot alternates',()=>{
 for(const face of ['down','right','up','left']){
  const visited=[new Set(),new Set()],supports=[];
  for(let frame=0;frame<8;frame++){
   const legs=legPoses({walkDistance:frame*WALK_STRIDE/8},{face,direction:{x:1,y:0}});
   legs.forEach((p,i)=>visited[i].add(p.frame));assert.equal((legs[1].frame-legs[0].frame+8)%8,4);
   assert.ok(Math.max(...legs.map(l=>l.hipY+l.height))>=6,'one foot stays on the ground plane');
   supports.push(legs[0].planted?0:1);
  }
  assert.equal(visited[0].size,8);assert.equal(visited[1].size,8);assert.notEqual(supports[0],supports[4]);
 }
});

test('all six classes advance gait by real distance, and stop against walls or stun',()=>{
 for(const kind of kinds){
  const g=scene(kind),p=g.player,from={x:p.x,y:p.y};g.update(1/60);
  assert.ok(p.moving,kind);assert.ok(Math.abs(p.walkDistance-Math.hypot(p.x-from.x,p.y-from.y))<1e-6);
  const phase=p.walkDistance;g.dungeon.canMove=()=>false;g.update(1/60);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
  g.dungeon.canMove=()=>true;p.statuses={stun:1};g.update(1/60);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
 }
});

test('sliding follows actual movement direction; slower travel advances fewer frames',()=>{
 const p={x:20,y:10,walkDistance:0};advanceLocomotion(p,20,0);
 assert.deepEqual(p.heroMoveDirection,{x:0,y:1});assert.equal(p.walkDistance,12);
 const a={x:5,y:0,walkDistance:0},b={x:10,y:0,walkDistance:0};advanceLocomotion(a,0,0);advanceLocomotion(b,0,0);
 assert.equal(a.walkDistance*2,b.walkDistance);
 const before=p.walkDistance;advanceLocomotion(p,0,0,true);assert.equal(p.moving,false);assert.equal(p.walkDistance,before);
 assert.equal(locomotionFrame({walkDistance:WALK_STRIDE/8,heroMoveDirection:{x:-1,y:0}},{x:1,y:0}),7,'backpedal reverses the step order');
});

test('pause, idle and dash freeze stepping; moving attacks keep their independent clocks',()=>{
 for(const kind of kinds){
  const g=scene(kind),p=g.player;g.attack();const action=p.knightAction||p.heroAction,clock=action.elapsed;
  g.update(.02);assert.ok(p.walkDistance>0);assert.ok(action.elapsed>clock);assert.match((kind==='warrior'?knightPose(p):heroPose(p)).clip,/attack/);
  const phase=p.walkDistance,elapsed=action.elapsed;g.mode='paused';g.update(.02);assert.equal(p.walkDistance,phase);assert.equal(action.elapsed,elapsed);
  g.mode='playing';g.input.movement=()=>({x:0,y:0});g.update(.02);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
  g.input.consumeDash=()=>true;g.update(.02);assert.equal(p.moving,false);assert.equal(p.walkDistance,phase);
 }
});


test('planted feet remain fixed in world space in all eight travel directions',()=>{
 for(let a=0;a<8;a++){
  const d={x:Math.cos(a*Math.PI/4),y:Math.sin(a*Math.PI/4)},stride=60+12*Math.abs(d.x);
  const face=Math.abs(d.x)>Math.abs(d.y)?d.x>0?'right':'left':d.y>0?'down':'up';
  for(let leg=0;leg<2;leg++){
   let origin;
   for(let i=1;i<10;i++){
    const phase=leg*.5+i*.045,p={x:d.x*stride*phase,y:d.y*stride*phase,walkDistance:phase*WALK_STRIDE,heroMoveDirection:d};
    const foot=legPoses(p,{face,direction:d,clip:'walk'})[leg];assert.ok(foot.planted);
    const point={x:p.x+foot.hipX+foot.footX,y:p.y+foot.footY};
    origin??=point;assert.ok(Math.hypot(point.x-origin.x,point.y-origin.y)<1e-8,'planted foot slides');
   }
  }
 }
});

test('idle plants both feet while a walking swing lifts the returning foot',()=>{
 for(const d of [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}]){
  const p={walkDistance:WALK_STRIDE*.25,heroMoveDirection:d},face=d.x?'right':'down';
  const idle=legPoses(p,{face,direction:d,clip:'idle'});assert.ok(idle.every(l=>l.planted&&l.footY===8));
  const legs=legPoses(p,{face,direction:d,clip:'walk'});assert.ok(legs[0].planted&&!legs[1].planted);
  assert.equal(legs[1].footY,0,'mid-swing toe must clear the floor');
 }
});

test('the mirrored left-facing limb reaches the same world-space foot target as the gait',async()=>{
 const {drawLocomotionLegs}=await import('../src/locomotion.js');
 const frames=Array.from({length:8},()=>({x:0,y:0,w:20,h:40,anchorX:5,footX:13}));
 for(const face of ['left','right','up','down'])for(let frame=0;frame<8;frame++){
  const d={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}}[face];
  const p={x:100,y:100,walkDistance:frame*WALK_STRIDE/8,heroMoveDirection:d};
  let matrix=[1,0,0,1,0,0];const stack=[],feet=[];
  const ctx={save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
   transform(a,b,c,d,e,f){const m=matrix;matrix=[m[0]*a+m[2]*b,m[1]*a+m[3]*b,m[0]*c+m[2]*d,m[1]*c+m[3]*d,m[0]*e+m[2]*f+m[4],m[1]*e+m[3]*f+m[5]];},
   translate(x,y){this.transform(1,0,0,1,x,y);},scale(x,y){this.transform(x,0,0,y,0,0);},
   drawImage(image,sx,sy,sw,sh,x,y,w,h){if(sy===0)return;const fx=x+13/20*w,fy=y+.94*h;feet.push(matrix[0]*fx+matrix[2]*fy+matrix[4]);}};
  const pose={face,direction:d,clip:'walk'},legs=legPoses(p,pose);if(face==='left')legs.reverse();
  drawLocomotionLegs(ctx,p,pose,{frames:{down:frames,right:frames,up:frames}},{});
  feet.forEach((x,i)=>assert.ok(Math.abs(x-(p.x+legs[i].hipX+legs[i].footX))<1e-8,face+' render reverses foot travel'));
 }
});
