import {drawUnifiedBody} from './unified-body.js?v=0.39.0';
// Dedicated whole-body knight walk: 8 frames in each of four directions.
// No separate leg/robe compositing and no animation of the combat sheet.
export const KNIGHT_WALK_SIZE=96;
export const KNIGHT_WALK_FACES=Object.freeze({down:0,right:1,up:2,left:3});
// A complete eight-pose step cycle travels 96 world pixels; 224px made leg motion nearly invisible.
export const KNIGHT_VISUAL_STRIDE=96;
export function drawKnightWalk(ctx,p,pose,image){
 return drawUnifiedBody(ctx,p,pose,image,'warrior',pose.frame);
}
