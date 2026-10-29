/**
 * Safari may interpret two quick touches on empty game scenery as page zoom.
 * Prevent native gestures only on the non-interactive playfield; keep controls,
 * taps on menu buttons, and vertical menu scrolling fully functional.
 */
export function installTouchGuard(canvas, root=document){
 if(!canvas)throw new TypeError('A game canvas is required');
 const prevent=e=>{if(e.cancelable)e.preventDefault()};
 const noPassive={passive:false,capture:true};

 // Our touch actions are implemented by the dedicated controller elements.
 // Touching the canvas itself never needs a native click, scroll, or zoom.
 for(const name of ['touchstart','touchmove','touchend']){
  canvas.addEventListener(name,prevent,noPassive);
 }
 canvas.addEventListener('contextmenu',prevent);

 // Older and current iOS WebKit versions can still emit proprietary pinch
 // gestures even when the element has touch-action:none.
 for(const name of ['gesturestart','gesturechange','gestureend']){
  root.addEventListener(name,prevent,noPassive);
 }

 // Double taps on non-interactive menu backgrounds should not zoom either.
 // Never cancel touch events on buttons, inputs, or scrollable menu panels.
 let previousTap=null;
 const overlay=root.querySelector?.('#overlay');
 root.addEventListener('touchend',e=>{
  if(!overlay||overlay.classList.contains('hidden')||!overlay.contains(e.target)
     ||e.changedTouches?.length!==1||e.touches?.length)return;
  const target=e.target;
  if(target.closest?.('button,a,input,textarea,select,[role="button"]')){previousTap=null;return}
  const touch=e.changedTouches[0],now=e.timeStamp;
  const next={time:now,x:touch.clientX,y:touch.clientY};
  if(previousTap&&now-previousTap.time>0&&now-previousTap.time<330
     &&Math.hypot(touch.clientX-previousTap.x,touch.clientY-previousTap.y)<42){
   prevent(e);
   previousTap=null;
  }else previousTap=next;
 },noPassive);

 // WebKit can emit dblclick on a plain background after the touches.
 root.addEventListener('dblclick',e=>{
  if(e.target===canvas||e.target===overlay)prevent(e);
 },true);
}
