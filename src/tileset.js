// Cached 24x24 authored tile textures scaled 2x at the world TILE=48 size.
// Every biome has a coherent floor, masonry and pillar palette. The seeded
// variants only add cracks, patches and puddles; they never change collision.
export const TILE_PIXELS=24;
export const TILE_THEMES=Object.freeze({
 crypt:['#1d3033','#284043','#385253','#51716c','#78938b','#0d2228','#819791'],
 fungal:['#18342c','#28503d','#39684d','#5d8b61','#8fb17d','#11261f','#b3c3a1'],
 flooded:['#152f42','#24495d','#30637b','#59899a','#83b1bc','#0c2635','#add4db'],
 sanctuary:['#233c36','#375b48','#4e7660','#729983','#9cbd99','#17302b','#d2dcb0'],
 reliquary:['#3a3430','#574d3c','#76674b','#a28b63','#cbb281','#2d292b','#eee0b5'],
 throne:['#342631','#513448','#71485d','#a46f84','#dba5ae','#241c30','#f0cbd2']
});
const palettes=Object.freeze(Object.keys(TILE_THEMES));
export function tileTheme(room){
 const kind=room?.theme;
 return palettes.includes(kind)?kind:palettes.includes(room?.biome)?room.biome:'crypt';
}
export function tileVariant(seed,x,y){
 let a=(Math.imul((seed^x)>>>0,2654435761)+Math.imul(y+17,1597334677))>>>0;
 a^=a>>>16;a=Math.imul(a,2246822507)>>>0;
 return (a^(a>>>13))&7;
}
const put=(ctx,color,x,y,w=1,h=1)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
function crack(ctx,p,x,y,reverse=false){
 const sign=reverse?-1:1;
 put(ctx,p[0],x,y,4,1);put(ctx,p[0],x+3*sign,y+1,1,3);
 put(ctx,p[3],x+sign,y+1,2,1);
}
function floor(ctx,p,variation,theme){
 // Irregular large flagstones. Four distinct layouts break up the old
 // repeating 3-row brick grid while retaining a restrained pixel aesthetic.
 put(ctx,p[1],0,0,24,24);
 const style=variation&3;
 if(style===0){
  // Broad intact slab with only occasional recessed corner seams.
  put(ctx,p[2],1,1,22,21);put(ctx,p[1],2,3,19,18);
  put(ctx,p[3],2,2,13,1);put(ctx,p[0],1,17,1,6);
  put(ctx,p[0],16,22,8,1);
 }else if(style===1){
  // One weathered central join; no repeated horizontal brick bands.
  put(ctx,p[2],0,0,23,10);put(ctx,p[1],2,2,20,7);
  put(ctx,p[0],0,11,19,1);put(ctx,p[3],2,12,17,1);
  put(ctx,p[2],3,14,21,9);put(ctx,p[1],5,16,18,6);
  put(ctx,p[3],4,15,11,1);
 }else if(style===2){
  // Offset vertical slab joints give the chamber direction.
  put(ctx,p[2],1,1,13,21);put(ctx,p[1],2,3,10,18);
  put(ctx,p[0],14,0,1,19);put(ctx,p[3],15,2,1,12);
  put(ctx,p[2],17,4,7,19);put(ctx,p[1],18,6,6,16);
  put(ctx,p[3],2,2,9,1);
 }else{
  // Smooth worn stone, only a partial broken edge.
  put(ctx,p[2],0,0,24,24);put(ctx,p[1],2,2,20,20);
  put(ctx,p[0],0,20,10,1);put(ctx,p[3],3,3,12,1);
  put(ctx,p[0],20,12,3,6);
 }
 // Restrained weathering is seeded, static and never changes collision.
 if(variation&4){
  put(ctx,p[0],6,18,3,1);put(ctx,p[3],7,17,2,1);
  if(style===0||style===3)crack(ctx,p,13,9,style===3);
 }else if(style===2){
  put(ctx,p[3],18,17,3,1);
 }
 if(theme==='fungal'||theme==='sanctuary'){
  if(variation%3===0){
   put(ctx,'#315943',3,18,5,3);put(ctx,'#507d57',4,18,3,1);
   put(ctx,'#71975e',7,20,2,1);
  }
  if(theme==='fungal'&&style===2){
   put(ctx,'#5b8355',20,7,3,2);
   put(ctx,'#9cbe80',21,7,1,1);
  }
 }else if(theme==='flooded'){
  if(style===1||style===3){
   put(ctx,'#205365',3,19,10,3);
   put(ctx,'#3f8090',4,20,7,1);
   put(ctx,'#7db0ba',6,20,3,1);
  }
 }else if(theme==='crypt'&&style===3){
  put(ctx,'#365b4e',5,19,4,2);put(ctx,'#5e8273',6,18,2,1);
 }else if(theme==='reliquary'&&variation%3===0){
  put(ctx,'#ad966a',19,19,3,2);
 }else if(theme==='throne'&&style===2){
  put(ctx,'#815168',1,13,6,2);
 }
}
function wall(ctx,p,variation,theme){
 put(ctx,p[5],0,0,24,24);
 put(ctx,p[0],0,1,24,22);
 for(let row=0;row<4;row++){
  const yy=row*6+(row===0?0:1),offset=row%2?5:0;
  for(let x=-offset;x<24;x+=12){
   put(ctx,p[2],x+1,yy+1,11,4);put(ctx,p[1],x+2,yy+2,9,3);
   put(ctx,p[3],x+1,yy+1,10,1);put(ctx,p[0],x+11,yy+1,1,5);
  }
 }
 put(ctx,p[0],0,22,24,2);
 if(variation&1){put(ctx,p[4],8,7,4,1);put(ctx,p[4],15,19,2,1)}
 if(variation&2)crack(ctx,p,17,14,true);
 if(theme==='fungal'){
  put(ctx,'#335e46',3,16,5,5);put(ctx,'#6e9c68',4,16,3,2);
 }else if(theme==='flooded'){
  put(ctx,'#356a7b',1,21,22,2);put(ctx,'#6cb8b7',3,21,13,1);
 }else if(theme==='throne')put(ctx,'#a14a66',0,6,24,1);
 // Layered stone bevel. Bottom surfaces read as walls instead of floor slabs.
 put(ctx,p[5],0,21,24,3);put(ctx,p[3],1,0,22,2);
 put(ctx,p[4],2,2,10,1);put(ctx,p[0],21,2,3,19);
 put(ctx,p[4],2,14,3,1);
}
function pillar(ctx,p,variation,theme){
 floor(ctx,p,variation,theme);
 // Heavy cast shadow and clean square silhouette. Collision still comes from tile 2.
 put(ctx,p[5],3,8,20,15);
 put(ctx,p[0],4,5,17,15);
 put(ctx,p[2],6,4,15,13);
 put(ctx,p[3],6,4,15,3);
 put(ctx,p[1],7,9,12,8);
 put(ctx,p[0],5,16,16,3);
 put(ctx,p[3],5,2,16,3);
 put(ctx,p[4],7,2,12,1);
 put(ctx,p[5],7,7,2,10);
 put(ctx,p[4],19,6,1,10);
 if(variation&2){put(ctx,p[5],10,12,5,1);put(ctx,p[0],12,13,2,3)}
 put(ctx,p[5],4,19,19,4);put(ctx,p[4],8,3,11,2);
 put(ctx,p[3],7,7,2,10);put(ctx,p[4],18,7,2,3);
 put(ctx,p[0],20,11,2,9);
}
export class PixelTileAtlas{
 constructor(canvasFactory=()=>document.createElement('canvas')){this.canvasFactory=canvasFactory;this.cache=new Map()}
 tile(theme='crypt',type=0,variation=0){
  if(!TILE_THEMES[theme])theme='crypt';
  type=type===2?2:type===1?1:0;variation=(variation>>>0)&7;
  const key=theme+':'+type+':'+variation;
  if(this.cache.has(key))return this.cache.get(key);
  const canvas=this.canvasFactory();canvas.width=24;canvas.height=24;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.imageSmoothingEnabled=false;
  const palette=TILE_THEMES[theme];
  if(type===1)wall(ctx,palette,variation,theme);
  else if(type===2)pillar(ctx,palette,variation,theme);
  else floor(ctx,palette,variation,theme);
  this.cache.set(key,canvas);
  return canvas;
 }
 draw(ctx,theme,type,variation,x,y,size=48){
  const tile=this.tile(theme,type,variation);if(!tile)return false;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,Math.round(x),Math.round(y),size,size);ctx.restore();
  return true;
 }
}
