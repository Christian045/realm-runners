import {beginKnightAction,advanceKnightAction} from './knight-animation.js?v=0.27.0';
import {CLASSES, ENEMY_DATA, TILE, clamp, distance, normalized, chooseUpgrades} from './data.js?v=0.23.0';
import {generateDungeon, seeded, ROOM_W, ROOM_H} from './dungeon.js?v=0.26.0';
import {saveProgress, buyPermanent, upgradeCost} from './progression.js?v=0.21.0';
import {defaultStatistics,newRunStatistics,recordEnemyKill,recordDamage,finishRunStatistics} from './statistics.js?v=0.21.0';
import {createBossState, updateBoss, startPhaseTwo, isBossInvulnerable, PHASE_TWO_AT} from './boss.js?v=0.25.0';
import {createWardenState} from './warden.js?v=0.25.0';
import {generateItem,equipItem,applyTalents,buyTalent} from './loot.js?v=0.21.0';
import {hasAffix,onDash,beforeHit,afterHit,onHurt,onKill,statusTick} from './affixes.js?v=0.21.0';
import {CHALLENGES,challengeUnlocked,applyRunChallenge,enemyExtraCount,challengeScale,challengeReward,awardAchievements} from './motivation.js?v=0.21.0';
import {validSpecialization,specializationUnlocked,applySpecialization} from './specializations.js?v=0.21.0';
import {enemySteering,hasLineOfSight,findSpawnPosition,findPath} from './navigation.js?v=0.26.0';
import {normalEncounterPlan,pickNormalEnemy} from './encounter-planner.js?v=0.24.0';
import {separateEnemies,flankVector,lockEnemyAim,meleeArcContains} from './combat-tactics.js?v=0.25.0';
import {towerStage,towerFloorSeed,towerDifficulty,towerWinReward,TOWER_LENGTH} from './tower.js?v=0.17.0';
import {createTowerBossState,applyTowerBossDamage} from './tower-boss.js?v=0.18.0';
import {updateTowerEnemy,towerEnemyDamage,towerRoomHazard} from './tower-enemies.js?v=0.18.0';
import {updateEncounterEnemy,encounterMitigation,rangedEncounterType} from './encounter-enemies.js?v=0.21.0';
import {nextTowerRelic,grantTowerRelic,towerRelicDamage,afterTowerRelicHit,towerRelicKill,towerRelicSave,towerRelicFloor} from './tower-relics.js?v=0.21.0';
import {cappedBossDamage,BOSS_BALANCE} from './combat-balance.js?v=0.15.0';
import {towerFloorProfile,towerEncounterPlan,towerRoomDamage,towerRoomSpeed,towerEnemyWindup,towerEnemyRecovery,towerFirstHazard} from './difficulty-director.js?v=0.18.0';
import {impactStyle} from './visual-impact.js?v=0.14.0';
import {hasSet,hasRunPower,pickRunUpgrades,onBuildDash,onBuildHurt,onBuildHit,buildDamageFactor} from './buildcraft.js?v=0.21.0';

export class Game {
 constructor(progress,input,onChange=()=>{}){
  this.progress=progress;this.input=input;this.onChange=onChange;this.mode='menu';
  this.progress.statistics??=defaultStatistics();
  this.dungeon=null;this.player=null;this.enemies=[];this.projectiles=[];this.effects=[];
  this.loot=[];this.runCoins=0;this.clearCount=0;this.time=0;this.camera={x:0,y:0,scale:1,w:960,h:540};
  this.attackSequence=0;this.upgradeChoices=[];this.bossDefeated=false;this.bossMessage='';
  this.runMode='normal';this.endless=false;this.tower=false;this.runSeed=0;this.specialization='standard';this.floorDepth=1;this.shake=0;this.hitstop=0;
  this.hazards=[];this.achievementsEarned=[];this.sound=null;this.libraryKey=false;
  this.towerRelics=[];this.towerRelicHits=0;this.towerRelicKills=0;this.towerPhoenixUsed=false;this.stageStartedAt=0;this.stageHazardClock=9;this.towerNewRecord=false;
  this.runStatistics=null;this.statisticsSaveClock=0;this.exitPortal=null;this.hitsTaken=0;this.shopStock=[];
  this.servantChoice='bat';this.servant=null;this.giant=null;this.puddles=[];this.ambientClock=9;
  this.alchemyAiming=false;this.alchemyTarget=null;this.queuedAlchemyThrow=null;this.alchemyThrowTarget=null;
 }
 notify(){if(this.mode!=='playing'){this.alchemyAiming=false;this.queuedAlchemyThrow=null;}this.onChange(this)}
 saveStatistics(){return saveProgress(this.progress)}
 setServant(id){
  if(this.mode!=='menu'||!['bat','imp','spirit','guardian','ranger'].includes(id))return false;
  this.servantChoice=id==='guardian'?'bat':id==='ranger'?'imp':id;this.notify();return true;
 }
 setChallenge(id){if(this.mode==='menu'&&challengeUnlocked(this.progress,id)){this.runMode=id;this.notify();return true}return false}
 setEndless(enabled){if(this.mode==='menu'&&(!enabled||this.progress.bossKills>0)){
  this.endless=!!enabled;if(enabled)this.tower=false;this.notify();return true
 }return false}
 setTower(enabled){if(this.mode!=='menu')return false;
  this.tower=!!enabled;if(enabled)this.endless=false;this.notify();return true}
 currentTowerStage(){return towerStage(this.floorDepth)}
 enemySpec(type){return ENEMY_DATA[type]}
 chooseTowerReward(id){
  if(this.mode!=='stageclear'||!['recover','relic','power','sigil'].includes(id)||!this.tower)return false;
  this.advanceFloor();
  if(id==='recover'&&!(this.player.statuses?.rot>0))this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.ceil(this.player.maxHp*.45));
  if(id==='power')this.player.damage*=1.06;
  if(id==='relic')this.dropGear(this.player.x+24,this.player.y+12,true);
  if(id==='sigil')grantTowerRelic(this);
  this.createEffect('text',this.player.x,this.player.y-105,'ETAGE '+this.floorDepth+' · '+this.currentTowerStage().name,
   this.currentTowerStage().color,1.7);
  this.notify();return true;
 }
 playSound(id){try{this.sound?.(id)}catch{}}
 chooseShop(choice){
  if(this.mode!=='shop')return false;
  if(choice==='leave'){this.mode='playing';this.shopStock=[];this.notify();return true}
  const id=Number(choice);
  if(!Number.isInteger(id)||id<0||id>=this.shopStock.length)return false;
  const offer=this.shopStock[id];
  if(!offer||offer.sold||this.runCoins<offer.price||this.player.inventory.length>=18)return false;
  this.runCoins-=offer.price;offer.sold=true;
  this.player.inventory.push(offer.item);
  this.progress.itemsFound++;
  if(!this.player.equipment[offer.item.slot])equipItem(this.player,offer.item);
  this.playSound('loot');this.notify();return true;
 }
 chooseEvent(choice){
  if(this.mode!=='event'||!this.activeEvent)return false;
  const p=this.player,room=this.activeEvent,kind=room.eventKind;
  if(kind==='forge'){
   if(choice==='reforge'){this.dropGear(p.x+15,p.y+28,true);this.runCoins+=12}
   else if(choice==='repair'&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+32);
   else return false;
  }else if(kind==='trial'){
   if(choice==='challenge'){
    room.cleared=false;room.visited=true;room.type='combat';
    this.clearCount=Math.max(0,this.clearCount-1);
    this.mode='playing';this.activeEvent=null;this.spawnRoom(room);
    for(const e of this.enemies){e.hp=Math.round(e.hp*1.3);e.maxHp=e.hp;e.damage*=1.15}
    this.notify();return true;
   }
   if(choice!=='leave')return false;
   this.runCoins+=15;
  }else if(kind==='library'){
   if(!/^rune[012]$/.test(choice))return false;
   if(Number(choice.slice(-1))===room.runeAnswer){
    this.libraryKey=true;
    this.dropGear(p.x,p.y+24,true);
    this.createEffect('text',p.x,p.y-60,'RÄTSEL GELÖST · SCHLÜSSEL ERHALTEN','#d8c4fa',1.2);
   }else{
    p.hp=Math.max(1,p.hp-16);
    this.runCoins+=8;
    this.createEffect('text',p.x,p.y-60,'FALSCHE RUNE · -16 LP','#f9ab90',1.2);
   }
  }else if(kind==='camp'){
   if(choice==='rest'&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.38));
   else if(choice==='scout'){
    const adjacent=new Set([room.id,...room.links]);
    for(const id of [...adjacent])for(const to of this.dungeon.rooms[id].links)adjacent.add(to);
    for(const id of adjacent)if(this.dungeon.rooms[id].type!=='secret')this.dungeon.rooms[id].discovered=true;
   }else if(choice==='trade'&&this.runCoins>=35){
    this.runCoins-=35;this.dropGear(p.x,p.y+28,true);
   }else return false;
  }else if(kind==='vault'){
   if(choice==='key'&&this.libraryKey)this.libraryKey=false;
   else if(choice==='gold'&&this.runCoins>=60)this.runCoins-=60;
   else if(choice==='force'&&p.hp>35)p.hp-=25;
   else if(choice==='leave'){this.mode='playing';this.activeEvent=null;this.notify();return true}
   else return false;
   this.dropGear(p.x,p.y+28,true);
   this.dropGear(p.x+48,p.y+20,true);
   this.runCoins+=85;
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
  if(choice==='heal'&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.42));
  else if(choice==='risk'){
   if(p.hp<=25)return false;
   p.hp-=20;this.dropGear(p.x,p.y+22,true);
  }else if(choice==='power')p.damage*=1.12;
  else return false;
  this.mode='playing';this.notify();return true;
 }
 dropGear(x,y,rare=false,bossLoot=false){
  const item=generateItem(this.random,this.clearCount,this.player.kind,rare,bossLoot);
  this.loot.push({x,y,type:'gear',item,picked:false});
  this.createEffect('ring',x,y,'#bfa3ff',.7,31);
  return item;
 }
 start(kind=this.progress.selectedClass,seed=(Date.now()>>>0)){
  if(!CLASSES[kind])kind='warrior';
  this.progress.selectedClass=kind;saveProgress(this.progress);
  this.floorDepth=1;this.runSeed=seed;this.shake=0;this.hitstop=0;this.hazards=[];this.achievementsEarned=[];this.libraryKey=false;
  this.towerRelics=[];this.towerRelicHits=0;this.towerRelicKills=0;this.towerPhoenixUsed=false;this.stageStartedAt=0;this.stageHazardClock=8;this.towerNewRecord=false;
  this.dungeon=generateDungeon(seed,this.tower?{tower:true,biome:this.currentTowerStage().biome,floor:this.floorDepth}:{});this.random=seeded(seed^0xa5b4c382);
  for(const id of this.dungeon.rooms[0].links)if(this.dungeon.rooms[id].type!=='secret')this.dungeon.rooms[id].discovered=true;
  const base=CLASSES[kind],bonus=this.progress.upgrades;
  this.player={x:this.dungeon.start.x,y:this.dungeon.start.y,radius:14,kind,
   maxHp:base.hp+bonus.vitality*12,hp:base.hp+bonus.vitality*12,
   speed:base.speed,damage:base.damage*(1+bonus.strength*.08),attackDelay:base.cooldown,
   reach:base.range,crit:0,leech:0,guard:0,dashTimer:0,dashCooldown:0,
   dashVector:{x:1,y:0},invulnerable:0,abilityCooldown:0,attackCooldown:0,
   direction:{x:1,y:0},upgradeIds:[],hitCount:0,inventory:[],
   moving:false,attackTimer:0,castTimer:0,hurtTimer:0,walkCycle:0,
   comboStep:0,comboTime:0,hunterCharge:0,
   equipment:{weapon:null,armor:null,charm:null,amulet:null,ring1:null,ring2:null},
    statuses:{poison:0,burn:0,stun:0,slow:0,rot:0,mark:0,markSource:null}};
  applyTalents(this.player,this.progress);
  applySpecialization(this.player,specializationUnlocked(this.progress,this.specialization)?this.specialization:'standard');
  applyRunChallenge(this,this.runMode);
  this.mode='playing';this.enemies=[];this.projectiles=[];this.effects=[];this.loot=[];
  this.runCoins=0;this.clearCount=0;this.time=0;this.bossDefeated=false;this.exitPortal=null;this.hitsTaken=0;this.shopStock=[];this.upgradeChoices=[];this.bossMessage='';this.giant=null;this.puddles=[];
  this.runStatistics=newRunStatistics(kind,this.tower?'Turm':this.endless?'Endlos':'Dungeon');
  this.statisticsSaveClock=0;this.ambientClock=9;
  this.alchemyAiming=false;this.alchemyTarget=null;this.queuedAlchemyThrow=null;this.alchemyThrowTarget=null;
  this.servant=kind==='summoner'?{kind:this.servantChoice,x:this.player.x-30,y:this.player.y-30,radius:11,cooldown:0,healClock:0,friendly:true,path:[],pathClock:0,stuckClock:0}:null;
  this.camera.x=this.player.x-this.camera.w/2;this.camera.y=this.player.y-this.camera.h/2;
  this.playSound('start');
  this.notify();
 }
 move(entity,dx,dy,r=entity.radius){
  if(entity!==this.player&&Math.hypot(dx,dy)>.01){entity.moving=true;entity.moveX=dx;entity.moveY=dy}
  const seal=!entity.friendly&&this.enemies.some(e=>e.hp>0);
  if(this.dungeon.canMove(entity.x+dx,entity.y,r,seal))entity.x+=dx;
  if(this.dungeon.canMove(entity.x,entity.y+dy,r,seal))entity.y+=dy;
 }
 regroupCompanion(companion,room){
  if(!companion||!room)return false;
  const p=this.player;
  // Summoned allies warp through a room threshold together. Otherwise the
  // combat door could close behind the player before they cross it.
  for(const [dx,dy] of [[-45,28],[45,28],[0,-52],[-65,-25],[65,-25],[0,0]]){
   const x=p.x+dx,y=p.y+dy;
   if(this.dungeon.roomAt(x,y)?.id!==room.id||
     !this.dungeon.canMove(x,y,companion.radius,false))continue;
   companion.x=x;companion.y=y;companion.path=[];companion.pathClock=0;
   companion.stuckClock=0;companion.friendly=true;
   this.createEffect('burst',x,y,'#a4dbc8',.28,20);
   return true;
  }
  return false;
 }
 entrance(room){
  if(!room||room.visited)return;
  const localX=this.player.x/TILE-room.gx*ROOM_W;
  const localY=this.player.y/TILE-room.gy*ROOM_H;
  if(localX<2.8||localX>ROOM_W-2.8||localY<2.8||localY>ROOM_H-2.8)return;
  room.visited=true;room.discovered=true;
  if(this.servant&&this.dungeon.roomAt(this.servant.x,this.servant.y)?.id!==room.id)
   this.regroupCompanion(this.servant,room);
  if(this.giant&&this.dungeon.roomAt(this.giant.x,this.giant.y)?.id!==room.id)
   this.regroupCompanion(this.giant,room);
  for(const linked of room.links)if(this.dungeon.rooms[linked].type!=='secret')this.dungeon.rooms[linked].discovered=true;
  if(room.type==='start')return;
  if(room.type==='trap'){
   room.cleared=true;this.clearCount++;this.runCoins+=12;
   const spots=[[-100,15],[100,-15],[0,105]];
   for(let i=0;i<spots.length;i++){
    const [dx,dy]=spots[i],x=room.cx+dx,y=room.cy+dy;
    if(!this.dungeon.canMove(x,y,18))continue;
    this.hazards.push({x,y,radius:62,time:1.5+i*.55,maxTime:1.5+i*.55,damage:19+i*4});
   }
   this.createEffect('text',room.cx,room.cy-95,'FALLEN AKTIVIERT · WEICHE AUS!','#f2b47a',1.4);
   this.notify();return;
  }
  if(['library','camp','vault'].includes(room.type)){
   room.cleared=true;this.clearCount++;
   room.eventKind=room.type;this.activeEvent=room;this.mode='event';
   this.playSound('event');this.notify();return;
  }
  if(room.type==='event'){
   room.cleared=true;this.clearCount++;this.activeEvent=room;this.mode='event';
   this.createEffect('ring',room.cx,room.cy,'#9ce6c0',.65,95);
   this.playSound('event');this.notify();return;
  }
  if(room.type==='shrine'){
   room.cleared=true;this.clearCount++;
   this.mode='shrine';this.notify();return;
  }
  if(room.type==='shop'){
   room.cleared=true;this.clearCount++;
   this.shopStock=Array.from({length:3},(_,id)=>{
    const item=generateItem(this.random,this.clearCount,this.player.kind,id===2,false);
    return {id,item,price:35+Math.floor(this.clearCount*7)+(id===2?35:0),sold:false};
   });
   this.mode='shop';this.playSound('shop');this.notify();return;
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
  const plan=this.tower?towerEncounterPlan(this.floorDepth,room.type,this.random()):null;
  const floorProfile=this.tower?towerFloorProfile(this.floorDepth):null;
  const normalPlan=!this.tower&&!boss?normalEncounterPlan(room,this.clearCount,this.random()):null;
  const amount=boss?1:this.tower?Math.min(8,plan.initial+enemyExtraCount(this)):
   Math.min(8,normalPlan.initial+enemyExtraCount(this));
  // An escalating second wave is reserved for later normal combat chambers.
  room.normalPlan=normalPlan;
  room.reinforcements=plan?.reinforcements??normalPlan?.reinforcements??0;
  room.waveTimer=plan?.delay??normalPlan?.delay??0;
  room.waveWarned=false;
  if(this.tower)
   this.stageHazardClock=towerFirstHazard(this.floorDepth)+(boss?1.2:0);
  const variants=room.biome==='fungal'?['mushroom','slime','hexer','assassin','cultist','brute','burrower','chanter']:
   room.biome==='flooded'?['archer','scout','slime','assassin','wraith','hexer','burrower']:
   ['goblin','bulwark','scout','hexer','assassin','sentinel','brute','chanter'];
  const warden=boss&&!this.tower&&this.dungeon.seed%3===2;
  const offsets=[[ -145,-90],[145,90],[140,-90],[-140,90],[0,-100],[0,110],[-150,0],[150,0]];
  const roster=this.tower?this.currentTowerStage().roster:variants;
  const backline=this.tower&&this.floorDepth>=2?
   roster.filter(type=>['archer','scout','hexer','cultist'].includes(type)):[];
  const preferred=room.encounterStyle==='ambush'?'assassin':
   room.encounterStyle==='ranged'?'scout':
   room.encounterStyle==='arcane'?'hexer':
   room.encounterStyle==='fortified'?'bulwark':null;
  for(let i=0;i<amount;i++){
   const type=boss?'boss':!this.tower?
    pickNormalEnemy(normalPlan,i,this.random):
    (i===0?floorProfile.lead:
    i===1&&backline.length?backline[Math.floor(this.random()*backline.length)]:
    i===2&&preferred&&room.type!=='elite'&&roster.includes(preferred)?preferred:
    roster[Math.floor(this.random()*roster.length)]);
   const spec=ENEMY_DATA[type];
   const [ox,oy]=offsets[i%offsets.length];
   // Bosses always materialise at the geometric centre of the boss arena.
   // Ordinary monsters continue to use collision-aware spread-out positions.
   const point=boss?{x:room.cx,y:room.cy}:
    findSpawnPosition(this.dungeon,room,room.cx+ox,room.cy+oy,
     spec.radius,this.player,this.enemies.filter(e=>e.hp>0&&e.homeRoom===room.id));
   const x=point.x,y=point.y;
   const elite=eliteRoom&&i===0;
   const eliteMods=['swift','guardian','arcane','volatile','vampiric'];
   const eliteMod=elite?eliteMods[Math.floor(this.random()*eliteMods.length)]:null;
   // Normal mode gets more complex formations, not disproportionate HP inflation.
   const scale=(1+this.clearCount*(this.tower?.075:.10)+
    Math.max(0,this.floorDepth-1)*(this.tower?.115:.23))*
    (elite?2.25:1)*challengeScale(this);
   const hpScale=eliteMod==='guardian'?1.35:1;
   const speedScale=eliteMod==='swift'?1.3:1;
   const floorBossBonus=boss&&this.tower?(this.floorDepth===TOWER_LENGTH?1.8:.88+this.floorDepth*.09):1;
   this.enemies.push({x,y,homeRoom:room.id,type,radius:boss&&this.tower&&this.floorDepth===TOWER_LENGTH?44:elite?spec.radius*1.3:spec.radius,
    hp:Math.round(spec.hp*scale*hpScale*floorBossBonus),maxHp:Math.round(spec.hp*scale*hpScale*floorBossBonus),
    speed:spec.speed*(boss?1:1+this.clearCount*.025)*(elite?1.18:1)*speedScale*
     (this.tower&&!boss?towerRoomSpeed(this.floorDepth):
      !this.tower&&!boss?1+(normalPlan?.tier||0)*.022:1)*challengeScale(this),
    damage:spec.damage*(elite?1.55:1)*(boss?(this.tower?1.10+this.floorDepth*.085:1.18):
     this.tower?towerRoomDamage(this.floorDepth):1+(normalPlan?.tier||0)*.055)*
     challengeScale(this),elite,eliteMod,eliteShot:2,spawnIndex:i,
    cooldown:boss?(this.tower?BOSS_BALANCE.towerOpening:BOSS_BALANCE.normalOpening):
     this.tower?Math.max(.20,.52-this.floorDepth*.036)+i*.12:
      Math.max(.30,.52-(normalPlan?.tier||0)*.035)+i*.09,
    specialCooldown:this.tower?Math.max(.45,1.5-this.floorDepth*.11)+i*.13:null,
    windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0},
    ...(boss?{boss:this.tower?createTowerBossState(this.floorDepth):warden?createWardenState():createBossState()}: {})});
  }
  if(normalPlan?.tier>=3)this.playSound('danger');
  this.createEffect('text',room.cx,room.cy-110,
   boss?(this.tower?this.currentTowerStage().boss:warden?'DER RUNENWÄCHTER':'DER SCHLEIMKÖNIG'):
   eliteRoom?'ELITEKAMMER':'KAMMER VERSIEGELT','#f8c78f',1.05);
 }
 spawnReinforcements(room){
  const count=room.reinforcements||0;
  if(!count)return;
  room.reinforcements=0;
  const normalPlan=!this.tower?(room.normalPlan||
   normalEncounterPlan(room,this.clearCount,0)):null;
  const roster=this.tower?this.currentTowerStage().roster:null;
  const backline=this.tower?
   roster.filter(type=>['archer','scout','hexer','cultist'].includes(type)):[];
  const offsets=[[-165,115],[165,-115],[-175,-105],[175,105],[-180,0],[180,0]];
  let spawned=0;
  for(let i=0;i<count;i++){
   const type=!this.tower?pickNormalEnemy(normalPlan,i+4,this.random):
    i===0&&backline.length?backline[Math.floor(this.random()*backline.length)]:
    roster[Math.floor(this.random()*roster.length)];
   const spec=ENEMY_DATA[type],offset=offsets[i%offsets.length];
   const point=findSpawnPosition(this.dungeon,room,room.cx+offset[0],room.cy+offset[1],
    spec.radius,this.player,this.enemies.filter(e=>e.hp>0&&e.homeRoom===room.id));
   if(distance(point,this.player)<spec.radius+this.player.radius+72)continue;
   const hp=Math.round(spec.hp*(1+this.clearCount*(this.tower?.075:.10)+
    Math.max(0,this.floorDepth-1)*(this.tower?.115:.23))*challengeScale(this));
   this.enemies.push({x:point.x,y:point.y,homeRoom:room.id,type,radius:spec.radius,
    hp,maxHp:hp,speed:spec.speed*(1+this.clearCount*.025)*
     (this.tower?towerRoomSpeed(this.floorDepth):1+(normalPlan?.tier||0)*.022)*
     challengeScale(this),
    damage:spec.damage*(this.tower?towerRoomDamage(this.floorDepth):
     1+(normalPlan?.tier||0)*.055)*challengeScale(this),elite:false,eliteMod:null,
    eliteShot:2,spawnIndex:8+i,cooldown:.49+i*.13,specialCooldown:.75+i*.2,
    windup:0,phase:0,flash:0,elapsed:0,knock:{x:0,y:0}});
   this.createEffect('ring',point.x,point.y,'#ffb486',.72,43);spawned++;
  }
  if(spawned)this.createEffect('text',room.cx,room.cy-119,'VERSTÄRKUNG!','#ffc29f',.95);
 }
 moveCompanion(c,target,desired,dt,speed=250){
  if(!this.dungeon||!target)return;
  const dungeon=this.dungeon,d=distance(c,target);
  if(d<=desired+7)return;
  let seek=target;
  if(!hasLineOfSight(dungeon,c.x,c.y,target.x,target.y,false)){
   c.pathClock=(c.pathClock||0)-dt;
   const room=dungeon.roomAt(target.x,target.y)?.id;
   if(c.pathClock<=0||c.pathGoal!==room||!c.path?.length){
    c.path=findPath(dungeon,c,target,null,false);c.pathGoal=room;c.pathClock=.3;
   }
   const point=c.path?.find(point=>distance(c,point)>14);
   if(point)seek=point;
  }else{c.pathClock=0;c.path=[];}
  const n=normalized(seek.x-c.x,seek.y-c.y);
  const ox=c.x,oy=c.y,step=Math.min(Math.max(0,d-desired),speed*dt);
  this.move(c,n.x*step,n.y*step,c.radius);
  c.stuckClock=Math.hypot(c.x-ox,c.y-oy)<.7&&d>200?(c.stuckClock||0)+dt:0;
  if(c.stuckClock>1.2&&distance(c,this.player)>240){
   const p=this.player;
   for(const [dx,dy] of [[-45,30],[45,30],[0,-55],[-70,-35],[70,-35],[0,0]]){
    if(!dungeon.canMove(p.x+dx,p.y+dy,c.radius,false))continue;
    c.x=p.x+dx;c.y=p.y+dy;c.path=[];c.pathClock=0;c.stuckClock=0;
    this.createEffect('burst',c.x,c.y,'#9fc8c2',.35,24);break;
   }
  }
 }
 updateServant(dt){
  const s=this.servant,p=this.player;
  if(!p)return;
  const power=hasRunPower(p,'companionForce')?1.3:1;
  if(s){
   s.friendly=true;
   s.cooldown=Math.max(0,s.cooldown-dt);
   s.healClock=Math.max(0,(s.healClock||0)-dt);
   const playerRoom=this.dungeon.roomAt(p.x,p.y);
   const petRoom=this.dungeon.roomAt(s.x,s.y);
   if(playerRoom?.visited&&playerRoom?.id!==petRoom?.id&&
      distance(s,p)>180)this.regroupCompanion(s,playerRoom);
   const far=distance(s,p)>165 ||
    this.dungeon.roomAt(s.x,s.y)?.id!==playerRoom?.id;
   const near=this.enemies.filter(e=>e.hp>0&&distance(e,p)<520)
    .sort((a,b)=>distance(a,s)-distance(b,s))[0];
   const fight=!!near&&!far;
   const goal=fight?near:p,ideal=fight?(s.kind==='bat'?39:s.kind==='imp'?150:120):48;
   this.moveCompanion(s,goal,ideal,dt,s.kind==='bat'?300:255);
   if(s.cooldown<=0&&fight&&hasLineOfSight(this.dungeon,s.x,s.y,near.x,near.y,false)){
    if(s.kind==='bat'&&distance(s,near)<100){
     this.hitEnemy(near,(12+p.damage*.26)*power,
      normalized(near.x-s.x,near.y-s.y),{proc:false});
     this.createEffect('slash',s.x,s.y,'#d6a6ff',.22,43,Math.atan2(near.y-s.y,near.x-s.x));
     if(s.healClock<=0&&!(p.statuses?.rot>0)){
      const heal=hasRunPower(p,'servantAegis')?6:3;
      p.hp=Math.min(p.maxHp,p.hp+heal);s.healClock=2.5;
      this.createEffect('text',p.x,p.y-43,'+'+heal,'#a4f4d9',.48);
     }
     s.cooldown=.7;
    }else if(s.kind==='imp'&&distance(s,near)<390){
     this.spawnProjectile(s.x,s.y,normalized(near.x-s.x,near.y-s.y),
      (8+p.damage*.16)*power,true,false,560);
     const bullet=this.projectiles.at(-1);bullet.summonShot='imp';bullet.radius=5;
     this.createEffect('spark',s.x,s.y,'#ffc384',.20,14);s.cooldown=.48;
    }else if(s.kind==='spirit'&&distance(s,near)<420){
     this.spawnProjectile(s.x,s.y,normalized(near.x-s.x,near.y-s.y),
      (17+p.damage*.23)*power,true,false,430);
     const bullet=this.projectiles.at(-1);bullet.summonShot='spirit';bullet.radius=8;
     this.createEffect('ember',s.x,s.y,'#b4adff',.24,17);s.cooldown=1.05;
    }
   }
  }
  const g=this.giant;if(!g)return;
  g.friendly=true;g.life=Math.max(0,g.life-dt);g.cooldown=Math.max(0,g.cooldown-dt);
  if(g.life<=0){this.createEffect('burst',g.x,g.y,'#f2c69a',.55,70);this.giant=null;return;}
  const target=this.enemies.filter(e=>e.hp>0&&distance(e,p)<620)
   .sort((a,b)=>distance(a,g)-distance(b,g))[0];
  if(target)this.moveCompanion(g,target,65,dt,300);
  if(target&&g.cooldown<=0&&distance(g,target)<122
   &&hasLineOfSight(this.dungeon,g.x,g.y,target.x,target.y,false)){
   this.createEffect('slash',g.x,g.y,'#f9d49d',.35,119,Math.atan2(target.y-g.y,target.x-g.x));
   this.createEffect('ring',target.x,target.y,'#b9adff',.28,67);
   for(const e of [...this.enemies])if(e.hp>0&&distance(e,target)<72+e.radius)
    this.hitEnemy(e,(34+p.damage*.64)*power,normalized(e.x-g.x,e.y-g.y),{proc:false});
   this.shake=Math.max(this.shake,3);g.cooldown=.68;
  }
 }
 update(dt,camera=this.camera){
  if(this.mode!=='playing')return;
  dt=Math.min(.034,Math.max(0,dt));
  this.shake=Math.max(0,this.shake-dt*19);
  if(this.hitstop>0){this.hitstop=Math.max(0,this.hitstop-dt);if(this.enemies.some(e=>e.hp>0))return}
  this.time+=dt;
  if(this.exitPortal){
   this.exitPortal.arming=Math.max(0,this.exitPortal.arming-dt);
   // Re-enter the portal deliberately; standing next to a fallen boss is not enough.
   if(distance(this.player,this.exitPortal)>82)this.exitPortal.ready=true;
   if(this.exitPortal.arming===0&&this.exitPortal.ready&&distance(this.player,this.exitPortal)<36){
    this.exitPortal=null;this.finish(true);return;
   }
  }
  this.progress.statistics.playTime+=dt;
  this.updateServant(dt);
  this.updatePuddles(dt);
  this.tickPlayerStatuses(dt);
  if(this.mode!=='playing')return;
  this.ambientClock-=dt;
  if(this.ambientClock<=0){
   const biome=this.dungeon.roomAt(this.player.x,this.player.y)?.biome;
   this.playSound(biome==='flooded'?'drip':biome==='fungal'?'cavern':'wind');
   this.ambientClock=10+this.random()*7;
  }
  this.statisticsSaveClock+=dt;
  if(this.statisticsSaveClock>=8){this.statisticsSaveClock=0;this.saveStatistics()}
  const p=this.player,move=this.input.movement(),aim=this.input.aiming(p,camera);
  if(Number.isFinite(aim.x)&&Number.isFinite(aim.y))p.direction=aim;
  p.walkCycle=(p.walkCycle||0)+Math.hypot(move.x,move.y)*dt*14;
  p.moving=Math.hypot(move.x,move.y)>.12;
  if(p.moving)p.knightMoveDirection={...move};
  p.attackTimer=Math.max(0,(p.attackTimer||0)-dt);
  p.castTimer=Math.max(0,(p.castTimer||0)-dt);
  p.hurtTimer=Math.max(0,(p.hurtTimer||0)-dt);
  p.comboTime=Math.max(0,(p.comboTime||0)-dt);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);
  p.attackCooldown=Math.max(0,p.attackCooldown-dt);
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  p.counterReady=Math.max(0,(p.counterReady||0)-dt);
  p.evadeEmpower=Math.max(0,(p.evadeEmpower||0)-dt);
  if(this.input.consumeDash()&&p.dashCooldown<=0){
   p.dashVector=Math.hypot(move.x,move.y)>.1?normalized(move.x,move.y):{...p.direction};
   if(p.kind==='warrior')beginKnightAction(p,'dash',.18,p.dashVector);
   p.dashTimer=.18;p.dashCooldown=(p.specialization==='ranger'?.75:1.05)*(hasSet(p,'tempest')?.84:1);p.invulnerable=Math.max(p.invulnerable,.26);
   this.createEffect('burst',p.x,p.y,CLASSES[p.kind].color,.25,20);
   onDash(this);onBuildDash(this);this.playSound('dash');
  }
  if(p.dashTimer>0){
   this.move(p,p.dashVector.x*690*dt,p.dashVector.y*690*dt);
   p.dashTimer=Math.max(0,p.dashTimer-dt);
   if(this.random()<.65)this.createEffect('spark',p.x,p.y,'#c1e9e4',.28,7);
  }else if(!(p.statuses?.stun>0))this.move(p,move.x*p.speed*dt*(p.statuses?.slow>0?.60:1),move.y*p.speed*dt*(p.statuses?.slow>0?.60:1));
  if(p.kind==='warrior')this.updateKnightAction(dt);
  const attacking=this.input.attacking();
  if(p.kind==='hunter'){
   p.hunterCharge=attacking?(p.hunterCharge||0)+dt:0;
   if(attacking&&p.attackCooldown<=0){
    const charged=p.hunterCharge>=.9;
    this.attack(charged);
    if(charged)p.hunterCharge=0;
   }
  }else if(p.kind==='alchemist'){
   // Hold for a live target preview, release to throw exactly once.
   const released=this.input.consumeLobRelease?.()||false;
   if(attacking){
    this.alchemyAiming=true;
    this.alchemyTarget=this.input.lobTarget?.(p,camera,260,this.enemies)||
     this.input.target?.(p,camera,260)||{x:p.x+aim.x*235,y:p.y+aim.y*235};
   }else if(released){
    this.alchemyAiming=false;
    const selected=this.input.lobTarget?.(p,camera,260,this.enemies)||this.alchemyTarget;
    if(selected)this.queuedAlchemyThrow=selected;
    this.input.clearLobAim?.();
   }else if(this.alchemyAiming){
    // Pointer cancellation, window blur and lost focus must not cause a throw.
    this.alchemyAiming=false;this.alchemyTarget=null;
    this.input.clearLobAim?.();
   }
   if(!attacking&&this.queuedAlchemyThrow&&p.attackCooldown<=0){
    this.alchemyThrowTarget=this.queuedAlchemyThrow;
    this.queuedAlchemyThrow=null;this.attack();this.alchemyThrowTarget=null;
   }
  }else if(attacking&&p.attackCooldown<=0&&!(p.kind==='warrior'&&p.hurtTimer>.20))this.attack();
  if(this.input.consumeAbility()&&p.abilityCooldown<=0)this.ability();
  this.entrance(this.dungeon.roomAt(p.x,p.y));
  this.updateEnemies(dt);
  if(this.mode!=='playing')return;
  this.updateProjectiles(dt);
  towerRoomHazard(this,dt);
  this.updateHazards(dt);
  if(this.mode!=='playing')return;
  for(const drop of this.loot)if(!drop.picked&&distance(drop,p)<30){
   drop.picked=true;
   if(drop.type==='coin')this.runCoins+=drop.value;
   else if(drop.type==='heal'&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+drop.value);
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
  if(pending&&pending.reinforcements>0){
   // If the first wave disappears in a few swings, announce new enemies
   // promptly instead of opening the door before the delayed wave arrives.
   const alive=this.enemies.some(e=>e.hp>0&&e.homeRoom===pending.id);
   pending.waveTimer=Math.max(0,(pending.waveTimer||0)-dt);
   if(!alive)pending.waveTimer=Math.min(pending.waveTimer,.72);
   if(!pending.waveWarned&&pending.waveTimer<=.85){
    pending.waveWarned=true;
    this.createEffect('ring',pending.cx,pending.cy,'#ffb486',.82,75);
    this.createEffect('text',pending.cx,pending.cy-91,'VERSTÄRKUNG NAHT','#ffce99',.76);
    this.playSound('danger');
   }
   if(pending.waveTimer<=0)this.spawnReinforcements(pending);
  }
  if(pending&&!pending.reinforcements&&!this.enemies.some(e=>e.hp>0&&e.homeRoom===pending.id)){
   pending.cleared=true;this.clearCount++;
   if(pending.type==='boss'){
    this.bossDefeated=true;
    this.exitPortal={x:pending.cx,y:pending.cy,arming:1.1,ready:false};
    this.createEffect('ring',pending.cx,pending.cy,'#b7a9ff',1.4,85);
    this.createEffect('text',pending.cx,pending.cy-94,'PORTAL GEÖFFNET · WEITER ERKUNDEN ODER EINTRETEN','#d5c3ff',2.2);
    this.playSound('portal');this.notify();return;
   }
   this.createEffect('text',pending.cx,pending.cy-110,'KAMMER GESÄUBERT','#a9f1b4',1.4);
   if(pending.type==='elite')this.dropGear(pending.cx,pending.cy,true);
   else if(this.random()<.28)this.dropGear(pending.cx,pending.cy);
   if(this.clearCount%2===0)this.offerUpgrades();else this.notify();
  }
  // A defeated boss leaves the floor explorable until the portal is entered.
 }
 attack(charged=false){
  const p=this.player;const kind=p.kind,aim=p.direction;
  if(kind==='warrior'&&(p.knightAction||p.hp<=0))return false;
  p.attackCooldown=p.attackDelay*(charged?1.22:1);p.attackTimer=charged?.3:.18;
  this.attackSequence++;if(p.kind!=='warrior')this.playSound('shoot');
  if(kind==='warrior'){
   const blade=p.equipment?.weapon?.baseId;
   if(blade==='greatsword')p.attackCooldown*=1.25;
   else if(blade==='duelist')p.attackCooldown*=.82;
   else if(blade==='axe')p.attackCooldown*=1.10;
   p.comboStep=p.comboTime>0?(p.comboStep%3)+1:1;
   p.comboTime=.85;
   if(p.comboStep===3)p.attackCooldown*=1.26;
   p.attackTimer=p.attackCooldown;
   const action=beginKnightAction(p,'attack'+p.comboStep,p.attackCooldown);
   action.comboStep=p.comboStep;action.blade=blade;
  }else{
   const shotDamage=kind==='hunter'&&charged?p.damage*2.05:p.damage;
    // The rogue uses paired daggers whenever a target is within striking distance.
    if(kind==='hunter'&&p.specialization==='ranger'){
     const close=this.enemies.filter(e=>e.hp>0&&distance(e,p)<94+e.radius&&
       normalized(e.x-p.x,e.y-p.y).x*aim.x+normalized(e.x-p.x,e.y-p.y).y*aim.y>.25);
     if(close.length){
      this.createEffect('slash',p.x,p.y,'#a9e8b8',.26,92,Math.atan2(aim.y,aim.x));
      for(const e of close)this.hitEnemy(e,p.damage*1.45,aim,{melee:true});
      return;
     }
    }
   if(kind==='glasscannon'){
    this.spawnProjectile(p.x+aim.x*32,p.y+aim.y*32,aim,p.damage,false,false,1030);
    const bullet=this.projectiles.at(-1);bullet.rifle=true;bullet.radius=4;
    this.createEffect('spark',p.x+aim.x*42,p.y+aim.y*42,'#efd0ff',.16,20);
    return;
   }
   if(kind==='alchemist'){
    const recipe=['burn','poison','frost'][(this.attackSequence-1)%3];
    this.throwFlask(recipe,p.damage*.93,false);
    return;
   }
   const shotSpeed=kind==='hunter'&&charged?840:null;
   this.spawnProjectile(p.x+aim.x*19,p.y+aim.y*19,aim,
    kind==='summoner'?p.damage*.32:shotDamage,
    ['mage','glasscannon','summoner'].includes(kind),false,shotSpeed);
   this.projectiles[this.projectiles.length-1].magicSplash=kind==='mage';
   if(kind==='hunter'&&p.specialization==='marksman'){
     const bolt=this.projectiles[this.projectiles.length-1];
     bolt.pierce=2;bolt.hitIds=new Set();bolt.charged=true;
     this.createEffect('spark',p.x+aim.x*18,p.y+aim.y*18,'#ffcf93',.18,23);
    }
    if(kind==='hunter'&&charged){
    const arrow=this.projectiles[this.projectiles.length-1];
    arrow.pierce=hasRunPower(p,'trueshot')?4:3;arrow.hitIds=new Set();arrow.charged=true;
    this.createEffect('slash',p.x+aim.x*24,p.y+aim.y*24,'#d4f7a6',.28,70,Math.atan2(aim.y,aim.x));
   }
   if(kind==='hunter'&&!charged&&hasRunPower(p,'multishot')){
    p.volleyCount=(p.volleyCount||0)+1;
    if(p.volleyCount%4===0){
     for(const spread of [-.12,.12]){
      const a=Math.atan2(aim.y,aim.x)+spread;
      this.spawnProjectile(p.x,p.y,{x:Math.cos(a),y:Math.sin(a)},p.damage*.62,false,false);
     }
     this.createEffect('ring',p.x,p.y,'#bceea7',.20,27);
    }
   }
   if(hasAffix(p,'triple'))for(const delta of [-.15,.15]){
    const a=Math.atan2(aim.y,aim.x)+delta;
    this.spawnProjectile(p.x,p.y,{x:Math.cos(a),y:Math.sin(a)},p.damage*.55,kind==='mage',false);
   }
   this.createEffect('spark',p.x+aim.x*22,p.y+aim.y*22,CLASSES[kind].color,charged?.3:.19,charged?25:13);
  }
 }
 updateKnightAction(dt){
  const p=this.player;
  if(p.hp<=0){p.knightAction=null;return;}
  advanceKnightAction(p,dt,action=>{
   if(action.clip==='special')this.resolveKnightSpecial(action);
   else this.resolveKnightStrike(action);
  });
 }
 resolveKnightStrike(action){
  const p=this.player,aim=action.direction,blade=action.blade;
  this.playSound('slash');
   const finisher=action.comboStep===3,reach=p.reach+(finisher?13:0)+(blade==='greatsword'?20:0);
   const angle=Math.atan2(aim.y,aim.x);
   this.effects.push({type:'knight-slash',x:p.x,y:p.y,angle,radius:reach,step:action.comboStep,life:.20,maxLife:.20});
   if(finisher){
    this.createEffect('ring',p.x+aim.x*45,p.y+aim.y*45,'#ffe29d',.35,45);
    this.shake=Math.max(this.shake,4);
   }
   for(const e of this.enemies){
    const delta=normalized(e.x-p.x,e.y-p.y);
    if(e.hp>0&&hasLineOfSight(this.dungeon,p.x,p.y,e.x,e.y)&&distance(e,p)<reach+e.radius&&delta.x*aim.x+delta.y*aim.y>(blade==='axe'?.19:blade==='duelist'?.68:.45))
     this.hitEnemy(e,p.damage*(finisher?1.27:action.comboStep===2?1.04:1)*(blade==='duelist'?.88:blade==='greatsword'?1.12:1),aim,{finisher,melee:true});
   }
   if(finisher&&(hasRunPower(p,'shockwave')||p.masteries?.includes('juggernaut'))){
    const radius=hasRunPower(p,'shockwave')?145:110;
    const bonus=hasRunPower(p,'shockwave')?.45:.30;
    for(const e of [...this.enemies]){
     const delta=normalized(e.x-p.x,e.y-p.y);
     if(e.hp>0&&hasLineOfSight(this.dungeon,p.x,p.y,e.x,e.y)&&distance(e,p)<radius+e.radius&&delta.x*aim.x+delta.y*aim.y>.2)
      this.hitEnemy(e,p.damage*bonus,aim,{proc:false});
    }
    this.createEffect('ring',p.x+aim.x*45,p.y+aim.y*45,'#ffd58d',.30,radius);
   }
 }
 resolveKnightSpecial(action){
  const p=this.player;
  this.playSound('ability');
  this.effects.push({type:'knight-whirl',x:p.x,y:p.y,radius:144,life:.32,maxLife:.32});
  this.shake=Math.max(this.shake,5);
  for(const e of [...this.enemies])if(e.hp>0&&distance(e,p)<145+e.radius&&hasLineOfSight(this.dungeon,p.x,p.y,e.x,e.y))
   this.hitEnemy(e,p.damage*1.9,normalized(e.x-p.x,e.y-p.y),{melee:true,finisher:true});
 }
 ability(){
  const p=this.player,aim=p.direction;
  if(p.kind==='warrior'&&(p.dashTimer>0||p.hp<=0))return false;
  p.abilityCooldown=p.specialization==='cryomancer'?6.5:7;p.castTimer=.36;if(p.kind!=='warrior')this.playSound('ability');
  if(p.kind==='mage'&&p.masteries?.includes('warding')){
   p.shield=Math.max(p.shield||0,13);
   this.createEffect('ring',p.x,p.y,'#a9c7ff',.45,40);
  }
  if(p.kind==='warrior'){
   beginKnightAction(p,'special',.64);p.castTimer=.64;p.attackTimer=0;
   p.attackCooldown=Math.max(p.attackCooldown,.64);
  }else if(p.kind==='glasscannon'){
   const center={x:p.x+aim.x*130,y:p.y+aim.y*130};
   this.createEffect('ring',center.x,center.y,'#eec1ff',.65,150);
   for(const e of [...this.enemies])if(e.hp>0&&distance(e,center)<150+e.radius)
    this.hitEnemy(e,p.damage*2.1,aim,{magic:true});
   p.shield=Math.max(p.shield||0,5);
  }else if(p.kind==='summoner'){
   // A short-lived siege giant complements the permanent summon.
   p.abilityCooldown=14;
   const center={x:p.x+aim.x*56,y:p.y+aim.y*56};
   const valid=this.dungeon.canMove(center.x,center.y,25,false);
   const x=valid?center.x:p.x,y=valid?center.y:p.y;
   this.giant={x,y,kind:'giant',radius:25,friendly:true,life:3.8,maxLife:3.8,cooldown:0};
   if(hasRunPower(p,'servantAegis'))p.shield=Math.min(45,Math.max(0,p.shield||0)+12);
   this.createEffect('ring',x,y,'#e7c3a0',.75,85);
   this.createEffect('text',x,y-70,'RIESENRUF','#f4d4a4',.9);
  }else if(p.kind==='alchemist'){
   const recipe=['burn','poison','frost'][this.attackSequence%3];
   this.throwFlask(recipe,p.damage*1.30,true);
   p.abilityCooldown=10.5;
  }else if(p.kind==='hunter'){
   for(let i=-3;i<=3;i++){
    const angle=Math.atan2(aim.y,aim.x)+i*.14;
    this.spawnProjectile(p.x,p.y,{x:Math.cos(angle),y:Math.sin(angle)},p.damage*1.12,false,false);
   }
  }else{
   const center={x:p.x+aim.x*165,y:p.y+aim.y*165};
   const spellColor=p.specialization==='pyromancer'?'#ff9259':p.specialization==='cryomancer'?'#90e6f5':'#d5a7ff';
    this.createEffect('ring',center.x,center.y,spellColor,.65,133);
   this.createEffect('ember',center.x-27,center.y-13,'#e7abff',.38,24);
   this.createEffect('ember',center.x+39,center.y+17,'#f1ad77',.45,21);
   for(const e of [...this.enemies])if(e.hp>0&&distance(e,center)<133+e.radius)
    {
     this.hitEnemy(e,p.damage*(p.specialization==='pyromancer'?2.45:p.specialization==='cryomancer'?2.20:2.8),aim,{magic:true});
     if(p.specialization==='pyromancer')e.burn=Math.max(e.burn||0,4.6);
     if(p.specialization==='cryomancer')e.slow=Math.max(e.slow||0,3.3);
    }
   if(hasRunPower(p,'arcaneBloom')){
    this.createEffect('ring',center.x,center.y,'#f1a9f6',.72,175);
    for(const e of [...this.enemies])if(e.hp>0&&distance(e,center)>115&&distance(e,center)<190+e.radius)
     this.hitEnemy(e,p.damage*.95,aim,{proc:false});
   }
  }
 }
 throwFlask(recipe,damage,large=false){
  const p=this.player,aim=p.direction,maxRange=large?315:260;
  const target=(!large&&this.alchemyThrowTarget)||this.input.target?.(p,this.camera,maxRange)||
   {x:p.x+aim.x*maxRange,y:p.y+aim.y*maxRange};
  const dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy);
  const range=Math.min(maxRange,Math.max(65,len));
  const dir=len>1?normalized(dx,dy):aim;
  let x=p.x,y=p.y;
  for(let f=range;f>=42;f-=18){
   const tx=p.x+dir.x*f,ty=p.y+dir.y*f;
   if(this.dungeon.canMove(tx,ty,12,false)){x=tx;y=ty;break}
  }
  const flight=.52+range/1200;
  this.projectiles.push({x:p.x,y:p.y,vx:0,vy:0,
   damage,magic:false,hostile:false,life:flight+.2,radius:9,
   alchemy:recipe,flask:true,startX:p.x,startY:p.y,targetX:x,targetY:y,
   flight,flightTotal:flight,arcHeight:0,large});
  this.createEffect('spark',p.x,p.y-15,'#f6e2b8',.18,12);
 }
 detonateFlask(b){
  if(b.exploded)return;
  b.exploded=true;b.life=0;
  const colors={burn:'#ff985a',poison:'#9fe786',frost:'#91d9f5'};
  const color=colors[b.alchemy]||'#d4e5aa';
  const radius=(b.large?137:91)*(hasRunPower(this.player,'catalyst')?1.22:1);
  this.createEffect('ring',b.x,b.y,color,.52,radius);
  this.createEffect('burst',b.x,b.y,color,.48,b.large?57:32);
  this.shake=Math.max(this.shake,b.large?4:2);
  this.puddles.push({x:b.x,y:b.y,kind:b.alchemy,radius,
   life:b.large?4.3:3.3,maxLife:b.large?4.3:3.3,
   damage:b.damage*(b.large?.75:.48),tick:0,large:b.large});
  for(const enemy of [...this.enemies])if(enemy.hp>0&&distance(enemy,b)<radius+enemy.radius){
   this.hitEnemy(enemy,b.damage*(b.large?1.22:1),normalized(enemy.x-b.x,enemy.y-b.y),{proc:false,magic:true});
   if(enemy.hp>0)this.applyAlchemyStatus(enemy,b.alchemy,b.large);
  }
 }
 applyAlchemyStatus(enemy,kind,large=false){
  const duration=hasRunPower(this.player,'longBrew')?1.5:1;
  if(kind==='burn')enemy.burn=Math.max(enemy.burn||0,(large?5:3.5)*duration);
  else if(kind==='poison')enemy.poison=Math.max(enemy.poison||0,(large?5.5:4)*duration);
  else if(kind==='frost')enemy.slow=Math.max(enemy.slow||0,(large?4.5:3.1)*duration);
 }
 updatePuddles(dt){
  for(const puddle of this.puddles){
   puddle.life-=dt;puddle.tick-=dt;
   if(puddle.tick>0||puddle.life<=0)continue;
   puddle.tick=.45;
   for(const enemy of [...this.enemies])if(enemy.hp>0&&distance(enemy,puddle)<puddle.radius+enemy.radius){
    this.hitEnemy(enemy,puddle.damage*.36,normalized(enemy.x-puddle.x,enemy.y-puddle.y),{proc:false,magic:true});
    if(enemy.hp>0)this.applyAlchemyStatus(enemy,puddle.kind,puddle.large);
   }
  }
  this.puddles=this.puddles.filter(p=>p.life>0);
 }
 spawnProjectile(x,y,dir,damage,magic=false,hostile=false,speedOverride=null){
  const speed=speedOverride??(hostile?250:magic?490:690);
  this.projectiles.push({x,y,vx:dir.x*speed,vy:dir.y*speed,damage,magic,hostile,
   life:hostile?3.1:1.2,radius:magic?9:hostile?9:5});
 }
 hitEnemy(e,damage,dir,options={}){
  if(!e||e.hp<=0||isBossInvulnerable(e))return;
  const p=this.player,proc=options.proc!==false;
  const critical=proc&&this.random()<Math.min(1,p.crit+(p.evadeEmpower>0?.17:0));
  let d=proc?beforeHit(this,e,damage):damage;
  if(proc){
   d=towerRelicDamage(this,e,d);d=towerEnemyDamage(e,d,dir);d=encounterMitigation(e,d,dir);
   d*=buildDamageFactor(p,options);
  }
  if(critical)d*=1.7;
  // A short, visible post-attack opening rewards learning the boss pattern.
  if(e.type==='boss'&&e.boss?.exposed>0)d*=1.18;
  if(proc){
   if(options.melee&&p.counterReady>0)p.counterReady=0;
   p.hitCount++;
   if(p.hitCount%4===0&&p.upgradeIds.includes('bolt'))d+=p.damage*.7;
   if(p.evadeEmpower>0)p.evadeEmpower=0;
  }
  d=Math.max(1,Math.round(d));
  if(e.type==='boss')d=cappedBossDamage(e,d);
  const hpBefore=e.hp;
  const threshold=Math.ceil(e.maxHp*PHASE_TWO_AT);
  if(e.type==='boss'&&['tower','sovereign'].includes(e.boss?.variant)){
   applyTowerBossDamage(this,e,d);
  }else if(e.type==='boss'&&e.boss.phase===1&&e.hp-d<=threshold){
   e.hp=threshold;startPhaseTwo(this,e);
  }else e.hp=Math.max(0,e.hp-d);
  recordDamage(this.progress.statistics,this.runStatistics,Math.max(0,hpBefore-e.hp),'dealt');
  e.flash=critical||options.finisher?.23:.20;e.hurtTimer=.22;
  const push=e.type==='boss'?30:options.finisher?280:critical?245:175;
  e.knock={x:dir.x*push,y:dir.y*push};
  if(proc&&p.leech>0&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+d*p.leech);
  if(proc){
   this.hitstop=Math.max(this.hitstop,critical?.075:.035);
   this.shake=Math.max(this.shake,critical?8:e.type==='boss'?5:3);
   this.playSound(critical?'crit':'hit');
  }
  this.createEffect('text',e.x,e.y-29,(critical?'KRIT ':'')+d,critical?'#ffde86':'#fff1bf',critical?.78:.52);
  if(proc){
   const style=impactStyle(p.kind,critical,!!options.finisher);
   this.effects.push({type:'impact',kind:p.kind,critical,finisher:!!options.finisher,
    x:e.x,y:e.y,angle:Math.atan2(dir.y,dir.x),seed:this.attackSequence,
    color:style.core,radius:style.radius,life:style.duration,maxLife:style.duration});
   if(this.effects.length>110)this.effects.shift();
  }
  if(proc&&e.hp>0&&p.kind==='mage'){
    if(p.specialization==='pyromancer')e.burn=Math.max(e.burn||0,4);
    if(p.specialization==='cryomancer')e.slow=Math.max(e.slow||0,2.4);
    if(p.specialization==='standard'&&p.hitCount%3===0){
     const chain=this.enemies.find(n=>n!==e&&n.hp>0&&distance(n,e)<175);
     if(chain){this.createEffect('lightning',e.x,e.y,'#bf9af5',.24,60,Math.atan2(chain.y-e.y,chain.x-e.x));
      this.hitEnemy(chain,Math.max(1,d*.38),dir,{proc:false,magic:true});}
    }
   }
   if(proc&&e.hp>0){afterHit(this,e,d,critical,dir);afterTowerRelicHit(this,e,d);onBuildHit(this,e,{proc,magic:options.magic})}
  if(e.hp<=0)this.killEnemy(e);
 }
 killEnemy(e){
  if(e.deadHandled)return;
  e.deadHandled=true;e.hp=0;
  // Track the actual boss variant, not every non-tower boss as "Schleimkönig".
  const bossName=e.type!=='boss'?undefined:e.boss?.name||
   (e.boss?.variant==='warden'?'DER RUNENWÄCHTER':'DER SCHLEIMKÖNIG');
  recordEnemyKill(this.progress.statistics,this.runStatistics,e.type,bossName);
  if(e.type==='boss'){
   this.dropGear(e.x+38,e.y+18,true,true);
   for(const add of this.enemies)if(add!==e&&add.homeRoom===e.homeRoom)add.hp=0;
   this.projectiles=this.projectiles.filter(p=>!p.hostile);
  }
  const reward=Math.round(ENEMY_DATA[e.type].reward*(e.elite?3:1)*(this.servant?.kind==='imp'?1.3:1));
  this.loot.push({x:e.x,y:e.y,type:'coin',value:reward,picked:false});
  if(e.elite){
   this.progress.eliteKills=(this.progress.eliteKills||0)+1;
   this.dropGear(e.x+25,e.y,true);
  }else if(e.type!=='boss'&&this.random()<(this.tower?.08:.065))this.dropGear(e.x+18,e.y);
  if(this.random()<.19)this.loot.push({x:e.x+14,y:e.y+8,type:'heal',value:18,picked:false});
  if(e.eliteMod==='volatile'){
   this.hazards.push({x:e.x,y:e.y,radius:105,time:.48,maxTime:.48,damage:27});
   this.createEffect('ring',e.x,e.y,'#ff7557',.48,105);
  }
  onKill(this,e);
  if(e.type!=='boss')towerRelicKill(this);
  this.effects.push({type:'death',kind:e.type==='boss'?(e.boss?.variant==='sovereign'?'sovereign':e.boss?.variant==='tower'?'tower'+e.boss.floor:e.boss?.variant==='warden'?'warden':'slimeking'):e.type,
   x:e.x,y:e.y,radius:e.radius,elite:e.elite,phaseTwo:e.boss?.phase===2,
   color:'#d9e5e9',life:.4,maxLife:.4});
  this.createEffect('burst',e.x,e.y,e.elite?'#ffca8c':'#b6f2bf',.56,40);
  this.playSound(e.type==='boss'?'bossDown':'enemyDown');
 }
 inflictStatus(){
  const p=this.player;if(!p?.statuses||this.random()>.42)return;
  const enemy=this.enemies.filter(e=>e.hp>0&&distance(e,p)<375)
   .sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(!enemy)return;
  const byType={mushroom:'poison',cultist:'burn',sentinel:'stun',brute:'slow',
   wraith:'mark',hexer:'rot',scout:'slow',archer:'poison'};
  const kind=byType[enemy.type];if(!kind)return;
  p.statuses[kind]=Math.max(p.statuses[kind]||0,kind==='mark'?6:kind==='stun'?.45:kind==='rot'?4:3.4);
  if(kind==='mark')p.statuses.markSource=enemy;
  const names={poison:'GIFT',burn:'BRENNEN',stun:'BETÄUBT',slow:'VERLANGSAMT',rot:'FÄULNIS',mark:'TODESMARKE'};
  this.createEffect('text',p.x,p.y-64,names[kind],'#eac18a',.9);
 }
 tickPlayerStatuses(dt){
  const p=this.player,fx=p?.statuses;if(!fx)return;
  for(const kind of ['poison','burn','stun','slow','rot','mark'])
   fx[kind]=Math.max(0,(fx[kind]||0)-dt);
  if(fx.markSource?.deadHandled||fx.markSource?.hp<=0){fx.mark=0;fx.markSource=null;}
  fx.damageAccum=(fx.damageAccum||0)+((fx.poison>0?2:0)+(fx.burn>0?4:0))*dt;
  const damage=Math.floor(fx.damageAccum);
  if(damage>0){
   fx.damageAccum-=damage;p.hp=Math.max(0,p.hp-damage);
   recordDamage(this.progress.statistics,this.runStatistics,damage,'taken');
   if(p.hp<=0){this.finish(false);return;}
  }
  if(fx.markSource&&fx.mark<=0){
   fx.markSource=null;
   const impact=Math.ceil(p.maxHp*.34);
   p.hp=Math.max(0,p.hp-impact);
   recordDamage(this.progress.statistics,this.runStatistics,impact,'taken');
   this.createEffect('ring',p.x,p.y,'#c764d5',.7,72);
   if(p.hp<=0)this.finish(false);
  }
 }
 hurt(damage,dir){
  const p=this.player;
  if(p.invulnerable>0)return;
  const reduced=Math.max(1,Math.round(damage*(1-p.guard)));
  const blocked=Math.min(reduced,p.shield||0);
  p.shield=Math.max(0,(p.shield||0)-blocked);
  const actual=reduced-blocked;
  if(actual>0)this.hitsTaken++;
  if(actual>0&&this.runMode==='nohit')p.hp=0;
  if(actual>0)this.inflictStatus();
  if(actual>0&&p.kind==='glasscannon'){
   p.maxHp=Math.max(20,p.maxHp-7);p.hp=Math.min(p.hp,p.maxHp);
   p.damage*=1.08;
   this.createEffect('ring',p.x,p.y,'#e7abff',.33,51);
  }
  recordDamage(this.progress.statistics,this.runStatistics,actual,'taken');
  p.hp=Math.max(0,p.hp-actual);
  p.invulnerable=.78;p.hurtTimer=.34;
  if(actual>0&&p.kind==='warrior'&&p.knightAction?.clip!=='special'){
   p.knightAction=null;p.attackTimer=0;
  }
  this.shake=Math.max(this.shake,actual?11:4);
  this.hitstop=Math.max(this.hitstop,actual?.07:.04);
  this.createEffect('text',p.x,p.y-32,actual?'-'+actual:'BLOCK','#ff9a91',.75);
  this.createEffect('burst',p.x,p.y,'#ff8397',.4,24);
  this.createEffect('ring',p.x,p.y,'#ffb6aa',.26,34);
  if(actual>0){onHurt(this,actual);onBuildHurt(this,actual);}
  this.playSound(actual?'hurt':'block');
  // No-hit is absolute: a resurrection relic cannot undo an actual hit.
  if(p.hp<=0&&(this.runMode==='nohit'||!towerRelicSave(this)))this.finish(false);
 }
 updateHazards(dt){
  for(const h of this.hazards){
   h.time-=dt;
   if(h.time<=0&&!h.done){
    h.done=true;
    this.createEffect('ring',h.x,h.y,h.color||'#f9b184',.65,h.radius);
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
   const hpBeforeStatus=e.hp;
   statusTick(this,e,dt);
   recordDamage(this.progress.statistics,this.runStatistics,Math.max(0,hpBeforeStatus-e.hp),'dealt');
   if(e.hp<=0)continue;
   if(e.type==='boss'&&e.boss){updateBoss(this,e,dt);if(this.mode!=='playing')return;continue}
   e.elapsed+=dt;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;
   e.guardTime=Math.max(0,(e.guardTime||0)-dt);
    e.speedBuff=Math.max(0,(e.speedBuff||0)-dt);
   if(updateEncounterEnemy(this,e,dt))continue;
   if(updateTowerEnemy(this,e,dt))continue;
   if(e.elite){
    e.eliteShot-=dt;
    if(e.eliteShot<=0&&distance(e,p)<375&&hasLineOfSight(this.dungeon,e.x,e.y,p.x,p.y,true)){
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
     if(e.attackType==='melee'){
      // The enemy deliberately stops just outside physical collision distance.
      // A short, visible swing must still connect with a stationary player.
      const reach=e.radius+p.radius+18;
      if(meleeArcContains(e,p,e.lockedAim,reach)&&hasLineOfSight(this.dungeon,e.x,e.y,p.x,p.y,true)){
       const before=p.hp;
       this.hurt(e.damage,normalized(p.x-e.x,p.y-e.y));
       if(e.eliteMod==='vampiric'&&p.hp<before)e.hp=Math.min(e.maxHp,e.hp+8);
      }
      e.attackTimer=.24;
      e.attackType=null;
      e.cooldown=e.elite?1.0:this.tower?towerEnemyRecovery(this.floorDepth):1.15;
     }else if(e.type==='boss'){
      for(let i=-2;i<=2;i++){
       const a=Math.atan2(dir.y,dir.x)+i*.18;
       this.spawnProjectile(e.x,e.y,{x:Math.cos(a),y:Math.sin(a)},e.damage,false,true);
      }
      this.createEffect('ring',e.x,e.y,'#ff789e',.55,95);
     }else if(e.type==='archer'||e.type==='cultist'||rangedEncounterType(e.type)){
      if(hasLineOfSight(this.dungeon,e.x,e.y,p.x,p.y,true)){
       this.spawnProjectile(e.x,e.y,e.lockedAim||dir,e.damage,false,true);e.attackTimer=.24;
      }
     }
     e.lockedAim=null;e.windupMax=0;
     e.cooldown=e.type==='boss'?2.3:this.tower?towerEnemyRecovery(this.floorDepth,true):1.75;
    }
   }else{
    const ranged=['archer','cultist'].includes(e.type)||rangedEncounterType(e.type);
    let steering=enemySteering(this,e,p,dt,ranged);
    if(!ranged)steering=flankVector(this,e,p,steering,dt);
    const separated=separateEnemies(this,e,steering);
    const reposition=ranged?(!steering.clear||dist<165||dist>300||e.elapsed%2.8<1.35):
     dist>e.radius+p.radius+8;
    if(reposition){
     const amount=e.speed*dt*(e.speedBuff>0?1.28:1);
     const speedFactor=e.slow>0?.58:1;
     const nx=separated.x*amount*speedFactor+e.knock.x*dt,
      ny=separated.y*amount*speedFactor+e.knock.y*dt;
     // Enemies do not cross walls or sealed doors.
     this.move(e,nx,ny);
    }
    if(e.cooldown<=0){
     if(ranged&&dist<500&&steering.clear){
      e.windup=e.type==='boss'?.8:this.tower?towerEnemyWindup(this.floorDepth):.58;
      e.windupMax=e.windup;lockEnemyAim(e,p);e.cooldown=99;
      this.createEffect('ring',e.x,e.y,e.type==='boss'?'#ff6f83':'#ecc5ff',e.windup,37);
     }else if(!ranged&&
      dist<=e.radius+p.radius+18&&
      hasLineOfSight(this.dungeon,e.x,e.y,p.x,p.y,true)){
      // Attack windup is independent of movement or player input.
      // Previously enemies stopped at +8px, but contact damage required +3px:
      // standing still made them wait forever without attacking.
      e.attackType='melee';e.windup=this.tower?Math.max(.26,.30-(this.floorDepth-1)*.004):.3;
      e.windupMax=e.windup;lockEnemyAim(e,p);e.castTimer=e.windup;e.cooldown=99;
      this.createEffect('ring',e.x,e.y,'#ffb887',.32,e.radius+17);
     }
    }
   }
   e.knock.x*=Math.pow(.025,dt);e.knock.y*=Math.pow(.025,dt);
  }
  this.enemies=this.enemies.filter(e=>e.hp>0);
 }
 updateProjectiles(dt){
  const p=this.player;
  for(const b of this.projectiles){
   if(b.flask){
    b.flight=Math.max(0,b.flight-dt);
    const progress=1-b.flight/b.flightTotal;
    b.x=b.startX+(b.targetX-b.startX)*progress;
    b.y=b.startY+(b.targetY-b.startY)*progress;
    b.arcHeight=Math.sin(Math.PI*progress)*(b.large?77:55);
    if(b.flight<=0)this.detonateFlask(b);
    continue;
   }
   b.life-=dt;if(b.life<=0)continue;
   b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.magic&&!b.hostile){
    b.trailClock=(b.trailClock||0)-dt;
    if(b.trailClock<=0){
     this.createEffect('ember',b.x-b.vx*.025,b.y-b.vy*.025,'#efad7c',.26,10);
     b.trailClock=.078;
    }
   }
   if(this.dungeon.isBlocked(b.x,b.y,this.enemies.length>0)){
    if(b.magic&&!b.hostile)this.createEffect('burst',b.x,b.y,'#e4b5ff',.28,22);
    b.life=0;continue;
   }
   if(b.hostile){
    if(distance(b,p)<b.radius+p.radius){this.hurt(b.damage,normalized(b.vx,b.vy));b.life=0}
   }else{
    for(const e of this.enemies)if(e.hp>0&&!b.hitIds?.has(e)&&distance(b,e)<b.radius+e.radius){
     this.hitEnemy(e,b.damage,normalized(b.vx,b.vy),{magic:b.magic,charged:b.charged});
      if(b.alchemy){
       this.createEffect('ring',e.x,e.y,b.alchemy==='burn'?'#ff9a61':b.alchemy==='poison'?'#a0e688':'#9fddff',.36,86);
       for(const other of [...this.enemies])if(other.hp>0&&distance(other,e)<85){
        if(other!==e)this.hitEnemy(other,b.damage*.55,normalized(b.vx,b.vy),{proc:false});
        if(b.alchemy==='burn')other.burn=Math.max(other.burn||0,3.4);
        else if(b.alchemy==='poison')other.poison=Math.max(other.poison||0,4);
        else other.slow=Math.max(other.slow||0,2.7);
       }
      }
     if(b.magic&&!b.hostile){
      this.createEffect('ring',e.x,e.y,'#eac8ff',.24,31);
      this.createEffect('ember',e.x+12,e.y-14,'#ffc18f',.30,13);
     }
     if(p.specialization==='pyromancer'&&b.magic&&e.hp>0)e.burn=Math.max(e.burn||0,2.5);
     if(b.pierce>1){b.pierce--;b.hitIds.add(e);
      this.createEffect('burst',e.x,e.y,'#c5f19f',.24,16);
     }else b.life=0;
     if(b.magicSplash)for(const n of this.enemies)if(n!==e&&n.hp>0&&distance(n,e)<65)this.hitEnemy(n,b.damage*.48,normalized(n.x-e.x,n.y-e.y));
     break;
    }
   }
  }
  this.projectiles=this.projectiles.filter(b=>b.life>0);
 }
 offerUpgrades(){
  this.upgradeChoices=chooseUpgrades(this.random,3);
  const classOptions=pickRunUpgrades(this.random,this.player.kind,this.player.upgradeIds);
  if(classOptions.length)this.upgradeChoices[0]=classOptions[0];
  this.mode='upgrade';this.notify();
 }
 selectUpgrade(id){
  if(this.mode!=='upgrade'||!this.upgradeChoices.some(u=>u.id===id))return;
  const p=this.player;p.upgradeIds.push(id);
  switch(id){
   case 'power':p.damage*=p.upgradeIds.filter(x=>x==='power').length<=3?1.12:1.05;break;
   case 'fury':p.attackDelay=Math.max(CLASSES[p.kind].cooldown*.58,p.attackDelay*.92);break;
   case 'stride':p.speed*=1.12;break;case 'heart':p.maxHp+=30;if(!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+35);break;
   case 'guard':p.guard=Math.min(.65,p.guard+.1);break;
   case 'reach':p.reach*=1.2;break;
   case 'leech':p.leech+=.06;break;
   case 'crit':p.crit=Math.min(.8,p.crit+.12);break;
   case 'bolt':break;
   case 'shockwave':case 'fortress':case 'trueshot':case 'multishot':
   case 'wildfire':case 'arcaneBloom':break;
  }
  this.mode='playing';this.upgradeChoices=[];this.notify();
 }
 createEffect(type,x,y,color,life,radius=20,angle=0){
  const effect=type==='text'?{type,x,y,text:String(color),color:life,life:radius,maxLife:radius,radius:20,angle:0}:{type,x,y,color,life,maxLife:life,radius,angle};
  this.effects.push(effect);if(this.effects.length>110)this.effects.shift();
 }
 advanceFloor(){
  if(!this.tower)this.progress.bossKills++;
  this.floorDepth++;
  this.progress.deepestFloor=Math.max(this.progress.deepestFloor||1,this.floorDepth);
  this.progress.bestRooms=Math.max(this.progress.bestRooms,this.clearCount);
  const seed=this.tower?towerFloorSeed(this.runSeed,this.floorDepth):
   (this.dungeon.seed^(this.floorDepth*0x9e3779b9))>>>0;
  this.dungeon=generateDungeon(seed,this.tower?{tower:true,biome:this.currentTowerStage().biome,floor:this.floorDepth}:{});
  for(const id of this.dungeon.rooms[0].links)if(this.dungeon.rooms[id].type!=='secret')
   this.dungeon.rooms[id].discovered=true;
  this.player.x=this.dungeon.start.x;this.player.y=this.dungeon.start.y;
  if(this.servant){this.servant.x=this.player.x-35;this.servant.y=this.player.y-25;
    this.servant.path=[];this.servant.pathClock=0;this.servant.stuckClock=0;}
  if(!(this.player.statuses?.rot>0))this.player.hp=Math.min(this.player.maxHp,this.player.hp+Math.round(this.player.maxHp*(this.tower?.15:.32)));
  this.player.invulnerable=1.5;this.player.dashCooldown=0;
  this.enemies=[];this.projectiles=[];this.loot=[];this.hazards=[];this.effects=[];this.libraryKey=false;
  this.clearCount=0;this.bossDefeated=false;this.exitPortal=null;this.hitstop=0;this.mode='playing';
  this.giant=null;this.puddles=[];
  this.stageStartedAt=this.time;this.stageHazardClock=8;towerRelicFloor(this);
  this.camera.x=this.player.x-this.camera.w/2;this.camera.y=this.player.y-this.camera.h/2;
  this.createEffect('text',this.player.x,this.player.y-70,'ETAGE '+this.floorDepth,
   this.tower?this.currentTowerStage().color:'#b5dfc7',1.5);
  saveProgress(this.progress);this.notify();
 }
 finish(won){
  if(this.mode!=='playing')return;
  if(won&&this.tower){
   const duration=Math.max(1,Math.ceil(this.time-this.stageStartedAt));
   this.progress.towerStageRecords??={};
   const record=this.progress.towerStageRecords[this.floorDepth];
   if(!record||duration<record)this.progress.towerStageRecords[this.floorDepth]=duration;
   this.runCoins+=towerWinReward(this.floorDepth);
   this.progress.towerBest=Math.max(this.progress.towerBest||0,this.floorDepth);
   this.progress.bossKills++;
   if(this.floorDepth<TOWER_LENGTH){
    this.achievementsEarned=[];
    this.mode='stageclear';
    saveProgress(this.progress);this.notify();return;
   }
   this.progress.towerWins=(this.progress.towerWins||0)+1;
   const oldBest=this.progress.towerBestTime||0;
   this.towerNewRecord=!oldBest||this.time<oldBest;
   if(this.towerNewRecord)this.progress.towerBestTime=Math.ceil(this.time);
   this.progress.towerLastTime=Math.ceil(this.time);
   for(let i=0;i<34;i++){
    const a=i*Math.PI*2/34,r=55+(i%8)*23;
    this.createEffect('spark',this.player.x+Math.cos(a)*r,this.player.y+Math.sin(a)*r,
      i%2?'#ffe3a0':'#d3b0ff',2.2,8);
   }
   this.playSound('bossDown');
  }else if(won&&this.endless){this.advanceFloor();return}
  if(!won&&this.player.kind==='warrior'){
   this.player.knightAction=null;this.player.knightDeathElapsed=0;
   this.player.knightDeathDirection={...this.player.direction};
  }
  this.mode=won?'victory':'dead';
  this.progress.runs++;
  if(won&&this.runMode==='nohit'&&this.hitsTaken===0)this.progress.noHitWins=(this.progress.noHitWins||0)+1;
  finishRunStatistics(this.progress.statistics,this.runStatistics,won,this.time,this.floorDepth,this.clearCount);
  this.runStatistics=null;
  if(won&&!this.tower)this.progress.bossKills++;
  if(this.tower)this.progress.towerBest=Math.max(this.progress.towerBest||0,won?TOWER_LENGTH:this.floorDepth-1);
  this.progress.deepestFloor=Math.max(this.progress.deepestFloor||1,this.floorDepth);
  const reward=this.tower&&won?550:won?120:0;
  const earned=challengeReward(won?this.runCoins+reward:Math.floor(this.runCoins*.65),this.runMode);
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
   totalRooms:this.dungeon.rooms.length,
   floor:this.floorDepth,challenge:this.runMode,endless:this.endless,tower:this.tower,stageName:this.tower?this.currentTowerStage().name:null,
   relics:this.towerRelics.length,bestTime:this.progress.towerBestTime||0,shield:this.player.shield||0,
   rooms:this.clearCount,remaining:this.dungeon.rooms.length-1-this.clearCount,coins:this.runCoins,ability:this.player.abilityCooldown,
   dash:this.player.dashCooldown,time:this.time,seed:this.dungeon.seed,
   boss:(()=>{const e=this.getActiveBoss();return e?{name:e.boss.name|| (e.boss.variant==='warden'?'DER RUNENWÄCHTER':'DER SCHLEIMKÖNIG'),
    hp:Math.ceil(e.hp),maxHp:e.maxHp,phase:e.boss.phase,
    transitioning:e.boss.transition>0,attack:e.boss.telegraph?.type|| (e.boss.charge?'charge':null)}:null})()};
 }
}
