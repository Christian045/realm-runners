// Optional painted north-facing combat study (Alpha 0.51). This file is
// intentionally excluded from default gameplay until all eight directions
// have finished artwork. No complete-body rotation is performed in runtime.
export const KNIGHT_NORTH_051=Object.freeze({
 rows:Object.freeze([3,4,5]),directions:Object.freeze(['NW','N','NE']),
 animatedClips:Object.freeze(['attack1','attack2','attack3','special','recovery']),
 unfixedClips:Object.freeze(['idle','walk','dash','hurt','death']),
 completeAllDirections:false,previewScale:.90
});
const sourceCounts=Object.freeze({attack1:8,attack2:8,attack3:10,special:8,recovery:6});
const frameCounts=Object.freeze({idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 special:8,dash:8,hurt:6,death:8,recovery:6});
const loadImage=path=>new Promise((resolve,reject)=>{
 const image=new Image();image.decoding='async';
 image.onload=()=>resolve(image);
 image.onerror=()=>reject(new Error('Knight north frame missing: '+path));
 image.src=new URL('../assets/knight/north-051/'+path+'.png?v=0.51.0',import.meta.url).href;
});
export async function loadKnightNorthReviewSheets(factory,originals){
 if(typeof Image==='undefined')throw new Error('Browser images unavailable');
 const paths=['facings-v051',...Object.keys(sourceCounts)];
 const values=await Promise.all(paths.map(async key=>[key,await loadImage(key==='facings-v051'?key:key+'-up')]));
 const pictures=Object.fromEntries(values);
 const width=image=>image.naturalWidth||image.width;
 const height=image=>image.naturalHeight||image.height;
 if(width(pictures['facings-v051'])!==576||height(pictures['facings-v051'])!==72)
  throw new Error('Invalid real 8-way knight artwork');
 for(const [clip,n] of Object.entries(sourceCounts)){
  const image=pictures[clip];
  if(width(image)!==n*72||height(image)!==576)
   throw new Error('Invalid north action atlas: '+clip);
 }
 const result={};
 for(const [clip,frames] of Object.entries(frameCounts)){
  const art=factory();
  art.width=frames*72;art.height=8*72;
  const ctx=art.getContext('2d');if(!ctx)throw new Error('No knight sprite canvas');
  ctx.imageSmoothingEnabled=false;
  // South remains the established authored 0.50 animation.
  ctx.drawImage(originals[clip],0,0);
  // Replace distorted 0.50 portraits with true back/diagonal model art.
  // Other facings are still held artwork, not falsely named animations.
  for(let row=1;row<8;row++)for(let f=0;f<frames;f++)
   ctx.drawImage(pictures['facings-v051'],row*72,0,72,72,f*72,row*72,72,72);
  if(Object.hasOwn(sourceCounts,clip)){
   const north=pictures[clip];
   for(const row of KNIGHT_NORTH_051.rows)for(let f=0;f<frames;f++)
    ctx.drawImage(north,f*72,row*72,72,72,f*72,row*72,72,72);
  }
  result[clip]=art;
 }
 return result;
}
const northHitTips=Object.freeze({
 attack1:{3:[38,8],4:[44,9],5:[46,8]},
 attack2:{3:[54,16],4:[60,17],5:[62,16]},
 attack3:{3:[18,13],4:[24,14],5:[68,13]},
 special:{3:[40,6],4:[46,7],5:[46,6]}
});
export function knightNorth051DirectionRow(dir){
 const dx=Number(dir?.x)||0,dy=Number(dir?.y)||0;
 return ((Math.round((Math.atan2(dy,dx)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
}
export function knightNorth051Impact(player,direction,clip,enabled=false){
 if(!enabled||!player)return null;
 const row=knightNorth051DirectionRow(direction);
 const point=northHitTips[clip]?.[row];
 if(!point)return null;
 const [x,y]=point,scale=KNIGHT_NORTH_051.previewScale;
 return {x:player.x+(x-36)*2*scale,y:player.y+(y-59)*2*scale,row,clip};
}
