export const SPECIALIZATIONS=Object.freeze({
 warrior:[
  {id:'standard',name:'Krieger',description:'Ausgewogene Werte · jederzeit spielbar'},
  {id:'bulwark',name:'Bollwerk',description:'+30 LP, +8 % Schutz, etwas langsamer',unlock:'runs'},
  {id:'berserker',name:'Berserker',description:'+20 % Schaden, schnellere Hiebe, -20 LP',unlock:'boss'}
 ],
 hunter:[
  {id:'standard',name:'Jäger',description:'Ausgewogene Werte · jederzeit spielbar'},
  {id:'marksman',name:'Scharfschütze',description:'+12 % Krit, +15 % Schaden, geringeres Tempo',unlock:'boss'},
  {id:'ranger',name:'Spurenleser',description:'+25 Tempo und kürzerer Dash-Cooldown',unlock:'runs'}
 ],
 mage:[
  {id:'standard',name:'Magier',description:'Ausgewogene Werte · jederzeit spielbar'},
  {id:'pyromancer',name:'Pyromant',description:'Magische Treffer entzünden Feinde, +10 % Schaden',unlock:'boss'},
  {id:'arcanist',name:'Arkanist',description:'Schnellere Angriffe und kürzerer Spezialfähigkeits-Cooldown',unlock:'runs'}
 ]
});
export function specializationUnlocked(progress,id){
 if(id==='standard')return true;
 const definition=Object.values(SPECIALIZATIONS).flat().find(x=>x.id===id);
 if(!definition)return false;
 return definition.unlock==='boss'?(progress.bossKills||0)>=1:(progress.runs||0)>=2;
}
export function validSpecialization(kind,id){
 return !!SPECIALIZATIONS[kind]?.some(x=>x.id===id);
}
export function applySpecialization(player,id){
 player.specialization=validSpecialization(player.kind,id)?id:'standard';
 switch(player.specialization){
  case 'bulwark':player.maxHp+=30;player.hp+=30;player.guard=Math.min(.65,player.guard+.08);player.speed-=10;break;
  case 'berserker':player.maxHp=Math.max(25,player.maxHp-20);player.hp=Math.min(player.hp,player.maxHp);player.damage*=1.2;player.attackDelay*=.9;break;
  case 'marksman':player.crit=Math.min(.8,player.crit+.12);player.damage*=1.15;player.speed-=12;break;
  case 'ranger':player.speed+=25;break;
  case 'pyromancer':player.damage*=1.1;break;
  case 'arcanist':player.attackDelay*=.82;break;
 }
}
