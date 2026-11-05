import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadImage,createCanvas} from '@napi-rs/canvas';
import {KNIGHT_SIDE_053,knightSide053DirectionRow,knightSide053Impact} from '../src/knight-side-053.js';
import {knightFinalFrame} from '../src/knight-final.js';
import {KNIGHT_CLIPS} from '../src/knight-animation.js';

const source=new URL('../assets/knight/side-053/',import.meta.url);
const cell=createCanvas(72,72),ctx=cell.getContext('2d',{willReadFrequently:true});
const minFrames={idle:4,walk:8,attack1:8,attack2:8,attack3:9,recovery:5,
 special:7,dash:8,hurt:5,death:8};
const rowDirections={1:{x:-1,y:1},2:{x:-1,y:0},6:{x:1,y:0},7:{x:1,y:1}};
function inspect(img,f,row){
 ctx.clearRect(0,0,72,72);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(img,f*72,row*72,72,72,0,0,72,72);
 const data=ctx.getImageData(0,0,72,72).data;
 let colored=0,edge=0,ground=0,legHash=2166136261,hash=2166136261;
 for(let y=0;y<72;y++)for(let x=0;x<72;x++){
  const i=(y*72+x)*4;
  if(data[i+3]>60){
   colored++;
   if(x===0||y===0||x===71||y===71)edge++;
   if(x>=20&&x<=53&&y>=54&&y<=65)ground++;
  }
  const value=(data[i]<<24)|(data[i+1]<<16)|(data[i+2]<<8)|data[i+3];
  hash=Math.imul(hash^value,16777619);
  if(x>=20&&x<=53&&y>=46&&y<=65)legHash=Math.imul(legHash^value,16777619);
 }
 return {colored,edge,ground,hash:hash>>>0,legHash:legHash>>>0,
  pixels:ctx.getImageData(0,0,72,72).data};
}
test('the four remaining directions contain 304 complete transparent cells across all ten clips',async()=>{
 let cells=0;
 assert.equal(KNIGHT_SIDE_053.perDirectionFrames,76);
 assert.equal(KNIGHT_SIDE_053.illustratedFrames,304);
 assert.deepEqual(KNIGHT_SIDE_053.rows,[1,2,6,7]);
 assert.equal(KNIGHT_SIDE_053.artistApproved,false);
 for(const [clip,count] of Object.entries(KNIGHT_SIDE_053.frameCounts)){
  const image=await loadImage(await readFile(new URL(clip+'-side.png',source)));
  assert.equal(image.width,count*72,'wrong sprite width '+clip);
  assert.equal(image.height,8*72,'wrong sprite height '+clip);
  for(const row of KNIGHT_SIDE_053.rows){
   const variants=new Set(),legs=new Set();
   for(let f=0;f<count;f++){
    const result=inspect(image,f,row);
    assert.ok(result.colored>=420,clip+' '+row+' '+f+' missing painted body');
    assert.equal(result.edge,0,clip+' '+row+' '+f+' image clipped');
    assert.ok(result.ground>=20,clip+' '+row+' '+f+' has no boots on floor');
    variants.add(result.hash);legs.add(result.legHash);cells++;
   }
   assert.ok(variants.size>=minFrames[clip],clip+' '+row+' frozen animation');
   if(clip==='walk')assert.equal(legs.size,8,'both legs must alternate');
   if(clip==='idle')assert.equal(legs.size,1,'idle must keep feet steady');
  }
 }
 assert.equal(cells,304);
});
test('sword impact coordinates match an actual nontransparent blade tip in all four directions',async()=>{
 const hero={x:350,y:450};
 const contact={attack1:3,attack2:4,attack3:5,special:3};
 let checked=0;
 for(const [clip,contactIndex] of Object.entries(contact)){
  const image=await loadImage(await readFile(new URL(clip+'-side.png',source)));
  for(const [rowText,direction] of Object.entries(rowDirections)){
   const row=Number(rowText);
   assert.equal(knightSide053DirectionRow(direction),row);
   const tip=knightSide053Impact(hero,direction,clip,true);
   assert.equal(tip.row,row);
   assert.equal(knightSide053Impact(hero,direction,clip,false),null);
   assert.ok(tip.y<hero.y+30,'sword impact far from body');
   // Reverse the one-time source-pixel normalization before testing the
   // blade pixel in the unscaled PNG.
   const sx=KNIGHT_SIDE_053.normalization.xByRow[row],sy=KNIGHT_SIDE_053.normalization.otherY;
   const x=(tip.x-hero.x)/(1.8*sx)+36,y=(tip.y-hero.y)/(1.8*sy)+59;
   const tile=inspect(image,contactIndex,row);
   const px=Math.round(x),py=Math.round(y);
   let touches=false;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const sx=px+dx,sy=py+dy;
    if(sx>=0&&sx<72&&sy>=0&&sy<72&&tile.pixels[(sy*72+sx)*4+3]>60)touches=true;
   }
   assert.ok(touches,'tip detached from image for '+clip+' facing '+row);
   assert.equal(Math.floor(KNIGHT_CLIPS[clip].hitFrame/KNIGHT_CLIPS[clip].frames*
    KNIGHT_SIDE_053.frameCounts[clip]),contactIndex,'event tick diverged '+clip);
   checked++;
  }
 }
 assert.equal(checked,16);
});
test('the complete eight-direction preview uses PNGs only behind an explicit safety gate',async()=>{
 const renderer=await readFile(new URL('../src/knight-final.js',import.meta.url),'utf8');
 const game=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 assert.match(renderer,/has\('previewKnightFinal'\)/);
 assert.match(renderer,/loadKnightSideReviewSheets\(factory,north\)/);
 assert.match(renderer,/createKnightRebornSheets\(factory\)/);
 assert.match(game,/knightSide053Impact\(p,aim,action.clip,fullPreview\)/);
 const producer=await readFile(new URL('../tools/generate-knight-side-053.py',import.meta.url),'utf8');
 assert.match(producer,/def combat_pose\(/);
 assert.match(producer,/def render_motion\(/);
 assert.match(producer,/def death_pose\(/);
});
test('the frame clock selects eight separate directions and never freezes long movement',()=>{
 const combos=['attack1','attack2','attack3','special','recovery','hurt','dash','death'];
 for(let row=0;row<8;row++){
  const angle=Math.PI/2+Math.PI/4*row;
  const direction={x:Math.cos(angle),y:Math.sin(angle)};
  const hero={kind:'warrior',hp:100,direction,knightMoveDirection:direction,moving:true,knightWalkDistance:0};
  const sampled=new Set();
  for(let i=0;i<16;i++){
   hero.knightWalkDistance=i*12;
   const f=knightFinalFrame(hero,5);
   assert.equal(f.row,row);assert.ok(f.index>=0&&f.index<8);
   sampled.add(f.index);
  }
  assert.equal(sampled.size,8,'walk freezes in direction '+row);
  for(const clip of combos){
   hero.moving=false;hero.knightAction={clip,elapsed:.45,duration:1,direction};
   const f=knightFinalFrame(hero,0);
   assert.equal(f.row,row);assert.equal(f.clip,clip);
   assert.ok(f.index>=0&&f.index<KNIGHT_SIDE_053.frameCounts[clip]);
   hero.knightAction=null;
  }
 }
});
