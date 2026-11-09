import {MAGE_DIAGONAL_SOCKETS} from './mage-diagonal-sockets.js?v=0.62.0';
import {MAGE_SIDE_SOCKETS} from './mage-side-sockets.js?v=0.62.0';
import {MAGE_SOCKETS} from './mage-sockets.js?v=0.62.0';
export const mageFacing=d=>(Math.round((Math.atan2(d?.y??1,d?.x??0)-Math.PI/2)/(Math.PI/4))+8)%8;
const clamp=n=>Math.max(0,Math.min(1,n));
export function magePose(p,time=0,action=p.heroAction){
 let clip=action?.clip||(p.hurtTimer>0?'hurt':p.moving?'walk':'idle');
 let t=action?clamp(action.elapsed/action.duration):clip==='hurt'?clamp(1-p.hurtTimer/.34):0;
 if(p.hp<=0){clip='death';t=clamp((p.heroDeathElapsed||0)/1.04);}
 const direction=(clip==='death'?p.heroDeathDirection:action?.direction)||(clip==='walk'?p.heroMoveDirection:null)||p.direction;
 const row=mageFacing(direction);let frame=0;
 if(clip==='walk')frame=[1,2,3,4][Math.floor((((p.walkDistance||0)%72)+72)%72/18)];
 if(clip==='attack')frame=t<.16?0:t<.5?5:t<.68?6:t<.9?7:0;
 if(clip==='special')frame=t<.12?0:t<.5?8:t<.7?9:t<.9?10:0;
 if(clip==='dash')frame=t<.85?11:0;
 if(clip==='hurt')frame=t<.6?12:t<.9?13:0;
 if(clip==='death')frame=t<.15?12:t<.55?14:15;
 // Whole-body breathing only. Feet and the staff socket share this transform.
 const stretch=clip==='idle'?(1-Math.cos(time*Math.PI*2/2.8))*.009:0;
 // The original east/SE rows show the back of the hood and reuse a left-side
 // staff. Use the matching west/SW poses reflected as a complete body instead.
 // The three back-facing directions have dedicated connected robe/leg poses.
 const mirrored=row>=6,sourceRow=mirrored?(8-row)%8:row;
 const sideFrame=clip==='walk'&&(row===2||row===6)?Math.floor(((((p.walkDistance||0)%72)+72)%72)/12):null;
 const diagonalRow=row===1||row===7?0:row===3||row===5?1:null;
 const diagonalFrame=clip==='walk'&&diagonalRow!==null?Math.floor(((((p.walkDistance||0)%72)+72)%72)/12):null;
 const diagonalMirrored=row===5||row===7;
 return {diagonalRow,diagonalFrame,diagonalMirrored,sideFrame,clip,row,sourceRow,mirrored,frame,stretch,direction:direction||{x:0,y:1},progress:t};
}
let atlas;
export const mageReady=()=>Boolean(atlas?.ready);
export function mageShot(p,action=p.heroAction){
 const pose=magePose(p,0,action),diagonal=pose.diagonalFrame!==null&&atlas?.diagonalImage,tip=diagonal?MAGE_DIAGONAL_SOCKETS[pose.diagonalRow][pose.diagonalFrame]:pose.sideFrame!==null&&atlas?.sideImage?MAGE_SIDE_SOCKETS[pose.sideFrame]:MAGE_SOCKETS[pose.sourceRow][pose.frame];
 // Reflect pixel centres, not pixel edges: x becomes -x-1 on the canvas.
 const x=Math.round(p.x)+((diagonal?pose.diagonalMirrored:pose.mirrored)?-tip[0]-1:tip[0]),y=p.y+tip[1],d=pose.direction;
 const target=action?.target||{x:p.x+d.x*260,y:p.y+d.y*260-27};
 const dx=target.x-x,dy=target.y-y,length=Math.hypot(dx,dy),fallback=Math.hypot(d.x,d.y)||1;
 const aim=length>1e-6?{x:dx/length,y:dy/length}:{x:d.x/fallback,y:d.y/fallback};
 return {x,y,mount:{x,y},aim,angle:Math.atan2(aim.y,aim.x),reach:0,
 face:Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down'};
}
export class MageProductionAtlas{
 constructor(){this.ready=false;this.loading=this.load();}
 async load(){try{
  const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=new URL('../assets/heroes/mage/complete-062/atlas.png?v=0.62.0',import.meta.url).href;});
  await image.decode?.();if(image.width!==1536||image.height!==768)throw Error('Mage atlas dimensions');
  const sideImage=new Image();await new Promise((resolve,reject)=>{sideImage.onload=resolve;sideImage.onerror=reject;sideImage.src=new URL('../assets/heroes/mage/compact-061/side.png?v=0.62.0',import.meta.url).href;});
  await sideImage.decode?.();if(sideImage.width!==576||sideImage.height!==96)throw Error('Mage side walk dimensions');
  const diagonalImage=new Image();await new Promise((resolve,reject)=>{diagonalImage.onload=resolve;diagonalImage.onerror=reject;diagonalImage.src=new URL('../assets/heroes/mage/compact-061/diagonal.png?v=0.62.0',import.meta.url).href;});
  await diagonalImage.decode?.();if(diagonalImage.width!==576||diagonalImage.height!==192)throw Error('Mage diagonal walk dimensions');
  this.diagonalImage=diagonalImage;this.sideImage=sideImage;this.image=image;this.ready=true;
 }catch(e){this.failed=true;console.warn('Mage artwork unavailable, retaining fallback',e);}}
 draw(ctx,p,time=0){if(!this.ready)return false;
  const pose=magePose(p,time),height=96*(1+pose.stretch);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha=.65;
  const diagonal=pose.diagonalFrame!==null&&this.diagonalImage,mirrored=diagonal?pose.diagonalMirrored:pose.mirrored;
  ctx.translate(Math.round(p.x),p.y);if(mirrored)ctx.scale(-1,1);
  const side=pose.sideFrame!==null&&this.sideImage;
  ctx.drawImage(diagonal||side||this.image,(diagonal?pose.diagonalFrame:side?pose.sideFrame:pose.frame)*96,diagonal?pose.diagonalRow*96:side?0:pose.sourceRow*96,96,96,-48,-88*(1+pose.stretch),96,height);
  // Effects and sockets remain in world coordinates, outside the sprite reflection.
  if(mirrored)ctx.scale(-1,1);ctx.translate(-Math.round(p.x),-p.y);
  if(pose.clip==='special'&&pose.progress<.7){
   const s=mageShot(p),power=Math.sin(pose.progress/.7*Math.PI);
   ctx.globalAlpha=.6*power;ctx.fillStyle=p.specialization==='pyromancer'?'#ffb866':p.specialization==='cryomancer'?'#a4efff':'#d8b0ff';
   ctx.beginPath();ctx.arc(s.x,s.y,3+5*power,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();return true;
 }
 preview(ctx,width,height,time){if(!this.ready)return false;ctx.clearRect(0,0,width,height);ctx.save();const scale=Math.min(width/100,height/100);ctx.translate(width/2,height*.9);ctx.scale(scale,scale);this.draw(ctx,{kind:'mage',x:0,y:0,hp:100,direction:{x:0,y:1}},time);ctx.restore();return true;}
}
export function getMageProduction(){if(typeof location!=='undefined'&&new URLSearchParams(location.search).has('legacyHeroArt'))return null;return atlas??=new MageProductionAtlas();}
