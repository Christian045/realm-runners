import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {HUNTER_COUNTS,hunterFacing,hunterBowLayout,bakeHunterSheets} from '../src/hunter-pixel-art.js';
import {HunterProductionAtlas,hunterPose,hunterProductionShot,
 hunterProductionEnabled} from '../src/hunter-production.js';
import {heroShot} from '../src/hero-aim.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
const sheets=bakeHunterSheets(()=>createCanvas(1,1));
function pixels(clip,row,frame){
 const c=createCanvas(72,72),ctx=c.getContext('2d');
 ctx.drawImage(sheets[clip],frame*72,row*72,72,72,0,0,72,72);
 return ctx.getImageData(0,0,72,72).data;
}
function bounds(data){
 let left=72,right=-1,top=72,bottom=-1,count=0;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++)if(data[(y*72+x)*4+3]>64){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
 }
 return {left,right,top,bottom,count};
}
test('Jäger production contains 368 complete original pixel-art poses',()=>{
 assert.equal(Object.values(HUNTER_COUNTS).reduce((a,n)=>a+n,0)*8,368);
 let checked=0;
 for(const [clip,frames] of Object.entries(HUNTER_COUNTS)){
  assert.equal(sheets[clip].width,frames*72);
  assert.equal(sheets[clip].height,576);
  for(let row=0;row<8;row++){
   const unique=new Set(),idleFeet=new Set();
   for(let frame=0;frame<frames;frame++){
    const data=pixels(clip,row,frame),b=bounds(data);
    assert.ok(b.count>300,clip+' '+row+' '+frame+' empty body');
    assert.ok(b.left>=2&&b.right<=69&&b.top>=2&&b.bottom<=66,
     clip+' '+row+' '+frame+' clipped '+JSON.stringify(b));
    if(clip==='idle'||clip==='walk')assert.equal(b.bottom,60,
     clip+' '+row+' '+frame+' feet do not touch floor');
    unique.add(Buffer.from(data).toString('base64'));
    if(clip==='idle')idleFeet.add(Buffer.from(data.slice(56*72*4,62*72*4)).toString('base64'));
    checked++;
   }
   if(['walk','attack','special'].includes(clip))
    assert.ok(unique.size>=5,clip+' '+row+' frozen '+unique.size);
   if(clip==='idle')assert.equal(idleFeet.size,1,'idle feet jitter '+row);
  }
 }
 assert.equal(checked,368);
 const views=new Set(Array.from({length:8},(_,row)=>
  Buffer.from(pixels('idle',row,0)).toString('base64')));
 assert.equal(views.size,8,'eight facings must have different artwork');
});
test('Jäger arrow tip is present in the exact release frame for eight views',()=>{
 for(let row=0;row<8;row++)for(const clip of ['attack','special']){
  const {tip}=hunterBowLayout(row,clip,3);
  const data=pixels(clip,row,3),index=(tip.y*72+tip.x)*4;
  assert.ok(data[index+3]>180,clip+' '+row+' missing painted muzzle');
  const angle=Math.PI/2+row*Math.PI/4,d={x:Math.cos(angle),y:Math.sin(angle)};
  assert.equal(hunterFacing(d),row);
  const p={kind:'hunter',x:128,y:130,hp:100,direction:d,
   heroAction:{clip,duration:1,elapsed:.5,direction:d}};
  assert.equal(hunterPose(p).frame,3);
  const shot=hunterProductionShot(p);
  assert.ok(Math.abs(shot.x-(128+(tip.x-36)*1.6))<=.51);
  assert.ok(Math.abs(shot.y-(130+(tip.y-60)*1.6))<=.51);
  assert.deepEqual(heroShot(p),shot);
  assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-9);
 }
});
test('Jäger ordinary arrow and Pfeilhagel start at the same painted bow tip',()=>{
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
  attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const g=new Game(defaultProgress(),input);g.start('hunter',321);
  const angle=Math.PI/2+row*Math.PI/4,d={x:Math.cos(angle),y:Math.sin(angle)},p=g.player;
  p.direction=d;
  if(clip==='attack')g.attack();else g.ability();
  const action=p.heroAction;
  const origin=hunterProductionShot(p,{...action,elapsed:action.duration*.5});
  g.updateHeroAction(action.duration*.5);
  assert.equal(g.projectiles.length,clip==='attack'?1:7,clip+' '+row);
  for(const arrow of g.projectiles){
   assert.ok(Math.abs(arrow.x-origin.x)<1e-8);
   assert.ok(Math.abs(arrow.y-arrow.visualHeight-origin.y)<1e-8);
  }
 }
});
test('full-body Jäger renders seven states in eight directions; rollback is explicit',async()=>{
 assert.equal(hunterProductionEnabled(new URLSearchParams()),true);
 assert.equal(hunterProductionEnabled(new URLSearchParams('oldHunterArt=1')),false);
 assert.equal(hunterProductionEnabled(new URLSearchParams('legacyHeroArt=1')),false);
 const atlas=new HunterProductionAtlas(()=>createCanvas(1,1));await atlas.loading;
 assert.equal(atlas.ready,true);assert.equal(atlas.failed,false);
 const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');
 for(let row=0;row<8;row++)for(const clip of Object.keys(HUNTER_COUNTS)){
  const a=Math.PI/2+row*Math.PI/4,d={x:Math.cos(a),y:Math.sin(a)};
  const p={kind:'hunter',x:128,y:126,hp:100,direction:d,
   moving:clip==='walk',walkDistance:37,heroMoveDirection:d};
  if(clip==='death'){p.hp=0;p.heroDeathElapsed=.75;}
  else if(!['idle','walk'].includes(clip))
   p.heroAction={clip,direction:d,duration:1,elapsed:.5};
  ctx.clearRect(0,0,256,256);
  assert.equal(atlas.draw(ctx,p,.7),true);
  const data=ctx.getImageData(0,0,256,256).data;let count=0;
  for(let i=3;i<data.length;i+=4)if(data[i]>64)count++;
  assert.ok(count>650,clip+' '+row+' disappeared');
 }
 ctx.clearRect(0,0,256,256);
 assert.equal(atlas.preview(ctx,256,256,.3),true);
});
