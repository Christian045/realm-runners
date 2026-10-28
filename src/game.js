import {CLASSES, ENEMY_DATA, TILE, clamp, distance, normalized, chooseUpgrades} from './data.js';
import {generateDungeon, seeded, ROOM_W, ROOM_H} from './dungeon.js';
import {saveProgress, buyPermanent, upgradeCost} from './progression.js';

export class Game {
 constructor(progress,input,onChange=()=>{}){
  this.progress=progress;this.input=input;this.onChange=onChange;this.mode='menu';
  this.dungeon=null;this.player=null;this.enemies=[];this.projectiles=[];this.effects=[];
  this.loot=[];this.runCoins=0;this.clearCount=0;this.time=0;this.camera={x:0,y:0,scale:1,w:960,h:540};
  this.attackSequence=0;this.upgradeChoices=[];this.bossDefeated=false;
 }
 notify(){this.onChange(this)}
 chooseClass(kind){if(CLASSES[kind]){this.progress.selectedClass=kind;saveProgress(this.progress);this.notify()}}
 purchase(stat){if(buyPermanent(this.progress,stat)){saveProgress(this.progress);this.notify();return true}return false}
 start(kind=this.progress.selectedClass,seed=(Date.now()>>>0)){
  if(!CLASSES[kind])kind='warrior';
  this.progress.selectedClass=kind;saveProgress(this.progress);
  this.dungeon=generateDungeon(seed);this.random=seeded(seed^0xa5b4c382);
  const base=CLASSES[kind],bonus=this.progress.upgrades;
  this.player={x:this.dungeon.start.x,y:this.dungeon.start.y,radius:14,kind,
   maxHp:base.hp+bonus.vitality*12,hp:base.hp+bonus.vitality*12,
   speed:base.speed,damage:base.damage*(1+bonus.strength*.08),attackDelay:base.cooldown,
   reach:base.range,crit:0,leech:0,guard:0,dashTimer:0,dashCooldown:0,
   dashVector:{x:1,y:0},invulnerable:0,abilityCooldown:0,attackCooldown:0,
   direction:{x:1,y:0},upgradeIds:[],hitCount:0};
  this.mode='playing';this.enemies=[];this.projectiles=[];this.effects=[];this.loot=[];
  this.runCoins=0;this.clearCount=0;this.time=0;this.bossDefeated=false;this.upgradeChoices=[];
  this.camera.x=this.player.x-this.camera.w/2;this.camera.y=this.player.y-this.camera.h/2;
  this.notify();
 }
 move(entity,dx,dy,r=entity.radius){
  const seal=this.enemies.some(e=>e.hp>0);
  if(this.dungeon.canMove(entity.x+dx,entity.y,r,seal))entity.x+=dx;
  if(this.dungeon.canMove(entity.x,entity.y+dy,r,seal))entity.y+=dy;
 }
 entrance(room){
  if(!room||room.visited)return;
  const localX=this.player.x/TILE-room.gx*ROOM_W;
  const localY=this.player.y/TILE-room.gy*ROOM_H;
  if(localX<2.8||localX>ROOM_W-2.8||localY<2.8||localY>ROOM_H-2.8)return;
  room.visited=true;
  if(room.type==='start')return;
  if(room.type==='treasure'){
   room.cleared=true;this.clearCount++;
   this.createEffect('burst',room.cx,room.cy,'#ffd98e',.7,58);
   this.offerUpgrades();return;
  }
  this.spawnRoom(room);this.notify();
 }
 spawnRoom(room){
  const boss=room.type==='boss';
  const amount=boss?1:3+Math.floor(this.clearCount/2)+Math.floor(this.random()*2);
  const variants=['slime','mushroom','archer','goblin'];
  const offsets=[[ -145,-90],[145,90],[140,-90],[-140,90],[0,-100],[0,110],[-150,0],[150,0]];
  for(let i=0;i<amount;i++){
   const type=boss?'boss':variants[Math.floor(this.random()*Math.min(4,2+Math.floor(this.clearCount/2)))];
   const spec=ENEMY_DATA[type];
   const [ox,oy]=offsets[i%offsets.length];
   let x=room.cx+ox,y=room.cy+oy;
   if(!this.dungeon.canMove(x,y,spec.radius,false)){
    x=room.cx+(i%2?105:-105);y=room.cy+(i%3-1)*65;
   }
   const scale=1+this.clearCount*.12;
   this.enemies.push({x,y,homeRoom:room.id,type,radius:spec.radius,
    hp:Math.round(spec.hp*scale),maxHp:Math.round(spec.hp*scale),
    speed:spec.speed*(boss?1:1+this.clearCount*.025),damage:spec.damage,
    cooldown: .45+i*.2,windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0}});
  }
  this.createEffect('text',room.cx,room.cy-110,boss?'DER SCHLEIMKÖNIG':'KAMMER VERSIEGELT','#f8c78f',1.3);
 }
 update(dt,camera=this.camera){
  if(this.mode!=='playing')return;
  dt=Math.min(.034,Math.max(0,dt));this.time+=dt;
  const p=this.player,move=this.input.movement(),aim=this.input.aiming(p,camera);
  if(Number.isFinite(aim.x)&&Number.isFinite(aim.y))p.direction=aim;
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);
  p.attackCooldown=Math.max(0,p.attackCooldown-dt);
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  if(this.input.consumeDash()&&p.dashCooldown<=0){
   p.dashVector=Math.hypot(move.x,move.y)>.1?normalized(move.x,move.y):{...p.direction};
   p.dashTimer=.18;p.dashCooldown=1.05;p.invulnerable=Math.max(p.invulnerable,.26);
   this.createEffect('burst',p.x,p.y,CLASSES[p.kind].color,.25,20);
  }
  if(p.dashTimer>0){
   this.move(p,p.dashVector.x*690*dt,p.dashVector.y*690*dt);
   p.dashTimer=Math.max(0,p.dashTimer-dt);
   if(this.random()<.65)this.createEffect('spark',p.x,p.y,'#c1e9e4',.28,7);
  }else this.move(p,move.x*p.speed*dt,move.y*p.speed*dt);
  if(this.input.attacking()&&p.attackCooldown<=0)this.attack();
  if(this.input.consumeAbility()&&p.abilityCooldown<=0)this.ability();
  this.entrance(this.dungeon.roomAt(p.x,p.y));
  this.updateEnemies(dt);
  if(this.mode!=='playing')return;
  this.updateProjectiles(dt);
  if(this.mode!=='playing')return;
  for(const drop of this.loot)if(!drop.picked&&distance(drop,p)<30){
   drop.picked=true;
   if(drop.type==='coin')this.runCoins+=drop.value;
   else p.hp=Math.min(p.maxHp,p.hp+drop.value);
   this.createEffect('text',drop.x,drop.y,drop.type==='coin'?'+'+drop.value+' Gold':'+'+drop.value+' LP',drop.type==='coin'?'#ffe29d':'#b6efba',.7);
  }
  this.loot=this.loot.filter(d=>!d.picked);
  for(const e of this.effects)e.life-=dt;
  this.effects=this.effects.filter(e=>e.life>0);
  // Progress is earned only after a sealed encounter is actually defeated.
  const room=this.dungeon.roomAt(p.x,p.y);
  const pending=this.dungeon.rooms.find(r=>r.visited&&!r.cleared&&r.type!=='start'&&r.type!=='treasure');
  if(pending&&!this.enemies.some(e=>e.hp>0&&e.homeRoom===pending.id)){
   pending.cleared=true;this.clearCount++;
   if(pending.type==='boss'){this.bossDefeated=true;this.finish(true);return}
   this.createEffect('text',pending.cx,pending.cy-110,'KAMMER GESÄUBERT','#a9f1b4',1.4);
   if(this.clearCount%2===0)this.offerUpgrades();else this.notify();
  }
  if(room&&room.type==='boss'&&room.cleared&&!this.bossDefeated)this.finish(true);
 }
 attack(){
  const p=this.player;const kind=p.kind,aim=p.direction;
  p.attackCooldown=p.attackDelay;this.attackSequence++;
  if(kind==='warrior'){
   const reach=p.reach;this.createEffect('slash',p.x,p.y,'#e6f6ff',.22,reach,Math.atan2(aim.y,aim.x));
   for(const e of this.enemies){
    const delta=normalized(e.x-p.x,e.y-p.y);
    if(e.hp>0&&distance(e,p)<reach+e.radius&&delta.x*aim.x+delta.y*aim.y>.45)
     this.hitEnemy(e,p.damage,aim);
   }
  }else{
   this.spawnProjectile(p.x+aim.x*19,p.y+aim.y*19,aim,p.damage,kind==='mage',false);
   this.createEffect('spark',p.x+aim.x*22,p.y+aim.y*22,CLASSES[kind].color,.19,13);
  }
 }
 ability(){
  const p=this.player,aim=p.direction;p.abilityCooldown=7;
  if(p.kind==='warrior'){
   this.createEffect('ring',p.x,p.y,'#b6e5ff',.55,144);
   for(const e of this.enemies)if(e.hp>0&&distance(e,p)<145+e.radius)this.hitEnemy(e,p.damage*1.9,normalized(e.x-p.x,e.y-p.y));
  }else if(p.kind==='hunter'){
   for(let i=-3;i<=3;i++){
    const angle=Math.atan2(aim.y,aim.x)+i*.14;
    this.spawnProjectile(p.x,p.y,{x:Math.cos(angle),y:Math.sin(angle)},p.damage*1.12,false,false);
   }
  }else{
   const center={x:p.x+aim.x*165,y:p.y+aim.y*165};
   this.createEffect('ring',center.x,center.y,'#d5a7ff',.65,133);
   for(const e of this.enemies)if(e.hp>0&&distance(e,center)<133+e.radius)this.hitEnemy(e,p.damage*2.8,aim);
  }
 }
 spawnProjectile(x,y,dir,damage,magic=false,hostile=false){
  const speed=hostile?250:magic?490:690;
  this.projectiles.push({x,y,vx:dir.x*speed,vy:dir.y*speed,damage,magic,hostile,
   life:hostile?3.1:1.2,radius:magic?9:hostile?9:5});
 }
 hitEnemy(e,damage,dir){
  if(e.hp<=0)return;
  const p=this.player;
  let d=damage*(this.random()<p.crit?1.7:1);
  p.hitCount++;
  if(p.hitCount%4===0&&p.upgradeIds.includes('bolt'))d+=p.damage*.7;
  d=Math.round(d);e.hp-=d;e.flash=.16;
  e.knock={x:dir.x*100,y:dir.y*100};
  if(p.leech>0)p.hp=Math.min(p.maxHp,p.hp+d*p.leech);
  this.createEffect('text',e.x,e.y-27,''+d,'#fff1bf',.52);
  this.createEffect('burst',e.x,e.y,e.type==='boss'?'#ffb2c0':'#ffdd9e',.28,16);
  if(e.hp<=0){
   e.hp=0;const reward=ENEMY_DATA[e.type].reward;
   this.loot.push({x:e.x,y:e.y,type:'coin',value:reward,picked:false});
   if(this.random()<.19)this.loot.push({x:e.x+14,y:e.y+8,type:'heal',value:18,picked:false});
   this.createEffect('burst',e.x,e.y,'#b6f2bf',.55,40);
  }
 }
 hurt(damage,dir){
  const p=this.player;
  if(p.invulnerable>0)return;
  p.hp=Math.max(0,p.hp-Math.max(1,Math.round(damage*(1-p.guard))));
  p.invulnerable=.78;
  this.createEffect('text',p.x,p.y-32,'-'+Math.round(damage),'#ff9a91',.75);
  this.createEffect('burst',p.x,p.y,'#ff8397',.4,24);
  if(p.hp<=0)this.finish(false);
 }
 updateEnemies(dt){
  const p=this.player;
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   e.elapsed+=dt;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;
   const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy)||1;
   const dir={x:dx/dist,y:dy/dist};
   if(e.windup>0){
    e.windup-=dt;
    if(e.windup<=0){
     if(e.type==='boss'){
      for(let i=-2;i<=2;i++){
       const a=Math.atan2(dir.y,dir.x)+i*.18;
       this.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},e.damage,false,true);
      }
      this.createEffect('ring',e.x,e.y,'#ff789e',.55,95);
     }else if(e.type==='archer')this.spawnProjectile(e.x,e.y,dir,e.damage,false,true);
     e.cooldown=e.type==='boss'?2.3:1.75;
    }
   }else{
    if(dist>(e.type==='archer'?225:e.radius+p.radius+8)){
     const amount=e.speed*dt;
     const nx=dir.x*amount+e.knock.x*dt,ny=dir.y*amount+e.knock.y*dt;
     // Enemies do not cross walls or sealed doors.
     this.move(e,nx,ny);
    }
    if(e.cooldown<=0){
     if((e.type==='archer'||e.type==='boss')&&dist<500){
      e.windup=e.type==='boss'?.8:.58;
      e.cooldown=99;
      this.createEffect('ring',e.x,e.y,e.type==='boss'?'#ff6f83':'#ecc5ff',e.windup,37);
     }else if(dist<e.radius+p.radius+12)e.cooldown=.8;
    }
    if(dist<e.radius+p.radius+3)this.hurt(e.damage,dir);
   }
   e.knock.x*=Math.pow(.025,dt);e.knock.y*=Math.pow(.025,dt);
  }
  this.enemies=this.enemies.filter(e=>e.hp>0);
 }
 updateProjectiles(dt){
  const p=this.player;
  for(const b of this.projectiles){
   b.life-=dt;if(b.life<=0)continue;
   b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(this.dungeon.isBlocked(b.x,b.y,this.enemies.length>0)){b.life=0;continue}
   if(b.hostile){
    if(distance(b,p)<b.radius+p.radius){this.hurt(b.damage,normalized(b.vx,b.vy));b.life=0}
   }else{
    for(const e of this.enemies)if(e.hp>0&&distance(b,e)<b.radius+e.radius){
     this.hitEnemy(e,b.damage,normalized(b.vx,b.vy));b.life=0;
     if(b.magic)for(const n of this.enemies)if(n!==e&&n.hp>0&&distance(n,e)<65)this.hitEnemy(n,b.damage*.48,normalized(n.x-e.x,n.y-e.y));
     break;
    }
   }
  }
  this.projectiles=this.projectiles.filter(b=>b.life>0);
 }
 offerUpgrades(){
  this.upgradeChoices=chooseUpgrades(this.random,3);this.mode='upgrade';this.notify();
 }
 selectUpgrade(id){
  if(this.mode!=='upgrade'||!this.upgradeChoices.some(u=>u.id===id))return;
  const p=this.player;p.upgradeIds.push(id);
  switch(id){
   case 'power':p.damage*=1.2;break;case 'fury':p.attackDelay*=.85;break;
   case 'stride':p.speed*=1.12;break;case 'heart':p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+35);break;
   case 'guard':p.guard=Math.min(.65,p.guard+.1);break;
   case 'reach':p.reach*=1.2;break;
   case 'leech':p.leech+=.06;break;
   case 'crit':p.crit=Math.min(.8,p.crit+.12);break;
   case 'bolt':break;
  }
  this.mode='playing';this.upgradeChoices=[];this.notify();
 }
 createEffect(type,x,y,color,life,radius=20,angle=0){
  const effect=type==='text'?{type,x,y,text:String(color),color:life,life:radius,maxLife:radius,radius:20,angle:0}:{type,x,y,color,life,maxLife:life,radius,angle};
  this.effects.push(effect);if(this.effects.length>110)this.effects.shift();
 }
 finish(won){
  if(this.mode!=='playing')return;
  this.mode=won?'victory':'dead';
  this.progress.runs++;
  const earned=won?this.runCoins+120:Math.floor(this.runCoins*.65);
  this.progress.gold+=earned;
  if(won)this.progress.bossKills++;
  this.progress.bestRooms=Math.max(this.progress.bestRooms,this.clearCount);
  this.earnedGold=earned;
  saveProgress(this.progress);this.notify();
 }
 getHud(){
  if(!this.player)return null;
  return {className:CLASSES[this.player.kind].name,hp:Math.ceil(this.player.hp),maxHp:this.player.maxHp,
   rooms:this.clearCount,remaining:9-this.clearCount,coins:this.runCoins,ability:this.player.abilityCooldown,
   dash:this.player.dashCooldown,time:this.time,seed:this.dungeon.seed};
 }
}
