import { TILE } from './data.js';
export const ROOM_W=15, ROOM_H=11, ROOM_COLS=3, ROOM_ROWS=3;
export const ROOM_LAYOUTS=['columns','ruins','open','alcoves','crossroads','arcade'];
export function seeded(seed){let state=(seed>>>0)||1;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}}
export function generateDungeon(seed=1){
 const random=seeded(seed),width=ROOM_W*ROOM_COLS,height=ROOM_H*ROOM_ROWS;
 const tiles=new Uint8Array(width*height).fill(1),doors=new Set();
 const rooms=Array.from({length:ROOM_COLS*ROOM_ROWS},(_,id)=>({
  id,gx:id%ROOM_COLS,gy:Math.floor(id/ROOM_COLS),links:[],visited:false,cleared:false,
  type:'combat',cx:((id%ROOM_COLS)*ROOM_W+7.5)*TILE,
  cy:(Math.floor(id/ROOM_COLS)*ROOM_H+5.5)*TILE,
  layout:'open',biome:'crypt',theme:'crypt',discovered:false
 }));
 const index=(x,y)=>y*width+x;
 const set=(x,y,n)=>{if(x>=0&&y>=0&&x<width&&y<height)tiles[index(x,y)]=n};
 const free=(x,y)=>set(x,y,0);
 // A symmetric cross, three tiles wide, always connects every doorway to the center.
 // Pillars are deliberately kept in side pockets, never scattered on the path.
 const patterns={
  columns:[[3,3],[11,3],[3,7],[11,7]],
  ruins:[[3,3],[4,3],[11,7],[10,7]],
  open:[],
  alcoves:[[3,2],[11,2],[3,8],[11,8]],
  crossroads:[[3,3],[11,3],[3,7],[11,7],[4,2],[10,8]],
  arcade:[[3,2],[3,8],[11,2],[11,8],[4,3],[10,7]]
 };
 for(const room of rooms){
  const ox=room.gx*ROOM_W,oy=room.gy*ROOM_H;
  for(let y=1;y<=9;y++)for(let x=1;x<=13;x++)free(ox+x,oy+y);
  const layout=ROOM_LAYOUTS[Math.floor(random()*ROOM_LAYOUTS.length)];
  room.layout=layout;
  for(const [x,y] of patterns[layout])if(Math.abs(x-7)>2&&Math.abs(y-5)>1)set(ox+x,oy+y,2);
 }
 // Spanning-tree route with a few loops. Each adjacent pair connects through a
 // three-wide corridor; the room interior's central cross never gets blocked.
 const seen=new Set([0]),stack=[0];
 const neighbors=id=>{
  const x=id%ROOM_COLS,y=Math.floor(id/ROOM_COLS),out=[];
  if(x>0)out.push(id-1);if(x<ROOM_COLS-1)out.push(id+1);
  if(y>0)out.push(id-ROOM_COLS);if(y<ROOM_ROWS-1)out.push(id+ROOM_COLS);
  return out;
 };
 const connect=(a,b)=>{
  if(rooms[a].links.includes(b))return;
  const ra=rooms[a],rb=rooms[b];ra.links.push(b);rb.links.push(a);
  if(ra.gy===rb.gy){
   const x=Math.max(ra.gx,rb.gx)*ROOM_W,y=ra.gy*ROOM_H+5;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=0;dx++){free(x+dx,y+dy);doors.add((x+dx)+','+(y+dy))}
  }else{
   const y=Math.max(ra.gy,rb.gy)*ROOM_H,x=ra.gx*ROOM_W+7;
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=0;dy++){free(x+dx,y+dy);doors.add((x+dx)+','+(y+dy))}
  }
 };
 while(stack.length){
  const id=stack[stack.length-1],choices=neighbors(id).filter(n=>!seen.has(n));
  if(!choices.length){stack.pop();continue}
  const next=choices[Math.floor(random()*choices.length)];
  connect(id,next);seen.add(next);stack.push(next);
 }
 for(const room of rooms)for(const id of neighbors(room.id))if(id>room.id&&random()<.16)connect(room.id,id);
 const dist=Array(rooms.length).fill(-1),queue=[0];dist[0]=0;
 while(queue.length){
  const id=queue.shift();
  for(const to of rooms[id].links)if(dist[to]<0){dist[to]=dist[id]+1;queue.push(to)}
 }
 const bossId=dist.indexOf(Math.max(...dist));
 const rest=rooms.filter(r=>r.id!==0&&r.id!==bossId).sort((a,b)=>dist[b.id]-dist[a.id]);
 rooms[0].type='start';rooms[0].cleared=true;rooms[0].visited=true;rooms[0].discovered=true;
 rooms[bossId].type='boss';rooms[bossId].layout='open';
 // Six unique encounter functions across nine rooms; still 3-4 normal combats.
 const special=['treasure','shrine','elite','secret'];
 for(let i=0;i<Math.min(special.length,rest.length);i++)rest[i].type=special[i];
 // Secret branches are reachable; their contents stay hidden until the room is entered.
 const biomes=['crypt','fungal','flooded'];
 for(const room of rooms){
  const tier=dist[room.id]/Math.max(1,dist[bossId]);
  room.biome=biomes[Math.min(2,Math.floor(tier*2.95))];
  room.theme=room.type==='start'?'sanctuary':room.type==='boss'?'throne':
   room.type==='treasure'?'reliquary':room.type==='shrine'?'sanctuary':
   room.type==='secret'?'reliquary':room.biome;
  // No occluding decorations/collisions on the boss arena or shrine center.
  if(['boss','shrine','treasure','secret'].includes(room.type)){
   const ox=room.gx*ROOM_W,oy=room.gy*ROOM_H;
   for(let y=2;y<=8;y++)for(let x=3;x<=11;x++)free(ox+x,oy+y);
  }
 }
 return {
  seed,width,height,tiles,doors,rooms,bossId,random,start:{x:rooms[0].cx,y:rooms[0].cy},
  tileAt(tx,ty){if(tx<0||ty<0||tx>=width||ty>=height)return 1;return tiles[index(tx,ty)]},
  roomAt(x,y){
   const gx=Math.floor(x/TILE/ROOM_W),gy=Math.floor(y/TILE/ROOM_H);
   return gx>=0&&gx<ROOM_COLS&&gy>=0&&gy<ROOM_ROWS?rooms[gy*ROOM_COLS+gx]:null;
  },
  isBlocked(x,y,seal=false){
   const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
   return this.tileAt(tx,ty)!==0||(seal&&doors.has(tx+','+ty));
  },
  canMove(x,y,radius=13,seal=false){
   for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]])
    if(this.isBlocked(x+dx*radius*.72,y+dy*radius*.72,seal))return false;
   return true;
  }
 };
}
