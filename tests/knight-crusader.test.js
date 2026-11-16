import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KNIGHT_PRODUCTION_COUNTS,KNIGHT_PRODUCTION_CELL,KNIGHT_PRODUCTION_VERSION,
 knightProductionImpact} from '../src/knight-production.js';

const root=new URL('../assets/knight/crusader-075/',import.meta.url),cell=128;
const dirs=['S','SW','W','NW','N','NE','E','SE'];
function imagePixels(image,frame,row){
 const c=createCanvas(cell,cell),g=c.getContext('2d');
 g.drawImage(image,frame*cell,row*cell,cell,cell,0,0,cell,cell);
 return g.getImageData(0,0,cell,cell).data;
}
function chestCross(p){
 let red=0;
 for(let y=66;y<=92;y++)for(let x=44;x<=83;x++){
  const i=(y*cell+x)*4,r=p[i],g=p[i+1],b=p[i+2];
  if(p[i+3]>235&&r>95&&r>g*1.65&&r>b*1.65&&g<115)red++;
 }
 return red;
}

test('crusader identity remains the same throughout all 608 grounded animation cells',async()=>{
 assert.equal(KNIGHT_PRODUCTION_VERSION,'0.75.0');
 assert.equal(KNIGHT_PRODUCTION_CELL,128);
 const standing=await loadImage(await readFile(new URL('idle.png',root)));
 let checked=0;
 for(const [clip,count] of Object.entries(KNIGHT_PRODUCTION_COUNTS)){
  const sheet=await loadImage(await readFile(new URL(clip+'.png',root)));
  assert.equal(sheet.width,count*cell);assert.equal(sheet.height,dirs.length*cell);
  for(let row=0;row<dirs.length;row++){
   const ready=imagePixels(standing,0,row),poses=new Set();
   for(let frame=0;frame<count;frame++){
    const pixels=imagePixels(sheet,frame,row);
    let visible=0,bottom=-1,left=cell,right=-1,top=cell;
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
     const i=(y*cell+x)*4;if(pixels[i+3]===0)continue;
     visible++;top=Math.min(top,y);bottom=Math.max(bottom,y);
     left=Math.min(left,x);right=Math.max(right,x);
     assert.ok(!(pixels[i]>235&&pixels[i+1]<50&&pixels[i+2]<50),
      'red matte leaked into '+clip+'/'+dirs[row]+'/'+frame);
    }
    assert.ok(visible>700,clip+'/'+dirs[row]+'/'+frame+' missing body');
    assert.ok(top>0&&left>0&&right<127,clip+'/'+dirs[row]+'/'+frame+' clipped');
    assert.equal(bottom,111,clip+'/'+dirs[row]+'/'+frame+' floats or sinks');
    if(clip==='idle'||clip==='recovery'||clip.startsWith('attack')&&(frame===0||frame===count-1))
     assert.deepEqual(pixels,ready,clip+'/'+dirs[row]+'/'+frame+' changes character at transition');
    poses.add(Buffer.from(pixels).toString('base64'));checked++;
   }
   if(clip==='walk')assert.ok(poses.size>=6,'frozen walking legs '+dirs[row]);
   if(clip.startsWith('attack'))assert.ok(poses.size>=5,'missing sword sequence '+dirs[row]);
  }
 }
 assert.equal(checked,608);
});

test('red cross is visible at the front, and the back remains a plain ivory surcoat',async()=>{
 const image=await loadImage(await readFile(new URL('idle.png',root)));
 for(const row of [0,1,2,6,7]){
  assert.ok(chestCross(imagePixels(image,0,row))>=18,'missing red cross '+dirs[row]);
 }
 for(const row of [3,4,5]){
  assert.ok(chestCross(imagePixels(image,0,row))<=15,'front cross printed on the back '+dirs[row]);
 }
});

test('all 24 hit sparks touch the bright visible sword blade, including reverse slashes',async()=>{
 for(const [clip,frame] of [['attack1',3],['attack2',4],['attack3',5]]){
  const sheet=await loadImage(await readFile(new URL(clip+'.png',root)));
  for(let row=0;row<8;row++){
   const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
   const hit=knightProductionImpact({kind:'warrior',x:0,y:0},direction,clip,new URLSearchParams());
   const x=hit.x+64,y=hit.y+112,p=imagePixels(sheet,frame,row);
   let nearSteel=false;
   for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=128||yy<0||yy>=128)continue;
    const i=(yy*cell+xx)*4,r=p[i],g=p[i+1],b=p[i+2];
    if(p[i+3]>245&&Math.min(r,g,b)>145&&Math.max(r,g,b)-Math.min(r,g,b)<43)nearSteel=true;
   }
   assert.ok(nearSteel,'hit spark off blade '+clip+'/'+dirs[row]+' at '+x+','+y);
  }
 }
});
