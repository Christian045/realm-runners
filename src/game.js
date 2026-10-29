import {CLASSES, ENEMY_DATA, TILE, clamp, distance, normalized, chooseUpgrades} from './data.js';
import {generateDungeon, seeded, ROOM_W, ROOM_H} from './dungeon.js';
import {saveProgress, buyPermanent, upgradeCost} from './progression.js';
import {createBossState, updateBoss, startPhaseTwo, isBossInvulnerable, PHASE_TWO_AT} from './boss.js';
import {createWardenState} from './warden.js';
import {generateItem,equipItem,applyTalents,buyTalent} from './loot.js';
import {hasAffix,onDash,beforeHit,afterHit,onHurt,onKill,statusTick} from './affixes.js';
import {CHALLENGES,challengeUnlocked,applyRunChallenge,enemyExtraCount,challengeScale,challengeReward,awardAchievements} from './motivation.js';
import {validSpecialization,specializationUnlocked,applySpecialization} from './specializations.js';

export class Game {
 constructor(progress,input,onChange=()=>{}){
  this.progress=progress;this.input=input;this.onChange=onChange;this.mode='menu';
  this.dungeon=null;this.player=null;this.enemies=[];this.projectiles=[];this.effects=[];
  this.loot=[];this.runCoins=0;this.clearCount=0;this.time=0;this.camera={x:0,y:0,scale:1,w:960,h:540};
  this.attackSequence=0;this.upgradeChoices=[];this.bossDefeated=false;this.bossMessage='';
  this.runMode='normal';this.endless=false;this.specialization='standard';this.floorDepth=1;this.shake=0;this.hitstop=0;
  this.hazards=[];this.achievementsEarned=[];this.sound=null;
 }
 notify(){this.onChange(this)}
 setChallenge(id){if(this.mode==='menu'&&challengeUnlocked(this.progress,id)){this.runMode=id;this.notify();return true}return false}
 setEndless(enabled){if(this.mode==='menu'&&(!enabled||this.progress.bossKills>0)){
  this.endless=!!enabled;this.notify();return true
 }return false}
 playSound(id){try{this.sound?.(id)}catch{}}
 chooseEvent(choice){
  if(this.mode!=='event')return false;
  const p=this.player,room=this.activeEvent;
  if(!room)return false;
  if(room.eventKind==='forge'){
   if(choice==='reforge'){this.dropGear(p.x+15,p.y+28,true);this.runCoins+=12}
   else if(choice==='repair')p.hp=Math.min(p.maxHp,p.hp+32);
   else return false;
  }else if(room.eventKind==='trial'){
   if(choice==='challenge'){
    // Optional combat encounter. The event remains locked until it is cleared.
    room.cleared=false;room.visited=true;room.type='combat';this.clearCount=Math.max(0,this.clearCount-1);
    this.mode='playing';this.spawnRoom(room);
    for(const e of this.enemies){e.hp=Math.round(e.hp*1.3);e.maxHp=e.hp;e.damage*=1.15}
    this.notify();return true;
   }else if(choice==='leave')this.runCoins+=15;
   else return false;
  }else return false;
  this.mode='playing';this.activeEvent=null;this.notify();return true;
 }

 chooseClass(kind){if(CLASSES[kind]){if(this.progress.selectedClass!==kind)this.specialization='standard';this.progress.selectedClass=kind;saveProgress(this.progress);this.notify()}}
 selectSpecialization(id){if(this.mode!=='menu'||!validSpecialization(this.progress.selectedClass,id)||!specializationUnlocked(this.progress,id))return false;this.specialization=id;this.notify();return true}
 purchase(stat){if(buyPermanent(this.progress,stat)){saveProgress(this.progress);this.notify();return true}return false}
 purchaseTalent(kind,id){if(buyTalent(this.progress,kind,id)){saveProgress(this.progress);this.notify();return true}return false}
 toggleInventory(){
  if(this.mode==='playing'){this.mode='inventory';this.notify()}
  else if(this.mode==='inventory'){this.mode='playing';this.notify()}
 }
 equip(id){
  if(this.mode!=='inventory')return false;
  const item=this.player.inventory.find(i=>i.id===id);
  const ok=equipItem(this.player,item);
  if(ok)this.notify();return ok;
 }
 chooseShrine(choice){
  if(this.mode!=='shrine')return false;
  const p=this.player;
  if(choice==='heal')p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.42));
  else if(choice==='risk'){
   if(p.hp<=25)return false;
   p.hp-=20;this.dropGear(p.x,p.y+22,true);
  }else if(choice==='power')p.damage*=1.12;
  else return false;
  this.mode='playing';this.notify();return true;
 }
 dropGear(x,y,rare=false){
  const item=generateItem(this.random,this.clearCount,this.player.kind,rare);
  this.loot.push({x,y,type:'gear',item,picked:false});
  this.createEffect('ring',x,y,'#bfa3ff',.7,31);
  return item;
 }
 start(kind=this.progress.selectedClass,seed=(Date.now()>>>0)){
  if(!CLASSES[kind])kind='warrior';
  this.progress.selectedClass=kind;saveProgress(this.progress);
  this.floorDepth=1;this.shake=0;this.hitstop=0;this.hazards=[];this.achievementsEarned=[];
  this.dungeon=generateDungeon(seed);this.random=seeded(seed^0xa5b4c382);
  for(const id of this.dungeon.rooms[0].links)this.dungeon.rooms[id].discovered=true;
  const base=CLASSES[kind],bonus=this.progress.upgrades;
  this.player={x:this.dungeon.start.x,y:this.dungeon.start.y,radius:14,kind,
   maxHp:base.hp+bonus.vitality*12,hp:base.hp+bonus.vitality*12,
   speed:base.speed,damage:base.damage*(1+bonus.strength*.08),attackDelay:base.cooldown,
   reach:base.range,crit:0,leech:0,guard:0,dashTimer:0,dashCooldown:0,
   dashVector:{x:1,y:0},invulnerable:0,abilityCooldown:0,attackCooldown:0,
   direction:{x:1,y:0},upgradeIds:[],hitCount:0,inventory:[],
   moving:false,attackTimer:0,castTimer:0,hurtTimer:0,walkCycle:0,
   equipment:{weapon:null,armor:null,charm:null}};
  applyTalents(this.player,this.progress);
  applySpecialization(this.player,specializationUnlocked(this.progress,this.specialization)?this.specialization:'standard');
  applyRunChallenge(this,this.runMode);
  this.mode='playing';this.enemies=[];this.projectiles=[];this.effects=[];this.loot=[];
  this.runCoins=0;this.clearCount=0;this.time=0;this.bossDefeated=false;this.upgradeChoices=[];this.bossMessage='';
  this.camera.x=this.player.x-this.camera.w/2;this.camera.y=this.player.y-this.camera.h/2;
  this.playSound('start');
  this.notify();
 }
 move(entity,dx,dy,r=entity.radius){
  if(entity!==this.player&&Math.hypot(dx,dy)>.01){entity.moving=true;entity.moveX=dx;entity.moveY=dy}
  const seal=this.enemies.some(e=>e.hp>0);
  if(this.dungeon.canMove(entity.x+dx,entity.y,r,seal))entity.x+=dx;
  if(this.dungeon.canMove(entity.x,entity.y+dy,r,seal))entity.y+=dy;
 }
 entrance(room){
  if(!room||room.visited)return;
  const localX=this.player.x/TILE-room.gx*ROOM_W;
  const localY=this.player.y/TILE-room.gy*ROOM_H;
  if(localX<2.8||localX>ROOM_W-2.8||localY<2.8||localY>ROOM_H-2.8)return;
  room.visited=true;room.discovered=true;
  for(const linked of room.links)this.dungeon.rooms[linked].discovered=true;
  if(room.type==='start')return;
  if(room.type==='event'){
   room.cleared=true;this.clearCount++;this.activeEvent=room;this.mode='event';
   this.createEffect('ring',room.cx,room.cy,'#9ce6c0',.65,95);
   this.playSound('event');this.notify();return;
  }
  if(room.type==='shrine'){
   room.cleared=true;this.clearCount++;
   this.mode='shrine';this.notify();return;
  }
  if(room.type==='secret'){
   room.cleared=true;this.clearCount++;
   this.runCoins+=55+this.clearCount*8;
   this.dropGear(room.cx,room.cy,true);
   this.createEffect('text',room.cx,room.cy-75,'GEHEIMKAMMER ENTDECKT','#f0d6a2',1.3);
   this.notify();return;
  }
  if(room.type==='treasure'){
   room.cleared=true;this.clearCount++;
   this.dropGear(room.cx,room.cy,true);
   this.createEffect('burst',room.cx,room.cy,'#ffd98e',.7,58);
   this.offerUpgrades();return;
  }
  this.spawnRoom(room);this.notify();
 }
 spawnRoom(room){
  const boss=room.type==='boss';
  const eliteRoom=room.type==='elite';
  const amount=boss?1:eliteRoom?3:3+Math.floor(this.clearCount/2)+Math.floor(this.random()*2)+enemyExtraCount(this);
  const variants=room.biome==='fungal'?['mushroom','slime','mushroom','archer']:
   room.biome==='flooded'?['archer','slime','goblin','archer']:
   ['goblin','mushroom','archer','slime'];
  const warden=boss&&this.dungeon.seed%3===2;
  const offsets=[[ -145,-90],[145,90],[140,-90],[-140,90],[0,-100],[0,110],[-150,0],[150,0]];
  for(let i=0;i<amount;i++){
   const type=boss?'boss':variants[Math.floor(this.random()*Math.min(4,2+Math.floor(this.clearCount/2)))];
   const spec=ENEMY_DATA[type];
   const [ox,oy]=offsets[i%offsets.length];
   let x=room.cx+ox,y=room.cy+oy;
   if(!this.dungeon.canMove(x,y,spec.radius,false)){
    x=room.cx+(i%2?105:-105);y=room.cy+(i%3-1)*65;
   }
   const elite=eliteRoom&&i===0;
   const eliteMods=['swift','guardian','arcane','volatile','vampiric'];
   const eliteMod=elite?eliteMods[Math.floor(this.random()*eliteMods.length)]:null;
   const scale=(1+this.clearCount*.12+Math.max(0,this.floorDepth-1)*.26)*(elite?2.25:1)*challengeScale(this);
   const hpScale=eliteMod==='guardian'?1.35:1;
   const speedScale=eliteMod==='swift'?1.3:1;
   this.enemies.push({x,y,homeRoom:room.id,type,radius:elite?spec.radius*1.3:spec.radius,
    hp:Math.round(spec.hp*scale*hpScale),maxHp:Math.round(spec.hp*scale*hpScale),
    speed:spec.speed*(boss?1:1+this.clearCount*.025)*(elite?1.18:1)*speedScale*challengeScale(this),
    damage:spec.damage*(elite?1.55:1)*challengeScale(this),elite,eliteMod,eliteShot:2,
    cooldown:.45+i*.2,windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0},
    ...(boss?{boss:warden?createWardenState():createBossState()}: {})});
  }
  this.createEffect('text',room.cx,room.cy-110,
   boss?(warden?'DER RUNENWÄCHTER':'DER SCHLEIMKÖNIG'):eliteRoom?'ELITEKAMMER':'KAMMER VERSIEGELT',
   '#f8c78f',1.3);
 }
 update(dt,camera=this.camera){
  if(this.mode!=='playing')return;
  dt=Math.min(.034,Math.max(0,dt));
  this.shake=Math.max(0,this.shake-dt*19);
  if(this.hitstop>0){this.hitstop=Math.max(0,this.hitstop-dt);if(this.enemies.some(e=>e.hp>0))return}
  this.time+=dt;
  const p=this.player,move=this.input.movement(),aim=this.input.aiming(p,camera);
  if(Number.isFinite(aim.x)&&Number.isFinite(aim.y))p.direction=aim;
  p.walkCycle=(p.walkCycle||0)+Math.hypot(move.x,move.y)*dt*14;
  p.moving=Math.hypot(move.x,move.y)>.12;
  p.attackTimer=Math.max(0,(p.attackTimer||0)-dt);
  p.castTimer=Math.max(0,(p.castTimer||0)-dt);
  p.hurtTimer=Math.max(0,(p.hurtTimer||0)-dt);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);
  p.attackCooldown=Math.max(0,p.attackCooldown-dt);
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  if(this.input.consumeDash()&&p.dashCooldown<=0){
   p.dashVector=Math.hypot(move.x,move.y)>.1?normalized(move.x,move.y):{...p.direction};
   p.dashTimer=.18;p.dashCooldown=p.specialization==='ranger'?.75:1.05;p.invulnerable=Math.max(p.invulnerable,.26);
   this.createEffect('burst',p.x,p.y,CLASSES[p.kind].color,.25,20);
   onDash(this);this.playSound('dash');
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
  this.updateHazards(dt);
  if(this.mode!=='playing')return;
  for(const drop of this.loot)if(!drop.picked&&distance(drop,p)<30){
   drop.picked=true;
   if(drop.type==='coin')this.runCoins+=drop.value;
   else if(drop.type==='heal')p.hp=Math.min(p.maxHp,p.hp+drop.value);
   else if(drop.type==='gear'){
    if(p.inventory.length<18){
     p.inventory.push(drop.item);this.progress.itemsFound=(this.progress.itemsFound||0)+1;
     if(!p.equipment[drop.item.slot])equipItem(p,drop.item);
     this.playSound('loot');
    }else this.runCoins+=12;
   }
   this.createEffect('text',drop.x,drop.y,drop.type==='gear'?'AUSRÜSTUNG +1':
    drop.type==='coin'?'+'+drop.value+' Gold':'+'+drop.value+' LP',
    drop.type==='coin'?'#ffe29d':drop.type==='gear'?'#d3acff':'#b6efba',.7);
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
   if(pending.type==='elite')this.dropGear(pending.cx,pending.cy,true);
   else if(this.random()<.28)this.dropGear(pending.cx,pending.cy);
   if(this.clearCount%2===0)this.offerUpgrades();else this.notify();
  }
  if(room&&room.type==='boss'&&room.cleared&&!this.bossDefeated)this.finish(true);
 }
 attack(){
  const p=this.player;const kind=p.kind,aim=p.direction;
  p.attackCooldown=p.attackDelay;p.attackTimer=.18;this.attackSequence++;this.playSound(p.kind==='warrior'?'slash':'shoot');
  if(kind==='warrior'){
   const reach=p.reach;this.createEffect('slash',p.x,p.y,'#e6f6ff',.22,reach,Math.atan2(aim.y,aim.x));
   for(const e of this.enemies){
    const delta=normalized(e.x-p.x,e.y-p.y);
    if(e.hp>0&&distance(e,p)<reach+e.radius&&delta.x*aim.x+delta.y*aim.y>.45)
     this.hitEnemy(e,p.damage,aim);
   }
  }else{
   this.spawnProjectile(p.x+aim.x*19,p.y+aim.y*19,aim,p.damage,kind==='mage',false);
   if(hasAffix(p,'triple'))for(const delta of [-.15,.15]){
    const a=Math.atan2(aim.y,aim.x)+delta;
    this.spawnProjectile(p.x,p.y,{x:Math.cos(a),y:Math.sin(a)},p.damage*.55,kind==='mage',false);
   }
   this.createEffect('spark',p.x+aim.x*22,p.y+aim.y*22,CLASSES[kind].color,.19,13);
  }
 }
 ability(){
  const p=this.player,aim=p.direction;p.abilityCooldown=p.specialization==='arcanist'?5:7;p.castTimer=.36;this.playSound('ability');
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
 spawnProjectile(x,y,dir,damage,magic=false,hostile=false,speedOverride=null){
  const speed=speedOverride??(hostile?250:magic?490:690);
  this.projectiles.push({x,y,vx:dir.x*speed,vy:dir.y*speed,damage,magic,hostile,
   life:hostile?3.1:1.2,radius:magic?9:hostile?9:5});
 }
 hitEnemy(e,damage,dir,options={}){
  if(!e||e.hp<=0||isBossInvulnerable(e))return;
  const p=this.player,proc=options.proc!==false;
  const critical=proc&&this.random()<p.crit;
  let d=proc?beforeHit(this,e,damage):damage;
  if(critical)d*=1.7;
  if(proc){p.hitCount++;if(p.hitCount%4===0&&p.upgradeIds.includes('bolt'))d+=p.damage*.7}
  d=Math.max(1,Math.round(d));
  const threshold=Math.ceil(e.maxHp*PHASE_TWO_AT);
  if(e.type==='boss'&&e.boss.phase===1&&e.hp-d<=threshold){
   e.hp=threshold;startPhaseTwo(this,e);
  }else e.hp=Math.max(0,e.hp-d);
  e.flash=.17;e.hurtTimer=.18;
  e.knock={x:dir.x*(e.type==='boss'?30:critical?230:170),y:dir.y*(e.type==='boss'?30:critical?230:170)};
  if(proc&&p.leech>0)p.hp=Math.min(p.maxHp,p.hp+d*p.leech);
  if(proc){
   this.hitstop=Math.max(this.hitstop,critical?.075:.035);
   this.shake=Math.max(this.shake,critical?8:e.type==='boss'?5:3);
   this.playSound(critical?'crit':'hit');
  }
  this.createEffect('text',e.x,e.y-29,(critical?'KRIT ':'')+d,critical?'#ffde86':'#fff1bf',critical?.78:.52);
  this.createEffect('burst',e.x,e.y,critical?'#ffd37b':e.type==='boss'?'#ffb2c0':'#ffdd9e',.3,critical?26:16);
  if(proc&&e.hp>0)afterHit(this,e,d,critical,dir);
  if(e.hp<=0)this.killEnemy(e);
 }
 killEnemy(e){
  if(e.deadHandled)return;
  e.deadHandled=true;e.hp=0;
  if(e.type==='boss'){
   for(const add of this.enemies)if(add!==e&&add.homeRoom===e.homeRoom)add.hp=0;
   this.projectiles=this.projectiles.filter(p=>!p.hostile);
  }
  const reward=ENEMY_DATA[e.type].reward*(e.elite?3:1);
  this.loot.push({x:e.x,y:e.y,type:'coin',value:reward,picked:false});
  if(e.elite){
   this.progress.eliteKills=(this.progress.eliteKills||0)+1;
   this.dropGear(e.x+25,e.y,true);
  }else if(e.type!=='boss'&&this.random()<.08)this.dropGear(e.x+18,e.y);
  if(this.random()<.19)this.loot.push({x:e.x+14,y:e.y+8,type:'heal',value:18,picked:false});
  if(e.eliteMod==='volatile'){
   this.hazards.push({x:e.x,y:e.y,radius:85,time:.85,maxTime:.85,damage:23});
   this.createEffect('ring',e.x,e.y,'#efaa75',.85,85);
  }
  onKill(this,e);
  this.effects.push({type:'death',kind:e.type==='boss'?(e.boss?.variant==='warden'?'warden':'slimeking'):e.type,
   x:e.x,y:e.y,radius:e.radius,elite:e.elite,phaseTwo:e.boss?.phase===2,
   color:'#d9e5e9',life:.4,maxLife:.4});
  this.createEffect('burst',e.x,e.y,e.elite?'#ffca8c':'#b6f2bf',.56,40);
  this.playSound(e.type==='boss'?'bossDown':'enemyDown');
 }
 hurt(damage,dir){
  const p=this.player;
  if(p.invulnerable>0)return;
  const reduced=Math.max(1,Math.round(damage*(1-p.guard)));
  const blocked=Math.min(reduced,p.shield||0);
  p.shield=Math.max(0,(p.shield||0)-blocked);
  const actual=reduced-blocked;
  p.hp=Math.max(0,p.hp-actual);
  p.invulnerable=.78;p.hurtTimer=.34;
  this.shake=Math.max(this.shake,actual?11:4);
  this.hitstop=Math.max(this.hitstop,actual?.07:.04);
  this.createEffect('text',p.x,p.y-32,actual?'-'+actual:'BLOCK','#ff9a91',.75);
  this.createEffect('burst',p.x,p.y,'#ff8397',.4,24);
  if(actual>0)onHurt(this,actual);
  this.playSound(actual?'hurt':'block');
  if(p.hp<=0)this.finish(false);
 }
 updateHazards(dt){
  for(const h of this.hazards){
   h.time-=dt;
   if(h.time<=0&&!h.done){
    h.done=true;
    this.createEffect('ring',h.x,h.y,'#f9b184',.65,h.radius);
    if(distance(this.player,h)<h.radius+this.player.radius)
     this.hurt(h.damage,{x:0,y:0});
   }
  }
  this.hazards=this.hazards.filter(h=>h.time>-.45);
 }
 updateEnemies(dt){
  const p=this.player;
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   e.moving=false;e.attackTimer=Math.max(0,(e.attackTimer||0)-dt);
   e.castTimer=Math.max(0,(e.castTimer||0)-dt);
   e.hurtTimer=Math.max(0,(e.hurtTimer||0)-dt);
   statusTick(this,e,dt);if(e.hp<=0)continue;
   if(e.type==='boss'&&e.boss){updateBoss(this,e,dt);if(this.mode!=='playing')return;continue}
   e.elapsed+=dt;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;
   if(e.elite){
    e.eliteShot-=dt;
    if(e.eliteShot<=0&&distance(e,p)<375){
     const base=Math.atan2(p.y-e.y,p.x-e.x);
     for(const delta of e.eliteMod==='arcane'?[-.24,0,.24]:[0]){
      const a=base+delta;
      this.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},e.damage*.65,false,true,235);
     }
     this.createEffect('ring',e.x,e.y,'#ffc37f',.35,32);
     e.eliteShot=2.5;
    }
   }
   const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy)||1;
   const dir={x:dx/dist,y:dy/dist};
   if(e.windup>0){
    e.castTimer=Math.max(e.castTimer,.18);
    e.windup-=dt;
    if(e.windup<=0){
     if(e.type==='boss'){
      for(let i=-2;i<=2;i++){
       const a=Math.atan2(dir.y,dir.x)+i*.18;
       this.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},e.damage,false,true);
      }
      this.createEffect('ring',e.x,e.y,'#ff789e',.55,95);
     }else if(e.type==='archer'){this.spawnProjectile(e.x,e.y,dir,e.damage,false,true);e.attackTimer=.24;}
     e.cooldown=e.type==='boss'?2.3:1.75;
    }
   }else{
    if(dist>(e.type==='archer'?225:e.radius+p.radius+8)){
     const amount=e.speed*dt;
     const speedFactor=e.slow>0?.58:1;
     const nx=dir.x*amount*speedFactor+e.knock.x*dt,ny=dir.y*amount*speedFactor+e.knock.y*dt;
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
    if(dist<e.radius+p.radius+3){
     const prev=p.hp;this.hurt(e.damage,dir);
     if(e.eliteMod==='vampiric'&&p.hp<prev)e.hp=Math.min(e.maxHp,e.hp+8);
    }
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
     this.hitEnemy(e,b.damage,normalized(b.vx,b.vy));
     if(p.specialization==='pyromancer'&&b.magic&&e.hp>0)e.burn=Math.max(e.burn||0,2.5);
     b.life=0;
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
 advanceFloor(){
  this.progress.bossKills++;
  this.floorDepth++;
  this.progress.deepestFloor=Math.max(this.progress.deepestFloor||1,this.floorDepth);
  this.progress.bestRooms=Math.max(this.progress.bestRooms,this.clearCount);
  this.dungeon=generateDungeon((this.dungeon.seed^(this.floorDepth*0x9e3779b9))>>>0);
  for(const id of this.dungeon.rooms[0].links)this.dungeon.rooms[id].discovered=true;
  this.player.x=this.dungeon.start.x;this.player.y=this.dungeon.start.y;
  this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.round(this.player.maxHp*.32));
  this.player.invulnerable=1.5;this.player.dashCooldown=0;
  this.enemies=[];this.projectiles=[];this.loot=[];this.hazards=[];this.effects=[];
  this.clearCount=0;this.bossDefeated=false;this.hitstop=0;
  this.camera.x=this.player.x-this.camera.w/2;this.camera.y=this.player.y-this.camera.h/2;
  this.createEffect('text',this.player.x,this.player.y-70,'ETAGE '+this.floorDepth,'#b5dfc7',1.5);
  saveProgress(this.progress);this.notify();
 }
 finish(won){
  if(this.mode!=='playing')return;
  if(won&&this.endless){this.advanceFloor();return}
  this.mode=won?'victory':'dead';
  this.progress.runs++;
  if(won)this.progress.bossKills++;
  this.progress.deepestFloor=Math.max(this.progress.deepestFloor||1,this.floorDepth);
  const earned=challengeReward(won?this.runCoins+120:Math.floor(this.runCoins*.65),this.runMode);
  this.progress.gold+=earned;
  this.progress.bestRooms=Math.max(this.progress.bestRooms,this.clearCount);
  this.achievementsEarned=awardAchievements(this.progress);
  this.earnedGold=earned+this.achievementsEarned.reduce((n,a)=>n+a.reward,0);
  saveProgress(this.progress);this.notify();
 }
 getActiveBoss(){return this.enemies.find(e=>e.type==='boss'&&e.hp>0)||null}
 getHud(){
  if(!this.player)return null;
  return {className:CLASSES[this.player.kind].name,hp:Math.ceil(this.player.hp),maxHp:this.player.maxHp,
   inventory:this.player.inventory.length,biome:this.dungeon.roomAt(this.player.x,this.player.y)?.biome||'crypt',
   floor:this.floorDepth,challenge:this.runMode,endless:this.endless,shield:this.player.shield||0,
   rooms:this.clearCount,remaining:9-this.clearCount,coins:this.runCoins,ability:this.player.abilityCooldown,
   dash:this.player.dashCooldown,time:this.time,seed:this.dungeon.seed,
   boss:(()=>{const e=this.getActiveBoss();return e?{name:e.boss.variant==='warden'?'DER RUNENWÄCHTER':'DER SCHLEIMKÖNIG',
    hp:Math.ceil(e.hp),maxHp:e.maxHp,phase:e.boss.phase,
    transitioning:e.boss.transition>0,attack:e.boss.telegraph?.type|| (e.boss.charge?'charge':null)}:null})()};
 }
}
