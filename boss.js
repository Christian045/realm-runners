'use strict';
// Pixel-art Slime King. Logic runs at the same deterministic 60 Hz as game.js.
// There are no checkpoints: damage resets the encounter along with the level.
const BOSS_LEVEL=4, BOSS_HP=20, BOSS_VICTORY_FRAMES=42;
let boss=null,bossGoo=[],bossWaves=[];
function resetBossRun(){
 bossGoo=[];bossWaves=[];
 boss=stage===BOSS_LEVEL?{
  x:2460,y:G-94,w:108,h:94,baseY:G-94,vy:0,
  hp:BOSS_HP,maxHp:BOSS_HP,hurt:0,alive:true,
  engaged:false,phase:'patrol',timer:105,shotTimer:68,
  targetX:2460,slamCount:0,defeatTimer:0
 }:null;
 updateBossHud();
}
function bossDefeated(){return !boss||!boss.alive;}
function updateBossHud(){
 const ui=$('#bossHud'),bar=$('#bossHealthFill'),label=$('#bossState');
 if(!ui||!bar||!label)return;
 const show=scene==='game'&&boss?.engaged;
 ui.classList.toggle('hide',!show);
 if(!boss)return;
 const hp=Math.max(0,Math.round(boss.hp));
 bar.style.width=(hp/boss.maxHp*100)+'%';
 const track=$('#bossHealthTrack');
 if(track){track.setAttribute('aria-valuenow',String(hp));track.setAttribute('aria-valuemax',String(boss.maxHp));}
 label.textContent=boss.phase==='defeated'?'SCHLEIMKÖNIG BESIEGT!':boss.phase==='warn'?'STAMPSCHLAG! AUSWEICHEN':boss.phase==='leap'?'SCHLEIMKÖNIG SPRINGT':'SCHLEIMKÖNIG';
}
function damageBoss(amount){
 if(!boss||!boss.alive||!boss.engaged||boss.hurt>0||!Number.isFinite(amount)||amount<=0)return false;
 boss.hp=Math.max(0,boss.hp-amount);
 boss.hurt=9;
 burst(boss.x+boss.w/2,boss.y+boss.h/2,'#f6ca92',16,3);
 if(boss.hp===0){
  boss.alive=false;boss.phase='defeated';boss.defeatTimer=BOSS_VICTORY_FRAMES;
  bossGoo=[];bossWaves=[];hero.earned+=120;
  burst(boss.x+boss.w/2,boss.y+boss.h/2,'#c9ed7f',55,5);
 }
 updateBossHud();
 return true;
}
function shootBossGoo(){
 if(!boss||!boss.alive)return;
 const fromX=boss.x+boss.w/2,fromY=boss.y+24;
 const targetX=hero.x+hero.w/2,targetY=hero.y+hero.h/2;
 const direction=targetX<fromX?-1:1;
 const speed=5.7;
 const vx=direction*speed;
 const travel=Math.max(1,Math.abs(targetX-fromX)/speed);
 const vy=Math.max(-3.5,Math.min(3.5,(targetY-fromY)/travel));
 bossGoo.push({x:fromX,y:fromY,vx,vy,r:11,ttl:115});
}
function bossTick(dt,prevY){
 if(!boss||scene!=='game')return false;
 const b=boss;
 // The final hit starts a short visible victory sequence. No goal/flag is required.
 // Trigger completion from the fixed-step loop, never from a timeout.
 if(!b.alive){
  if(b.phase==='defeated'){
   b.defeatTimer=Math.max(0,b.defeatTimer-dt);
   if(b.defeatTimer===0){end(true);return true;}
   updateBossHud();
  }
  return true;
 }
 if(hero.x>2015)b.engaged=true;
 if(!b.engaged)return false;
 b.hurt=Math.max(0,b.hurt-dt);
 b.timer-=dt;
 if(b.phase==='patrol'){
  const desired=Math.max(2230,Math.min(2580,hero.x+120));
  if(Math.abs(desired-b.x)>3)b.x+=Math.sign(desired-b.x)*Math.min(1.5*dt,Math.abs(desired-b.x));
  b.shotTimer-=dt;
  if(b.shotTimer<=0){shootBossGoo();b.shotTimer=b.hp<BOSS_HP/2?50:77;}
  if(b.timer<=0){
   b.phase='warn';b.timer=46;
   b.targetX=Math.max(2260,Math.min(2630,hero.x+12));
  }
 }else if(b.phase==='warn'){
  if(b.timer<=0){b.phase='leap';b.vy=-13.8;b.timer=0;}
 }else if(b.phase==='leap'){
  b.vy=Math.min(20,b.vy+.78*dt);
  b.y+=b.vy*dt;
  const dx=b.targetX-b.x;
  b.x+=Math.sign(dx)*Math.min(Math.abs(dx),4.7*dt);
  if(b.y>=b.baseY&&b.vy>0){
   b.y=b.baseY;b.vy=0;b.phase='recover';b.timer=38;b.slamCount++;
   const center=b.x+b.w/2;
   bossWaves.push({x:center,dir:-1,ttl:65});
   bossWaves.push({x:center,dir:1,ttl:65});
   burst(center,G-10,'#fb9286',26,4);
   if(hero.x+hero.w>b.x-12&&hero.x<b.x+b.w+12&&hero.y+hero.h>G-92){
    if(hero.dash<=0){die();return true;}
   }
  }
 }else if(b.phase==='recover'&&b.timer<=0){
  b.phase='patrol';b.timer=b.hp<BOSS_HP/2?85:125;
 }
 // Hero lands on the crown's slime body; grounded collision hurts unless dashing.
 if(b.alive&&hero.x+hero.w>b.x+12&&hero.x<b.x+b.w-12&&hero.y+hero.h>b.y+14&&hero.y<b.y+b.h-7){
  if(hero.vy>0&&prevY+hero.h<=b.y+28){
   if(damageBoss(2))hero.vy=-10;
   hero.jumpActive=false;
  }else if(hero.dash>0){
   damageBoss(2);
  }else{die();return true;}
 }
 // The projectiles travel at a legible, predictable speed; a jump avoids ground shockwaves.
 for(const shot of bossGoo){
  shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.ttl-=dt;
  if(shot.x+shot.r>hero.x&&shot.x-shot.r<hero.x+hero.w&&shot.y+shot.r>hero.y&&shot.y-shot.r<hero.y+hero.h){
   if(hero.dash<=0){die();return true;}
   shot.ttl=0;
  }
 }
 bossGoo=bossGoo.filter(shot=>shot.ttl>0&&shot.x>0&&shot.x<WIDTH&&shot.y>-30&&shot.y<H+20);
 for(const wave of bossWaves){
  wave.x+=wave.dir*(b.hp<BOSS_HP/2?8.2:6.4)*dt;wave.ttl-=dt;
  if(hero.y+hero.h>G-23&&hero.y<G&&Math.abs(hero.x+hero.w/2-wave.x)<23&&hero.dash<=0){
   die();return true;
  }
 }
 bossWaves=bossWaves.filter(wave=>wave.ttl>0&&wave.x>0&&wave.x<WIDTH);
 updateBossHud();
 return false;
}
function drawBoss(){
 if(!boss)return;
 // Ground warning uses red stripes and precedes a shockwave slam by 46 frames.
 const b=boss;
 if(b.alive&&b.engaged&&b.phase==='warn'){
  ctx.fillStyle='#642436';ctx.fillRect(b.targetX-60,G-9,120,9);
  ctx.fillStyle='#ff7777';for(let i=0;i<120;i+=20)ctx.fillRect(b.targetX-60+i,G-13,10,4);
 }
 for(const wave of bossWaves){
  ctx.fillStyle='#281a32';ctx.fillRect(wave.x-17,G-18,34,18);
  ctx.fillStyle='#ff656b';ctx.fillRect(wave.x-14,G-15,28,8);
  ctx.fillStyle='#ffd2a7';ctx.fillRect(wave.x-5,G-20,10,7);
 }
 for(const shot of bossGoo){
  ctx.fillStyle='#243a24';ctx.fillRect(shot.x-12,shot.y-9,24,19);
  ctx.fillStyle='#b6ef70';ctx.fillRect(shot.x-9,shot.y-9,18,15);
  ctx.fillStyle='#f1ffba';ctx.fillRect(shot.x-5,shot.y-7,7,5);
 }
 if(!b.alive){
  if(b.phase==='defeated'){
   const x=Math.round(b.x+b.w/2),y=G-20;
   ctx.fillStyle='#15262d';ctx.fillRect(x-43,y,86,16);
   ctx.fillStyle='#81b54f';ctx.fillRect(x-36,y+1,72,8);
   ctx.fillStyle='#d6af65';ctx.fillRect(x-23,y-19,46,12);
   ctx.fillStyle='#f9de9b';ctx.fillRect(x-5,y-29,11,16);
   ctx.fillStyle='#b64b5c';ctx.fillRect(x-4,y-14,9,6);
   ctx.save();ctx.textAlign='center';ctx.font='bold 21px monospace';
   ctx.fillStyle='#1b202f';ctx.fillRect(x-135,y-112,270,37);
   ctx.fillStyle='#f8dc98';ctx.fillText('BOSS BESIEGT!',x,y-87);
   ctx.restore();
  }
  return;
 }
 const x=Math.round(b.x/4)*4,y=Math.round(b.y/4)*4;
 ctx.save();
 // Dark, thick silhouette keeps the boss legible against bright backgrounds.
 ctx.fillStyle='#152a2e';ctx.fillRect(x+12,y+20,90,69);ctx.fillRect(x+25,y+7,64,80);
 const flash=b.hurt>0&&Math.floor(b.hurt/3)%2===0;
 ctx.fillStyle=flash?'#f8ebb9':'#68a94a';
 ctx.fillRect(x+13,y+34,82,53);ctx.fillRect(x+26,y+19,58,20);
 ctx.fillStyle=flash?'#fff6d9':'#9ad76b';
 ctx.fillRect(x+22,y+29,66,12);ctx.fillRect(x+14,y+65,80,12);
 ctx.fillStyle='#3d783d';ctx.fillRect(x+15,y+77,80,9);ctx.fillRect(x+35,y+82,14,10);ctx.fillRect(x+69,y+82,16,10);
 // Crown: blocky gold with red jewel.
 ctx.fillStyle='#4f362f';ctx.fillRect(x+25,y+12,66,11);
 ctx.fillStyle='#eabf61';ctx.fillRect(x+30,y+1,12,20);ctx.fillRect(x+50,y-8,15,30);ctx.fillRect(x+76,y+1,12,20);
 ctx.fillRect(x+26,y+14,64,8);
 ctx.fillStyle='#fff1b5';ctx.fillRect(x+53,y-5,7,8);ctx.fillRect(x+32,y+4,7,7);
 ctx.fillStyle='#ee5262';ctx.fillRect(x+53,y+14,12,8);
 // Expressive black eyes and warning-red pupils.
 ctx.fillStyle='#14252b';ctx.fillRect(x+35,y+41,14,18);ctx.fillRect(x+70,y+41,14,18);
 ctx.fillStyle='#fff2db';ctx.fillRect(x+39,y+43,5,7);ctx.fillRect(x+74,y+43,5,7);
 ctx.fillStyle='#b74351';ctx.fillRect(x+52,y+66,20,5);
 if(b.phase==='leap'){ctx.fillStyle='#f5aa6c';ctx.fillRect(x+8,y+84,15,6);ctx.fillRect(x+85,y+84,15,6);}
 ctx.restore();
}
