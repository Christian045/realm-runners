import {WALK_STRIDE} from './locomotion.js?v=0.30.2';
// Ranged classes share the knight's event-clock model, with their own poses.
export const HERO_KINDS=Object.freeze(['hunter','mage','glasscannon','summoner','alchemist']);
export const HERO_CLIPS=Object.freeze({
 idle:{row:0,frames:6,duration:1.5,loop:true},walk:{row:1,frames:6,duration:.54,loop:true},
 attack:{row:2,frames:6,releaseFrame:3},special:{row:3,frames:6,releaseFrame:3},
 dash:{row:4,frames:6,duration:.18},hurt:{row:5,frames:6,duration:.34},death:{row:6,frames:6,duration:1.04}
});
export function heroFacing(d={x:0,y:1}){
 return Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down';
}
export function beginHeroAction(p,clip,duration,direction=p.direction){
 const spec=HERO_CLIPS[clip];
 return p.heroAction={clip,duration:Math.max(.09,duration||spec.duration),elapsed:0,direction:{...direction},fired:false};
}
export function advanceHeroAction(p,dt,onRelease){
 const a=p.heroAction;if(!a)return;
 a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,dt));
 const spec=HERO_CLIPS[a.clip];
 if(!a.fired&&spec.releaseFrame!==undefined&&a.elapsed+1e-9>=a.duration*spec.releaseFrame/spec.frames){a.fired=true;onRelease(a);}
 if(p.heroAction===a&&a.elapsed+1e-9>=a.duration)p.heroAction=null;
}
export function heroPose(p,time=0){
 let clip='idle',elapsed=time,duration=HERO_CLIPS.idle.duration,direction=p.direction;
 if(p.hp<=0){clip='death';elapsed=p.heroDeathElapsed||0;duration=1.04;direction=p.heroDeathDirection||direction;}
 else if(p.heroAction){({clip,elapsed,duration,direction}=p.heroAction);}
 else if(p.hurtTimer>0){clip='hurt';elapsed=.34-p.hurtTimer;duration=.34;}
 else if(p.moving){clip='walk';duration=HERO_CLIPS.walk.duration;elapsed=p.walkDistance===undefined?(p.walkCycle||0)/14:p.walkDistance/WALK_STRIDE*duration;direction=p.heroMoveDirection||direction;}
 const spec=HERO_CLIPS[clip],progress=Math.max(0,elapsed/duration);
 return {clip,row:spec.row,frame:spec.loop?Math.floor(progress*spec.frames)%spec.frames:Math.min(spec.frames-1,Math.floor(progress*spec.frames)),
  face:heroFacing(direction),direction,progress:Math.min(1,progress)};
}
