// Dedicated whole-body knight walk: 8 frames in each of four directions.
// No separate leg/robe compositing and no animation of the combat sheet.
export const KNIGHT_WALK_SIZE=96;
export const KNIGHT_WALK_FACES=Object.freeze({down:0,right:1,up:2,left:3});
// The visual cycle is intentionally slower than the previous 60–72px stride.
export const KNIGHT_VISUAL_STRIDE=224;
export function drawKnightWalk(ctx,p,pose,image){
 if(pose.clip!=='walk'||!image)return false;
 const row=KNIGHT_WALK_FACES[pose.face];
 if(row===undefined)return false;
 const frame=((pose.frame%8)+8)%8;
 ctx.drawImage(image,frame*KNIGHT_WALK_SIZE,row*KNIGHT_WALK_SIZE,
  KNIGHT_WALK_SIZE,KNIGHT_WALK_SIZE,
  Math.round(p.x-48),Math.round(p.y-79),
  KNIGHT_WALK_SIZE,KNIGHT_WALK_SIZE);
 return true;
}
