import {COMPANION_KINDS,companionPose} from './companion-animation.js?v=0.31.0';
const COLORS={bat:['#dec7ff','#9470ce'],imp:['#ffedb5','#ff864d'],spirit:['#e7efff','#9689ee'],giant:['#ffe6b3','#b59ae8']};
export class CompanionSpriteAtlas{
 constructor(){this.entries={};this.pending={};this.previews={};this.generation=0;this.kind=null;this.active=false;this.failed=new Set();}
 async loadImage(url){const image=new Image();image.decoding='async';await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url.href;});if(image.decode)await image.decode();return image;}
 select(kind,giant=false){
  if(!COMPANION_KINDS.includes(kind))return Promise.resolve();
  this.active=true;
  if(!this.previewLoading)this.previewLoading=Promise.all(COMPANION_KINDS.map(async id=>{try{this.previews[id]=await this.loadImage(new URL('../assets/companions/'+id+'/preview.png?v=0.30.0',import.meta.url));}catch{/* Name and role remain readable. */}}));
  if(this.kind!==kind){for(const key of Object.keys(this.entries))if(key!=='giant')delete this.entries[key];this.kind=kind;}
  this.loading=this.ensure(kind);if(giant)this.giantLoading=this.ensure('giant');return this.loading;
 }
 ensure(kind){
  if(this.failed.has(kind))return Promise.resolve();
  if(this.entries[kind])return Promise.resolve(this.entries[kind]);if(this.pending[kind])return this.pending[kind];
  const generation=this.generation;
  const promise=(async()=>{try{
   const base=new URL('../assets/companions/'+kind+'/',import.meta.url),response=await fetch(new URL('atlas.json?v=0.30.0',base));
   if(!response.ok)throw Error('Companion atlas unavailable '+kind);
   const manifest=await response.json(),image=await this.loadImage(new URL('atlas.png?v=0.30.0',base));
   if(generation!==this.generation||!this.active||(kind!=='giant'&&this.kind!==kind))return;
   return this.entries[kind]={manifest,image};
  }catch(error){if(generation===this.generation){this.failed.add(kind);console.warn('Companion art unavailable',error);}}
  finally{if(this.pending[kind]===promise)delete this.pending[kind];}})();
  this.pending[kind]=promise;return promise;
 }
 release(){this.generation++;this.active=false;this.kind=null;this.entries={};this.pending={};this.failed.clear();}
 draw(ctx,s,time=0){
  const entry=this.entries[s.kind];if(!entry)return false;
  const pose=companionPose(s,time);
  const frame=pose.clip==='summon'||pose.clip==='vanish'?entry.manifest.frames[pose.clip][pose.frame]:entry.manifest.frames[pose.clip][pose.face][pose.frame];
  ctx.save();ctx.imageSmoothingEnabled=false;
  const radius=s.kind==='giant'?33:s.kind==='bat'?12:15;
  ctx.fillStyle='#050e16a8';ctx.beginPath();ctx.ellipse(s.x+1,s.y+9,radius,radius*.35,0,0,Math.PI*2);ctx.fill();
  if(s.kind==='giant'||s.kind==='spirit'){
   ctx.strokeStyle=s.kind==='giant'?'#b5a0db55':'#a195dc33';ctx.lineWidth=1;
   ctx.beginPath();ctx.ellipse(s.x,s.y+8,radius*.8,radius*.28,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.drawImage(entry.image,frame.x,frame.y,frame.w,frame.h,Math.round(s.x-frame.anchorX),Math.round(s.y-frame.anchorY),frame.w,frame.h);
  ctx.restore();return true;
 }
 preview(ctx,kind,width,height,time){
  const image=this.previews[kind];if(!image)return false;const size=image.height,frame=Math.floor(time*5)%6,scale=Math.min(width/size,height/size);
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,frame*size,0,size,size,(width-size*scale)/2,(height-size*scale)/2,size*scale,size*scale);return true;
 }
}
export function drawCompanionEffect(ctx,e,alpha){
 const t=1-alpha,[light,color]=COLORS[e.kind]||COLORS.spirit;
 ctx.save();ctx.globalAlpha=alpha;
 if(e.type==='companion-heal'){
  ctx.strokeStyle='#acdfc8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.quadraticCurveTo((e.x+e.toX)/2,e.y-25,e.toX,e.toY);ctx.stroke();
  for(let i=0;i<6;i++){const f=(t+i/6)%1;ctx.fillStyle=i%2?'#e4ffdc':'#be92e9';ctx.fillRect(e.x+(e.toX-e.x)*f-1,e.y+(e.toY-e.y)*f-Math.sin(f*Math.PI)*20,3,3);}
 }else if(e.type==='companion-release'){
  ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);ctx.fillStyle=light;ctx.fillRect(-3,-3,6,6);ctx.strokeStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,4+t*14,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<5;i++){ctx.fillStyle=i%2?light:color;ctx.fillRect(3+t*22,Math.sin(i*2)*t*18,2,2);}
 }else if(e.kind==='giant'){
  ctx.translate(e.x,e.y);ctx.scale(1,.55);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,16+t*78,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<9;i++){const a=i*2.4,dx=Math.cos(a),dy=Math.sin(a);ctx.strokeStyle=i%2?'#b2a28f':light;ctx.lineWidth=i%2?2:3;ctx.beginPath();ctx.moveTo(dx*9,dy*9);ctx.lineTo(dx*(25+t*40),dy*(25+t*40));ctx.lineTo(dx*(36+t*38)+dy*6,dy*(36+t*38)-dx*6);ctx.stroke();}
  for(let i=0;i<8;i++){const a=i*2.4;ctx.fillStyle=i%2?'#988883':light;ctx.fillRect(Math.cos(a)*(15+t*53),Math.sin(a)*(15+t*53)-Math.sin(t*Math.PI)*17,4,4);}
 }else{
  ctx.translate(e.x,e.y);ctx.strokeStyle=light;ctx.lineWidth=2;for(const offset of [-5,5]){ctx.beginPath();ctx.moveTo(-12+t*20,offset-7);ctx.lineTo(8+t*20,offset+7);ctx.stroke();}
 }
 ctx.restore();
}
export function drawCompanionProjectile(ctx,b){
 if(!b.summonShot)return false;
 const a=Math.atan2(b.vy,b.vx),imp=b.summonShot==='imp',[light,color]=COLORS[imp?'imp':'spirit'];
 ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);ctx.shadowColor=color;ctx.shadowBlur=imp?8:11;
 const flicker=Math.sin(b.life*38)*2;
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-18-flicker,-2);ctx.lineTo(-9,-6);ctx.lineTo(3,-5);ctx.lineTo(9,0);ctx.lineTo(2,6);ctx.lineTo(-10,5);ctx.closePath();ctx.fill();
 ctx.fillStyle=light;ctx.fillRect(-3,-3,7,6);ctx.fillStyle='#fff8e7';ctx.fillRect(1,-1,5,2);
 if(!imp){ctx.strokeStyle='#e2dcff';ctx.lineWidth=1;ctx.strokeRect(-5,-5,10,10);}
 ctx.restore();return true;
}
