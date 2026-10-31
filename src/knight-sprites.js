import {prepareWalkPivots,walkFrameAnchorY} from './grounded-walk.js?v=0.32.0';
import {knightPose} from './knight-animation.js?v=0.31.0';

// Four compact, decoded-once PNG atlases. Source frames include the sword;
// never draw the old floating weapon on top of this character.
export class KnightSpriteAtlas{
 constructor(imageFactory=()=>new Image()){
  this.images={};this.ready=false;this.failed=false;this.manifest=null;
  this.loading=this.load(imageFactory);
 }
 async load(imageFactory){
  try{
   const response=await fetch(new URL('../assets/knight/atlas.json?v=0.29.0',import.meta.url));
   if(!response.ok)throw new Error('Knight atlas manifest unavailable');
   this.manifest=await response.json();
   await Promise.all(['down','right','up','left'].map(async face=>{
    const image=imageFactory();image.decoding='async';
    await new Promise((resolve,reject)=>{
     image.onload=resolve;image.onerror=reject;
     image.src=new URL('../assets/knight/'+face+'.png?v=0.27.0',import.meta.url).href;
    });
    if(image.decode)await image.decode();
    this.images[face]=image;
   }));
   this.walkPivots=prepareWalkPivots(this.manifest,this.images,8);
   this.ready=true;
  }catch(error){this.failed=true;console.warn('Knight graphics unavailable; using cached fallback.',error);}
 }
 draw(ctx,p,time){
  if(!this.ready)return false;
  const pose=knightPose(p,time),f=this.manifest.frames[pose.face][pose.row*8+pose.frame];
  pose.gaitTime=time;
  const image=this.images[pose.face];
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha=.65;
  // Draw the complete hand-authored animation frame.  Splitting an oversized
  // static cape/torso from tiny procedural legs caused visible body seams and
  // made the legs disappear behind the clothing in side and back views.
  // Never composite that experimental garment sheet over this character.
  const rootX=pose.clip==='walk'?(f.walkRootX??f.anchorX):f.anchorX;
  ctx.drawImage(image,f.x,f.y,f.w,f.h,
   Math.round(p.x-rootX),Math.round(p.y-walkFrameAnchorY(this.walkPivots,pose,f)),f.w,f.h);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time){
  if(!this.ready)return false;
  const frame=Math.floor(time*5)%8,f=this.manifest.frames.down[frame];
  const scale=Math.min(width/100,height/90);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.images.down,f.x,f.y,f.w,f.h,
   Math.round(width/2-f.anchorX*scale),Math.round(height*.87-f.anchorY*scale),f.w*scale,f.h*scale);
  return true;
 }
}

// Short bounded world-space effects leave enemy telegraphs readable.
export function drawKnightEffect(ctx,e,alpha){
 const t=1-alpha,whirl=e.type==='knight-whirl',finisher=e.step===3;
 ctx.save();ctx.translate(e.x,e.y-10);ctx.rotate(e.angle||0);
 ctx.globalAlpha=alpha*.78;
 const r=e.radius*(.78+t*.22),reverse=e.step===2?-1:1;
 ctx.scale(1,.64);ctx.lineCap='round';
 for(let i=0;i<3;i++){
  ctx.lineWidth=(whirl?10:finisher?9:6)-i*2;
  ctx.strokeStyle=i===2?'#fff8e4':finisher||whirl?'#e8ba70':'#a5c8d5';
  ctx.beginPath();
  ctx.arc(0,0,r-i*4,whirl?t*3:-.95*reverse,whirl?t*3+Math.PI*1.65:1.05*reverse,reverse<0);
  ctx.stroke();
 }
 if(finisher||whirl){
  for(let i=0;i<12;i++){
   const a=i*2.399+(e.angle||0),d=(22+i%3*9)+t*r;
   ctx.fillStyle=i%3?'#bba38c':'#ffe5b1';
   ctx.fillRect(Math.round(Math.cos(a)*d),Math.round(Math.sin(a)*d),i%3?3:5,3);
  }
 }
 ctx.restore();
}
