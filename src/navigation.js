import {TILE,normalized} from './data.js';

// Grid-based LOS and room-local navigation: both use authoritative collision tiles.
// A bounded BFS avoids repeated pathfinding and keeps mobile CPU costs predictable.
export function hasLineOfSight(dungeon,ax,ay,bx,by,seal=false){
 const distance=Math.hypot(bx-ax,by-ay);
 if(!distance)return true;
 const steps=Math.max(1,Math.ceil(distance/16));
 for(let i=1;i<steps;i++){
  const t=i/steps;
  if(dungeon.isBlocked(ax+(bx-ax)*t,ay+(by-ay)*t,seal))return false;
 }
 return true;
}
export function findPath(dungeon,from,to,room=null,seal=false){
 const sx=Math.floor(from.x/TILE),sy=Math.floor(from.y/TILE);
 const tx=Math.floor(to.x/TILE),ty=Math.floor(to.y/TILE);
 if(sx===tx&&sy===ty)return [];
 const minX=room?room.gx*15:0,maxX=room?minX+14:dungeon.width-1;
 const minY=room?room.gy*11:0,maxY=room?minY+10:dungeon.height-1;
 const id=(x,y)=>y*dungeon.width+x;
 const start=id(sx,sy),goal=id(tx,ty);
 const queue=[[sx,sy]],parent=new Map([[start,-1]]);
 let found=false;
 const searchLimit=room?220:Math.min(dungeon.width*dungeon.height,6500);
 for(let cursor=0;cursor<queue.length&&cursor<searchLimit;cursor++){
  const [x,y]=queue[cursor];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,nid=id(nx,ny);
   if(nx<minX||nx>maxX||ny<minY||ny>maxY||parent.has(nid))continue;
   if(dungeon.tileAt(nx,ny)!==0||(seal&&dungeon.doors.has(nx+','+ny)))continue;
   parent.set(nid,id(x,y));
   if(nid===goal){found=true;break}
   queue.push([nx,ny]);
  }
  if(found)break;
 }
 if(!found)return [];
 let current=goal;const result=[];
 while(current!==start&&parent.has(current)&&result.length<(room?110:320)){
  const x=current%dungeon.width,y=Math.floor(current/dungeon.width);
  result.push({x:(x+.5)*TILE,y:(y+.5)*TILE});
  current=parent.get(current);
 }
 return current===start?result.reverse():[];
}
export function enemySteering(game,e,target,dt,ranged=false){
 const d=game.dungeon;
 const dx=target.x-e.x,dy=target.y-e.y,dist=Math.hypot(dx,dy)||1;
 const clear=hasLineOfSight(d,e.x,e.y,target.x,target.y,true);
 const desired=ranged?225:e.radius+game.player.radius+5;
 let vector;
 if(ranged&&clear&&dist<165){
  vector=normalized(-dx,-dy);
 }else if(ranged&&clear&&dist<=300){
  // Tactical strafe, but never slide through an obstacle.
  const side=e.homeRoom%2===0?1:-1;
  vector=normalized(-dy*side,dx*side);
 }else{
  if(clear)vector=normalized(dx,dy);
  else{
   e.pathClock=(e.pathClock||0)-dt;
   if(e.pathClock<=0){
    e.path=findPath(d,{x:e.x,y:e.y},target,d.rooms[e.homeRoom],true);
    e.pathClock=.26+((e.homeRoom||0)%4)*.04;
   }
   const next=e.path?.find(point=>Math.hypot(point.x-e.x,point.y-e.y)>9);
   vector=next?normalized(next.x-e.x,next.y-e.y):normalized(dx,dy);
  }
 }
 return {x:vector.x,y:vector.y,clear,dist};
}
export function findSpawnPosition(dungeon,room,x,y,radius=18,player=null){
 const candidates=[[x,y],[room.cx,room.cy],
  ...[-1,1].flatMap(sign=>[[x+sign*48,y],[x,y+sign*48],[room.cx+sign*88,room.cy]])];
 for(const [px,py] of candidates){
  if(!dungeon.canMove(px,py,radius,true))continue;
  if(player&&Math.hypot(px-player.x,py-player.y)<85)continue;
  return {x:px,y:py};
 }
 return {x:room.cx,y:room.cy};
}
