// v0.16: Buildcraft is intentionally isolated from save, item and game modules.
// Only equipped pieces count. No passive procs can recursively trigger themselves.
export const ITEM_SETS=Object.freeze({
 ember:{name:'Glutbund',color:'#ffae7b',description:'2 Teile: Treffer entfachen Glut (2,5 s)'},
 tempest:{name:'Sturmpfad',color:'#a6e8c6',description:'2 Teile: Jeder vierte Treffer +25 % Schaden, Dash 16 % schneller bereit'},
 bastion:{name:'Eisenwacht',color:'#9dc9ed',description:'2 Teile: Ausweichen erzeugt 12 Schild'}
});
export const RUN_POWERS=Object.freeze({
 warrior:[
  {id:'shockwave',name:'Zerschmetterer',description:'Der dritte Schwerthieb trifft zusätzlich im vorderen Bereich'},
  {id:'fortress',name:'Standhaft',description:'Ausweichen verleiht 15 Schutzschild'}
 ],
 hunter:[
  {id:'trueshot',name:'Meisterschuss',description:'Aufgeladene Pfeile +30 % Schaden und +1 Durchschlag'},
  {id:'multishot',name:'Schnellköcher',description:'Jeder vierte normale Pfeil löst einen zusätzlichen Schuss aus'}
 ],
 mage:[
  {id:'wildfire',name:'Flammenzeichen',description:'Magische Treffer entzünden Feinde für 3,5 Sekunden'},
  {id:'arcaneBloom',name:'Arkane Welle',description:'Der Spezialzauber verursacht einen zusätzlichen äußeren Treffer'}
 ]
});
export function setPieces(player,setId){
 return Object.values(player?.equipment||{}).filter(item=>item?.setId===setId).length;
}
export const hasSet=(player,id)=>setPieces(player,id)>=2;
export function rollSet(random,rarity){
 const chance={common:0,rare:.30,epic:.60,legendary:1}[rarity]||0;
 if(random()>=chance)return null;
 const ids=Object.keys(ITEM_SETS);
 return ids[Math.floor(random()*ids.length)];
}
export function hasRunPower(player,id){return !!player?.upgradeIds?.includes(id)}
export function pickRunUpgrades(random,kind,owned=[]){
 const pool=(RUN_POWERS[kind]||[]).filter(p=>!owned.includes(p.id));
 if(!pool.length)return [];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 return pool;
}
export function onBuildDash(game){
 const p=game.player;
 const shield=(hasSet(p,'bastion')?12:0)+(hasRunPower(p,'fortress')?15:0);
 if(shield){
  p.shield=Math.max(p.shield||0,Math.min(30,shield));
  game.createEffect('ring',p.x,p.y,'#a7d9ff',.36,36);
 }
 if(p.masteries?.includes('evade'))p.evadeEmpower=2.4;
}
export function onBuildHurt(game,actual){
 const p=game.player;
 if(actual>0&&p.masteries?.includes('counter'))p.counterReady=5;
}
export function onBuildHit(game,e,opts={}){
 if(!opts.proc)return;
 const p=game.player;
 if(hasSet(p,'ember'))e.burn=Math.max(e.burn||0,2.5);
 if((hasRunPower(p,'wildfire')||p.masteries?.includes('ignite'))&&opts.magic)
  e.burn=Math.max(e.burn||0,hasRunPower(p,'wildfire')?3.5:3);
}
export function buildDamageFactor(player,opts={}){
 let result=1;
 if(hasSet(player,'tempest')&&(player.hitCount||0)%4===3)result*=1.25;
 if(player.kind==='warrior'&&(player.counterReady||0)>0&&opts.melee)result*=1.35;
 if(player.kind==='hunter'&&opts.charged){
  if(hasRunPower(player,'trueshot'))result*=1.30;
  if(player.masteries?.includes('sharpEye'))result*=1.22;
 }
 return result;
}
