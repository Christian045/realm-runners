// The full hand-drawn walk sprites remain intact. Only their ground pivots
// are calibrated once, immediately after decoding the PNG atlases.
// The previous procedural leg/garment composite is intentionally unused.
export const WALK_FOOT_OFFSET=9;
export const WALK_FACES=Object.freeze(['down','right','up','left']);

// Find the lowest substantial visible part of the feet in a narrow strip
// around the body pivot. Weapons, bows, swinging capes and rifle muzzles
// outside that strip must not define the actor's floor contact.
export function findGroundContact(pixels,width,height,rootX){
 const center=Math.round(rootX),lo=Math.max(0,center-21),hi=Math.min(width-1,center+21);
 const start=Math.max(0,Math.floor(height*.55));
 for(let y=height-1;y>=start;y--){
  let pixelsOnRow=0,neighbours=0,previous=false;
  for(let x=lo;x<=hi;x++){
   const on=pixels[(y*width+x)*4+3]>110;
   if(on){pixelsOnRow++;if(previous)neighbours++;}
   previous=on;
  }
  if(pixelsOnRow>=4&&neighbours>=2)return y;
 }
 return null;
}

export function groundPivotForFrame(frame,contact){
 // The original manifest anchor is the fallback, including when canvas read
 // access is unavailable. A complete sprite is never stretched or sliced.
 if(contact===null||contact===undefined)return frame.anchorY;
 return contact-WALK_FOOT_OFFSET;
}

export function calibrateWalkPivots(manifest,images,framesPerClip,
 canvasFactory=()=>document.createElement('canvas')){
 const result={};
 for(const face of WALK_FACES){
  const sheet=images[face],frames=manifest.frames[face].slice(framesPerClip,framesPerClip*2);
  if(!sheet||frames.length!==framesPerClip)continue;
  const canvas=canvasFactory(),context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)continue;
  const pivots=[];
  for(const frame of frames){
   canvas.width=frame.w;canvas.height=frame.h;
   context.imageSmoothingEnabled=false;
   context.clearRect(0,0,frame.w,frame.h);
   context.drawImage(sheet,frame.x,frame.y,frame.w,frame.h,0,0,frame.w,frame.h);
   const pixels=context.getImageData(0,0,frame.w,frame.h).data;
   const contact=findGroundContact(pixels,frame.w,frame.h,frame.walkRootX??frame.anchorX);
   pivots.push(groundPivotForFrame(frame,contact));
  }
  result[face]=pivots;
 }
 return result;
}

// Safe if a browser/embedded WebView does not expose 2D pixel reads.
export function prepareWalkPivots(manifest,images,framesPerClip,canvasFactory){
 try{return calibrateWalkPivots(manifest,images,framesPerClip,canvasFactory);}
 catch(error){console.warn('Walk foot calibration unavailable; using atlas pivots.',error);return {};}
}

export function walkFrameAnchorY(pivots,pose,frame){
 return pose.clip==='walk'?(pivots?.[pose.face]?.[pose.frame]??frame.anchorY):frame.anchorY;
}
