// Opt-in illustrated knight choreography. Does not change damage or the 0.49
// default renderer. Complete pixel-art frames, no rotated or stretched limbs.
export const KNIGHT_PREVIEW_STRIDE=112;
export const KNIGHT_PREVIEW_SETTLE_SECONDS=.12;
export const KNIGHT_PREVIEW_FRAME_STARTS=Object.freeze({
 attack1:Object.freeze([0,.10,.22,.375,.44,.55,.70,.86]),
 attack2:Object.freeze([0,.10,.23,.36,.50,.56,.69,.84]),
 attack3:Object.freeze([0,.08,.17,.28,.39,.50,.56,.65,.78,.90]),
 special:Object.freeze([0,.08,.19,.375,.44,.57,.71,.86])
});
export function knightPreviewActionFrame(clip,progress){
 const starts=KNIGHT_PREVIEW_FRAME_STARTS[clip];
 if(!starts)return null;
 const t=Math.max(0,Math.min(1,Number(progress)||0));
 for(let index=starts.length-1;index>=0;index--)
  if(t+1e-10>=starts[index])return index;
 return 0;
}
// state is per-player/per-renderer. Stride follows actual distance,
// re-enters from a grounded pose and completes an interrupted planted step.
export function knightPreviewPresentationFrame(player,time,raw,state){
 let {clip,row,index}=raw;
 const last=state.clip;
 if(clip==='walk'){
  const distance=Number(player.knightPreviewDistance ?? player.knightWalkDistance ?? 0);
  if(last!=='walk'||!Number.isFinite(state.walkOrigin))state.walkOrigin=distance;
  const travelled=Math.max(0,distance-state.walkOrigin);
  index=Math.floor(travelled/KNIGHT_PREVIEW_STRIDE*8)%8;
  state.lastWalk={row,index};
  state.stop=null;
 }else if(clip==='idle'){
  if(last!=='idle'){
   state.idleStart=time;
   if(last==='walk'&&state.lastWalk){
    const {row:walkRow,index:walkIndex}=state.lastWalk;
    state.stop={row:walkRow,index:walkIndex,at:time};
   }else state.stop=null;
  }
  if(state.stop){
   const dt=time-state.stop.at;
   if(dt>=0&&dt<KNIGHT_PREVIEW_SETTLE_SECONDS){
    const from=state.stop.index;
    const steps=from===0||from===4?0:from<4?4-from:8-from;
    const offset=Math.min(steps,Math.floor(dt/KNIGHT_PREVIEW_SETTLE_SECONDS*(steps+1)));
    clip='walk';row=state.stop.row;index=(from+offset)%8;
   }else{
    state.idleStart=time;
    state.stop=null;
   }
  }
  if(clip==='idle'){
   const seconds=Math.max(0,time-(state.idleStart??time));
   index=Math.floor((seconds%1.6)/1.6*6)%6;
  }
 }else state.stop=null;
 state.clip=raw.clip;
 return {...raw,clip,row,index};
}
