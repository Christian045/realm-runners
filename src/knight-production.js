// One coherent illustrated set for the released knight, in all eight facings.
export const KNIGHT_PRODUCTION_VERSION='0.61.0';
export const KNIGHT_PRODUCTION_SCALE=.8;
export const KNIGHT_PRODUCTION_COUNTS=Object.freeze({
 idle:6,walk:8,attack1:8,attack2:8,attack3:10,recovery:6,
 special:8,dash:8,hurt:6,death:8
});
export function knightProductionEnabled(params){
 return !['legacyHeroArt','oldKnightPixel','previewPaintedKnight',
  'previewKnightUp','previewKnight053'].some(flag=>params?.has(flag));
}
export async function loadKnightProductionSheets(){
 const sheets=await Promise.all(Object.entries(KNIGHT_PRODUCTION_COUNTS).map(
  ([clip,count])=>new Promise((resolve,reject)=>{
   const image=new Image();image.decoding='async';
   image.onload=()=>{
    if(image.naturalWidth!==count*72||image.naturalHeight!==576){
     reject(new Error('Invalid knight atlas '+clip));return;
    }
    resolve([clip,image]);
   };
   image.onerror=()=>reject(new Error('Missing knight atlas '+clip));
   image.src=new URL('../assets/knight/production-054/'+clip+'.png?v='+KNIGHT_PRODUCTION_VERSION,import.meta.url).href;
  })
 ));
 return Object.fromEntries(sheets);
}
export function knightStrikePlanted(player){
 return player?.kind==='warrior'&&Boolean(player.knightAction?.clip.startsWith('attack'));
}
// Measured native sprite coordinates of each attack's blade contact.
// Rows are S, SW, W, NW, N, NE, E, SE; world origin is the common foot pivot.
const CONTACTS={
 attack1:[[30,60],[7,45],[5,36],[8,27],[39,6],[64,29],[63,35],[68,39]],
 attack2:[[12,61],[5,37],[5,30],[7,31],[36,8],[64,25],[63,28],[68,31]],
 attack3:[[15,62],[7,59],[14,56],[8,39],[31,11],[60,55],[59,54],[59,57]]
};
export function knightProductionImpact(player,direction,clip,params){
 if(!knightProductionEnabled(params))return null;
 const row=((Math.round((Math.atan2(direction.y,direction.x)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
 const point=CONTACTS[clip]?.[row];
 if(!point)return null;
 return {x:player.x+(point[0]-36)*2*KNIGHT_PRODUCTION_SCALE,
  y:player.y+(point[1]-59)*2*KNIGHT_PRODUCTION_SCALE,row,clip};
}
