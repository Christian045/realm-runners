// Pixel-sized longsword, anchored to the warrior's right hand.
// Kept separate from the body sprite so the actual blade follows aim and combo.
export function swordPose(player){
 const aim=player?.direction||{x:1,y:0};
 const base=Math.atan2(Number(aim.y)||0,Number(aim.x)||0);
 const active=(player?.attackTimer||0)>0;
 const step=player?.comboStep||1;
 const remaining=Math.min(1,Math.max(0,(player?.attackTimer||0)/.18));
 const progress=1-remaining;
 const sign=step===2?-1:1;
 const angle=active?base+sign*(-.88+1.58*progress):base+.42;
 // The sprite is ~52 px wide; the hilt sits just outside the right gauntlet.
 // The idle weapon is carried diagonally instead of extending 77 px from the player.
 const handRadius=17;
 return {angle,active,step,progress,scale:step===3&&active?1.13:1,
  x:player.x+Math.cos(base)*handRadius,
  y:player.y+Math.sin(base)*handRadius};
}
export function drawWarriorSword(ctx,player){
 if(player?.kind!=='warrior')return;
 const pose=swordPose(player);
 ctx.save();
 ctx.translate(Math.round(pose.x),Math.round(pose.y));
 ctx.rotate(pose.angle);
 ctx.scale(pose.scale,pose.scale);
 // Grip and pommel; one consistent pixel-art outline.
 ctx.fillStyle='#172733';ctx.fillRect(-7,-4,14,8);
 ctx.fillStyle='#73523d';ctx.fillRect(-4,-2,10,4);
 ctx.fillStyle='#e7c58b';ctx.fillRect(-8,-3,3,6);
 // Compact crossguard, proportionate to the gauntlet.
 ctx.fillStyle='#172733';ctx.fillRect(6,-10,5,20);
 ctx.fillStyle='#d3ad70';ctx.fillRect(7,-8,3,16);
 // The steel blade is 37px long (rather than a giant 55px protrusion).
 ctx.fillStyle='#142c3a';ctx.beginPath();
 ctx.moveTo(11,-5);ctx.lineTo(38,-5);ctx.lineTo(49,0);
 ctx.lineTo(38,5);ctx.lineTo(11,5);ctx.closePath();ctx.fill();
 ctx.fillStyle='#8faab9';ctx.beginPath();
 ctx.moveTo(12,-3);ctx.lineTo(37,-3);ctx.lineTo(46,0);
 ctx.lineTo(37,1);ctx.lineTo(12,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e5f0ec';ctx.beginPath();
 ctx.moveTo(13,-3);ctx.lineTo(36,-3);ctx.lineTo(44,-1);
 ctx.lineTo(13,-1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#486577';ctx.fillRect(14,2,24,2);
 if(pose.active){
  ctx.globalAlpha=.68;
  ctx.fillStyle=pose.step===3?'#f7d38d':'#c4e4e9';
  ctx.fillRect(19,-6,18,2);
 }
 ctx.restore();
}
