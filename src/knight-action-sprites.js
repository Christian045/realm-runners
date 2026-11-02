// Stable full-body knight attacks: keep the same armour, helmet and cape
// as idle. Only the forearm and the sword move during the combo.
// The former 96px attack sheets changed the whole character from frame to frame.
export const KNIGHT_ACTION_CELL=96;
export const KNIGHT_ACTION_FACES=Object.freeze({down:0,right:1,up:2,left:3});
// Only idle art needs decoding; the three combo attacks reuse that exact model.
export const KNIGHT_ACTION_CLIPS=Object.freeze(['idle']);
const FOOT_ANCHOR=Object.freeze({down:78,right:79,up:78,left:79});
const clipNames=['attack1','attack2','attack3'];
const clamp01=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;

export function knightActionFrame(pose){
 if(pose.clip==='idle')return ((pose.frame|0)%8+8)%8;
 return clipNames.includes(pose.clip)?0:null;
}

// A readable three-beat sword combo. The hit window (3/8 or 4/8)
// coincides with the fast middle section, never with an arbitrary flip.
export function knightSwordAngle(clip,progress){
 const t=clamp01(progress);
 const reverse=clip==='attack2';
 const overhead=clip==='attack3';
 const rest=reverse?.62:.48;
 const windup=reverse?1.02:overhead?-1.66:-1.22;
 const finish=reverse?-1.15:overhead?.98:.90;
 if(t<.18)return lerp(rest,windup,ease(t/.18));
 if(t<.55)return lerp(windup,finish,ease((t-.18)/.37));
 return lerp(finish,.50,ease((t-.55)/.45));
}
function paintSword(ctx,p,pose){
 const face=pose.face,mirror=face==='left'?-1:1;
 const t=clamp01(pose.progress);
 const anchor=face==='up'?[16,-38]:face==='down'?[19,-36]:[19,-39];
 const shoulder=face==='up'?[8,-47]:face==='down'?[13,-48]:[11,-47];
 const strike=t>.24&&t<.61;
 ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
 ctx.scale(mirror,1);
 const hx=anchor[0]+(strike?2:0),hy=anchor[1]+(t>.24&&t<.55?1:0);
 // Shoulder to gauntlet: just the weapon arm, never the torso.
 ctx.lineCap='square';
 ctx.strokeStyle='#251f2d';ctx.lineWidth=10;
 ctx.beginPath();ctx.moveTo(...shoulder);ctx.lineTo(hx-3,hy);ctx.stroke();
 ctx.strokeStyle='#ad7d4b';ctx.lineWidth=6;
 ctx.beginPath();ctx.moveTo(shoulder[0]+1,shoulder[1]+1);ctx.lineTo(hx-3,hy);ctx.stroke();
 ctx.fillStyle='#514b50';ctx.fillRect(hx-6,hy-5,11,10);
 ctx.fillStyle='#d8a95b';ctx.fillRect(hx-4,hy-3,8,6);
 ctx.translate(hx,hy);ctx.rotate(knightSwordAngle(pose.clip,t));
 // A single 31px blade, physically connected to the hand.
 ctx.fillStyle='#3c2c2a';ctx.fillRect(-10,-4,16,8);
 ctx.fillStyle='#a77b46';ctx.fillRect(-8,-2,13,4);
 ctx.fillStyle='#1c2631';ctx.fillRect(4,-9,5,18);
 ctx.fillStyle='#efd19a';ctx.fillRect(5,-7,3,14);
 ctx.fillStyle='#253344';ctx.beginPath();
 ctx.moveTo(9,-5);ctx.lineTo(31,-5);ctx.lineTo(43,0);
 ctx.lineTo(31,5);ctx.lineTo(9,5);ctx.closePath();ctx.fill();
 ctx.fillStyle='#879faf';ctx.beginPath();
 ctx.moveTo(10,-3);ctx.lineTo(29,-3);ctx.lineTo(40,0);
 ctx.lineTo(29,3);ctx.lineTo(10,3);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e2e9e7';ctx.beginPath();
 ctx.moveTo(12,-3);ctx.lineTo(29,-3);ctx.lineTo(38,-1);
 ctx.lineTo(12,-1);ctx.closePath();ctx.fill();
 if(strike){
  // Short, restrained blade trail rather than a rotating character.
  ctx.globalAlpha=.34*(1-Math.abs(t-.43)*2);
  ctx.strokeStyle=pose.clip==='attack3'?'#f5d79a':'#b9d9df';
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(28,-7);ctx.lineTo(45,-2);ctx.stroke();
 }
 ctx.restore();
}

export function drawKnightAction(ctx,p,pose,images){
 const frame=knightActionFrame(pose),row=KNIGHT_ACTION_FACES[pose.face];
 if(frame===null||row===undefined)return false;
 const idle=images?.idle;
 if(!idle)return false;
 const foot=FOOT_ANCHOR[pose.face];
 const dx=Math.round(p.x-48),dy=Math.round(p.y-foot);
 if(pose.clip==='idle'){
  ctx.drawImage(idle,frame*96,row*96,96,96,dx,dy,96,96);
  return true;
 }
 // The idle side-profile holds a baked-in resting sword. Clip just the
 // protruding blade when the independently articulated attack sword is shown.
 if(pose.face==='up')paintSword(ctx,p,pose);
 ctx.save();
 if(pose.face==='right'||pose.face==='left'){
  ctx.beginPath();
  if(pose.face==='right')ctx.rect(dx,dy,68,96);
  else ctx.rect(dx+27,dy,69,96);
  ctx.clip();
 }
 ctx.drawImage(idle,0,row*96,96,96,dx,dy,96,96);
 ctx.restore();
 if(pose.face!=='up')paintSword(ctx,p,pose);
 return true;
}
