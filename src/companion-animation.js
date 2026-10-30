import {COMPANION_EMISSION} from './companion-emission.js?v=0.30.0';
export const COMPANION_KINDS=Object.freeze(['bat','imp','spirit','giant']);
export const COMPANION_ATTACKS=Object.freeze({bat:{duration:.36,cooldown:.7},imp:{duration:.30,cooldown:.48},spirit:{duration:.60,cooldown:1.05},giant:{duration:.54,cooldown:.68}});
export function companionFacing(d={x:0,y:1}){return Math.abs(d.x)>Math.abs(d.y)?d.x<0?'left':'right':d.y<0?'up':'down';}
export function beginCompanionAttack(s,target){
 const spec=COMPANION_ATTACKS[s.kind],dx=target.x-s.x,dy=target.y-s.y,len=Math.hypot(dx,dy)||1;
 s.direction={x:dx/len,y:dy/len};s.cooldown=spec.cooldown;
 return s.companionAction={clip:'attack',elapsed:0,duration:spec.duration,direction:{...s.direction},target,targetPoint:{x:target.x,y:target.y},fired:false};
}
export function advanceCompanion(s,dt,onRelease){
 const step=Math.max(0,dt);s.visualTime=(s.visualTime||0)+step;s.appearanceElapsed=(s.appearanceElapsed||0)+step;
 const a=s.companionAction;if(!a)return;
 a.elapsed=Math.min(a.duration,a.elapsed+step);
 if(!a.fired&&a.elapsed+1e-9>=a.duration*2/6){a.fired=true;onRelease(a);}
 if(s.companionAction===a&&a.elapsed+1e-9>=a.duration)s.companionAction=null;
}
export function companionPose(s,time=0){
 const a=s.companionAction,direction=a?.direction||s.direction||{x:0,y:1};
 let clip='motion',progress,face=companionFacing(direction);
 if(s.vanishElapsed!==undefined){clip='vanish';progress=s.vanishElapsed/.48;face='down';}
 else if(a){clip='attack';progress=a.elapsed/a.duration;}
 else if((s.appearanceElapsed??1)<.42){clip='summon';progress=s.appearanceElapsed/.42;face='down';}
 else{const duration=s.kind==='bat'?(s.moving?.42:.62):s.kind==='imp'?(s.moving?.50:.78):s.kind==='giant'?.9:1.05;progress=(s.visualTime??time)/duration;}
 return {clip,face,direction,frame:clip==='motion'?Math.floor(Math.max(0,progress)*6)%6:Math.min(5,Math.floor(Math.max(0,progress)*6)),progress:Math.min(1,Math.max(0,progress))};
}
export function companionShot(s,action=s.companionAction){
 const direction=action?.direction||s.direction||{x:0,y:1},hand=COMPANION_EMISSION[s.kind]?.[companionFacing(direction)]||[0,-35];
 const x=s.x+hand[0],y=s.y+hand[1],target=action?.targetPoint||{x:s.x+direction.x*260,y:s.y+direction.y*260};
 const dx=target.x-x,dy=target.y-27-y,n=Math.hypot(dx,dy)||1;
 return {x,y,aim:{x:dx/n,y:dy/n},angle:Math.atan2(dy,dx)};
}
