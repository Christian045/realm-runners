import {findGroundContact,WALK_FOOT_OFFSET} from './grounded-walk.js?v=0.32.0';

// Original standalone, hand-authored full-body art; nothing is rotated,
// stretched or cut into interchangeable body parts at runtime.
export const KNIGHT_WALK_CELL=80;
export const KNIGHT_WALK_ROWS=Object.freeze({down:0,up:1,left:2,right:3});
export const KNIGHT_WALK_FRAMES=8;
export const KNIGHT_WALK_ROOT_X=40;

// The complete silhouette stays rigid and only the root is translated to put
// the visible boots on one world-space ground plane.
export function calibrateKnightWalk(image,canvasFactory=()=>document.createElement('canvas')){
 const canvas=canvasFactory();
 canvas.width=KNIGHT_WALK_CELL;canvas.height=KNIGHT_WALK_CELL;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)return {};
 context.imageSmoothingEnabled=false;
 const pivots={};
 for(const [face,row] of Object.entries(KNIGHT_WALK_ROWS)){
  pivots[face]=[];
  for(let frame=0;frame<KNIGHT_WALK_FRAMES;frame++){
   context.clearRect(0,0,KNIGHT_WALK_CELL,KNIGHT_WALK_CELL);
   context.drawImage(image,frame*KNIGHT_WALK_CELL,row*KNIGHT_WALK_CELL,
    KNIGHT_WALK_CELL,KNIGHT_WALK_CELL,0,0,KNIGHT_WALK_CELL,KNIGHT_WALK_CELL);
   const pixels=context.getImageData(0,0,KNIGHT_WALK_CELL,KNIGHT_WALK_CELL).data;
   const foot=findGroundContact(pixels,KNIGHT_WALK_CELL,KNIGHT_WALK_CELL,KNIGHT_WALK_ROOT_X);
   pivots[face].push(foot===null?70:foot-WALK_FOOT_OFFSET);
  }
 }
 return pivots;
}

export function drawKnightWalk(ctx,p,pose,image,pivots={}){
 const row=KNIGHT_WALK_ROWS[pose.face];
 if(!image||row===undefined||pose.clip!=='walk')return false;
 const frame=((pose.frame%KNIGHT_WALK_FRAMES)+KNIGHT_WALK_FRAMES)%KNIGHT_WALK_FRAMES;
 const ground=pivots[pose.face]?.[frame]??70;
 ctx.drawImage(image,frame*KNIGHT_WALK_CELL,row*KNIGHT_WALK_CELL,
  KNIGHT_WALK_CELL,KNIGHT_WALK_CELL,
  Math.round(p.x-KNIGHT_WALK_ROOT_X),Math.round(p.y-ground),
  KNIGHT_WALK_CELL,KNIGHT_WALK_CELL);
 return true;
}
