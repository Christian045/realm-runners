import {normalized} from './data.js';

// Deterministic tactical movement: no FPS-dependent randomness, no new physics.
// Used only during ordinary enemy navigation, never while casting or charging.
export function separateEnemies(game,e,vector){
 const room=e.homeRoom;
 let sx=0,sy=0,count=0;
 const ideal=e.radius*2+24;
 for(const other of game.enemies){
  if(other===e||other.hp<=0||other.homeRoom!==room||other.type==='boss')continue;
  const dx=e.x-other.x,dy=e.y-other.y;
  const d=Math.hypot(dx,dy);
  if(d<1||d>=ideal)continue;
  const w=(ideal-d)/ideal;
  sx+=dx/d*w;sy+=dy/d*w;
  if(++count>=7)break; // bounded mobile cost
 }
 if(!count)return vector;
 const strength=.68;
 return normalized(vector.x+sx*strength,vector.y+sy*strength);
}

export function flankVector(game,e,target,steering,dt){
 const d=Math.hypot(target.x-e.x,target.y-e.y);
 if(!steering.clear||d<110||d>320)return steering;
 // Not every melee enemy flanks. Bulwarks hold the front; assassins and
 // goblins pressure the side without teleporting or ignoring collision.
 if(!['assassin','goblin','wraith'].includes(e.type))return steering;
 const side=((e.spawnIndex||0)+(e.homeRoom||0))%2?1:-1;
 const toward=normalized(target.x-e.x,target.y-e.y);
 const f=e.type==='assassin'?.53:.33;
 return {...steering,
  x:toward.x*(1-f)-toward.y*side*f,
  y:toward.y*(1-f)+toward.x*side*f};
}

export function lockEnemyAim(e,target){
 e.lockedAim=normalized(target.x-e.x,target.y-e.y);
 return e.lockedAim;
}

export function meleeArcContains(e,target,aim,reach,minimumDot=.18){
 const dx=target.x-e.x,dy=target.y-e.y;
 const dist=Math.hypot(dx,dy);
 if(dist>reach)return false;
 if(dist<2)return true;
 const facing=aim||normalized(dx,dy);
 return (dx*facing.x+dy*facing.y)/dist>=minimumDot;
}
