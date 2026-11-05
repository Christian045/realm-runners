// Optional painted north-facing study (Alpha 0.52), enabled by
// ?previewKnightUp=1 only. Normal gameplay keeps its earlier stable art.
// No complete-character runtime rotation is performed.
// Alpha 0.52 completes the five missing animated states in the three
// upper directions. Four lateral headings still require authored animations,
// so normal gameplay must NOT switch to this experimental art yet.
export const KNIGHT_NORTH_052=Object.freeze({
 rows:Object.freeze([3,4,5]),directions:Object.freeze(['NW','N','NE']),
 animatedClips:Object.freeze(['idle','walk','attack1','attack2','attack3',
  'special','recovery','dash','hurt','death']),
 unfixedClips:Object.freeze([]),
 completeUpperDirections:true,completeAllDirections:false,
 previewScale:.90,framesPerUpperDirection:76,
 completedCells:228
});
// Retain the previous export for existing art and gameplay test consumers.
export const KNIGHT_NORTH_051=KNIGHT_NORTH_052;
const sourceCounts=Object.freeze({idle:6,walk:8,attack1:8,attack2:8,
 attack3:10,special:8,dash:8,hurt:6,death:8,recovery:6});
const newMotion=new Set(['idle','walk','hurt','dash','death']);
const frameCounts=Object.freeze({idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 special:8,dash:8,hurt:6,death:8,recovery:6});
const loadImage=key=>new Promise((resolve,reject)=>{
 const image=new Image();image.decoding='async';
 image.onload=()=>resolve(image);
 image.onerror=()=>reject(new Error('Knight north frame missing: '+key));
 const pack=newMotion.has(key)?'north-052':'north-051';
 const name=key==='facings-v051'?key:key+'-up';
 const cache=newMotion.has(key)?'0.52.0':'0.51.0';
 image.src=new URL('../assets/knight/'+pack+'/'+name+'.png?v='+cache,import.meta.url).href;
});
export async function loadKnightNorthReviewSheets(factory,originals){
 if(typeof Image==='undefined')throw new Error('Browser images unavailable');
 const paths=['facings-v051',...Object.keys(sourceCounts)];
 const values=await Promise.all(paths.map(async key=>[key,await loadImage(key)]));
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
  // A sprite's transparent pixels MUST replace the old figure as well.
  // Drawing an animated frame on top of the static turnaround leaves the
  // old sword, legs and cape visible through its transparent areas.
  for(let row=1;row<8;row++){
   ctx.clearRect(0,row*72,frames*72,72);
   for(let f=0;f<frames;f++)
    ctx.drawImage(pictures['facings-v051'],row*72,0,72,72,f*72,row*72,72,72);
  }
  if(Object.hasOwn(sourceCounts,clip)){
   const north=pictures[clip];
   for(const row of KNIGHT_NORTH_051.rows){
    ctx.clearRect(0,row*72,frames*72,72);
    for(let f=0;f<frames;f++)
     ctx.drawImage(north,f*72,row*72,72,72,f*72,row*72,72,72);
   }
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
export function knightNorth051Impact(player,direction,clip,enabled=false,normalized=false){
 if(!enabled||!player)return null;
 const row=knightNorth051DirectionRow(direction);
 const point=northHitTips[clip]?.[row];
 if(!point)return null;
 const [x,y]=point,scale=KNIGHT_NORTH_051.previewScale;
 // The all-eight 0.53 art preview rescales the baked head/body at their
 // shared foot anchor. The standalone 0.52 north preview stays unchanged.
 const xs=normalized?(row===5?1:1.08):1,ys=normalized?1.075:1;
 return {x:player.x+(x-36)*xs*2*scale,y:player.y+(y-59)*ys*2*scale,row,clip};
}
