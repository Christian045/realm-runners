import { TILE } from './data.js?v=0.15.0';

// Thirteen rooms on a five-by-five grid: NOT the former filled 3x3 block.
// Cells are only an address system: the playable outlines vary per chamber.
export const ROOM_W=15, ROOM_H=11, ROOM_COLS=5, ROOM_ROWS=5, ROOM_COUNT=13;
export const ROOM_LAYOUTS=Object.freeze(['columns','ruins','open','alcoves','crossroads','arcade',
 'longhall','pillared','vault','chambers','shattered','tombs','mirror','crescent',
 'bastion','switchback','trident','sanctum']);
export const ROOM_SHAPES=Object.freeze(['great','compact','long','tall','cross','L','offset','zigzag','arc','hourglass','terrace']);
export const SPECIAL_ROOMS=Object.freeze(['treasure','shrine','elite','secret','event','library','trap','camp','vault']);
export function seeded(seed){let state=(seed>>>0)||1;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}}
const key=(x,y)=>x+','+y;
const manhattan=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gy-b.gy);
const patterns={
 columns:[[3,3],[11,3],[3,7],[11,7]],
 ruins:[[3,3],[4,3],[11,7],[10,7]],
 open:[],alcoves:[[3,2],[11,2],[3,8],[11,8]],
 crossroads:[[3,3],[11,3],[3,7],[11,7],[4,2],[10,8]],
 arcade:[[3,2],[3,8],[11,2],[11,8],[4,3],[10,7]],
 longhall:[[2,2],[2,3],[12,7],[12,8]],
 pillared:[[3,2],[3,8],[11,2],[11,8],[2,5],[12,5]],
 vault:[[3,3],[3,7],[11,3],[11,7],[2,3],[12,7]],
 chambers:[[2,2],[3,2],[11,8],[12,8],[2,8],[12,2]],
 shattered:[[3,2],[4,2],[10,8],[11,8],[11,3]],
 tombs:[[3,3],[3,7],[11,3],[11,7],[2,2],[12,8]],
 mirror:[[3,2],[3,8],[11,2],[11,8],[4,3],[10,3]],
 crescent:[[3,2],[4,2],[10,2],[11,2],[3,8],[11,8]],
 bastion:[[2,2],[3,2],[12,2],[11,2],[2,8],[12,8]],
 switchback:[[2,3],[3,3],[12,7],[11,7],[2,8],[12,2]],
 trident:[[2,2],[12,2],[2,8],[12,8],[3,6],[11,4]],
 sanctum:[[2,3],[12,3],[2,7],[12,7]]
};
function roomFloor(shape,x,y){
 const dx=x-7,dy=y-5,ax=Math.abs(dx),ay=Math.abs(dy);
 // Every entry corridor has a three-tile central spine. The central area
 // remains clear, including the +/-145px enemy spawn staging positions.
 const central=ax<=3&&ay<=3;
 const spine=ax<=1||ay<=1;
 const special=shape==='great'?ax<=6&&ay<=4:
  shape==='compact'?ax<=4&&ay<=3:
  shape==='long'?ax<=6&&ay<=2:
  shape==='tall'?ax<=2&&ay<=4:
  shape==='cross'?(ax<=3&&ay<=4)||(ax<=6&&ay<=2):
  shape==='L'?(dx<=2&&ax<=6&&ay<=3)||(dy>=-1&&ax<=5&&ay<=4):
  shape==='offset'?(ay<=3&&(dx<=4&&dx>=-5))||(ax<=3&&dy>=-4&&dy<=4):
  shape==='zigzag'?(dy<0?(dx>=-5&&dx<=3):(dx>=-3&&dx<=5))&&ay<=3:
  shape==='hourglass'?(ay<=2&&ax<=6)||(ax<=2&&ay<=4)||(ax<=4&&ay<=3):
  shape==='terrace'?(dy<=0?ax<=6&&ay<=3:ax<=4&&ay<=4):
  (ax<=4&&ay<=3)||(ay<=2&&ax<=6);
 return central||spine||special;
}
export function generateDungeon(seed=1,options={}){
 const roomCount=options.tower?7:ROOM_COUNT;
 const random=seeded(seed),width=ROOM_W*ROOM_COLS,height=ROOM_H*ROOM_ROWS;
 const tiles=new Uint8Array(width*height).fill(1),doors=new Set(),gates=[];
 const index=(x,y)=>y*width+x;
 const set=(x,y,v)=>{if(x>=0&&y>=0&&x<width&&y<height)tiles[index(x,y)]=v};
 const free=(x,y)=>set(x,y,0);
 const cells=[{gx:2,gy:2,parent:-1}],occupied=new Set([key(2,2)]);
 const neighbors=({gx,gy})=>[[gx+1,gy],[gx-1,gy],[gx,gy+1],[gx,gy-1]]
  .filter(([x,y])=>x>=0&&y>=0&&x<ROOM_COLS&&y<ROOM_ROWS);
 // Grow a branched, connected polyomino with long excursions and side routes.
 // The score favours spread without forcing the same geometric silhouette.
 while(cells.length<roomCount){
  const frontier=[];
  for(let id=0;id<cells.length;id++){
   for(const [gx,gy] of neighbors(cells[id])){
    if(occupied.has(key(gx,gy)))continue;
    const degree=neighbors({gx,gy}).filter(([x,y])=>occupied.has(key(x,y))).length;
    const distance=Math.abs(gx-2)+Math.abs(gy-2);
    const weight=2+distance*.9+(degree===1?2:0);
    frontier.push({gx,gy,parent:id,weight});
   }
  }
  const total=frontier.reduce((n,f)=>n+f.weight,0),roll=random()*total;
  let acc=0,choice=frontier[frontier.length-1];
  for(const f of frontier){acc+=f.weight;if(roll<=acc){choice=f;break}}
  occupied.add(key(choice.gx,choice.gy));
  cells.push({gx:choice.gx,gy:choice.gy,parent:choice.parent});
 }
 const rooms=cells.map((cell,id)=>({
  id,gx:cell.gx,gy:cell.gy,links:[],visited:id===0,cleared:id===0,
  discovered:id===0,type:id===0?'start':'combat',layout:ROOM_LAYOUTS[Math.floor(random()*ROOM_LAYOUTS.length)],
  shape:ROOM_SHAPES[Math.floor(random()*ROOM_SHAPES.length)],biome:'crypt',theme:'crypt',
  eventKind:null,roomLabel:'',runeAnswer:0,encounterStyle:'mixed',
  cx:(cell.gx*ROOM_W+7.5)*TILE,cy:(cell.gy*ROOM_H+5.5)*TILE
 }));
 const byCell=new Map(rooms.map(r=>[key(r.gx,r.gy),r]));
 const connect=(a,b)=>{
  if(a.links.includes(b.id))return;
  a.links.push(b.id);b.links.push(a.id);
 };
 for(let id=1;id<cells.length;id++)connect(rooms[id],rooms[cells[id].parent]);
 for(const room of rooms)for(const [x,y] of neighbors(room)){
  const n=byCell.get(key(x,y));
  if(n&&n.id>room.id&&!room.links.includes(n.id)&&random()<.10)connect(room,n);
 }
 const dist=Array(rooms.length).fill(-1);dist[0]=0;
 const queue=[0];while(queue.length){
  const id=queue.shift();
  for(const n of rooms[id].links)if(dist[n]<0){dist[n]=dist[id]+1;queue.push(n)}
 }
 const bossId=dist.indexOf(Math.max(...dist));
 const rest=rooms.filter(r=>r.id!==0&&r.id!==bossId).sort((a,b)=>dist[b.id]-dist[a.id]||a.id-b.id);
 rooms[bossId].type='boss';
 // Later tower floors trade the guaranteed treasure chamber for another fight.
 // The seven-room floor length stays unchanged.
 const specials=options.tower?(options.floor>=4?['shrine','elite']:['shrine','treasure','elite']):SPECIAL_ROOMS;
 for(let i=0;i<specials.length;i++)rest[i].type=specials[i];
 const biomes=['crypt','fungal','flooded'];
 for(const room of rooms){
  const tier=dist[room.id]/Math.max(1,dist[bossId]);
  room.biome=options.tower&&['crypt','fungal','flooded'].includes(options.biome)?options.biome:biomes[Math.min(2,Math.floor(tier*2.9))];
  room.eventKind=room.type==='event'?(random()<.5?'forge':'trial'):null;
  // A room's battle identity follows its architecture. This makes each
  // silhouette communicate expected enemy tactics without altering doors.
  room.encounterStyle=room.layout==='bastion'||room.layout==='pillared'?'fortified':
   room.layout==='switchback'||room.layout==='crescent'?'ambush':
   room.layout==='longhall'||room.layout==='trident'?'ranged':
   room.layout==='sanctum'||room.layout==='mirror'?'arcane':
   ['ambush','ranged','arcane','fortified','mixed'][Math.floor(random()*5)];
  room.runeAnswer=Math.floor(random()*3);
  room.theme=room.type==='start'||room.type==='shrine'||room.type==='camp'?'sanctuary':
   room.type==='boss'?'throne':
   ['treasure','secret','vault','library'].includes(room.type)?'reliquary':room.biome;
  if(room.type==='boss')room.shape='great';
  if(['shrine','camp','vault','library','treasure'].includes(room.type))room.shape='great';
  room.roomLabel=({start:'HEILIGTUM',combat:'KAMPFHALLE',elite:'ELITEKAMMER',
   boss:'THRON',treasure:'SCHATZKAMMER',shrine:'SCHREIN',secret:'GEHEIMNIS',
   event:'EREIGNIS',library:'BIBLIOTHEK',trap:'FALLENHALLE',camp:'LAGER',vault:'GEWÖLBE'})[room.type];
  if(room.type==='combat')room.roomLabel=({
   ambush:'HINTERHALT',ranged:'SCHÜTZENGALERIE',arcane:'RUNENKAMMER',
   fortified:'BASTION',mixed:'KAMPFHALLE'})[room.encounterStyle];
  const ox=room.gx*ROOM_W,oy=room.gy*ROOM_H;
  for(let y=1;y<=9;y++)for(let x=1;x<=13;x++)
   if(roomFloor(room.shape,x,y))free(ox+x,oy+y);
  // Cover belongs to the side pockets, outside the central circulation spine.
  // Elite and boss fights remain completely unobstructed in the middle.
  for(const [x,y] of patterns[room.layout]){
   if(['boss','library','camp','shrine','vault'].includes(room.type))continue;
   if(Math.abs(x-7)<=3&&Math.abs(y-5)<=3)continue;
   if(tiles[index(ox+x,oy+y)]===0)set(ox+x,oy+y,2);
  }
  // Keep all spawn quadrants usable and visibly inside the room's floor.
  for(const [x,y] of [[5,3],[9,3],[5,7],[9,7],[7,3],[7,7]])free(ox+x,oy+y);
  room.bounds={left:ox+1,right:ox+13,top:oy+1,bottom:oy+9};
 }
 // Four-ish tile transitions with 3-tile door openings, engraved thresholds,
 // and approach corridors that extend from each doorway into its room.
 for(const room of rooms)for(const id of room.links)if(id>room.id){
  const other=rooms[id],horizontal=room.gy===other.gy;
  if(horizontal){
   const x=Math.max(room.gx,other.gx)*ROOM_W,y=room.gy*ROOM_H+5;
   for(let dy=-1;dy<=1;dy++)for(let dx=-3;dx<=2;dx++)free(x+dx,y+dy);
   for(let dy=-1;dy<=1;dy++)for(const xx of [x-1,x])doors.add(key(xx,y+dy));
   gates.push({x:(x)*TILE,y:(y+.5)*TILE,orientation:'vertical',a:room.id,b:other.id});
  }else{
   const x=room.gx*ROOM_W+7,y=Math.max(room.gy,other.gy)*ROOM_H;
   for(let dx=-1;dx<=1;dx++)for(let dy=-3;dy<=2;dy++)free(x+dx,y+dy);
   for(let dx=-1;dx<=1;dx++)for(const yy of [y-1,y])doors.add(key(x+dx,yy));
   gates.push({x:(x+.5)*TILE,y:y*TILE,orientation:'horizontal',a:room.id,b:other.id});
  }
 }
 return {
  seed,width,height,tiles,doors,gates,rooms,bossId,random,tower:!!options.tower,
  columns:ROOM_COLS,rows:ROOM_ROWS,start:{x:rooms[0].cx,y:rooms[0].cy},
  tileAt(x,y){if(x<0||y<0||x>=width||y>=height)return 1;return tiles[index(x,y)]},
  roomAt(x,y){
   const gx=Math.floor(x/TILE/ROOM_W),gy=Math.floor(y/TILE/ROOM_H);
   return byCell.get(key(gx,gy))||null;
  },
  isBlocked(x,y,seal=false){
   const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
   return this.tileAt(tx,ty)!==0||(seal&&doors.has(key(tx,ty)));
  },
  canMove(x,y,radius=13,seal=false){
   for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]])
    if(this.isBlocked(x+dx*radius*.72,y+dy*radius*.72,seal))return false;
   return true;
  }
 };
}
