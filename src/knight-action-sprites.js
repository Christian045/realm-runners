// New complete sprite-frame animations for the knight's idle and three
// combo attacks. The walk animation stays in its own independent atlas.
export const KNIGHT_ACTION_CELL=96;
export const KNIGHT_ACTION_FACES=Object.freeze({down:0,right:1,up:2,left:3});
export const KNIGHT_ACTION_CLIPS=Object.freeze(['idle','attack1','attack2','attack3']);
const FOOT_ANCHOR=Object.freeze({down:78,right:79,up:78,left:79});

export function knightActionFrame(pose){
 if(!KNIGHT_ACTION_CLIPS.includes(pose.clip))return null;
 const frame=Number.isFinite(pose.frame)?pose.frame:0;
 return ((Math.floor(frame)%8)+8)%8;
}

// One pre-authored animation frame with moving armored forearm and blade.
// No scripted rotation of a walking pose, no second overlay sword, no changes
// to the combat engine's event clock (attack1 hits at 3, attack2/3 at 4).
export function drawKnightAction(ctx,p,pose,images){
 const frame=knightActionFrame(pose),row=KNIGHT_ACTION_FACES[pose.face];
 if(frame===null||row===undefined)return false;
 const image=images?.[pose.clip];
 if(!image)return false;
 ctx.drawImage(image,frame*KNIGHT_ACTION_CELL,row*KNIGHT_ACTION_CELL,
  KNIGHT_ACTION_CELL,KNIGHT_ACTION_CELL,
  Math.round(p.x-48),Math.round(p.y-FOOT_ANCHOR[pose.face]),
  KNIGHT_ACTION_CELL,KNIGHT_ACTION_CELL);
 return true;
}
