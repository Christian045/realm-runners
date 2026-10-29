import { CLASSES } from './data.js';
import { TALENTS } from './loot.js';
export const SAVE_KEY='realm-runners-roguelite-v1';
export const OLD_SAVE_KEY='realm-runners-save-v2';
export function defaultProgress(){return {version:1,gold:0,runs:0,bestRooms:0,bossKills:0,selectedClass:'warrior',upgrades:{vitality:0,strength:0},talents:{warrior:{},hunter:{},mage:{}},itemsFound:0,eliteKills:0,deepestFloor:1,achievements:{}}}
export function normalizeProgress(value){
 const d=defaultProgress(),p=value&&typeof value==='object'?value:{};
 const num=(n,max=999999)=>Number.isFinite(+n)?Math.max(0,Math.min(max,Math.floor(+n))):0;
 const talents={};
 for(const [kind,choices] of Object.entries(TALENTS)){
  talents[kind]={};
  for(const choice of choices)talents[kind][choice.id]=num(p.talents?.[kind]?.[choice.id],3);
 }
 return {version:1,gold:num(p.gold),runs:num(p.runs),bestRooms:num(p.bestRooms,99),
  bossKills:num(p.bossKills),itemsFound:num(p.itemsFound),eliteKills:num(p.eliteKills),deepestFloor:Math.max(1,num(p.deepestFloor,999)),achievements:Object.fromEntries(Object.entries(p.achievements||{}).filter(([k,v])=>/^[a-zA-Z]+$/.test(k)&&v===true)),selectedClass:CLASSES[p.selectedClass]?p.selectedClass:'warrior',
  upgrades:{vitality:num(p.upgrades?.vitality,5),strength:num(p.upgrades?.strength,5)},talents};
}
export function loadProgress(storage=globalThis.localStorage){
 try{
  const saved=storage.getItem(SAVE_KEY);
  if(saved)return normalizeProgress(JSON.parse(saved));
  // Never change/delete the platformer's save. Import only class and an initial gold grant.
  const legacy=JSON.parse(storage.getItem(OLD_SAVE_KEY)||'null');
  const progress=defaultProgress();
  if(legacy&&typeof legacy==='object'){
   if(CLASSES[legacy.class])progress.selectedClass=legacy.class;
   progress.gold=Math.min(250,Math.max(0,Math.floor(Number(legacy.gold)||0)));
  }
  return progress;
 }catch{return defaultProgress()}
}
export function saveProgress(progress,storage=globalThis.localStorage){
 try{storage.setItem(SAVE_KEY,JSON.stringify(normalizeProgress(progress)));return true}catch{return false}
}
export function upgradeCost(progress,stat){return 40+progress.upgrades[stat]*45}
export function buyPermanent(progress,stat){
 if(!['vitality','strength'].includes(stat))return false;
 if(progress.upgrades[stat]>=5)return false;
 const cost=upgradeCost(progress,stat);
 if(progress.gold<cost)return false;
 progress.gold-=cost;progress.upgrades[stat]++;return true;
}
