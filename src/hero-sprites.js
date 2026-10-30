import {drawLocomotion} from './locomotion.js?v=0.29.0';
import {heroShot} from './hero-aim.js?v=0.29.0';
import {HERO_KINDS,heroPose} from './hero-animation.js?v=0.29.0';

export class HeroSpriteAtlas{
 constructor(){
  this.kind=null;this.ready=false;this.failed=false;this.images={};this.previews={};this.generation=0;
  this.previewLoading=Promise.all(['warrior',...HERO_KINDS].map(async kind=>{
   try{const image=await this.loadImage(new URL(kind==='warrior'?'../assets/knight/preview.png?v=0.28.0':'../assets/heroes/'+kind+'/preview.png?v=0.28.0',import.meta.url));this.previews[kind]=image;}
   catch{/* Menus retain the small legacy preview on an asset failure. */}
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
  this.kind=kind;this.ready=false;this.failed=false;this.images={};const generation=++this.generation;
  this.loading=(async()=>{
   try{
    const base=new URL('../assets/heroes/'+kind+'/',import.meta.url);
    const response=await fetch(new URL('atlas.json?v=0.29.0',base));
    if(!response.ok)throw new Error('Hero manifest unavailable: '+kind);
    const manifest=await response.json(),images={};
    await Promise.all(['down','right','up','left'].map(async face=>{images[face]=await this.loadImage(new URL(face+'.png?v=0.28.0',base));}));
    if(manifest.aimRig)images.aim=await this.loadImage(new URL('aim.png?v=0.28.1',base));
    if(manifest.locomotion)images.legs=await this.loadImage(new URL(manifest.locomotion.file+'?v=0.29.0',base));
    if(generation!==this.generation)return;
    this.images=images;this.manifest=manifest;this.ready=true;
   }catch(error){if(generation===this.generation){this.failed=true;console.warn('Hero graphics unavailable; retaining legacy fallback.',error);}}
  })();
 }
 release(){this.generation++;this.kind=null;this.ready=false;this.images={};this.manifest=null;}
 draw(ctx,p,time){
  if(!this.ready||p.kind!==this.kind)return false;
  const pose=heroPose(p,time);
  const aiming=this.manifest.aimRig&&(pose.clip==='walk'||pose.clip==='attack'||(p.kind==='hunter'&&pose.clip==='special'));
  const f=aiming?this.manifest.aimRig.frames[pose.face][pose.frame]:this.manifest.frames[pose.face][pose.row*6+pose.frame];
  const image=aiming?this.images.aim:this.images[pose.face];
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha=.65;
  const shot=aiming?heroShot(p):null;
  if(aiming&&shot.aim.y<-.3)this.drawWeapon(ctx,p,pose,shot);
  drawLocomotion(ctx,p,pose,this.manifest.locomotion,this.images.legs,()=>{
  if(f.flipX){const grounded=pose.clip==='walk'&&this.manifest.locomotion,scale=grounded?76/f.h:1;ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(-1,1);ctx.drawImage(image,f.x,f.y,f.w,f.h,-(grounded?(f.walkRootX??f.anchorX):f.anchorX)*scale,grounded?-68:-f.anchorY,f.w*scale,f.h*scale);}
  else{
   const grounded=pose.clip==='walk'&&this.manifest.locomotion,scale=grounded?76/f.h:1;
   const anchorX=(grounded?(f.walkRootX??f.anchorX):f.anchorX)*scale;
   const anchorY=grounded?76-8:f.anchorY;
   ctx.drawImage(image,f.x,f.y,f.w,f.h,Math.round(p.x-anchorX),Math.round(p.y-anchorY),f.w*scale,f.h*scale);
  }
  });
  if(aiming&&shot.aim.y>=-.3)this.drawWeapon(ctx,p,pose,shot);
  ctx.restore();return true;
 }
 drawWeapon(ctx,p,pose,shot){
  const f=this.manifest.aimRig.weapons[pose.clip==='walk'?0:pose.frame];
  ctx.save();ctx.translate(shot.mount.x,shot.mount.y);ctx.rotate(shot.angle);
  if(shot.aim.x<0)ctx.scale(1,-1);
  ctx.drawImage(this.images.aim,f.x,f.y,f.w,f.h,-f.anchorX,-f.anchorY,f.w,f.h);
  ctx.restore();
 }
 preview(ctx,kind,width,height,time){
  const image=this.previews[kind];if(!image)return false;
  const frame=Math.floor(time*4)%6,size=image.height,scale=Math.min(width/96,height/88);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
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
