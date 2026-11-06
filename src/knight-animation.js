import {KNIGHT_VISUAL_STRIDE} from './knight-walk.js?v=0.46.0';
import {WALK_STRIDE} from './locomotion.js?v=0.46.0';
// Action-local clocks: graphics and damage share the same frame boundary.
export const KNIGHT_CLIPS=Object.freeze({
 idle:{row:0,frames:8,duration:1.6,loop:true},
 walk:{row:1,frames:8,duration:.64,loop:true},
 attack1:{row:2,frames:8,hitFrame:3},
 attack2:{row:3,frames:8,hitFrame:4},
 attack3:{row:4,frames:8,hitFrame:4},
 special:{row:5,frames:8,duration:.64,hitFrame:3},
 recovery:{row:9,frames:6,duration:.12},
 dash:{row:6,frames:8,duration:.18},
 hurt:{row:7,frames:8,duration:.34},
 death:{row:8,frames:8,duration:1.04}
});
export function knightFacing(d={x:0,y:1}){
 return Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down';
}
export function beginKnightAction(p,clip,duration,direction=p.direction){
 const spec=KNIGHT_CLIPS[clip];
 p.knightRecoveryTimer=0;
 p.knightAction={clip,elapsed:0,duration:Math.max(.09,duration||spec.duration),
  direction:{...direction},fired:false};
 return p.knightAction;
}
export function advanceKnightAction(p,dt,onHit){
 p.knightRecoveryTimer=Math.max(0,(p.knightRecoveryTimer||0)-Math.max(0,dt));
 const a=p.knightAction;if(!a)return;
 const nextElapsed=Math.min(a.duration,a.elapsed+Math.max(0,dt));
 const spec=KNIGHT_CLIPS[a.clip],eventTime=spec.hitFrame===undefined?Infinity:a.duration*spec.hitFrame/spec.frames;
 if(!a.fired&&nextElapsed+1e-9>=eventTime){
  // Sample moving hands at the exact authored release, even after a long frame.
  a.elapsed=eventTime;a.fired=true;onHit(a);
 }
 a.elapsed=nextElapsed;
 if(p.knightAction===a&&a.elapsed+1e-9>=a.duration){
  p.knightAction=null;
  if(a.clip.startsWith('attack')||a.clip==='special'){
   p.knightRecoveryTimer=KNIGHT_CLIPS.recovery.duration;
   p.knightRecoveryDirection={...a.direction};
  }
 }
}
export function knightPose(p,time=0){
 let clip='idle',elapsed=time,duration=KNIGHT_CLIPS.idle.duration;
 let direction=p.direction;
 if(p.hp<=0){clip='death';elapsed=p.knightDeathElapsed||0;duration=KNIGHT_CLIPS.death.duration;direction=p.knightDeathDirection||direction;}
 else if(p.knightAction){({clip,elapsed,duration,direction}=p.knightAction);}
 else if(p.hurtTimer>0){clip='hurt';elapsed=.34-p.hurtTimer;duration=.34;}
 else if(p.knightRecoveryTimer>0&&!p.moving){
  clip='recovery';duration=KNIGHT_CLIPS.recovery.duration;
  elapsed=duration-p.knightRecoveryTimer;
  direction=p.knightRecoveryDirection||direction;
 }
 else if(p.moving){clip='walk';duration=KNIGHT_CLIPS.walk.duration;elapsed=p.knightWalkDistance===undefined?
  (p.walkDistance===undefined?(p.walkCycle||0)/14:p.walkDistance/WALK_STRIDE*duration):
  p.knightWalkDistance/KNIGHT_VISUAL_STRIDE*duration;
  direction=p.knightMoveDirection||direction;}
 const spec=KNIGHT_CLIPS[clip];
 const progress=Math.max(0,elapsed/duration);
 const frame=spec.loop?Math.floor(progress*spec.frames)%spec.frames:Math.min(spec.frames-1,Math.floor(progress*spec.frames));
 return {clip,row:spec.row,frame,face:knightFacing(direction),direction,progress:Math.min(1,progress)};
}
