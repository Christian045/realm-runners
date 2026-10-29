export const CHALLENGES=Object.freeze({
 normal:{name:'Abenteuer',description:'Die normale Dungeonreise',unlock:'Immer verfügbar',multiplier:1},
 frenzy:{name:'Horde',description:'Mehr Feinde in jeder Kampfkammer',unlock:'Nach 2 Runs',multiplier:1.25},
 glass:{name:'Glasklinge',description:'-25 % Lebenspunkte, +25 % Schaden',unlock:'Nach 1 Boss-Sieg',multiplier:1.4},
 nightmare:{name:'Albtraum',description:'Gegner sind 35 % schneller und stärker',unlock:'Nach 3 Boss-Siegen',multiplier:1.65}
});
export const ACHIEVEMENTS=Object.freeze([
 {id:'firstRun',name:'Erster Abstieg',description:'Schließe einen Run ab',reward:30,metric:'runs',target:1},
 {id:'veteran',name:'Unerschrocken',description:'Spiele fünf Runs',reward:75,metric:'runs',target:5},
 {id:'slayer',name:'Königstöter',description:'Besiege erstmals einen Boss',reward:100,metric:'bossKills',target:1},
 {id:'hunter',name:'Dungeonmeister',description:'Besiege drei Bosse',reward:150,metric:'bossKills',target:3},
 {id:'relics',name:'Sammler',description:'Finde zehn Ausrüstungsstücke',reward:90,metric:'itemsFound',target:10},
 {id:'elites',name:'Elitejäger',description:'Besiege fünf Elitegegner',reward:100,metric:'eliteKills',target:5},
 {id:'deep',name:'Tiefenwanderer',description:'Erreiche im Endlosmodus Etage 3',reward:170,metric:'deepestFloor',target:3}
]);
export function challengeUnlocked(progress,id){
 if(id==='normal')return true;
 if(id==='frenzy')return progress.runs>=2;
 if(id==='glass')return progress.bossKills>=1;
 if(id==='nightmare')return progress.bossKills>=3;
 return false;
}
export function applyRunChallenge(game,id){
 const p=game.player;
 if(id==='glass'){p.maxHp=Math.max(25,Math.round(p.maxHp*.75));p.hp=p.maxHp;p.damage*=1.25}
}
export function challengeScale(game){
 return game.runMode==='nightmare'?1.35:1;
}
export function enemyExtraCount(game){
 return game.runMode==='frenzy'?2:0;
}
export function awardAchievements(progress){
 const awarded=[];
 progress.achievements??={};
 for(const a of ACHIEVEMENTS){
  if(progress.achievements[a.id]||Number(progress[a.metric]||0)<a.target)continue;
  progress.achievements[a.id]=true;
  progress.gold+=a.reward;awarded.push(a);
 }
 return awarded;
}
export function challengeReward(amount,id){
 return Math.round(amount*(CHALLENGES[id]?.multiplier||1));
}
