import { CLASSES, clamp } from './data.js';
import {AFFIXES,rollAffix} from './affixes.js';
import {ITEM_SETS,rollSet,setPieces} from './buildcraft.js?v=0.16.0';
export const RARITIES=Object.freeze({
 common:{name:'Gewöhnlich',color:'#d8e1d4',weight:60},
 rare:{name:'Selten',color:'#8ed0ff',weight:29},
 epic:{name:'Episch',color:'#d2a0ff',weight:10},
 legendary:{name:'Legendär',color:'#f8cb78',weight:1},
 mythic:{name:'Mythisch',color:'#ff94dd',weight:0}
});
export const ITEM_BASES=Object.freeze([
 {id:'sword',name:'Runenklinge',slot:'weapon',classes:['warrior'],damage:5,crit:.03},
 {id:'axe',name:'Waldspalter',slot:'weapon',classes:['warrior'],damage:7,speed:-3},
 {id:'bow',name:'Jagd-Bogen',slot:'weapon',classes:['hunter'],damage:4,crit:.05},
 {id:'crossbow',name:'Arbalest',slot:'weapon',classes:['hunter'],damage:8,speed:-4},
 {id:'staff',name:'Arkankern',slot:'weapon',classes:['mage'],damage:6,crit:.03},
 {id:'orb',name:'Mondstab',slot:'weapon',classes:['mage'],damage:4,leech:.02},
 {id:'coat',name:'Schattenmantel',slot:'armor',classes:null,hp:18,guard:.025},
 {id:'mail',name:'Runenpanzer',slot:'armor',classes:null,hp:28,speed:-5,guard:.035},
 {id:'boots',name:'Windläufer',slot:'armor',classes:null,hp:10,speed:17},
 {id:'fang',name:'Vampirzahn',slot:'charm',classes:null,leech:.035,damage:2},
 {id:'eye',name:'Adlerauge',slot:'charm',classes:null,crit:.09},
 {id:'seal',name:'Wächtersiegel',slot:'charm',classes:null,guard:.045,hp:12},
 {id:'greatsword',name:'Sturmbrecher',slot:'weapon',classes:['warrior'],damage:11,speed:-9},
 {id:'duelist',name:'Duellklinge',slot:'weapon',classes:['warrior'],damage:4,crit:.09},
 {id:'longbow',name:'Eibenbogen',slot:'weapon',classes:['hunter'],damage:6,speed:8},
 {id:'thornbow',name:'Dornenschnur',slot:'weapon',classes:['hunter'],damage:5,leech:.02},
 {id:'grimoire',name:'Sternenfibel',slot:'weapon',classes:['mage'],damage:9,speed:-8},
 {id:'flamestaff',name:'Flammenzepter',slot:'weapon',classes:['mage'],damage:5,crit:.06},
 {id:'brigandine',name:'Plattenwams',slot:'armor',classes:null,hp:32,guard:.045,speed:-9},
 {id:'silk',name:'Nebelgewand',slot:'armor',classes:null,hp:8,crit:.06,speed:10},
 {id:'gloves',name:'Kampfhandschuhe',slot:'armor',classes:null,damage:4,hp:9},
 {id:'hourglass',name:'Sanduhr',slot:'charm',classes:null,speed:15,crit:.03},
 {id:'cinder',name:'Glutfunke',slot:'charm',classes:null,damage:5,leech:.014},
 {id:'ironheart',name:'Eisenherz',slot:'charm',classes:null,guard:.06,hp:16},
 {id:'amuletMoon',name:'Mondamulett',slot:'amulet',classes:null,leech:.012,hp:9},
 {id:'amuletSun',name:'Sonnenamulett',slot:'amulet',classes:null,damage:2,guard:.015},
 {id:'ringFlint',name:'Funkenring',slot:'ring1',classes:null,damage:2,crit:.012},
 {id:'ringMist',name:'Nebelring',slot:'ring1',classes:null,speed:5,hp:6},
 {id:'ringOak',name:'Eichenring',slot:'ring2',classes:null,hp:9,guard:.018},
 {id:'ringDawn',name:'Morgenring',slot:'ring2',classes:null,leech:.009,damage:2},
 {id:'glassShard',name:'Splitterstab',slot:'weapon',classes:['glasscannon'],damage:9,crit:.035},
 {id:'glassFocus',name:'Kristallfokus',slot:'weapon',classes:['glasscannon'],damage:11,speed:-8},
 {id:'summonTome',name:'Dienerbuch',slot:'weapon',classes:['summoner'],damage:4,hp:12},
 {id:'summonBell',name:'Geisterglocke',slot:'weapon',classes:['summoner'],damage:6,crit:.03},
 {id:'alchemyFlask',name:'Säurekolben',slot:'weapon',classes:['alchemist'],damage:7},
 {id:'alchemyKit',name:'Destillierapparat',slot:'weapon',classes:['alchemist'],damage:5,speed:8}
]);
export const TALENTS=Object.freeze({
 warrior:[{id:'steel',name:'Eisenhaut',description:'+8 maximale LP pro Stufe',stat:'hp',value:8},
  {id:'ferocity',name:'Zorn',description:'+3 Angriffsschaden pro Stufe',stat:'damage',value:3},
  {id:'footwork',name:'Kampftritt',description:'+5 Tempo pro Stufe',stat:'speed',value:5},
  {id:'counter',name:'Vergeltung',description:'Nach Schaden: nächster Schwerthieb +35 % (5 s)',branch:true,requires:'steel',requiredLevel:2},
  {id:'juggernaut',name:'Beben',description:'Jeder dritte Schwerthieb löst einen Nachschlag aus',branch:true,requires:'ferocity',requiredLevel:2}],
 hunter:[{id:'focus',name:'Präzision',description:'+3% Krit-Chance pro Stufe',stat:'crit',value:.03},
  {id:'agility',name:'Beweglichkeit',description:'+7 Tempo pro Stufe',stat:'speed',value:7},
  {id:'piercing',name:'Spitzenpfeile',description:'+2 Schaden pro Stufe',stat:'damage',value:2},
  {id:'sharpEye',name:'Adlerblick',description:'Aufgeladene Präzisionspfeile +22 % Schaden',branch:true,requires:'focus',requiredLevel:2},
  {id:'evade',name:'Schattentritt',description:'Nach Dash: für 2,4 s erhöhte Krit-Chance',branch:true,requires:'agility',requiredLevel:2}],
 mage:[{id:'arcana',name:'Arkankunde',description:'+3 Schaden pro Stufe',stat:'damage',value:3},
  {id:'ward',name:'Schutzzauber',description:'+8 maximale LP pro Stufe',stat:'hp',value:8},
  {id:'siphon',name:'Seelenfluss',description:'+1.5% Lebensraub pro Stufe',stat:'leech',value:.015},
  {id:'ignite',name:'Glutmeister',description:'Magische Projektile entzünden Feinde',branch:true,requires:'arcana',requiredLevel:2},
  {id:'warding',name:'Arkaner Schutz',description:'Spezialzauber verleiht 13 Schild',branch:true,requires:'ward',requiredLevel:2}],
 glasscannon:[
  {id:'fracture',name:'Kristallbruch',description:'+4 Schaden je Stufe',stat:'damage',value:4},
  {id:'fragility',name:'Dünner Schleier',description:'+3 % Krit je Stufe',stat:'crit',value:.03},
  {id:'escape',name:'Gläserner Schritt',description:'+8 Tempo je Stufe',stat:'speed',value:8}],
 summoner:[
  {id:'bond',name:'Gefährtenbund',description:'+3 Schaden je Stufe',stat:'damage',value:3},
  {id:'spirit',name:'Seelenschutz',description:'+9 LP je Stufe',stat:'hp',value:9},
  {id:'command',name:'Anführer',description:'+5 Tempo je Stufe',stat:'speed',value:5}],
 alchemist:[
  {id:'mixture',name:'Reaktionslehre',description:'+3 Schaden je Stufe',stat:'damage',value:3},
  {id:'reflex',name:'Fluchtchemie',description:'+7 Tempo je Stufe',stat:'speed',value:7},
  {id:'resilience',name:'Destillierte Haut',description:'+7 LP je Stufe',stat:'hp',value:7}]
});
const STATS=['damage','hp','speed','crit','guard','leech'];
const zeros=()=>Object.fromEntries(STATS.map(k=>[k,0]));
export function itemStats(item){
 const output=zeros();if(!item)return output;
 for(const key of STATS)output[key]=(Number(item.stats?.[key])||0);
 return output;
}
export function generateItem(random,level=0,kind='warrior',guaranteedRare=false,bossLoot=false){
 const pool=ITEM_BASES.filter(i=>!i.classes||i.classes.includes(kind));
 const base=pool[Math.floor(random()*pool.length)];
 const roll=random()*100;
 const rarity=bossLoot?(roll<1.5?'mythic':roll<22?'legendary':roll<68?'epic':'rare'):
  guaranteedRare?(roll<14?'epic':'rare'):
  roll<6?'epic':roll<31?'rare':'common';
 const multiplier={common:1,rare:1.18,epic:1.38,legendary:1.55,mythic:1.72}[rarity];
 const bonus=1+Math.min(10,Math.max(0,level))*.045;
 const stats={};
 for(const key of STATS){
  if(base[key]===undefined)continue;
  const n=base[key]*multiplier*bonus;
  stats[key]=['crit','guard','leech'].includes(key)?Math.round(n*1000)/1000:Math.round(n);
 }
 const affix=rarity==='mythic'?['chain','dashNova','splash','shield','critHeal'][Math.floor(random()*5)]:rollAffix(random,rarity);
 const setId=rollSet(random,rarity);
 return {
  id:base.id+'-'+rarity+'-'+Math.floor(random()*1e9),
  baseId:base.id,slot:base.slot,kind,rarity,
  name:(rarity==='mythic'?'Mythischer ':setId?ITEM_SETS[setId].name+' · ':rarity==='legendary'?'Legendärer ':rarity==='epic'?'Verzauberter ':rarity==='rare'?'Alter ':'')+base.name,
  classes:base.classes,stats,affix,setId,
  level:Math.max(1,level+1)
 };
}
export function canEquip(item,kind){return !!item&&(!item.classes||item.classes.includes(kind))}
export function equipItem(player,item){
 if(!canEquip(item,player.kind)||!['weapon','armor','charm','amulet','ring1','ring2'].includes(item.slot))return false;
 if(!player.equipment)player.equipment={weapon:null,armor:null,charm:null,amulet:null,ring1:null,ring2:null};
 if(!player.inventory)player.inventory=[];
 if(!player.inventory.some(i=>i.id===item.id))return false;
 const old=player.equipment[item.slot],before=itemStats(old),after=itemStats(item);
 const hpBefore=player.maxHp;
 player.damage=Math.max(1,player.damage+after.damage-before.damage);
 player.speed=Math.max(70,player.speed+after.speed-before.speed);
 player.maxHp=Math.max(1,player.maxHp+after.hp-before.hp);
 player.hp=clamp(player.hp+Math.max(0,player.maxHp-hpBefore),1,player.maxHp);
 player.crit=clamp(player.crit+after.crit-before.crit,0,.8);
 player.guard=clamp(player.guard+after.guard-before.guard,0,.65);
 player.leech=clamp(player.leech+after.leech-before.leech,0,.5);
 player.equipment[item.slot]=item;return true;
}
export function describeStats(item){
 if(!item)return '';
 const map={damage:'Schaden',hp:'LP',speed:'Tempo',crit:'Krit',guard:'Schutz',leech:'Lebensraub'};
 const raw=Object.entries(itemStats(item)).filter(([k,v])=>v).map(([key,value])=>{
  const amount=['crit','guard','leech'].includes(key)?Math.round(value*1000)/10+'%':String(value);
  return (value>0?'+':'')+amount+' '+map[key];
 }).join(' · ');
 return raw+(item.affix&&AFFIXES[item.affix]?' · ✦ '+AFFIXES[item.affix].name+': '+AFFIXES[item.affix].description:'')+
  (item.setId&&ITEM_SETS[item.setId]?' · ◈ '+ITEM_SETS[item.setId].name+' – '+ITEM_SETS[item.setId].description:'');
}
export function talentCost(level,definition=null){return definition?.branch?240:65+level*65}
export function buyTalent(progress,kind,id){
 const definition=TALENTS[kind]?.find(t=>t.id===id);
 if(!definition)return false;
 progress.talents??={};
 progress.talents[kind]??={};
 const level=progress.talents[kind][id]||0;
 const max=definition.branch?1:3;
 if(level>=max||(definition.branch&&
  (progress.talents[kind][definition.requires]||0)<definition.requiredLevel))return false;
 const price=talentCost(level,definition);
 if(progress.gold<price)return false;
 progress.gold-=price;progress.talents[kind][id]=level+1;
 return true;
}
export function applyTalents(player,progress){
 player.masteries=[];
 for(const talent of TALENTS[player.kind]||[]){
  const level=Math.min(talent.branch?1:3,Math.max(0,progress.talents?.[player.kind]?.[talent.id]||0));
  if(talent.branch){if(level>0)player.masteries.push(talent.id);continue;}
  const bonus=talent.value*level;
  if(talent.stat==='hp'){player.maxHp+=bonus;player.hp+=bonus}
  else if(talent.stat==='damage')player.damage+=bonus;
  else if(talent.stat==='speed')player.speed+=bonus;
  else if(talent.stat==='crit')player.crit+=bonus;
  else if(talent.stat==='leech')player.leech+=bonus;
 }
}
