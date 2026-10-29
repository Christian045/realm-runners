// v0.14 readable impact silhouettes: class-specific, bounded and deterministic.
// These are drawn in world space, never as full-screen flashes over danger zones.
export const IMPACT_PALETTE=Object.freeze({
 warrior:{core:'#fff2cf',edge:'#f4bd77',spark:'#ffdc8c'},
 hunter:{core:'#f5ffe1',edge:'#a9eb96',spark:'#d5f7ba'},
 mage:{core:'#f8ebff',edge:'#bfa4ff',spark:'#e3b4ff'},
 enemy:{core:'#fff0ed',edge:'#ee8093',spark:'#ffd0a7'}
});
export function impactStyle(kind='warrior',critical=false,finisher=false){
 const palette=IMPACT_PALETTE[kind]||IMPACT_PALETTE.enemy;
 return {...palette,count:finisher?14:critical?12:8,radius:finisher?38:critical?31:23,
  duration:finisher?.39:critical?.32:.26};
}
export function drawImpact(ctx,e,alpha){
 const style=impactStyle(e.kind,e.critical,e.finisher);
 const x=e.x,y=e.y,angle=e.angle||0;
 const scale=1-alpha;
 ctx.save();
 ctx.translate(x,y);ctx.rotate(angle);
 // The direction of the strike remains legible: an angled crescent and sparks.
 ctx.globalAlpha=Math.max(0,alpha)*.88;
 ctx.lineCap='square';ctx.lineWidth=e.finisher?7:5;
 ctx.strokeStyle=style.edge;
 ctx.beginPath();ctx.arc(0,0,style.radius*(.63+scale*.5),-.98,1.02);ctx.stroke();
 ctx.strokeStyle=style.core;ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(0,0,style.radius*(.65+scale*.5),-.87,.87);ctx.stroke();
 for(let i=0;i<style.count;i++){
  const a=i*Math.PI*2/style.count+(e.seed||0)*.17;
  const r=(12+i%4*4)+scale*(style.radius+7+i%3*3);
  const len=(i%3===0?12:6)*(1-scale*.55);
  ctx.strokeStyle=i%3===0?style.core:style.spark;
  ctx.lineWidth=i%4===0?3:2;
  ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
  ctx.lineTo(Math.cos(a)*(r+len),Math.sin(a)*(r+len));ctx.stroke();
 }
 if(e.finisher){
  ctx.strokeStyle=style.core;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,style.radius*1.48*scale,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
export function drawMagicTrail(ctx,e,alpha){
 const t=1-alpha;
 ctx.save();ctx.globalAlpha=alpha*.9;
 const r=(e.radius||9)*(1+t*.75);
 const core=e.kind==='ember'?'#ffd58c':'#e9d3ff';
 ctx.fillStyle=e.kind==='ember'?'#ef8e58':'#9365e4';
 ctx.fillRect(Math.round(e.x-r/2),Math.round(e.y-r/2),Math.max(2,r),Math.max(2,r));
 ctx.fillStyle=core;ctx.fillRect(Math.round(e.x-r/4),Math.round(e.y-r/4),Math.max(2,r/2),Math.max(2,r/2));
 ctx.restore();
}
