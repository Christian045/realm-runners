// A complete stride advances with distance actually travelled, never key state.
export const WALK_STRIDE=72;
export const LEG_HEIGHTS=Object.freeze([27,26,25,24,19,17,21,25]);
export function advanceLocomotion(p,fromX,fromY,dashing=false){
 const dx=p.x-fromX,dy=p.y-fromY,distance=Math.hypot(dx,dy);
 p.moving=!dashing&&distance>.01;
 if(!p.moving)return;
 p.walkDistance=((p.walkDistance||0)+distance)%WALK_STRIDE;
 p.walkCycle=p.walkDistance/WALK_STRIDE*.54*14;
 p.heroMoveDirection={x:dx/distance,y:dy/distance};
 p.knightMoveDirection={...p.heroMoveDirection};
}
export function locomotionFrame(p,facingDirection){
 let phase=p.walkDistance===undefined?(p.walkCycle||0)/14/.54:p.walkDistance/WALK_STRIDE;
 const move=p.heroMoveDirection||p.knightMoveDirection;
 if(move&&facingDirection&&move.x*facingDirection.x+move.y*facingDirection.y<-.2)phase=-phase;
 return ((Math.floor(phase*8)%8)+8)%8;
}
export function legPoses(p,pose){
 const frame=locomotionFrame(p,pose.direction),side=pose.face==='left'||pose.face==='right';
 return [0,1].map(leg=>({frame:(frame+leg*4)%8,hipX:side?(leg?2:-2):(leg?8:-8),hipY:-18,side,
  height:LEG_HEIGHTS[(frame+leg*4)%8],footX:side?[12,4,-4,-12,-12,-3,8,14][(frame+leg*4)%8]:0,leg}));
}
export function drawLocomotionLegs(ctx,p,pose,kit,image){
 const face=pose.face==='left'?'right':pose.face,legs=legPoses(p,pose);
 // The far leg is drawn first. Each leg owns a different, half-stride clock.
 for(const leg of pose.face==='left'?[...legs].reverse():legs){
  const f=kit.frames[face][leg.frame],scale=leg.height/f.h;
  ctx.save();ctx.translate(Math.round(p.x+leg.hipX),Math.round(p.y+leg.hipY));
  if(pose.face==='left')ctx.scale(-1,1);
  // Retarget each authored bent-leg pose to its planted/swing foot path.
  const widthScale=1.55;
  const shear=(leg.footX-(f.footX-f.anchorX)*scale*widthScale)/(leg.height*.94);
  ctx.transform(1,0,shear,1,0,0);
  ctx.drawImage(image,f.x,f.y,f.w,f.h,-f.anchorX*scale*widthScale,0,f.w*scale*widthScale,leg.height);ctx.restore();
 }
}
export function drawLocomotion(ctx,p,pose,kit,image,drawBody){
 const action=pose.clip.startsWith('attack')||pose.clip==='special';
 if(!kit||!image||!p.moving||p.hp<=0||!(pose.clip==='walk'||action)){drawBody();return;}
 drawLocomotionLegs(ctx,p,pose,kit,image);
 // Keep the torso and held items above the hip line. The knight's long blade
 // can extend outside the leg region below it; no old boots survive the mask.
 ctx.save();ctx.beginPath();ctx.rect(p.x-512,p.y-512,1024,pose.face==='up'?498:494);
 // Preserve the outer cape/robe tails without retaining the source boots.
 ctx.rect(p.x-512,p.y-18,488,15);ctx.rect(p.x+24,p.y-18,488,15);
 ctx.clip();drawBody();ctx.restore();
 if(p.kind==='warrior')drawBody(true);
}
