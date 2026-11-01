import {drawRobedWalk,isRobedWalker} from './robed-walk.js?v=0.36.0';
import {prepareWalkPivots,walkFrameAnchorY} from './grounded-walk.js?v=0.32.0';
import {heroShot} from './hero-aim.js?v=0.31.0';
import {HERO_KINDS,heroPose} from './hero-animation.js?v=0.31.0';

export class HeroSpriteAtlas{
 constructor(){
  this.kind=null;this.ready=false;this.failed=false;this.images={};this.previews={};this.generation=0;
  this.useLegacyRobedWalk=typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('oldRobedWalk');
  this.previewLoading=Promise.all(['warrior',...HERO_KINDS].map(async kind=>{
   try{
    // Class selection uses the same character design as walking and idle.
    const path=kind==='warrior'?'../assets/knight/preview.png?v=0.28.0':'../assets/heroes/'+kind+'/preview.png?v=0.28.0';
    const legacy=await this.loadImage(new URL(path,import.meta.url));
    this.previews[kind]=legacy;
    if(isRobedWalker(kind)&&!this.useLegacyRobedWalk){
     try{
      this.previews[kind]=await this.loadImage(new URL('../assets/heroes/'+kind+'/walk-v035.png?v=0.35.0',import.meta.url));
     }catch{/* Legacy menu portrait remains when new artwork is unavailable. */}
    }
   }catch{/* Menus retain the small legacy preview on an asset failure. */}
  }));
 }
 async loadImage(url){
  const image=new Image();image.decoding='async';
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url.href;});
  if(image.decode)await image.decode();return image;
 }
 select(kind){
  if(!HERO_KINDS.includes(kind)){this.release();return;}
  if(this.kind===kind)return;
  this.kind=kind;this.ready=false;this.failed=false;this.images={};this.walkPivots={};const generation=++this.generation;
  this.loading=(async()=>{
   try{
    const base=new URL('../assets/heroes/'+kind+'/',import.meta.url);
    const response=await fetch(new URL('atlas.json?v=0.29.0',base));
    if(!response.ok)throw new Error('Hero manifest unavailable: '+kind);
    const manifest=await response.json(),images={};
    await Promise.all(['down','right','up','left'].map(async face=>{images[face]=await this.loadImage(new URL(face+'.png?v=0.28.0',base));}));
    if(manifest.aimRig)images.aim=await this.loadImage(new URL('aim.png?v=0.28.1',base));
    // Optional full-body art for the two robe classes. Keep the original
    // manifest sheets as a safe fallback and for every other action clip.
    if(isRobedWalker(kind)&&!this.useLegacyRobedWalk){
     try{
      const walk=await this.loadImage(new URL('walk-v035.png?v=0.35.0',base));
      if(walk.naturalWidth!==768||walk.naturalHeight!==384)
       throw new Error('Unexpected 8×4 robe walk sheet dimensions');
      images.walk=walk;
     }catch(error){console.warn('Robe walk art unavailable, retaining old walking frames.',error);}
    }
    if(generation!==this.generation)return;
    this.walkPivots=prepareWalkPivots(manifest,images,6);
    this.images=images;this.manifest=manifest;this.ready=true;
   }catch(error){if(generation===this.generation){this.failed=true;console.warn('Hero graphics unavailable; retaining legacy fallback.',error);}}
  })();
 }
 release(){this.generation++;this.kind=null;this.ready=false;this.images={};this.walkPivots={};this.manifest=null;}
 draw(ctx,p,time){
  if(!this.ready||p.kind!==this.kind)return false;
  const pose=heroPose(p,time);pose.gaitTime=time;
  const aiming=this.manifest.aimRig&&(pose.clip==='idle'||pose.clip==='attack'||(p.kind==='hunter'&&pose.clip==='special'));
  // Walk uses the six complete hand-drawn leg strides. The aiming sheet is
  // for standing/attacking: its bracing poses do not contain a real walk.
  const f=aiming?this.manifest.aimRig.frames[pose.face][pose.frame]:this.manifest.frames[pose.face][pose.row*6+pose.frame];
  const image=aiming?this.images.aim:this.images[pose.face];
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha=.65;
  // All clips share the same full-body 96px character model. Damage timing,
  // aim geometry and release VFX remain in the separate gameplay engine.
  if(drawRobedWalk(ctx,p,pose,this.images.walk)){ctx.restore();return true;}
  const shot=aiming?heroShot(p):null;
  if(aiming&&shot.aim.y<-.3)this.drawWeapon(ctx,p,pose,shot);
  // Use each complete authored idle/walk/action frame. The independent
  // procedural legs and static clothes atlas did not share a consistent hip
  // pivot; they produced tiny feet, doubled seams and distorted robes.
  // The dedicated aim rig is retained so ranged weapons keep their mount.
  const rootX=pose.clip==='walk'?(f.walkRootX??f.anchorX):f.anchorX;
  if(f.flipX){
   ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(-1,1);
   ctx.drawImage(image,f.x,f.y,f.w,f.h,-rootX,-walkFrameAnchorY(this.walkPivots,pose,f),f.w,f.h);
  }else{
   ctx.drawImage(image,f.x,f.y,f.w,f.h,
    Math.round(p.x-rootX),Math.round(p.y-walkFrameAnchorY(this.walkPivots,pose,f)),f.w,f.h);
  }
  if(aiming&&shot.aim.y>=-.3)this.drawWeapon(ctx,p,pose,shot);
  ctx.restore();return true;
 }
 drawWeapon(ctx,p,pose,shot){
  const f=this.manifest.aimRig.weapons[(pose.clip==='walk'||pose.clip==='idle')?0:pose.frame];
  ctx.save();ctx.translate(shot.mount.x,shot.mount.y);ctx.rotate(shot.angle);
  if(shot.aim.x<0)ctx.scale(1,-1);
  ctx.drawImage(this.images.aim,f.x,f.y,f.w,f.h,-f.anchorX,-f.anchorY,f.w,f.h);
  ctx.restore();
 }
 preview(ctx,kind,width,height,time){
  const image=this.previews[kind];if(!image)return false;
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  if(isRobedWalker(kind)&&image.naturalWidth===768&&image.naturalHeight===384){
   const scale=Math.min(width/96,height/90);
   // Class selection shows the same front-facing resting figure as the dungeon.
   ctx.drawImage(image,0,0,96,96,Math.round(width/2-48*scale),
    Math.round(height*.87-79*scale),96*scale,96*scale);
   return true;
  }
  const frame=Math.floor(time*4)%6,size=image.height,scale=Math.min(width/96,height/88);
  ctx.drawImage(image,frame*size,0,size,size,Math.round(width/2-size*scale/2),Math.round(height*.87-80*scale),size*scale,size*scale);
  return true;
 }
}

const COLORS={hunter:['#daf1ba','#81b46d'],mage:['#f0dcff','#9a79dc'],glasscannon:['#fff0e1','#ca8fe9'],summoner:['#ddc5ff','#8761c7'],alchemist:['#eeffce','#9fcd6a']};
export function drawHeroRelease(ctx,e,alpha){
 const colors=COLORS[e.kind]||COLORS.mage,t=1-alpha;
 ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);ctx.globalAlpha=alpha;
 if(e.kind==='glasscannon'){
  ctx.fillStyle=colors[1];ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(22+t*12,0);ctx.lineTo(0,5);ctx.fill();
  ctx.fillStyle=colors[0];ctx.fillRect(0,-2,16,4);
 }else if(e.kind==='hunter'){
  ctx.strokeStyle=colors[0];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(18+t*24,0);ctx.stroke();
 }else if(e.kind==='alchemist'){
  for(let i=0;i<5;i++){ctx.fillStyle=i%2?colors[0]:colors[1];ctx.fillRect(-t*18+i*3,Math.sin(i*2)*t*12,2,2);}
 }else{
  ctx.strokeStyle=colors[1];ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,6+t*11,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=colors[0];ctx.fillRect(-3,-2,6,4);
  for(let i=0;i<5;i++){const a=i*2.4+t;ctx.fillRect(Math.cos(a)*t*22,Math.sin(a)*t*22,2,2);}
 }
 ctx.restore();
}
