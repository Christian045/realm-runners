import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage,Image} from '@napi-rs/canvas';
import {KNIGHT_PRODUCTION_COUNTS,KNIGHT_PRODUCTION_SCALE,knightProductionEnabled,knightStrikePlanted,
 knightProductionImpact} from '../src/knight-production.js';
import {KnightFinalAtlas,knightFinalFrame} from '../src/knight-final.js';
import {labSample,LAB_DIRECTIONS} from '../src/animation-lab.js';
import {beginKnightAction,advanceKnightAction,knightPose,KNIGHT_CLIPS} from '../src/knight-animation.js';

const folder=new URL('../assets/knight/production-054/',import.meta.url);
function pixels(image,frame,row){
 const canvas=createCanvas(72,72),ctx=canvas.getContext('2d');
 ctx.drawImage(image,frame*72,row*72,72,72,0,0,72,72);
 return ctx.getImageData(0,0,72,72).data;
}
function bounds(data){
 let left=72,right=-1,top=72,bottom=-1,count=0;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++)if(data[(y*72+x)*4+3]>64){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
 }
 return {left,right,top,bottom,count};
}
test('released knight has 608 complete cells, grounded boots and consistent body scale',async()=>{
 const source=await loadImage(await readFile(new URL('idle.png',folder)));
 let checked=0;
 for(const [clip,frames] of Object.entries(KNIGHT_PRODUCTION_COUNTS)){
  const image=await loadImage(await readFile(new URL(clip+'.png',folder)));
  assert.equal(image.width,frames*72);assert.equal(image.height,576);
  for(let row=0;row<8;row++){
   const baseline=bounds(pixels(source,0,row));
   const feet=new Set(),poses=new Set();
   for(let frame=0;frame<frames;frame++){
    const data=pixels(image,frame,row),box=bounds(data);
    assert.ok(box.count>350,clip+'/'+row+'/'+frame+' missing body');
    assert.ok(box.left>=2&&box.right<=69&&box.top>=2&&box.bottom<=66,'clipped '+clip+'/'+row+'/'+frame);
    assert.ok(box.count>baseline.count*.48&&box.count<baseline.count*1.8,'body changes scale '+clip+'/'+row+'/'+frame);
    if(clip==='walk'&&row===0)assert.ok(box.bottom>=57&&box.bottom<=60,'south foot leaves stride plane');
    else if(clip==='idle'||clip==='walk')assert.equal(box.bottom,60,'floating boots '+clip+'/'+row+'/'+frame);
    const lower=Buffer.from(data.slice(48*72*4,62*72*4)).toString('base64');
    feet.add(lower);poses.add(Buffer.from(data).toString('base64'));
    checked++;
   }
   if(clip==='walk')assert.ok(feet.size>=6,'frozen walk in '+row);
   if(clip==='idle')assert.equal(feet.size,1,'idle feet jitter in '+row);
   if(clip.startsWith('attack'))assert.ok(poses.size>=7,'incomplete attack in '+row);
  }
 }
 assert.equal(checked,608);
});
test('default and previously shared preview links select the released knight',()=>{
 for(const query of ['', '?previewKnightFinal=1','?v=0.54.0']){
  assert.equal(knightProductionEnabled(new URLSearchParams(query)),true);
 }
 for(const query of ['legacyHeroArt=1','oldKnightPixel=1','previewKnightUp=1','previewKnight053=1']){
  assert.equal(knightProductionEnabled(new URLSearchParams(query)),false);
 }
});
test('melee plants boots, dash interrupts it, and movement resumes through recovery',()=>{
 const p={kind:'warrior',hp:100,direction:{x:1,y:0},moving:false};
 beginKnightAction(p,'attack1',.32);
 assert.equal(knightStrikePlanted(p),true);
 let hits=0;
 advanceKnightAction(p,.32,()=>hits++);
 assert.equal(hits,1);assert.equal(knightStrikePlanted(p),false);
 assert.equal(knightPose(p).clip,'recovery');
 p.moving=true;p.knightMoveDirection=p.direction;
 assert.equal(knightPose(p).clip,'walk');
 beginKnightAction(p,'attack2',.32);
 beginKnightAction(p,'dash',.18);
 assert.equal(knightStrikePlanted(p),false);
 assert.equal(knightPose(p).clip,'dash');
});
test('each hit event selects the contact image and its effect touches the blade',async()=>{
 const contacts={attack1:3,attack2:4,attack3:5};
 for(const [clip,frame] of Object.entries(contacts)){
  const image=await loadImage(await readFile(new URL(clip+'.png',folder)));
  for(let row=0;row<8;row++){
   const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
   const p={kind:'warrior',x:0,y:0,hp:100,direction};
   beginKnightAction(p,clip,1,direction);
   advanceKnightAction(p,1,action=>{
    assert.equal(action.elapsed,KNIGHT_CLIPS[clip].hitFrame/8);
    assert.equal(knightFinalFrame(p,0,true).index,frame);
   });
   const tip=knightProductionImpact(p,direction,clip,new URLSearchParams());
   const x=Math.round(tip.x/(2*KNIGHT_PRODUCTION_SCALE)+36),y=Math.round(tip.y/(2*KNIGHT_PRODUCTION_SCALE)+59);
   const data=pixels(image,frame,row);
   let nearby=false;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const px=x+dx,py=y+dy;
    if(px>=0&&px<72&&py>=0&&py<72&&data[(py*72+px)*4+3]>128)nearby=true;
   }
   assert.ok(nearby,'detached blade contact '+clip+'/'+row+' at '+x+','+y);
  }
 }
});
test('normal atlas loads all new art and lab scrubbing advances both idle and walk',async()=>{
 const previousImage=globalThis.Image,previousWindow=globalThis.window;
 class LocalImage extends Image{
  set src(value){super.src=fileURLToPath(new URL(value));}
 }
 globalThis.Image=LocalImage;globalThis.window={location:{search:''}};
 try{
  const atlas=new KnightFinalAtlas(()=>createCanvas(1,1));await atlas.loading;
  assert.equal(atlas.production,true);assert.equal(atlas.failed,false);
  for(const [width,height] of [[32,36],[96,108]]){
   const thumbnail=createCanvas(width,height),ctx=thumbnail.getContext('2d');
   atlas.preview(ctx,width,height,0);
   const pixels=ctx.getImageData(0,0,width,height).data;
   let visible=0,edge=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(pixels[(y*width+x)*4+3]>64){
     visible++;
     if(x===0||y===0||x===width-1||y===height-1)edge++;
    }
   }
   assert.ok(visible>80);assert.equal(edge,0,'cropped helmet in menu');
  }
  for(const clip of ['idle','walk']){
   const hashes=new Set();
   for(const progress of [0,.2,.4,.6,.8]){
    const sample=labSample('warrior',clip,LAB_DIRECTIONS[2],progress);
    const canvas=createCanvas(256,176);
    assert.equal(atlas.draw(canvas.getContext('2d'),sample.player,progress*1.6),true);
    hashes.add(canvas.toBuffer('image/png').toString('base64'));
   }
   assert.ok(hashes.size>=4,'lab is frozen at first '+clip+' frame');
  }
 }finally{globalThis.Image=previousImage;globalThis.window=previousWindow;}
});

test('south walk alternates planted boots with a stable helmet and seamless passing poses',async()=>{
 const sheet=await loadImage(await readFile(new URL('walk.png',folder)));
 const deltas=[];
 for(let frame=0;frame<8;frame++){
  const data=pixels(sheet,frame,0);
  assert.equal(bounds(data).top,15,'helmet drops on frame '+frame);
  const soles=[0,0];
  for(let y=50;y<64;y++)for(let x=27;x<45;x++)if(data[(y*72+x)*4+3]>64){
   const foot=x<36?0:1;soles[foot]=Math.max(soles[foot],y);
  }
  deltas.push(soles[0]-soles[1]);
 }
 assert.equal(deltas[0],0);assert.equal(deltas[4],0);
 for(const frame of [1,2,3])assert.ok(deltas[frame]>0,'left step reverses early at '+frame);
 for(const frame of [5,6,7])assert.ok(deltas[frame]<0,'right step reverses early at '+frame);
 assert.ok(deltas[2]>=5&&deltas[6]<=-5,'both legs must take a full step');
});

test('south combos return to the same ready pose and retain planted boots',async()=>{
 const idle=await loadImage(await readFile(new URL('idle.png',folder)));
 const ready=pixels(idle,0,0);
 for(const clip of ['attack1','attack2','attack3']){
  const sheet=await loadImage(await readFile(new URL(clip+'.png',folder)));
  const count=KNIGHT_PRODUCTION_COUNTS[clip];
  assert.deepEqual(pixels(sheet,0,0),ready,clip+' starts with a different body');
  assert.deepEqual(pixels(sheet,count-1,0),ready,clip+' does not return to ready');
  for(let frame=0;frame<count;frame++){
   const data=pixels(sheet,frame,0);
   for(const [left,right] of [[28,33],[40,46]]){
    let sole=0;
    for(let y=52;y<=62;y++)for(let x=left;x<right;x++)if(data[(y*72+x)*4+3]>64)sole=Math.max(sole,y);
    assert.ok(sole>=58&&sole<=61,clip+'/'+frame+' lifts a planted boot');
   }
  }
 }
 assert.equal(KNIGHT_PRODUCTION_SCALE,.8);
});

test('production shadow touches the sole anchor and follows the smaller scale',async()=>{
 const {Renderer}=await import('../src/render.js');
 const ellipses=[];
 let legacyCalls=0,drawn=false;
 const ctx={save(){},restore(){},beginPath(){},fill(){},ellipse(...args){ellipses.push(args);}};
 const renderer={ctx,shadow(){legacyCalls++;},knight:{ready:true,painted:{production:true},draw(){drawn=true;}}};
 const p={kind:'warrior',x:100,y:200,radius:16,direction:{x:0,y:1},shield:0};
 Renderer.prototype.player.call(renderer,p,0);
 assert.equal(drawn,true);assert.equal(legacyCalls,0);assert.equal(ellipses.length,2);
 for(const [x,y,rx,ry] of ellipses){
  assert.equal(x,p.x);assert.ok(Math.abs(y-p.y)<=1);
  assert.ok(y-ry<=p.y&&y+ry>=p.y+2,'shadow must touch the visible boot plane');
  assert.ok(rx<20&&ry<=4,'shadow is oversized');
 }
 renderer.knight.painted.production=false;
 Renderer.prototype.player.call(renderer,p,0);
 assert.equal(legacyCalls,1,'historical renderer retains its own ground anchor');
});

test('south idle keeps the complete standing body together without a drifting torso seam',async()=>{
 const source=await loadImage(await readFile(new URL('source-S.png',folder)));
 const sheet=await loadImage(await readFile(new URL('idle.png',folder)));
 const wholeBody=pixels(source,0,0);
 for(let frame=0;frame<KNIGHT_PRODUCTION_COUNTS.idle;frame++){
  assert.deepEqual(pixels(sheet,frame,0),wholeBody,'south idle mixes incompatible body halves at '+frame);
 }
});
