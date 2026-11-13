// Illustrated hunter production art, prepared from the repository's detailed
// hand-painted 0.28 Jäger frames (green hood, face, leather gear, quiver, bow).
// Unlike the 0.69 procedural model, every rendered pose preserves original
// sprite pixels, palette/shading and complete body anatomy.
//
// Authored source sheets contain four principal facings. Four intercardinal
// views use the appropriate illustrated side/back silhouette with a subtle
// camera-facing shear. These are derived views, NOT four newly hand-painted
// facings; keep that limitation explicit.
export const HUNTER_CELL=120;
export const HUNTER_ANCHOR=Object.freeze({x:60,y:105});
export const HUNTER_COUNTS=Object.freeze({
 idle:6,walk:6,attack:6,special:6,dash:6,hurt:6,death:6
});
export const HUNTER_CLIPS=Object.freeze(Object.keys(HUNTER_COUNTS));
export const HUNTER_ROWS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
export const HUNTER_SOURCE_VIEWS=Object.freeze([
 Object.freeze({face:'down',flip:false,shear:0}),
 Object.freeze({face:'left',flip:false,shear:.075}),
 Object.freeze({face:'left',flip:false,shear:0}),
 Object.freeze({face:'up',flip:false,shear:.075}),
 Object.freeze({face:'up',flip:false,shear:0}),
 Object.freeze({face:'up',flip:true,shear:-.075}),
 Object.freeze({face:'right',flip:false,shear:0}),
 Object.freeze({face:'right',flip:false,shear:-.075})
]);
export const hunterFacing=d=>
 (Math.round((Math.atan2(d?.y??1,d?.x??0)-Math.PI/2)/(Math.PI/4))+8)%8;

// Candidate painted string/limb positions near the bow hand. The atlas baker
// snaps each to an opaque bow-toned pixel in its real attack/special image.
export const HUNTER_BOW_HINTS=Object.freeze([
 [85,63],[32,57],[31,58],[29,58],[29,56],[91,57],[88,58],[88,63]
]);
export function hunterIllustratedCell(g,manifest,images,row,clip,frame){
 if(!Object.hasOwn(HUNTER_COUNTS,clip))throw new RangeError('Unknown hunter clip: '+clip);
 const view=HUNTER_SOURCE_VIEWS[row],source=images[view.face];
 if(!source)throw Error('Missing illustrated hunter view '+view.face);
 // The source archer retains its nocked arrow in source pose 3. Gameplay
 // fires at 3/6, so display the source's actual released follow-through
 // (frame 4) at that exact event, then return to the resting bow.
 const sourceFrame=(clip==='attack'||clip==='special')?
  [0,1,2,4,5,0][frame]:frame;
 const sequence=HUNTER_CLIPS.indexOf(clip)*6+sourceFrame;
 const f=manifest.frames[view.face]?.[sequence];
 if(!f)throw Error('Missing illustrated hunter frame '+row+':'+clip+':'+frame);
 const root=clip==='walk'?(f.walkRootX??f.anchorX):f.anchorX;
 // The manifest's source frames vary in crop origin, including weapon and
 // cloak. Register every full silhouette to the very same foot pivot; never
 // use a separate legs layer or scale the player in response to animation.
 g.save();g.imageSmoothingEnabled=false;
 g.translate(HUNTER_ANCHOR.x,HUNTER_ANCHOR.y);
 if(view.shear)g.transform(1,0,view.shear,1,0,0);
 if(view.flip)g.scale(-1,1);
 g.drawImage(source,f.x,f.y,f.w,f.h,-root,-f.h,f.w,f.h);
 g.restore();
}
const goldish=(d,i)=>{
 const a=d[i+3],red=d[i],green=d[i+1],blue=d[i+2];
 return a>130&&red>75&&red>green+9&&green>blue+7;
};
// Search the *rasterized illustrated bow*, never the abandoned 0.69
// procedural socket, and keep the emission on a visible painted pixel.
export function hunterIllustratedSocket(sheet,row,frame,hint=HUNTER_BOW_HINTS[row]){
 if(!sheet?.getContext)return {x:hint[0],y:hint[1]};
 const ctx=sheet.getContext('2d',{willReadFrequently:true});
 const {data}=ctx.getImageData(frame*HUNTER_CELL,row*HUNTER_CELL,HUNTER_CELL,HUNTER_CELL);
 let nearest=null,min=Infinity;
 const accept=(x,y,strict)=>{
  const i=(y*HUNTER_CELL+x)*4;
  if(strict?!goldish(data,i):data[i+3]<130)return;
  const score=Math.hypot(x-hint[0],y-hint[1])+
   (strict?0:15)+Math.abs(y-hint[1])*.15;
  if(score<min){min=score;nearest={x,y};}
 };
 for(let strict=1;strict>=0&&!nearest;strict--)
  for(let y=Math.max(5,hint[1]-21);y<=Math.min(HUNTER_CELL-6,hint[1]+21);y++)
   for(let x=Math.max(5,hint[0]-23);x<=Math.min(HUNTER_CELL-6,hint[0]+23);x++)
    accept(x,y,strict===1);
 return nearest||{x:hint[0],y:hint[1]};
}
export function bakeHunterIllustrated({manifest,images,canvasFactory}){
 if(!manifest?.frames||!images||!canvasFactory)throw Error('Hunter art source missing');
 const sheets={},sockets={};
 for(const [clip,count] of Object.entries(HUNTER_COUNTS)){
  const canvas=canvasFactory();canvas.width=HUNTER_CELL*count;
  canvas.height=HUNTER_CELL*8;
  const g=canvas.getContext('2d');if(!g)throw Error('Hunter pixel canvas missing');
  g.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
   g.save();g.translate(frame*HUNTER_CELL,row*HUNTER_CELL);
   hunterIllustratedCell(g,manifest,images,row,clip,frame);
   g.restore();
  }
  sheets[clip]=canvas;
  // The projectile event happens at 3/6. Snap to actual illustrated pixels
  // in each direction; don't infer it from an unrelated geometric rig.
  if(clip==='attack'||clip==='special')
   sockets[clip]=Array.from({length:8},(_,row)=>
    hunterIllustratedSocket(canvas,row,3));
 }
 return {sheets,sockets};
}
