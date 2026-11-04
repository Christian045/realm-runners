import {knightPose} from './knight-animation.js?v=0.31.0';
import {rigFacing} from './articulated-hero.js?v=0.40.0';

// These are five COMPLETE original transparent character animations. The
// renderer only selects an atlas cell; no limb, boot, sword or slash is drawn
// independently at runtime.
export const KNIGHT_SHEET_CELL=144;
export const KNIGHT_SHEET_ANCHOR=Object.freeze({x:72,y:118});
export const KNIGHT_SHEET_FRAMES=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10
});
export const KNIGHT_SHEET_ROWS=8;
const clips=Object.keys(KNIGHT_SHEET_FRAMES);
const clipFor=clip=>Object.hasOwn(KNIGHT_SHEET_FRAMES,clip)?clip:
 clip==='special'?'attack3':clip==='dash'?'walk':'idle';
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export function knightFinalFrame(p,time=0){
 const pose=knightPose(p,time),clip=clipFor(pose.clip),count=KNIGHT_SHEET_FRAMES[clip];
 // Keep the game's existing hit clock: attack 1=3/8, attack 2=4/8,
 // attack 3=4/8. Visual frames alone never modify actual damage timing.
 const index=pose.clip==='idle'||pose.clip==='walk'
  ?Math.floor(pose.frame*count/8)%count
  :clamp(Math.floor(pose.progress*count),0,count-1);
 return {clip,row:rigFacing(pose.direction),index,count,pose};
}
export class KnightFinalAtlas {
 constructor(imageFactory=null){
  this.images={};this.frames=new Map();this.imageReady=false;
  this.ready=false;this.failed=false;
  this.imageFactory=imageFactory;
  this.loading=this.load();
 }
 async load(){
  if(typeof Image==='undefined'&&!this.imageFactory)return;
  try{
   await Promise.all(clips.map(async clip=>{
    const image=this.imageFactory?this.imageFactory():new Image();
    image.decoding='async';
    await new Promise((resolve,reject)=>{
     image.onload=resolve;image.onerror=reject;
     image.src=new URL('../assets/knight/v045/'+clip+'.png?v=0.45.0',import.meta.url).href;
    });
    if(image.decode)await image.decode();
    const width=KNIGHT_SHEET_FRAMES[clip]*KNIGHT_SHEET_CELL;
    const height=KNIGHT_SHEET_ROWS*KNIGHT_SHEET_CELL;
    if((image.naturalWidth||image.width)!==width||
       (image.naturalHeight||image.height)!==height)
      throw new Error('Invalid knight '+clip+' sheet dimensions');
    this.images[clip]=image;
   }));
   this.imageReady=true;this.ready=true;
  }catch(error){
   this.failed=true;this.ready=false;
   console.warn('New original knight art unavailable',error);
  }
 }
 frame(row,clip,index){
  clip=clipFor(clip);
  if(!this.ready)return null;
  const count=KNIGHT_SHEET_FRAMES[clip];
  row=clamp(Math.floor(row),0,7);index=clamp(Math.floor(index),0,count-1);
  const key=clip+':'+row+':'+index;
  if(this.frames.has(key))return this.frames.get(key);
  const canvas=typeof OffscreenCanvas!=='undefined'?
   new OffscreenCanvas(KNIGHT_SHEET_CELL,KNIGHT_SHEET_CELL):
   document.createElement('canvas');
  canvas.width=canvas.height=KNIGHT_SHEET_CELL;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  const cell=KNIGHT_SHEET_CELL;
  g.drawImage(this.images[clip],index*cell,row*cell,cell,cell,0,0,cell,cell);
  // Limit offscreen frame cache; the game draws directly from sprite sheets,
  // so a mobile WebKit GPU must not retain hundreds of duplicate canvases.
  if(this.frames.size>=16)this.frames.delete(this.frames.keys().next().value);
  this.frames.set(key,canvas);
  return canvas;
 }
 draw(ctx,p,time=0){
  if(!this.ready||!ctx?.drawImage)return false;
  const {clip,row,index}=knightFinalFrame(p,time);
  const c=KNIGHT_SHEET_CELL;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invulnerable>0&&p.hp>0&&Math.floor(time*24)%4===0)ctx.globalAlpha*=.65;
  // The boots end 5 world pixels below p.y, above the existing shadow.
  ctx.drawImage(this.images[clip],index*c,row*c,c,c,
   Math.round(p.x-KNIGHT_SHEET_ANCHOR.x),
   Math.round(p.y-KNIGHT_SHEET_ANCHOR.y),c,c);
  ctx.restore();return true;
 }
 preview(ctx,width,height,time=0){
  if(!this.ready)return false;
  ctx.clearRect(0,0,width,height);
  ctx.save();ctx.imageSmoothingEnabled=false;
  const scale=Math.min(width/70,height/73),c=KNIGHT_SHEET_CELL;
  ctx.drawImage(this.images.idle,(Math.floor(time*4)%6)*c,0,c,c,
   Math.round(width*.5-KNIGHT_SHEET_ANCHOR.x*scale),
   Math.round(height*.86-KNIGHT_SHEET_ANCHOR.y*scale),c*scale,c*scale);
  ctx.restore();return true;
 }
}
let singleton=null;
export const getKnightFinal=()=>singleton??(singleton=new KnightFinalAtlas());
