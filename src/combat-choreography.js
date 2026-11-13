// Authored combat poses for the three hero classes. All positions are in
// the same floor-space coordinates as the painted rig and projectile sockets.
// Timing must agree with KNIGHT_CLIPS.hitFrame and HERO_CLIPS.releaseFrame.
export const COMBAT_HITS=Object.freeze({attack1:3/8,attack2:4/8,attack3:4/8,special:3/8,attack:3/6});
export const combatContact=(kind,clip)=>clip==='special'&&kind!=='warrior'?.5:(COMBAT_HITS[clip]??.5);
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const frame=(time,keys)=>{
 const t=clamp(time);
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
  const [at,value]=keys[i-1],[end,next]=keys[i],blend=smooth((t-at)/(end-at));
  return value+(next-value)*blend;
 }
 return keys[keys.length-1][1];
};
const unit=d=>{const length=Math.hypot(d?.x||0,d?.y||0);return length?{x:d.x/length,y:d.y/length}:{x:0,y:1}};
// The torso rotates about the waist, not around the character's center.
// Apply this to shoulder, wrist and weapon positions before physics emission.
export function rotateCombatPoint(point,motion){
 const dx=point.x,dy=point.y+25,c=Math.cos(motion.roll),s=Math.sin(motion.roll);
 return {x:motion.dx+dx*c-dy*s,y:-25+motion.dy+dx*s+dy*c};
}
export function combatChoreography(kind,clip,t,direction){
 const d=unit(direction),side={x:-d.y,y:d.x},hit=combatContact(kind,clip);
 const idle={active:false,hit,roll:0,dx:0,dy:0,extend:0,wind:0,impact:0,sword:.8,staff:-Math.PI/2,lift:0,handSide:0};
 if(!/^(attack[123]?|special)$/.test(clip)||!['warrior','mage','summoner','hunter'].includes(kind))return idle;
 const time=clamp(t),windEnd=kind==='warrior'?(clip==='attack3'?.28:hit*.52):.24;
 const wind=frame(time,[[0,0],[windEnd,1],[hit,.14],[.67,0],[1,0]]);
 const extend=frame(time,[[0,0],[windEnd,.05],[hit,1],[.63,.85],[.92,0],[1,0]]);
 const impact=frame(time,[[0,0],[hit-.09,0],[hit,1],[hit+.10,.65],[.72,0],[1,0]]);
 if(kind==='warrior'){
  const reverse=clip==='attack2',overhead=clip==='attack3',special=clip==='special',sign=reverse?-1:1;
  const twist=overhead?.065:special?.13:.17;
  const roll=sign*frame(time,[[0,0],[windEnd,-twist],[hit,twist*.72],[.64,twist],[1,0]]);
  const lunge=frame(time,[[0,0],[windEnd,-2],[hit,overhead?7:5],[.66,3],[1,0]]);
  // Overhead wind-up raises the blade above the head in *every* facing,
  // including rear views where a single relative sword angle pointed down.
  const overheadUp=Math.atan2(-1,d.x*.65+.2*Math.max(0,d.y));
  const aimAngle=Math.atan2(d.y,d.x);
  const overheadWind=Math.atan2(Math.sin(overheadUp-aimAngle),Math.cos(overheadUp-aimAngle));
  const sword=overhead?frame(time,[[0,.8],[windEnd,overheadWind],[hit,-.06],[.67,.28],[1,.8]]):
   special?frame(time,[[0,.8],[windEnd,-2.0],[hit,0],[.65,1.7],[1,.8]]):
   reverse?frame(time,[[0,.8],[windEnd,1.48],[hit,0],[.64,-1.1],[1,.8]]):
   frame(time,[[0,.8],[windEnd,-1.55],[hit,0],[.64,1.2],[1,.8]]);
  return {active:true,hit,roll,dx:d.x*lunge,dy:d.y*lunge*.5,
   extend,wind,impact,sword,staff:-Math.PI/2,
   lift:overhead?frame(time,[[0,0],[windEnd,17],[hit,0],[1,0]]):
    frame(time,[[0,0],[windEnd,6],[hit,0],[1,0]]),
   handSide:sign*frame(time,[[0,0],[windEnd,-5],[hit,5],[.67,3],[1,0]])};
 }
 if(kind==='hunter'){
  // Bow: weight shifts backward while drawing, forward as the arrow leaves
  // at frame 3/6. Shoulder, hands, bow and muzzle share this same transform.
  const sign=d.x<-.15?-1:1,windEnd=.24;
  const roll=sign*frame(time,[[0,0],[windEnd,-.095],[hit,.065],[.68,.035],[1,0]]);
  const advance=frame(time,[[0,0],[windEnd,-2.5],[hit,3.5],[.68,1.5],[1,0]]);
  return {active:true,hit,roll,dx:d.x*advance,dy:d.y*advance*.42,
   extend,wind,impact,sword:.8,staff:-Math.PI/2,lift:0,handSide:0};
 }
 if(kind==='mage'){
  const sign=d.x<-.15?-1:1,roll=sign*frame(time,[[0,0],[.24,-.12],[hit,.10],[.69,.06],[1,0]]);
  const thrust=frame(time,[[0,0],[.24,-2],[hit,4],[.68,2],[1,0]]);
  // The tip faces the foe at release without turning the entire body or
  // flipping the staff upside-down in north-facing views.
  const frontBias=clamp((d.y-.75)*4);
  const staffAim=Math.atan2(d.y*.35-.9,d.x*.85+.35*(-side.x))+.62*frontBias;
  const first=-Math.PI/2;
  const delta=Math.atan2(Math.sin(staffAim-first),Math.cos(staffAim-first));
  const staff=first+frame(time,[[0,0],[.24,-.35],[hit,delta],[.64,delta],[1,0]]);
  return {active:true,hit,roll,dx:d.x*thrust,dy:d.y*thrust*.45,
   extend,wind,impact,sword:.8,staff,
   lift:frame(time,[[0,0],[.24,11],[hit,0],[1,0]]),handSide:frame(time,[[0,0],[.24,-3],[hit,7],[.65,4],[1,0]])};
 }
 const sign=d.x<-.15?-1:1;
 const roll=sign*frame(time,[[0,0],[.20,-.09],[hit,.10],[.66,.065],[1,0]]);
 const thrust=frame(time,[[0,0],[.20,-2],[hit,5],[.66,2],[1,0]]);
 return {active:true,hit,roll,dx:d.x*thrust,dy:d.y*thrust*.45,
  extend,wind,impact,sword:.8,staff:-Math.PI/2,
  lift:frame(time,[[0,0],[.20,8],[hit,0],[1,0]]),handSide:0};
}
