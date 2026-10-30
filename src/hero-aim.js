import {heroFacing} from './hero-animation.js?v=0.29.0';

// World-space coordinates shared by the weapon renderer and combat simulation.
// Body sprites are grounded at the feet; hands sit above that origin.
export const HERO_PROJECTILE_HEIGHT=27;
export const AIM_RIGS=Object.freeze({
 glasscannon:{x:0,y:-27,muzzle:48},hunter:{x:0,y:-28,muzzle:32}
});
const HANDS={
 mage:{down:[28,-39],right:[32,-42],up:[-25,-42],left:[-32,-42]},
 summoner:{down:[-27,-37],right:[30,-46],up:[-24,-42],left:[-30,-43]},
 alchemist:{down:[15,-35],right:[22,-36],up:[19,-37],left:[-20,-40]}
};
const unit=(x,y,fallback)=>{const n=Math.hypot(x,y);return n>1e-6?{x:x/n,y:y/n}:{...fallback};};
export function heroShot(p,action=p.heroAction){
 const direction=action?.direction||p.direction||{x:1,y:0},face=heroFacing(direction);
 const rig=AIM_RIGS[p.kind],hand=HANDS[p.kind]?.[face]||[0,-27];
 const mount={x:p.x+(rig?.x??hand[0]),y:p.y+(rig?.y??hand[1])};
 // Touch/keyboard aim converges on the same floor row as the player.
 const target=action?.target||{x:p.x+direction.x*260,y:p.y+direction.y*260-HERO_PROJECTILE_HEIGHT};
 const aim=unit(target.x-mount.x,target.y-mount.y,direction);
 const reach=rig?.muzzle||0;
 return {x:mount.x+aim.x*reach,y:mount.y+aim.y*reach,mount,aim,face,angle:Math.atan2(aim.y,aim.x),reach};
}
