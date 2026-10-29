import {distance,normalized} from './data.js?v=0.15.0';
import {hasLineOfSight} from './navigation.js';

// Enemy roles share warning, windup and cooldown contracts. All attacks are
// dodgeable, use collision-aware movement and work with an idle player.
export const ENCOUNTER_ROLES=Object.freeze({
 assassin:{name:'Schattenläufer',role:'flanker',color:'#f3a2b2'},
 scout:{name:'Knochenjäger',role:'ranged',color:'#b9db97'},
 hexer:{name:'Runenwirker',role:'caster',color:'#cba3ff'},
 bulwark:{name:'Schildwache',role:'defender',color:'#c5d8e1'},
 burrower:{name:'Erdbohrer',role:'ambusher',color:'#dcc396'},
 chanter:{name:'Nebelrufer',role:'support',color:'#a5f2c4'}
});
export const rangedEncounterType=type=>type==='scout'||type==='hexer';
const warn=(g,x,y,color,time,radius)=>g.createEffect('ring',x,y,color,time,radius);
export function updateEncounterEnemy(g,e,dt){
 const role=ENCOUNTER_ROLES[e.type];
 if(!role||e.hp<=0)return false;
 const p=g.player,dist=distance(p,e);
 e.specialCooldown=Math.max(0,(e.specialCooldown??(1.1+e.spawnIndex*.24))-dt);
 if(e.special){
  const s=e.special;
  s.time-=dt;
  e.castTimer=Math.max(e.castTimer,Math.max(0,s.time));
  if(s.kind==='burrow'){
   if(s.time<=0){
    const targets=[[85,0],[-85,0],[0,85],[0,-85]];
    const candidate=targets.map(([dx,dy])=>({x:s.x+dx,y:s.y+dy}))
     .find(pos=>g.dungeon.canMove(pos.x,pos.y,e.radius,true));
    if(candidate){e.x=candidate.x;e.y=candidate.y;}
    e.special=null;e.specialCooldown=4.6;e.cooldown=.8;
    g.createEffect('burst',e.x,e.y,'#d8bc88',.42,45);
    if(distance(e,p)<e.radius+p.radius+45)g.hurt(e.damage*1.3,normalized(p.x-e.x,p.y-e.y));
   }
   return true;
  }
  if(s.kind==='chant'){
   if(s.time<=0){
    let count=0;
    for(const ally of g.enemies)if(ally!==e&&ally.hp>0&&distance(ally,e)<240){
     ally.speedBuff=Math.max(ally.speedBuff||0,3.6);
     ally.guardTime=Math.max(ally.guardTime||0,2.2);
     count++;
    }
    g.createEffect('ring',e.x,e.y,'#99e1bf',.5,180);
    e.special=null;e.specialCooldown=count?5:3;
   }
   return true;
  }
  if(s.kind==='assassin-windup'){
   if(s.time<=0)e.special={kind:'assassin-dash',time:.32,dir:s.dir,hit:false};
   return true;
  }
  if(s.kind==='assassin-dash'){
   const old={x:e.x,y:e.y};
   const step=e.speed*4.05*dt;
   g.move(e,s.dir.x*step,s.dir.y*step);
   if(!s.hit&&distance(e,p)<e.radius+p.radius+16&&hasLineOfSight(g.dungeon,e.x,e.y,p.x,p.y,true)){
    g.hurt(e.damage*1.15,s.dir);s.hit=true;
   }
   if(s.time<=0||distance(e,old)<step*.1){
    e.special=null;e.specialCooldown=4.3;
   }
   return true;
  }
  if(s.kind==='scout-volley'){
   if(s.time<=0){
    // Shot angle is locked when the telegraph is displayed, never homes later.
    for(const offset of [-.10,.10]){
     const a=s.angle+offset;
     g.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},
      e.damage*.75,false,true,405);
    }
    e.attackTimer=.28;
    e.special=null;e.specialCooldown=3.8;e.cooldown=1.25;
   }
   return true;
  }
  if(s.kind==='hexer-chant'){
   if(s.time<=0){
    g.hazards.push({x:s.x,y:s.y,radius:66,time:.64,maxTime:.64,
      damage:Math.round(e.damage*1.22),source:'hexer',color:role.color});
    e.special=null;e.specialCooldown=5.5;e.cooldown=1.3;
    g.createEffect('ring',s.x,s.y,role.color,.64,66);
   }
   return true;
  }
  if(s.kind==='bulwark-bash'){
   if(s.time<=0){
    if(distance(e,p)<e.radius+p.radius+52&&hasLineOfSight(g.dungeon,e.x,e.y,p.x,p.y,true)){
     const toward=normalized(p.x-e.x,p.y-e.y);
     const aim=normalized(s.dir.x,s.dir.y);
     if(toward.x*aim.x+toward.y*aim.y>.58)
      g.hurt(e.damage*1.25,aim);
    }
    e.attackTimer=.32;
    e.special=null;e.specialCooldown=5.3;e.cooldown=1.45;
   }
   return true;
  }
 }
 if(dist>455||e.specialCooldown>0||!hasLineOfSight(g.dungeon,e.x,e.y,p.x,p.y,true))return false;
 if(e.windup>0)return false; // Never override another queued projectile.
 const direction=normalized(p.x-e.x,p.y-e.y);
 if(e.type==='burrower'&&dist>85&&dist<350){
  const landing={x:p.x,y:p.y};
  e.special={kind:'burrow',time:.75,x:landing.x,y:landing.y};
  warn(g,landing.x,landing.y,role.color,.75,69);
  e.castTimer=.75;return true;
 }
 if(e.type==='chanter'){
  e.special={kind:'chant',time:.7};
  warn(g,e.x,e.y,role.color,.7,175);
  e.castTimer=.7;return true;
 }
 if(e.type==='assassin'&&dist>80&&dist<350){
  e.special={kind:'assassin-windup',time:.61,dir:direction};
  warn(g,e.x,e.y,role.color,.61,54);e.castTimer=.61;
  return true;
 }
 if(e.type==='scout'&&dist>100&&dist<410&&
    g.dungeon.canMove(e.x,e.y,e.radius,true)){
  e.special={kind:'scout-volley',time:.68,angle:Math.atan2(direction.y,direction.x)};
  warn(g,e.x,e.y,role.color,.68,48);e.castTimer=.68;
  return true;
 }
 if(e.type==='hexer'&&dist<395){
  const x=p.x,y=p.y;
  e.special={kind:'hexer-chant',time:.47,x,y};
  warn(g,x,y,role.color,1.11,66);
  e.castTimer=.47;return true;
 }
 if(e.type==='bulwark'&&dist<e.radius+p.radius+100){
  e.special={kind:'bulwark-bash',time:.64,dir:direction};
  e.guardTime=2.6;e.castTimer=.64;
  warn(g,e.x+direction.x*30,e.y+direction.y*30,role.color,.64,58);
  return true;
 }
 if(e.type==='bulwark'&&e.guardTime<=0){
  e.guardTime=2.0;e.specialCooldown=3.1;
  warn(g,e.x,e.y,role.color,.45,48);
 }
 return false;
}
export function encounterMitigation(e,d,dir){
 if(e.type!=='bulwark'||!(e.guardTime>0))return d;
 const f=normalized(e.moveX||-dir.x,e.moveY||-dir.y);
 const incoming=normalized(-dir.x,-dir.y);
 return f.x*incoming.x+f.y*incoming.y>.1?d*.55:d;
}
export function enemyRole(type){
 return ENCOUNTER_ROLES[type]?.role||
  (['archer','cultist'].includes(type)?'ranged':
   ['sentinel','brute'].includes(type)?'heavy':'melee');
}
