// Shared 8-direction pose selection for the archived and approved hunter art.
export const HUNTER_ROWS=Object.freeze(['S','SW','W','NW','N','NE','E','SE']);
export const HUNTER_COUNTS=Object.freeze({idle:8,walk:8,attack:8,special:8,dash:8,hurt:8,death:8});
export const HUNTER_STRIDE=96;
export const hunterFacing=d=>((Math.round((Math.atan2(d?.y??1,d?.x??0)-Math.PI/2)/(Math.PI/4))%8)+8)%8;
const clamp=n=>Math.max(0,Math.min(1,n));
export function hunterPose(p,time=0,action=p.heroAction){
 let clip=action?.clip||(p.hurtTimer>0?'hurt':p.moving?'walk':'idle');
 if(!Object.hasOwn(HUNTER_COUNTS,clip))clip='idle';
 let progress=action?clamp((action.elapsed||0)/Math.max(.001,action.duration||1)):0;
 if(p.hp<=0){clip='death';progress=clamp((p.heroDeathElapsed||0)/1.04);}
 else if(clip==='hurt'&&!action)progress=clamp(1-(p.hurtTimer||0)/.34);
 const direction=(clip==='death'?p.heroDeathDirection:action?.direction)||
  (clip==='walk'?p.heroMoveDirection:null)||p.direction||{x:0,y:1};
 const row=hunterFacing(direction),count=HUNTER_COUNTS[clip];
 const phase=clip==='walk'?((((p.hunterWalkDistance??p.walkDistance??0)%HUNTER_STRIDE)+HUNTER_STRIDE)%HUNTER_STRIDE)/HUNTER_STRIDE:
  clip==='idle'?(((time%2.4)+2.4)%2.4)/2.4:progress;
 return {clip,row,frame:Math.min(count-1,Math.floor(phase*count)),count,progress,direction};
}

