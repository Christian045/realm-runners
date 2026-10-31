import {KNIGHT_VISUAL_STRIDE} from './knight-walk.js?v=0.34.0';
// A complete stride advances with distance actually travelled, never key state.
export const WALK_STRIDE=72;
export const LEG_HEIGHTS=Object.freeze([27,26,25,24,19,17,21,25]);
export function advanceLocomotion(p,fromX,fromY,dashing=false,dt=1/60){
 const dx=p.x-fromX,dy=p.y-fromY,distance=Math.hypot(dx,dy);
 p.moving=!dashing&&distance>.01;
 const previous=p.gaitBlend??0,target=p.moving?1:0,step=Math.max(0,Math.min(.1,dt))*12;
 p.gaitBlend=previous+Math.max(-step,Math.min(step,target-previous));
 if(!p.moving)return;
 // Match the stride to the projected footprint: vertical views are foreshortened.
 const stride=60+12*Math.abs(dx/distance);
 p.walkDistance=((p.walkDistance||0)+distance*WALK_STRIDE/stride)%WALK_STRIDE;
 p.walkCycle=p.walkDistance/WALK_STRIDE*.54*14;
 // Knight art follows actual movement, but at a slower visual stride.
 if(p.kind==='warrior')p.knightWalkDistance=((p.knightWalkDistance||0)+distance)%KNIGHT_VISUAL_STRIDE;
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
 const move=p.heroMoveDirection||p.knightMoveDirection||pose.direction||{x:0,y:1};
 const length=Math.hypot(move.x,move.y)||1,dx=move.x/length,dy=move.y/length;
 const side=pose.face==='left'||pose.face==='right',stride=60+12*Math.abs(dx);
 const cycle=((p.walkDistance??((p.walkCycle||0)/14/.54*WALK_STRIDE))/WALK_STRIDE%1+1)%1;
 const blend=p.gaitBlend??(pose.clip==='idle'?0:1);
 return [0,1].map(leg=>{
  const phase=blend===0?0:(cycle+leg*.5)%1,t=(phase-.5)*2,swing=phase>=.5;
  const sweep=blend*stride*(swing?-.25+.5*t*t*(3-2*t):.25-phase);
  const lift=swing?Math.sin(Math.PI*t)*8*blend:0;
  const hipX=(side?(leg?2:-2):(leg?6:-6))+(pose.face==='right'?-5:pose.face==='left'?5:0),hipY=-20;
  const footY=8+dy*sweep-lift;
  return {frame:Math.floor(phase*8)%8,hipX,hipY,side,leg,phase,planted:!swing,
   height:Math.max(4,footY-hipY),footX:dx*sweep,footY};
 });
}
export function drawLocomotionLegs(ctx,p,pose,kit,image){
 const face=pose.face==='left'?'right':pose.face,legs=legPoses(p,pose);
 // The far leg is drawn first. Each leg owns a different, half-stride clock.
 for(const leg of pose.face==='left'?[...legs].reverse():legs){
  const f=kit.frames[face][leg.frame],scaleX=28/44*1.15;
  const localFootX=pose.face==='left'?-leg.footX:leg.footX;
  const bootSource=Math.max(1,Math.round(f.h*.3)),upperSource=f.h-bootSource;
  const bootHeight=Math.min(9,leg.height),upperHeight=leg.height-bootHeight;
  const bootLeft=localFootX-f.footX*scaleX;
  ctx.save();ctx.translate(Math.round(p.x+leg.hipX),Math.round(p.y+leg.hipY));
  if(pose.face==='left')ctx.scale(-1,1);
  // Preserve boot dimensions. Only the limb above it changes projected length;
  // the two pieces meet at the same source scanline without a visible seam.
  if(upperHeight>0){
   ctx.save();ctx.transform(1,0,(bootLeft+f.anchorX*scaleX)/upperHeight,1,0,0);
   ctx.drawImage(image,f.x,f.y,f.w,upperSource,-f.anchorX*scaleX,0,f.w*scaleX,upperHeight);ctx.restore();
  }
  ctx.drawImage(image,f.x,f.y+upperSource,f.w,bootSource,bootLeft,upperHeight,f.w*scaleX,bootHeight);
  ctx.restore();
 }
}
// The body is a separately authored garment layer with no baked-in legs.
// Draw both limbs behind its natural alpha silhouette; never cut the clothes.
export function drawLocomotion(ctx,p,pose,kit,image,drawBody){
 if((pose.clip==='walk'||pose.clip==='idle')&&kit&&image)drawLocomotionLegs(ctx,p,pose,kit,image);
 drawBody();
}
