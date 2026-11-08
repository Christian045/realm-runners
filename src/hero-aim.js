import {mageReady,mageShot} from './mage-production.js?v=0.58.0';
import {heroRigReady,articulatedShot} from './articulated-hero.js?v=0.40.0';
import {heroFacing} from './hero-animation.js?v=0.31.0';

// Weapon/hand origin is shared by rendering, projectile collision and VFX.
// Projectiles keep their floor-space physics; visual height is separate.
export const HERO_PROJECTILE_HEIGHT=27;
export const AIM_RIGS=Object.freeze({
 glasscannon:{x:0,y:-27,muzzle:48},hunter:{x:0,y:-28,muzzle:32}
});
// Existing full-body mage artwork carries an actual staff at the right side
// (left for back/left views). Cast from its crystal, never the mage's palm.
export const MAGE_STAFF_TIPS=Object.freeze({
 down:[22,-60],right:[28,-62],up:[-23,-62],left:[-28,-62]
});
const HANDS=Object.freeze({
 summoner:{down:[24,-44],right:[26,-44],up:[-23,-43],left:[-25,-44]},
 alchemist:{down:[15,-35],right:[22,-36],up:[19,-37],left:[-20,-40]}
});
const unit=(x,y,fallback)=>{const n=Math.hypot(x,y);return n>1e-6?{x:x/n,y:y/n}:{...fallback};};
export function castingIntensity(action){
 if(!action||!['attack','special'].includes(action.clip))return 0;
 const progress=Math.max(0,Math.min(1,(action.elapsed||0)/Math.max(.09,action.duration||.5)));
 // Extend by the exact release frame (3/6), hold briefly and retract.
 return progress<.42?Math.sin(progress/.42*Math.PI/2):
  progress<.64?1:Math.cos((progress-.64)/.36*Math.PI/2);
}
export function heroShot(p,action=p.heroAction){
 if(p.kind==='mage'&&mageReady())return mageShot(p,action);
 if(heroRigReady(p.kind))return articulatedShot(p,action);
 const direction=action?.direction||p.direction||{x:1,y:0},face=heroFacing(direction);
 const rig=AIM_RIGS[p.kind],hand=HANDS[p.kind]?.[face]||[0,-27];
 let ox=rig?.x??hand[0],oy=rig?.y??hand[1];
 if(p.kind==='mage'){
  const tip=MAGE_STAFF_TIPS[face];ox=tip[0];oy=tip[1];
 }
 if(p.kind==='summoner'){
  const amount=castingIntensity(action);
  const extension=face==='up'?[0,-16]:face==='down'?[7,11]:face==='right'?[17,-1]:[-17,-1];
  ox+=extension[0]*amount;oy+=extension[1]*amount;
 }
 const mount={x:p.x+ox,y:p.y+oy};
 const target=action?.target||{x:p.x+direction.x*260,y:p.y+direction.y*260-HERO_PROJECTILE_HEIGHT};
 const aim=unit(target.x-mount.x,target.y-mount.y,direction);
 const reach=rig?.muzzle||0;
 return {x:mount.x+aim.x*reach,y:mount.y+aim.y*reach,mount,aim,face,angle:Math.atan2(aim.y,aim.x),reach};
}
