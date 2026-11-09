import {getKnightFinal} from './knight-final.js?v=0.62.0';
import {getHeroRig,previewHeroRig} from './articulated-hero.js?v=0.40.0';
import {drawKnightAction,KNIGHT_ACTION_CLIPS} from './knight-action-sprites.js?v=0.39.0';
import {drawKnightWalk} from './knight-walk.js?v=0.46.0';
import {prepareWalkPivots,walkFrameAnchorY} from './grounded-walk.js?v=0.36.0';
import {knightPose} from './knight-animation.js?v=0.62.0';

// The production knight uses complete-body transparent sprite sheets. Its
// sword and legs are part of every frame; legacy art remains rollback-only.
export class KnightSpriteAtlas{
 constructor(imageFactory=()=>new Image()){
  const flags=typeof window!=='undefined'?new URLSearchParams(window.location.search):new URLSearchParams();
  // Use the one-piece eight-direction pixel frames in the real game by default.
  // Preserve a deliberate rollback switch for comparing older builds.
  this.painted=!flags.has('legacyHeroArt')&&!flags.has('oldKnightPixel')?getKnightFinal():null;
  this.rig=typeof Image!=='undefined'&&!this.painted?getHeroRig('warrior'):null;
  this.images={};this.ready=false;this.failed=false;this.manifest=null;
  this.useLegacyWalk=typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('oldKnightWalk');
  this.loading=this.load(imageFactory);

 }
 async load(imageFactory){
  try{
   if(this.painted){
    await this.painted.loading;
    if(this.painted.ready){this.ready=true;return;}
    // A missing/cached PNG must never leave the player invisible. Fall back
    // to the existing proven original character decoder if atlas loading fails.
    this.painted=null;
    this.rig=typeof Image!=='undefined'?getHeroRig('warrior'):null;
   }
   await this.rig?.loading;
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
   // ?oldKnightWalk=1 compares the previous full-body art without affecting saves.
   if(!this.useLegacyWalk){
    try{
     const walk=imageFactory();walk.decoding='async';
     await new Promise((resolve,reject)=>{
      walk.onload=resolve;walk.onerror=reject;
      walk.src=new URL('../assets/knight/walk-v034.png?v=0.34.0',import.meta.url).href;
     });
     if(walk.decode)await walk.decode();
     if(walk.width!==768||walk.height!==384)throw new Error('Invalid knight walk dimensions');
     this.images.walk=walk;
    }catch(error){console.warn('New knight walk unavailable; using previous art.',error);}
   }
   // The standalone idle/attack art is optional; keep the previously
   // decoded whole-body atlas as a safe fallback on old browser caches.
   const legacyActions=typeof window!=='undefined'&&
    new URLSearchParams(window.location.search).has('oldKnightActions');
   if(this.images.walk&&!legacyActions){
    await Promise.all(KNIGHT_ACTION_CLIPS.map(async clip=>{
     try{
      const image=imageFactory();image.decoding='async';
      await new Promise((resolve,reject)=>{
       image.onload=resolve;image.onerror=reject;
       image.src=new URL('../assets/knight/'+clip+'-v037.png?v=0.37.0',import.meta.url).href;
      });
      if(image.decode)await image.decode();
      if((image.naturalWidth??image.width)!==768||(image.naturalHeight??image.height)!==384)
       throw new Error('Invalid knight '+clip+' sprite dimensions');
      this.images[clip]=image;
     }catch(error){console.warn('Knight '+clip+' sprite unavailable, keeping fallback animation.',error);}
    }));
   }
   this.walkPivots=prepareWalkPivots(this.manifest,this.images,8);
   this.ready=true;
  }catch(error){this.failed=true;console.warn('Knight graphics unavailable; using cached fallback.',error);}
 }
 draw(ctx,p,time){
  if(this.painted)return this.painted.draw(ctx,p,time);
  if(this.rig?.draw(ctx,p,time))return true;
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
  if(!drawKnightAction(ctx,p,pose,this.images)&&
     !drawKnightWalk(ctx,p,pose,this.images.walk)){
   const rootX=pose.clip==='walk'?(f.walkRootX??f.anchorX):f.anchorX;
   ctx.drawImage(image,f.x,f.y,f.w,f.h,
    Math.round(p.x-rootX),Math.round(p.y-walkFrameAnchorY(this.walkPivots,pose,f)),f.w,f.h);
  }
  ctx.restore();return true;
 }
 preview(ctx,width,height,time){
  if(this.painted)return this.painted.preview(ctx,width,height,time);
  if(previewHeroRig(ctx,this.rig,width,height,time))return true;
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  if(this.images.idle||this.images.walk){
   const scale=Math.min(width/96,height/90);
   ctx.drawImage(this.images.idle||this.images.walk,0,0,96,96,
    Math.round(width/2-48*scale),Math.round(height*.87-78*scale),
    96*scale,96*scale);
   return true;
  }
  const frame=Math.floor(time*5)%8,f=this.manifest.frames.down[frame];
  const scale=Math.min(width/100,height/90);
  ctx.drawImage(this.images.down,f.x,f.y,f.w,f.h,
   Math.round(width/2-f.anchorX*scale),Math.round(height*.87-f.anchorY*scale),f.w*scale,f.h*scale);
  return true;
 }
}

// Short bounded world-space effects leave enemy telegraphs readable.
export function drawKnightEffect(ctx,e,alpha){
 const t=1-alpha,whirl=e.type==='knight-whirl',finisher=e.step===3;
 ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);
 const r=whirl?e.radius*(.78+t*.22):e.radius*(.87+t*.13),reverse=e.step===2?-1:1;
 ctx.scale(1,.64);ctx.lineCap='round';
 if(!whirl){
  // Thin directional impact arc only. The actual sword is already attached
  // to the knight's hand, so a giant rotating halo would look like a second sword.
  ctx.globalAlpha=alpha*.42;
  for(let i=0;i<2;i++){
   ctx.lineWidth=i===0?3:1.5;
   ctx.strokeStyle=i?'#e8f4eb':finisher?'#efc77e':'#8fb5c3';
   ctx.beginPath();ctx.arc(0,0,r-i*3,reverse<0?.7:-.7,reverse<0?-.7:.7,reverse<0);ctx.stroke();
  }
  ctx.restore();return;
 }
 ctx.globalAlpha=alpha*.78;
 for(let i=0;i<3;i++){
  ctx.lineWidth=10-i*2;
  ctx.strokeStyle=i===2?'#fff8e4':'#e8ba70';
  ctx.beginPath();ctx.arc(0,0,r-i*4,t*3,t*3+Math.PI*1.65);ctx.stroke();
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
