import {ENEMY_DATA} from './data.js';

export const ENEMY_NAMES=Object.freeze({
 slime:'Schleim',mushroom:'Pilzling',archer:'Skelettschütze',
 goblin:'Goblin',wraith:'Geist',sentinel:'Wächter',
 cultist:'Kultist',brute:'Schläger',assassin:'Schattenläufer',
 scout:'Knochenjäger',hexer:'Runenwirker',bulwark:'Schildwache',
 boss:'Boss'
});
const finite=(value,max=1e12)=>{
 const n=Number(value);
 return Number.isFinite(n)?Math.min(max,Math.max(0,n)):0;
};
const integer=(value,max=1e9)=>Math.floor(finite(value,max));
const name=(value,max=70)=>String(value||'').slice(0,max);
const validEnemyTypes=Object.keys(ENEMY_DATA);
const emptyKills=()=>Object.fromEntries(validEnemyTypes.map(key=>[key,0]));
const validClasses=new Set(['warrior','hunter','mage','glasscannon','summoner','alchemist']);
const validModes=new Set(['Dungeon','Endlos','Turm']);
export const STATS_HISTORY_LIMIT=12;
export function defaultStatistics(){
 return {playTime:0,deaths:0,victories:0,damageDealt:0,damageTaken:0,
  kills:emptyKills(),bosses:{},classRuns:{warrior:0,hunter:0,mage:0,glasscannon:0,summoner:0,alchemist:0},
  recentRuns:[]};
}
export function newRunStatistics(kind='warrior',mode='Dungeon'){
 return {classKind:validClasses.has(kind)?kind:'warrior',
  mode:validModes.has(mode)?mode:'Dungeon',
  kills:0,bosses:0,damageDealt:0,damageTaken:0};
}
export function normalizeStatistics(input){
 const raw=input&&typeof input==='object'?input:{};
 const result=defaultStatistics();
 for(const field of ['playTime','damageDealt','damageTaken'])
  result[field]=finite(raw[field]);
 for(const field of ['deaths','victories'])result[field]=integer(raw[field]);
 for(const type of validEnemyTypes)result.kills[type]=integer(raw.kills?.[type]);
 for(const kind of validClasses)result.classRuns[kind]=integer(raw.classRuns?.[kind]);
 if(raw.bosses&&typeof raw.bosses==='object'){
  for(const [key,count] of Object.entries(raw.bosses).slice(0,60)){
   const label=name(key,48);
   if(label&&label!=='__proto__'&&label!=='constructor'&&label!=='prototype')
    Object.defineProperty(result.bosses,label,{value:integer(count),enumerable:true,writable:true,configurable:true});
  }
 }
 if(Array.isArray(raw.recentRuns)){
  result.recentRuns=raw.recentRuns.slice(0,STATS_HISTORY_LIMIT).map(entry=>{
   const item=entry&&typeof entry==='object'?entry:{};
   return {
    won:item.won===true,
    classKind:validClasses.has(item.classKind)?item.classKind:'warrior',
    mode:validModes.has(item.mode)?item.mode:'Dungeon',
    seconds:finite(item.seconds,864000),
    floor:integer(item.floor,9999),
    rooms:integer(item.rooms,9999),
    kills:integer(item.kills),
    bosses:integer(item.bosses),
    damageDealt:integer(item.damageDealt),
    damageTaken:integer(item.damageTaken),
    date:integer(item.date,4102444800000)
   };
  });
 }
 return result;
}
export function recordEnemyKill(stats,run,type,bossName){
 if(!validEnemyTypes.includes(type))return false;
 stats.kills[type]=(stats.kills[type]||0)+1;
 if(run)run.kills++;
 if(type==='boss'){
  const label=name(bossName||'Unbekannter Boss',48);
  if(!Object.prototype.hasOwnProperty.call(stats.bosses,label))stats.bosses[label]=0;
  stats.bosses[label]++;
  if(run)run.bosses++;
 }
 return true;
}
export function recordDamage(stats,run,amount,direction){
 const value=finite(amount,1e9);
 if(value<=0)return;
 const key=direction==='taken'?'damageTaken':'damageDealt';
 stats[key]+=value;
 if(run)run[key]+=value;
}
export function finishRunStatistics(stats,run,won,seconds,floor,rooms,date=Date.now()){
 if(!run)return null;
 const record={
  won:!!won,classKind:run.classKind,mode:run.mode,
  seconds:finite(seconds,864000),floor:integer(floor,9999),
  rooms:integer(rooms,9999),kills:integer(run.kills),
  bosses:integer(run.bosses),damageDealt:Math.round(run.damageDealt),
  damageTaken:Math.round(run.damageTaken),date:integer(date,4102444800000)
 };
 if(won)stats.victories++;else stats.deaths++;
 stats.classRuns[record.classKind]++;
 stats.recentRuns.unshift(record);
 stats.recentRuns.length=Math.min(STATS_HISTORY_LIMIT,stats.recentRuns.length);
 return record;
}
export function formatPlayTime(seconds){
 const time=Math.max(0,Math.floor(finite(seconds)));
 const hours=Math.floor(time/3600),mins=Math.floor(time%3600/60),secs=time%60;
 return hours?hours+' Std. '+String(mins).padStart(2,'0')+' Min.':
  mins?mins+' Min. '+String(secs).padStart(2,'0')+' Sek.':secs+' Sek.';
}
export function totalKills(stats){
 return validEnemyTypes.reduce((total,key)=>total+Number(stats?.kills?.[key]||0),0);
}
