// One coherent illustrated set for the released knight, in all eight facings.
import {KNIGHT_FINE_CONTACTS} from './knight-fine-contacts.js?v=0.74.0';
export const KNIGHT_PRODUCTION_VERSION='0.74.0';
export const KNIGHT_PRODUCTION_CELL=128;
export const KNIGHT_PRODUCTION_ANCHOR=Object.freeze({x:64,y:112});
export const KNIGHT_PRODUCTION_SCALE=.8;
export const KNIGHT_PRODUCTION_COUNTS=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10,recovery:6,
 special:8,dash:8,hurt:6,death:8
});
export function knightProductionEnabled(params){
 return !['legacyHeroArt','oldKnightPixel','previewPaintedKnight',
  'previewKnightUp','previewKnight053'].some(flag=>params?.has(flag));
}
export async function loadKnightProductionSheets(factory){
 const sheets=await Promise.all(Object.entries(KNIGHT_PRODUCTION_COUNTS).map(
  ([clip,count])=>new Promise((resolve,reject)=>{
   const image=new Image();image.decoding='async';image.crossOrigin='anonymous';
   image.onload=()=>{
    if(image.naturalWidth!==count*KNIGHT_PRODUCTION_CELL||image.naturalHeight!==8*KNIGHT_PRODUCTION_CELL){
     reject(new Error('Invalid knight atlas '+clip));return;
    }
    resolve([clip,image]);
   };
   image.onerror=()=>reject(new Error('Missing knight atlas '+clip));
   image.src=new URL('../assets/knight/fine-074/'+clip+'.png?v='+KNIGHT_PRODUCTION_VERSION,import.meta.url).href;
  })
 ));
 return Object.fromEntries(sheets);
}
export function knightStrikePlanted(player){
 return player?.kind==='warrior'&&Boolean(player.knightAction?.clip.startsWith('attack'));
}
// Measured native sprite coordinates of each attack's blade contact.
// Rows are S, SW, W, NW, N, NE, E, SE; world origin is the common foot pivot.
export function knightProductionImpact(player,direction,clip,params){
 if(!knightProductionEnabled(params))return null;
 const row=((Math.round((Math.atan2(direction.y,direction.x)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
 const point=KNIGHT_FINE_CONTACTS[clip]?.[row];
 if(!point)return null;
 return {x:player.x+point[0]-KNIGHT_PRODUCTION_ANCHOR.x,
  y:player.y+point[1]-KNIGHT_PRODUCTION_ANCHOR.y,row,clip};
}
