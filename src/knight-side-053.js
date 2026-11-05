// Alpha 0.53: isolated four-direction art review for SW, W, E and SE.
// The 304 distinct 72x72 PNG cells are baked from illustrated reference
// figures using separately articulated greaves and weapon arms. Do not treat
// the resulting poses as individually hand-painted assets or as approved art.
export const KNIGHT_SIDE_053=Object.freeze({
 rows:Object.freeze([1,2,6,7]),
 directions:Object.freeze(['SW','W','E','SE']),
 frameCounts:Object.freeze({idle:6,walk:8,attack1:8,attack2:8,attack3:10,
  recovery:6,special:8,dash:8,hurt:6,death:8}),
 perDirectionFrames:76,illustratedFrames:304,
 completeAllDirections:true,artistApproved:false,
 previewScale:0.9,
 normalization:Object.freeze({southX:.85,southY:.90,
  xByRow:Object.freeze([.85,1.08,1.08,1.08,1.08,1.0,1.055,1.055]),
  otherY:1.075})
});
const ROWS=KNIGHT_SIDE_053.rows;
const clipFiles=Object.keys(KNIGHT_SIDE_053.frameCounts);

function readSprite(name){
 return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('Missing 0.53 side knight sprite '+name));
  image.src=new URL('../assets/knight/side-053/'+name+'-side.png?v=0.53.0',import.meta.url).href;
 });
}
export async function loadKnightSideReviewSheets(factory,underlying){
 if(typeof Image==='undefined')throw new Error('Knight 0.53 art requires a browser');
 const sheets=Object.fromEntries(await Promise.all(clipFiles.map(async name=>
  [name,await readSprite(name)])));
 const result={};
 for(const clip of clipFiles){
  const frames=KNIGHT_SIDE_053.frameCounts[clip],source=sheets[clip];
  const width=source.naturalWidth||source.width,height=source.naturalHeight||source.height;
  if(width!==frames*72||height!==8*72)
   throw new Error('Side knight atlas has invalid cell grid: '+clip+' '+width+'x'+height);
  const img=factory();img.width=frames*72;img.height=8*72;
  const ctx=img.getContext('2d');
  if(!ctx)throw new Error('No side knight drawing surface');
  ctx.imageSmoothingEnabled=false;
  // Retain already loaded South, North, NW and NE. Replace only the actual
  // four freshly illustrated side views without runtime mirrors/rotations.
  ctx.drawImage(underlying[clip],0,0);
  for(const row of ROWS)
   ctx.drawImage(source,0,row*72,frames*72,72,0,row*72,frames*72,72);
  // Reframe all eight painted views once when baking the preview atlas.
  // The initial South illustration was visibly broader/taller than the other
  // seven imported turnaround drawings; normalize on the common foot pivot
  // without runtime body transformations or bilinear sampling.
  const normalized=factory();normalized.width=frames*72;normalized.height=8*72;
  const target=normalized.getContext('2d');
  if(!target)throw new Error('No knight normalization drawing surface');
  target.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++){
   const xScale=KNIGHT_SIDE_053.normalization.xByRow[row];
   const yScale=row===0?KNIGHT_SIDE_053.normalization.southY:
    KNIGHT_SIDE_053.normalization.otherY;
   const w=Math.round(72*xScale),h=Math.round(72*yScale);
   const dx=Math.round(36*(1-xScale)),dy=Math.round(59*(1-yScale));
   for(let frame=0;frame<frames;frame++)
    target.drawImage(img,frame*72,row*72,72,72,
     frame*72+dx,row*72+dy,w,h);
  }
  result[clip]=normalized;
 }
 return result;
}
// Exact blade-tip positions (native 72px source pixels) at each existing
// action-contact frame, measured from the pose baker. Sword hit VFX is
// allowed to move in the *preview only* and cannot alter damage calculations.
const TIPS=Object.freeze({
 attack1:Object.freeze({1:[16.1,45.4],2:[6.1,33.5],6:[62.9,33.5],7:[55.9,46.4]}),
 attack2:Object.freeze({1:[16,47.5],2:[4.8,38.4],6:[63.4,31.5],7:[57.4,41.9]}),
 attack3:Object.freeze({1:[12.9,39.9],2:[4,27.6],6:[65.2,27.6],7:[59.1,40.9]}),
 special:Object.freeze({1:[13,37.8],2:[5.9,22.8],6:[66.2,33.7],7:[55.3,49]})
});
export function knightSide053DirectionRow(dir){
 const x=Number(dir?.x)||0,y=Number(dir?.y)||0;
 return ((Math.round((Math.atan2(y,x)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
}
export function knightSide053Impact(player,direction,clip,enabled=false){
 if(!enabled||!player)return null;
 const row=knightSide053DirectionRow(direction),point=TIPS[clip]?.[row];
 if(!point)return null;
 const scale=KNIGHT_SIDE_053.previewScale;
 return {x:player.x+(point[0]-36)*KNIGHT_SIDE_053.normalization.xByRow[row]*scale*2,
  y:player.y+(point[1]-59)*KNIGHT_SIDE_053.normalization.otherY*scale*2,row,clip};
}
