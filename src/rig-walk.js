// A grounded eight-direction gait shared by all playable character rigs.
// One full left/right stride advances over the actual 72-unit locomotion cycle.
// Boots are kept upright by the renderer, not rotated with the shins.
export const RIG_WALK_STRIDE=72;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function rigWalkFeet(distance=0,direction={x:0,y:1},moving=false,blend=1){
 const phase=((distance/RIG_WALK_STRIDE)%1+1)%1;
 const length=Math.hypot(direction?.x||0,direction?.y||0)||1;
 const dx=(direction?.x||0)/length,dy=(direction?.y||0)/length;
 const weight=moving?clamp(blend):0;
 return [-1,1].map((side,i)=>{
  const step=(phase+i*.5)%1,airborne=step>=.5;
  const t=airborne?(step-.5)*2:step*2;
  // Stance foot travels backward relative to the moving body; swing foot
  // returns forward in a short eased arc. Neither causes vertical body bounce.
  const travel=(airborne?-9+18*ease(t):9-18*t)*weight;
  const lift=airborne?5*Math.sin(Math.PI*t)*weight:0;
  return {side,index:i,phase:step,airborne,travel,lift,
   dx:dx*travel,dy:dy*travel*.45-lift};
 });
}
