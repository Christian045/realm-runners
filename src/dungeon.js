import { TILE } from './data.js';
export const ROOM_W=15, ROOM_H=11, ROOM_COLS=3, ROOM_ROWS=3;
export function seeded(seed){
 let state=(seed>>>0)||1;
 return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
}
export function generateDungeon(seed=1){
 const random=seeded(seed);
 const width=ROOM_W*ROOM_COLS,height=ROOM_H*ROOM_ROWS;
 const tiles=new Uint8Array(width*height).fill(1);
 const doors=new Set();
 const rooms=Array.from({length:ROOM_COLS*ROOM_ROWS},(_,id)=>({
  id,gx:id%ROOM_COLS,gy:Math.floor(id/ROOM_COLS),links:[],visited:false,cleared:false,
  type:'combat',cx:(id%ROOM_COLS*ROOM_W+Math.floor(ROOM_W/2)+.5)*TILE,
  cy:(Math.floor(id/ROOM_COLS)*ROOM_H+Math.floor(ROOM_H/2)+.5)*TILE
 }));
 const index=(x,y)=>y*width+x;
 const set=(x,y,n)=>{if(x>=0&&y>=0&&x<width&&y<height)tiles[index(x,y)]=n};
 // Each room has its own walls and a few stable, non-obstructing decorative pillars.
 for(const r of rooms){
  const ox=r.gx*ROOM_W,oy=r.gy*ROOM_H;
  for(let y=1;y<ROOM_H-1;y++)for(let x=1;x<ROOM_W-1;x++)set(ox+x,oy+y,0);
  for(let i=0;i<3;i++){
   const x=ox+3+Math.floor(random()*(ROOM_W-6));
   const y=oy+2+Math.floor(random()*(ROOM_H-4));
   if(Math.abs(x-(ox+7))>2||Math.abs(y-(oy+5))>2)set(x,y,2);
  }
 }
 // Random spanning tree: every room is accessible, with occasional extra connections.
 const visited=new Set([0]),stack=[0];
 const neighbors=id=>{
  const gx=id%ROOM_COLS,gy=Math.floor(id/ROOM_COLS),result=[];
  if(gx>0)result.push(id-1);if(gx<ROOM_COLS-1)result.push(id+1);
  if(gy>0)result.push(id-ROOM_COLS);if(gy<ROOM_ROWS-1)result.push(id+ROOM_COLS);
  return result;
 };
 const connect=(a,b)=>{
  if(rooms[a].links.includes(b))return;
  rooms[a].links.push(b);rooms[b].links.push(a);
  const ra=rooms[a],rb=rooms[b];
  if(ra.gy===rb.gy){
   const border=Math.max(ra.gx,rb.gx)*ROOM_W;
   const cy=ra.gy*ROOM_H+Math.floor(ROOM_H/2);
   for(const yy of [cy-1,cy,cy+1])for(const xx of [border-1,border]){
    set(xx,yy,0);doors.add(xx+','+yy);
   }
  }else{
   const border=Math.max(ra.gy,rb.gy)*ROOM_H;
   const cx=ra.gx*ROOM_W+Math.floor(ROOM_W/2);
   for(const xx of [cx-1,cx,cx+1])for(const yy of [border-1,border]){
    set(xx,yy,0);doors.add(xx+','+yy);
   }
  }
 };
 while(stack.length){
  const id=stack[stack.length-1];
  const choices=neighbors(id).filter(n=>!visited.has(n));
  if(!choices.length){stack.pop();continue}
  const next=choices[Math.floor(random()*choices.length)];
  connect(id,next);visited.add(next);stack.push(next);
 }
 for(const r of rooms)for(const n of neighbors(r.id))if(n>r.id&&random()<.18)connect(r.id,n);
 // BFS chooses a distant boss; the treasure is along the way.
 const queue=[0],dist=Array(rooms.length).fill(-1);dist[0]=0;
 while(queue.length){const id=queue.shift();for(const n of rooms[id].links)if(dist[n]<0){dist[n]=dist[id]+1;queue.push(n)}}
 const bossId=dist.indexOf(Math.max(...dist));
 const treasureId=dist.map((d,i)=>({d,i})).filter(e=>e.i!==0&&e.i!==bossId).sort((a,b)=>b.d-a.d)[0]?.i;
 rooms[0].type='start';rooms[0].cleared=true;
 rooms[bossId].type='boss';
 if(treasureId!==undefined)rooms[treasureId].type='treasure';
 return {
  seed,width,height,tiles,doors,rooms,bossId,random,
  start:{x:rooms[0].cx,y:rooms[0].cy},
  tileAt(tx,ty){if(tx<0||ty<0||tx>=width||ty>=height)return 1;return tiles[index(tx,ty)]},
  roomAt(x,y){
   const gx=Math.floor(x/TILE/ROOM_W),gy=Math.floor(y/TILE/ROOM_H);
   return rooms[gy*ROOM_COLS+gx]||null;
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
