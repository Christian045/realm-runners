'use strict';
// v0.8: three distinct pixel-art adversaries alongside the existing forest slime.
// All timers are simulation frames (60 FPS), so WebKit, Chromium and 120Hz devices
// receive the same attack warnings and hitboxes.
const ENEMY_TYPES=Object.freeze({
 slime:{w:27,h:27,hp:2,move:.8,accent:'#9be27a',reward:15},
 bat:{w:34,h:24,hp:2,move:1.3,accent:'#d8afff',reward:20},
 mushroom:{w:35,h:35,hp:4,move:.3,accent:'#ffac87',reward:25},
 goblin:{w:30,h:39,hp:5,move:.9,accent:'#f0d590',reward:30}
});
const ENEMY_ROSTER=[
 ['slime','bat','mushroom','goblin'],
 ['slime','bat','goblin','mushroom'],
 ['slime','goblin','bat','mushroom'],
 ['slime','mushroom','goblin','bat']
];
let enemyShots=[];
function spawnEnemies(stageIndex){
 enemyShots=[];
 if(stages[stageIndex].boss)return[];
 const positions=stages[stageIndex].enemies;
 return positions.map((x,i)=>{
  const type=ENEMY_ROSTER[stageIndex][i%ENEMY_ROSTER[stageIndex].length],spec=ENEMY_TYPES[type];
  const y=(type==='bat'?G-118:G-spec.h);
  return {type,x,y,home:x,baseY:y,w:spec.w,h:spec.h,maxHp:spec.hp,hp:spec.hp,dir:i%2?-1:1,
   alive:true,phase:'patrol',timer:0,attackCooldown:48+i*19,
   hurt:0,kb:0,vx:0,vy:0,targetX:x,targetY:y,seed:i*2+stageIndex,anim:0};
 });
}
function enemyRect(e){
 return {x:e.x,y:e.y,w:e.w||27,h:e.h||27};
}
function enemyOverlap(e,h=hero){
 const r=enemyRect(e);
 return h.x+h.w>r.x+3&&h.x<r.x+r.w-3&&h.y+h.h>r.y+2&&h.y<r.y+r.h-2;
}
function fireSpore(e){
 // Horizontal, brightly colored, slow spores are visible before contact.
 if(enemyShots.length>=12)return;
 const sx=e.x+e.w/2,sy=e.y+13;
 const dx=(hero.x+hero.w/2)-sx,dy=(hero.y+hero.h/2)-sy;
 const length=Math.max(1,Math.hypot(dx,dy));
 enemyShots.push({x:sx,y:sy,vx:dx/length*3.4,vy:dy/length*3.4,
  radius:9,life:105,color:'#ffb17e',source:e.home});
}
function enemyTick(dt){
 if(scene!=='game'||!hero)return;
 for(const e of bad){
  if(!e.alive)continue;
  const spec=ENEMY_TYPES[e.type]||ENEMY_TYPES.slime;
  e.anim=(e.anim||0)+dt;
  e.hurt=Math.max(0,(e.hurt||0)-dt);
  e.attackCooldown=Math.max(0,(e.attackCooldown||0)-dt);
  if(e.kb){
   e.x+=e.kb*dt;e.kb*=Math.pow(.71,dt);
   if(Math.abs(e.kb)<.15)e.kb=0;
   e.x=Math.max(e.home-105,Math.min(e.home+105,e.x));
  }
  const dx=hero.x+hero.w/2-(e.x+spec.w/2);
  const nearby=Math.abs(dx)<280&&Math.abs(hero.y-e.y)<170;
  if(e.type==='bat'){
   if(e.phase==='windup'){
    e.timer-=dt;
    if(e.timer<=0){
     e.phase='dive';e.timer=25;
     const vx=hero.x+hero.w/2-e.x-spec.w/2;
     e.vx=Math.sign(vx||e.dir)*4.4;
     e.vy=Math.max(-3.6,Math.min(4.0,(hero.y+hero.h/2-e.y-spec.h/2)/10));
    }
   }else if(e.phase==='dive'){
    e.x+=e.vx*dt;e.y+=e.vy*dt;e.timer-=dt;
    if(e.timer<=0||e.y>=G-spec.h-16){
     e.phase='recover';e.timer=30;e.attackCooldown=115;
    }
   }else if(e.phase==='recover'){
    e.timer-=dt;
    e.y+=(e.baseY-e.y)*Math.min(.12*dt,1);
    e.x+=(e.home-e.x)*Math.min(.03*dt,1);
    if(e.timer<=0)e.phase='patrol';
   }else{
    e.x+=e.dir*spec.move*dt;
    if(Math.abs(e.x-e.home)>72)e.dir*=-1;
    e.y=e.baseY+Math.sin(e.anim*.095+e.seed)*13;
    if(nearby&&e.attackCooldown<=0){e.phase='windup';e.timer=26;e.dir=dx<0?-1:1;}
   }
  }else if(e.type==='mushroom'){
   e.x+=e.dir*spec.move*dt;
   if(Math.abs(e.x-e.home)>19)e.dir*=-1;
   if(e.phase==='windup'){
    e.timer-=dt;
    if(e.timer<=0){
     fireSpore(e);e.phase='patrol';e.attackCooldown=125;
    }
   }else if(nearby&&e.attackCooldown<=0){
    e.phase='windup';e.timer=32;e.dir=dx<0?-1:1;
   }
  }else if(e.type==='goblin'){
   if(e.phase==='windup'){
    e.timer-=dt;
    if(e.timer<=0){e.phase='charge';e.timer=25;}
   }else if(e.phase==='charge'){
    e.x+=e.dir*4.2*dt;e.timer-=dt;
    if(e.timer<=0||Math.abs(e.x-e.home)>100){e.phase='recover';e.timer=38;e.attackCooldown=95;}
   }else if(e.phase==='recover'){
    e.timer-=dt;
    if(e.timer<=0)e.phase='patrol';
   }else{
    e.x+=e.dir*spec.move*dt;
    if(Math.abs(e.x-e.home)>48)e.dir*=-1;
    if(nearby&&e.attackCooldown<=0&&Math.abs(dx)<190){
     e.phase='windup';e.timer=25;e.dir=dx<0?-1:1;
    }
   }
  }else{
   e.x+=e.dir*spec.move*dt;
   if(Math.abs(e.x-e.home)>42)e.dir*=-1;
  }
  e.x=Math.max(0,Math.min(WIDTH-spec.w,e.x));
 }
 for(const shot of enemyShots){
  shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
 }
 enemyShots=enemyShots.filter(s=>s.life>0&&s.x>0&&s.x<WIDTH&&s.y>0&&s.y<H);
}
function enemyHazardsHitHero(prevY=hero?.y??0){
 if(scene!=='game'||!hero)return false;
 // Grace frames are an intentional escape route from stacked enemies.
 if(invincible>0)return false;
 for(const shot of enemyShots){
  const x=hero.x+hero.w/2,y=hero.y+hero.h/2;
  if(Math.abs(shot.x-x)<hero.w/2+shot.radius-3&&Math.abs(shot.y-y)<hero.h/2+shot.radius-3){
   if(hero.dash>0){shot.life=0;burst(shot.x,shot.y,'#ffba84',6,2);}
   else{shot.life=0;const hit=die(shot.x);enemyShots=enemyShots.filter(s=>s.life>0);return hit;}
  }
 }
 enemyShots=enemyShots.filter(s=>s.life>0);
 for(const e of bad){
  if(!e.alive||!enemyOverlap(e))continue;
  if(hero.dash>0){
   damageEnemy(e,(e.type==='goblin'||e.type==='mushroom')?3:3);
   if(e.alive)e.kb=(hero.face||1)*5;
   continue;
  }
  // A downward landing is always a legitimate stomp, including on flying bats.
  const prevBottom=prevY+hero.h;
  if((hero.y>prevY||hero.vy>1.2)&&prevBottom<=e.y+Math.min(15,(e.h||27)*.6)){
   damageEnemy(e,e.hp||2);
   hero.vy=-9;hero.jumpActive=false;
   hero.y=Math.min(hero.y,e.y-hero.h+1);
   continue;
  }
  return die(e.x+e.w/2);
 }
 return false;
}
function drawEnemyMob(e){
 if(!e.alive||e.x+e.w<cam-40||e.x>cam+W+40)return;
 if(e.type==='slime'||!e.type){
  drawEnemy(e,0);
  if((e.hurt||0)>0){ctx.fillStyle='#fff5b575';ctx.fillRect(Math.round(e.x),Math.round(e.y),e.w||27,e.h||27);}
  if(e.hp<e.maxHp){
   const x=Math.round(e.x),y=Math.round(e.y);
   ctx.fillStyle='#162432';ctx.fillRect(x,y-10,e.w,6);
   ctx.fillStyle='#f38b68';ctx.fillRect(x+2,y-8,(e.w-4)*Math.max(0,e.hp)/e.maxHp,3);
  }
  return;
 }
 const x=Math.round(e.x/3)*3,y=Math.round(e.y/3)*3,blink=e.hurt>0&&Math.floor(e.hurt/3)%2===0;
 const warning=e.phase==='windup';
 ctx.save();
 if(e.type==='bat'){
  const flap=Math.sin(e.anim*.34)*9;
  ctx.fillStyle='#172232';
  ctx.beginPath();ctx.moveTo(x+16,y+13);ctx.lineTo(x-10,y+3+flap);ctx.lineTo(x+1,y+25);
  ctx.lineTo(x+16,y+19);ctx.lineTo(x+33,y+25);ctx.lineTo(x+45,y+3+flap);ctx.closePath();ctx.fill();
  ctx.fillStyle=blink?'#fff0da':'#8965b4';
  ctx.fillRect(x+8,y+7,18,16);ctx.fillRect(x-1,y+11,11,9);ctx.fillRect(x+24,y+11,11,9);
  ctx.fillStyle='#be9cd9';ctx.fillRect(x+12,y+5,11,5);
  ctx.fillStyle='#ffe8b9';ctx.fillRect(x+11,y+15,4,4);ctx.fillRect(x+20,y+15,4,4);
  ctx.fillStyle=warning?'#ff6e76':'#3f314f';ctx.fillRect(x+16,y+17,3,4);
 }else if(e.type==='mushroom'){
  ctx.fillStyle='#192936';ctx.fillRect(x+8,y+16,21,19);ctx.fillRect(x+3,y+10,30,13);
  ctx.fillStyle=blink?'#fff1ce':'#e9c39c';ctx.fillRect(x+11,y+18,16,15);
  ctx.fillStyle=warning?'#ff7d75':'#d97768';ctx.fillRect(x+3,y+10,30,13);ctx.fillRect(x+7,y+5,23,6);
  ctx.fillStyle='#ffe4b4';ctx.fillRect(x+10,y+9,6,5);ctx.fillRect(x+23,y+13,5,4);
  ctx.fillStyle='#382b39';ctx.fillRect(x+14,y+24,3,5);ctx.fillRect(x+23,y+24,3,5);
  ctx.fillStyle='#ac6e72';ctx.fillRect(x+17,y+32,6,3);
 }else if(e.type==='goblin'){
  ctx.fillStyle='#152630';ctx.fillRect(x+5,y+10,24,28);ctx.fillRect(x+2,y+7,30,13);
  ctx.fillStyle=blink?'#fce3a7':'#77b46f';ctx.fillRect(x+8,y+10,19,18);
  ctx.fillStyle='#527e55';ctx.fillRect(x+2,y+16,7,5);ctx.fillRect(x+26,y+16,7,5);
  ctx.fillStyle=warning?'#e8a25d':'#86604f';ctx.fillRect(x+8,y+2,18,10);ctx.fillRect(x+11,y+0,13,5);
  ctx.fillStyle='#f5e7b0';ctx.fillRect(x+11,y+16,4,4);ctx.fillRect(x+21,y+16,4,4);
  ctx.fillStyle='#342b33';ctx.fillRect(x+14,y+28,12,10);
  ctx.fillStyle='#e4cf8c';ctx.fillRect(x+7,y+32,5,6);ctx.fillRect(x+23,y+32,5,6);
 }
 if(warning){
  // Orange-red warning pixels announce a dive, spore shot or charge.
  ctx.fillStyle='#19232f';ctx.fillRect(x+e.w/2-8,y-19,16,16);
  ctx.fillStyle='#ff9c69';ctx.fillRect(x+e.w/2-2,y-15,4,8);
  ctx.fillRect(x+e.w/2-2,y-5,4,4);
 }
 if(e.hp<e.maxHp){
  ctx.fillStyle='#162432';ctx.fillRect(x,y-9,e.w,6);
  ctx.fillStyle='#f38b68';ctx.fillRect(x+2,y-7,(e.w-4)*Math.max(0,e.hp)/e.maxHp,3);
 }
 ctx.restore();
}
function drawEnemyShots(){
 for(const p of enemyShots){
  const x=Math.round(p.x/2)*2,y=Math.round(p.y/2)*2;
  ctx.fillStyle='#202d36';ctx.fillRect(x-11,y-10,22,20);
  ctx.fillStyle='#e98969';ctx.fillRect(x-9,y-7,18,15);
  ctx.fillStyle='#ffe3ac';ctx.fillRect(x-4,y-5,8,6);
  ctx.fillStyle='#f6aa72';ctx.fillRect(x-5,y+8,11,5);
 }
}
