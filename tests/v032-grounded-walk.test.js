import test from 'node:test';
import assert from 'node:assert/strict';
import {findGroundContact,groundPivotForFrame,walkFrameAnchorY,calibrateWalkPivots,WALK_FOOT_OFFSET} from '../src/grounded-walk.js';

test('boot contact ignores an isolated sword tip or cloak pixel',()=>{
 const width=48,height=80,raw=new Uint8ClampedArray(width*height*4);
 const paint=(x,y)=>{raw[(y*width+x)*4+3]=255;};
 paint(3,79); // outlying weapon pixel must not define grounded feet
 for(let x=16;x<23;x++)paint(x,68);
 for(let x=24;x<31;x++)paint(x,66);
 assert.equal(findGroundContact(raw,width,height,24),68);
 assert.equal(groundPivotForFrame({anchorY:57},68),68-WALK_FOOT_OFFSET);
 assert.equal(groundPivotForFrame({anchorY:57},null),57);
});

test('foot pivots are only used on walking poses; attacks stay intact',()=>{
 const f={anchorY:61};
 const pivots={down:[65,66,67]};
 for(const [clip,expected] of [['walk',66],['idle',61],['attack',61],['special',61],['hurt',61],['dash',61],['death',61]])
  assert.equal(walkFrameAnchorY(pivots,{clip,face:'down',frame:1},f),expected);
});

test('calibration extracts all directions and frames at decode time',()=>{
 const faces=['down','right','up','left'],images=Object.fromEntries(faces.map(face=>[face,{}]));
 const frame={x:0,y:0,w:48,h:80,anchorX:24,walkRootX:24,anchorY:61};
 const manifest={frames:Object.fromEntries(faces.map(face=>[face,Array.from({length:12},()=>({...frame}))]))};
 const canvas={width:0,height:0,getContext(){return context;}};
 const context={
  clearRect(){},drawImage(){},get imageSmoothingEnabled(){return false;},set imageSmoothingEnabled(_) {},
  getImageData(){const pixels=new Uint8ClampedArray(canvas.width*canvas.height*4);
   for(let x=15;x<33;x++)pixels[(69*canvas.width+x)*4+3]=255;
   return {data:pixels};
  }
 };
 const result=calibrateWalkPivots(manifest,images,6,()=>canvas);
 for(const face of faces){assert.equal(result[face].length,6);assert.ok(result[face].every(y=>y===60));}
});
