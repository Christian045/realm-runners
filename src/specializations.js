export const SPECIALIZATIONS=Object.freeze({
 warrior:[
  {id:'standard',name:'Krieger',description:'Ausgewogene Werte · jederzeit spielbar'},
  {id:'bulwark',name:'Bollwerk',description:'+30 LP, +8 % Schutz, etwas langsamer',unlock:'runs'},
  {id:'berserker',name:'Berserker',description:'+20 % Schaden, schnellere Hiebe, -20 LP',unlock:'boss'}
 ],
 hunter:[
  {id:'standard',name:'Waldläufer',description:'Robin-Hood-Bogen · präzise Pfeile und Fernkampf'},
  {id:'marksman',name:'Armbrustschütze',description:'Langsame starke Durchschlagsbolzen, Präzision',unlock:'boss'},
  {id:'ranger',name:'Schattenjäger',description:'Kurzbogen und Dolchkombo im Nahkampf, schneller Dash',unlock:'runs'}
 ],
 mage:[
  {id:'standard',name:'Arkanmagier',description:'Magische Kettenkugeln und Arkanschlag'},
  {id:'pyromancer',name:'Feuermagier',description:'Verbrennung, Feuerfächer und Flammenexplosion',unlock:'boss'},
  {id:'cryomancer',name:'Eismagier',description:'Frostsplitter, Verlangsamung und Eisexplosion',unlock:'runs'}
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
  case 'marksman':player.crit=Math.min(.8,player.crit+.08);player.damage*=1.32;player.attackDelay*=1.35;player.speed-=10;break;
  case 'ranger':player.speed+=22;player.attackDelay*=.88;break;
  case 'pyromancer':player.damage*=1.1;break;
  case 'cryomancer':player.damage*=.93;player.attackDelay*=1.03;break;
 }
}
