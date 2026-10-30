// Action-local clocks: graphics and damage share the same frame boundary.
export const KNIGHT_CLIPS=Object.freeze({
 idle:{row:0,frames:8,duration:1.6,loop:true},
 walk:{row:1,frames:8,duration:.64,loop:true},
 attack1:{row:2,frames:8,hitFrame:3},
 attack2:{row:3,frames:8,hitFrame:4},
 attack3:{row:4,frames:8,hitFrame:4},
 special:{row:5,frames:8,duration:.64,hitFrame:3},
 dash:{row:6,frames:8,duration:.18},
 hurt:{row:7,frames:8,duration:.34},
 death:{row:8,frames:8,duration:1.04}
});
export function knightFacing(d={x:0,y:1}){
 return Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down';
}
export function beginKnightAction(p,clip,duration,direction=p.direction){
 const spec=KNIGHT_CLIPS[clip];
 p.knightAction={clip,elapsed:0,duration:Math.max(.09,duration||spec.duration),
  direction:{...direction},fired:false};
 return p.knightAction;
}
export function advanceKnightAction(p,dt,onHit){
 const a=p.knightAction;if(!a)return;
 a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,dt));
 const clip=KNIGHT_CLIPS[a.clip];
 if(!a.fired&&clip.hitFrame!==undefined&&a.elapsed+1e-9>=a.duration*clip.hitFrame/clip.frames){
  a.fired=true;onHit(a);
 }
 if(p.knightAction===a&&a.elapsed+1e-9>=a.duration)p.knightAction=null;
}
export function knightPose(p,time=0){
 let clip='idle',elapsed=time,duration=KNIGHT_CLIPS.idle.duration;
 let direction=p.direction;
 if(p.hp<=0){clip='death';elapsed=p.knightDeathElapsed||0;duration=KNIGHT_CLIPS.death.duration;direction=p.knightDeathDirection||direction;}
 else if(p.knightAction){({clip,elapsed,duration,direction}=p.knightAction);}
 else if(p.hurtTimer>0){clip='hurt';elapsed=.34-p.hurtTimer;duration=.34;}
 else if(p.moving){clip='walk';elapsed=(p.walkCycle||0)/14;duration=KNIGHT_CLIPS.walk.duration;direction=p.knightMoveDirection||direction;}
 const spec=KNIGHT_CLIPS[clip];
 const progress=Math.max(0,elapsed/duration);
 const frame=spec.loop?Math.floor(progress*spec.frames)%spec.frames:Math.min(spec.frames-1,Math.floor(progress*spec.frames));
 return {clip,row:spec.row,frame,face:knightFacing(direction),direction,progress:Math.min(1,progress)};
}
