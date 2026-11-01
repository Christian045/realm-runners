// Complete, dedicated eight-frame walk art for the two robe-wearing classes.
// Rows (front/right/back/left) are entire figures with boots and garments.
// No procedural limb masks, overlays, animation blending or reflected weapons.
export const ROBED_WALK_SIZE=96;
export const ROBED_WALK_ROWS=Object.freeze({down:0,right:1,up:2,left:3});
export const ROBED_WALK_KINDS=Object.freeze(['summoner','mage']);
export const ROBED_WALK_STRIDE=240;

export function isRobedWalker(kind){return kind==='summoner'||kind==='mage';}

export function robedWalkFrame(p){
 const dist=p.robedWalkDistance??p.walkDistance??0;
 return ((Math.floor(dist/ROBED_WALK_STRIDE*8)%8)+8)%8;
}

export function drawRobedWalk(ctx,p,pose,image){
 if(pose.clip!=='walk'||!image||!isRobedWalker(p.kind))return false;
 const row=ROBED_WALK_ROWS[pose.face];
 if(row===undefined)return false;
 const frame=robedWalkFrame(p);
 ctx.drawImage(image,frame*ROBED_WALK_SIZE,row*ROBED_WALK_SIZE,
  ROBED_WALK_SIZE,ROBED_WALK_SIZE,
  Math.round(p.x-48),Math.round(p.y-79),ROBED_WALK_SIZE,ROBED_WALK_SIZE);
 return true;
}
