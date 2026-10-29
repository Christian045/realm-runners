// v0.17: actual held weapon rendered above the warrior sprite.
// Unlike the older static 2px sprite blade, this follows the exact aim vector
// and visibly moves through all three strikes, including portrait Safari.
export function swordPose(player){
 const aim=player?.direction||{x:1,y:0};
 const base=Math.atan2(Number(aim.y)||0,Number(aim.x)||0);
 const active=(player?.attackTimer||0)>0;
 const step=player?.comboStep||1;
 const remaining=Math.min(1,Math.max(0,(player?.attackTimer||0)/.18));
 const progress=1-remaining;
 const sign=step===2?-1:1;
 const angle=active?base+sign*(-.96+1.72*progress):base+.47;
 return {angle,active,step,progress,
  scale:step===3&&active?1.19:1,
  x:player.x+Math.cos(base)*12,
  y:player.y+Math.sin(base)*12};
}
export function drawWarriorSword(ctx,player){
 if(player?.kind!=='warrior')return;
 const pose=swordPose(player);
 ctx.save();
 ctx.translate(Math.round(pose.x),Math.round(pose.y));
 ctx.rotate(pose.angle);
 ctx.scale(pose.scale,pose.scale);
 // Deep outline gives the sword a real silhouette even on dark masonry.
 // Handle and pommel appear connected to the dominant hand at x~0.
 ctx.fillStyle='#101f2d';ctx.fillRect(-2,-5,20,10);
 ctx.fillStyle='#785242';ctx.fillRect(1,-3,13,6);
 ctx.fillStyle='#e7b976';ctx.fillRect(-2,-4,5,8);
 ctx.fillStyle='#f8daa0';ctx.fillRect(-1,-2,2,4);
 // Proper crossguard, always outside the character silhouette.
 ctx.fillStyle='#182a38';ctx.fillRect(15,-14,8,28);
 ctx.fillStyle='#d7ba85';ctx.fillRect(17,-12,4,24);
 ctx.fillStyle='#fff0ba';ctx.fillRect(17,-10,2,20);
 // Large steel blade, dark lower edge, bright upper bevel, tapered tip.
 ctx.fillStyle='#0c273a';ctx.beginPath();
 ctx.moveTo(22,-7);ctx.lineTo(63,-7);ctx.lineTo(77,0);
 ctx.lineTo(63,7);ctx.lineTo(22,7);ctx.closePath();ctx.fill();
 ctx.fillStyle='#8aafc3';ctx.beginPath();
 ctx.moveTo(23,-5);ctx.lineTo(62,-5);ctx.lineTo(74,0);
 ctx.lineTo(62,1);ctx.lineTo(23,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#effcff';ctx.beginPath();
 ctx.moveTo(25,-4);ctx.lineTo(61,-4);ctx.lineTo(72,-1);
 ctx.lineTo(25,-1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#426579';ctx.fillRect(25,2,36,2);
 if(pose.active){
  // The combo finisher has a gold slash highlight without hiding the sword.
  ctx.globalAlpha=.75;ctx.fillStyle=pose.step===3?'#ffe096':'#b9eeff';
  ctx.fillRect(31,-8,27,2);ctx.globalAlpha=1;
 }
 ctx.restore();
}
