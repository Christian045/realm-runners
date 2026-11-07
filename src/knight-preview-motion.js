// Shared illustrated knight pacing. Contact frames remain locked to damage events.
export const KNIGHT_PREVIEW_STRIDE=112;
export const KNIGHT_PREVIEW_SETTLE_SECONDS=.12;
export const KNIGHT_PREVIEW_FRAME_STARTS=Object.freeze({
 attack1:Object.freeze([0,.12,.26,.375,.46,.58,.74,.92]),
 attack2:Object.freeze([0,.12,.25,.39,.50,.58,.75,.92]),
 attack3:Object.freeze([0,.10,.20,.32,.42,.50,.58,.70,.84,.94]),
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
export function knightPreviewPresentationFrame(player,time,raw,state,stride=KNIGHT_PREVIEW_STRIDE){
 let {clip,row,index}=raw;
 const last=state.clip;
 if(clip==='walk'){
  const distance=Number(player.knightPreviewDistance ?? player.knightWalkDistance ?? 0);
  if(last!=='walk'||!Number.isFinite(state.walkOrigin)||distance<state.lastDistance){
   const resume=state.stop&&state.stop.row===row&&time-state.stop.at<KNIGHT_PREVIEW_SETTLE_SECONDS;
   const phase=resume?(state.stop.currentIndex??state.stop.index):0;
   state.walkOrigin=distance-phase*stride/8;
  }
  state.lastDistance=distance;
  const travelled=Math.max(0,distance-state.walkOrigin);
  index=Math.floor(travelled/stride*8)%8;
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
  if(state.stop&&state.stop.row!==row){state.stop=null;state.idleStart=time;}
  if(state.stop){
   const dt=time-state.stop.at;
   if(dt>=0&&dt<KNIGHT_PREVIEW_SETTLE_SECONDS){
    const from=state.stop.index;
    const steps=from===0||from===4?0:from<4?4-from:8-from;
    const offset=Math.min(steps,Math.floor(dt/KNIGHT_PREVIEW_SETTLE_SECONDS*(steps+1)));
    clip='walk';row=state.stop.row;index=(from+offset)%8;
    state.stop.currentIndex=index;
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
 return {...raw,clip,row,index,idleSeconds:clip==='idle'?Math.max(0,time-(state.idleStart??time)):0};
}

// Expand the complete sprite by at most two display pixels over a slow breath.
// The sole edge stays exactly fixed; no torso/leg seam or whole-body levitation.
export function knightBreathingRect(x,y,width,height,seconds){
 const phase=Math.max(0,Number(seconds)||0)*Math.PI*2/2.8;
 const expansion=1-Math.cos(phase);
 const sole=y+height*61/72;
 return {x,y:sole-(height+expansion)*61/72,width,height:height+expansion};
}
