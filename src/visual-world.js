// v0.14: low-overdraw world depth, physically anchored dressing and pooled light.
// Pure rendering: no collision changes, no randomized frame-to-frame placement.
import {TILE} from './data.js';
import {ROOM_W,ROOM_H} from './dungeon.js';
const hash=(a,b,c=0)=>{let v=Math.imul(a+7,73856093)^Math.imul(b+29,19349663)^Math.imul(c+11,83492791);v=Math.imul(v^(v>>>13),1274126177);return (v^(v>>>16))>>>0};
const box=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
export function visibleTiles(d,cam){
 const x0=Math.max(0,Math.floor(cam.x/TILE)-1),x1=Math.min(d.width,Math.ceil((cam.x+cam.w)/TILE)+1);
 const y0=Math.max(0,Math.floor(cam.y/TILE)-1),y1=Math.min(d.height,Math.ceil((cam.y+cam.h)/TILE)+1);
 return {x0,x1,y0,y1};
}
export function wallEdges(d,x,y){
 if(d.tileAt(x,y)!==0)return null;
 return {north:d.tileAt(x,y-1)!==0,south:d.tileAt(x,y+1)!==0,
  west:d.tileAt(x-1,y)!==0,east:d.tileAt(x+1,y)!==0};
}
export function drawArchitecturalDepth(c,game){
 const d=game.dungeon,{x0,x1,y0,y1}=visibleTiles(d,game.camera);
 // Real occlusion follows the actual tile geometry, not a painted rectangle
 // across every room. Tiny walls and columns cast short, directionally
 // consistent pixel shadows along adjacent accessible floor tiles.
 c.save();
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const tile=d.tileAt(x,y);
  if(tile===0){
   const edge=wallEdges(d,x,y),px=x*TILE,py=y*TILE;
   if(edge.north){box(c,'#07151f80',px,py,TILE,11);box(c,'#b7c4af35',px,py+11,TILE,2)}
   if(edge.west){box(c,'#07161d58',px,py,8,TILE);box(c,'#92b5a323',px+8,py,2,TILE)}
   if(edge.east)box(c,'#07151a24',px+TILE-5,py,5,TILE);
   if(edge.south)box(c,'#b1c2b01e',px,py+TILE-3,TILE,2);
  }else if(tile===2){
   box(c,'#050e1490',x*TILE+6,y*TILE+TILE-8,TILE-4,10);
   box(c,'#b6b8aa28',x*TILE+8,y*TILE+4,TILE-17,2);
  }
 }
 c.restore();
}
function wallFixture(c,x,y,style,accent,time,seed){
 const flicker=.83+.17*Math.sin(time*9+seed*1.9);
 // Bracket, wall plate, iron lantern and ground-reflected glow are one object.
 box(c,'#0a1720b0',x-15,y-3,30,33);
 box(c,'#536a67',x-11,y-8,22,12);
 box(c,'#a0a99b',x-8,y-7,16,3);
 box(c,'#25343b',x-8,y+3,16,22);
 box(c,accent,x-4,y+3,8,15);
 box(c,'#fff2c4',x-2,y+4,4,7);
 if(style==='banner'){
  box(c,'#273037',x-24,y+26,48,4);
  box(c,accent+'9e',x-17,y+30,34,51);
  box(c,'#cbb48c',x-9,y+44,18,5);
  box(c,'#1a2530',x-9,y+57,18,4);
 }
 if(style==='chain'){
  for(let q=0;q<5;q++){
   box(c,'#829795',x-17,y+28+q*12,5,7);
   box(c,'#2a393d',x-16,y+29+q*12,3,4);
  }
 }
 c.globalAlpha=.52+.34*flicker;
 box(c,'#fff6d9',x-1,y-2,3,7);
 c.globalAlpha=1;
}
const props=[
 {kind:'urn',floor:'#506c6d',light:'#91a7a1'},
 {kind:'bones',floor:'#8f8b75',light:'#c9c7b1'},
 {kind:'rubble',floor:'#52636a',light:'#7b8e94'},
 {kind:'roots',floor:'#4a704f',light:'#87a77e'},
 {kind:'runes',floor:'#536b8b',light:'#b2b5ef'}
];
export function roomDressings(d,room){
 const points=[];
 const type=room.type==='boss'?'banner':room.theme==='throne'?'banner':
  room.theme==='crypt'?'chain':room.theme==='fungal'?'moss':'lantern';
 // Real fixture brackets are only attached to blocked tiles with a reachable
 // floor next to them. Thus they cannot hover in a cleared combat corridor.
 const tileX=room.gx*ROOM_W,tileY=room.gy*ROOM_H;
 const candidates=[[1,1],[13,1],[1,9],[13,9],[7,1],[7,9],[1,5],[13,5]];
 let torches=0;
 for(const [cx,cy] of candidates){
  const x=tileX+cx,y=tileY+cy;
  if(d.tileAt(x,y)!==1)continue;
  if(![[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>d.tileAt(x+dx,y+dy)===0))continue;
  if(torches++>=3)break;
  points.push({kind:'fixture',style:type,x:(x+.5)*TILE,y:(y+.5)*TILE,seed:room.id*5+cx});
 }
 // Floor props in peripheral pockets only. No decorations in the core 7x7
 // movement/attack corridor, no misleading objects on solid tiles.
 for(let i=0;i<6;i++){
  const x=tileX+2+hash(room.id,i,d.seed)%11;
  const y=tileY+2+hash(i,room.id,d.seed)%7;
  if(Math.abs(x-(tileX+7))<4&&Math.abs(y-(tileY+5))<4)continue;
  if(d.tileAt(x,y)!==0||d.tileAt(x+1,y)!==0)continue;
  const p=props[hash(i,room.id+9,d.seed)%props.length];
  points.push({kind:p.kind,x:(x+.5)*TILE,y:(y+.5)*TILE,colors:p});
 }
 return points;
}
export function drawAnchoredDressings(c,game){
 const d=game.dungeon,cam=game.camera;
 c.save();
 for(const r of d.rooms){
  if(!r.visited&&!r.discovered)continue;
  if(r.cx<cam.x-430||r.cx>cam.x+cam.w+430||r.cy<cam.y-330||r.cy>cam.y+cam.h+330)continue;
  // The generator doesn't mutate collision tiles. Cache static placements
  // per Dungeon instance and room; only the flicker is animated.
  r.visualDressings??=roomDressings(d,r);
  for(const p of r.visualDressings){
   if(p.x<cam.x-90||p.x>cam.x+cam.w+90||p.y<cam.y-105||p.y>cam.y+cam.h+105)continue;
   const x=Math.round(p.x),y=Math.round(p.y);
   if(p.kind==='fixture'){
    wallFixture(c,x,y,p.style,r.type==='boss'?'#f5a37e':r.theme==='fungal'?'#99d6a2':'#efc58b',game.time,p.seed);
   }else if(p.kind==='urn'){
    box(c,'#0918207a',x-13,y+8,30,7);
    box(c,'#25383c',x-8,y-7,17,18);
    box(c,'#536b68',x-10,y-8,21,6);
    box(c,'#93a69a',x-5,y-6,9,2);
   }else if(p.kind==='bones'){
    box(c,'#39433e',x-14,y-1,28,10);
    box(c,'#c1bf9e',x-8,y,19,3);box(c,'#aea790',x-1,y-6,5,13);
   }else if(p.kind==='roots'){
    for(let i=0;i<3;i++){box(c,'#385444',x+i*5-9,y-7-(i%2)*5,4,17);
     box(c,'#8aab74',x+i*5-10,y-9-(i%2)*5,6,5)}
   }else if(p.kind==='runes'){
    box(c,'#283b4c',x-11,y-13,24,24);
    box(c,'#93adc5',x-7,y-9,16,3);
    box(c,'#a5acdf',x-1,y-5,3,12);
   }else{
    box(c,'#2b383f',x-16,y+4,29,5);
    box(c,'#72827e',x-12,y-2,13,5);
    box(c,'#9aa79a',x+4,y+2,7,4);
   }
  }
 }
 c.restore();
}
export function lightingSources(game){
 const d=game.dungeon,cam=game.camera,result=[];
 const mobile=cam.w<700,limit=mobile?7:13;
 for(const room of d.rooms){
  if(!room.visited&&!room.discovered)continue;
  if(room.cx<cam.x-500||room.cx>cam.x+cam.w+500||room.cy<cam.y-340||room.cy>cam.y+cam.h+340)continue;
  room.visualDressings??=roomDressings(d,room);
  for(const p of room.visualDressings){
   if(p.kind!=='fixture')continue;
   if(p.x<cam.x-180||p.x>cam.x+cam.w+180||p.y<cam.y-180||p.y>cam.y+cam.h+180)continue;
   result.push({x:p.x,y:p.y,radius:180,color:room.type==='boss'?'255,118,128':room.theme==='fungal'?'131,220,158':'250,192,113',strength:.35,seed:p.seed});
   if(result.length>=limit)break;
  }
  if(room.type==='boss'&&result.length<limit)result.push({x:room.cx,y:room.cy,radius:230,color:'185,118,222',strength:.24,seed:room.id});
  if(result.length>=limit)break;
 }
 result.push({x:game.player.x,y:game.player.y,radius:170,color:'114,191,201',strength:.19,seed:0});
 return result;
}
export function drawDynamicLighting(c,game){
 if(!game.dungeon||!game.player)return;
 const cam=game.camera,lights=lightingSources(game);
 c.save();c.globalCompositeOperation='screen';
 for(const p of lights){
  const pulse=.91+.09*Math.sin(game.time*8+p.seed*2);
  const r=p.radius;
  const glow=c.createRadialGradient(p.x,p.y,2,p.x,p.y,r);
  glow.addColorStop(0,'rgba('+p.color+','+(p.strength*pulse)+')');
  glow.addColorStop(.29,'rgba('+p.color+','+(p.strength*.48*pulse)+')');
  glow.addColorStop(1,'rgba('+p.color+',0)');
  c.fillStyle=glow;c.fillRect(p.x-r,p.y-r,r*2,r*2);
 }
 c.restore();
}
