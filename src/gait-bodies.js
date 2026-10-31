import {WALK_STRIDE} from './locomotion.js?v=0.31.0';
import {GAIT_BODIES} from './gait-body-frames.js?v=0.31.0';
let pending;
export function loadGaitBodies(imageFactory=()=>new Image()){
 if(!pending)pending=(async()=>{
  const image=imageFactory();image.decoding='async';
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=new URL('../assets/locomotion/garments.png?v=0.31.0',import.meta.url).href;});
  if(image.decode)await image.decode();return image;
 })().catch(error=>{pending=null;throw error;});
 return pending;
}
let cachedKind,cache=new Map();
export function drawGaitBody(ctx,p,pose,image){
 const f=GAIT_BODIES[p.kind]?.[pose.face];if(!f||!image)return false;
 if(cachedKind!==p.kind){cachedKind=p.kind;cache.clear();}
 const phase=pose.clip==='idle'?pose.frame:Math.floor(((p.walkDistance||0)/WALK_STRIDE%1)*8),key=pose.face+pose.clip+phase;
 let canvas=cache.get(key);
 if(!canvas){
  canvas=document.createElement('canvas');canvas.width=f.w+8;canvas.height=f.h+4;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const cycle=phase/(pose.clip==='idle'?(p.kind==='warrior'?8:6):8)*Math.PI*2,bob=Math.round(Math.abs(Math.sin(cycle)));
  // Connected scanlines bend the entire cloth silhouette gently. The waist
  // stays fixed; no garment pixels are erased and no hard hip seam is made.
  for(let y=0;y<f.h;y++){
   const weight=Math.max(0,(y-(f.anchorY-34))/34);
   const sway=Math.round(Math.sin(cycle-y*.035)*Math.min(1,weight)*1.5);
   c.drawImage(image,f.x,f.y+y,f.w,1,4+sway,2+y+bob,f.w,1);
  }
  cache.set(key,canvas);
 }
 ctx.drawImage(canvas,Math.round(p.x-f.anchorX-4),Math.round(p.y-f.anchorY-2));
 return true;
}
