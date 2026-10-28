'use strict';
// Level select is deliberately two steps: world overview -> proper stage map.
// Locked stages can be inspected but not launched; score shown per selected class.
let menuView='worlds';
const WORLD_INFO={name:'Smaragdwald',subtitle:'Vom Sonnenpfad bis zum Thronsaal',
 description:'Vier eigenständige Abenteuer und der Schleimkönig.',
 badge:'WELT 1',theme:'forest'};
const WORLD_UPCOMING=[
 {name:'Frostgipfel',tag:'WELT 2',desc:'Eislandschaften · in Entwicklung'},
 {name:'Glutberge',tag:'WELT 3',desc:'Vulkanpfade · in Entwicklung'}
];
function worldBestTime(index,kind=save.class){
 const level='1-'+(index+1);
 const board=index===BOSS_LEVEL?save.bestTimesBossV09:save.bestTimesV10;
 return board?.[level]?.[kind]||0;
}
function worldTotalStars(){return save.stars.reduce((total,n)=>total+n,0);}
function renderWorldMenu(){
 if(selected>=save.unlocked)selected=save.unlocked-1;
 const isLevelMap=menuView==='levels';
 $('#heading').textContent=isLevelMap?'WELT 1 · SMARAGDWALD':'REALM RUNNERS';
 $('#intro').textContent=isLevelMap?
  'Wähle einen Abschnitt. Deine Bestzeiten stehen direkt bei den Leveln.':'Wähle eine Welt. Freigeschaltete Welten und deine Fortschritte sind hier gesammelt.';
 $('#classes').classList.toggle('hide',isLevelMap);
 $('#rpgPanels').classList.toggle('hide',isLevelMap);
 $('#worlds').classList.toggle('hide',isLevelMap);
 $('#levels').classList.toggle('hide',!isLevelMap);
 $('#worldMapInfo').classList.toggle('hide',!isLevelMap);
 $('#progress').textContent='Rang '+save.level+' · '+save.xp+'/'+(save.level*100)+' XP · '+worldTotalStars()+'/'+(stages.length*3)+' Sterne · '+save.gold+' Gold';
 $('#classes').innerHTML=Object.entries(classes).map(([id,c])=>
  '<button data-class="'+id+'" class="'+(save.class===id?'active':'')+'">'+({warrior:'[K]',hunter:'[J]',mage:'[M]'}[id])+' '+c.label+'</button>').join('');
 $('#classes').querySelectorAll('button').forEach(b=>b.onclick=()=>{save.class=b.dataset.class;persist();menu();});
 const worldCard='<button data-world="0" class="world-card world-open">'+
  '<span class="world-number">WELT 1 · VERFÜGBAR</span><strong>🌲 '+WORLD_INFO.name+'</strong>'+
  '<span>'+WORLD_INFO.subtitle+'</span><span>★ '+worldTotalStars()+'/'+(stages.length*3)+
  ' · '+save.unlocked+'/'+stages.length+' Level freigeschaltet</span>'+
  '<span class="world-enter">Welt öffnen →</span></button>';
 const upcoming=WORLD_UPCOMING.map(w=>'<div class="world-card world-locked" aria-disabled="true">'+
  '<span class="world-number">'+w.tag+' · GESPERRT</span><strong>🔒 '+w.name+'</strong><span>'+w.desc+'</span></div>').join('');
 $('#worlds').innerHTML=worldCard+upcoming;
 $('#worlds').querySelectorAll('[data-world="0"]').forEach(button=>button.onclick=()=>{menuView='levels';menu();});
 const cards=stages.map((stageInfo,i)=>{
  const locked=i>=save.unlocked,active=i===selected;
  const best=worldBestTime(i);
  const id='1-'+(i+1);
  const desc=stageInfo.hint||'Bossarena des Schleimkönigs · drei Angriffsmuster und Phase II.';
  const stars=save.stars[i]||0;
  const medals=best?medal(best,i):'—';
  return '<button data-level="'+i+'" class="level-card'+(active?' active':'')+(locked?' locked':'')+'"'+(locked?' disabled':'')+
   ' aria-label="Level '+id+', '+stageInfo.name+', '+(locked?'gesperrt':'freigeschaltet')+'">'+
   '<span class="level-card-head"><span>'+id+'</span><span>'+(locked?'🔒':stageInfo.difficulty||'★★★')+'</span></span>'+
   '<strong>'+(stageInfo.short||'Schleimkönig')+'</strong>'+
   '<span class="level-card-sub">'+desc+'</span>'+
   '<span class="level-card-meta"><span>★ '+stars+'/3</span><span>⏱ '+(best?formatRunTime(best):'--:--')+'</span></span>'+
   '<span class="level-card-medal">'+(locked?'NOCH GESPERRT':best?'BESTZEIT · '+medals:'NOCH KEINE ZEIT')+'</span>'+
  '</button>';
 }).join('');
 $('#levels').innerHTML=cards;
 $('#levels').querySelectorAll('button:not(:disabled)').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.level);menu();});
 const level=stages[selected],best=worldBestTime(selected);
 $('#worldMapInfo').innerHTML='<div class="world-selected"><span>AKTUELL AUSGEWÄHLT</span><strong>'+level.name+
  '</strong><p>'+(level.hint||'Besiege den Schleimkönig, um Welt 1 abzuschließen.')+'</p>'+
  '<span>'+classes[save.class].label+' · Bestzeit: '+(best?formatRunTime(best)+' · '+medal(best,selected):'noch keine')+'</span></div>';
 $('#play').classList.toggle('hide',!isLevelMap);
 $('#play').textContent='▶ '+stages[selected].short+' spielen';
 $('#play').onclick=()=>start(selected);
 $('#return').classList.toggle('hide',!isLevelMap);
 $('#return').textContent='← Alle Welten';
 $('#return').onclick=()=>{menuView='worlds';menu();};
 if(!isLevelMap)renderRpgMenu();
}
