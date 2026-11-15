import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {KNIGHT_PRODUCTION_COUNTS,KNIGHT_PRODUCTION_CELL,KNIGHT_PRODUCTION_ANCHOR} from '../src/knight-production.js';
const root=new URL('../assets/knight/fine-074/',import.meta.url),cell=128;
function pixels(image,frame,row){const c=createCanvas(cell,cell),g=c.getContext('2d');g.drawImage(image,frame*cell,row*cell,cell,cell,0,0,cell,cell);return g.getImageData(0,0,cell,cell).data;}
test('fine knight has 608 clean padded native cells and whole identical ready boundaries',async()=>{
 assert.equal(KNIGHT_PRODUCTION_CELL,cell);assert.deepEqual(KNIGHT_PRODUCTION_ANCHOR,{x:64,y:112});
 const idle=await loadImage(await readFile(new URL('idle.png',root)));let checked=0;
 for(const [clip,count] of Object.entries(KNIGHT_PRODUCTION_COUNTS)){
  const image=await loadImage(await readFile(new URL(clip+'.png',root)));
  assert.equal(image.width,count*cell);assert.equal(image.height,cell*8);
  for(let row=0;row<8;row++){
   const poses=new Set(),ready=pixels(idle,0,row);
   for(let f=0;f<count;f++){
    const p=pixels(image,f,row);let top=cell,bottom=-1,left=cell,right=-1,n=0;
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
     const i=(y*cell+x)*4;if(!p[i+3])continue;n++;top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
     assert.ok(!(p[i]>200&&p[i+1]<50&&p[i+2]<50),'red matte residue '+clip+'/'+row+'/'+f);
    }
    assert.ok(n>700,clip+'/'+row+'/'+f+' missing figure');
    assert.ok(left>=1&&right<127&&top>=1&&bottom<127,'clipped '+clip+'/'+row+'/'+f);
    assert.equal(bottom,111,'floating sole '+clip+'/'+row+'/'+f);
    if(clip==='idle'){assert.ok(top>=39&&top<=41,'native body height changes');assert.deepEqual(p,ready);}
    if(clip==='recovery'||clip.startsWith('attack')&&(f===0||f===count-1))assert.deepEqual(p,ready,'identity jump '+clip+'/'+row+'/'+f);
    poses.add(Buffer.from(p).toString('base64'));checked++;
   }
   if(clip==='walk')assert.ok(poses.size>=6,'frozen legs '+row);
   if(clip.startsWith('attack'))assert.ok(poses.size>=5,'missing sword phases '+clip+'/'+row);
  }
 }
 assert.equal(checked,608);
});
