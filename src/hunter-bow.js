// One source of truth for the Jäger's string, nock and both hand anchors.
// The gameplay event occurs at frame 3/6: the arrow must disappear from the
// string at the same moment the projectile is created by advanceHeroAction.
export const HUNTER_RELEASE_PROGRESS=3/6;
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
export function hunterBowPose(clip,progress=0){
 const firing=clip==='attack'||clip==='special',t=clamp(progress);
 const hasArrow=firing&&t<HUNTER_RELEASE_PROGRESS;
 const draw=hasArrow?smooth(t/.36):0;
 const stringX=20-12*draw;
 return {draw,stringX,hasArrow,bowHandX:20,
  drawHandX:hasArrow?stringX:10,
  released:firing&&t>=HUNTER_RELEASE_PROGRESS&&t<.58};
}
