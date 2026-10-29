import {distance,normalized} from './data.js';
import {towerFirstHazard} from './difficulty-director.js?v=0.17.0';

// Enemy behaviours are state machines. Every dangerous action is preceded by a
// visible marker; no move may teleport through a solid tile.
const ritual=(game,e,x,y,radius,delay,damage,color)=>{
 game.hazards.push({x,y,radius,time:delay,maxTime:delay,damage,source:'enemy',color});
 game.createEffect('ring',x,y,color,delay,radius);
};
export function updateTowerEnemy(game,e,dt){
 if(!game.tower||!['wraith','brute','cultist','sentinel'].includes(e.type))return false;
 e.specialCooldown=Math.max(0,(e.specialCooldown??(1.2+e.homeRoom*.2))-dt);
 const p=game.player,dist=distance(p,e);
 if(e.special){
  const s=e.special;
  if(s.kind==='teleport'){
   s.time-=dt;
   if(s.time<=0){
    if(game.dungeon.canMove(s.x,s.y,e.radius,true)&&distance({x:s.x,y:s.y},p)>70){
     game.createEffect('ring',e.x,e.y,'#b3c7ff',.45,44);
     e.x=s.x;e.y=s.y;
     game.createEffect('ring',e.x,e.y,'#b3c7ff',.45,54);
    }
    e.special=null;e.specialCooldown=4.8;
   }
   return true;
  }
  if(s.kind==='charge'){
   s.time-=dt;
   if(s.time>0)return true; // Full pre-charge warning; no damage during windup.
   e.special={kind:'surge',time:.37,hit:false,dir:s.dir};
   return true;
  }
  if(s.kind==='surge'){
   const old={x:e.x,y:e.y},step=e.speed*3.7*dt;
   game.move(e,s.dir.x*step,s.dir.y*step);
   if(!s.hit&&distance(e,p)<e.radius+p.radius+8){
    game.hurt(e.damage*1.25,s.dir);s.hit=true;
   }
   s.time-=dt;
   if(s.time<=0||distance(e,old)<step*.12){
    e.special=null;e.specialCooldown=5.2;
   }
   return true;
  }
 }
 if(e.specialCooldown>0||!game.dungeon.roomAt(p.x,p.y)||dist>420)return false;
 if(e.type==='wraith'&&dist>95){
  const dir=normalized(p.x-e.x,p.y-e.y);
  const side=e.spawnIndex%2?1:-1;
  const x=p.x-dir.x*132-dir.y*side*45,y=p.y-dir.y*132+dir.x*side*45;
  if(game.dungeon.canMove(x,y,e.radius,true)&&distance({x,y},p)>90){
   e.special={kind:'teleport',time:.68,x,y};
   game.createEffect('ring',x,y,'#b3c7ff',.68,57);
   e.castTimer=.68;return true;
  }
 }
 if(e.type==='brute'&&dist>110&&dist<380){
  const dir=normalized(p.x-e.x,p.y-e.y);
  e.special={kind:'charge',time:.78,dir};
  game.createEffect('ring',e.x,e.y,'#ffc48a',.78,66);
  e.castTimer=.78;return true;
 }
 if(e.type==='cultist'&&dist<395){
  ritual(game,e,p.x,p.y,75,1.15,Math.round(e.damage*1.35),'#c6a4f6');
  e.specialCooldown=5.4;e.castTimer=.6;return true;
 }
 if(e.type==='sentinel'){
  e.guardTime=2.4;e.specialCooldown=4.8;
  game.createEffect('ring',e.x,e.y,'#bdd9df',.55,47);
 }
 return false;
}
export function towerEnemyDamage(e,d,dir){
 if(e.type!=='sentinel'||!(e.guardTime>0))return d;
 const face=normalized(e.moveX||-dir.x,e.moveY||-dir.y);
 const incoming=normalized(-dir.x,-dir.y);
 return face.x*incoming.x+face.y*incoming.y>.15?d*.48:d;
}
export function towerRoomHazard(game,dt){
 if(!game.tower||game.mode!=='playing'||game.enemies.every(e=>e.hp<=0))return;
 game.stageHazardClock=(game.stageHazardClock||0)-dt;
 if(game.stageHazardClock>0)return;
 const floor=game.floorDepth,room=game.dungeon.roomAt(game.player.x,game.player.y);
 if(!room||room.type==='start'||room.type==='shrine'||room.type==='treasure')return;
 game.stageHazardClock=Math.max(4.5,8.8-floor*.42);
 const p=game.player,stage=game.currentTowerStage();
 const radius=floor===10?90:floor%3===0?80:67;
 const delay=floor>=8?1.1:1.4;
 ritual(game,null,p.x,p.y,radius,delay,11+floor*1.65,stage.color);
 if(floor%3===2){
  const x=p.x+94,y=p.y-62;
  if(game.dungeon.canMove(x,y,12))ritual(game,null,x,y,48,delay+.33,8+floor,stage.color);
 }
}
