'use strict';
// Soulslike Slime King: deterministic 60 Hz boss arena with readable windups,
// aggression against ranged classes, distinct moves and a phase-two transformation.
const BOSS_LEVEL=4,BOSS_HP=56,BOSS_VICTORY_FRAMES=42;
// Exactly one logical viewport wide: physical stone walls are visible at both edges.
const BOSS_ARENA_LEFT=18,BOSS_ARENA_RIGHT=W-18;
let boss=null,bossGoo=[],bossWaves=[];
function bossEnraged(){return !!boss?.enraged;}
function resetBossRun(){
 bossGoo=[];bossWaves=[];
 boss=stage===BOSS_LEVEL?{
  x:650,y:G-94,w:108,h:94,baseY:G-94,vy:0,
  hp:BOSS_HP,maxHp:BOSS_HP,hurt:0,alive:true,
  engaged:true,enraged:false,phase:'patrol',timer:80,shotTimer:0,
  attackIndex:0,chargeDir:-1,targetX:650,slamCount:0,
  volleyCount:0,chargeCount:0,defeatTimer:0
 }:null;
 updateBossHud();
}
function bossDefeated(){return !boss||!boss.alive;}
function updateBossHud(){
 const ui=$('#bossHud'),bar=$('#bossHealthFill'),label=$('#bossState');
 if(!ui||!bar||!label)return;
 const show=scene==='game'&&!!boss?.engaged;
 ui.classList.toggle('hide',!show);
 if(!boss)return;
 const hp=Math.max(0,Math.round(boss.hp));
 bar.style.transition=boss.phase==='defeated'?'none':'';
 bar.style.width=(hp/boss.maxHp*100)+'%';
 const track=$('#bossHealthTrack');
 if(track){track.setAttribute('aria-valuenow',String(hp));track.setAttribute('aria-valuemax',String(boss.maxHp));}
 const titles={
  defeated:'SCHLEIMKÖNIG BESIEGT!',
  phaseShift:'PHASE II · ZORN DES KÖNIGS!',
  warn:'STAMPSCHLAG! SPRINGEN!',
  leap:'STAMPFANGRIFF!',
  volleyWarn:'SCHLEIM-SALVE! AUSWEICHEN!',
  volley:'SCHLEIM-SALVE!',
  chargeWarn:'ANSTURM! HOCHSPRINGEN!',
  charge:'KÖNIGS-ANSTURM!'
 };
 label.textContent=titles[boss.phase]||(boss.enraged?'SCHLEIMKÖNIG · PHASE II':'SCHLEIMKÖNIG');
}
function damageBoss(amount){
 if(!boss||!boss.alive||!boss.engaged||boss.hurt>0||boss.phase==='phaseShift'||!Number.isFinite(amount)||amount<=0)return false;
 const before=boss.hp;
 boss.hp=Math.max(0,boss.hp-amount);
 boss.hurt=10;
 burst(boss.x+boss.w/2,boss.y+boss.h/2,'#f6ca92',16,3);
 if(boss.hp===0){
  boss.alive=false;boss.phase='defeated';boss.defeatTimer=BOSS_VICTORY_FRAMES;
  bossGoo=[];bossWaves=[];hero.earned+=170;
  burst(boss.x+boss.w/2,boss.y+boss.h/2,'#c9ed7f',55,5);
 }else if(before>BOSS_HP/2&&boss.hp<=BOSS_HP/2&&!boss.enraged){
  // A dramatic but safe transition: all pre-existing projectiles dissipate.
  boss.enraged=true;boss.phase='phaseShift';boss.timer=58;
  bossGoo=[];bossWaves=[];boss.y=boss.baseY;boss.vy=0;
  burst(boss.x+boss.w/2,boss.y+40,'#ff9c7d',38,4);
 }
 updateBossHud();
 return true;
}
function shootBossGoo(fan=1){
 if(!boss||!boss.alive)return;
 const fromX=boss.x+(hero.x<boss.x?9:boss.w-9),fromY=boss.y+34;
 const dx=(hero.x+hero.w/2)-fromX,dy=(hero.y+hero.h/2)-fromY;
 const angle=Math.atan2(dy,dx),speed=boss.enraged?7.3:6.2;
 const spread=fan===1?[0]:fan===2?[-.12,.12]:[-.23,0,.23];
 for(const offset of spread){
  if(bossGoo.length>=12)break; // Keep iPhone memory and hit readability bounded.
  const a=angle+offset;
  bossGoo.push({x:fromX,y:fromY,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:10,ttl:120});
 }
}
function bossChooseAttack(b){
 const attack=['slam','volley','charge'][b.attackIndex%3];
 b.attackIndex++;
 b.targetX=Math.max(BOSS_ARENA_LEFT+40,Math.min(BOSS_ARENA_RIGHT-b.w-15,hero.x+10));
 if(attack==='slam'){b.phase='warn';b.timer=b.enraged?32:44;}
 else if(attack==='volley'){b.phase='volleyWarn';b.timer=b.enraged?27:36;}
 else{
  b.phase='chargeWarn';b.timer=b.enraged?27:35;
  b.chargeDir=Math.sign(hero.x+b.w/2-(b.x+b.w/2))||-1;
 }
}
function bossRecover(b,frames){
 b.phase='recover';b.timer=frames;b.vy=0;b.y=b.baseY;
}
function bossTick(dt,prevY){
 if(!boss||scene!=='game')return false;
 const b=boss;
 if(!b.alive){
  if(b.phase==='defeated'){
   b.defeatTimer=Math.max(0,b.defeatTimer-dt);
   if(b.defeatTimer===0){end(true);return true;}
   updateBossHud();
  }
  return true;
 }
 if(hero.x>BOSS_ARENA_LEFT-10)b.engaged=true;
 if(!b.engaged)return false;
 b.hurt=Math.max(0,b.hurt-dt);
 b.timer-=dt;
 if(b.phase==='phaseShift'){
  if(b.timer<=0){b.phase='patrol';b.timer=17;}
 }else if(b.phase==='patrol'){
  // Constant pressure prevents a mage from standing still and firing from safety.
  const inFront=hero.x<b.x?-65:65;
  const goal=Math.max(BOSS_ARENA_LEFT+30,Math.min(BOSS_ARENA_RIGHT-b.w-10,hero.x+inFront));
  const move=Math.max(-((b.enraged?3.75:2.75)*dt),Math.min((b.enraged?3.75:2.75)*dt,goal-b.x));
  b.x+=move;
  if(b.timer<=0)bossChooseAttack(b);
 }else if(b.phase==='warn'){
  if(b.timer<=0){b.phase='leap';b.vy=b.enraged?-16:-14.3;}
 }else if(b.phase==='leap'){
  b.vy=Math.min(21,b.vy+.79*dt);
  b.y+=b.vy*dt;
  const diff=b.targetX-b.x;
  b.x+=Math.sign(diff)*Math.min(Math.abs(diff),(b.enraged?7.2:6.1)*dt);
  if(b.y>=b.baseY&&b.vy>0){
   b.y=b.baseY;b.slamCount++;
   bossRecover(b,b.enraged?18:26);
   const center=b.x+b.w/2;
   bossWaves.push({x:center,dir:-1,ttl:96},{x:center,dir:1,ttl:96});
   burst(center,G-10,'#fb9286',33,4);
   if(hero.x+hero.w>b.x-10&&hero.x<b.x+b.w+10&&hero.y+hero.h>G-88&&hero.dash<=0&&invincible<=0){
    return die(b.x+b.w/2);
   }
  }
 }else if(b.phase==='volleyWarn'){
  if(b.timer<=0){
   shootBossGoo(b.enraged?3:2);
   b.volleyCount++;
   b.phase='volley';b.timer=b.enraged?13:20;
  }
 }else if(b.phase==='volley'){
  if(b.timer<=0)bossRecover(b,b.enraged?13:23);
 }else if(b.phase==='chargeWarn'){
  if(b.timer<=0){b.phase='charge';b.timer=b.enraged?32:29;}
 }else if(b.phase==='charge'){
  b.x+=b.chargeDir*(b.enraged?11.6:9.3)*dt;
  if(b.x<=BOSS_ARENA_LEFT+10||b.x>=BOSS_ARENA_RIGHT-b.w-5||b.timer<=0){
   b.x=Math.max(BOSS_ARENA_LEFT+10,Math.min(BOSS_ARENA_RIGHT-b.w-5,b.x));
   b.chargeCount++;bossRecover(b,b.enraged?19:29);
   burst(b.x+b.w/2,G-10,'#c9ad9a',19,2.5);
  }
 }else if(b.phase==='recover'&&b.timer<=0){
  b.phase='patrol';b.timer=b.enraged?18:28;
 }
 // Stomp bounce works for all classes; contact during a charge is still dangerous.
 if(b.alive&&invincible<=0&&hero.x+hero.w>b.x+12&&hero.x<b.x+b.w-12&&hero.y+hero.h>b.y+14&&hero.y<b.y+b.h-7){
  if(hero.vy>0&&prevY+hero.h<=b.y+28){
   if(damageBoss(2))hero.vy=-10;
   hero.jumpActive=false;
  }else if(hero.dash>0){
   damageBoss(2);
  }else{return die(b.x+b.w/2);}
 }
 for(const shot of bossGoo){
  shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.ttl-=dt;
  if(shot.x+shot.r>hero.x&&shot.x-shot.r<hero.x+hero.w&&shot.y+shot.r>hero.y&&shot.y-shot.r<hero.y+hero.h){
   if(hero.dash<=0&&invincible<=0){shot.ttl=0;return die(shot.x);}
   shot.ttl=0;
  }
 }
 bossGoo=bossGoo.filter(s=>s.ttl>0&&s.x>BOSS_ARENA_LEFT-50&&s.x<BOSS_ARENA_RIGHT+50&&s.y>-30&&s.y<H+20);
 for(const wave of bossWaves){
  wave.x+=wave.dir*(b.enraged?9.1:7.3)*dt;wave.ttl-=dt;
  if(hero.y+hero.h>G-23&&hero.y<G&&Math.abs(hero.x+hero.w/2-wave.x)<23&&hero.dash<=0&&invincible<=0){
   return die(wave.x);
  }
 }
 bossWaves=bossWaves.filter(w=>w.ttl>0&&w.x>BOSS_ARENA_LEFT-40&&w.x<BOSS_ARENA_RIGHT+40);
 updateBossHud();
 return false;
}
function drawBoss(){
 if(!boss)return;
 // Ground warning uses red stripes and precedes a shockwave slam by 46 frames.
 const b=boss;
 if(b.alive&&b.engaged&&b.phase==='warn'){
  // The danger zone is fixed during windup; players can move out before impact.
  ctx.fillStyle='#652a37';ctx.fillRect(b.targetX-15,G-10,b.w+30,10);
  ctx.fillStyle='#ff7777';for(let i=0;i<b.w+30;i+=18)ctx.fillRect(b.targetX-15+i,G-16,9,6);
 }
 if(b.alive&&b.phase==='chargeWarn'){
  const start=b.chargeDir<0?BOSS_ARENA_LEFT:b.x+b.w;
  const end=b.chargeDir<0?b.x:BOSS_ARENA_RIGHT;
  ctx.fillStyle='#531e33';ctx.fillRect(start,G-14,Math.max(0,end-start),13);
  ctx.fillStyle='#ff866e';
  for(let x=start;x<end;x+=26)ctx.fillRect(x,G-17,13,5);
 }
 if(b.alive&&b.phase==='volleyWarn'){
  const fx=b.x+(hero.x<b.x?0:b.w),fy=b.y+35;
  ctx.fillStyle='#3c243c';ctx.fillRect(fx-24,fy-22,44,44);
  ctx.fillStyle='#ff9074';ctx.fillRect(fx-18,fy-16,32,32);
  ctx.fillStyle='#ffe0aa';ctx.fillRect(fx-10,fy-9,16,16);
 }
 if(b.alive&&b.phase==='phaseShift'){
  const cx=b.x+b.w/2,cy=b.y+36;
  ctx.fillStyle='#ff986477';ctx.fillRect(cx-70,cy-58,140,116);
  ctx.fillStyle='#ffb78b';for(let j=-2;j<=2;j++)ctx.fillRect(cx+j*24-6,cy-70,12,20);
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
 ctx.fillStyle=flash?'#f8ebb9':b.enraged?'#b26d63':'#68a94a';
 ctx.fillRect(x+13,y+34,82,53);ctx.fillRect(x+26,y+19,58,20);
 ctx.fillStyle=flash?'#fff6d9':b.enraged?'#e9a67c':'#9ad76b';
 ctx.fillRect(x+22,y+29,66,12);ctx.fillRect(x+14,y+65,80,12);
 ctx.fillStyle=b.enraged?'#824c54':'#3d783d';ctx.fillRect(x+15,y+77,80,9);ctx.fillRect(x+35,y+82,14,10);ctx.fillRect(x+69,y+82,16,10);
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
 if(b.phase==='charge'){ctx.fillStyle='#f7ba86';ctx.fillRect(x-13,y+40,20,24);ctx.fillRect(x+b.w-4,y+45,17,14);}
 if(b.phase==='leap'){ctx.fillStyle='#f5aa6c';ctx.fillRect(x+8,y+84,15,6);ctx.fillRect(x+85,y+84,15,6);}
 ctx.restore();
}
