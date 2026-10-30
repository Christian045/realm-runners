import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress,normalizeProgress,saveProgress,loadProgress} from '../src/progression.js';
import {ITEM_BASES,TALENTS,buyTalent,applyTalents,generateItem,equipItem,talentCost} from '../src/loot.js';
import {ITEM_SETS,RUN_POWERS,rollSet,hasSet,setPieces,hasRunPower,buildDamageFactor} from '../src/buildcraft.js';
import {CLASSES} from '../src/data.js';
const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
const makeGame=(kind='warrior',progress=defaultProgress())=>{const g=new Game(progress,input);g.start(kind,721);return g;};
const dummy=(g,hp=1000)=>({type:'mushroom',x:g.player.x+40,y:g.player.y,hp,maxHp:hp,radius:19,flash:0,knock:{x:0,y:0},homeRoom:0,damage:10});
const piece=(id,slot,setId,kind='warrior')=>({id,slot,setId,rarity:'epic',classes:null,stats:{damage:0,hp:0,speed:0,guard:0,crit:0,leech:0},kind});
test('v0.16 new item bases expand all three classes and keep class restrictions',()=>{
 for(const kind of ['warrior','hunter','mage']){
  assert.ok(ITEM_BASES.filter(x=>x.slot==='weapon'&&x.classes?.includes(kind)).length>=4);
 }
 assert.ok(ITEM_BASES.filter(x=>x.slot==='armor').length>=6);
 assert.ok(ITEM_BASES.filter(x=>x.slot==='charm').length>=6);
 const item=generateItem(()=>.30,4,'mage',true);
 assert.ok(item&&item.classes?.includes('mage')||item.slot!=='weapon');
});
test('set roll respects rarity and emits a valid two-piece synergy',()=>{
 assert.equal(rollSet(()=>0,'common'),null);
 assert.equal(rollSet(()=>.99,'rare'),null);
 assert.equal(rollSet(()=>0,'legendary'),'ember');
 assert.ok(Object.keys(ITEM_SETS).length>=3);
 const player={kind:'warrior',damage:20,hp:100,maxHp:100,speed:210,crit:0,guard:0,leech:0,
  inventory:[],equipment:{weapon:null,armor:null,charm:null}};
 const a=piece('a','weapon','ember'),b=piece('b','armor','ember'),c=piece('c','armor','bastion');
 player.inventory.push(a,b,c);
 assert.ok(equipItem(player,a));
 assert.ok(!hasSet(player,'ember'));
 assert.ok(equipItem(player,b));
 assert.equal(setPieces(player,'ember'),2);
 assert.ok(hasSet(player,'ember'));
 assert.ok(equipItem(player,c));
 assert.ok(!hasSet(player,'ember'),'swapping an equipped piece must instantly remove set bonus');
});
test('all classes receive two permanent branch masteries with correct prerequisites and save migration',()=>{
 const p=defaultProgress();p.gold=2500;
 for(const kind of ['warrior','hunter','mage']){
  const defs=TALENTS[kind];
  const branches=defs.filter(x=>x.branch);
  assert.equal(branches.length,2);
  assert.ok(!buyTalent(p,kind,branches[0].id),'locked branch must not spend gold');
  assert.ok(buyTalent(p,kind,branches[0].requires));
  assert.ok(buyTalent(p,kind,branches[0].requires));
  const before=p.gold;
  assert.ok(buyTalent(p,kind,branches[0].id));
  assert.equal(before-p.gold,talentCost(0,branches[0]));
  assert.ok(!buyTalent(p,kind,branches[0].id),'one-time branch cannot be stacked');
 }
 const store=new Map(),storage={getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)};
 assert.ok(saveProgress(p,storage));
 const copy=loadProgress(storage);
 assert.equal(copy.talents.warrior.counter,1);
 assert.equal(copy.talents.hunter.sharpEye,1);
 assert.equal(copy.talents.mage.ignite,1);
 const legacy=normalizeProgress({gold:123,runs:3,upgrades:{strength:3,vitality:2},
  talents:{warrior:{steel:3,ferocity:2}}});
 assert.equal(legacy.gold,123);
 assert.equal(legacy.talents.warrior.steel,3);
 assert.equal(legacy.talents.warrior.counter,0);
 assert.equal(legacy.upgrades.strength,3);
});
test('mastery powers are applied once at run start and never alter the old base stats',()=>{
 const p=defaultProgress();
 p.talents.mage.arcana=2;p.talents.mage.ignite=1;p.talents.mage.ward=2;p.talents.mage.warding=1;
 const g=makeGame('mage',p);
 assert.deepEqual(g.player.masteries,['ignite','warding']);
 const before=g.player.damage;
 g.ability();
 assert.ok(g.player.shield>=13);
 assert.equal(g.player.damage,before);
 g.mode='playing';
 const e=dummy(g);
 g.enemies=[e];g.player.direction={x:1,y:0};
 g.attack();
 for(let frame=0;frame<20;frame++)g.updateProjectiles(.016);
 assert.ok(e.burn>=2.3,'magic impact from mastery should cause status effect');
});
test('warrior counter mastery consumes its bonus exactly once',()=>{
 const p=defaultProgress();p.talents.warrior.steel=2;p.talents.warrior.counter=1;
 const g=makeGame('warrior',p);
 const e=dummy(g);g.enemies=[e];g.player.crit=0;
 const baseline=e.hp;g.attack();g.updateKnightAction(1);const normal=baseline-e.hp;
 g.player.invulnerable=0;g.hurt(5,{x:1,y:0});
 assert.ok(g.player.counterReady>0);
 const before=e.hp;g.attack();g.updateKnightAction(1);
 assert.ok(before-e.hp>normal*1.2);
 assert.equal(g.player.counterReady,0);
});
test('run upgrades are class-specific, selectable, and not offered again after purchase',()=>{
 for(const kind of ['warrior','hunter','mage']){
  const g=makeGame(kind);
  g.offerUpgrades();
  const first=g.upgradeChoices[0];
  assert.ok(RUN_POWERS[kind].some(x=>x.id===first.id));
  g.selectUpgrade(first.id);
  assert.ok(hasRunPower(g.player,first.id));
  g.offerUpgrades();
  assert.notEqual(g.upgradeChoices[0].id,first.id);
  assert.ok(RUN_POWERS[kind].some(x=>x.id===g.upgradeChoices[0].id));
 }
});
test('two-piece bastion plus class run power creates shield on dash without healing HP',()=>{
 const g=makeGame('warrior'),p=g.player;
 p.inventory.push(piece('w','weapon','bastion'),piece('a','armor','bastion'));
 equipItem(p,p.inventory[0]);equipItem(p,p.inventory[1]);
 p.upgradeIds.push('fortress');
 const hp=p.hp;
 // Call update through real input to exercise touch-compatible dash action.
 const original=input.consumeDash;input.consumeDash=()=>true;
 try{g.update(1/60)}finally{input.consumeDash=original}
 assert.ok(p.shield>=20);
 assert.equal(p.hp,hp);
 assert.ok(p.dashCooldown>0);
});
test('tempest set rewards fourth hit without recursive proc chains',()=>{
 const p={equipment:{weapon:{setId:'tempest'},armor:{setId:'tempest'},charm:null},hitCount:3,kind:'warrior'};
 assert.equal(buildDamageFactor(p,{melee:true}),1.25);
 p.hitCount=4;assert.equal(buildDamageFactor(p,{melee:true}),1);
});
test('hunter charged arrow benefits from permanent mastery and run power, retaining pierce',()=>{
 const p=defaultProgress();p.talents.hunter.focus=2;p.talents.hunter.sharpEye=1;
 const g=makeGame('hunter',p);
 g.player.upgradeIds.push('trueshot');
 g.player.direction={x:1,y:0};g.attack(true);
 const arrow=g.projectiles.find(x=>x.charged);
 assert.ok(arrow&&arrow.pierce===4);
 assert.ok(buildDamageFactor(g.player,{charged:true})>1.5);
});
test('mage wildfire build burns, and class-specific gameplay upgrades remain bounded',()=>{
 const g=makeGame('mage');
 g.player.upgradeIds.push('wildfire','arcaneBloom');
 const target=dummy(g,900);g.enemies=[target];g.player.direction={x:1,y:0};
 g.attack();for(let i=0;i<20;i++)g.updateProjectiles(.016);
 assert.ok(target.burn>3);
 g.ability();
 assert.ok(g.effects.some(e=>e.type==='ring'&&e.radius===175));
});
