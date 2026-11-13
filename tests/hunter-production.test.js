import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HUNTER_CELL,HUNTER_ANCHOR,HUNTER_COUNTS,HUNTER_SOURCE_VIEWS,
 HUNTER_BOW_HINTS,hunterFacing,bakeHunterIllustrated,
 hunterIllustratedSocket} from '../src/hunter-illustrated.js';
import {HunterProductionAtlas,hunterPose,hunterProductionShot,
 hunterProductionEnabled} from '../src/hunter-production.js';
import {heroShot} from '../src/hero-aim.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
const folder=new URL('../assets/heroes/hunter/',import.meta.url);
const sourceLoader=async()=>{
 const manifest=JSON.parse(await readFile(new URL('atlas.json',folder),'utf8'));
 const images=Object.fromEntries(await Promise.all(['down','left','up','right'].map(
  async face=>[face,await loadImage(await readFile(new URL(face+'.png',folder)))])));
 return {manifest,images};
};
const source=await sourceLoader();
const illustrated=bakeHunterIllustrated({...source,canvasFactory:()=>createCanvas(1,1)});
const {sheets,sockets}=illustrated;
function pixels(clip,row,frame){
 const c=createCanvas(HUNTER_CELL,HUNTER_CELL),g=c.getContext('2d');
 g.drawImage(sheets[clip],frame*HUNTER_CELL,row*HUNTER_CELL,
  HUNTER_CELL,HUNTER_CELL,0,0,HUNTER_CELL,HUNTER_CELL);
 return g.getImageData(0,0,HUNTER_CELL,HUNTER_CELL).data;
}
function bounds(data){
 let left=HUNTER_CELL,right=-1,top=HUNTER_CELL,bottom=-1,count=0;
 for(let y=0;y<HUNTER_CELL;y++)for(let x=0;x<HUNTER_CELL;x++)
  if(data[(y*HUNTER_CELL+x)*4+3]>90){
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
  }
 return {left,right,top,bottom,count};
}
test('the hunter now uses 336 detailed complete-body illustrations, rather than procedural 0.69 shapes',()=>{
 assert.equal(HUNTER_CELL,120);assert.equal(HUNTER_ANCHOR.y,105);
 assert.equal(HUNTER_SOURCE_VIEWS.length,8);
 assert.equal(Object.values(HUNTER_COUNTS).reduce((sum,n)=>sum+n,0)*8,336);
 let count=0;
 for(const [clip,frames] of Object.entries(HUNTER_COUNTS)){
  assert.equal(sheets[clip].width,frames*HUNTER_CELL);
  assert.equal(sheets[clip].height,8*HUNTER_CELL);
  for(let row=0;row<8;row++){
   const poses=new Set(),bottoms=[],colors=new Set();
   for(let frame=0;frame<frames;frame++){
    const data=pixels(clip,row,frame),b=bounds(data);
    assert.ok(b.count>250,clip+'/'+row+'/'+frame+' full-body missing: '+b.count);
    assert.ok(b.left>=2&&b.right<=HUNTER_CELL-3&&b.top>=1&&b.bottom<=HUNTER_CELL-6,
     clip+'/'+row+'/'+frame+' clipped '+JSON.stringify(b));
    if(clip==='walk'||clip==='idle')bottoms.push(b.bottom);
    poses.add(Buffer.from(data).toString('base64'));
    if(frame===0)for(let i=0;i<data.length;i+=4){
     if(data[i+3]>180)colors.add([data[i],data[i+1],data[i+2]].join(','));
    }
    count++;
   }
   assert.ok(colors.size>45,clip+'/'+row+' lost the illustrated art palette: '+colors.size);
   if(clip==='walk')assert.ok(poses.size>=5,row+' frozen walk');
   if(clip==='idle')assert.ok(new Set(bottoms).size<=3,row+' idle foot instability');
   if(clip==='walk')assert.ok(Math.max(...bottoms)-Math.min(...bottoms)<=3,row+' floating foot');
  }
 }
 assert.equal(count,336);
 const silhouettes=new Set(Array.from({length:8},(_,row)=>
  Buffer.from(pixels('idle',row,0)).toString('base64')));
 assert.equal(silhouettes.size,8);
});
test('each release socket points at a painted bow pixel and emits exactly once in all eight directions',()=>{
 const atlas={ready:true,sockets};
 for(let row=0;row<8;row++)for(const clip of ['attack','special']){
  const tip=sockets[clip][row],data=pixels(clip,row,3),i=(tip.y*HUNTER_CELL+tip.x)*4;
  assert.ok(data[i+3]>125,'detached socket '+clip+'/'+row);
  assert.ok(Math.hypot(tip.x-HUNTER_BOW_HINTS[row][0],tip.y-HUNTER_BOW_HINTS[row][1])<26);
  assert.deepEqual(hunterIllustratedSocket(sheets[clip],row,3),tip);
  const a=Math.PI/2+row*Math.PI/4,d={x:Math.cos(a),y:Math.sin(a)};
  assert.equal(hunterFacing(d),row);
  const p={kind:'hunter',x:150,y:152,hp:100,direction:d,
   heroAction:{clip,duration:1,elapsed:.5,direction:d}};
  assert.equal(hunterPose(p).frame,3);
  const shot=hunterProductionShot(p,p.heroAction,atlas);
  assert.equal(shot.x,150+tip.x-HUNTER_ANCHOR.x);
  assert.equal(shot.y,152+tip.y-HUNTER_ANCHOR.y);
  assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-9);
 }
});
test('normal arrow and seven-shot volley keep the engine release tied to the 3/6 artwork',()=>{
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
  attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const g=new Game(defaultProgress(),input);g.start('hunter',321);
  const a=Math.PI/2+row*Math.PI/4,d={x:Math.cos(a),y:Math.sin(a)},p=g.player;
  p.direction=d;
  if(clip==='attack')g.attack();else g.ability();
  const action=p.heroAction;
  const origin=heroShot(p,{...action,elapsed:action.duration*.5});
  g.updateHeroAction(action.duration*.5);
  assert.equal(g.projectiles.length,clip==='attack'?1:7,clip+'/'+row);
  for(const arrow of g.projectiles){
   assert.ok(Math.abs(arrow.x-origin.x)<1e-8);
   assert.ok(Math.abs(arrow.y-arrow.visualHeight-origin.y)<1e-8);
  }
 }
});
test('rendered production hunter and same-art class preview work in all eight facings and clips',async()=>{
 assert.equal(hunterProductionEnabled(new URLSearchParams()),true);
 assert.equal(hunterProductionEnabled(new URLSearchParams('oldHunterArt=1')),false);
 assert.equal(hunterProductionEnabled(new URLSearchParams('legacyHeroArt=1')),false);
 const atlas=new HunterProductionAtlas(()=>createCanvas(1,1),sourceLoader);
 await atlas.loading;
 assert.equal(atlas.failed,false);assert.equal(atlas.ready,true);
 const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');
 for(let row=0;row<8;row++)for(const clip of Object.keys(HUNTER_COUNTS)){
  const a=Math.PI/2+row*Math.PI/4,d={x:Math.cos(a),y:Math.sin(a)};
  const p={kind:'hunter',x:128,y:126,hp:100,direction:d,
   moving:clip==='walk',walkDistance:37,heroMoveDirection:d};
  if(clip==='death'){p.hp=0;p.heroDeathElapsed=.75;}
  else if(!['idle','walk'].includes(clip))p.heroAction={clip,direction:d,duration:1,elapsed:.5};
  ctx.clearRect(0,0,256,256);
  assert.equal(atlas.draw(ctx,p,.7),true);
  const dpx=ctx.getImageData(0,0,256,256).data;let n=0;
  for(let i=3;i<dpx.length;i+=4)if(dpx[i]>70)n++;
  assert.ok(n>280,clip+'/'+row+' disappeared');
 }
 ctx.clearRect(0,0,256,256);
 assert.equal(atlas.preview(ctx,256,256,.3),true);
 let n=0;const data=ctx.getImageData(0,0,256,256).data;
 for(let i=3;i<data.length;i+=4)if(data[i]>100)n++;
 assert.ok(n>250,'class preview missing illustrated hunter');
});
