import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HUNTER_STYLE_CELL,HUNTER_STYLE_COUNTS,HUNTER_STYLE_ANCHOR,
 hunterStyleFacing,hunterMageBowLayout,hunterStyledSample,
 recolorMagierToHunter} from '../src/hunter-magestyle.js';
import {HunterProductionAtlas,hunterPose,hunterProductionShot,
 hunterProductionEnabled} from '../src/hunter-production.js';
import {heroShot} from '../src/hero-aim.js';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
const loadMage=async()=>{
 const folder=new URL('../assets/heroes/mage/',import.meta.url);
 const image=await loadImage(await readFile(new URL('knight-style-063/atlas.png',folder)));
 const locomotionImage=await loadImage(await readFile(new URL('locomotion-067/locomotion.png',folder)));
 return {image,locomotionImage};
};
const original=await loadMage();
const atlas=new HunterProductionAtlas(()=>createCanvas(1,1),loadMage);
await atlas.loading;
function pixels(row,clip,frame){
 const canvas=createCanvas(96,96),ctx=canvas.getContext('2d');
 hunterStyledSample(ctx,atlas.action,atlas.walk,row,clip,frame);
 return ctx.getImageData(0,0,96,96).data;
}
function bounds(data){
 let left=96,right=-1,top=96,bottom=-1,count=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]>70){
  left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
 }
 return {left,right,top,bottom,count};
}
test('new Jäger inherits the actual 96-pixel painted magier anatomy rather than old Jäger assets',()=>{
 assert.equal(atlas.ready,true);
 assert.equal(atlas.failed,false);
 assert.equal(HUNTER_STYLE_CELL,96);
 assert.equal(HUNTER_STYLE_ANCHOR.y,88);
 assert.equal(atlas.action.width,1536);
 assert.equal(atlas.action.height,768);
 assert.equal(atlas.walk.width,864);
 assert.equal(atlas.walk.height,768);
 assert.equal(Object.values(HUNTER_STYLE_COUNTS).reduce((a,b)=>a+b,0)*8,368);
});
test('forest fabrics preserve painterly shading and do not alter the magier source art',()=>{
 const neutral=original.image,ctx=createCanvas(1536,768).getContext('2d');
 ctx.drawImage(neutral,0,0);const source=ctx.getImageData(0,0,96,96).data;
 const produced=atlas.action.getContext('2d').getImageData(0,0,96,96).data;
 let changes=0,forest=0;const shades=new Set();
 for(let i=0;i<source.length;i+=4)if(source[i+3]>90&&produced[i+3]>90){
  if(Math.abs(source[i]-produced[i])+Math.abs(source[i+1]-produced[i+1])+Math.abs(source[i+2]-produced[i+2])>15)changes++;
  if(produced[i+1]>produced[i]*1.14&&produced[i+1]>produced[i+2]*1.15){
   forest++;shades.add([produced[i],produced[i+1],produced[i+2]].join(','));
  }
 }
 assert.ok(changes>120,'forest coat was not genuinely transformed');
 assert.ok(forest>120,'forest green is missing');
 assert.ok(shades.size>50,'original fold and shadow details were flattened');
});
test('368 complete poses retain boots, facial silhouette, weapon and eight separate facings',()=>{
 let counted=0;
 for(const [clip,frames] of Object.entries(HUNTER_STYLE_COUNTS)){
  for(let row=0;row<8;row++){
   const distinct=new Set(),feet=[];
   for(let frame=0;frame<frames;frame++){
    const data=pixels(row,clip,frame),b=bounds(data);
    assert.ok(b.count>450,clip+'/'+row+'/'+frame+' empty or tiny '+JSON.stringify(b));
    assert.ok(b.left>=0&&b.right<96&&b.top>=0&&b.bottom<96,clip+'/'+row+'/'+frame+' clipped');
    if(clip==='idle'||clip==='walk')feet.push(b.bottom);
    distinct.add(Buffer.from(data).toString('base64'));counted++;
   }
   if(clip==='walk')assert.equal(distinct.size,8,'one of eight actual walking poses is repeated '+row);
   if(clip==='idle')assert.ok(distinct.size>=3,'idle costume has no motion '+row);
   if(clip==='idle')assert.ok(Math.max(...feet)-Math.min(...feet)<=1,'idle feet float '+row);
   if(clip==='walk')assert.ok(Math.max(...feet)-Math.min(...feet)<=4,'walk feet float '+row);
  }
 }
 assert.equal(counted,368);
 const views=new Set(Array.from({length:8},(_,row)=>Buffer.from(pixels(row,'idle',0)).toString('base64')));
 assert.equal(views.size,8);
});
test('released arrows appear at their actual drawn bow tip in all eight facings',()=>{
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const d={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
  assert.equal(hunterStyleFacing(d),row);
  const bow=hunterMageBowLayout(row,clip,3);
  const data=pixels(row,clip,3),i=(bow.tip.y*96+bow.tip.x)*4;
  assert.ok(data[i+3]>150,'drawn arrow socket is missing '+clip+'/'+row);
  const actor={kind:'hunter',x:128,y:136,hp:100,direction:d,
   heroAction:{clip,elapsed:.5,duration:1,direction:d}};
  assert.equal(hunterPose(actor).frame,3);
  const shot=hunterProductionShot(actor);
  assert.equal(shot.x,128+bow.tip.x-48);
  assert.equal(shot.y,136+bow.tip.y-88);
  assert.deepEqual(heroShot(actor),shot);
  assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-8);
 }
});
test('single arrow and seven-arrow Pfeilhagel preserve the engine release timing',()=>{
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
  attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const game=new Game(defaultProgress(),input);game.start('hunter',42);
  const dir={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
  game.player.direction=dir;
  if(clip==='attack')game.attack();else game.ability();
  const action=game.player.heroAction;
  const shot=heroShot(game.player,{...action,elapsed:action.duration/2});
  game.updateHeroAction(action.duration/2);
  assert.equal(game.projectiles.length,clip==='attack'?1:7,clip+'/'+row);
  for(const projectile of game.projectiles){
   assert.equal(projectile.x,shot.x);
   assert.equal(projectile.y-projectile.visualHeight,shot.y);
  }
 }
});
test('same painterly Jäger image renders in game and the class-selection preview',()=>{
 assert.equal(hunterProductionEnabled(new URLSearchParams()),true);
 assert.equal(hunterProductionEnabled(new URLSearchParams('legacyHeroArt=1')),false);
 assert.equal(hunterProductionEnabled(new URLSearchParams('oldHunterArt=1')),false);
 const canvas=createCanvas(256,256),g=canvas.getContext('2d');
 for(const clip of Object.keys(HUNTER_STYLE_COUNTS))for(let row=0;row<8;row++){
  const d={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
  const p={kind:'hunter',x:128,y:126,hp:100,direction:d,moving:clip==='walk',walkDistance:35,heroMoveDirection:d};
  if(clip==='death'){p.hp=0;p.heroDeathElapsed=.7;}
  else if(!['walk','idle'].includes(clip))p.heroAction={clip,elapsed:.5,duration:1,direction:d};
  g.clearRect(0,0,256,256);assert.equal(atlas.draw(g,p,.8),true);
  const data=g.getImageData(0,0,256,256).data;let n=0;
  for(let i=3;i<data.length;i+=4)if(data[i]>70)n++;
  assert.ok(n>450,clip+'/'+row+' invisible in full renderer');
 }
 g.clearRect(0,0,256,256);
 assert.equal(atlas.preview(g,256,256,.2),true);
 let n=0;for(let i=3,data=g.getImageData(0,0,256,256).data;i<data.length;i+=4)if(data[i]>70)n++;
 assert.ok(n>450,'Jäger preview not visible');
});
