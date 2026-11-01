import {drawUnifiedBody} from './unified-body.js?v=0.36.0';
// Shared full-body art for both walking and standing on the two robe-wearing classes.
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
 if(!isRobedWalker(p.kind))return false;
 return drawUnifiedBody(ctx,p,pose,image,p.kind,robedWalkFrame(p));
}
